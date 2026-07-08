import {
  clearOAuthRequest,
  clearTokens,
  readOAuthRequest,
  readTokens,
  saveOAuthRequest,
  saveTokens,
  type AuthTokens,
} from "./storage";
import {
  getCurrentKeycloakAuthUrl,
  getCurrentKeycloakTokenUrl,
  getCurrentKeycloakLogoutUrl,
  getRedirectUri,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_PASSWORD_CLIENT_ID,
} from "./config";

type TokenResponse = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

type OAuthProvider = {
  idpHint: string;
  prompt?: string;
  name: string;
  googleLanguage?: true;
};

const accessTokenRefreshMarginMs = 60_000;

let refreshPromise: Promise<AuthTokens | undefined> | undefined;

function assertConfiguredUrl(url: string, label: string) {
  try {
    const parsed = new URL(url);
    const isHttpUrl = parsed.protocol === "http:" || parsed.protocol === "https:";

    if (!isHttpUrl) {
      throw new Error(`${label} hat ein ungültiges Protokoll.`);
    }

    if (!parsed.hostname || parsed.hostname.toLowerCase() === "undefined") {
      throw new Error(`${label} missing host`);
    }
  } catch {
    throw new Error(`${label} ist ungültig.`);
  }
}

function createValidatedProviderLoginUrl(url: string, params: URLSearchParams) {
  try {
    const parsed = new URL(url);
    assertConfiguredUrl(url, "Keycloak-Auth-URL");

    parsed.search = params.toString();
    return parsed.toString();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Keycloak-Auth-URL ist ungültig.");
    }

    throw error;
  }
}

function assertConfiguredPath(value: string, label: string) {
  if (!value) {
    throw new Error(`${label} ist nicht konfiguriert.`);
  }

  if (value[0] !== "/" && !/^https?:\/\//i.test(value)) {
    throw new Error(`${label} ist ungültig.`);
  }
}

function createRandomString(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function base64UrlEncode(bytes: Uint8Array) {
  let value = "";

  for (const byte of bytes) {
    value += String.fromCharCode(byte);
  }

  return btoa(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const paddedValue = value.padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    "=",
  );
  const normalizedValue = paddedValue.replace(/-/g, "+").replace(/_/g, "/");

  return decodeURIComponent(
    Array.from(atob(normalizedValue))
      .map((character) => {
        return `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`;
      })
      .join(""),
  );
}

function getTokenPayload(token?: string) {
  try {
    const [, payload] = token?.split(".") ?? [];

    if (!payload) {
      return undefined;
    }

    return JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function getTokenExp(token?: string) {
  const payload = getTokenPayload(token);
  const tokenExp = payload?.["exp"];
  const exp = typeof tokenExp === "number" ? tokenExp : undefined;

  if (exp === undefined) {
    return undefined;
  }

  return exp * 1000;
}

export function getAccessTokenIssuer(accessToken: string) {
  try {
    const [, payload] = accessToken.split(".");

    if (!payload) {
      return undefined;
    }

    const parsedPayload = JSON.parse(base64UrlDecode(payload)) as {
      iss?: unknown;
    };

    return typeof parsedPayload.iss === "string" ? parsedPayload.iss : undefined;
  } catch {
    return undefined;
  }
}

export function assertAccessTokenIssuer(accessToken: string) {
  const issuer = getAccessTokenIssuer(accessToken);

  if (!issuer || !issuer.includes("/realms/mira")) {
    throw new Error(
      `Invalid token issuer. Expected Keycloak realm 'mira', got ${issuer ?? "unknown"}.`,
    );
  }
}

async function createCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function toAuthTokens(
  tokenResponse: TokenResponse,
  clientId: string,
  fallbackRefreshToken?: string,
  fallbackIdToken?: string,
): AuthTokens {
  assertAccessTokenIssuer(tokenResponse.access_token);

  return {
    accessToken: tokenResponse.access_token,
    clientId,
    idToken: tokenResponse.id_token ?? fallbackIdToken,
    refreshToken: tokenResponse.refresh_token ?? fallbackRefreshToken,
    expiresAt: tokenResponse.expires_in
      ? Date.now() + tokenResponse.expires_in * 1000
      : undefined,
  };
}

async function requestToken(
  body: URLSearchParams,
  clientId: string,
  fallbackRefreshToken?: string,
  fallbackIdToken?: string,
) {
  const tokenUrl = getCurrentKeycloakTokenUrl();

  assertConfiguredUrl(tokenUrl, "Keycloak-Token-URL");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const responseText = await response.text();
  const parsedResponse =
    responseText.length > 0
      ? (JSON.parse(responseText) as
          | Partial<TokenResponse>
          & {
            error?: string;
            error_description?: string;
          })
      : {};

  if (!response.ok || !parsedResponse.access_token) {
    throw new Error(
      parsedResponse.error_description ??
        parsedResponse.error ??
        "Login failed.",
    );
  }

  return toAuthTokens(
    parsedResponse as TokenResponse,
    clientId,
    fallbackRefreshToken,
    fallbackIdToken,
  );
}

function mapOAuthProvider(provider: OAuthProvider) {
  const state = createRandomString(24);
  const codeVerifier = createRandomString(64);
  return { provider, state, codeVerifier };
}

async function startProviderLogin(provider: OAuthProvider) {
  const { state, codeVerifier } = mapOAuthProvider(provider);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const redirectUri = getRedirectUri();
  const searchParams = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    kc_idp_hint: provider.idpHint,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
  });

  if (provider.prompt) {
    searchParams.set("prompt", provider.prompt);
  }

  if (provider.googleLanguage) {
    searchParams.set("hl", "en");
  }

  const authUrl = getCurrentKeycloakAuthUrl();

  assertConfiguredUrl(authUrl, "Keycloak-Auth-URL");
  assertConfiguredPath(redirectUri, "Redirect-URI");
  saveOAuthRequest(state, codeVerifier, redirectUri);

  window.location.assign(createValidatedProviderLoginUrl(authUrl, searchParams));
}

export function startGoogleLogin() {
  return startProviderLogin({
    googleLanguage: true,
    idpHint: "google",
    name: "Google",
    prompt: "select_account",
  });
}

export function startGithubLogin() {
  return startProviderLogin({
    idpHint: "github",
    name: "GitHub",
    prompt: "select_account",
  });
}

export function startDiscordLogin() {
  return startProviderLogin({
    idpHint: "discord",
    name: "Discord",
  });
}

function shouldRefreshAccessToken(tokens: AuthTokens) {
  return Boolean(
    tokens.refreshToken &&
      tokens.expiresAt &&
      tokens.expiresAt - accessTokenRefreshMarginMs <= Date.now(),
  );
}

async function refreshStoredAccessToken(tokens: AuthTokens) {
  if (refreshPromise) {
    return refreshPromise;
  }

  const clientIds = tokens.clientId
    ? [tokens.clientId]
    : [KEYCLOAK_CLIENT_ID, KEYCLOAK_PASSWORD_CLIENT_ID];

  refreshPromise = (async () => {
    if (!tokens.refreshToken) {
      return undefined;
    }

    for (const clientId of clientIds) {
      try {
        const refreshedTokens = await requestToken(
          new URLSearchParams({
            client_id: clientId,
            grant_type: "refresh_token",
            refresh_token: tokens.refreshToken,
          }),
          clientId,
          tokens.refreshToken,
          tokens.idToken,
        );

        saveTokens(refreshedTokens);
        return refreshedTokens;
      } catch {
        // try next client id
      }
    }

    clearTokens();
    return undefined;
  })().finally(() => {
    refreshPromise = undefined;
  });

  return refreshPromise;
}

export async function getValidAccessToken() {
  const tokens = readTokens();

  if (!tokens?.accessToken) {
    return undefined;
  }

  assertAccessTokenIssuer(tokens.accessToken);

  if (!shouldRefreshAccessToken(tokens)) {
    return tokens.accessToken;
  }

  const refreshedTokens = await refreshStoredAccessToken(tokens);
  return refreshedTokens?.accessToken ?? tokens.accessToken;
}

export function completeRedirectLogin(callbackUrl?: string) {
  const url = new URL(callbackUrl ?? window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (error) {
    clearOAuthRequest();
    if (!callbackUrl) {
      window.history.replaceState({}, document.title, getRedirectUri());
    }

    throw new Error(error);
  }

  if (!code || !state) {
    return undefined;
  }

  const savedRequest = readOAuthRequest();

  if (state !== savedRequest.state || !savedRequest.codeVerifier) {
    clearOAuthRequest();
    if (!callbackUrl) {
      window.history.replaceState({}, document.title, getRedirectUri());
    }

    throw new Error("OAuth response could not be validated.");
  }

  const redirectUri = savedRequest.redirectUri ?? getRedirectUri();
  return requestToken(
    new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      code,
      code_verifier: savedRequest.codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
    KEYCLOAK_CLIENT_ID,
  ).then((tokens) => {
    clearOAuthRequest();
    if (!callbackUrl) {
      window.history.replaceState({}, document.title, redirectUri);
    }

    return tokens;
  });
}

export function loginWithPassword(username: string, password: string) {
  return requestToken(
    new URLSearchParams({
      client_id: KEYCLOAK_PASSWORD_CLIENT_ID,
      grant_type: "password",
      password,
      scope: "openid email profile",
      username,
    }),
    KEYCLOAK_PASSWORD_CLIENT_ID,
  );
}

async function getLogoutIdToken() {
  const tokens = readTokens();

  if (!tokens?.accessToken) {
    return undefined;
  }

  if (tokens.idToken) {
    const idTokenExpiration = getTokenExp(tokens.idToken);

    if (idTokenExpiration === undefined || idTokenExpiration > Date.now()) {
      return tokens.idToken;
    }

    const refreshedTokens = await refreshStoredAccessToken(tokens);
    return refreshedTokens?.idToken;
  }

  const refreshedTokens = await refreshStoredAccessToken(tokens);
  return refreshedTokens?.idToken;
}

export async function startKeycloakLogout() {
  const idToken = await getLogoutIdToken();
  const logoutUrl = getCurrentKeycloakLogoutUrl(idToken);
  assertConfiguredUrl(logoutUrl, "Keycloak-Logout-URL");

  window.location.assign(logoutUrl);
}

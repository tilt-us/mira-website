const AUTH_STATE_KEY = "mira.auth.state";
const AUTH_CODE_VERIFIER_KEY = "mira.auth.codeVerifier";
const AUTH_REDIRECT_URI_KEY = "mira.auth.redirectUri";
const AUTH_TOKENS_KEY = "mira.auth.tokens";

export type AuthTokens = {
  accessToken: string;
  clientId?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

type OAuthRequestState = {
  state: string | null;
  codeVerifier: string | null;
  redirectUri: string | null;
};

export function applyAuthStorageRuntimeConfig() {
  // Placeholder for future runtime overrides in the website build.
}

export function saveOAuthRequest(state: string, codeVerifier: string, redirectUri?: string) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(AUTH_STATE_KEY, state);
  sessionStorage.setItem(AUTH_CODE_VERIFIER_KEY, codeVerifier);

  if (redirectUri) {
    sessionStorage.setItem(AUTH_REDIRECT_URI_KEY, redirectUri);
  } else {
    sessionStorage.removeItem(AUTH_REDIRECT_URI_KEY);
  }
}

export function readOAuthRequest(): OAuthRequestState {
  if (typeof window === "undefined") {
    return {
      codeVerifier: null,
      redirectUri: null,
      state: null,
    };
  }

  return {
    state: sessionStorage.getItem(AUTH_STATE_KEY),
    codeVerifier: sessionStorage.getItem(AUTH_CODE_VERIFIER_KEY),
    redirectUri: sessionStorage.getItem(AUTH_REDIRECT_URI_KEY),
  };
}

export function clearOAuthRequest() {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(AUTH_STATE_KEY);
  sessionStorage.removeItem(AUTH_CODE_VERIFIER_KEY);
  sessionStorage.removeItem(AUTH_REDIRECT_URI_KEY);
}

export function saveTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify(tokens));
}

export function readTokens(): AuthTokens | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const rawTokens = localStorage.getItem(AUTH_TOKENS_KEY);

  if (!rawTokens) {
    return undefined;
  }

  try {
    return JSON.parse(rawTokens) as AuthTokens;
  } catch {
    localStorage.removeItem(AUTH_TOKENS_KEY);
    return undefined;
  }
}

export function clearTokens() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_TOKENS_KEY);
}

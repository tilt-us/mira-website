export type KeycloakRuntimeConfig = {
  keycloakBaseUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
  keycloakPasswordClientId?: string;
};

const LOCAL_KEYCLOAK_BASE_URL = "http://localhost:8081";
const LOCAL_KEYCLOAK_CLIENT_ID = "mira-bevy";
const LOCAL_KEYCLOAK_PASSWORD_CLIENT_ID = "mira-e2e";

function normalizeKeycloakBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new Error('Keycloak base URL is required.');
  }

  try {
    const normalized = new URL(trimmed);
    if (!normalized.protocol || !normalized.host) {
      throw new Error('missing protocol or host');
    }
    return normalized.toString().replace(/\/$/, "");
  } catch {
    throw new Error('Keycloak base URL must be an absolute URL.');
  }
}

export let KEYCLOAK_BASE_URL = LOCAL_KEYCLOAK_BASE_URL;
export let KEYCLOAK_REALM = "mira";
export let KEYCLOAK_CLIENT_ID = LOCAL_KEYCLOAK_CLIENT_ID;
export let KEYCLOAK_PASSWORD_CLIENT_ID = LOCAL_KEYCLOAK_PASSWORD_CLIENT_ID;

export let KEYCLOAK_ISSUER_URL = getKeycloakIssuerUrl();

export let KEYCLOAK_AUTH_URL = getKeycloakAuthUrl();
export let KEYCLOAK_TOKEN_URL = getKeycloakTokenUrl();

export function getCurrentKeycloakBaseUrl() {
  return KEYCLOAK_BASE_URL;
}

function getCurrentKeycloakIssuerUrlValue() {
  return `${getCurrentKeycloakBaseUrl()}/realms/${KEYCLOAK_REALM}`;
}

export function getCurrentKeycloakIssuerUrl() {
  return getCurrentKeycloakIssuerUrlValue();
}

function getBrowserRedirectUri() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.origin;
}

function getBrowserPostLogoutRedirectUri() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}/`;
}

export function getRedirectUri() {
  return getBrowserRedirectUri();
}

function getKeycloakAuthUrl() {
  return `${getCurrentKeycloakIssuerUrlValue()}/protocol/openid-connect/auth`;
}

export function getCurrentKeycloakAuthUrl() {
  return getKeycloakAuthUrl();
}

function getKeycloakIssuerUrl() {
  return getCurrentKeycloakIssuerUrlValue();
}

function getKeycloakTokenUrl() {
  return `${getCurrentKeycloakIssuerUrl()}/protocol/openid-connect/token`;
}

export function getCurrentKeycloakTokenUrl() {
  return getKeycloakTokenUrl();
}

function getKeycloakLogoutUrl() {
  return `${getCurrentKeycloakIssuerUrl()}/protocol/openid-connect/logout`;
}

export function getCurrentKeycloakLogoutUrl(idToken?: string) {
  const searchParams = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    post_logout_redirect_uri: getBrowserPostLogoutRedirectUri(),
  });

  if (idToken) {
    searchParams.set("id_token_hint", idToken);
  }

  return `${getKeycloakLogoutUrl()}?${searchParams.toString()}`;
}

export function applyKeycloakRuntimeConfig(config: KeycloakRuntimeConfig) {
  if (!config.keycloakBaseUrl || !config.keycloakRealm || !config.keycloakClientId || !config.keycloakPasswordClientId) {
    throw new Error('Complete Keycloak runtime configuration is required.');
  }

  KEYCLOAK_BASE_URL = normalizeKeycloakBaseUrl(config.keycloakBaseUrl);
  KEYCLOAK_REALM = config.keycloakRealm ?? KEYCLOAK_REALM;
  KEYCLOAK_CLIENT_ID = config.keycloakClientId ?? KEYCLOAK_CLIENT_ID;
  KEYCLOAK_PASSWORD_CLIENT_ID =
    config.keycloakPasswordClientId ?? KEYCLOAK_PASSWORD_CLIENT_ID;
  KEYCLOAK_ISSUER_URL = getKeycloakIssuerUrl();
  KEYCLOAK_AUTH_URL = getKeycloakAuthUrl();
  KEYCLOAK_TOKEN_URL = getKeycloakTokenUrl();
}

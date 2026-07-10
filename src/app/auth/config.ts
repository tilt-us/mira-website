import { API_CLIENT_MODE } from "../api-runtime.config";

export type KeycloakRuntimeConfig = {
  keycloakBaseUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
  keycloakPasswordClientId?: string;
};

const LOCAL_KEYCLOAK_BASE_URL = "http://localhost:8081";
const DEV_KEYCLOAK_BASE_URL =
  `${typeof window === "undefined" ? "https:" : window.location.protocol}//api.tilt-us.com/keycloak`;
const LOCAL_KEYCLOAK_CLIENT_ID = "mira-bevy";
const LOCAL_KEYCLOAK_PASSWORD_CLIENT_ID = "mira-e2e";
const DEV_KEYCLOAK_CLIENT_ID = "mira-web";
// LOCAL TESTING ONLY - do not commit: mira-web forbids direct access grants.
const DEV_KEYCLOAK_PASSWORD_CLIENT_ID = "mira-e2e";

function isLocalHost() {
  const host =
    typeof window === "undefined" ? "localhost" : window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function resolveKeycloakClientMode() {
  // LOCAL TESTING ONLY - do not commit: use the dev Keycloak from localhost too.
  return API_CLIENT_MODE === "local" && isLocalHost() ? "local" : "dev";
}

function getDefaultKeycloakBaseUrl() {
  return resolveKeycloakClientMode() === "local"
    ? LOCAL_KEYCLOAK_BASE_URL
    : DEV_KEYCLOAK_BASE_URL;
}

function normalizeKeycloakBaseUrl(baseUrl?: string | null) {
  const fallback = getDefaultKeycloakBaseUrl();
  const trimmed = typeof baseUrl === "string" ? baseUrl.trim() : "";

  if (!trimmed || trimmed.toLowerCase() === "undefined") {
    return fallback;
  }

  try {
    const normalized = new URL(trimmed);

    if (normalized.hostname.toLowerCase() === "undefined") {
      return fallback;
    }

    if (normalized.hostname === "127.0.0.1") {
      normalized.hostname = "localhost";
    }

    return normalized.toString().replace(/\/$/, "");
  } catch {
    if (!trimmed.includes("://")) {
      return fallback;
    }

    return trimmed.replace("127.0.0.1", "localhost").replace(/\/$/, "");
  }
}

export let KEYCLOAK_BASE_URL = normalizeKeycloakBaseUrl(getDefaultKeycloakBaseUrl());
export let KEYCLOAK_REALM = "mira";
export let KEYCLOAK_CLIENT_ID =
  resolveKeycloakClientMode() === "local" ? LOCAL_KEYCLOAK_CLIENT_ID : DEV_KEYCLOAK_CLIENT_ID;
export let KEYCLOAK_PASSWORD_CLIENT_ID =
  resolveKeycloakClientMode() === "local"
    ? LOCAL_KEYCLOAK_PASSWORD_CLIENT_ID
    : DEV_KEYCLOAK_PASSWORD_CLIENT_ID;

export let KEYCLOAK_ISSUER_URL = getKeycloakIssuerUrl();

export let KEYCLOAK_AUTH_URL = getKeycloakAuthUrl();
export let KEYCLOAK_TOKEN_URL = getKeycloakTokenUrl();

export function getCurrentKeycloakBaseUrl() {
  return normalizeKeycloakBaseUrl(KEYCLOAK_BASE_URL);
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
  KEYCLOAK_BASE_URL = normalizeKeycloakBaseUrl(config.keycloakBaseUrl ?? KEYCLOAK_BASE_URL);
  KEYCLOAK_REALM = config.keycloakRealm ?? KEYCLOAK_REALM;
  KEYCLOAK_CLIENT_ID = config.keycloakClientId ?? KEYCLOAK_CLIENT_ID;
  KEYCLOAK_PASSWORD_CLIENT_ID =
    config.keycloakPasswordClientId ?? KEYCLOAK_PASSWORD_CLIENT_ID;
  KEYCLOAK_ISSUER_URL = getKeycloakIssuerUrl();
  KEYCLOAK_AUTH_URL = getKeycloakAuthUrl();
  KEYCLOAK_TOKEN_URL = getKeycloakTokenUrl();
}

import { client } from "../api/client.gen";
import { API_CLIENT_MODE } from "./api-runtime.config";

const LOCAL_API_BASE_URL = "http://localhost:8080";
const DEV_API_BASE_URL = "https://api.tilt-us.com";

const PROD_API_HOST = "api.tilt-us.com";

function isLocalBackendHost() {
  const host =
    typeof window === "undefined" ? "localhost" : window.location.hostname.toLowerCase();

  return host === "localhost" || host === "127.0.0.1";
}

function resolveConfiguredApiMode(): 'local' | 'dev' {
  if (API_CLIENT_MODE === 'local') {
    return 'local';
  }

  if (API_CLIENT_MODE === 'dev') {
    // When running from localhost while the repo is still in "dev" client mode,
    // prefer local services so OAuth and API calls work together.
    return isLocalBackendHost() ? 'local' : 'dev';
  }

  return isLocalBackendHost() ? 'local' : 'dev';
}

function normalizeApiBaseUrl(rawBaseUrl: string) {
  try {
    const parsed = new URL(rawBaseUrl);
    const isProdHost = parsed.hostname === PROD_API_HOST;

    if (isProdHost && parsed.protocol !== "https:") {
      parsed.protocol = "https:";
    }

    // The generated OpenAPI paths are absolute ("/api/..."), so strip any base-path
    // segment such as "/auth" to avoid generating root-replacing URLs.
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch {
    return rawBaseUrl;
  }
}

function resolveApiBaseUrl() {
  const baseUrl = resolveConfiguredApiMode() === 'local' ? LOCAL_API_BASE_URL : DEV_API_BASE_URL;
  return normalizeApiBaseUrl(baseUrl);
}

client.setConfig({
  baseUrl: resolveApiBaseUrl(),
});

export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}

type SetApiAccessTokenOptions = {
  includeDeviceType?: boolean;
};

export function setApiAccessToken(
  accessToken?: string,
  options: SetApiAccessTokenOptions = {},
) {
  const headers: Record<string, string> = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};

  if (options.includeDeviceType ?? Boolean(accessToken)) {
    headers["X-Device-Type"] = "Web";
  }

  client.setConfig({
    baseUrl: getApiBaseUrl(),
    headers,
  });
}

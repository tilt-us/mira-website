import { client } from "../api/client.gen";
import { clearTokens } from "./auth/adapters/identity/storage";
import { getValidAccessToken } from "./auth/adapters/identity/keycloak";

const LOCAL_API_BASE_URL = "http://localhost:8080";
let runtimeApiBaseUrl = LOCAL_API_BASE_URL;

function normalizeApiBaseUrl(rawBaseUrl: string): string {
  try {
    const parsed = new URL(rawBaseUrl);
    if (!parsed.protocol || !parsed.host) {
      throw new Error('missing protocol or host');
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    throw new Error('Runtime API base URL must be an absolute URL.');
  }
}

export function applyRuntimeApiConfig(apiBaseUrl: string): void {
  runtimeApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
}

function configureClient(): void {
  client.setConfig({ baseUrl: runtimeApiBaseUrl });
}

client.interceptors.request.fns.push(async (request) => {
  try {
    const freshAccessToken = await getValidAccessToken();

    if (freshAccessToken) {
      request.headers.set('Authorization', `Bearer ${freshAccessToken}`);
      request.headers.set('X-Device-Type', 'Web');
      setApiAccessToken(freshAccessToken, { includeDeviceType: true });
      return request;
    }

    clearTokens();
    setApiAccessToken(undefined);
    request.headers.delete('Authorization');
    request.headers.delete('X-Device-Type');
  } catch {
    clearTokens();
    setApiAccessToken(undefined);
    request.headers.delete('Authorization');
    request.headers.delete('X-Device-Type');
  }

  return request;
});

client.interceptors.response.fns.push(async (response) => {
  if (response.status === 401 || response.status === 403) {
    clearTokens();
    setApiAccessToken(undefined);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mira:auth-required'));
    }
  }

  return response;
});

configureClient();

export function reconfigureClientConfig(): void {
  configureClient();
}

export function getApiBaseUrl(): string {
  return runtimeApiBaseUrl;
}

export function resetRuntimeApiConfig(): void {
  runtimeApiBaseUrl = LOCAL_API_BASE_URL;
  configureClient();
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

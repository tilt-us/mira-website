import { vi } from 'vitest';

import { client } from '../api/client.gen';
import {
  reconfigureClientConfig,
  resetApiClientMode,
  setApiAccessToken,
  setApiClientMode,
  getApiBaseUrl,
} from './api-client';

const setConfigMock = vi.spyOn(client, 'setConfig');

function setWindowHostname(hostname: string): void {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...(window.location as Location),
      hostname,
      href: `https://${hostname}`,
    } as Location,
  });
}

async function loadApiClient(mode: 'dev' | 'local', hostname = 'localhost') {
  setWindowHostname(hostname);
  setConfigMock.mockClear();
  resetApiClientMode();
  setApiClientMode(mode);
  reconfigureClientConfig();

  return { getApiBaseUrl, setApiAccessToken };
}

async function loadApiClientWithRawMode(modeValue: string, hostname = 'localhost') {
  setWindowHostname(hostname);
  setConfigMock.mockClear();
  resetApiClientMode();
  setApiClientMode(modeValue);
  reconfigureClientConfig();

  return { getApiBaseUrl, setApiAccessToken };
}

function createJwtWithIssuer(issuer: string): string {
  const payload = btoa(`{"iss":"${issuer}"}`);
  const encodedPayload = payload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `eyJhbGciOiJub25lIn0.${encodedPayload}.`;
}

function setStoredAccessToken(issuer: string) {
  localStorage.setItem(
    'mira.auth.tokens',
    JSON.stringify({
      accessToken: createJwtWithIssuer(issuer),
    }),
  );
}

describe('api-client', () => {
  function getRequestInterceptor() {
    return client.interceptors.request.fns[client.interceptors.request.fns.length - 1]!;
  }

  function getResponseInterceptor() {
    return client.interceptors.response.fns[client.interceptors.response.fns.length - 1]!;
  }

  it('uses localhost API when mode is local', async () => {
    const { getApiBaseUrl, setApiAccessToken } = await loadApiClient('local', 'app.local');
    expect(getApiBaseUrl()).toBe('http://localhost:8080');

    setApiAccessToken('token');

    expect(setConfigMock).toHaveBeenCalledTimes(2);
    expect(setConfigMock).toHaveBeenLastCalledWith({
      baseUrl: 'http://localhost:8080',
      headers: {
        Authorization: 'Bearer token',
        'X-Device-Type': 'Web',
      },
    });
  });

  it('uses localhost API in dev mode when the app runs on localhost', async () => {
    const { getApiBaseUrl } = await loadApiClient('dev', 'localhost');
    expect(getApiBaseUrl()).toBe('http://localhost:8080');
  });

  it('uses local API in dev mode when host is 127.0.0.1', async () => {
    const { getApiBaseUrl } = await loadApiClient('dev', '127.0.0.1');
    expect(getApiBaseUrl()).toBe('http://localhost:8080');
  });

  it('uses dev API in dev mode from remote host', async () => {
    const { getApiBaseUrl } = await loadApiClient('dev', 'example.com');
    expect(getApiBaseUrl()).toBe('https://api.tilt-us.com');
  });

  it('falls back to local when mode is unknown but host is local', async () => {
    const { getApiBaseUrl } = await loadApiClientWithRawMode('staging', 'localhost');
    expect(getApiBaseUrl()).toBe('http://localhost:8080');
  });

  it('uses prod api URL in unknown mode from a non-local host', async () => {
    const { getApiBaseUrl } = await loadApiClientWithRawMode('staging', 'example.com');
    expect(getApiBaseUrl()).toBe('https://api.tilt-us.com');
  });

  it('falls back to raw base URL when URL parsing fails', async () => {
    const OriginalURL = globalThis.URL;
    const failingURL = function (..._args: unknown[]) {
      throw new Error('invalid');
    } as unknown as typeof URL;

    Object.defineProperty(globalThis, 'URL', {
      configurable: true,
      value: failingURL,
    });

    try {
      const { getApiBaseUrl } = await loadApiClient('dev', 'example.com');
      expect(getApiBaseUrl()).toBe('https://api.tilt-us.com');
    } finally {
      Object.defineProperty(globalThis, 'URL', {
        configurable: true,
        value: OriginalURL,
      });
    }
  });

  it('omits authorization header without token and can still add device header', async () => {
    const { setApiAccessToken, getApiBaseUrl } = await loadApiClient('dev', 'example.com');
    const noToken = setConfigMock.mock.lastCall;

    setApiAccessToken();
    expect(setConfigMock).toHaveBeenLastCalledWith({
      baseUrl: getApiBaseUrl(),
      headers: {},
    });

    setConfigMock.mockClear();
    setApiAccessToken(undefined, { includeDeviceType: true });
    expect(setConfigMock).toHaveBeenCalledWith({
      baseUrl: getApiBaseUrl(),
      headers: {
        'X-Device-Type': 'Web',
      },
    });

    expect(noToken).toBeDefined();
  });

  it('adds auth headers when a token is available in request interceptor', async () => {
    const { getApiBaseUrl } = await loadApiClient('dev', 'example.com');
    const token = createJwtWithIssuer('https://auth.tilt-us.com/realms/mira');
    setStoredAccessToken('https://auth.tilt-us.com/realms/mira');
    setConfigMock.mockClear();
    const request = new Request('https://example.com');
    const result = await getRequestInterceptor()(request, {} as never);

    expect(result.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(result.headers.get('X-Device-Type')).toBe('Web');
    expect(localStorage.getItem('mira.auth.tokens')).toBeTruthy();
    expect(setConfigMock).toHaveBeenLastCalledWith({
      baseUrl: getApiBaseUrl(),
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Device-Type': 'Web',
      },
    });
  });

  it('clears tokens and auth headers when no token is available in request interceptor', async () => {
    const { getApiBaseUrl } = await loadApiClient('dev', 'example.com');
    localStorage.setItem(
      'mira.auth.tokens',
      JSON.stringify({
        refreshToken: 'refresh-only',
      }),
    );
    setConfigMock.mockClear();
    const request = new Request('https://example.com', {
      headers: {
        Authorization: 'Bearer old-token',
        'X-Device-Type': 'Web',
      },
    });
    const result = await getRequestInterceptor()(request, {} as never);

    expect(localStorage.getItem('mira.auth.tokens')).toBeNull();
    expect(result.headers.get('Authorization')).toBeNull();
    expect(result.headers.get('X-Device-Type')).toBeNull();
    expect(setConfigMock).toHaveBeenLastCalledWith({
      baseUrl: getApiBaseUrl(),
      headers: {},
    });
  });

  it('clears auth state when request interceptor token lookup fails', async () => {
    const { getApiBaseUrl } = await loadApiClient('dev', 'example.com');
    setStoredAccessToken('https://invalid.issuer');
    setConfigMock.mockClear();
    const request = new Request('https://example.com');
    const result = await getRequestInterceptor()(request, {} as never);

    expect(localStorage.getItem('mira.auth.tokens')).toBeNull();
    expect(result.headers.get('Authorization')).toBeNull();
    expect(result.headers.get('X-Device-Type')).toBeNull();
    expect(setConfigMock).toHaveBeenLastCalledWith({
      baseUrl: getApiBaseUrl(),
      headers: {},
    });
  });

  it('dispatches auth-required event for unauthorized responses', async () => {
    const { getApiBaseUrl } = await loadApiClient('dev', 'example.com');
    setStoredAccessToken('https://auth.tilt-us.com/realms/mira');
    const authRequiredSpy = vi.fn();

    window.addEventListener('mira:auth-required', authRequiredSpy);

    setConfigMock.mockClear();
    const response = new Response(null, { status: 401 });
    const interceptor = getResponseInterceptor();
    const updatedResponse = await interceptor(
      response,
      new Request('https://example.com'),
      {} as never,
    );

    expect(localStorage.getItem('mira.auth.tokens')).toBeNull();
    expect(updatedResponse).toBe(response);
    expect(authRequiredSpy).toHaveBeenCalledTimes(1);
    expect(setConfigMock).toHaveBeenLastCalledWith({
      baseUrl: getApiBaseUrl(),
      headers: {},
    });

    window.removeEventListener('mira:auth-required', authRequiredSpy);
  });

  it('does not modify client for successful responses', async () => {
    const { getApiBaseUrl } = await loadApiClient('dev', 'example.com');
    setStoredAccessToken('https://auth.tilt-us.com/realms/mira');
    const response = new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
    });

    setConfigMock.mockClear();
    const interceptor = getResponseInterceptor();
    const updatedResponse = await interceptor(response, new Request('https://example.com'), {} as never);

    expect(localStorage.getItem('mira.auth.tokens')).toBeTruthy();
    expect(updatedResponse).toBe(response);
    expect(setConfigMock).not.toHaveBeenCalled();
    expect(getApiBaseUrl()).toBe('https://api.tilt-us.com');
  });
});

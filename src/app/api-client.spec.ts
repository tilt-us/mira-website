import { vi } from 'vitest';

import { client } from '../api/client.gen';
import {
  applyRuntimeApiConfig,
  getApiBaseUrl,
  reconfigureClientConfig,
  resetRuntimeApiConfig,
  setApiAccessToken,
} from './api-client';

const setConfigMock = vi.spyOn(client, 'setConfig');

function createJwtWithIssuer(issuer: string): string {
  const payload = btoa(`{"iss":"${issuer}"}`);
  const encodedPayload = payload.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `eyJhbGciOiJub25lIn0.${encodedPayload}.`;
}

describe('api-client runtime configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    resetRuntimeApiConfig();
    setConfigMock.mockClear();
  });

  it('uses the local runtime URL until a runtime configuration is loaded', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:8080');
  });

  it('uses the loaded runtime API address and reconfigures the generated client', () => {
    applyRuntimeApiConfig('https://staging.api.tilt-us.com');
    reconfigureClientConfig();

    expect(getApiBaseUrl()).toBe('https://staging.api.tilt-us.com');
    expect(setConfigMock).toHaveBeenLastCalledWith({
      baseUrl: 'https://staging.api.tilt-us.com',
    });
  });

  it('does not silently fall back to a remote API URL for invalid runtime input', () => {
    expect(() => applyRuntimeApiConfig('not-a-url')).toThrow('Runtime API base URL');
    expect(getApiBaseUrl()).toBe('http://localhost:8080');
  });

  it('sets browser auth and device headers', () => {
    applyRuntimeApiConfig('https://dev.api.tilt-us.com');
    setApiAccessToken('token');

    expect(setConfigMock).toHaveBeenLastCalledWith({
      baseUrl: 'https://dev.api.tilt-us.com',
      headers: {
        Authorization: 'Bearer token',
        'X-Device-Type': 'Web',
      },
    });
  });

  it('adds a valid stored access token in the request interceptor', async () => {
    const token = createJwtWithIssuer('http://localhost:8081/realms/mira');
    localStorage.setItem('mira.auth.tokens', JSON.stringify({ accessToken: token }));
    const interceptor = client.interceptors.request.fns.at(-1)!;
    const request = new Request('https://example.test');

    const result = await interceptor(request, {} as never);

    expect(result.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(result.headers.get('X-Device-Type')).toBe('Web');
  });

  it('clears stale tokens when no valid token is available', async () => {
    localStorage.setItem('mira.auth.tokens', JSON.stringify({ refreshToken: 'stale' }));
    const interceptor = client.interceptors.request.fns.at(-1)!;
    const request = new Request('https://example.test', {
      headers: { Authorization: 'Bearer old-token' },
    });

    const result = await interceptor(request, {} as never);

    expect(localStorage.getItem('mira.auth.tokens')).toBeNull();
    expect(result.headers.get('Authorization')).toBeNull();
  });

  it('clears auth state and emits an event for an unauthorized response', async () => {
    const handler = vi.fn();
    window.addEventListener('mira:auth-required', handler);
    localStorage.setItem('mira.auth.tokens', JSON.stringify({ accessToken: 'token' }));
    const interceptor = client.interceptors.response.fns.at(-1)!;

    await interceptor(new Response(null, { status: 401 }), new Request('https://example.test'), {} as never);

    expect(localStorage.getItem('mira.auth.tokens')).toBeNull();
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener('mira:auth-required', handler);
  });
});

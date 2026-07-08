import { vi } from 'vitest';

const setConfigMock = vi.fn();

vi.mock('../api/client.gen', () => ({
  client: {
    setConfig: setConfigMock,
  },
}));

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
  vi.resetModules();
  vi.doMock('./api-runtime.config', () => ({
    API_CLIENT_MODE: mode,
  }));

  return import('./api-client');
}

async function loadApiClientWithRawMode(modeValue: string, hostname = 'localhost') {
  setWindowHostname(hostname);
  setConfigMock.mockClear();
  vi.resetModules();
  vi.doMock('./api-runtime.config', () => ({
    API_CLIENT_MODE: modeValue,
  }));

  return import('./api-client');
}

describe('api-client', () => {
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
});

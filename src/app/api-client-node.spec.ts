/* @vitest-environment node */
import { vi } from 'vitest';

import { client } from '../api/client.gen';
import {
  getApiBaseUrl,
  reconfigureClientConfig,
  resetApiClientMode,
  setApiClientMode,
} from './api-client';

describe('api-client node environment', () => {
  const setConfigMock = vi.spyOn(client, 'setConfig');

  it('falls back to localhost when running without window for local checks', () => {
    setConfigMock.mockClear();
    resetApiClientMode();
    setApiClientMode('dev');
    reconfigureClientConfig();

    expect(getApiBaseUrl()).toBe('http://localhost:8080');
    expect(setConfigMock).toHaveBeenCalled();
  });
});

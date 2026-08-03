/* @vitest-environment node */
import { expect, it } from 'vitest';

import { getApiBaseUrl, resetRuntimeApiConfig } from './api-client';

it('uses the local runtime default without a browser environment', () => {
  resetRuntimeApiConfig();
  expect(getApiBaseUrl()).toBe('http://localhost:8080');
});

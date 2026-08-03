import { expect, it, vi } from 'vitest';

import { applyRuntimeApiConfig, getApiBaseUrl, resetRuntimeApiConfig } from './api-client';
import {
  applyKeycloakRuntimeConfig,
  getCurrentKeycloakAuthUrl,
  getCurrentKeycloakBaseUrl,
  getCurrentKeycloakIssuerUrl,
  getCurrentKeycloakTokenUrl,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_PASSWORD_CLIENT_ID,
} from './auth/adapters/identity/config';
import {
  loadRuntimeConfig,
  RuntimeConfigError,
  validateRuntimeConfig,
  type MiraRuntimeConfig,
} from './runtime-config';

const baseConfig: MiraRuntimeConfig = {
  environment: 'local',
  apiBaseUrl: 'http://localhost:8080',
  keycloakBaseUrl: 'http://localhost:8081',
  keycloakRealm: 'mira',
  keycloakClientId: 'mira-bevy',
  keycloakPasswordClientId: 'mira-e2e',
};

function environmentConfig(environment: MiraRuntimeConfig['environment']): MiraRuntimeConfig {
  if (environment === 'local') {
    return baseConfig;
  }

  const host = environment === 'prod' ? 'api.tilt-us.com' : `${environment}.api.tilt-us.com`;
  return {
    environment,
    apiBaseUrl: `https://${host}`,
    keycloakBaseUrl: `https://${host}/keycloak`,
    keycloakRealm: 'mira',
    keycloakClientId: 'mira-web',
    keycloakPasswordClientId: 'mira-web',
  };
}

describe('runtime configuration', () => {
  it.each(['local', 'dev', 'staging', 'prod'] as const)(
    'accepts a valid %s configuration',
    (environment) => {
      expect(validateRuntimeConfig(environmentConfig(environment))).toEqual(environmentConfig(environment));
    },
  );

  it('loads runtime.json without using the HTTP cache', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(environmentConfig('dev')), { status: 200 }),
    );

    await expect(loadRuntimeConfig(fetchImplementation)).resolves.toEqual(environmentConfig('dev'));
    expect(fetchImplementation).toHaveBeenCalledWith('/config/runtime.json', { cache: 'no-store' });
  });

  it('rejects missing required fields', () => {
    const { apiBaseUrl: _apiBaseUrl, ...missingApiBaseUrl } = baseConfig;
    expect(() => validateRuntimeConfig(missingApiBaseUrl)).toThrow(RuntimeConfigError);
  });

  it('rejects HTTP URLs outside the local environment', () => {
    expect(() =>
      validateRuntimeConfig({ ...environmentConfig('dev'), apiBaseUrl: 'http://dev.api.tilt-us.com' }),
    ).toThrow('absolute HTTPS URL');
  });

  it('allows the explicitly supported local HTTP URLs', () => {
    expect(validateRuntimeConfig(baseConfig)).toEqual(baseConfig);
  });

  it('rejects unexpected fields so secrets cannot be exposed in runtime.json', () => {
    expect(() => validateRuntimeConfig({ ...baseConfig, clientSecret: 'do-not-commit' })).toThrow(
      'must not contain secrets',
    );
  });

  it('rejects the infrastructure Keycloak host', () => {
    expect(() =>
      validateRuntimeConfig({ ...environmentConfig('dev'), keycloakBaseUrl: 'https://sso.tilt-us.com' }),
    ).toThrow('infrastructure Keycloak');
  });

  it('applies the loaded API and Keycloak endpoints without a production fallback', () => {
    const config = environmentConfig('staging');
    resetRuntimeApiConfig();
    applyRuntimeApiConfig(config.apiBaseUrl);
    applyKeycloakRuntimeConfig(config);

    expect(getApiBaseUrl()).toBe('https://staging.api.tilt-us.com');
    expect(getCurrentKeycloakBaseUrl()).toBe('https://staging.api.tilt-us.com/keycloak');
    expect(getCurrentKeycloakIssuerUrl()).toBe(
      'https://staging.api.tilt-us.com/keycloak/realms/mira',
    );
    expect(getCurrentKeycloakAuthUrl()).toContain('/protocol/openid-connect/auth');
    expect(getCurrentKeycloakTokenUrl()).toContain('/protocol/openid-connect/token');
    expect(KEYCLOAK_CLIENT_ID).toBe('mira-web');
    expect(KEYCLOAK_PASSWORD_CLIENT_ID).toBe('mira-web');
  });
});

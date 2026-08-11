export type RuntimeEnvironment = 'local' | 'dev' | 'staging' | 'prod';

export interface MiraRuntimeConfig {
  environment: RuntimeEnvironment;
  apiBaseUrl: string;
  downloadBaseUrl: string;
  keycloakBaseUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  keycloakPasswordClientId: string;
}

export const RUNTIME_CONFIG_PATH = '/config/runtime.json';

const REQUIRED_FIELDS = [
  'environment',
  'apiBaseUrl',
  'downloadBaseUrl',
  'keycloakBaseUrl',
  'keycloakRealm',
  'keycloakClientId',
  'keycloakPasswordClientId',
] as const;

const ALLOWED_ENVIRONMENTS = new Set<RuntimeEnvironment>(['local', 'dev', 'staging', 'prod']);

export class RuntimeConfigError extends Error {
  constructor(message: string) {
    super(`Invalid runtime configuration: ${message}`);
    this.name = 'RuntimeConfigError';
  }
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RuntimeConfigError('the JSON value must be an object.');
  }

  return value as Record<string, unknown>;
}

function validateFields(config: Record<string, unknown>): void {
  for (const field of REQUIRED_FIELDS) {
    if (typeof config[field] !== 'string' || !config[field].trim()) {
      throw new RuntimeConfigError(`required field "${field}" is missing or empty.`);
    }
  }

  for (const field of Object.keys(config)) {
    if (!REQUIRED_FIELDS.includes(field as (typeof REQUIRED_FIELDS)[number])) {
      throw new RuntimeConfigError(
        `field "${field}" is not allowed; runtime configuration must not contain secrets.`,
      );
    }
  }
}

function requiredString(
  config: Record<string, unknown>,
  field: (typeof REQUIRED_FIELDS)[number],
): string {
  return config[field] as string;
}

function normalizeUrl(value: string, label: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new RuntimeConfigError(`field "${label}" must be an absolute URL.`);
  }
}

function validateEndpointUrl(
  value: string,
  label: 'apiBaseUrl' | 'keycloakBaseUrl',
  environment: RuntimeEnvironment,
): string {
  const url = normalizeUrl(value, label);
  const normalized = url.toString().replace(/\/$/, '');

  if (environment === 'local') {
    const expectedPort = label === 'apiBaseUrl' ? '8080' : '8081';
    if (url.protocol !== 'http:' || url.hostname !== 'localhost' || url.port !== expectedPort) {
      throw new RuntimeConfigError(
        `local field "${label}" must use http://localhost:${expectedPort}.`,
      );
    }
    return normalized;
  }

  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw new RuntimeConfigError(`non-local field "${label}" must be an absolute HTTPS URL.`);
  }

  if (url.hostname.toLowerCase() === 'sso.tilt-us.com') {
    throw new RuntimeConfigError('the infrastructure Keycloak host must not be used.');
  }

  return normalized;
}

function validateDownloadBaseUrl(value: string, environment: RuntimeEnvironment): string {
  const url = normalizeUrl(value, 'downloadBaseUrl');
  const normalized = url.toString().replace(/\/$/, '');

  if (url.username || url.password || url.search || url.hash) {
    throw new RuntimeConfigError(
      'field "downloadBaseUrl" must not contain credentials, a query, or a fragment.',
    );
  }

  if (environment === 'local') {
    if (url.protocol !== 'http:' || url.hostname !== 'localhost' || url.port !== '8090') {
      throw new RuntimeConfigError('local field "downloadBaseUrl" must use http://localhost:8090.');
    }
    return normalized;
  }

  if (url.protocol !== 'https:' || url.hostname !== 'downloads.tilt-us.com') {
    throw new RuntimeConfigError(
      'non-local field "downloadBaseUrl" must use the HTTPS downloads.tilt-us.com host.',
    );
  }

  const expectedPath = environment === 'prod' ? '' : `/${environment}`;
  if (url.pathname.replace(/\/$/, '') !== expectedPath) {
    throw new RuntimeConfigError(
      `field "downloadBaseUrl" must use the ${environment} download base URL.`,
    );
  }

  return normalized;
}

export function validateRuntimeConfig(value: unknown): MiraRuntimeConfig {
  const config = requireRecord(value);
  validateFields(config);

  const environment = requiredString(config, 'environment').trim() as RuntimeEnvironment;
  if (!ALLOWED_ENVIRONMENTS.has(environment)) {
    throw new RuntimeConfigError('field "environment" must be local, dev, staging, or prod.');
  }

  return {
    environment,
    apiBaseUrl: validateEndpointUrl(
      requiredString(config, 'apiBaseUrl').trim(),
      'apiBaseUrl',
      environment,
    ),
    downloadBaseUrl: validateDownloadBaseUrl(
      requiredString(config, 'downloadBaseUrl').trim(),
      environment,
    ),
    keycloakBaseUrl: validateEndpointUrl(
      requiredString(config, 'keycloakBaseUrl').trim(),
      'keycloakBaseUrl',
      environment,
    ),
    keycloakRealm: requiredString(config, 'keycloakRealm').trim(),
    keycloakClientId: requiredString(config, 'keycloakClientId').trim(),
    keycloakPasswordClientId: requiredString(config, 'keycloakPasswordClientId').trim(),
  };
}

export async function loadRuntimeConfig(
  fetchImplementation: typeof fetch = fetch,
): Promise<MiraRuntimeConfig> {
  let response: Response;

  try {
    response = await fetchImplementation(RUNTIME_CONFIG_PATH, { cache: 'no-store' });
  } catch {
    throw new RuntimeConfigError(`could not load ${RUNTIME_CONFIG_PATH}.`);
  }

  if (!response.ok) {
    throw new RuntimeConfigError(
      `could not load ${RUNTIME_CONFIG_PATH} (HTTP ${response.status}).`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new RuntimeConfigError(`${RUNTIME_CONFIG_PATH} does not contain valid JSON.`);
  }

  return validateRuntimeConfig(payload);
}

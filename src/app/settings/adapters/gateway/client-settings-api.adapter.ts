import { getSettings, updateSettings } from '../../../../api/sdk.gen';
import type { ClientSettingsApi } from '../../domain/ports';

/** Outbound adapter: talks to the generated `/api/me/settings` endpoints. */
export function createClientSettingsApi(): ClientSettingsApi {
  return {
    read: async () => (await getSettings({ throwOnError: true })).data,
    write: async (body) => (await updateSettings({ body, throwOnError: true })).data,
  };
}

import { InjectionToken } from '@angular/core';

import type {
  ClientSettingsResponse,
  UpdateClientSettingsRequest,
} from '../../../api/types.gen';
import { createClientSettingsApi } from '../adapters/gateway/client-settings-api.adapter';

/**
 * Fields the website is allowed to change. Friend folders are managed in the
 * desktop client only, so they are never part of a website patch — they are
 * still sent back untouched, see {@link ClientSettingsService.save}.
 */
export type ClientSettingsPatch = Omit<UpdateClientSettingsRequest, 'folders'>;

/** Outbound port for the `/api/me/settings` record, injected so tests can stand in for it. */
export interface ClientSettingsApi {
  read(): Promise<ClientSettingsResponse | undefined>;
  write(body: UpdateClientSettingsRequest): Promise<ClientSettingsResponse | undefined>;
}

export const CLIENT_SETTINGS_API = new InjectionToken<ClientSettingsApi>(
  'CLIENT_SETTINGS_API',
  {
    providedIn: 'root',
    factory: createClientSettingsApi,
  },
);

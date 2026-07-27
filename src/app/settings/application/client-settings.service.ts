import { computed, inject, Injectable, signal } from '@angular/core';

import type {
  ClientSettingsFolderRequest,
  ClientSettingsFolderResponse,
  ClientSettingsResponse,
  UpdateClientSettingsRequest,
} from '../../../api/types.gen';
import { ThemeService } from './theme.service';
import { WallpaperService } from './wallpaper.service';
import { CLIENT_SETTINGS_API, ClientSettingsPatch } from '../domain/ports';

type NamedFolder = ClientSettingsFolderResponse & { name: string };

function hasName(folder: ClientSettingsFolderResponse): folder is NamedFolder {
  return typeof folder.name === 'string' && folder.name.length > 0;
}

/** `PUT /api/me/settings` takes the request shape, `GET` returns the response shape. */
function toRequest(settings: ClientSettingsResponse): UpdateClientSettingsRequest {
  const { folders, ...rest } = settings;
  const namedFolders: ClientSettingsFolderRequest[] = (folders ?? [])
    .filter(hasName)
    .map((folder) => ({
      name: folder.name,
      moveHereWhen: folder.moveHereWhen,
      friendPublicIds: folder.friendPublicIds,
    }));

  return namedFolders.length > 0 ? { ...rest, folders: namedFolders } : { ...rest };
}

/**
 * Owns `/api/me/settings` — the single settings record the website and the
 * desktop client share. Loading it applies the parts the website renders
 * itself (accent colour, wallpaper); saving merges on top of the stored record
 * so a website-only change can never drop client-owned values.
 */
@Injectable({ providedIn: 'root' })
export class ClientSettingsService {
  private readonly api = inject(CLIENT_SETTINGS_API);
  private readonly themeService = inject(ThemeService);
  private readonly wallpaperService = inject(WallpaperService);
  private readonly currentSettings = signal<ClientSettingsResponse | null>(null);

  readonly settings = this.currentSettings.asReadonly();
  readonly isLoaded = computed(() => this.currentSettings() !== null);

  /** Reads the record for the signed-in user; falls back to defaults on error. */
  async load(): Promise<ClientSettingsResponse | null> {
    try {
      const settings = (await this.api.read()) ?? {};
      this.apply(settings);
      return settings;
    } catch {
      this.reset();
      return null;
    }
  }

  /**
   * Saves `changes` on top of the record currently stored in the backend.
   *
   * The record is re-read first so the payload carries every field the client
   * wrote — saving e.g. an accent colour from the website therefore leaves
   * resolution, UI scale or friend folders exactly as the client left them,
   * no matter whether the backend replaces or merges the request.
   */
  async save(changes: ClientSettingsPatch): Promise<ClientSettingsResponse> {
    const stored = await this.readLatest();
    const body: UpdateClientSettingsRequest = { ...toRequest(stored), ...changes };
    const saved = (await this.api.write(body)) ?? { ...stored, ...changes };

    this.apply(saved);
    return saved;
  }

  /** Drops the cached record and returns the UI to the default theme. */
  reset(): void {
    this.currentSettings.set(null);
    this.themeService.applyDefaults();
  }

  private async readLatest(): Promise<ClientSettingsResponse> {
    try {
      return (await this.api.read()) ?? {};
    } catch (error) {
      const cached = this.currentSettings();

      // Without a known server state a full payload could overwrite client
      // values, so only a previously loaded record may serve as the base.
      if (!cached) {
        throw error;
      }

      return cached;
    }
  }

  private apply(settings: ClientSettingsResponse): void {
    this.currentSettings.set(settings);
    this.themeService.applyAccent(settings.accentColor);
    this.wallpaperService.setFromServer(settings.background);
  }
}

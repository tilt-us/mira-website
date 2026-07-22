import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService, normalizeLoginError } from '../auth/auth.service';
import { DatePicker } from '../shared/date-picker/date-picker';
import {
  ClientSettingsPatch,
  ClientSettingsService,
} from '../shared/client-settings.service';
import { ThemeService } from '../shared/theme.service';
import {
  Wallpaper,
  WALLPAPERS,
  WallpaperService,
  wallpaperImageUrl,
} from '../shared/wallpaper.service';
import { ACCOUNT_PROVIDERS } from './account-providers';
import {
  CHAT_POSITION_OPTIONS,
  CLIENT_ANIMATION_OPTIONS,
  LANGUAGE_OPTIONS,
  RESOLUTION_OPTIONS,
  SCREEN_MODE_OPTIONS,
  SETTINGS_SECTIONS,
  SettingsSectionId,
  UI_SCALE_MAX,
  UI_SCALE_MIN,
  UI_SCALE_STEP,
  withCurrentValue,
} from './settings-options';

const DEFAULT_UI_SCALE = 1;

interface ProfilePatch {
  displayName?: string;
  tagId?: string;
}

/**
 * Settings page, laid out like the in-game client: a section list on the left,
 * one panel of rows on the right.
 *
 * Identity fields go through {@link AuthService}, everything else through
 * {@link ClientSettingsService}, which shares its record with the desktop
 * client. Only fields that actually differ from the stored values are sent.
 */
@Component({
  selector: 'app-user-settings',
  imports: [FormsModule, DatePicker],
  templateUrl: './user-settings.html',
})
export class UserSettings {
  protected readonly auth = inject(AuthService);
  private readonly clientSettings = inject(ClientSettingsService);
  private readonly themeService = inject(ThemeService);
  private readonly wallpaperService = inject(WallpaperService);

  protected readonly sections = SETTINGS_SECTIONS;
  protected readonly providers = ACCOUNT_PROVIDERS;
  protected readonly wallpapers = WALLPAPERS;
  protected readonly uiScaleMin = UI_SCALE_MIN;
  protected readonly uiScaleMax = UI_SCALE_MAX;
  protected readonly uiScaleStep = UI_SCALE_STEP;

  protected readonly activeSection = signal<SettingsSectionId>('account');
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal('');
  protected readonly saveStatus = signal('');
  protected readonly accountError = signal('');
  protected readonly accountStatus = signal('');

  private readonly settings = this.clientSettings.settings;
  private readonly socialProviderIds = ['google', 'discord', 'github'];

  // Values in use before the backend record arrives; they keep the change
  // detection stable for users whose settings have never been stored.
  private readonly initialAccent = this.themeService.accent();
  private readonly initialWallpaper = this.wallpaperService.wallpaper();

  private readonly savedDisplayName = computed(() => this.auth.user()?.displayName ?? '');
  private readonly savedTagId = computed(() => this.auth.user()?.tagId ?? '');
  private readonly savedAccent = computed(() =>
    (this.settings()?.accentColor ?? this.initialAccent).toLowerCase(),
  );
  private readonly savedBackground = computed(
    () => this.settings()?.background ?? this.initialWallpaper,
  );
  private readonly savedLanguage = computed(() => this.settings()?.language ?? '');
  private readonly savedResolution = computed(() => this.settings()?.resolution ?? '');
  private readonly savedScreenMode = computed(() => this.settings()?.screenMode ?? '');
  private readonly savedChatPosition = computed(() => this.settings()?.chatPosition ?? '');
  private readonly savedClientAnimation = computed(() => this.settings()?.clientAnimation ?? '');
  private readonly savedUiScale = computed(() => this.settings()?.uiScale ?? DEFAULT_UI_SCALE);
  private readonly savedShowEmailPublic = computed(() => this.settings()?.showEmailPublic ?? false);
  private readonly savedUseFriendColors = computed(() => this.settings()?.useFriendColors ?? false);

  protected readonly displayName = linkedSignal(() => this.savedDisplayName());
  protected readonly tagId = linkedSignal(() => this.savedTagId());
  protected readonly accentColor = linkedSignal(() => this.savedAccent());
  protected readonly wallpaper = linkedSignal(() => this.savedBackground());
  protected readonly language = linkedSignal(() => this.savedLanguage());
  protected readonly resolution = linkedSignal(() => this.savedResolution());
  protected readonly screenMode = linkedSignal(() => this.savedScreenMode());
  protected readonly chatPosition = linkedSignal(() => this.savedChatPosition());
  protected readonly clientAnimation = linkedSignal(() => this.savedClientAnimation());
  protected readonly uiScale = linkedSignal(() => this.savedUiScale());
  protected readonly showEmailPublic = linkedSignal(() => this.savedShowEmailPublic());
  protected readonly useFriendColors = linkedSignal(() => this.savedUseFriendColors());

  // The backend has no birthday field yet, so the value stays on the page.
  protected readonly birthday = signal('');

  // Values stored by the client but missing from the static lists stay
  // selectable instead of being replaced by the first list entry.
  protected readonly languageOptions = computed(() =>
    withCurrentValue(LANGUAGE_OPTIONS, this.savedLanguage()),
  );
  protected readonly resolutionOptions = computed(() =>
    withCurrentValue(RESOLUTION_OPTIONS, this.savedResolution()),
  );
  protected readonly screenModeOptions = computed(() =>
    withCurrentValue(SCREEN_MODE_OPTIONS, this.savedScreenMode()),
  );
  protected readonly chatPositionOptions = computed(() =>
    withCurrentValue(CHAT_POSITION_OPTIONS, this.savedChatPosition()),
  );
  protected readonly clientAnimationOptions = computed(() =>
    withCurrentValue(CLIENT_ANIMATION_OPTIONS, this.savedClientAnimation()),
  );

  protected readonly activeSectionMeta = computed(
    () =>
      this.sections.find((section) => section.id === this.activeSection()) ?? this.sections[0],
  );

  protected readonly uiScalePercent = computed(() => Math.round(this.uiScale() * 100));

  protected readonly pendingProfile = computed<ProfilePatch>(() => {
    const patch: ProfilePatch = {};
    const displayName = this.displayName().trim();
    const tagId = this.tagId().trim();

    if (displayName !== this.savedDisplayName()) {
      patch.displayName = displayName;
    }

    if (tagId !== this.savedTagId()) {
      patch.tagId = tagId;
    }

    return patch;
  });

  protected readonly pendingSettings = computed<ClientSettingsPatch>(() => {
    const patch: ClientSettingsPatch = {};
    const accentColor = this.accentColor().trim().toLowerCase();

    if (accentColor && accentColor !== this.savedAccent()) {
      patch.accentColor = accentColor;
    }

    if (this.wallpaper() !== this.savedBackground()) {
      patch.background = this.wallpaper();
    }

    if (this.language() && this.language() !== this.savedLanguage()) {
      patch.language = this.language();
    }

    if (this.resolution() && this.resolution() !== this.savedResolution()) {
      patch.resolution = this.resolution();
    }

    if (this.screenMode() && this.screenMode() !== this.savedScreenMode()) {
      patch.screenMode = this.screenMode();
    }

    if (this.chatPosition() && this.chatPosition() !== this.savedChatPosition()) {
      patch.chatPosition = this.chatPosition();
    }

    if (this.clientAnimation() && this.clientAnimation() !== this.savedClientAnimation()) {
      patch.clientAnimation = this.clientAnimation();
    }

    if (Math.abs(this.uiScale() - this.savedUiScale()) > 0.001) {
      patch.uiScale = this.uiScale();
    }

    if (this.showEmailPublic() !== this.savedShowEmailPublic()) {
      patch.showEmailPublic = this.showEmailPublic();
    }

    if (this.useFriendColors() !== this.savedUseFriendColors()) {
      patch.useFriendColors = this.useFriendColors();
    }

    return patch;
  });

  protected readonly hasChanges = computed(
    () =>
      Object.keys(this.pendingProfile()).length > 0 ||
      Object.keys(this.pendingSettings()).length > 0,
  );

  protected selectSection(section: SettingsSectionId): void {
    this.activeSection.set(section);
    this.saveError.set('');
    this.saveStatus.set('');
  }

  protected wallpaperPreview(wallpaper: string): string {
    return wallpaperImageUrl(wallpaper);
  }

  protected isWallpaperSelected(wallpaper: string): boolean {
    return this.wallpaper() === wallpaper;
  }

  /** Applies the wallpaper right away; the save then stores it in the backend. */
  protected selectWallpaper(wallpaper: Wallpaper): void {
    this.wallpaper.set(wallpaper);
    this.wallpaperService.set(wallpaper);
  }

  /** Applies the accent live so the page shows the colour before saving. */
  protected setAccentColor(accentColor: string): void {
    this.accentColor.set(accentColor);
    this.themeService.applyAccent(accentColor);
  }

  protected async save(): Promise<void> {
    this.saveError.set('');
    this.saveStatus.set('');

    const profile = this.pendingProfile();
    const settings = this.pendingSettings();

    if (!this.hasChanges()) {
      this.saveStatus.set('Keine Änderungen vorhanden.');
      return;
    }

    this.isSaving.set(true);

    try {
      if (Object.keys(profile).length > 0) {
        await this.auth.saveProfile(profile);
      }

      if (Object.keys(settings).length > 0) {
        await this.clientSettings.save(settings);
      }

      this.saveStatus.set('Änderungen gespeichert.');
    } catch (error: unknown) {
      this.saveError.set(normalizeLoginError(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  /** Drops the edits and undoes the live previews. */
  protected discard(): void {
    this.displayName.set(this.savedDisplayName());
    this.tagId.set(this.savedTagId());
    this.accentColor.set(this.savedAccent());
    this.wallpaper.set(this.savedBackground());
    this.language.set(this.savedLanguage());
    this.resolution.set(this.savedResolution());
    this.screenMode.set(this.savedScreenMode());
    this.chatPosition.set(this.savedChatPosition());
    this.clientAnimation.set(this.savedClientAnimation());
    this.uiScale.set(this.savedUiScale());
    this.showEmailPublic.set(this.savedShowEmailPublic());
    this.useFriendColors.set(this.savedUseFriendColors());

    this.themeService.applyAccent(this.savedAccent());
    this.wallpaperService.setFromServer(this.savedBackground());

    this.saveError.set('');
    this.saveStatus.set('');
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void this.save();
  }

  protected async changePassword(): Promise<void> {
    this.accountError.set('');
    this.accountStatus.set('Weiterleitung zu Keycloak …');

    try {
      await this.auth.startPasswordUpdate();
    } catch (error: unknown) {
      this.accountStatus.set('');
      this.accountError.set(normalizeLoginError(error));
    }
  }

  protected async confirmAvatarRights(): Promise<void> {
    this.accountError.set('');
    this.accountStatus.set('');

    try {
      await this.auth.confirmAvatarRights();
      this.accountStatus.set('Bildrechte bestätigt.');
    } catch (error: unknown) {
      this.accountError.set(normalizeLoginError(error));
    }
  }

  protected isLinkableProvider(providerId: string): boolean {
    return this.socialProviderIds.includes(providerId);
  }

  protected linkProvider(providerId: string): void {
    if (!this.isLinkableProvider(providerId)) {
      return;
    }

    if (providerId === 'google') {
      this.auth.startGoogleLogin(true);
      return;
    }

    if (providerId === 'discord') {
      this.auth.startDiscordLogin(true);
      return;
    }

    this.auth.startGithubLogin(true);
  }

  protected getSocialButtonClasses(providerId: string): string {
    switch (providerId) {
      case 'google':
        return 'bg-white text-[#111] hover:bg-white/85';
      case 'discord':
        return 'bg-[#5865f2] text-white hover:brightness-105';
      case 'github':
        return 'bg-[#0d1117] text-white hover:brightness-110';
      default:
        return 'border border-surface-border bg-surface-raised text-white/60';
    }
  }
}

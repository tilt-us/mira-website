import { Component, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../auth/auth.service';
import { DatePicker } from '../shared/date-picker/date-picker';
import { WallpaperPicker } from '../shared/wallpaper-picker/wallpaper-picker';
import { ThemeService } from '../shared/theme.service';
import { WallpaperService } from '../shared/wallpaper.service';
import { ACCOUNT_PROVIDERS } from './account-providers';
import { normalizeLoginError } from '../auth/auth.service';

@Component({
  selector: 'app-user-settings',
  imports: [FormsModule, DatePicker, WallpaperPicker],
  templateUrl: './user-settings.html',
})
export class UserSettings {
  protected readonly auth = inject(AuthService);
  protected readonly themeService = inject(ThemeService);
  protected readonly wallpaperService = inject(WallpaperService);
  protected readonly providers = ACCOUNT_PROVIDERS;
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal('');
  protected readonly saveStatus = signal('');
  protected readonly socialProviderIds = ['google', 'discord', 'github'];

  // Persisted via the backend when changed.
  protected readonly displayName = linkedSignal(() => this.auth.user()?.displayName ?? '');
  protected readonly tagId = linkedSignal(() => this.auth.user()?.tagId ?? '');
  protected readonly accentColor = linkedSignal(() => this.themeService.accent());
  protected readonly birthday = signal('');
  protected readonly selectedWallpaper = signal(this.wallpaperService.wallpaper());

  // Change-password form — placeholder only, nothing is sent anywhere yet.
  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');

  protected async saveProfile(): Promise<void> {
    this.saveError.set('');
    this.saveStatus.set('');

    const nextDisplayName = this.displayName().trim();
    const nextTagId = this.tagId().trim();
    const nextAccentColor = this.accentColor().trim().toLowerCase();
    const nextWallpaper = this.wallpaperService.wallpaper();
    const currentDisplayName = this.auth.user()?.displayName ?? '';
    const currentTagId = this.auth.user()?.tagId ?? '';
    const currentAccentColor = this.themeService.accent();
    const currentWallpaper = this.selectedWallpaper();

    if (
      nextDisplayName === currentDisplayName &&
      nextTagId === currentTagId &&
      nextAccentColor === currentAccentColor &&
      nextWallpaper === currentWallpaper
    ) {
      this.saveStatus.set('Keine Änderungen vorhanden.');
      return;
    }

    this.isSaving.set(true);

    try {
      await this.auth.saveProfile({
        ...(nextDisplayName !== currentDisplayName ? { displayName: nextDisplayName } : {}),
        ...(nextTagId !== currentTagId ? { tagId: nextTagId } : {}),
        ...(nextAccentColor !== currentAccentColor ? { accentColor: nextAccentColor } : {}),
        ...(nextWallpaper !== currentWallpaper ? { background: nextWallpaper } : {}),
      });

      this.selectedWallpaper.set(nextWallpaper);

      this.saveStatus.set('Änderungen gespeichert.');
    } catch (error: unknown) {
      this.saveError.set(normalizeLoginError(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  protected onProfileSubmit(event: Event): void {
    event.preventDefault();
    void this.saveProfile();
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
        return 'h-10 w-10 rounded-md border border-white/15 bg-white px-0 text-[#111] hover:bg-white/85';
      case 'discord':
        return 'h-10 w-10 rounded-md bg-[#5865f2] px-0 text-white hover:brightness-105';
      case 'github':
        return 'h-10 w-10 rounded-md bg-[#0d1117] px-0 text-white hover:brightness-110';
      default:
        return 'min-h-10 px-3 text-sm';
    }
  }
}

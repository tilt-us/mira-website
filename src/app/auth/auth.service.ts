import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { setApiAccessToken } from '../api-client';
import {
  completeRedirectLogin,
  getValidAccessToken,
  loginWithPassword,
  startDiscordLogin,
  startGithubLogin,
  startGoogleLogin,
  startKeycloakLogout,
} from './keycloak';
import {
  clearOAuthRequest,
  clearTokens,
  readTokens,
  saveTokens,
} from './storage';
import { ThemeService } from '../shared/theme.service';
import { AuthUser, RegisterPayload } from './auth.types';
import {
  getSettings,
  loginOptions,
  logout as apiLogout,
  me,
  register,
  updateTagId,
  updateUsername,
} from '../../api/sdk.gen';

function mapApiUser(profile: {
  avatarUrl?: string;
  displayName?: string;
  email?: string;
  publicId?: number;
  preferredUsername?: string;
  tagId?: string;
  avatarRightsConsented?: boolean;
}): AuthUser {
  return {
    avatarUrl: profile.avatarUrl,
    displayName: profile.displayName ?? profile.preferredUsername,
    email: profile.email,
    publicId: profile.publicId,
    preferredUsername: profile.preferredUsername,
    tagId: profile.tagId,
    avatarRightsConsented: profile.avatarRightsConsented,
  };
}

function normalizeLoginError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Die Authentifizierung ist fehlgeschlagen.';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly themeService = inject(ThemeService);
  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly providerState = signal<string[]>([]);
  private readonly initialized = signal(false);
  private readonly loadingState = signal(false);
  private readonly bootstrapPromise: Promise<void>;
  private readonly router = inject(Router);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly providers = this.providerState.asReadonly();
  readonly initializedResult = this.initialized.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isInitialized = this.initialized.asReadonly();

  constructor() {
    setApiAccessToken(undefined);
    this.themeService.applyDefaults();
    this.bootstrapPromise = this.bootstrap();
  }

  async ensureInitialized(): Promise<void> {
    await this.bootstrapPromise;
  }

  private async bootstrap() {
    if (this.initialized()) {
      return;
    }

    await this.syncAccessToken();
    await this.loadProviders();
    this.initialized.set(true);
  }

  private async syncAccessToken() {
    const currentUrl = new URL(window.location.href);
    const hasOAuthResponse =
      currentUrl.searchParams.has('code') ||
      currentUrl.searchParams.has('error') ||
      currentUrl.searchParams.has('error_description');

    try {
      if (hasOAuthResponse) {
        const tokens = await completeRedirectLogin();

        if (!tokens) {
          clearOAuthRequest();
          this.currentUser.set(null);
          this.themeService.applyDefaults();
          return;
        }

        saveTokens(tokens);
        setApiAccessToken(tokens.accessToken);
        await this.loadProfile();
        return;
      }

      const validAccessToken = await getValidAccessToken();

      if (!validAccessToken) {
        clearTokens();
        setApiAccessToken(undefined);
        this.currentUser.set(null);
        this.themeService.applyDefaults();
        return;
      }

      setApiAccessToken(validAccessToken);
      await this.loadProfile();
    } catch {
      clearTokens();
      setApiAccessToken(undefined);
      this.currentUser.set(null);
      this.themeService.applyDefaults();
    }
  }

  private async loadProviders() {
    const normalizeProvider = (provider: string) => {
      const value = provider.trim().toLowerCase();

      if (value.includes("google")) {
        return "google";
      }

      if (value.includes("github")) {
        return "github";
      }

      if (value.includes("discord")) {
        return "discord";
      }

      return value;
    };

    try {
      const response = await loginOptions({ throwOnError: true });
      const normalized = (response.data?.providers ?? []).map((provider) =>
        normalizeProvider(provider),
      );
      this.providerState.set([...new Set(normalized)]);
    } catch {
      this.providerState.set([]);
    }
  }

  private async loadProfile() {
    const profile = (await me({ throwOnError: true })).data;
    this.currentUser.set(profile ? mapApiUser(profile) : null);

    if (!profile) {
      this.themeService.applyDefaults();
      return;
    }

    try {
      const settings = (await getSettings({ throwOnError: true })).data;
      this.themeService.applyAccent(settings?.accentColor);
    } catch {
      this.themeService.applyDefaults();
    }
  }

  /**
   * Opens the auth page in-browser. This method is intentionally side-effect-only.
   */
  login(): void {
    window.location.assign('/auth');
  }

  async registerAccount(payload: RegisterPayload): Promise<void> {
    this.loadingState.set(true);

    try {
      await register({
        body: payload,
        throwOnError: true,
      });
    } finally {
      this.loadingState.set(false);
    }
  }

  async loginWithPassword(username: string, password: string): Promise<void> {
    this.loadingState.set(true);

    try {
      const tokens = await loginWithPassword(username, password);
      saveTokens(tokens);
      setApiAccessToken(tokens.accessToken);
      await this.loadProfile();
    } finally {
      this.loadingState.set(false);
    }
  }

  async updateDisplayName(displayName: string): Promise<void> {
    if (!this.isLoggedIn()) {
      throw new Error('Nicht angemeldet.');
    }

    this.loadingState.set(true);

    try {
      const response = await updateUsername({
        body: {
          username: displayName,
        },
        throwOnError: true,
      });

      if (response.data?.displayName || response.data?.preferredUsername) {
        this.currentUser.set({
          ...this.currentUser(),
          displayName: response.data?.displayName ?? response.data?.preferredUsername,
          preferredUsername: response.data?.preferredUsername,
        });
      }
    } finally {
      this.loadingState.set(false);
    }
  }

  async updateTagId(tagId: string): Promise<void> {
    if (!this.isLoggedIn()) {
      throw new Error('Nicht angemeldet.');
    }

    this.loadingState.set(true);

    try {
      const response = await updateTagId({
        body: {
          tagId,
        },
        throwOnError: true,
      });

      if (response.data?.tagId) {
        this.currentUser.set({
          ...this.currentUser(),
          tagId: response.data.tagId,
        });
      }
    } finally {
      this.loadingState.set(false);
    }
  }

  async saveProfile(options: {
    displayName?: string;
    tagId?: string;
  }): Promise<void> {
    this.loadingState.set(true);

    try {
      const currentDisplayName = this.user()?.displayName ?? '';
      const currentTagId = this.user()?.tagId ?? '';

      if (
        !this.isLoggedIn() ||
        (options.displayName === undefined && options.tagId === undefined)
      ) {
        return;
      }

      if (options.displayName !== undefined && options.displayName !== currentDisplayName) {
        await updateUsername({
          body: {
            username: options.displayName,
          },
          throwOnError: true,
        });
      }

      if (options.tagId !== undefined && options.tagId !== currentTagId) {
        await updateTagId({
          body: {
            tagId: options.tagId,
          },
          throwOnError: true,
        });
      }

      await this.loadProfile();
    } finally {
      this.loadingState.set(false);
    }
  }

  async logout(): Promise<void> {
    const storedToken = readTokens()?.accessToken;

    if (storedToken) {
      try {
        await apiLogout({
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          throwOnError: true,
        });
      } catch {
        // ignore backend errors if the session is already invalid.
      }
    }

    try {
      await startKeycloakLogout();
    } catch {
      await this.router.navigateByUrl('/');
    } finally {
      clearTokens();
      setApiAccessToken(undefined);
      this.currentUser.set(null);
      this.themeService.applyDefaults();
    }
  }

  startGoogleLogin() {
    return startGoogleLogin();
  }

  startGithubLogin() {
    return startGithubLogin();
  }

  startDiscordLogin() {
    return startDiscordLogin();
  }
}

export { normalizeLoginError };

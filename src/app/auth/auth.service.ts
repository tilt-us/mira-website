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
import { WallpaperService } from '../shared/wallpaper.service';
import { AuthUser, RegisterPayload } from './auth.types';
import {
  getSettings,
  loginOptions,
  logout as apiLogout,
  me,
  register,
  updateSettings,
  updateTagId,
  updateUsername,
} from '../../api/sdk.gen';

const OAUTH_ERROR_STORAGE_KEY = "mira.auth.oauthError";
const OAUTH_ERROR_REDIRECT_FLAG = "mira_error_redirected";

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
    return mapAuthErrorMessage(error.message);
  }

  if (typeof error === 'string') {
    return mapAuthErrorMessage(error);
  }

  return 'Unbekannter Fehler bitte erneut versuchen';
}

function mapAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('resource owner') ||
    lower.includes('resource_owner') ||
    lower.includes('resourceowner')
  ) {
    return 'Diese Email wird schon von einen Anderen Provider genutzt';
  }

  if (lower.includes('invalid user') || lower.includes('invalid password') || lower.includes('invalid credentials')) {
    return 'Fehler in deinen Anmeldedaten';
  }

  return 'Unbekannter Fehler bitte erneut versuchen';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly themeService = inject(ThemeService);
  private readonly wallpaperService = inject(WallpaperService);
  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly providerState = signal<string[]>([]);
  private readonly initialized = signal(false);
  private readonly loadingState = signal(false);
  private readonly loginPopupOpen = signal(false);
  private readonly bootstrapPromise: Promise<void>;
  private readonly router = inject(Router);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly providers = this.providerState.asReadonly();
  readonly initializedResult = this.initialized.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isInitialized = this.initialized.asReadonly();
  readonly isLoginPopupOpen = this.loginPopupOpen.asReadonly();

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
      currentUrl.searchParams.has('kc_error') ||
      currentUrl.searchParams.has('error') ||
      currentUrl.searchParams.has('error_description');
    const hasOAuthError =
      currentUrl.searchParams.has('kc_error') ||
      currentUrl.searchParams.has('error') ||
      currentUrl.searchParams.has('error_description');
    const hasHandledOAuthError = currentUrl.searchParams.get(OAUTH_ERROR_REDIRECT_FLAG) === '1';
    const returnToMainPage = () => {
      window.location.replace('/');
    };
    const returnToOAuthErrorPage = () => {
      const returnUrl = new URL("/", window.location.origin);
      const errorCode = currentUrl.searchParams.get('error');
      const errorDescription = currentUrl.searchParams.get('error_description');
      const kcError = currentUrl.searchParams.get('kc_error');

      if (errorCode) {
        returnUrl.searchParams.set('error', errorCode);
      }
      if (errorDescription) {
        returnUrl.searchParams.set('error_description', errorDescription);
      }
      returnUrl.searchParams.set('kc_error', kcError ?? '1');
      returnUrl.searchParams.set(OAUTH_ERROR_REDIRECT_FLAG, '1');
      window.location.replace(`${returnUrl.pathname}?${returnUrl.searchParams.toString()}`);
    };
    const resetOAuthUiState = () => {
      this.closeLoginPopup();
    };
    const persistOAuthError = () => {
      if (!hasOAuthError) {
        if (sessionStorage.getItem(OAUTH_ERROR_STORAGE_KEY)) {
          sessionStorage.removeItem(OAUTH_ERROR_STORAGE_KEY);
        }

        return;
      }

      const error = {
        kcError: currentUrl.searchParams.get('kc_error') === '1',
        code: currentUrl.searchParams.get('error'),
        description: currentUrl.searchParams.get('error_description'),
      };

      try {
        sessionStorage.setItem(OAUTH_ERROR_STORAGE_KEY, JSON.stringify(error));
      } catch {
        // ignore storage failures
      }
    };

    try {
      if (hasOAuthResponse) {
        resetOAuthUiState();
        persistOAuthError();

        if (hasOAuthError) {
          clearOAuthRequest();
          this.currentUser.set(null);
          this.themeService.applyDefaults();

          if (!hasHandledOAuthError) {
            returnToOAuthErrorPage();
          }

          return;
        }

        const tokens = await completeRedirectLogin();

        if (!tokens) {
          clearOAuthRequest();
          this.currentUser.set(null);
          this.themeService.applyDefaults();
          returnToMainPage();
          return;
        }

        saveTokens(tokens);
        setApiAccessToken(tokens.accessToken);
        await this.loadProfile();
        returnToMainPage();
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
      if (hasOAuthResponse) {
        persistOAuthError();
        returnToMainPage();
      }
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
      this.wallpaperService.setFromServer(settings?.background);
    } catch {
      this.themeService.applyDefaults();
    }
  }

  /**
   * Opens the auth page in-browser. This method is intentionally side-effect-only.
   */
  login(): void {
    this.openLoginPopup();
  }

  openLoginPopup(): void {
    this.loginPopupOpen.set(true);
  }

  closeLoginPopup(): void {
    this.loginPopupOpen.set(false);
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
    accentColor?: string;
    background?: string;
  }): Promise<void> {
    this.loadingState.set(true);

    try {
      const currentDisplayName = this.user()?.displayName ?? '';
      const currentTagId = this.user()?.tagId ?? '';

      if (
        !this.isLoggedIn() ||
        (options.displayName === undefined &&
          options.tagId === undefined &&
          options.accentColor === undefined &&
          options.background === undefined)
      ) {
        return;
      }

      const payload: { accentColor?: string; background?: string } = {};

      if (options.accentColor !== undefined) {
        payload.accentColor = options.accentColor;
      }

      if (options.background !== undefined) {
        payload.background = options.background;
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

      if (payload.accentColor !== undefined || payload.background !== undefined) {
        await updateSettings({
          body: payload,
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

export { mapAuthErrorMessage, normalizeLoginError };

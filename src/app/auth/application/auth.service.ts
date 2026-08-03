import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { setApiAccessToken } from '../../api-client';
import { ClientSettingsService } from '../../settings/application/client-settings.service';
import { AuthUser, RegisterPayload } from '../domain/models';
import { AUTH_API, IDENTITY_PROVIDER, TOKEN_STORAGE } from '../domain/ports';

const OAUTH_ERROR_STORAGE_KEY = "mira.auth.oauthError";
const OAUTH_ERROR_REDIRECT_FLAG = "mira_error_redirected";
function getLocationParams(url = window.location.href) {
  const currentUrl = new URL(url);
  const merged = new URLSearchParams(currentUrl.search);

  const hash = currentUrl.hash.startsWith("#")
    ? currentUrl.hash.substring(1)
    : currentUrl.hash;

  const hashParams = new URLSearchParams(hash);
  hashParams.forEach((value, key) => {
    if (!merged.has(key)) {
      merged.set(key, value);
    }
  });

  return merged;
}

function normalizeLoginError(error: unknown) {
  const fallbackMessage = 'Unbekannter Fehler bitte erneut versuchen';

  if (error instanceof Error) {
    const mapped = mapAuthErrorMessage(error.message);

    return mapped === fallbackMessage ? error.message : mapped;
  }

  if (typeof error === 'string') {
    const mapped = mapAuthErrorMessage(error);
    return mapped === fallbackMessage ? error : mapped;
  }

  return fallbackMessage;
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
  private readonly clientSettings = inject(ClientSettingsService);
  private readonly identityProvider = inject(IDENTITY_PROVIDER);
  private readonly tokenStorage = inject(TOKEN_STORAGE);
  private readonly authApi = inject(AUTH_API);
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
    this.clientSettings.reset();
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
    const currentParams = getLocationParams(window.location.href);
    const hasOAuthResponse =
      currentParams.has('code') ||
      currentParams.has('kc_error') ||
      currentParams.has('error') ||
      currentParams.has('error_description');
    const hasOAuthError =
      currentParams.has('kc_error') ||
      currentParams.has('error') ||
      currentParams.has('error_description');
    const hasHandledOAuthError = currentParams.get(OAUTH_ERROR_REDIRECT_FLAG) === '1';
    const returnToMainPage = () => {
      window.location.replace('/');
    };
    const returnToOAuthErrorPage = () => {
      const returnUrl = new URL("/", window.location.origin);
      const errorCode = currentParams.get('error');
      const errorDescription = currentParams.get('error_description');
      const kcError = currentParams.get('kc_error');

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
        kcError: currentParams.get('kc_error') === '1',
        code: currentParams.get('error'),
        description: currentParams.get('error_description'),
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
          this.tokenStorage.clearOAuthRequest();
          this.currentUser.set(null);
          this.clientSettings.reset();

          if (!hasHandledOAuthError) {
            returnToOAuthErrorPage();
          }

          return;
        }

        const tokens = await this.identityProvider.completeRedirectLogin();

        if (!tokens) {
          this.tokenStorage.clearOAuthRequest();
          this.currentUser.set(null);
          this.clientSettings.reset();
          returnToMainPage();
          return;
        }

        this.tokenStorage.saveTokens(tokens);
        setApiAccessToken(tokens.accessToken);
        await this.loadProfile();
        returnToMainPage();
        return;
      }

      const validAccessToken = await this.identityProvider.getValidAccessToken();

      if (!validAccessToken) {
        this.tokenStorage.clearTokens();
        setApiAccessToken(undefined);
        this.currentUser.set(null);
        this.clientSettings.reset();
        return;
      }

      setApiAccessToken(validAccessToken);
      await this.loadProfile();
    } catch {
      this.tokenStorage.clearTokens();
      setApiAccessToken(undefined);
      this.currentUser.set(null);
      this.clientSettings.reset();
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
      const providers = await this.authApi.fetchLoginProviders();
      const normalized = providers.map((provider) => normalizeProvider(provider));
      this.providerState.set([...new Set(normalized)]);
    } catch {
      this.providerState.set([]);
    }
  }

  private async loadProfile() {
    const user = await this.authApi.fetchProfile();
    this.currentUser.set(user);

    if (!user) {
      this.clientSettings.reset();
      return;
    }

    await this.clientSettings.load();
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
      await this.authApi.register(payload);
    } finally {
      this.loadingState.set(false);
    }
  }

  async loginWithPassword(username: string, password: string): Promise<void> {
    this.loadingState.set(true);

    try {
      const tokens = await this.identityProvider.loginWithPassword(username, password);
      this.tokenStorage.saveTokens(tokens);
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
      const result = await this.authApi.updateDisplayName(displayName);

      if (result?.displayName || result?.preferredUsername) {
        this.currentUser.set({
          ...this.currentUser(),
          displayName: result.displayName ?? result.preferredUsername,
          preferredUsername: result.preferredUsername,
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
      const result = await this.authApi.updateTagId(tagId);

      if (result?.tagId) {
        this.currentUser.set({
          ...this.currentUser(),
          tagId: result.tagId,
        });
      }
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Persists the identity fields. Display name and tag id live behind their own
   * endpoints; everything else the settings page offers belongs to
   * {@link ClientSettingsService}.
   */
  async saveProfile(options: { displayName?: string; tagId?: string }): Promise<void> {
    if (!this.isLoggedIn()) {
      throw new Error('Nicht angemeldet.');
    }

    const currentDisplayName = this.user()?.displayName ?? '';
    const currentTagId = this.user()?.tagId ?? '';
    const nextDisplayName =
      options.displayName !== undefined && options.displayName !== currentDisplayName
        ? options.displayName
        : undefined;
    const nextTagId =
      options.tagId !== undefined && options.tagId !== currentTagId ? options.tagId : undefined;

    if (nextDisplayName === undefined && nextTagId === undefined) {
      return;
    }

    this.loadingState.set(true);

    try {
      if (nextDisplayName !== undefined) {
        await this.authApi.updateDisplayName(nextDisplayName);
      }

      if (nextTagId !== undefined) {
        await this.authApi.updateTagId(nextTagId);
      }

      await this.loadProfile();
    } finally {
      this.loadingState.set(false);
    }
  }

  /** Confirms that the user holds the rights to their avatar image. */
  async confirmAvatarRights(): Promise<void> {
    this.loadingState.set(true);

    try {
      await this.authApi.confirmAvatarRights();
      await this.loadProfile();
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Hands the password change to Keycloak (application-initiated action).
   * Passwords never pass through the website, and accounts that only exist
   * through an identity provider get their credential set up there.
   */
  startPasswordUpdate() {
    return this.identityProvider.startAccountAction('UPDATE_PASSWORD');
  }

  async logout(): Promise<void> {
    const storedToken = this.tokenStorage.readTokens()?.accessToken;

    if (storedToken) {
      try {
        await this.authApi.logout(storedToken);
      } catch {
        // ignore backend errors if the session is already invalid.
      }
    }

    try {
      await this.identityProvider.startKeycloakLogout();
    } catch {
      await this.router.navigateByUrl('/');
    } finally {
      this.tokenStorage.clearTokens();
      setApiAccessToken(undefined);
      this.currentUser.set(null);
      this.clientSettings.reset();
    }
  }

  startGoogleLogin(linkExisting = false) {
    return this.identityProvider.startGoogleLogin(
      linkExisting
        ? { kcAction: "idp_link:google" }
        : undefined,
    );
  }

  startGithubLogin(linkExisting = false) {
    return this.identityProvider.startGithubLogin(
      linkExisting
        ? { kcAction: "idp_link:github" }
        : undefined,
    );
  }

  startDiscordLogin(linkExisting = false) {
    return this.identityProvider.startDiscordLogin(
      linkExisting
        ? { kcAction: "idp_link:discord" }
        : undefined,
    );
  }
}

export { mapAuthErrorMessage, normalizeLoginError };

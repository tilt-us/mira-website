import { InjectionToken } from '@angular/core';

import { AuthUser, RegisterPayload } from './models';
import type { AuthTokens } from '../adapters/identity/storage';
import { createIdentityProvider } from '../adapters/identity/keycloak-identity.adapter';
import { createTokenStorage } from '../adapters/identity/token-storage.adapter';
import { createAuthApi } from '../adapters/identity/auth-api.adapter';

export type OAuthLoginOptions = { kcAction?: string };

/** Outbound port: the Keycloak identity provider (OAuth/OIDC flows). */
export interface IdentityProviderPort {
  completeRedirectLogin(): Promise<AuthTokens | undefined>;
  getValidAccessToken(): Promise<string | undefined>;
  loginWithPassword(username: string, password: string): Promise<AuthTokens>;
  startAccountAction(kcAction: string): Promise<void>;
  startGoogleLogin(options?: OAuthLoginOptions): Promise<void>;
  startGithubLogin(options?: OAuthLoginOptions): Promise<void>;
  startDiscordLogin(options?: OAuthLoginOptions): Promise<void>;
  startKeycloakLogout(): Promise<void>;
}

/** Outbound port: persistence of tokens and the pending OAuth request. */
export interface TokenStoragePort {
  saveTokens(tokens: AuthTokens): void;
  readTokens(): AuthTokens | undefined;
  clearTokens(): void;
  clearOAuthRequest(): void;
}

/** Outbound port: the backend account API, mapped onto domain models. */
export interface AuthApiPort {
  fetchLoginProviders(): Promise<string[]>;
  fetchProfile(): Promise<AuthUser | null>;
  register(payload: RegisterPayload): Promise<void>;
  updateDisplayName(
    displayName: string,
  ): Promise<Pick<AuthUser, 'displayName' | 'preferredUsername'> | undefined>;
  updateTagId(tagId: string): Promise<Pick<AuthUser, 'tagId'> | undefined>;
  confirmAvatarRights(): Promise<void>;
  logout(accessToken: string): Promise<void>;
}

export const IDENTITY_PROVIDER = new InjectionToken<IdentityProviderPort>(
  'IDENTITY_PROVIDER',
  { providedIn: 'root', factory: createIdentityProvider },
);

export const TOKEN_STORAGE = new InjectionToken<TokenStoragePort>('TOKEN_STORAGE', {
  providedIn: 'root',
  factory: createTokenStorage,
});

export const AUTH_API = new InjectionToken<AuthApiPort>('AUTH_API', {
  providedIn: 'root',
  factory: createAuthApi,
});

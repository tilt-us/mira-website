import { computed, Injectable, signal } from '@angular/core';

import { AuthUser } from './auth.types';

/**
 * Placeholder identity used until real authentication is wired up.
 *
 * The real flow (to be implemented by the lead dev) is Keycloak Authorization
 * Code + PKCE against the `mira-web` public client at
 * `https://api.tilt-us.com/keycloak` (realm `mira`). Note: that client must
 * first have `https://tilt-us.com/*` and the dev origin added to its redirect
 * URIs / web origins in mira-service before browser login can succeed.
 *
 * Syncing the session from the desktop client is intentionally NOT handled
 * here: the client keeps its tokens in an isolated Tauri webview, so there is
 * no shared cookie or storage the website could read — it needs backend support
 * (token hand-off or deep link).
 */
const MOCK_USER: AuthUser = {
  displayName: 'Mira Player',
  email: 'player@tilt-us.com',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUser = signal<AuthUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  /** Mock sign-in; the real flow redirects to Keycloak (mira-web, PKCE). */
  login(): void {
    this.currentUser.set(MOCK_USER);
  }

  logout(): void {
    this.currentUser.set(null);
  }
}

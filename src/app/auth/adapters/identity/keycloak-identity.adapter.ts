import {
  completeRedirectLogin,
  getValidAccessToken,
  loginWithPassword,
  startAccountAction,
  startDiscordLogin,
  startGithubLogin,
  startGoogleLogin,
  startKeycloakLogout,
} from './keycloak';
import type { IdentityProviderPort } from '../../domain/ports';

/** Outbound adapter: the Keycloak OAuth/OIDC flows, behind the identity port. */
export function createIdentityProvider(): IdentityProviderPort {
  return {
    completeRedirectLogin: async () => completeRedirectLogin(),
    getValidAccessToken: () => getValidAccessToken(),
    loginWithPassword: (username, password) => loginWithPassword(username, password),
    startAccountAction: (kcAction) => startAccountAction(kcAction),
    startGoogleLogin: (options) => startGoogleLogin(options),
    startGithubLogin: (options) => startGithubLogin(options),
    startDiscordLogin: (options) => startDiscordLogin(options),
    startKeycloakLogout: () => startKeycloakLogout(),
  };
}

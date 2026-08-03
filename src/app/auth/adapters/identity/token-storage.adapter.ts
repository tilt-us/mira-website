import { clearOAuthRequest, clearTokens, readTokens, saveTokens } from './storage';
import type { TokenStoragePort } from '../../domain/ports';

/** Outbound adapter: token + OAuth-request persistence, behind the storage port. */
export function createTokenStorage(): TokenStoragePort {
  return {
    saveTokens: (tokens) => saveTokens(tokens),
    readTokens: () => readTokens(),
    clearTokens: () => clearTokens(),
    clearOAuthRequest: () => clearOAuthRequest(),
  };
}

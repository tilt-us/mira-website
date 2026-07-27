import {
  confirmAvatarRights,
  loginOptions,
  logout as apiLogout,
  me,
  register,
  updateTagId,
  updateUsername,
} from '../../../../api/sdk.gen';
import { AuthUser } from '../../domain/models';
import type { AuthApiPort } from '../../domain/ports';

/** Maps a backend profile onto the domain {@link AuthUser}. */
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

/** Outbound adapter: the backend account API, behind the auth-api port. */
export function createAuthApi(): AuthApiPort {
  return {
    fetchLoginProviders: async () =>
      (await loginOptions({ throwOnError: true })).data?.providers ?? [],

    fetchProfile: async () => {
      const profile = (await me({ throwOnError: true })).data;
      return profile ? mapApiUser(profile) : null;
    },

    register: async (payload) => {
      await register({ body: payload, throwOnError: true });
    },

    updateDisplayName: async (displayName) => {
      const data = (await updateUsername({
        body: { username: displayName },
        throwOnError: true,
      })).data;
      return data
        ? { displayName: data.displayName, preferredUsername: data.preferredUsername }
        : undefined;
    },

    updateTagId: async (tagId) => {
      const data = (await updateTagId({ body: { tagId }, throwOnError: true })).data;
      return data ? { tagId: data.tagId } : undefined;
    },

    confirmAvatarRights: async () => {
      await confirmAvatarRights({ throwOnError: true });
    },

    logout: async (accessToken) => {
      await apiLogout({
        headers: { Authorization: `Bearer ${accessToken}` },
        throwOnError: true,
      });
    },
  };
}

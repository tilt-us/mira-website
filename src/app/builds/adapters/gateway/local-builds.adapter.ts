import type { Build } from '../../domain/models';
import type { BuildsGateway } from '../../domain/ports';
import { COMMUNITY_BUILDS } from './sample-builds';

const OWN_BUILDS_KEY = 'mira.builds.own';

function readStoredBuilds(): readonly Build[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(OWN_BUILDS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Build[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(OWN_BUILDS_KEY);
    return [];
  }
}

/**
 * Outbound adapter used until a builds backend exists: community builds come
 * from the curated sample set, own builds live in local storage so creating,
 * editing and publishing already work end-to-end.
 */
export function createLocalBuildsGateway(): BuildsGateway {
  return {
    listCommunity: async () => COMMUNITY_BUILDS,
    listOwn: async () => readStoredBuilds(),
    replaceOwn: async (builds) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(OWN_BUILDS_KEY, JSON.stringify(builds));
      }
    },
  };
}

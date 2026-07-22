import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';

import { COMMUNITY_BUILDS } from './builds.data';
import { Build, BuildDraft, BuildRole, BuildSort } from './builds.types';

const OWN_BUILDS_KEY = 'mira.builds.own';

/**
 * The build reads and writes the page needs, injected so tests can stand in for
 * them and so the mock source can be swapped for the real endpoints once the
 * backend exposes builds.
 */
export interface BuildsApi {
  listCommunity(): Promise<readonly Build[]>;
  listOwn(): Promise<readonly Build[]>;
  replaceOwn(builds: readonly Build[]): Promise<void>;
}

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

export const BUILDS_API = new InjectionToken<BuildsApi>('BUILDS_API', {
  providedIn: 'root',
  factory: () => ({
    listCommunity: async () => COMMUNITY_BUILDS,
    listOwn: async () => readStoredBuilds(),
    replaceOwn: async (builds) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(OWN_BUILDS_KEY, JSON.stringify(builds));
      }
    },
  }),
});

export interface BuildFilter {
  query: string;
  role: BuildRole | 'all';
  sort: BuildSort;
}

/** Case-insensitive match across the fields a player would search by. */
function matchesQuery(build: Build, query: string): boolean {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  const haystack = [build.title, build.author, build.championId, build.role, ...build.tags]
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

/** Pure search/sort used by both build lists, kept outside the service to test in isolation. */
export function filterBuilds(builds: readonly Build[], filter: BuildFilter): readonly Build[] {
  const matched = builds.filter(
    (build) =>
      matchesQuery(build, filter.query) && (filter.role === 'all' || build.role === filter.role),
  );

  return [...matched].sort((a, b) =>
    filter.sort === 'popular' ? b.votes - a.votes : b.updatedAt.localeCompare(a.updatedAt),
  );
}

/**
 * Owns both halves of the Builds page: the read-only community list and the
 * builds the signed-in player created themselves. Own builds live in local
 * storage until a backend exists, so creating and editing already works
 * end-to-end without one.
 */
@Injectable({ providedIn: 'root' })
export class BuildsService {
  private readonly api = inject(BUILDS_API);
  private readonly communityBuilds = signal<readonly Build[]>([]);
  private readonly ownBuilds = signal<readonly Build[]>([]);
  private readonly loading = signal(false);

  readonly community = this.communityBuilds.asReadonly();
  readonly own = this.ownBuilds.asReadonly();
  readonly isLoading = this.loading.asReadonly();

  /** Published own builds appear alongside the community ones. */
  readonly publishedCommunity = computed(() => [
    ...this.communityBuilds(),
    ...this.ownBuilds().filter((build) => build.published),
  ]);

  async load(): Promise<void> {
    this.loading.set(true);

    try {
      const [community, own] = await Promise.all([this.api.listCommunity(), this.api.listOwn()]);
      this.communityBuilds.set(community);
      this.ownBuilds.set(own);
    } catch {
      this.communityBuilds.set([]);
      this.ownBuilds.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async create(draft: BuildDraft, author: string): Promise<Build> {
    const build: Build = {
      ...draft,
      id: `own-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      votes: 0,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    await this.persist([...this.ownBuilds(), build]);
    return build;
  }

  async update(id: string, draft: BuildDraft): Promise<void> {
    await this.persist(
      this.ownBuilds().map((build) =>
        build.id === id
          ? { ...build, ...draft, updatedAt: new Date().toISOString().slice(0, 10) }
          : build,
      ),
    );
  }

  async remove(id: string): Promise<void> {
    await this.persist(this.ownBuilds().filter((build) => build.id !== id));
  }

  async setPublished(id: string, published: boolean): Promise<void> {
    await this.persist(
      this.ownBuilds().map((build) => (build.id === id ? { ...build, published } : build)),
    );
  }

  private async persist(builds: readonly Build[]): Promise<void> {
    this.ownBuilds.set(builds);
    await this.api.replaceOwn(builds);
  }
}

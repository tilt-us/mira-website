import { computed, inject, Injectable, signal } from '@angular/core';

import { Build, BuildDraft, BuildRole, BuildSort } from '../domain/models';
import { BUILDS_GATEWAY } from '../domain/ports';

export interface BuildFilter {
  query: string;
  /** A champion id, or `'all'` to keep every character. */
  championId: string | 'all';
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

/** Pure search/sort used by the community list, kept outside the service to test in isolation. */
export function filterBuilds(builds: readonly Build[], filter: BuildFilter): readonly Build[] {
  const matched = builds.filter(
    (build) =>
      matchesQuery(build, filter.query) &&
      (filter.championId === 'all' || build.championId === filter.championId) &&
      (filter.role === 'all' || build.role === filter.role),
  );

  return [...matched].sort((a, b) =>
    filter.sort === 'popular' ? b.votes - a.votes : b.updatedAt.localeCompare(a.updatedAt),
  );
}

/**
 * Owns both halves of the Builds feature: the read-only community list and the
 * builds the signed-in player created themselves. Own builds are persisted
 * through the gateway (local storage for now), so creating and editing works
 * without a backend.
 */
@Injectable({ providedIn: 'root' })
export class BuildsService {
  private readonly gateway = inject(BUILDS_GATEWAY);
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
      const [community, own] = await Promise.all([
        this.gateway.listCommunity(),
        this.gateway.listOwn(),
      ]);
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
    await this.gateway.replaceOwn(builds);
  }
}

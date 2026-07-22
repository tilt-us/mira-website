import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Reveal } from '../../shared/reveal';
import { BuildCard } from '../build-card/build-card';
import { BuildsService, filterBuilds } from '../builds.service';
import { BUILD_ROLES, BuildRole, BuildSort } from '../builds.types';

/** Search and browse the builds other players published. */
@Component({
  selector: 'app-community-builds',
  imports: [FormsModule, BuildCard, Reveal],
  templateUrl: './community-builds.html',
})
export class CommunityBuilds {
  private readonly builds = inject(BuildsService);

  protected readonly roles = BUILD_ROLES;
  protected readonly isLoading = this.builds.isLoading;

  protected readonly query = signal('');
  protected readonly role = signal<BuildRole | 'all'>('all');
  protected readonly sort = signal<BuildSort>('popular');

  protected readonly results = computed(() =>
    filterBuilds(this.builds.publishedCommunity(), {
      query: this.query(),
      role: this.role(),
      sort: this.sort(),
    }),
  );

  constructor() {
    void this.builds.load();
  }

  protected resetFilters(): void {
    this.query.set('');
    this.role.set('all');
    this.sort.set('popular');
  }
}

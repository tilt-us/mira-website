import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Reveal } from '../../../../shared/reveal';
import { BuildCard } from '../build-card/build-card';
import { CHAMPIONS } from '../../../domain/catalog';
import { BUILD_ROLES, BuildRole, BuildSort } from '../../../domain/models';
import { BuildsService, filterBuilds } from '../../../application/builds.service';

/** Search and browse the builds other players published. */
@Component({
  selector: 'app-community-builds',
  imports: [FormsModule, BuildCard, Reveal],
  templateUrl: './community-builds.html',
})
export class CommunityBuilds {
  private readonly builds = inject(BuildsService);

  protected readonly champions = CHAMPIONS;
  protected readonly roles = BUILD_ROLES;
  protected readonly isLoading = this.builds.isLoading;

  protected readonly query = signal('');
  protected readonly championId = signal<string | 'all'>('all');
  protected readonly role = signal<BuildRole | 'all'>('all');
  protected readonly sort = signal<BuildSort>('popular');

  protected readonly results = computed(() =>
    filterBuilds(this.builds.publishedCommunity(), {
      query: this.query(),
      championId: this.championId(),
      role: this.role(),
      sort: this.sort(),
    }),
  );

  constructor() {
    void this.builds.load();
  }

  protected resetFilters(): void {
    this.query.set('');
    this.championId.set('all');
    this.role.set('all');
    this.sort.set('popular');
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { Reveal } from '../../shared/reveal';
import { BuildCard } from '../build-card/build-card';
import { BuildsService } from '../builds.service';
import { CHAMPIONS, championById, ITEMS } from '../builds.data';
import { Build, BUILD_ROLES, BuildDraft, BuildRole, SKILL_SLOTS, SkillSlot } from '../builds.types';

/** Blank form state; also what "cancel" returns to. */
function emptyDraft(): BuildDraft {
  return {
    title: '',
    championId: CHAMPIONS[0].id,
    role: CHAMPIONS[0].role,
    itemIds: [],
    skillOrder: [],
    summary: '',
    tags: [],
    published: false,
  };
}

/** Create, edit and publish the builds belonging to the signed-in player. */
@Component({
  selector: 'app-my-builds',
  imports: [FormsModule, BuildCard, Reveal],
  templateUrl: './my-builds.html',
})
export class MyBuilds {
  private readonly builds = inject(BuildsService);
  protected readonly auth = inject(AuthService);

  protected readonly champions = CHAMPIONS;
  protected readonly items = ITEMS;
  protected readonly roles = BUILD_ROLES;
  protected readonly skillSlots = SKILL_SLOTS;

  protected readonly own = this.builds.own;
  protected readonly isLoading = this.builds.isLoading;

  protected readonly formOpen = signal(false);
  /** Set while editing an existing build, `null` while creating a new one. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly draft = signal<BuildDraft>(emptyDraft());
  protected readonly tagInput = signal('');
  protected readonly error = signal('');

  protected readonly publishedCount = computed(
    () => this.own().filter((build) => build.published).length,
  );

  constructor() {
    void this.builds.load();
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.draft.set(emptyDraft());
    this.tagInput.set('');
    this.error.set('');
    this.formOpen.set(true);
  }

  protected openEdit(build: Build): void {
    this.editingId.set(build.id);
    this.draft.set({
      title: build.title,
      championId: build.championId,
      role: build.role,
      itemIds: [...build.itemIds],
      skillOrder: [...build.skillOrder],
      summary: build.summary,
      tags: [...build.tags],
      published: build.published,
    });
    this.tagInput.set(build.tags.join(', '));
    this.error.set('');
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  protected setTitle(title: string): void {
    this.draft.update((draft) => ({ ...draft, title }));
  }

  protected setSummary(summary: string): void {
    this.draft.update((draft) => ({ ...draft, summary }));
  }

  /** Picking a champion pre-selects its default role; the role stays editable. */
  protected setChampion(championId: string): void {
    const role = championById(championId)?.role;
    this.draft.update((draft) => ({ ...draft, championId, role: role ?? draft.role }));
  }

  protected setRole(role: BuildRole): void {
    this.draft.update((draft) => ({ ...draft, role }));
  }

  protected setPublished(published: boolean): void {
    this.draft.update((draft) => ({ ...draft, published }));
  }

  /** Tags are typed as one comma-separated field and normalised on save. */
  protected setTags(value: string): void {
    this.tagInput.set(value);
    this.draft.update((draft) => ({
      ...draft,
      tags: value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    }));
  }

  protected isItemSelected(itemId: string): boolean {
    return this.draft().itemIds.includes(itemId);
  }

  /** Item order is the buy order, so a re-picked item moves to the end. */
  protected toggleItem(itemId: string): void {
    this.draft.update((draft) => ({
      ...draft,
      itemIds: draft.itemIds.includes(itemId)
        ? draft.itemIds.filter((id) => id !== itemId)
        : [...draft.itemIds, itemId],
    }));
  }

  protected addSkill(slot: SkillSlot): void {
    this.draft.update((draft) => ({ ...draft, skillOrder: [...draft.skillOrder, slot] }));
  }

  protected undoSkill(): void {
    this.draft.update((draft) => ({ ...draft, skillOrder: draft.skillOrder.slice(0, -1) }));
  }

  protected clearSkills(): void {
    this.draft.update((draft) => ({ ...draft, skillOrder: [] }));
  }

  protected async save(): Promise<void> {
    const draft = this.draft();

    if (!draft.title.trim()) {
      this.error.set('Give your build a title.');
      return;
    }

    if (draft.itemIds.length === 0) {
      this.error.set('Pick at least one item.');
      return;
    }

    const editingId = this.editingId();

    if (editingId) {
      await this.builds.update(editingId, draft);
    } else {
      await this.builds.create(draft, this.authorName());
    }

    this.closeForm();
  }

  protected async remove(build: Build): Promise<void> {
    await this.builds.remove(build.id);
  }

  protected async togglePublished(build: Build): Promise<void> {
    await this.builds.setPublished(build.id, !build.published);
  }

  protected login(): void {
    this.auth.openLoginPopup();
  }

  private authorName(): string {
    const user = this.auth.user();
    return user?.displayName || user?.preferredUsername || 'Anonymous';
  }
}

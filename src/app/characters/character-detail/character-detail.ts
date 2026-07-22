import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

import { Reveal } from '../../shared/reveal';
import { CharactersService } from '../characters.service';
import { PLACEHOLDER_NOTICE } from '../characters.data';
import { Character, STAT_MAX } from '../characters.types';

export type CharacterTab = 'story' | 'stats';

@Component({
  selector: 'app-character-detail',
  imports: [Reveal, RouterLink],
  templateUrl: './character-detail.html',
})
export class CharacterDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly charactersService = inject(CharactersService);

  protected readonly notice = PLACEHOLDER_NOTICE;
  protected readonly statMax = STAT_MAX;

  // Reacts to the route param rather than reading the snapshot, so navigating
  // between two characters reuses the component correctly.
  private readonly character = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => this.charactersService.getCharacter(params.get('id') ?? '')),
    ),
    { initialValue: undefined as Character | undefined },
  );

  protected readonly activeTab = signal<CharacterTab>('story');

  protected readonly found = computed(() => this.character() !== undefined);

  /** Non-null accessor for the template, which only renders it once found. */
  protected readonly current = computed(() => this.character() as Character);

  protected selectTab(tab: CharacterTab): void {
    this.activeTab.set(tab);
  }

  /** Bar width for a stat rating, as a CSS percentage string. */
  protected statWidth(value: number): string {
    const clamped = Math.min(Math.max(value, 0), STAT_MAX);
    return `${(clamped / STAT_MAX) * 100}%`;
  }

  protected difficultyLabel(difficulty: number): string {
    switch (difficulty) {
      case 1:
        return 'Low';
      case 2:
        return 'Moderate';
      default:
        return 'High';
    }
  }
}

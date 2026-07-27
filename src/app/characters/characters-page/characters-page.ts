import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Reveal } from '../../shared/reveal';
import { CharactersService } from '../characters.service';
import { PLACEHOLDER_NOTICE } from '../characters.data';
import { Character, STAT_MAX } from '../characters.types';

/** The lower panel shows either the ability kit or the character's lore. */
export type CharacterView = 'abilities' | 'lore';

@Component({
  selector: 'app-characters-page',
  imports: [Reveal],
  templateUrl: './characters-page.html',
})
export class CharactersPage {
  private readonly charactersService = inject(CharactersService);

  protected readonly notice = PLACEHOLDER_NOTICE;
  protected readonly statMax = STAT_MAX;

  protected readonly characters = toSignal(this.charactersService.getCharacters(), {
    initialValue: [] as Character[],
  });

  // Position of the character on display within the roster.
  protected readonly selectedIndex = signal(0);

  // Undefined only while the roster is empty; the template guards on it.
  protected readonly selected = computed<Character | undefined>(
    () => this.characters()[this.selectedIndex()],
  );

  protected readonly activeView = signal<CharacterView>('abilities');

  /** Jumps straight to a character picked from the selector. */
  protected select(index: number): void {
    this.selectedIndex.set(index);
  }

  /** Steps to another character, wrapping around either end of the roster. */
  protected change(step: number): void {
    const count = this.characters().length;
    if (count === 0) {
      return;
    }
    this.selectedIndex.update((index) => (index + step + count) % count);
  }

  protected showView(view: CharacterView): void {
    this.activeView.set(view);
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

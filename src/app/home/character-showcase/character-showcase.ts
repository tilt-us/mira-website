import { Component, computed, input, signal } from '@angular/core';

export interface ShowcaseCharacter {
  id: string;
  name: string;
  epithet: string;
  description: string;
  image: string;
}

@Component({
  selector: 'app-character-showcase',
  templateUrl: './character-showcase.html',
})
export class CharacterShowcase {
  readonly characters = input.required<readonly ShowcaseCharacter[]>();

  // Falls back to the first character until the user picks one.
  private readonly selectedId = signal<string | null>(null);

  protected readonly selected = computed(() => {
    const characters = this.characters();
    return characters.find((c) => c.id === this.selectedId()) ?? characters[0];
  });

  protected select(id: string): void {
    this.selectedId.set(id);
  }
}

import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CharactersService } from './characters.service';
import { CHARACTERS } from './characters.data';
import { STAT_MAX } from './characters.types';

function service(): CharactersService {
  TestBed.configureTestingModule({});
  return TestBed.inject(CharactersService);
}

describe('CharactersService', () => {
  it('emits the whole roster', async () => {
    const characters = await firstValueFrom(service().getCharacters());

    expect(characters).toEqual(CHARACTERS);
  });

  it('looks a character up by its id', async () => {
    const character = await firstValueFrom(service().getCharacter('ignara'));

    expect(character?.name).toBe('Ignara');
  });

  it('emits undefined for an unknown id', async () => {
    const character = await firstValueFrom(service().getCharacter('nobody'));

    expect(character).toBeUndefined();
  });
});

describe('CHARACTERS data', () => {
  it('uses unique ids', () => {
    const ids = CHARACTERS.map((character) => character.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every character story text, stats and abilities', () => {
    for (const character of CHARACTERS) {
      expect(character.story.length).toBeGreaterThan(0);
      expect(character.stats.length).toBeGreaterThan(0);
      expect(character.abilities.length).toBeGreaterThan(0);
    }
  });

  it('keeps every stat rating inside the 0..STAT_MAX range the bars assume', () => {
    for (const character of CHARACTERS) {
      for (const stat of character.stats) {
        expect(stat.value).toBeGreaterThanOrEqual(0);
        expect(stat.value).toBeLessThanOrEqual(STAT_MAX);
      }
    }
  });

  it('keeps the difficulty inside the range the characters page labels', () => {
    for (const character of CHARACTERS) {
      expect(character.difficulty).toBeGreaterThanOrEqual(1);
      expect(character.difficulty).toBeLessThanOrEqual(3);
    }
  });

  it('binds each ability to a distinct slot', () => {
    for (const character of CHARACTERS) {
      const slots = character.abilities.map((ability) => ability.slot);
      expect(new Set(slots).size).toBe(slots.length);
    }
  });
});

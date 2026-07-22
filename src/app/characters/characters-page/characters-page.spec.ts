import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CharactersPage } from './characters-page';
import { CharactersService } from '../characters.service';
import { Character } from '../characters.types';

const ROSTER: Character[] = [
  {
    id: 'ignara',
    name: 'Ignara',
    epithet: 'The Flameheart',
    role: 'Duelist',
    difficulty: 2,
    tagline: 'Burns brighter the longer a fight goes on.',
    image: '/ignara-wallpaper.png',
    story: ['Story paragraph.'],
    stats: [{ label: 'Damage', value: 9 }],
    abilities: [{ slot: 'Q', name: 'Not announced', description: 'Hidden.', cooldown: '—' }],
  },
  {
    id: 'sophia',
    name: 'Sophia',
    epithet: 'The Lightbringer',
    role: 'Guardian',
    difficulty: 1,
    tagline: 'Shields the team.',
    image: '/sophia-wallpaper.png',
    story: ['Story paragraph.'],
    stats: [{ label: 'Defence', value: 9 }],
    abilities: [{ slot: 'Q', name: 'Not announced', description: 'Hidden.', cooldown: '—' }],
  },
  {
    id: 'yuna',
    name: 'Yuna',
    epithet: 'The Stormcaller',
    role: 'Duelist',
    difficulty: 2,
    tagline: 'Controls space from afar.',
    image: '/yuna-wallpaper.png',
    story: ['Story paragraph.'],
    stats: [{ label: 'Damage', value: 8 }],
    abilities: [{ slot: 'Q', name: 'Not announced', description: 'Hidden.', cooldown: '—' }],
  },
];

function setup(roster: Character[] = ROSTER): ComponentFixture<CharactersPage> {
  TestBed.configureTestingModule({
    imports: [CharactersPage],
    providers: [
      provideRouter([]),
      { provide: CharactersService, useValue: { getCharacters: () => of(roster) } },
    ],
  });
  const fixture = TestBed.createComponent(CharactersPage);
  fixture.detectChanges();
  return fixture;
}

function cards(fixture: ComponentFixture<CharactersPage>): HTMLAnchorElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="character-card"]'));
}

function filters(fixture: ComponentFixture<CharactersPage>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="role-filter"]'));
}

describe('CharactersPage', () => {
  it('renders the roster hero and a card per character', () => {
    const fixture = setup();
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('The roster');
    expect(cards(fixture).length).toBe(ROSTER.length);
    for (const character of ROSTER) {
      expect(text).toContain(character.name);
      expect(text).toContain(character.epithet);
      expect(text).toContain(character.tagline);
    }
  });

  it('links every card to the character detail route', () => {
    const fixture = setup();

    expect(cards(fixture).map((card) => card.getAttribute('href'))).toEqual([
      '/characters/ignara',
      '/characters/sophia',
      '/characters/yuna',
    ]);
  });

  it('marks the bundled copy as placeholder content', () => {
    const fixture = setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="placeholder-notice"]').textContent,
    ).toContain('placeholder');
  });

  it('derives the role filters from the roster without duplicates', () => {
    const fixture = setup();

    expect(filters(fixture).map((button) => button.textContent?.trim())).toEqual([
      'All',
      'Duelist',
      'Guardian',
    ]);
  });

  it('starts on the unfiltered roster', () => {
    const fixture = setup();

    expect(filters(fixture)[0].getAttribute('aria-pressed')).toBe('true');
    expect(cards(fixture).length).toBe(ROSTER.length);
  });

  it('narrows the roster to the selected role', () => {
    const fixture = setup();

    filters(fixture)[2].click();
    fixture.detectChanges();

    expect(cards(fixture).length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Sophia');
    expect(fixture.nativeElement.textContent).not.toContain('Ignara');
    expect(
      fixture.nativeElement.querySelector('[data-testid="character-count"]').textContent,
    ).toContain('1 characters');
  });

  it('returns to the full roster when All is selected again', () => {
    const fixture = setup();

    filters(fixture)[2].click();
    fixture.detectChanges();
    filters(fixture)[0].click();
    fixture.detectChanges();

    expect(cards(fixture).length).toBe(ROSTER.length);
  });

  it('shows an empty state when the roster is empty', () => {
    const fixture = setup([]);

    expect(cards(fixture).length).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="empty-roster"]')).not.toBeNull();
  });
});

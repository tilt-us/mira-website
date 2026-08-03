import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    story: ['Ignara paragraph one.', 'Ignara paragraph two.'],
    stats: [
      { label: 'Damage', value: 9 },
      { label: 'Defence', value: 5 },
    ],
    abilities: [
      { slot: 'Passive', name: 'Ember', description: 'Passive text.', cooldown: '—' },
      { slot: 'Q', name: 'Spark', description: 'Q text.', cooldown: '6s' },
    ],
  },
  {
    id: 'sophia',
    name: 'Sophia',
    epithet: 'The Lightbringer',
    role: 'Guardian',
    difficulty: 1,
    tagline: 'Shields the team.',
    image: '/sophia-wallpaper.png',
    story: ['Sophia paragraph one.'],
    stats: [{ label: 'Defence', value: 9 }],
    abilities: [{ slot: 'Passive', name: 'Aegis', description: 'Passive text.', cooldown: '—' }],
  },
  {
    id: 'yuna',
    name: 'Yuna',
    epithet: 'The Stormcaller',
    role: 'Controller',
    difficulty: 3,
    tagline: 'Controls space from afar.',
    image: '/yuna-wallpaper.png',
    story: ['Yuna paragraph one.'],
    stats: [{ label: 'Damage', value: 8 }],
    abilities: [{ slot: 'Passive', name: 'Gale', description: 'Passive text.', cooldown: '—' }],
  },
];

function setup(roster: Character[] = ROSTER): ComponentFixture<CharactersPage> {
  TestBed.configureTestingModule({
    providers: [{ provide: CharactersService, useValue: { getCharacters: () => of(roster) } }],
  });
  const fixture = TestBed.createComponent(CharactersPage);
  fixture.detectChanges();
  return fixture;
}

function all(fixture: ComponentFixture<CharactersPage>, id: string): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll(`[data-testid="${id}"]`));
}

function byTestId(fixture: ComponentFixture<CharactersPage>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
}

function selectors(fixture: ComponentFixture<CharactersPage>): HTMLButtonElement[] {
  return all(fixture, 'character-selector') as HTMLButtonElement[];
}

function component(fixture: ComponentFixture<CharactersPage>): CharactersPage {
  return fixture.componentInstance;
}

describe('CharactersPage', () => {
  it('renders the hero and a selector button per character', () => {
    const fixture = setup();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('The roster');
    expect(selectors(fixture).map((button) => button.textContent?.trim())).toEqual([
      'Ignara',
      'Sophia',
      'Yuna',
    ]);
  });

  it('displays the first character with its stats by default', () => {
    const fixture = setup();
    const display = byTestId(fixture, 'selected-character');

    expect(display?.textContent).toContain('Ignara');
    expect(display?.textContent).toContain('The Flameheart');
    expect(selectors(fixture)[0].getAttribute('aria-selected')).toBe('true');
    expect(byTestId(fixture, 'selected-role')?.textContent).toContain('Duelist');
    expect(byTestId(fixture, 'selected-difficulty')?.textContent).toContain('Moderate');
    expect(all(fixture, 'character-stat').length).toBe(2);
  });

  it('switches the display when another character is selected', () => {
    const fixture = setup();

    selectors(fixture)[1].click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'selected-character')?.textContent).toContain('Sophia');
    expect(byTestId(fixture, 'selected-difficulty')?.textContent).toContain('Low');
    expect(selectors(fixture)[1].getAttribute('aria-selected')).toBe('true');
    expect(selectors(fixture)[0].getAttribute('aria-selected')).toBe('false');
  });

  it('steps to the next character with the change control', () => {
    const fixture = setup();

    byTestId(fixture, 'change-next')!.click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'selected-character')?.textContent).toContain('Sophia');
  });

  it('wraps from the first character to the last when stepping back', () => {
    const fixture = setup();

    byTestId(fixture, 'change-prev')!.click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'selected-character')?.textContent).toContain('Yuna');
  });

  it('wraps from the last character to the first when stepping forward', () => {
    const fixture = setup();

    selectors(fixture)[2].click();
    fixture.detectChanges();
    byTestId(fixture, 'change-next')!.click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'selected-character')?.textContent).toContain('Ignara');
  });

  it('shows the ability kit first, including the passive', () => {
    const fixture = setup();

    expect(byTestId(fixture, 'panel-abilities')).not.toBeNull();
    expect(byTestId(fixture, 'panel-lore')).toBeNull();

    const abilities = all(fixture, 'character-ability');
    expect(abilities.length).toBe(2);
    expect(abilities[0].textContent).toContain('Passive');
    expect(abilities[0].textContent).toContain('Ember');
  });

  it('toggles to the lore and back to the abilities', () => {
    const fixture = setup();

    byTestId(fixture, 'toggle-lore')!.click();
    fixture.detectChanges();

    const lore = byTestId(fixture, 'panel-lore');
    expect(lore).not.toBeNull();
    expect(lore?.textContent).toContain('Ignara paragraph one.');
    expect(lore?.textContent).toContain('Ignara paragraph two.');
    expect(byTestId(fixture, 'panel-abilities')).toBeNull();
    expect(byTestId(fixture, 'toggle-lore')!.getAttribute('aria-selected')).toBe('true');

    byTestId(fixture, 'toggle-abilities')!.click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'panel-abilities')).not.toBeNull();
    expect(byTestId(fixture, 'panel-lore')).toBeNull();
  });

  it('keeps the lore in sync with the selected character', () => {
    const fixture = setup();

    byTestId(fixture, 'toggle-lore')!.click();
    fixture.detectChanges();
    selectors(fixture)[2].click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'panel-lore')?.textContent).toContain('Yuna paragraph one.');
  });

  it('marks the bundled copy as placeholder content', () => {
    const fixture = setup();

    expect(byTestId(fixture, 'placeholder-notice')?.textContent).toContain('placeholder');
  });

  it('shows an empty state when the roster is empty', () => {
    const fixture = setup([]);

    expect(byTestId(fixture, 'characters-page')).toBeNull();
    expect(byTestId(fixture, 'empty-roster')).not.toBeNull();
    expect(selectors(fixture).length).toBe(0);
  });

  it('ignores a change request while the roster is empty', () => {
    const fixture = setup([]);

    expect(() => component(fixture)['change'](1)).not.toThrow();
    expect(component(fixture)['selectedIndex']()).toBe(0);
  });

  it('labels every difficulty tier', () => {
    const page = component(setup());

    expect(page['difficultyLabel'](1)).toBe('Low');
    expect(page['difficultyLabel'](2)).toBe('Moderate');
    expect(page['difficultyLabel'](3)).toBe('High');
  });

  it('clamps stat bar widths to the 0..STAT_MAX range', () => {
    const page = component(setup());

    expect(page['statWidth'](0)).toBe('0%');
    expect(page['statWidth'](5)).toBe('50%');
    expect(page['statWidth'](10)).toBe('100%');
    expect(page['statWidth'](-4)).toBe('0%');
    expect(page['statWidth'](14)).toBe('100%');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { CharacterDetail } from './character-detail';
import { CharactersService } from '../characters.service';
import { Character } from '../characters.types';

const IGNARA: Character = {
  id: 'ignara',
  name: 'Ignara',
  epithet: 'The Flameheart',
  role: 'Duelist',
  difficulty: 2,
  tagline: 'Burns brighter the longer a fight goes on.',
  image: '/ignara-wallpaper.png',
  story: ['First lore paragraph.', 'Second lore paragraph.'],
  stats: [
    { label: 'Damage', value: 9 },
    { label: 'Defence', value: 5 },
  ],
  abilities: [
    { slot: 'Passive', name: 'Not announced', description: 'Hidden passive.', cooldown: '—' },
    { slot: 'Q', name: 'Not announced', description: 'Hidden ability.', cooldown: '8s' },
  ],
};

const SOPHIA: Character = {
  ...IGNARA,
  id: 'sophia',
  name: 'Sophia',
  epithet: 'The Lightbringer',
  role: 'Guardian',
  difficulty: 1,
  story: ['Sophia lore paragraph.'],
};

const ROSTER = [IGNARA, SOPHIA];

function setup(id: string): {
  fixture: ComponentFixture<CharacterDetail>;
  params: BehaviorSubject<ParamMap>;
} {
  const params = new BehaviorSubject<ParamMap>(convertToParamMap({ id }));
  TestBed.configureTestingModule({
    imports: [CharacterDetail],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
      {
        provide: CharactersService,
        useValue: {
          getCharacter: (wanted: string) =>
            of(ROSTER.find((character) => character.id === wanted)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(CharacterDetail);
  fixture.detectChanges();
  return { fixture, params };
}

function tab(fixture: ComponentFixture<CharacterDetail>, name: 'story' | 'stats'): HTMLButtonElement {
  return fixture.nativeElement.querySelector(`[data-testid="tab-${name}"]`);
}

describe('CharacterDetail', () => {
  it('renders the character from the route param', () => {
    const { fixture } = setup('ignara');
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Ignara');
    expect(text).toContain('The Flameheart');
    expect(text).toContain(IGNARA.tagline);
  });

  it('shows the role and a readable difficulty label', () => {
    const { fixture } = setup('ignara');

    expect(
      fixture.nativeElement.querySelector('[data-testid="detail-role"]').textContent,
    ).toContain('Duelist');
    expect(
      fixture.nativeElement.querySelector('[data-testid="detail-difficulty"]').textContent,
    ).toContain('Moderate');
  });

  it('opens on the story tab and shows every lore paragraph', () => {
    const { fixture } = setup('ignara');
    const panel = fixture.nativeElement.querySelector('[data-testid="panel-story"]');

    expect(tab(fixture, 'story').getAttribute('aria-selected')).toBe('true');
    for (const paragraph of IGNARA.story) {
      expect(panel.textContent).toContain(paragraph);
    }
    expect(fixture.nativeElement.querySelector('[data-testid="panel-stats"]')).toBeNull();
  });

  it('switches to the stats tab with every stat and ability', () => {
    const { fixture } = setup('ignara');

    tab(fixture, 'stats').click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('[data-testid="panel-stats"]');
    expect(tab(fixture, 'stats').getAttribute('aria-selected')).toBe('true');
    expect(tab(fixture, 'story').getAttribute('aria-selected')).toBe('false');
    expect(fixture.nativeElement.querySelector('[data-testid="panel-story"]')).toBeNull();
    expect(panel.querySelectorAll('[data-testid="character-stat"]').length).toBe(
      IGNARA.stats.length,
    );
    expect(panel.querySelectorAll('[data-testid="character-ability"]').length).toBe(
      IGNARA.abilities.length,
    );
    expect(panel.textContent).toContain('Cooldown: 8s');
  });

  it('scales the stat bars against the maximum rating', () => {
    const { fixture } = setup('ignara');

    tab(fixture, 'stats').click();
    fixture.detectChanges();

    const meters: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[role="meter"]'),
    );
    expect(meters[0].getAttribute('aria-valuenow')).toBe('9');
    expect(meters[0].getAttribute('aria-valuemax')).toBe('10');
    expect((meters[0].firstElementChild as HTMLElement).style.width).toBe('90%');
    expect((meters[1].firstElementChild as HTMLElement).style.width).toBe('50%');
  });

  it('switches back to the story tab', () => {
    const { fixture } = setup('ignara');

    tab(fixture, 'stats').click();
    fixture.detectChanges();
    tab(fixture, 'story').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="panel-story"]')).not.toBeNull();
  });

  it('follows the route param when the component is reused for another character', () => {
    const { fixture, params } = setup('ignara');

    params.next(convertToParamMap({ id: 'sophia' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Sophia');
    expect(fixture.nativeElement.textContent).toContain('Sophia lore paragraph.');
  });

  it('shows a not-found state for an unknown id', () => {
    const { fixture } = setup('nobody');

    expect(fixture.nativeElement.querySelector('[data-testid="not-found"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="character-detail"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(
      'Character not found',
    );
  });

  it('links back to the roster', () => {
    const { fixture } = setup('ignara');
    const back = fixture.nativeElement.querySelector(
      '[data-testid="back-to-roster"]',
    ) as HTMLAnchorElement;

    expect(back.getAttribute('href')).toBe('/characters');
  });
});

import { TestBed } from '@angular/core/testing';
import { Mock, vi } from 'vitest';

import { CommunityBuilds } from './community-builds';
import { Build } from '../../../domain/models';
import { BUILDS_GATEWAY } from '../../../domain/ports';

function build(overrides: Partial<Build> = {}): Build {
  return {
    id: 'b1',
    title: 'Tempo Lira',
    championId: 'lira',
    role: 'Controller',
    itemIds: ['chronomantle'],
    skillOrder: ['Q'],
    summary: 'A build.',
    author: 'Nyx',
    tags: ['teamfight'],
    votes: 10,
    updatedAt: '2026-07-01',
    published: true,
    ...overrides,
  };
}

const COMMUNITY = [
  build({ id: 'c1', title: 'Tempo Lira', votes: 10, updatedAt: '2026-07-10' }),
  build({
    id: 'c2',
    title: 'Dive Ignara',
    championId: 'ignara',
    role: 'Duelist',
    author: 'Rue',
    votes: 90,
    updatedAt: '2026-06-01',
  }),
];

let listCommunity: Mock;
let listOwn: Mock;

/** The service loads asynchronously, so let its promises run before rendering. */
async function settle(fixture: { detectChanges(): void }): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

async function setup() {
  TestBed.configureTestingModule({
    imports: [CommunityBuilds],
    providers: [
      {
        provide: BUILDS_GATEWAY,
        useValue: { listCommunity, listOwn, replaceOwn: vi.fn().mockResolvedValue(undefined) },
      },
    ],
  });
  const fixture = TestBed.createComponent(CommunityBuilds);
  fixture.detectChanges();
  await settle(fixture);
  return fixture;
}

function cards(fixture: Awaited<ReturnType<typeof setup>>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="build-card"]'));
}

function titles(fixture: Awaited<ReturnType<typeof setup>>): string[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('[data-testid="build-title"]'),
  ).map((el) => (el as HTMLElement).textContent?.trim() ?? '');
}

async function type(
  fixture: Awaited<ReturnType<typeof setup>>,
  testId: string,
  value: string,
): Promise<void> {
  const field = fixture.nativeElement.querySelector(
    `[data-testid="${testId}"]`,
  ) as HTMLInputElement | HTMLSelectElement;
  field.value = value;
  field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
  fixture.detectChanges();
  await settle(fixture);
}

describe('CommunityBuilds', () => {
  beforeEach(() => {
    listCommunity = vi.fn().mockResolvedValue(COMMUNITY);
    listOwn = vi.fn().mockResolvedValue([]);
  });

  it('lists the published community builds, most voted first', async () => {
    const fixture = await setup();

    expect(cards(fixture).length).toBe(2);
    expect(titles(fixture)).toEqual(['Dive Ignara', 'Tempo Lira']);
  });

  it('reports how many builds match', async () => {
    const fixture = await setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="build-result-count"]').textContent,
    ).toContain('2 builds found');
  });

  it('includes published own builds but hides drafts', async () => {
    listOwn.mockResolvedValue([
      build({ id: 'o1', title: 'My published', published: true }),
      build({ id: 'o2', title: 'My draft', published: false }),
    ]);

    const fixture = await setup();
    const shown = titles(fixture);

    expect(shown).toContain('My published');
    expect(shown).not.toContain('My draft');
  });

  it('searches by title, champion, author and tag', async () => {
    const fixture = await setup();

    await type(fixture, 'build-search', 'ignara');
    expect(titles(fixture)).toEqual(['Dive Ignara']);

    await type(fixture, 'build-search', 'Rue');
    expect(titles(fixture)).toEqual(['Dive Ignara']);

    await type(fixture, 'build-search', 'teamfight');
    expect(cards(fixture).length).toBe(2);
  });

  it('filters by the selected character', async () => {
    const fixture = await setup();

    await type(fixture, 'build-character-filter', 'ignara');
    expect(titles(fixture)).toEqual(['Dive Ignara']);

    await type(fixture, 'build-character-filter', 'lira');
    expect(titles(fixture)).toEqual(['Tempo Lira']);
  });

  it('offers every champion in the character selector', async () => {
    const fixture = await setup();
    const options = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="build-character-filter"] option'),
    ).map((option) => (option as HTMLOptionElement).value);

    expect(options).toContain('all');
    expect(options).toContain('lira');
    expect(options).toContain('ignara');
  });

  it('filters by role', async () => {
    const fixture = await setup();

    await type(fixture, 'build-role-filter', 'Duelist');

    expect(titles(fixture)).toEqual(['Dive Ignara']);
  });

  it('switches to the most recently updated builds', async () => {
    const fixture = await setup();

    await type(fixture, 'build-sort', 'recent');

    expect(titles(fixture)).toEqual(['Tempo Lira', 'Dive Ignara']);
  });

  it('shows an empty state and resets the filters', async () => {
    const fixture = await setup();

    await type(fixture, 'build-search', 'nothing matches this');
    expect(fixture.nativeElement.querySelector('[data-testid="builds-empty"]')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="build-result-count"]').textContent,
    ).toContain('0 builds found');

    fixture.nativeElement.querySelector('[data-testid="builds-reset"]').click();
    fixture.detectChanges();
    await settle(fixture);

    expect(cards(fixture).length).toBe(2);
  });

  it('counts a single result in the singular', async () => {
    const fixture = await setup();

    await type(fixture, 'build-search', 'ignara');

    expect(
      fixture.nativeElement.querySelector('[data-testid="build-result-count"]').textContent,
    ).toContain('1 build found');
  });

  it('renders nothing when the source is unavailable', async () => {
    listCommunity.mockRejectedValue(new Error('offline'));

    const fixture = await setup();

    expect(cards(fixture).length).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="builds-empty"]')).not.toBeNull();
  });
});

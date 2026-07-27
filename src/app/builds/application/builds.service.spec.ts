import { TestBed } from '@angular/core/testing';
import { Mock, vi } from 'vitest';

import { BuildFilter, BuildsService, filterBuilds } from './builds.service';
import { Build, BuildDraft } from '../domain/models';
import { BUILDS_GATEWAY } from '../domain/ports';

/** A "keep everything" filter; tests override only the field under test. */
function filter(overrides: Partial<BuildFilter> = {}): BuildFilter {
  return { query: '', championId: 'all', role: 'all', sort: 'popular', ...overrides };
}

function build(overrides: Partial<Build> = {}): Build {
  return {
    id: 'b1',
    title: 'Tempo Lira',
    championId: 'lira',
    role: 'Controller',
    itemIds: ['chronomantle'],
    skillOrder: ['Q', 'W'],
    summary: 'A build.',
    author: 'Nyx',
    tags: ['teamfight'],
    votes: 10,
    updatedAt: '2026-07-01',
    published: true,
    ...overrides,
  };
}

function draft(overrides: Partial<BuildDraft> = {}): BuildDraft {
  return {
    title: 'New build',
    championId: 'yuna',
    role: 'Mage',
    itemIds: ['stormpiercer'],
    skillOrder: ['E'],
    summary: 'Fresh.',
    tags: ['poke'],
    published: false,
    ...overrides,
  };
}

describe('filterBuilds', () => {
  const builds = [
    build({ id: 'a', title: 'Tempo Lira', votes: 10, updatedAt: '2026-07-01', tags: ['meta'] }),
    build({
      id: 'b',
      title: 'Dive Ignara',
      championId: 'ignara',
      role: 'Duelist',
      author: 'Rue',
      votes: 50,
      updatedAt: '2026-06-01',
      tags: ['aggressive'],
    }),
  ];

  it('returns everything for an empty query', () => {
    expect(filterBuilds(builds, filter({ query: '  ' })).length).toBe(2);
  });

  it('matches title, author, champion and tags case-insensitively', () => {
    const byTitle = filterBuilds(builds, filter({ query: 'dive' }));
    const byAuthor = filterBuilds(builds, filter({ query: 'RUE' }));
    const byChampion = filterBuilds(builds, filter({ query: 'lira' }));
    const byTag = filterBuilds(builds, filter({ query: 'meta' }));

    expect(byTitle.map((b) => b.id)).toEqual(['b']);
    expect(byAuthor.map((b) => b.id)).toEqual(['b']);
    expect(byChampion.map((b) => b.id)).toEqual(['a']);
    expect(byTag.map((b) => b.id)).toEqual(['a']);
  });

  it('filters by character', () => {
    const ignara = filterBuilds(builds, filter({ championId: 'ignara' }));

    expect(ignara.map((b) => b.id)).toEqual(['b']);
  });

  it('combines the character filter with the search query', () => {
    expect(filterBuilds(builds, filter({ championId: 'lira', query: 'dive' })).length).toBe(0);
  });

  it('filters by role', () => {
    const duelists = filterBuilds(builds, filter({ role: 'Duelist' }));

    expect(duelists.map((b) => b.id)).toEqual(['b']);
  });

  it('sorts by votes or by last update', () => {
    const popular = filterBuilds(builds, filter({ sort: 'popular' }));
    const recent = filterBuilds(builds, filter({ sort: 'recent' }));

    expect(popular.map((b) => b.id)).toEqual(['b', 'a']);
    expect(recent.map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('leaves the source array untouched', () => {
    const source = [...builds];
    filterBuilds(source, filter());

    expect(source.map((b) => b.id)).toEqual(['a', 'b']);
  });
});

describe('BuildsService', () => {
  let service: BuildsService;
  let listCommunity: Mock;
  let listOwn: Mock;
  let replaceOwn: Mock;

  beforeEach(() => {
    listCommunity = vi.fn().mockResolvedValue([]);
    listOwn = vi.fn().mockResolvedValue([]);
    replaceOwn = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        BuildsService,
        { provide: BUILDS_GATEWAY, useValue: { listCommunity, listOwn, replaceOwn } },
      ],
    });
    service = TestBed.inject(BuildsService);
  });

  it('starts empty', () => {
    expect(service.community()).toEqual([]);
    expect(service.own()).toEqual([]);
    expect(service.isLoading()).toBe(false);
  });

  it('loads both lists', async () => {
    listCommunity.mockResolvedValue([build({ id: 'c1' })]);
    listOwn.mockResolvedValue([build({ id: 'o1' })]);

    await service.load();

    expect(service.community().map((b) => b.id)).toEqual(['c1']);
    expect(service.own().map((b) => b.id)).toEqual(['o1']);
    expect(service.isLoading()).toBe(false);
  });

  it('falls back to empty lists when loading fails', async () => {
    listCommunity.mockRejectedValue(new Error('offline'));

    await service.load();

    expect(service.community()).toEqual([]);
    expect(service.own()).toEqual([]);
    expect(service.isLoading()).toBe(false);
  });

  it('lists only published own builds alongside the community ones', async () => {
    listCommunity.mockResolvedValue([build({ id: 'c1' })]);
    listOwn.mockResolvedValue([
      build({ id: 'o1', published: true }),
      build({ id: 'o2', published: false }),
    ]);

    await service.load();

    expect(service.publishedCommunity().map((b) => b.id)).toEqual(['c1', 'o1']);
  });

  it('creates a build with an author and a fresh date', async () => {
    const created = await service.create(draft(), 'Jonas');

    expect(created.author).toBe('Jonas');
    expect(created.votes).toBe(0);
    expect(created.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(service.own().map((b) => b.id)).toEqual([created.id]);
    expect(replaceOwn).toHaveBeenCalledWith(service.own());
  });

  it('gives each new build its own id', async () => {
    const first = await service.create(draft(), 'Jonas');
    const second = await service.create(draft(), 'Jonas');

    expect(first.id).not.toBe(second.id);
    expect(service.own().length).toBe(2);
  });

  it('updates an existing build and leaves the others alone', async () => {
    listOwn.mockResolvedValue([build({ id: 'o1' }), build({ id: 'o2', title: 'Untouched' })]);
    await service.load();

    await service.update('o1', draft({ title: 'Renamed' }));

    expect(service.own()[0].title).toBe('Renamed');
    expect(service.own()[0].author).toBe('Nyx');
    expect(service.own()[1].title).toBe('Untouched');
  });

  it('removes a build', async () => {
    listOwn.mockResolvedValue([build({ id: 'o1' }), build({ id: 'o2' })]);
    await service.load();

    await service.remove('o1');

    expect(service.own().map((b) => b.id)).toEqual(['o2']);
    expect(replaceOwn).toHaveBeenCalled();
  });

  it('toggles the published flag', async () => {
    listOwn.mockResolvedValue([build({ id: 'o1', published: false })]);
    await service.load();

    await service.setPublished('o1', true);
    expect(service.own()[0].published).toBe(true);

    await service.setPublished('o1', false);
    expect(service.own()[0].published).toBe(false);
  });
});

describe('BUILDS_GATEWAY default adapter', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [BuildsService] });
  });

  it('serves the sample community builds', async () => {
    const builds = await TestBed.inject(BUILDS_GATEWAY).listCommunity();

    expect(builds.length).toBeGreaterThan(0);
    expect(builds.every((b) => b.published)).toBe(true);
  });

  it('round-trips own builds through local storage', async () => {
    const gateway = TestBed.inject(BUILDS_GATEWAY);

    await gateway.replaceOwn([build({ id: 'stored' })]);

    expect((await gateway.listOwn()).map((b) => b.id)).toEqual(['stored']);
  });

  it('starts empty and discards corrupted storage', async () => {
    const gateway = TestBed.inject(BUILDS_GATEWAY);
    expect(await gateway.listOwn()).toEqual([]);

    localStorage.setItem('mira.builds.own', '{not json');
    expect(await gateway.listOwn()).toEqual([]);
    expect(localStorage.getItem('mira.builds.own')).toBeNull();
  });

  it('ignores stored values that are not a list', async () => {
    localStorage.setItem('mira.builds.own', '{"nope":true}');

    expect(await TestBed.inject(BUILDS_GATEWAY).listOwn()).toEqual([]);
  });
});

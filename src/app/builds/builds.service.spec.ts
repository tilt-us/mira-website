import { TestBed } from '@angular/core/testing';
import { Mock, vi } from 'vitest';

import { BUILDS_API, BuildsService, filterBuilds } from './builds.service';
import { Build, BuildDraft } from './builds.types';

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
    expect(filterBuilds(builds, { query: '  ', role: 'all', sort: 'popular' }).length).toBe(2);
  });

  it('matches title, author, champion and tags case-insensitively', () => {
    const byTitle = filterBuilds(builds, { query: 'dive', role: 'all', sort: 'popular' });
    const byAuthor = filterBuilds(builds, { query: 'RUE', role: 'all', sort: 'popular' });
    const byChampion = filterBuilds(builds, { query: 'lira', role: 'all', sort: 'popular' });
    const byTag = filterBuilds(builds, { query: 'meta', role: 'all', sort: 'popular' });

    expect(byTitle.map((b) => b.id)).toEqual(['b']);
    expect(byAuthor.map((b) => b.id)).toEqual(['b']);
    expect(byChampion.map((b) => b.id)).toEqual(['a']);
    expect(byTag.map((b) => b.id)).toEqual(['a']);
  });

  it('filters by role', () => {
    const duelists = filterBuilds(builds, { query: '', role: 'Duelist', sort: 'popular' });

    expect(duelists.map((b) => b.id)).toEqual(['b']);
  });

  it('sorts by votes or by last update', () => {
    const popular = filterBuilds(builds, { query: '', role: 'all', sort: 'popular' });
    const recent = filterBuilds(builds, { query: '', role: 'all', sort: 'recent' });

    expect(popular.map((b) => b.id)).toEqual(['b', 'a']);
    expect(recent.map((b) => b.id)).toEqual(['a', 'b']);
  });

  it('leaves the source array untouched', () => {
    const source = [...builds];
    filterBuilds(source, { query: '', role: 'all', sort: 'popular' });

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
        { provide: BUILDS_API, useValue: { listCommunity, listOwn, replaceOwn } },
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

describe('BUILDS_API default implementation', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [BuildsService] });
  });

  it('serves the sample community builds', async () => {
    const builds = await TestBed.inject(BUILDS_API).listCommunity();

    expect(builds.length).toBeGreaterThan(0);
    expect(builds.every((b) => b.published)).toBe(true);
  });

  it('round-trips own builds through local storage', async () => {
    const api = TestBed.inject(BUILDS_API);

    await api.replaceOwn([build({ id: 'stored' })]);

    expect((await api.listOwn()).map((b) => b.id)).toEqual(['stored']);
  });

  it('starts empty and discards corrupted storage', async () => {
    const api = TestBed.inject(BUILDS_API);
    expect(await api.listOwn()).toEqual([]);

    localStorage.setItem('mira.builds.own', '{not json');
    expect(await api.listOwn()).toEqual([]);
    expect(localStorage.getItem('mira.builds.own')).toBeNull();
  });

  it('ignores stored values that are not a list', async () => {
    localStorage.setItem('mira.builds.own', '{"nope":true}');

    expect(await TestBed.inject(BUILDS_API).listOwn()).toEqual([]);
  });
});

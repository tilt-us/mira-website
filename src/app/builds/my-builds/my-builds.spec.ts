import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Mock, vi } from 'vitest';

import { MyBuilds } from './my-builds';
import { AuthService } from '../../auth/auth.service';
import { AuthUser } from '../../auth/auth.types';
import { BUILDS_API } from '../builds.service';
import { Build } from '../builds.types';

function build(overrides: Partial<Build> = {}): Build {
  return {
    id: 'o1',
    title: 'Tempo Lira',
    championId: 'lira',
    role: 'Controller',
    itemIds: ['chronomantle'],
    skillOrder: ['Q'],
    summary: 'A build.',
    author: 'Jonas',
    tags: ['teamfight'],
    votes: 3,
    updatedAt: '2026-07-01',
    published: false,
    ...overrides,
  };
}

let listOwn: Mock;
let replaceOwn: Mock;
let openLoginPopup: Mock;
let user: WritableSignal<AuthUser | null>;

/** The service loads and saves asynchronously, so let its promises run before rendering. */
async function settle(fixture: { detectChanges(): void }): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

async function setup() {
  TestBed.configureTestingModule({
    imports: [MyBuilds],
    providers: [
      {
        provide: BUILDS_API,
        useValue: { listCommunity: vi.fn().mockResolvedValue([]), listOwn, replaceOwn },
      },
      {
        provide: AuthService,
        useValue: { user, isLoggedIn: () => user() !== null, openLoginPopup },
      },
    ],
  });
  const fixture = TestBed.createComponent(MyBuilds);
  fixture.detectChanges();
  await settle(fixture);
  return fixture;
}

type Fixture = Awaited<ReturnType<typeof setup>>;

function el(fixture: Fixture, testId: string): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
}

function all(fixture: Fixture, testId: string): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll(`[data-testid="${testId}"]`));
}

async function click(fixture: Fixture, target: HTMLElement): Promise<void> {
  target.click();
  fixture.detectChanges();
  await settle(fixture);
}

async function type(fixture: Fixture, testId: string, value: string): Promise<void> {
  const field = el(fixture, testId) as HTMLInputElement;
  field.value = value;
  field.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  await settle(fixture);
}

/** Fills in the minimum a build needs to pass validation. */
async function fillValidDraft(fixture: Fixture): Promise<void> {
  await type(fixture, 'build-form-title', 'Zone Yuna');
  await click(fixture, all(fixture, 'build-form-item')[0]);
}

describe('MyBuilds (signed out)', () => {
  beforeEach(() => {
    listOwn = vi.fn().mockResolvedValue([]);
    replaceOwn = vi.fn().mockResolvedValue(undefined);
    openLoginPopup = vi.fn();
    user = signal<AuthUser | null>(null);
  });

  it('asks the visitor to sign in instead of showing the editor', async () => {
    const fixture = await setup();

    expect(el(fixture, 'my-builds-login')).not.toBeNull();
    expect(el(fixture, 'build-create')).toBeNull();
  });

  it('opens the login popup', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'my-builds-login-button'));

    expect(openLoginPopup).toHaveBeenCalled();
  });
});

describe('MyBuilds (signed in)', () => {
  beforeEach(() => {
    listOwn = vi.fn().mockResolvedValue([]);
    replaceOwn = vi.fn().mockResolvedValue(undefined);
    openLoginPopup = vi.fn();
    user = signal<AuthUser | null>({ displayName: 'Jonas' } as AuthUser);
  });

  it('shows an empty state until a build exists', async () => {
    const fixture = await setup();

    expect(el(fixture, 'my-builds-empty')).not.toBeNull();
    expect(el(fixture, 'my-builds-count').textContent).toContain('0 builds');
  });

  it('lists stored builds with owner actions and a published count', async () => {
    listOwn.mockResolvedValue([
      build({ id: 'o1', published: true }),
      build({ id: 'o2', title: 'Draft build' }),
    ]);

    const fixture = await setup();

    expect(all(fixture, 'build-card').length).toBe(2);
    expect(all(fixture, 'build-edit').length).toBe(2);
    expect(el(fixture, 'my-builds-count').textContent).toContain('2 builds');
    expect(el(fixture, 'my-builds-count').textContent).toContain('1 published');
  });

  it('opens and closes the create form', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    expect(el(fixture, 'build-form')).not.toBeNull();
    expect(el(fixture, 'build-form-save').textContent).toContain('Create build');

    await click(fixture, el(fixture, 'build-form-cancel'));
    expect(el(fixture, 'build-form')).toBeNull();
  });

  it('rejects a build without a title', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    await click(fixture, el(fixture, 'build-form-save'));

    expect(el(fixture, 'build-form-error').textContent).toContain('title');
    expect(replaceOwn).not.toHaveBeenCalled();
  });

  it('rejects a build without items', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    await type(fixture, 'build-form-title', 'Zone Yuna');
    await click(fixture, el(fixture, 'build-form-save'));

    expect(el(fixture, 'build-form-error').textContent).toContain('item');
    expect(replaceOwn).not.toHaveBeenCalled();
  });

  it('creates a build, attributes it to the signed-in player and closes the form', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    await fillValidDraft(fixture);
    await click(fixture, el(fixture, 'build-form-save'));

    expect(el(fixture, 'build-form')).toBeNull();
    expect(all(fixture, 'build-card').length).toBe(1);
    expect(el(fixture, 'build-title').textContent).toContain('Zone Yuna');
    expect(fixture.nativeElement.textContent).toContain('Jonas');
    expect(replaceOwn).toHaveBeenCalled();
  });

  it('toggles items in and out of the buy order', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    const [first, second] = all(fixture, 'build-form-item');

    await click(fixture, first);
    await click(fixture, second);
    expect(el(fixture, 'build-form-item-order').textContent).toContain('2 selected');
    expect(first.getAttribute('aria-pressed')).toBe('true');

    await click(fixture, first);
    expect(el(fixture, 'build-form-item-order').textContent).toContain('1 selected');
    expect(first.getAttribute('aria-pressed')).toBe('false');
  });

  it('builds a skill order that can be undone and cleared', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    expect(el(fixture, 'build-form-skill-order').textContent).toContain('No skills added yet');

    const [q, w] = all(fixture, 'build-form-skill');
    await click(fixture, q);
    await click(fixture, w);
    await click(fixture, q);
    expect(el(fixture, 'build-form-skill-order').textContent).toContain('Q → W → Q');

    await click(fixture, el(fixture, 'build-form-skill-undo'));
    expect(el(fixture, 'build-form-skill-order').textContent).toContain('Q → W');

    await click(fixture, el(fixture, 'build-form-skill-clear'));
    expect(el(fixture, 'build-form-skill-order').textContent).toContain('No skills added yet');
  });

  it('splits the tag field into normalised tags', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    await fillValidDraft(fixture);
    await type(fixture, 'build-form-tags', ' Ranked , SCALING ,, ');
    await click(fixture, el(fixture, 'build-form-save'));

    const tags = el(fixture, 'build-tags').textContent as string;
    expect(tags).toContain('#ranked');
    expect(tags).toContain('#scaling');
  });

  it('pre-selects the champion default role', async () => {
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    const champion = el(fixture, 'build-form-champion') as HTMLSelectElement;
    champion.value = 'sophia';
    champion.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await settle(fixture);

    expect((el(fixture, 'build-form-role') as HTMLSelectElement).value).toBe('Guardian');
  });

  it('edits an existing build in place', async () => {
    listOwn.mockResolvedValue([build()]);
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-edit'));
    expect(el(fixture, 'build-form-save').textContent).toContain('Save changes');
    expect((el(fixture, 'build-form-title') as HTMLInputElement).value).toBe('Tempo Lira');

    await type(fixture, 'build-form-title', 'Renamed Lira');
    await click(fixture, el(fixture, 'build-form-save'));

    expect(all(fixture, 'build-card').length).toBe(1);
    expect(el(fixture, 'build-title').textContent).toContain('Renamed Lira');
  });

  it('publishes and unpublishes a build', async () => {
    listOwn.mockResolvedValue([build({ published: false })]);
    const fixture = await setup();

    expect(el(fixture, 'build-status').textContent).toContain('Draft');

    await click(fixture, el(fixture, 'build-publish'));
    expect(el(fixture, 'build-status').textContent).toContain('Published');

    await click(fixture, el(fixture, 'build-publish'));
    expect(el(fixture, 'build-status').textContent).toContain('Draft');
  });

  it('deletes a build', async () => {
    listOwn.mockResolvedValue([build()]);
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-delete'));

    expect(all(fixture, 'build-card').length).toBe(0);
    expect(el(fixture, 'my-builds-empty')).not.toBeNull();
  });

  it('falls back to the username when no display name is set', async () => {
    user.set({ preferredUsername: 'karma' } as AuthUser);
    const fixture = await setup();

    await click(fixture, el(fixture, 'build-create'));
    await fillValidDraft(fixture);
    await click(fixture, el(fixture, 'build-form-save'));

    expect(fixture.nativeElement.textContent).toContain('karma');
  });
});

import { TestBed } from '@angular/core/testing';

import { BuildCard } from './build-card';
import { Build } from '../../../domain/models';

function build(overrides: Partial<Build> = {}): Build {
  return {
    id: 'b1',
    title: 'Tempo Lira',
    championId: 'lira',
    role: 'Controller',
    itemIds: ['chronomantle', 'swiftstep-greaves'],
    skillOrder: ['Q', 'W', 'Q'],
    summary: 'Stacks cooldown reduction early.',
    author: 'Nyx',
    tags: ['teamfight', 'meta'],
    votes: 42,
    updatedAt: '2026-07-14',
    published: true,
    ...overrides,
  };
}

function setup(overrides: Partial<Build> = {}, showOwnerActions = false) {
  const fixture = TestBed.createComponent(BuildCard);
  fixture.componentRef.setInput('build', build(overrides));
  fixture.componentRef.setInput('showOwnerActions', showOwnerActions);
  fixture.detectChanges();
  return fixture;
}

function text(fixture: ReturnType<typeof setup>, testId: string): string {
  return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`).textContent as string;
}

describe('BuildCard', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [BuildCard] }));

  it('shows the champion, role, author and votes', () => {
    const fixture = setup();
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Lira');
    expect(content).toContain('Controller');
    expect(content).toContain('Nyx');
    expect(text(fixture, 'build-title')).toContain('Tempo Lira');
    expect(text(fixture, 'build-votes')).toContain('42');
  });

  it('lists the item path in buy order', () => {
    const fixture = setup();
    const items = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="build-items"] li'),
    ).map((li) => (li as HTMLElement).textContent?.trim());

    expect(items).toEqual(['Chronomantle', 'Swiftstep Greaves']);
  });

  it('drops item ids that no longer exist', () => {
    const fixture = setup({ itemIds: ['chronomantle', 'removed-item'] });

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="build-items"] li').length,
    ).toBe(1);
  });

  it('renders the skill order including repeated slots', () => {
    const fixture = setup();

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="build-skills"] li').length,
    ).toBe(3);
  });

  it('falls back to the raw id for an unknown champion', () => {
    const fixture = setup({ championId: 'ghost' });

    expect(fixture.nativeElement.textContent).toContain('ghost');
  });

  it('hides the owner actions by default', () => {
    const fixture = setup();

    expect(fixture.nativeElement.querySelector('[data-testid="build-edit"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="build-status"]')).toBeNull();
  });

  it('labels a published build and offers to unpublish it', () => {
    const fixture = setup({}, true);

    expect(text(fixture, 'build-status')).toContain('Published');
    expect(text(fixture, 'build-publish')).toContain('Unpublish');
  });

  it('labels a draft and offers to publish it', () => {
    const fixture = setup({ published: false }, true);

    expect(text(fixture, 'build-status')).toContain('Draft');
    expect(text(fixture, 'build-publish')).toContain('Publish');
  });

  it('emits the build on edit, delete and publish', () => {
    const fixture = setup({}, true);
    const emitted: string[] = [];

    fixture.componentInstance.edit.subscribe(() => emitted.push('edit'));
    fixture.componentInstance.remove.subscribe(() => emitted.push('remove'));
    fixture.componentInstance.publishToggled.subscribe((b) => emitted.push(`publish:${b.id}`));

    for (const testId of ['build-edit', 'build-delete', 'build-publish']) {
      fixture.nativeElement.querySelector(`[data-testid="${testId}"]`).click();
    }

    expect(emitted).toEqual(['edit', 'remove', 'publish:b1']);
  });
});

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data } from '@angular/router';
import { BehaviorSubject, EMPTY } from 'rxjs';

import { PlaceholderContent, PlaceholderPage } from './placeholder-page';

const LEADERBOARDS: PlaceholderContent = {
  title: 'Leaderboards',
  tagline: 'See who is climbing the ranks in Mira.',
};

const BUILDS: PlaceholderContent = {
  title: 'Builds',
  tagline: 'Craft, share and discover powerful builds.',
};

function setup(initial: PlaceholderContent) {
  const data = new BehaviorSubject<Data>({ placeholder: initial });
  TestBed.configureTestingModule({
    imports: [PlaceholderPage],
    providers: [{ provide: ActivatedRoute, useValue: { data } }],
  });
  const fixture = TestBed.createComponent(PlaceholderPage);
  fixture.detectChanges();
  return { fixture, data };
}

describe('PlaceholderPage', () => {
  it('renders the title and tagline declared on the route', () => {
    const { fixture } = setup(LEADERBOARDS);
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(
      'Leaderboards',
    );
    expect(text).toContain('See who is climbing the ranks in Mira.');
    expect(text).toContain('Coming soon.');
  });

  it('renders nothing until the route data has resolved', () => {
    TestBed.configureTestingModule({
      imports: [PlaceholderPage],
      providers: [{ provide: ActivatedRoute, useValue: { data: EMPTY } }],
    });
    const fixture = TestBed.createComponent(PlaceholderPage);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="placeholder"]'),
    ).toBeFalsy();
  });

  it('updates when the route data changes without re-creating the component', () => {
    const { fixture, data } = setup(LEADERBOARDS);

    data.next({ placeholder: BUILDS });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(
      'Builds',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Craft, share and discover powerful builds.',
    );
  });
});

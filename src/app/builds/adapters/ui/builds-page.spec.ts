import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BuildsPage } from './builds-page';

function setup() {
  TestBed.configureTestingModule({
    imports: [BuildsPage],
    providers: [provideRouter([])],
  });
  const fixture = TestBed.createComponent(BuildsPage);
  fixture.detectChanges();
  return fixture;
}

describe('BuildsPage', () => {
  it('renders the builds hero', () => {
    const fixture = setup();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Loadouts');
  });

  it('separates community builds from the item builder with two tabs', () => {
    const fixture = setup();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="builds-tab"]'),
    ) as HTMLAnchorElement[];

    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('Community Builds');
    expect(tabs[1].textContent).toContain('Item Builder');
    expect(tabs.map((tab) => tab.getAttribute('href'))).toEqual(['/community', '/my']);
  });

  it('hosts the active section in a router outlet', () => {
    const fixture = setup();

    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});

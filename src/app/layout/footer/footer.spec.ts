import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Footer } from './footer';

describe('Footer', () => {
  function setup(): ComponentFixture<Footer> {
    TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    return fixture;
  }

  function hrefs(fixture: ComponentFixture<Footer>): (string | null)[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a')).map((a) =>
      (a as HTMLAnchorElement).getAttribute('href'),
    );
  }

  it('renders the current year in the legal row', () => {
    const fixture = setup();
    expect(fixture.nativeElement.textContent).toContain(`© ${new Date().getFullYear()} Mira`);
  });

  it('renders the Explore, Company and Legal columns', () => {
    const fixture = setup();
    const columns = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="footer-column"]'),
    ) as HTMLElement[];
    expect(columns.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Explore',
      'Company',
      'Legal',
    ]);
  });

  it('links to the terms of use and privacy policy pages', () => {
    const links = hrefs(setup());
    expect(links).toContain('/terms-of-use');
    expect(links).toContain('/privacy-policy');
  });

  it('links to the jobs placeholder page', () => {
    expect(hrefs(setup())).toContain('/jobs');
  });

  it('links to the Discord community', () => {
    const fixture = setup();
    expect(fixture.nativeElement.querySelector('[data-testid="footer-discord-link"]')).toBeTruthy();
  });
});

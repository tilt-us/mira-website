import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Footer } from './footer';

describe('Footer', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the current year', () => {
    const fixture = setup();
    expect(fixture.nativeElement.textContent).toContain(
      String(new Date().getFullYear()),
    );
  });

  it('links to the terms of use and privacy policy pages', () => {
    const fixture = setup();
    const hrefs = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    ).map((a) => (a as HTMLAnchorElement).getAttribute('href'));

    expect(hrefs).toContain('/terms-of-use');
    expect(hrefs).toContain('/privacy-policy');
  });
});

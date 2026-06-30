import { TestBed } from '@angular/core/testing';

import { Footer } from './footer';

describe('Footer', () => {
  it('renders the current year', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      String(new Date().getFullYear()),
    );
  });
});

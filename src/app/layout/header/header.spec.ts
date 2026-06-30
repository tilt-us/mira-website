import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  it('renders the Mira brand linking home', () => {
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    const brand = fixture.nativeElement.querySelector('a');
    expect(brand.textContent).toContain('Mira');
    expect(brand.getAttribute('href')).toBe('/');
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Home } from './home';

describe('Home', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the download button', () => {
    expect(render().querySelector('app-download-button')).toBeTruthy();
  });

  it('shows the character showcase with all four champions', () => {
    const el = render();
    expect(el.querySelector('#characters')).toBeTruthy();
    expect(el.querySelectorAll('[data-testid="character-tab"]').length).toBe(4);
  });

  it('shows the news and events sections', () => {
    const el = render();
    expect(el.querySelector('#news')).toBeTruthy();
    expect(el.querySelector('#events')).toBeTruthy();
  });

  it('shows a carousel with a card per placeholder entry in both sections', () => {
    const el = render();
    expect(el.querySelectorAll('#news .event-carousel-card').length).toBe(5);
    expect(el.querySelectorAll('#events .event-carousel-card').length).toBe(5);
  });

  it('shows a Discord link', () => {
    expect(render().querySelector('[data-testid="discord-link"]')).toBeTruthy();
  });

  it('navigates the news carousel independently of the events carousel', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const newsNext = el.querySelector('#news [aria-label="Show next event"]') as HTMLElement;
    newsNext.click();
    fixture.detectChanges();

    const activeIn = (section: string) =>
      Array.from(el.querySelectorAll(`${section} .event-carousel-card`)).findIndex((card) =>
        card.classList.contains('is-active'),
      );
    expect(activeIn('#news')).toBe(1);
    expect(activeIn('#events')).toBe(0);
  });
});

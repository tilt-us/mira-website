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

  it('shows the event carousel with a card per placeholder event', () => {
    const el = render();
    expect(el.querySelector('app-event-carousel')).toBeTruthy();
    expect(el.querySelectorAll('.event-carousel-card').length).toBe(5);
  });

  it('shows a Discord link', () => {
    expect(render().querySelector('[data-testid="discord-link"]')).toBeTruthy();
  });

  it('pauses the news marquee while it is hovered and resumes afterwards', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const marquees = el.querySelectorAll('.marquee');
    expect(marquees.length).toBe(1);

    marquees[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    const track = el.querySelector('.marquee-track') as HTMLElement;
    expect(track.classList.contains('is-paused')).toBe(true);

    marquees[0].dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(track.classList.contains('is-paused')).toBe(false);
  });
});

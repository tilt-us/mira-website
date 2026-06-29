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

  it('shows the news and events sections', () => {
    const el = render();
    expect(el.querySelector('#news')).toBeTruthy();
    expect(el.querySelector('#events')).toBeTruthy();
  });

  it('shows a Discord link', () => {
    expect(render().querySelector('[data-testid="discord-link"]')).toBeTruthy();
  });

  it('pauses both carousels in sync when one is hovered', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const marquees = el.querySelectorAll('.marquee');
    expect(marquees.length).toBe(2);

    marquees[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    const tracks = Array.from(el.querySelectorAll('.marquee-track'));
    expect(tracks.every((track) => track.classList.contains('is-paused'))).toBe(true);
  });
});

import { Component, signal } from '@angular/core';

import { DownloadButton } from '../download/download-button/download-button';
import { Reveal } from '../shared/reveal';
import { CardCarousel, CarouselCard } from '../shared/card-carousel/card-carousel';

@Component({
  selector: 'app-home',
  imports: [DownloadButton, Reveal, CardCarousel],
  templateUrl: './home.html',
})
export class Home {
  // Placeholder until the real community invite exists (tracked in the wiki).
  protected readonly discordUrl = '#';

  // Shared so both carousels pause together and stay in sync.
  protected readonly carouselsPaused = signal(false);

  // Placeholder content — no news/events backend yet (tracked in the wiki).
  // Will later be the latest ~5 entries from the backend.
  protected readonly news: CarouselCard[] = [
    { id: 'news-1', title: 'Coming soon', body: 'News about Mira will appear here.' },
    { id: 'news-2', title: 'Devlog', body: 'Behind-the-scenes updates are on the way.' },
    { id: 'news-3', title: 'Patch notes', body: 'Release notes will be posted here.' },
    { id: 'news-4', title: 'Community', body: 'Player highlights coming soon.' },
    { id: 'news-5', title: 'Stay tuned', body: 'Follow along for the latest.' },
  ];

  protected readonly events: CarouselCard[] = [
    { id: 'event-1', title: 'Coming soon', body: 'Upcoming events will be listed here.' },
    { id: 'event-2', title: 'Tournaments', body: 'Competitive events are being planned.' },
    { id: 'event-3', title: 'Playtests', body: 'Open playtest sessions soon.' },
    { id: 'event-4', title: 'Launch', body: 'Release date to be announced.' },
    { id: 'event-5', title: 'Dev streams', body: 'Live sessions with the team soon.' },
  ];

  protected setCarouselsPaused(paused: boolean): void {
    this.carouselsPaused.set(paused);
  }
}

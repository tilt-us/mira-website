import { Component, signal } from '@angular/core';

import { DownloadButton } from '../download/download-button/download-button';
import { Reveal } from '../shared/reveal';
import { CardCarousel, CarouselCard } from '../shared/card-carousel/card-carousel';
import {
  CharacterShowcase,
  ShowcaseCharacter,
} from './character-showcase/character-showcase';
import { DISCORD_INVITE_URL } from '../shared/community';

@Component({
  selector: 'app-home',
  imports: [DownloadButton, Reveal, CardCarousel, CharacterShowcase],
  templateUrl: './home.html',
})
export class Home {
  protected readonly discordUrl = DISCORD_INVITE_URL;

  // Shared so both carousels pause together and stay in sync.
  protected readonly carouselsPaused = signal(false);

  // Reuses the approved client wallpapers; bios are placeholder copy
  // until real lore exists (tracked in the wiki).
  protected readonly characters: ShowcaseCharacter[] = [
    {
      id: 'lira',
      name: 'Lira',
      epithet: 'The Timeweaver',
      description:
        'Bends the flow of battle to her will, rewinding mistakes and hastening allies before the enemy can react.',
      image: '/lira-wallpaper.png',
    },
    {
      id: 'ignara',
      name: 'Ignara',
      epithet: 'The Flameheart',
      description:
        'A frontline duelist who trades safety for raw power, burning brighter the longer a fight goes on.',
      image: '/ignara-wallpaper.png',
    },
    {
      id: 'yuna',
      name: 'Yuna',
      epithet: 'The Stormcaller',
      description:
        'Commands wind and lightning from afar, controlling space and punishing anyone who groups up.',
      image: '/yuna-wallpaper.png',
    },
    {
      id: 'sophia',
      name: 'Sophia',
      epithet: 'The Lightbringer',
      description:
        'A guardian who shields the team and turns incoming damage into openings for a counterattack.',
      image: '/sophia-wallpaper.png',
    },
  ];

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

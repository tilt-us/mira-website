import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { mapAuthErrorMessage } from '../auth/application/auth.service';

import { DownloadButton } from '../download/adapters/ui/download-button/download-button';
import { Reveal } from '../shared/reveal';
import { CarouselCard, EventCarousel } from '../shared/event-carousel/event-carousel';
import { CharacterShowcase, ShowcaseCharacter } from './character-showcase/character-showcase';
import { DISCORD_INVITE_URL } from '../shared/community';

@Component({
  selector: 'app-home',
  imports: [DownloadButton, Reveal, EventCarousel, CharacterShowcase],
  templateUrl: './home.html',
})
export class Home {
  protected readonly discordUrl = DISCORD_INVITE_URL;
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  protected readonly authErrorMessage = signal('');
  protected readonly authErrorPinned = signal(false);
  private authErrorDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly OAUTH_ERROR_STORAGE_KEY = 'mira.auth.oauthError';

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

  // News and events share one carousel: this site only covers the game, so
  // neither alone fills a row. Placeholder content — no backend endpoint yet
  // (tracked in the wiki). Will later be the latest ~6 entries from the backend.
  protected readonly news: CarouselCard[] = [
    { id: 'news-1', title: 'Coming soon', body: 'News and events about Mira will appear here.' },
    { id: 'news-2', title: 'Devlog', body: 'Behind-the-scenes updates are on the way.' },
    { id: 'news-3', title: 'Patch notes', body: 'Release notes will be posted here.' },
    { id: 'news-4', title: 'Tournaments', body: 'Competitive events are being planned.' },
    { id: 'news-5', title: 'Playtests', body: 'Open playtest sessions soon.' },
    { id: 'news-6', title: 'Dev streams', body: 'Live sessions with the team soon.' },
  ];

  constructor() {
    this.route?.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((queryParams) => {
      const hasQueryError =
        queryParams.has('kc_error') ||
        queryParams.has('error') ||
        queryParams.has('error_description');

      const message = hasQueryError
        ? this.getQueryAuthErrorMessage(queryParams)
        : this.getStoredOAuthErrorMessage();

      if (!message) {
        this.clearAuthErrorMessage();
        return;
      }

      this.showAuthErrorToast(message);
      if (hasQueryError) {
        this.clearOAuthQueryParams();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearAuthErrorTimer();
    });
  }

  private clearOAuthQueryParams(): void {
    const url = new URL(window.location.href);
    if (url.pathname !== '/' && url.pathname !== '/auth') {
      return;
    }

    if (!url.searchParams.has('kc_error') && !url.searchParams.has('error') && !url.searchParams.has('error_description')) {
      return;
    }

    url.searchParams.delete('kc_error');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    url.searchParams.delete('mira_error_redirected');
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('session_state');

    const search = url.searchParams.toString();
    const nextUrl = `${url.pathname}${search ? `?${search}` : ''}`;
    window.history.replaceState({}, document.title, nextUrl);
  }

  private getQueryAuthErrorMessage(queryParams: ActivatedRoute['snapshot']['queryParamMap']): string {
    const error = queryParams.get('error_description') ?? queryParams.get('error');

    if (error) {
      return mapAuthErrorMessage(error);
    }

    if (queryParams.get('kc_error') === '1') {
      return 'Der Login wurde abgebrochen.';
    }

    return 'Unbekannter Fehler bitte erneut versuchen';
  }

  private getStoredOAuthErrorMessage(): string {
    try {
      const raw = sessionStorage.getItem(Home.OAUTH_ERROR_STORAGE_KEY);

      if (!raw) {
        return '';
      }

      sessionStorage.removeItem(Home.OAUTH_ERROR_STORAGE_KEY);
      const parsed = JSON.parse(raw) as {
        code?: string | null;
        description?: string | null;
        kcError?: boolean;
      };

      if (parsed.description || parsed.code) {
        return mapAuthErrorMessage(parsed.description ?? parsed.code ?? '');
      }

      if (parsed.kcError) {
        return 'Der Login wurde abgebrochen.';
      }

      return 'Unbekannter Fehler bitte erneut versuchen';
    } catch {
      return '';
    }
  }

  private showAuthErrorToast(message: string): void {
    this.clearAuthErrorTimer();
    this.authErrorPinned.set(false);
    this.authErrorMessage.set(message);

    this.scheduleAuthErrorDismiss();
  }

  protected dismissAuthErrorMessage(): void {
    this.clearAuthErrorMessage();
  }

  protected toggleAuthErrorPin(): void {
    this.authErrorPinned.update((pinned) => {
      const nextPinned = !pinned;

      if (nextPinned) {
        this.clearAuthErrorTimer();
      } else {
        this.scheduleAuthErrorDismiss();
      }

      return nextPinned;
    });
  }

  private scheduleAuthErrorDismiss(): void {
    if (this.authErrorPinned()) {
      return;
    }

    this.authErrorDismissTimer = setTimeout(() => {
      this.authErrorMessage.set('');
      this.authErrorPinned.set(false);
      this.authErrorDismissTimer = null;
    }, 5000);
  }

  private clearAuthErrorTimer(): void {
    if (this.authErrorDismissTimer !== null) {
      clearTimeout(this.authErrorDismissTimer);
      this.authErrorDismissTimer = null;
    }
  }

  private clearAuthErrorMessage(): void {
    this.clearAuthErrorTimer();
    this.authErrorPinned.set(false);
    this.authErrorMessage.set('');
  }
}

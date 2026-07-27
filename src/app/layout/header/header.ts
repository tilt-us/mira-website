import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../auth/application/auth.service';
import { AuthPage } from '../../auth/adapters/ui/auth-page';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, AuthPage],
  templateUrl: './header.html',
  host: {
    '(document:keydown.escape)': 'closeOverlays()',
    '(window:scroll)': 'syncScrolled()',
  },
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly avatarImageError = signal(false);
  private lastAvatarUrl: string | null = null;

  // Primary navigation tabs; the placeholder ones are wired in app.routes.
  protected readonly tabs = [
    { path: '/leaderboards', label: 'Leaderboards' },
    { path: '/characters', label: 'Characters' },
    { path: '/builds', label: 'Builds' },
    { path: '/streamers', label: 'Streamers' },
    { path: '/report', label: 'Report' },
  ];

  // The header floats transparently over the hero and gains a solid
  // backdrop once the page is scrolled (see header.html class binding).
  protected readonly scrolled = signal(false);

  // Controls the small "logged-in" popover anchored to the user button.
  protected readonly menuOpen = signal(false);
  private readonly blockedSocialDomains = [
    'googleusercontent.com',
    'discordapp.com',
    'discord.com',
  ];

  constructor() {
    // Pick up an initial scroll offset, e.g. after a reload mid-page.
    this.syncScrolled();

    effect(() => {
      const avatarUrl = this.auth.user()?.avatarUrl ?? null;

      if (avatarUrl !== this.lastAvatarUrl) {
        this.lastAvatarUrl = avatarUrl;
        this.avatarImageError.set(false);
      }
    });
  }

  protected syncScrolled(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected closeAuthPopup(): void {
    this.auth.closeLoginPopup();
  }

  protected closeOverlays(): void {
    this.closeMenu();
    this.closeAuthPopup();
  }

  protected get avatarLabel(): string {
    const raw =
      this.auth.user()?.displayName ||
      this.auth.user()?.preferredUsername ||
      this.auth.user()?.email ||
      'Profil';
    const trimmed = raw.trim();

    if (!trimmed) {
      return 'P';
    }

    return trimmed.charAt(0).toUpperCase();
  }

  protected canShowAvatarImage(): boolean {
    const avatarUrl = this.auth.user()?.avatarUrl;

    if (!avatarUrl || this.avatarImageError()) {
      return false;
    }

    if (this.auth.user()?.avatarRightsConsented === false) {
      if (this.isBlockedSocialAvatar(avatarUrl)) {
        return false;
      }
    }

    return true;
  }

  private isBlockedSocialAvatar(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return this.blockedSocialDomains.some((domain) => host.endsWith(domain));
    } catch {
      return false;
    }
  }

  protected logout(): void {
    this.auth.logout();
    this.closeMenu();
  }

  protected openAuth(): void {
    this.auth.openLoginPopup();
    this.menuOpen.set(false);
  }

  protected onAuthPopupClosed(): void {
    this.closeAuthPopup();
  }

  protected onAvatarError(): void {
    this.avatarImageError.set(true);
  }
}

import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
    '(window:scroll)': 'syncScrolled()',
  },
})
export class Header {
  protected readonly auth = inject(AuthService);

  // Primary navigation tabs; each targets a placeholder page (see app.routes).
  protected readonly tabs = [
    { path: '/leaderboards', label: 'Leaderboards' },
    { path: '/builds', label: 'Builds' },
    { path: '/streamers', label: 'Streamers' },
    { path: '/report', label: 'Report' },
  ];

  // The header floats transparently over the hero and gains a solid
  // backdrop once the page is scrolled (see header.html class binding).
  protected readonly scrolled = signal(false);

  // Controls the small "logged-in" popover anchored to the user button.
  protected readonly menuOpen = signal(false);

  constructor() {
    // Pick up an initial scroll offset, e.g. after a reload mid-page.
    this.syncScrolled();
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

  protected logout(): void {
    this.auth.logout();
    this.closeMenu();
  }
}

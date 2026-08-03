import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Reveal } from '../../../shared/reveal';

/**
 * Shell for the Builds feature. Browsing what the community published and
 * building your own loadout are two different jobs, so each gets its own route
 * under `/builds`; this component supplies the shared hero and the switcher
 * that sits at the top of both sub-pages.
 */
@Component({
  selector: 'app-builds-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Reveal],
  templateUrl: './builds-page.html',
})
export class BuildsPage {
  protected readonly tabs = [
    { path: 'community', label: 'Community Builds', hint: 'Discover what others play' },
    { path: 'my', label: 'Item Builder', hint: 'Create and publish your own' },
  ];
}

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Reveal } from '../shared/reveal';

/**
 * Shell for the Builds feature. Browsing what the community published and
 * managing your own builds are two different jobs, so each gets its own route
 * under `/builds` and this component only supplies the shared hero and tabs.
 */
@Component({
  selector: 'app-builds-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Reveal],
  templateUrl: './builds-page.html',
})
export class BuildsPage {
  protected readonly tabs = [
    { path: 'community', label: 'Community', hint: 'Discover what others play' },
    { path: 'my', label: 'My builds', hint: 'Create and publish your own' },
  ];
}

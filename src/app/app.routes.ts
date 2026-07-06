import { Routes } from '@angular/router';

import { Home } from './home/home';
import { LegalPage } from './legal/legal-page/legal-page';
import { PlaceholderPage } from './placeholder/placeholder-page';
import { UserSettings } from './user-settings/user-settings';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'settings', component: UserSettings },
  {
    path: 'leaderboards',
    component: PlaceholderPage,
    data: {
      placeholder: {
        title: 'Leaderboards',
        tagline: 'See who is climbing the ranks in Mira.',
      },
    },
  },
  {
    path: 'builds',
    component: PlaceholderPage,
    data: {
      placeholder: {
        title: 'Builds',
        tagline: 'Craft, share and discover powerful builds.',
      },
    },
  },
  {
    path: 'streamers',
    component: PlaceholderPage,
    data: {
      placeholder: {
        title: 'Streamers',
        tagline: 'Meet the YouTube and Twitch partners playing Mira.',
      },
    },
  },
  {
    path: 'report',
    component: PlaceholderPage,
    data: {
      placeholder: {
        title: 'Report',
        tagline: 'Found a bug or a rule-breaker? Let us know here.',
      },
    },
  },
  {
    path: 'terms-of-use',
    component: LegalPage,
    data: { slug: 'terms-of-use' },
  },
  {
    path: 'privacy-policy',
    component: LegalPage,
    data: { slug: 'privacy-policy' },
  },
];

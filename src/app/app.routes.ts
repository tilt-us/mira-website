import { Routes } from '@angular/router';

import { BuildsPage } from './builds/adapters/ui/builds-page';
import { CommunityBuilds } from './builds/adapters/ui/community-builds/community-builds';
import { MyBuilds } from './builds/adapters/ui/my-builds/my-builds';
import { CharactersPage } from './characters/characters-page/characters-page';
import { Home } from './home/home';
import { JobsPage } from './jobs/jobs-page';
import { LegalPage } from './legal/adapters/ui/legal-page';
import { PlaceholderPage } from './placeholder/placeholder-page';
import { UserSettings } from './settings/adapters/ui/user-settings';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'auth', redirectTo: '', pathMatch: 'full' },
  { path: 'settings', component: UserSettings },
  { path: 'characters', component: CharactersPage },
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
    component: BuildsPage,
    children: [
      { path: '', redirectTo: 'community', pathMatch: 'full' },
      { path: 'community', component: CommunityBuilds },
      { path: 'my', component: MyBuilds },
    ],
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
  { path: 'jobs', component: JobsPage },
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

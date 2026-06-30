import { Routes } from '@angular/router';

import { Home } from './home/home';
import { LegalPage } from './legal/legal-page/legal-page';

export const routes: Routes = [
  { path: '', component: Home },
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

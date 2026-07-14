import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DISCORD_INVITE_URL } from '../../shared/community';

interface FooterLink {
  label: string;
  path: string;
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly year = new Date().getFullYear();
  protected readonly discordUrl = DISCORD_INVITE_URL;

  // Explore links and "Report" are placeholder pages for now (tracked in the wiki).
  protected readonly columns: FooterColumn[] = [
    {
      heading: 'Explore',
      links: [
        { label: 'Home', path: '/' },
        { label: 'Leaderboards', path: '/leaderboards' },
        { label: 'Builds', path: '/builds' },
        { label: 'Streamers', path: '/streamers' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'Jobs', path: '/jobs' },
        { label: 'Report', path: '/report' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Terms of Use', path: '/terms-of-use' },
        { label: 'Privacy Policy', path: '/privacy-policy' },
      ],
    },
  ];
}

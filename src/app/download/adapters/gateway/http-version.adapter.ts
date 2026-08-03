import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

import type { ReleaseInfo, VersionGateway } from '../../domain/ports';
import { getApiBaseUrl } from '../../../api-client';

/** Outbound adapter: reads the release manifest, falling back to the latest.json feed. */
export function createVersionGateway(): VersionGateway {
  const http = inject(HttpClient);
  const apiBaseUrl = getApiBaseUrl();
  const installerManifestUrl =
    `${apiBaseUrl}/downloads/game-sources/installer/manifest.json`;
  const gameSourcesLatestUrl = `${apiBaseUrl}/downloads/game-sources/latest.json`;

  return {
    fetchLatestRelease: () =>
      http
        .get<ReleaseInfo>(installerManifestUrl)
        .pipe(catchError(() => http.get<ReleaseInfo>(gameSourcesLatestUrl))),
  };
}

import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

import type { ReleaseInfo, VersionGateway } from '../../domain/ports';

const INSTALLER_MANIFEST_URL =
  'https://api.tilt-us.com/downloads/game-sources/installer/manifest.json';
const GAME_SOURCES_LATEST_URL = 'https://api.tilt-us.com/downloads/game-sources/latest.json';

/** Outbound adapter: reads the release manifest, falling back to the latest.json feed. */
export function createVersionGateway(): VersionGateway {
  const http = inject(HttpClient);

  return {
    fetchLatestRelease: () =>
      http
        .get<ReleaseInfo>(INSTALLER_MANIFEST_URL)
        .pipe(catchError(() => http.get<ReleaseInfo>(GAME_SOURCES_LATEST_URL))),
  };
}

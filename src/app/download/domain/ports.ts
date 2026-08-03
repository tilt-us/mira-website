import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { createVersionGateway } from '../adapters/gateway/http-version.adapter';
import { createDownloadGateway } from '../adapters/gateway/browser-download.adapter';

/** Raw release descriptor as served by the download endpoints. */
export interface ReleaseInfo {
  version?: string | null;
  tag?: string | null;
  tag_name?: string | null;
}

/** Outbound port: resolves the latest published release. */
export interface VersionGateway {
  fetchLatestRelease(): Observable<ReleaseInfo>;
}

/** Outbound port: hands a URL to the browser to start a download. */
export interface DownloadGateway {
  trigger(url: string): void;
}

export const VERSION_GATEWAY = new InjectionToken<VersionGateway>(
  'VERSION_GATEWAY',
  { providedIn: 'root', factory: createVersionGateway },
);

export const DOWNLOAD_GATEWAY = new InjectionToken<DownloadGateway>(
  'DOWNLOAD_GATEWAY',
  { providedIn: 'root', factory: createDownloadGateway },
);

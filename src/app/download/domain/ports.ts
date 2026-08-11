import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { createVersionGateway } from '../adapters/gateway/http-version.adapter';
import { createDownloadGateway } from '../adapters/gateway/browser-download.adapter';
import type { InstallerManifest, LatestInstallerManifest } from './models';

/** Outbound port: reads Garage manifests for the current download environment. */
export interface VersionGateway {
  fetchLatestManifest(): Observable<LatestInstallerManifest>;
  fetchInstallerManifest(url: string): Observable<InstallerManifest>;
}

/** Outbound port: hands a URL to the browser to start a download. */
export interface DownloadGateway {
  trigger(url: string): void;
}

export const VERSION_GATEWAY = new InjectionToken<VersionGateway>('VERSION_GATEWAY', {
  providedIn: 'root',
  factory: createVersionGateway,
});

export const DOWNLOAD_GATEWAY = new InjectionToken<DownloadGateway>('DOWNLOAD_GATEWAY', {
  providedIn: 'root',
  factory: createDownloadGateway,
});

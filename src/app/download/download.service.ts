import { DOCUMENT, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { DownloadTarget, Os } from './download.types';

// Source of truth for the current release: reports the latest version and
// links to the per-artifact manifests.
const LATEST_JSON_URL =
  'https://api.tilt-us.com/downloads/game-sources/latest.json';

const DOWNLOAD_BASE =
  'https://api.tilt-us.com/downloads/game-sources/installer';

export const FALLBACK_VERSION = '1.0.0';

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  private version$?: Observable<string>;

  detectOs(
    userAgent: string = this.document.defaultView?.navigator.userAgent ?? '',
  ): Os {
    const ua = userAgent.toLowerCase();
    // Mobile first: Android reports "Linux", iOS reports "Mac"-like tokens.
    if (/android|iphone|ipad|ipod/.test(ua)) {
      return 'unknown';
    }
    if (/windows/.test(ua)) {
      return 'windows';
    }
    if (/mac/.test(ua)) {
      return 'mac';
    }
    if (/linux/.test(ua)) {
      return 'linux';
    }
    return 'unknown';
  }

  getLatestVersion(): Observable<string> {
    this.version$ ??= this.http
      .get<{ version?: string | null }>(LATEST_JSON_URL)
      .pipe(
        map((release) => this.normaliseVersion(release.version)),
        catchError(() => of(FALLBACK_VERSION)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.version$;
  }

  buildDownloadUrl(target: DownloadTarget, version: string): string {
    // Installers are served flat from the base; the version lives in the name.
    return `${DOWNLOAD_BASE}/${this.fileName(target, version)}`;
  }

  triggerDownload(url: string): void {
    this.document.defaultView?.location.assign(url);
  }

  private normaliseVersion(raw: string | undefined | null): string {
    const version = (raw ?? '').trim().replace(/^v/i, '');
    return version || FALLBACK_VERSION;
  }

  private fileName(target: DownloadTarget, v: string): string {
    switch (target) {
      case 'windows':
        return `mira-installer-${v}-windows-mira-installer.exe`;
      case 'linux-arch':
        return `mira-installer-${v}-linux-Mira-Installer.AppImage`;
      case 'linux-fedora':
        return `mira-installer-${v}-linux-Mira-Installer-${v}-1.x86_64.rpm`;
      case 'linux-debian':
        return `mira-installer-${v}-linux-Mira-Installer_${v}_amd64.deb`;
      case 'mac':
        return `mira-installer-${v}-macos-Mira-Installer_${v}_aarch64.dmg`;
    }
  }
}

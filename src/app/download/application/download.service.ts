import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { DownloadTarget, Os } from '../domain/models';
import { detectLinuxTarget, detectOs } from '../domain/os-detection';
import { DOWNLOAD_GATEWAY, VERSION_GATEWAY } from '../domain/ports';
import { getApiBaseUrl } from '../../api-client';

export const FALLBACK_VERSION = '1.0.0';

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly document = inject(DOCUMENT);
  private readonly versionGateway = inject(VERSION_GATEWAY);
  private readonly downloadGateway = inject(DOWNLOAD_GATEWAY);

  private version$?: Observable<string>;

  detectOs(userAgent: string = this.currentUserAgent()): Os {
    return detectOs(userAgent);
  }

  detectLinuxTarget(userAgent: string = this.currentUserAgent()): DownloadTarget | null {
    return detectLinuxTarget(userAgent);
  }

  getLatestVersion(): Observable<string> {
    this.version$ ??= this.versionGateway.fetchLatestRelease().pipe(
      map((release) =>
        this.normaliseVersion(release.version ?? release.tag ?? release.tag_name),
      ),
      catchError(() => of(FALLBACK_VERSION)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.version$;
  }

  buildDownloadUrl(target: DownloadTarget, version: string): string {
    return `${getApiBaseUrl()}/downloads/game-sources/installer/${this.fileName(target, version)}`;
  }

  triggerDownload(url: string): void {
    this.downloadGateway.trigger(url);
  }

  private currentUserAgent(): string {
    return this.document.defaultView?.navigator.userAgent ?? '';
  }

  private normaliseVersion(tag: string | undefined | null): string {
    const version = (tag ?? '').trim().replace(/^v/i, '');
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
        return 'install-macos.sh';
    }
  }
}

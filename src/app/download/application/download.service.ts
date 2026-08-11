import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';

import {
  DownloadTarget,
  InstallerArtifact,
  InstallerManifest,
  LatestInstallerManifest,
  Os,
} from '../domain/models';
import { detectLinuxTarget, detectOs } from '../domain/os-detection';
import { DOWNLOAD_GATEWAY, VERSION_GATEWAY } from '../domain/ports';

export const FALLBACK_VERSION = '1.0.0';

export type DownloadErrorCode = 'no-compatible-artifact' | 'download-trigger-failed';

export class DownloadError extends Error {
  constructor(
    readonly code: DownloadErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DownloadError';
  }
}

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly document = inject(DOCUMENT);
  private readonly versionGateway = inject(VERSION_GATEWAY);
  private readonly downloadGateway = inject(DOWNLOAD_GATEWAY);

  private latestManifest$?: Observable<LatestInstallerManifest>;
  private installerManifest$?: Observable<InstallerManifest>;

  detectOs(userAgent: string = this.currentUserAgent()): Os {
    return detectOs(userAgent);
  }

  detectLinuxTarget(userAgent: string = this.currentUserAgent()): DownloadTarget | null {
    return detectLinuxTarget(userAgent);
  }

  getLatestVersion(): Observable<string> {
    return this.latestManifest().pipe(
      map((manifest) => this.normaliseVersion(manifest.git.version ?? manifest.git.tag)),
      catchError(() => of(FALLBACK_VERSION)),
    );
  }

  download(target: DownloadTarget): Observable<void> {
    return this.installerManifest().pipe(
      map((manifest) => this.selectArtifact(manifest, target).url),
      tap((url) => {
        try {
          this.downloadGateway.trigger(url);
        } catch {
          throw new DownloadError(
            'download-trigger-failed',
            'The browser could not start the installer download.',
          );
        }
      }),
      map(() => undefined),
    );
  }

  private currentUserAgent(): string {
    return this.document.defaultView?.navigator.userAgent ?? '';
  }

  private normaliseVersion(tag: string | undefined | null): string {
    const version = (tag ?? '').trim().replace(/^v/i, '');
    return version || FALLBACK_VERSION;
  }

  private latestManifest(): Observable<LatestInstallerManifest> {
    this.latestManifest$ ??= this.versionGateway
      .fetchLatestManifest()
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.latestManifest$;
  }

  private installerManifest(): Observable<InstallerManifest> {
    this.installerManifest$ ??= this.latestManifest().pipe(
      switchMap((latest) =>
        this.versionGateway.fetchInstallerManifest(latest.installerManifestUrl),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.installerManifest$;
  }

  private selectArtifact(manifest: InstallerManifest, target: DownloadTarget): InstallerArtifact {
    let artifact: InstallerArtifact | undefined;
    switch (target) {
      case 'windows':
        artifact = manifest.platforms.windows;
        break;
      case 'linux-arch':
        artifact = manifest.platforms.linux?.appImage;
        break;
      case 'linux-fedora':
        artifact = manifest.platforms.linux?.rpm;
        break;
      case 'linux-debian':
        artifact = manifest.platforms.linux?.deb;
        break;
      case 'mac':
        artifact = manifest.platforms.macos;
        break;
    }

    if (!artifact) {
      throw new DownloadError(
        'no-compatible-artifact',
        `No compatible installer artifact is available for ${target}.`,
      );
    }

    return artifact;
  }
}

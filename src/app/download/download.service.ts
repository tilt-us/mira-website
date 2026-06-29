import { DOCUMENT, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { DownloadTarget, Os } from './download.types';

/** GitHub API endpoint that always points at the newest published release. */
const GITHUB_LATEST_RELEASE_URL =
  'https://api.github.com/repos/tilt-us/mira-clients/releases/latest';

/** Base path on the Tilt download server (the version segment is appended). */
const DOWNLOAD_BASE =
  'https://api.tilt-us.com/downloads/mira/game-sources/installer/releases';

/** Version used when the latest release cannot be determined (network error etc.). */
export const FALLBACK_VERSION = '1.0.0';

/**
 * Single source of truth for everything "download the game client":
 * detecting the visitor's OS, resolving the latest version and building the
 * matching installer URLs. Kept free of UI so it is trivially unit-testable.
 */
@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  /** Cached latest-version stream (resolved once, shared by all callers). */
  private version$?: Observable<string>;

  /**
   * Detects the desktop operating system from a user-agent string.
   * Mobile platforms resolve to `unknown` because there is no mobile installer.
   *
   * @param userAgent User-agent to inspect; defaults to the current browser's.
   */
  detectOs(
    userAgent: string = this.document.defaultView?.navigator.userAgent ?? '',
  ): Os {
    const ua = userAgent.toLowerCase();
    // Mobile first: Android reports "Linux" and iOS reports "Mac"-like tokens,
    // but neither has a desktop installer, so they must not be misclassified.
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

  /**
   * Resolves the latest released version (e.g. `"1.0.0"`) from the
   * mira-clients GitHub releases. Falls back to {@link FALLBACK_VERSION} on any
   * error. The HTTP call is made at most once and the result is cached.
   */
  getLatestVersion(): Observable<string> {
    this.version$ ??= this.http
      .get<{ tag_name?: string | null }>(GITHUB_LATEST_RELEASE_URL)
      .pipe(
        map((release) => this.normaliseVersion(release.tag_name)),
        catchError(() => of(FALLBACK_VERSION)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.version$;
  }

  /**
   * Builds the absolute installer URL for a given target and version,
   * following the Tilt download-server naming scheme.
   */
  buildDownloadUrl(target: DownloadTarget, version: string): string {
    return `${DOWNLOAD_BASE}/v${version}/${this.fileName(target, version)}`;
  }

  /** Triggers the browser download (navigation) for the given URL. */
  triggerDownload(url: string): void {
    this.document.defaultView?.location.assign(url);
  }

  /** Strips a leading "v" from a release tag; falls back when missing/empty. */
  private normaliseVersion(tag: string | undefined | null): string {
    const version = (tag ?? '').trim().replace(/^v/i, '');
    return version || FALLBACK_VERSION;
  }

  /** Maps a target + version to the exact installer file name. */
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

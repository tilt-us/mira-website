import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { DownloadService, FALLBACK_VERSION } from './download.service';

const RELEASE_URL =
  'https://api.github.com/repos/tilt-us/mira-clients/releases/latest';
const DL_BASE =
  'https://api.tilt-us.com/downloads/mira/game-sources/installer/releases';

describe('DownloadService', () => {
  describe('OS detection & URL building', () => {
    let service: DownloadService;
    let http: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          DownloadService,
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });
      service = TestBed.inject(DownloadService);
      http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('detects Windows', () => {
      expect(service.detectOs('Mozilla/5.0 (Windows NT 10.0; Win64)')).toBe(
        'windows',
      );
    });

    it('detects macOS', () => {
      expect(
        service.detectOs('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)'),
      ).toBe('mac');
    });

    it('detects Linux', () => {
      expect(service.detectOs('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux');
    });

    it('treats Android as unknown (no desktop installer)', () => {
      expect(service.detectOs('Mozilla/5.0 (Linux; Android 13; Pixel)')).toBe(
        'unknown',
      );
    });

    it('treats iPhone as unknown', () => {
      expect(service.detectOs('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe(
        'unknown',
      );
    });

    it('returns unknown for an empty user agent', () => {
      expect(service.detectOs('')).toBe('unknown');
    });

    it('falls back to the browser user agent when no argument is given', () => {
      expect(['windows', 'mac', 'linux', 'unknown']).toContain(
        service.detectOs(),
      );
    });

    it('builds the Windows URL', () => {
      expect(service.buildDownloadUrl('windows', '1.2.3')).toBe(
        `${DL_BASE}/v1.2.3/mira-installer-1.2.3-windows-mira-installer.exe`,
      );
    });

    it('builds the Arch AppImage URL', () => {
      expect(service.buildDownloadUrl('linux-arch', '1.2.3')).toBe(
        `${DL_BASE}/v1.2.3/mira-installer-1.2.3-linux-Mira-Installer.AppImage`,
      );
    });

    it('builds the Fedora RPM URL', () => {
      expect(service.buildDownloadUrl('linux-fedora', '1.2.3')).toBe(
        `${DL_BASE}/v1.2.3/mira-installer-1.2.3-linux-Mira-Installer-1.2.3-1.x86_64.rpm`,
      );
    });

    it('builds the Debian DEB URL', () => {
      expect(service.buildDownloadUrl('linux-debian', '1.2.3')).toBe(
        `${DL_BASE}/v1.2.3/mira-installer-1.2.3-linux-Mira-Installer_1.2.3_amd64.deb`,
      );
    });

    it('builds the macOS DMG URL', () => {
      expect(service.buildDownloadUrl('mac', '1.2.3')).toBe(
        `${DL_BASE}/v1.2.3/mira-installer-1.2.3-macos-Mira-Installer_1.2.3_aarch64.dmg`,
      );
    });

    it('maps the release tag and strips the leading "v"', () => {
      let result: string | undefined;
      service.getLatestVersion().subscribe((v) => (result = v));
      http.expectOne(RELEASE_URL).flush({ tag_name: 'v2.3.4' });
      expect(result).toBe('2.3.4');
    });

    it('falls back when the request fails', () => {
      let result: string | undefined;
      service.getLatestVersion().subscribe((v) => (result = v));
      http
        .expectOne(RELEASE_URL)
        .flush('boom', { status: 500, statusText: 'Server Error' });
      expect(result).toBe(FALLBACK_VERSION);
    });

    it('falls back when the tag is missing', () => {
      let result: string | undefined;
      service.getLatestVersion().subscribe((v) => (result = v));
      http.expectOne(RELEASE_URL).flush({});
      expect(result).toBe(FALLBACK_VERSION);
    });

    it('caches the request across multiple subscribers', () => {
      service.getLatestVersion().subscribe();
      service.getLatestVersion().subscribe();
      // Only one HTTP request is expected thanks to shareReplay.
      http.expectOne(RELEASE_URL).flush({ tag_name: 'v1.0.0' });
    });
  });

  describe('triggerDownload', () => {
    it('navigates the window to the given URL', () => {
      const assign = (url: string) => calls.push(url);
      const calls: string[] = [];
      TestBed.configureTestingModule({
        providers: [
          DownloadService,
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DOCUMENT, useValue: { defaultView: { location: { assign } } } },
        ],
      });
      TestBed.inject(DownloadService).triggerDownload('https://x/file.exe');
      expect(calls).toEqual(['https://x/file.exe']);
    });

    it('does nothing when there is no window', () => {
      TestBed.configureTestingModule({
        providers: [
          DownloadService,
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DOCUMENT, useValue: { defaultView: null } },
        ],
      });
      const service = TestBed.inject(DownloadService);
      expect(() => service.triggerDownload('https://x/file.exe')).not.toThrow();
    });
  });
});

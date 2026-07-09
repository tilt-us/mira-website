import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { DownloadService, FALLBACK_VERSION } from './download.service';

const RELEASE_URL =
  'https://api.tilt-us.com/downloads/game-sources/installer/manifest.json';
const FALLBACK_RELEASE_URL = 'https://api.tilt-us.com/downloads/game-sources/latest.json';
const DL_BASE = 'https://api.tilt-us.com/downloads/game-sources/installer';

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
        `${DL_BASE}/mira-installer-1.2.3-windows-mira-installer.exe`,
      );
    });

    it('builds the Arch AppImage URL', () => {
      expect(service.buildDownloadUrl('linux-arch', '1.2.3')).toBe(
        `${DL_BASE}/mira-installer-1.2.3-linux-Mira-Installer.AppImage`,
      );
    });

    it('builds the Fedora RPM URL', () => {
      expect(service.buildDownloadUrl('linux-fedora', '1.2.3')).toBe(
        `${DL_BASE}/mira-installer-1.2.3-linux-Mira-Installer-1.2.3-1.x86_64.rpm`,
      );
    });

    it('builds the Debian DEB URL', () => {
      expect(service.buildDownloadUrl('linux-debian', '1.2.3')).toBe(
        `${DL_BASE}/mira-installer-1.2.3-linux-Mira-Installer_1.2.3_amd64.deb`,
      );
    });

    it('builds the macOS installer script URL', () => {
      expect(service.buildDownloadUrl('mac', '1.2.3')).toBe(
        `${DL_BASE}/install-macos.sh`,
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
      http.expectOne(FALLBACK_RELEASE_URL).flush({});
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

    it('reads the version field from the latest JSON payload', () => {
      let result: string | undefined;
      service.getLatestVersion().subscribe((v) => (result = v));
      http.expectOne(RELEASE_URL).flush({ version: '3.0.0' });
      expect(result).toBe('3.0.0');
    });

    it('falls back to the latest endpoint when the manifest endpoint fails', () => {
      let result: string | undefined;
      service.getLatestVersion().subscribe((v) => (result = v));

      const manifestReq = http.expectOne(RELEASE_URL);
      manifestReq.flush('boom', { status: 500, statusText: 'Server Error' });

      const fallbackReq = http.expectOne(FALLBACK_RELEASE_URL);
      fallbackReq.flush({ tag: 'v6.0.0' });

      expect(result).toBe('6.0.0');
    });

    it('falls back to the hardcoded version when both endpoints fail', () => {
      let result: string | undefined;
      service.getLatestVersion().subscribe((v) => (result = v));

      const manifestReq = http.expectOne(RELEASE_URL);
      manifestReq.flush('boom', { status: 500, statusText: 'Server Error' });

      const fallbackReq = http.expectOne(FALLBACK_RELEASE_URL);
      fallbackReq.flush('boom', { status: 500, statusText: 'Server Error' });

      expect(result).toBe(FALLBACK_VERSION);
    });

    it('uses the tag field as a fallback when version is not available', () => {
      let result: string | undefined;
      service.getLatestVersion().subscribe((v) => (result = v));
      http.expectOne(RELEASE_URL).flush({ tag: 'v4.0.0' });
      expect(result).toBe('4.0.0');
    });

    it('detects Arch Linux users', () => {
      expect(
        service.detectLinuxTarget(
          'Mozilla/5.0 (X11; Linux x86_64; Arch Linux)',
        ),
      ).toBe('linux-arch');
    });

    it('detects Debian Linux users', () => {
      expect(
        service.detectLinuxTarget(
          'Mozilla/5.0 (X11; Linux x86_64; Ubuntu',
        ),
      ).toBe('linux-debian');
    });

    it('detects Linux Mint users as Debian-based', () => {
      expect(
        service.detectLinuxTarget(
          'Mozilla/5.0 (X11; Linux x86_64) Linux Mint/21.2',
        ),
      ).toBe('linux-debian');
    });

    it('detects Pop!_OS users as Debian-based', () => {
      expect(
        service.detectLinuxTarget(
          'Mozilla/5.0 (X11; Linux x86_64) pop!_os 22.04',
        ),
      ).toBe('linux-debian');
    });

    it('detects Fedora Linux users', () => {
      expect(
        service.detectLinuxTarget(
          'Mozilla/5.0 (X11; Linux x86_64; Fedora)',
        ),
      ).toBe('linux-fedora');
    });

    it('returns null when detectLinuxTarget is used with non-Linux user agent', () => {
      expect(service.detectLinuxTarget('Mozilla/5.0 (Windows NT 10.0; Win64)')).toBe(
        null,
      );
    });

    it('falls back to AppImage for unknown Linux when distro is not identified', () => {
      expect(
        service.detectLinuxTarget('Mozilla/5.0 (X11; Linux x86_64)'),
      ).toBe('linux-arch');
    });
  });

  describe('triggerDownload', () => {
    let calls: string[];

    beforeEach(() => {
      TestBed.resetTestingModule();
      calls = [];
    });

    it('navigates the window to the given URL', () => {
      const assign = (url: string) => calls.push(url);

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

  describe('detectOs default argument', () => {
    let service: DownloadService;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          DownloadService,
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: DOCUMENT, useValue: { defaultView: null } },
        ],
      });
      service = TestBed.inject(DownloadService);
    });

    it('returns unknown when there is no browser window', () => {
      expect(service.detectOs()).toBe('unknown');
    });
  });
});

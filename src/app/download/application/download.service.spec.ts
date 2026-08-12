import { DOCUMENT } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { DownloadManifestError } from '../adapters/gateway/http-version.adapter';
import { applyRuntimeDownloadConfig, resetRuntimeDownloadConfig } from '../download-config';
import { DOWNLOAD_GATEWAY } from '../domain/ports';
import {
  describeDownloadFailure,
  DownloadError,
  DownloadService,
  FALLBACK_VERSION,
  logDownloadFailure,
} from './download.service';

const INSTALLER_MANIFEST_URL = 'https://downloads.tilt-us.com/installer/manifest.json';
const ARTIFACTS = {
  schemaVersion: 1,
  environment: 'prod',
  installer: {
    windows: { url: 'https://cdn.tilt-us.com/mira/windows-installer.exe' },
    macos: { url: 'https://cdn.tilt-us.com/mira/macos-installer.dmg' },
    linux: {
      appImage: { url: 'https://cdn.tilt-us.com/mira/mira-installer.AppImage' },
      deb: { url: 'https://cdn.tilt-us.com/mira/mira-installer.deb' },
      rpm: { url: 'https://cdn.tilt-us.com/mira/mira-installer.rpm' },
    },
  },
};

function latest(installerManifestUrl = INSTALLER_MANIFEST_URL) {
  return {
    schemaVersion: 1,
    environment: 'prod',
    git: { version: '99.0.0', tag: 'v99.0.0' },
    installerManifestUrl,
  };
}

describe('DownloadService', () => {
  let service: DownloadService;
  let http: HttpTestingController;
  let triggered: string[];

  function setup(downloadBaseUrl = 'https://downloads.tilt-us.com'): void {
    applyRuntimeDownloadConfig(downloadBaseUrl);
    triggered = [];
    TestBed.configureTestingModule({
      providers: [
        DownloadService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DOWNLOAD_GATEWAY, useValue: { trigger: (url: string) => triggered.push(url) } },
      ],
    });
    service = TestBed.inject(DownloadService);
    http = TestBed.inject(HttpTestingController);
  }

  function download(target: 'windows' | 'mac' | 'linux-arch' | 'linux-debian' | 'linux-fedora') {
    let error: unknown;
    service.download(target).subscribe({ error: (value) => (error = value) });
    return () => error;
  }

  function flushManifestChain(downloadBaseUrl = 'https://downloads.tilt-us.com'): void {
    http.expectOne(`${downloadBaseUrl}/latest.json`).flush(latest());
    http.expectOne(INSTALLER_MANIFEST_URL).flush(ARTIFACTS);
  }

  beforeEach(() => setup());

  afterEach(() => {
    http.verify();
    resetRuntimeDownloadConfig();
    TestBed.resetTestingModule();
  });

  it.each([
    [
      new DownloadManifestError('latest-manifest-unavailable', ''),
      'latest installer manifest is unavailable',
    ],
    [
      new DownloadManifestError('invalid-latest-manifest', ''),
      'latest installer manifest is invalid',
    ],
    [
      new DownloadManifestError('missing-installer-manifest-url', ''),
      'does not provide an installer URL',
    ],
    [
      new DownloadManifestError('installer-manifest-unavailable', ''),
      'installer manifest is unavailable',
    ],
    [new DownloadManifestError('invalid-installer-manifest', ''), 'installer manifest is invalid'],
    [new DownloadError('no-compatible-artifact', ''), 'No installer is available'],
    [new DownloadError('download-trigger-failed', ''), 'download URL could not be opened'],
    [new Error('unknown'), 'download could not be started'],
  ])('describes download failures for the UI', (error, message) => {
    expect(describeDownloadFailure(error)).toContain(message);
  });

  it('logs only the stable download error code', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    logDownloadFailure(new DownloadManifestError('invalid-installer-manifest', 'sensitive URL'));
    expect(warn).toHaveBeenCalledWith('Mira installer download failed.', {
      code: 'invalid-installer-manifest',
    });
    warn.mockRestore();
  });

  it.each([
    ['dev', 'https://downloads.tilt-us.com/dev'],
    ['staging', 'https://downloads.tilt-us.com/staging'],
    ['prod', 'https://downloads.tilt-us.com'],
  ] as const)('loads latest.json from the %s download base URL', (_environment, baseUrl) => {
    TestBed.resetTestingModule();
    setup(baseUrl);
    service.getLatestVersion().subscribe();
    http.expectOne(`${baseUrl}/latest.json`).flush(latest());
  });

  it('reads installerManifestUrl from latest.json before loading the installer manifest', () => {
    download('windows');
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush(latest());
    http.expectOne(INSTALLER_MANIFEST_URL).flush(ARTIFACTS);

    expect(triggered).toEqual(['https://cdn.tilt-us.com/mira/windows-installer.exe']);
  });

  it.each([
    ['windows', 'https://cdn.tilt-us.com/mira/windows-installer.exe'],
    ['linux-arch', 'https://cdn.tilt-us.com/mira/mira-installer.AppImage'],
    ['linux-debian', 'https://cdn.tilt-us.com/mira/mira-installer.deb'],
    ['linux-fedora', 'https://cdn.tilt-us.com/mira/mira-installer.rpm'],
    ['mac', 'https://cdn.tilt-us.com/mira/macos-installer.dmg'],
  ] as const)('selects the manifest-provided %s installer', (target, artifactUrl) => {
    download(target);
    flushManifestChain();
    expect(triggered).toEqual([artifactUrl]);
  });

  it('does not derive a versioned filename from latest.json metadata', () => {
    download('windows');
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush(latest());
    http.expectOne(INSTALLER_MANIFEST_URL).flush(ARTIFACTS);

    expect(triggered[0]).toBe('https://cdn.tilt-us.com/mira/windows-installer.exe');
    expect(triggered[0]).not.toContain('99.0.0');
  });

  it('uses latest.json version metadata only for display', () => {
    let version: string | undefined;
    service.getLatestVersion().subscribe((value) => (version = value));
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush(latest());
    expect(version).toBe('99.0.0');
  });

  it('uses the latest git tag when no version metadata is provided', () => {
    let version: string | undefined;
    service.getLatestVersion().subscribe((value) => (version = value));
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush({
      ...latest(),
      git: { tag: 'v99.1.0' },
    });
    expect(version).toBe('99.1.0');
  });

  it('uses the display fallback when the latest manifest has no version metadata', () => {
    let version: string | undefined;
    service.getLatestVersion().subscribe((value) => (version = value));
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush({
      ...latest(),
      git: {},
    });
    expect(version).toBe(FALLBACK_VERSION);
  });

  it('uses a display-only fallback version when latest metadata is unavailable', () => {
    let version: string | undefined;
    service.getLatestVersion().subscribe((value) => (version = value));
    http
      .expectOne('https://downloads.tilt-us.com/latest.json')
      .flush({}, { status: 500, statusText: 'offline' });
    expect(version).toBe(FALLBACK_VERSION);
  });

  it('fails a download cleanly when latest.json is unavailable', () => {
    const getError = download('windows');
    http
      .expectOne('https://downloads.tilt-us.com/latest.json')
      .flush({}, { status: 503, statusText: 'unavailable' });

    expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
      code: 'latest-manifest-unavailable',
    });
    expect(triggered).toEqual([]);
  });

  it('fails cleanly for invalid latest.json', () => {
    const getError = download('windows');
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush({ schemaVersion: 1 });

    expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
      code: 'invalid-latest-manifest',
    });
    expect(triggered).toEqual([]);
  });

  it('fails cleanly when latest.json omits installerManifestUrl', () => {
    const getError = download('windows');
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush({
      schemaVersion: 1,
      environment: 'prod',
      git: {},
    });

    expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
      code: 'missing-installer-manifest-url',
    });
  });

  it('fails cleanly when the installer manifest is unavailable', () => {
    const getError = download('windows');
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush(latest());
    http.expectOne(INSTALLER_MANIFEST_URL).flush({}, { status: 503, statusText: 'unavailable' });

    expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
      code: 'installer-manifest-unavailable',
    });
  });

  it('fails cleanly for an invalid installer manifest', () => {
    const getError = download('windows');
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush(latest());
    http.expectOne(INSTALLER_MANIFEST_URL).flush({ schemaVersion: 1, environment: 'prod' });

    expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
      code: 'invalid-installer-manifest',
    });
  });

  it('fails when no compatible installer artifact exists', () => {
    const getError = download('linux-debian');
    http.expectOne('https://downloads.tilt-us.com/latest.json').flush(latest());
    http.expectOne(INSTALLER_MANIFEST_URL).flush({
      schemaVersion: 1,
      environment: 'prod',
      installer: { linux: { appImage: { url: 'https://cdn.tilt-us.com/mira.AppImage' } } },
    });

    expect(getError()).toMatchObject<Partial<DownloadError>>({
      code: 'no-compatible-artifact',
    });
  });

  it('reports browser download trigger failures', () => {
    TestBed.resetTestingModule();
    applyRuntimeDownloadConfig('https://downloads.tilt-us.com');
    TestBed.configureTestingModule({
      providers: [
        DownloadService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: DOWNLOAD_GATEWAY,
          useValue: {
            trigger: () => {
              throw new Error('blocked');
            },
          },
        },
      ],
    });
    service = TestBed.inject(DownloadService);
    http = TestBed.inject(HttpTestingController);

    const getError = download('windows');
    flushManifestChain();
    expect(getError()).toMatchObject<Partial<DownloadError>>({ code: 'download-trigger-failed' });
  });

  it('detects desktop operating systems and excludes mobile clients', () => {
    expect(service.detectOs('Mozilla/5.0 (Windows NT 10.0; Win64)')).toBe('windows');
    expect(service.detectOs('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)')).toBe('mac');
    expect(service.detectOs('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux');
    expect(service.detectOs('Mozilla/5.0 (Linux; Android 13; Pixel)')).toBe('unknown');
  });

  it('selects Linux package targets from user-agent hints', () => {
    expect(service.detectLinuxTarget('Mozilla/5.0 (X11; Linux x86_64; Ubuntu)')).toBe(
      'linux-debian',
    );
    expect(service.detectLinuxTarget('Mozilla/5.0 (X11; Linux x86_64; Fedora)')).toBe(
      'linux-fedora',
    );
    expect(service.detectLinuxTarget('Mozilla/5.0 (X11; Linux x86_64; Arch Linux)')).toBe(
      'linux-arch',
    );
    expect(service.detectLinuxTarget('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux-arch');
  });

  it('returns unknown when no browser window is available', () => {
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
    http = TestBed.inject(HttpTestingController);
    expect(service.detectOs()).toBe('unknown');
  });
});

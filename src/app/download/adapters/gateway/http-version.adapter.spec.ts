import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, expect, it } from 'vitest';
import type { Observable } from 'rxjs';

import { createVersionGateway, DownloadManifestError } from './http-version.adapter';
import { applyRuntimeDownloadConfig, resetRuntimeDownloadConfig } from '../../download-config';
import type { VersionGateway } from '../../domain/ports';

const LATEST_URL = 'https://downloads.tilt-us.com/latest.json';
const INSTALLER_URL = 'https://downloads.tilt-us.com/installer/manifest.json';

function captureError<T>(source: Observable<T>): () => unknown {
  let error: unknown;
  source.subscribe({ error: (value) => (error = value) });
  return () => error;
}

describe('createVersionGateway', () => {
  let gateway: VersionGateway;
  let http: HttpTestingController;

  function setup(): void {
    applyRuntimeDownloadConfig('https://downloads.tilt-us.com');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    gateway = TestBed.runInInjectionContext(createVersionGateway);
    http = TestBed.inject(HttpTestingController);
  }

  function latestRequest() {
    const source = gateway.fetchLatestManifest();
    const getError = captureError(source);
    return { request: http.expectOne(LATEST_URL), getError };
  }

  function installerRequest() {
    const source = gateway.fetchInstallerManifest(INSTALLER_URL);
    const getError = captureError(source);
    return { request: http.expectOne(INSTALLER_URL), getError };
  }

  beforeEach(setup);

  afterEach(() => {
    http.verify();
    resetRuntimeDownloadConfig();
    TestBed.resetTestingModule();
  });

  it('accepts optional latest git metadata and fully described installer artifacts', () => {
    let latestVersion: string | undefined;
    gateway.fetchLatestManifest().subscribe((value) => (latestVersion = value.git.version));
    const latestRequest = http.expectOne(LATEST_URL);
    expect(latestRequest.request.method).toBe('GET');
    expect(latestRequest.request.withCredentials).toBe(false);
    expect(latestRequest.request.headers.has('Authorization')).toBe(false);
    latestRequest.flush({
      schemaVersion: 1,
      environment: 'prod',
      installerManifestUrl: INSTALLER_URL,
    });
    expect(latestVersion).toBeUndefined();

    let installerSize: number | undefined;
    gateway
      .fetchInstallerManifest(INSTALLER_URL)
      .subscribe((value) => (installerSize = value.platforms.windows?.size));
    const installerRequest = http.expectOne(INSTALLER_URL);
    expect(installerRequest.request.method).toBe('GET');
    expect(installerRequest.request.withCredentials).toBe(false);
    expect(installerRequest.request.headers.has('Authorization')).toBe(false);
    installerRequest.flush({
      schemaVersion: 1,
      environment: 'prod',
      platforms: {
        windows: {
          url: 'https://downloads.tilt-us.com/installer/windows/mira-installer.exe',
          sha256: 'abc',
          size: 123,
        },
      },
    });
    expect(installerSize).toBe(123);
  });

  it.each([
    [{ schemaVersion: 1, environment: 1, installerManifestUrl: INSTALLER_URL }],
    [{ schemaVersion: 1, environment: '', installerManifestUrl: INSTALLER_URL }],
    [[]],
  ])('rejects malformed latest manifests', (payload) => {
    const { request, getError } = latestRequest();
    request.flush(payload);
    expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
      code: 'invalid-latest-manifest',
    });
  });

  it.each(['', 'not a URL', 'ftp://downloads.tilt-us.com/installer/manifest.json'])(
    'rejects invalid installerManifestUrl values',
    (installerManifestUrl) => {
      const { request, getError } = latestRequest();
      request.flush({ schemaVersion: 1, environment: 'prod', installerManifestUrl });
      expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
        code: 'invalid-latest-manifest',
      });
    },
  );

  it('rejects credentials in installerManifestUrl values', () => {
    const { request, getError } = latestRequest();
    request.flush({
      schemaVersion: 1,
      environment: 'prod',
      installerManifestUrl: 'https://user:password@downloads.tilt-us.com/installer/manifest.json',
    });
    expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
      code: 'invalid-latest-manifest',
    });
  });

  it.each([
    [{ schemaVersion: 1, environment: 1, platforms: {} }],
    [{ schemaVersion: 1, environment: 'prod', platforms: [] }],
    [{ schemaVersion: 1, environment: 'prod', platforms: { linux: [] } }],
    [
      {
        schemaVersion: 1,
        environment: 'prod',
        platforms: { windows: { url: 'ftp://downloads.tilt-us.com/mira-installer.exe' } },
      },
    ],
  ])('rejects malformed installer manifests', (payload) => {
    const { request, getError } = installerRequest();
    request.flush(payload);
    expect(getError()).toMatchObject<Partial<DownloadManifestError>>({
      code: 'invalid-installer-manifest',
    });
  });
});

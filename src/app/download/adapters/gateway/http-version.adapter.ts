import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

import type {
  InstallerArtifact,
  InstallerManifest,
  LatestInstallerManifest,
} from '../../domain/models';
import type { VersionGateway } from '../../domain/ports';
import { getDownloadBaseUrl } from '../../download-config';

export type DownloadManifestErrorCode =
  | 'latest-manifest-unavailable'
  | 'invalid-latest-manifest'
  | 'missing-installer-manifest-url'
  | 'installer-manifest-unavailable'
  | 'invalid-installer-manifest';

export class DownloadManifestError extends Error {
  constructor(
    readonly code: DownloadManifestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DownloadManifestError';
  }
}

/** Outbound adapter: reads and validates the Garage manifest chain. */
export function createVersionGateway(): VersionGateway {
  const http = inject(HttpClient);
  const latestManifestUrl = `${getDownloadBaseUrl()}/latest.json`;

  return {
    fetchLatestManifest: () =>
      http.get<unknown>(latestManifestUrl).pipe(
        map(parseLatestInstallerManifest),
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof DownloadManifestError
              ? error
              : new DownloadManifestError(
                  'latest-manifest-unavailable',
                  'The latest installer manifest could not be loaded.',
                ),
          ),
        ),
      ),
    fetchInstallerManifest: (url: string) =>
      http.get<unknown>(url).pipe(
        map(parseInstallerManifest),
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof DownloadManifestError
              ? error
              : new DownloadManifestError(
                  'installer-manifest-unavailable',
                  'The installer manifest could not be loaded.',
                ),
          ),
        ),
      ),
  };
}

function requireRecord(value: unknown, code: DownloadManifestErrorCode): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new DownloadManifestError(code, 'The download manifest must be a JSON object.');
  }
  return value as Record<string, unknown>;
}

function requireSchema(value: Record<string, unknown>, code: DownloadManifestErrorCode): void {
  if (
    value['schemaVersion'] !== 1 ||
    typeof value['environment'] !== 'string' ||
    !value['environment']
  ) {
    throw new DownloadManifestError(code, 'The download manifest has an unsupported schema.');
  }
}

function parseAbsoluteArtifactUrl(value: unknown, code: DownloadManifestErrorCode): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new DownloadManifestError(
      code,
      'The download manifest contains an invalid artifact URL.',
    );
  }

  try {
    const url = new URL(value);
    if (
      !url.hostname ||
      url.username ||
      url.password ||
      (url.protocol !== 'https:' && url.protocol !== 'http:')
    ) {
      throw new Error('invalid URL');
    }
    return url.toString();
  } catch {
    throw new DownloadManifestError(
      code,
      'The download manifest contains an invalid artifact URL.',
    );
  }
}

function parseLatestInstallerManifest(value: unknown): LatestInstallerManifest {
  const manifest = requireRecord(value, 'invalid-latest-manifest');
  requireSchema(manifest, 'invalid-latest-manifest');
  const git =
    manifest['git'] === undefined ? {} : requireRecord(manifest['git'], 'invalid-latest-manifest');

  if (!('installerManifestUrl' in manifest)) {
    throw new DownloadManifestError(
      'missing-installer-manifest-url',
      'The latest installer manifest does not contain installerManifestUrl.',
    );
  }

  return {
    schemaVersion: 1,
    environment: manifest['environment'] as string,
    git: {
      version: optionalString(git['version']),
      tag: optionalString(git['tag']),
    },
    installerManifestUrl: parseAbsoluteArtifactUrl(
      manifest['installerManifestUrl'],
      'invalid-latest-manifest',
    ),
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseArtifact(value: unknown): InstallerArtifact | undefined {
  if (value === undefined) {
    return undefined;
  }

  const artifact = requireRecord(value, 'invalid-installer-manifest');
  return {
    url: parseAbsoluteArtifactUrl(artifact['url'], 'invalid-installer-manifest'),
    ...(typeof artifact['sha256'] === 'string' ? { sha256: artifact['sha256'] } : {}),
    ...(typeof artifact['size'] === 'number' && Number.isFinite(artifact['size'])
      ? { size: artifact['size'] }
      : {}),
  };
}

function parseInstallerManifest(value: unknown): InstallerManifest {
  const manifest = requireRecord(value, 'invalid-installer-manifest');
  requireSchema(manifest, 'invalid-installer-manifest');
  const platforms = requireRecord(manifest['platforms'], 'invalid-installer-manifest');
  const linux =
    platforms['linux'] === undefined
      ? undefined
      : requireRecord(platforms['linux'], 'invalid-installer-manifest');

  return {
    schemaVersion: 1,
    environment: manifest['environment'] as string,
    platforms: {
      windows: parseArtifact(platforms['windows']),
      macos: parseArtifact(platforms['macos']),
      ...(linux
        ? {
            linux: {
              appImage: parseArtifact(linux['appImage']),
              deb: parseArtifact(linux['deb']),
              rpm: parseArtifact(linux['rpm']),
            },
          }
        : {}),
    },
  };
}

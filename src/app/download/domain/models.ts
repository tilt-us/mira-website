export type Os = 'windows' | 'mac' | 'linux' | 'unknown';

export type DownloadTarget = 'windows' | 'linux-arch' | 'linux-fedora' | 'linux-debian' | 'mac';

export interface DownloadOption {
  readonly target: DownloadTarget;
  readonly label: string;
}

export const DOWNLOAD_OPTIONS: readonly DownloadOption[] = [
  { target: 'windows', label: 'Windows (.exe)' },
  { target: 'mac', label: 'macOS · Install Script (.sh)' },
  { target: 'linux-debian', label: 'Linux · Debian / Ubuntu (.deb)' },
  { target: 'linux-fedora', label: 'Linux · Fedora (.rpm)' },
  { target: 'linux-arch', label: 'Linux · Arch / universal (.AppImage)' },
];

export const LINUX_DOWNLOAD_OPTIONS: readonly DownloadOption[] = DOWNLOAD_OPTIONS.filter((option) =>
  option.target.startsWith('linux'),
);

export interface InstallerArtifact {
  readonly url: string;
  readonly sha256?: string;
  readonly size?: number;
}

export interface LatestInstallerManifest {
  readonly schemaVersion: 1;
  readonly environment: string;
  readonly git: {
    readonly version?: string;
    readonly tag?: string;
  };
  readonly installerManifestUrl: string;
}

export interface InstallerManifest {
  readonly schemaVersion: 1;
  readonly environment: string;
  readonly platforms: {
    readonly windows?: InstallerArtifact;
    readonly macos?: InstallerArtifact;
    readonly linux?: {
      readonly appImage?: InstallerArtifact;
      readonly deb?: InstallerArtifact;
      readonly rpm?: InstallerArtifact;
    };
  };
}

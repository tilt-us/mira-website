export type Os = 'windows' | 'mac' | 'linux' | 'unknown';

export type DownloadTarget =
  | 'windows'
  | 'linux-arch'
  | 'linux-fedora'
  | 'linux-debian'
  | 'mac';

export interface DownloadOption {
  readonly target: DownloadTarget;
  readonly label: string;
}

export const DOWNLOAD_OPTIONS: readonly DownloadOption[] = [
  { target: 'windows', label: 'Windows (.exe)' },
  { target: 'mac', label: 'macOS · Apple Silicon (.dmg)' },
  { target: 'linux-debian', label: 'Linux · Debian / Ubuntu (.deb)' },
  { target: 'linux-fedora', label: 'Linux · Fedora (.rpm)' },
  { target: 'linux-arch', label: 'Linux · Arch / universal (.AppImage)' },
];

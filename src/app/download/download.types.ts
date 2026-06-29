/**
 * Detected desktop operating system.
 * `unknown` is used for mobile or unrecognised platforms (no desktop installer).
 */
export type Os = 'windows' | 'mac' | 'linux' | 'unknown';

/** A concrete, downloadable installer variant offered to the user. */
export type DownloadTarget =
  | 'windows'
  | 'linux-arch'
  | 'linux-fedora'
  | 'linux-debian'
  | 'mac';

/** Display metadata for one option shown in the OS-chooser modal. */
export interface DownloadOption {
  readonly target: DownloadTarget;
  /** Human-readable label, e.g. "Windows (.exe)". */
  readonly label: string;
}

/**
 * All installer variants offered in the modal, in display order.
 * The labels are intentionally explicit so users can pick the right package.
 */
export const DOWNLOAD_OPTIONS: readonly DownloadOption[] = [
  { target: 'windows', label: 'Windows (.exe)' },
  { target: 'mac', label: 'macOS · Apple Silicon (.dmg)' },
  { target: 'linux-debian', label: 'Linux · Debian / Ubuntu (.deb)' },
  { target: 'linux-fedora', label: 'Linux · Fedora (.rpm)' },
  { target: 'linux-arch', label: 'Linux · Arch / universal (.AppImage)' },
];

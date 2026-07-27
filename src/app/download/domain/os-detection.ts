import { DownloadTarget, Os } from './models';

/** Maps a user-agent string to the coarse desktop OS (mobile → unknown). */
export function detectOs(userAgent: string): Os {
  const ua = userAgent.toLowerCase();
  // Mobile first: Android reports "Linux", iOS reports "Mac"-like tokens.
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

/** Picks the best Linux installer variant for a user agent, or null when not Linux. */
export function detectLinuxTarget(userAgent: string): DownloadTarget | null {
  const ua = userAgent.toLowerCase();

  if (!/linux/.test(ua)) {
    return null;
  }

  if (
    /debian|ubuntu|linux\s*mint|pop[!_\s-]*os|kubuntu|xubuntu|lubuntu|neon|elementary/.test(
      ua,
    )
  ) {
    return 'linux-debian';
  }

  if (/fedora|rhel|centos|rocky|almalinux/.test(ua)) {
    return 'linux-fedora';
  }

  if (/arch|manjaro|garuda|artix|endeavouros/.test(ua)) {
    return 'linux-arch';
  }

  // Unknown Linux variants (or generic UAs without distro token) fall back to
  // AppImage, which is the most compatible universal Linux installer.
  return 'linux-arch';
}

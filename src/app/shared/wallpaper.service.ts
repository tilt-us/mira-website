import { DOCUMENT, inject, Injectable, signal } from '@angular/core';

/** Background wallpapers, keyed by champion like the Mira client. */
export type Wallpaper = 'lira' | 'ignara' | 'yuna' | 'sophia';

export type WallpaperOptionId = Wallpaper;
export type WallpaperSource = string;

export interface WallpaperOption {
  readonly id: WallpaperOptionId;
  readonly label: string;
}

export const WALLPAPERS: readonly WallpaperOption[] = [
  { id: 'lira', label: 'Lira' },
  { id: 'ignara', label: 'Ignara' },
  { id: 'yuna', label: 'Yuna' },
  { id: 'sophia', label: 'Sophia' },
];

const STORAGE_KEY = 'mira-website-wallpaper';
const DEFAULT_WALLPAPER: Wallpaper = 'lira';
const KNOWN_WALLPAPERS = new Set<WallpaperOptionId>(WALLPAPERS.map((item) => item.id));

/** Image source of a wallpaper; unknown values are treated as a plain URL. */
export function wallpaperImageUrl(wallpaper: WallpaperSource): string {
  return KNOWN_WALLPAPERS.has(wallpaper as Wallpaper)
    ? `/${wallpaper}-wallpaper.png`
    : wallpaper;
}

/**
 * Mirrors the client's wallpaper handling: the choice is persisted in
 * localStorage and applied through the `--app-background-wallpaper` CSS
 * variable on the root element (see app.html / styles.scss).
 */
@Injectable({ providedIn: 'root' })
export class WallpaperService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<WallpaperSource>(this.readStored());

  readonly wallpaper = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  set(wallpaper: Wallpaper): void {
    const normalized = this.normalize(wallpaper);
    this.current.set(normalized);
    this.apply(normalized);
  }

  setFromServer(wallpaper?: string | null): void {
    const normalized = this.normalize(wallpaper);

    if (normalized !== this.current()) {
      this.current.set(normalized);
      this.apply(normalized, false);
    }
  }

  private apply(wallpaper: WallpaperSource, persist = true): void {
    this.document.documentElement.style.setProperty(
      '--app-background-wallpaper',
      this.resolveWallpaperUrl(wallpaper),
    );

    if (!persist) {
      return;
    }

    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, wallpaper);
    } catch {
      // Ignore storage failures (private mode / disabled storage).
    }
  }

  private readStored(): WallpaperSource {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return this.normalize(stored);
    } catch {
      return DEFAULT_WALLPAPER;
    }
  }

  private normalize(wallpaper: unknown): WallpaperSource {
    if (this.isKnownWallpaper(wallpaper)) {
      return wallpaper;
    }

    return DEFAULT_WALLPAPER;
  }

  private isKnownWallpaper(wallpaper: unknown): wallpaper is Wallpaper {
    return typeof wallpaper === 'string' && KNOWN_WALLPAPERS.has(wallpaper as Wallpaper);
  }

  private resolveWallpaperUrl(wallpaper: WallpaperSource): string {
    return `url('${wallpaperImageUrl(wallpaper)}')`;
  }
}

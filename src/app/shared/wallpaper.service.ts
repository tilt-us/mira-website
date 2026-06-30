import { DOCUMENT, inject, Injectable, signal } from '@angular/core';

/** Background wallpapers, keyed by champion like the Mira client. */
export type Wallpaper = 'lira' | 'ignara' | 'yuna' | 'sophia';

export interface WallpaperOption {
  readonly id: Wallpaper;
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

/**
 * Mirrors the client's wallpaper handling: the choice is persisted in
 * localStorage and applied through the `--app-background-wallpaper` CSS
 * variable on the root element (see app.html / styles.scss).
 */
@Injectable({ providedIn: 'root' })
export class WallpaperService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Wallpaper>(this.readStored());

  readonly wallpaper = this.current.asReadonly();

  constructor() {
    this.apply(this.current());
  }

  set(wallpaper: Wallpaper): void {
    this.current.set(wallpaper);
    this.apply(wallpaper);
  }

  private apply(wallpaper: Wallpaper): void {
    this.document.documentElement.style.setProperty(
      '--app-background-wallpaper',
      `url('/${wallpaper}-wallpaper.png')`,
    );
    try {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, wallpaper);
    } catch {
      // Ignore storage failures (private mode / disabled storage).
    }
  }

  private readStored(): Wallpaper {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return WALLPAPERS.some((option) => option.id === stored)
        ? (stored as Wallpaper)
        : DEFAULT_WALLPAPER;
    } catch {
      return DEFAULT_WALLPAPER;
    }
  }
}

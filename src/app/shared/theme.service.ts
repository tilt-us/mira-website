import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

const DEFAULT_ACCENT_COLOR = '#f2c45b';
const DEFAULT_ACCENT_HOVER_COLOR = '#f4cf78';

type HexCode = `#${string}`;

function toHexValue(value: string | null | undefined): HexCode | null {
  if (!value) {
    return null;
  }

  const candidate = value.trim().toLowerCase();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(candidate)) {
    return null;
  }

  if (candidate.length === 4) {
    return `#${candidate[1]}${candidate[1]}${candidate[2]}${candidate[2]}${candidate[3]}${candidate[3]}` as HexCode;
  }

  return candidate as HexCode;
}

function shiftColor(value: string, amount: number): HexCode {
  const hex = value.replace('#', '');
  const to = Number.parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (to >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((to >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (to & 0xff) + amount));

  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}` as HexCode;
}

function getContrastTextColor(background: string): HexCode {
  const hex = background.replace('#', '');
  const value = Number.parseInt(hex, 16);
  const red = ((value >> 16) & 0xff) / 255;
  const green = ((value >> 8) & 0xff) / 255;
  const blue = (value & 0xff) / 255;

  const toLinear = (channel: number) => {
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };

  const luminance =
    0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);

  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);

  return blackContrast >= whiteContrast ? '#101216' : '#f3f4f6';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly accentColor = signal(DEFAULT_ACCENT_COLOR);

  readonly accent = this.accentColor.asReadonly();

  applyDefaults(): void {
    this.applyAccent(DEFAULT_ACCENT_COLOR);
  }

  applyAccent(accentColor?: string | null): void {
    const accent = toHexValue(accentColor) ?? DEFAULT_ACCENT_COLOR;
    const hover = shiftColor(accent, 12);
    const accentForeground = getContrastTextColor(accent);
    const style = this.document.documentElement.style;

    style.setProperty('--app-accent', accent);
    style.setProperty('--app-accent-hover', hover);
    style.setProperty('--app-accent-fg', accentForeground);
    style.setProperty('--app-brand', accent);
    style.setProperty('--app-brand-hover', hover);
    style.setProperty('--app-brand-fg', accentForeground);

    this.accentColor.set(accent);
  }
}

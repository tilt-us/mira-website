import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  function styleVar(name: string): string {
    const doc = TestBed.inject(DOCUMENT);
    return doc.documentElement.style.getPropertyValue(name);
  }

  function clearAccentStyles(): void {
    const doc = TestBed.inject(DOCUMENT);
    doc.documentElement.style.removeProperty('--app-accent');
    doc.documentElement.style.removeProperty('--app-accent-hover');
    doc.documentElement.style.removeProperty('--app-accent-fg');
    doc.documentElement.style.removeProperty('--app-brand');
    doc.documentElement.style.removeProperty('--app-brand-hover');
    doc.documentElement.style.removeProperty('--app-brand-fg');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
    clearAccentStyles();
  });

  it('applies default accent values', () => {
    service.applyDefaults();

    expect(styleVar('--app-accent')).toBe('#f2c45b');
    expect(styleVar('--app-brand')).toBe('#f2c45b');
    expect(service.accent()).toBe('#f2c45b');
  });

  it('normalizes 3-digit hex codes and defaults invalid values', () => {
    service.applyAccent('#f8a');
    expect(styleVar('--app-accent')).toBe('#ff88aa');
    expect(styleVar('--app-accent-hover')).toBe('#ff94b6');

    service.applyAccent('#123456');
    expect(styleVar('--app-accent')).toBe('#123456');

    service.applyAccent('  invalid ');
    expect(styleVar('--app-accent')).toBe('#f2c45b');
  });

  it('falls back to defaults for missing accent value', () => {
    service.applyAccent(undefined);
    expect(styleVar('--app-accent')).toBe('#f2c45b');

    service.applyAccent(null as unknown as string);
    expect(styleVar('--app-accent')).toBe('#f2c45b');
  });

  it('uses dark foreground for light backgrounds', () => {
    service.applyAccent('#ffffff');
    expect(styleVar('--app-accent-fg')).toBe('#101216');
  });

  it('uses light foreground for dark backgrounds', () => {
    service.applyAccent('#000000');
    expect(styleVar('--app-accent-fg')).toBe('#f3f4f6');
  });

  it('clamps hover color channels to valid hex bounds', () => {
    service.applyAccent('#ffffff');
    expect(styleVar('--app-accent-hover')).toBe('#ffffff');

    service.applyAccent('#000000');
    expect(styleVar('--app-accent-hover')).toBe('#0c0c0c');
  });
});

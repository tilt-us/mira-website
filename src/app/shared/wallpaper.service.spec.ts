import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { WallpaperService } from './wallpaper.service';

const STORAGE_KEY = 'mira-website-wallpaper';

function cssVar(): string {
  return document.documentElement.style.getPropertyValue(
    '--app-background-wallpaper',
  );
}

describe('WallpaperService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--app-background-wallpaper');
    TestBed.configureTestingModule({ providers: [WallpaperService] });
  });

  it('defaults to lira and applies it on creation', () => {
    const service = TestBed.inject(WallpaperService);
    expect(service.wallpaper()).toBe('lira');
    expect(cssVar()).toContain('lira-wallpaper.png');
  });

  it('changes the wallpaper, persisting and applying it', () => {
    const service = TestBed.inject(WallpaperService);
    service.set('yuna');

    expect(service.wallpaper()).toBe('yuna');
    expect(cssVar()).toContain('yuna-wallpaper.png');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('yuna');
  });

  it('restores a stored wallpaper on creation', () => {
    localStorage.setItem(STORAGE_KEY, 'sophia');
    const service = TestBed.inject(WallpaperService);

    expect(service.wallpaper()).toBe('sophia');
    expect(cssVar()).toContain('sophia-wallpaper.png');
  });

  it('ignores an invalid stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-wallpaper');
    expect(TestBed.inject(WallpaperService).wallpaper()).toBe('lira');
  });

  it('falls back to the default when storage access throws', () => {
    const throwingDocument = {
      documentElement: { style: { setProperty: () => undefined } },
      defaultView: {
        localStorage: {
          getItem: () => {
            throw new Error('storage blocked');
          },
          setItem: () => {
            throw new Error('storage blocked');
          },
        },
      },
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        WallpaperService,
        { provide: DOCUMENT, useValue: throwingDocument },
      ],
    });

    expect(TestBed.inject(WallpaperService).wallpaper()).toBe('lira');
  });
});

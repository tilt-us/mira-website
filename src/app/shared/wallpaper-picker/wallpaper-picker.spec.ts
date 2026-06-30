import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WallpaperPicker } from './wallpaper-picker';
import { WallpaperService } from '../wallpaper.service';

function byTestId(
  fixture: ComponentFixture<WallpaperPicker>,
  id: string,
): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
}

describe('WallpaperPicker', () => {
  let fixture: ComponentFixture<WallpaperPicker>;
  let service: WallpaperService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [WallpaperPicker],
      providers: [WallpaperService],
    });
    service = TestBed.inject(WallpaperService);
    fixture = TestBed.createComponent(WallpaperPicker);
    fixture.detectChanges();
  });

  function open(): void {
    byTestId(fixture, 'wallpaper-trigger').click();
    fixture.detectChanges();
  }

  it('shows the selected wallpaper on the trigger', () => {
    expect(byTestId(fixture, 'wallpaper-trigger').textContent).toContain('Lira');
    expect(byTestId(fixture, 'wallpaper-listbox')).toBeFalsy();
  });

  it('opens the listbox with every wallpaper', () => {
    open();
    expect(byTestId(fixture, 'wallpaper-listbox')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('[role="option"]').length,
    ).toBe(4);
    expect(
      byTestId(fixture, 'wallpaper-option-lira').getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('selects a wallpaper, applies it and closes', () => {
    open();
    byTestId(fixture, 'wallpaper-option-yuna').click();
    fixture.detectChanges();

    expect(service.wallpaper()).toBe('yuna');
    expect(
      document.documentElement.style.getPropertyValue(
        '--app-background-wallpaper',
      ),
    ).toContain('yuna-wallpaper.png');
    expect(byTestId(fixture, 'wallpaper-listbox')).toBeFalsy();
  });

  it('filters options by the search term', async () => {
    open();
    const search = byTestId(fixture, 'wallpaper-search') as HTMLInputElement;
    search.value = 'so';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain('Sophia');
  });

  it('shows an empty state when nothing matches', async () => {
    open();
    const search = byTestId(fixture, 'wallpaper-search') as HTMLInputElement;
    search.value = 'zzz';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(byTestId(fixture, 'wallpaper-empty')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('[role="option"]').length,
    ).toBe(0);
  });

  it('closes on the click-away layer', () => {
    open();
    byTestId(fixture, 'wallpaper-backdrop').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'wallpaper-listbox')).toBeFalsy();
  });

  it('closes on Escape', () => {
    open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(byTestId(fixture, 'wallpaper-listbox')).toBeFalsy();
  });
});

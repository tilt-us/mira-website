import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Wallpaper,
  WALLPAPERS,
  WallpaperService,
} from '../wallpaper.service';

/**
 * Searchable dropdown for choosing the background wallpaper, modelled on the
 * client's settings "Background" listbox. Applies the choice live via
 * {@link WallpaperService}.
 */
@Component({
  selector: 'app-wallpaper-picker',
  imports: [FormsModule],
  templateUrl: './wallpaper-picker.html',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class WallpaperPicker {
  private readonly wallpapers = inject(WallpaperService);

  protected readonly open = signal(false);
  protected readonly search = signal('');

  protected readonly selectedLabel = computed(
    () =>
      WALLPAPERS.find((option) => option.id === this.wallpapers.wallpaper())
        ?.label ?? '',
  );

  protected readonly options = computed(() => {
    const term = this.search().trim().toLowerCase();
    return WALLPAPERS.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  });

  protected isSelected(id: Wallpaper): boolean {
    return this.wallpapers.wallpaper() === id;
  }

  protected toggle(): void {
    this.open.update((open) => !open);
  }

  protected close(): void {
    this.open.set(false);
    this.search.set('');
  }

  protected select(id: Wallpaper): void {
    this.wallpapers.set(id);
    this.close();
  }
}

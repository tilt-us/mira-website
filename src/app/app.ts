import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { DevNotice } from './layout/dev-notice/dev-notice';
import { WallpaperService } from './shared/wallpaper.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, DevNotice],
  templateUrl: './app.html',
})
export class App {
  // Instantiated on bootstrap so the stored wallpaper is applied immediately.
  private readonly wallpapers = inject(WallpaperService);
}

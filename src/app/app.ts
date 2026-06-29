import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DownloadButton } from './download/download-button/download-button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DownloadButton],
  templateUrl: './app.html',
})
export class App {}

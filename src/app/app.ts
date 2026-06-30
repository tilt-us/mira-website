import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { DevNotice } from './layout/dev-notice/dev-notice';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, DevNotice],
  templateUrl: './app.html',
})
export class App {}

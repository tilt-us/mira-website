import { Component, signal } from '@angular/core';

/**
 * Dismissible "still in development" banner shown on page load. Dismissal is
 * in-memory only, so it reappears on a fresh load — which is the intent.
 */
@Component({
  selector: 'app-dev-notice',
  templateUrl: './dev-notice.html',
})
export class DevNotice {
  protected readonly visible = signal(true);

  protected dismiss(): void {
    this.visible.set(false);
  }
}

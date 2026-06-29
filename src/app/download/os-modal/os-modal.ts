import { Component, inject, input, output } from '@angular/core';

import { DownloadService } from '../download.service';
import { DOWNLOAD_OPTIONS, DownloadOption, DownloadTarget } from '../download.types';

/**
 * Accessible modal that lets the user pick an operating system / package format
 * manually. Each option is a real download link (so it can be copied or opened
 * in a new tab); choosing one also closes the modal.
 */
@Component({
  selector: 'app-os-modal',
  templateUrl: './os-modal.html',
  host: {
    // Close on Escape for keyboard users.
    '(document:keydown.escape)': 'close.emit()',
  },
})
export class OsModal {
  private readonly downloads = inject(DownloadService);

  /** Version the generated download links should point at. */
  readonly version = input.required<string>();

  /** Options to display; defaults to the full set of installers. */
  readonly options = input<readonly DownloadOption[]>(DOWNLOAD_OPTIONS);

  /** Emitted when the modal should be dismissed. */
  readonly close = output<void>();

  /** Absolute download URL for one option, based on the current version. */
  protected hrefFor(target: DownloadTarget): string {
    return this.downloads.buildDownloadUrl(target, this.version());
  }
}

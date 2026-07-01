import { Component, inject, input, output } from '@angular/core';

import { DownloadService } from '../download.service';
import { DOWNLOAD_OPTIONS, DownloadOption, DownloadTarget } from '../download.types';

@Component({
  selector: 'app-os-modal',
  templateUrl: './os-modal.html',
  host: {
    '(document:keydown.escape)': 'close.emit()',
  },
})
export class OsModal {
  private readonly downloads = inject(DownloadService);

  readonly version = input.required<string>();
  readonly options = input<readonly DownloadOption[]>(DOWNLOAD_OPTIONS);
  readonly close = output<void>();

  protected hrefFor(target: DownloadTarget): string {
    return this.downloads.buildDownloadUrl(target, this.version());
  }
}

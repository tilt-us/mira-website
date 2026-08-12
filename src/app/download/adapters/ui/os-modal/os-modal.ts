import { Component, inject, input, output, signal } from '@angular/core';

import {
  describeDownloadFailure,
  DownloadService,
  logDownloadFailure,
} from '../../../application/download.service';
import { DOWNLOAD_OPTIONS, DownloadOption, DownloadTarget } from '../../../domain/models';

@Component({
  selector: 'app-os-modal',
  templateUrl: './os-modal.html',
  host: {
    '(document:keydown.escape)': 'close.emit()',
  },
})
export class OsModal {
  private readonly downloads = inject(DownloadService);

  readonly options = input<readonly DownloadOption[]>(DOWNLOAD_OPTIONS);
  readonly close = output<void>();
  protected readonly downloadError = signal<string | null>(null);

  protected download(target: DownloadTarget): void {
    this.downloadError.set(null);
    this.downloads.download(target).subscribe({
      next: () => this.close.emit(),
      error: (error) => {
        logDownloadFailure(error);
        this.downloadError.set(describeDownloadFailure(error));
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';

import {
  describeDownloadFailure,
  DownloadService,
  logDownloadFailure,
} from '../../../application/download.service';
import { DOWNLOAD_OPTIONS, DownloadOption, DownloadTarget } from '../../../domain/models';
import { OsModal } from '../os-modal/os-modal';

@Component({
  selector: 'app-download-button',
  imports: [OsModal],
  templateUrl: './download-button.html',
})
export class DownloadButton {
  private readonly downloads = inject(DownloadService);

  protected readonly os = this.downloads.detectOs();
  protected readonly modalOpen = signal(false);
  protected readonly modalOptions = signal<readonly DownloadOption[]>(DOWNLOAD_OPTIONS);
  protected readonly downloadError = signal<string | null>(null);

  protected primaryLabel(): string {
    switch (this.os) {
      case 'windows':
        return 'Download for Windows';
      case 'mac':
        return 'Download for macOS';
      case 'linux':
        return 'Download for Linux';
      default:
        return 'Download';
    }
  }

  protected onPrimaryClick(): void {
    if (this.os === 'windows' || this.os === 'mac') {
      this.startDownload(this.os);
      return;
    }

    if (this.os === 'linux') {
      const linuxTarget = this.downloads.detectLinuxTarget() ?? 'linux-arch';
      this.startDownload(linuxTarget);
      return;
    }

    this.openModal(DOWNLOAD_OPTIONS);
  }

  protected openModal(options: readonly DownloadOption[] = DOWNLOAD_OPTIONS): void {
    this.modalOptions.set(options);
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  private startDownload(target: DownloadTarget): void {
    this.downloadError.set(null);
    this.downloads.download(target).subscribe({
      error: (error) => {
        logDownloadFailure(error);
        this.downloadError.set(describeDownloadFailure(error));
      },
    });
  }
}

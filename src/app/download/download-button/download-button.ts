import { Component, inject, signal } from '@angular/core';

import { DownloadService, FALLBACK_VERSION } from '../download.service';
import {
  DOWNLOAD_OPTIONS,
  DownloadOption,
} from '../download.types';
import { OsModal } from '../os-modal/os-modal';

@Component({
  selector: 'app-download-button',
  imports: [OsModal],
  templateUrl: './download-button.html',
})
export class DownloadButton {
  private readonly downloads = inject(DownloadService);

  protected readonly os = this.downloads.detectOs();
  protected readonly version = signal(FALLBACK_VERSION);
  protected readonly modalOpen = signal(false);
  protected readonly modalOptions =
    signal<readonly DownloadOption[]>(DOWNLOAD_OPTIONS);

  constructor() {
    this.downloads.getLatestVersion().subscribe((v) => this.version.set(v));
  }

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
      this.downloads.triggerDownload(
        this.downloads.buildDownloadUrl(this.os, this.version()),
      );
      return;
    }

    if (this.os === 'linux') {
      const linuxTarget = this.downloads.detectLinuxTarget() ?? 'linux-arch';
      this.downloads.triggerDownload(
        this.downloads.buildDownloadUrl(linuxTarget, this.version()),
      );
      return;
    }

    this.openModal(
      DOWNLOAD_OPTIONS,
    );
  }

  protected openModal(
    options: readonly DownloadOption[] = DOWNLOAD_OPTIONS,
  ): void {
    this.modalOptions.set(options);
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }
}

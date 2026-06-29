import { Component, inject, signal } from '@angular/core';

import { DownloadService, FALLBACK_VERSION } from '../download.service';
import { OsModal } from '../os-modal/os-modal';

/**
 * Primary "Download game" control.
 *
 * The main button auto-detects the visitor's OS: on Windows/macOS it downloads
 * the matching installer directly; on Linux (distro not detectable) or unknown
 * platforms it opens the OS-chooser modal. A secondary link always opens the
 * modal so users can grab any other build (Linux / macOS).
 */
@Component({
  selector: 'app-download-button',
  imports: [OsModal],
  templateUrl: './download-button.html',
})
export class DownloadButton {
  private readonly downloads = inject(DownloadService);

  /** OS detected once at construction time. */
  protected readonly os = this.downloads.detectOs();

  /** Latest version; starts at the fallback and updates once resolved. */
  protected readonly version = signal(FALLBACK_VERSION);

  /** Whether the OS-chooser modal is currently visible. */
  protected readonly modalOpen = signal(false);

  constructor() {
    this.downloads.getLatestVersion().subscribe((v) => this.version.set(v));
  }

  /** Label for the main button based on the detected OS. */
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

  /**
   * Main button action: download directly when we can pick a single installer
   * (Windows/macOS), otherwise let the user choose in the modal.
   */
  protected onPrimaryClick(): void {
    if (this.os === 'windows' || this.os === 'mac') {
      this.downloads.triggerDownload(
        this.downloads.buildDownloadUrl(this.os, this.version()),
      );
    } else {
      this.openModal();
    }
  }

  protected openModal(): void {
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }
}

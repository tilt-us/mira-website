import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { DownloadButton } from './download-button';
import { DownloadService } from '../../../application/download.service';
import { DownloadTarget, Os } from '../../../domain/models';

/** Lightweight stand-in for {@link DownloadService} with controllable OS. */
class StubDownloadService {
  os: Os = 'windows';
  readonly requested: DownloadTarget[] = [];
  linuxTarget: DownloadTarget | null = null;
  failure: unknown;

  detectOs(): Os {
    return this.os;
  }
  detectLinuxTarget() {
    return this.linuxTarget;
  }
  download(target: DownloadTarget) {
    this.requested.push(target);
    return this.failure === undefined ? of(undefined) : throwError(() => this.failure);
  }
}

function byTestId(fixture: ComponentFixture<DownloadButton>, id: string): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
}

function createFixture(os: Os) {
  const stub = new StubDownloadService();
  stub.os = os;
  TestBed.configureTestingModule({
    imports: [DownloadButton],
    providers: [{ provide: DownloadService, useValue: stub }],
  });
  const fixture = TestBed.createComponent(DownloadButton);
  fixture.detectChanges();
  return { fixture, stub };
}

describe('DownloadButton', () => {
  it('labels the button for Windows and downloads the Windows build', () => {
    const { fixture, stub } = createFixture('windows');
    const button = byTestId(fixture, 'primary-download');
    expect(button.textContent).toContain('Windows');

    button.click();
    expect(stub.requested).toEqual(['windows']);
  });

  it('downloads the macOS build for macOS', () => {
    const { fixture, stub } = createFixture('mac');
    expect(byTestId(fixture, 'primary-download').textContent).toContain('macOS');

    byTestId(fixture, 'primary-download').click();
    expect(stub.requested).toEqual(['mac']);
  });

  it('downloads the default Linux AppImage target when distro is not detected', () => {
    const { fixture, stub } = createFixture('linux');
    expect(byTestId(fixture, 'primary-download').textContent).toContain('Linux');

    byTestId(fixture, 'primary-download').click();
    fixture.detectChanges();

    expect(stub.requested).toEqual(['linux-arch']);
    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeFalsy();
  });

  it('downloads direct for detected Arch Linux', () => {
    const { fixture, stub } = createFixture('linux');
    stub.linuxTarget = 'linux-arch';

    byTestId(fixture, 'primary-download').click();

    expect(stub.requested).toEqual(['linux-arch']);
    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeFalsy();
  });

  it('shows a generic label and opens the modal for an unknown OS', () => {
    const { fixture, stub } = createFixture('unknown');
    const button = byTestId(fixture, 'primary-download');
    expect(button.textContent?.trim()).toBe('Download');

    button.click();
    fixture.detectChanges();

    expect(stub.requested).toEqual([]);
    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeTruthy();
  });

  it('opens the modal via the "other systems" button', () => {
    const { fixture } = createFixture('windows');
    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeFalsy();

    byTestId(fixture, 'other-systems').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('app-os-modal li button').length).toBe(5);
  });

  it('closes the modal when it emits close', () => {
    const { fixture } = createFixture('windows');
    byTestId(fixture, 'other-systems').click();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('app-os-modal')).componentInstance.close.emit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeFalsy();
  });

  it('shows and logs a manifest failure instead of silently ignoring it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, stub } = createFixture('windows');
    stub.failure = { code: 'latest-manifest-unavailable' };

    byTestId(fixture, 'primary-download').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'download-error').textContent).toContain(
      'latest installer manifest is unavailable',
    );
    expect(warn).toHaveBeenCalledWith('Mira installer download failed.', {
      code: 'latest-manifest-unavailable',
    });
    warn.mockRestore();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { DownloadButton } from './download-button';
import { DownloadService } from '../download.service';
import { DownloadTarget, Os } from '../download.types';

/** Lightweight stand-in for {@link DownloadService} with controllable OS. */
class StubDownloadService {
  os: Os = 'windows';
  readonly triggered: string[] = [];

  detectOs(): Os {
    return this.os;
  }
  getLatestVersion() {
    return of('9.9.9');
  }
  buildDownloadUrl(target: DownloadTarget, version: string): string {
    return `https://dl/${target}/${version}`;
  }
  triggerDownload(url: string): void {
    this.triggered.push(url);
  }
}

function byTestId(
  fixture: ComponentFixture<DownloadButton>,
  id: string,
): HTMLElement {
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
    expect(stub.triggered).toEqual(['https://dl/windows/9.9.9']);
  });

  it('downloads the macOS build for macOS', () => {
    const { fixture, stub } = createFixture('mac');
    expect(byTestId(fixture, 'primary-download').textContent).toContain('macOS');

    byTestId(fixture, 'primary-download').click();
    expect(stub.triggered).toEqual(['https://dl/mac/9.9.9']);
  });

  it('opens the modal instead of downloading on Linux', () => {
    const { fixture, stub } = createFixture('linux');
    expect(byTestId(fixture, 'primary-download').textContent).toContain('Linux');

    byTestId(fixture, 'primary-download').click();
    fixture.detectChanges();

    expect(stub.triggered).toEqual([]);
    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeTruthy();
  });

  it('shows a generic label and opens the modal for an unknown OS', () => {
    const { fixture, stub } = createFixture('unknown');
    const button = byTestId(fixture, 'primary-download');
    expect(button.textContent?.trim()).toBe('Download');

    button.click();
    fixture.detectChanges();

    expect(stub.triggered).toEqual([]);
    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeTruthy();
  });

  it('opens the modal via the "other systems" button', () => {
    const { fixture } = createFixture('windows');
    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeFalsy();

    byTestId(fixture, 'other-systems').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeTruthy();
  });

  it('closes the modal when it emits close', () => {
    const { fixture } = createFixture('windows');
    byTestId(fixture, 'other-systems').click();
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css('app-os-modal'))
      .componentInstance.close.emit();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-os-modal')).toBeFalsy();
  });
});

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { OsModal } from './os-modal';
import { DownloadService } from '../../../application/download.service';

class StubDownloadService {
  readonly requested: string[] = [];

  download(target: string) {
    this.requested.push(target);
    return of(undefined);
  }
}

@Component({
  imports: [OsModal],
  template: `<app-os-modal (close)="closed = closed + 1" />`,
})
class HostComponent {
  closed = 0;
}

describe('OsModal', () => {
  function setup(): { fixture: ComponentFixture<HostComponent>; downloads: StubDownloadService } {
    const downloads = new StubDownloadService();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: DownloadService, useValue: downloads }],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, downloads };
  }

  it('renders one installer action per option and delegates it to DownloadService', () => {
    const { fixture, downloads } = setup();
    const buttons = fixture.nativeElement.querySelectorAll('li button');

    expect(buttons).toHaveLength(5);
    buttons[0].click();
    expect(downloads.requested).toEqual(['windows']);
  });

  it('emits close on backdrop click', () => {
    const { fixture } = setup();
    fixture.debugElement.query(By.css('[data-testid="backdrop"]')).nativeElement.click();
    expect(fixture.componentInstance.closed).toBe(1);
  });

  it('emits close on the close button', () => {
    const { fixture } = setup();
    fixture.debugElement.query(By.css('[data-testid="modal-close"]')).nativeElement.click();
    expect(fixture.componentInstance.closed).toBe(1);
  });

  it('emits close on Escape', () => {
    const { fixture } = setup();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.closed).toBe(1);
  });

  it('emits close when a download action succeeds', () => {
    const { fixture } = setup();
    const button = fixture.nativeElement.querySelector('li button') as HTMLButtonElement;
    button.click();
    expect(fixture.componentInstance.closed).toBe(1);
  });

  it('keeps the modal open when the download action fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, downloads } = setup();
    downloads.download = () => throwError(() => ({ code: 'no-compatible-artifact' }));

    const button = fixture.nativeElement.querySelector('li button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.closed).toBe(0);
    expect(
      fixture.nativeElement.querySelector('[data-testid="download-error"]').textContent,
    ).toContain('No installer is available');
    expect(warn).toHaveBeenCalledWith('Mira installer download failed.', {
      code: 'no-compatible-artifact',
    });
    warn.mockRestore();
  });
});

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';

import { OsModal } from './os-modal';

@Component({
  imports: [OsModal],
  template: `<app-os-modal [version]="version" (close)="closed = closed + 1" />`,
})
class HostComponent {
  version = '3.2.1';
  closed = 0;
}

describe('OsModal', () => {
  function setup(): ComponentFixture<HostComponent> {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders one download link per option with the version applied', () => {
    const fixture = setup();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a[href]'),
    ) as HTMLAnchorElement[];

    expect(links.length).toBe(5);
    const hrefs = links.map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.every((h) => h.includes('/v3.2.1/'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('-windows-mira-installer.exe'))).toBe(
      true,
    );
    expect(hrefs.some((h) => h.endsWith('_aarch64.dmg'))).toBe(true);
  });

  it('emits close on backdrop click', () => {
    const fixture = setup();
    fixture.debugElement
      .query(By.css('[data-testid="backdrop"]'))
      .nativeElement.click();
    expect(fixture.componentInstance.closed).toBe(1);
  });

  it('emits close on the close button', () => {
    const fixture = setup();
    fixture.debugElement
      .query(By.css('[data-testid="modal-close"]'))
      .nativeElement.click();
    expect(fixture.componentInstance.closed).toBe(1);
  });

  it('emits close on Escape', () => {
    const fixture = setup();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.closed).toBe(1);
  });

  it('emits close when a download link is chosen', () => {
    const fixture = setup();
    const link = fixture.nativeElement.querySelector(
      'a[href]',
    ) as HTMLAnchorElement;
    // Stop jsdom from attempting a real navigation.
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();
    expect(fixture.componentInstance.closed).toBe(1);
  });
});

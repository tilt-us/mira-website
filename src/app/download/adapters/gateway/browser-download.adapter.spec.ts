import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { createDownloadGateway } from './browser-download.adapter';

describe('createDownloadGateway', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('passes the manifest-provided URL to the browser location', () => {
    const assign = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: { location: { assign } } } }],
    });

    const gateway = TestBed.runInInjectionContext(createDownloadGateway);
    gateway.trigger('https://downloads.tilt-us.com/installer/windows/mira-installer.exe');

    expect(assign).toHaveBeenCalledWith(
      'https://downloads.tilt-us.com/installer/windows/mira-installer.exe',
    );
  });

  it('reports a download trigger failure when no browser window is available', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });

    const gateway = TestBed.runInInjectionContext(createDownloadGateway);
    expect(() =>
      gateway.trigger('https://downloads.tilt-us.com/installer/windows/mira-installer.exe'),
    ).toThrow('browser window is required');
  });
});

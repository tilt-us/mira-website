import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { LegalService } from './legal.service';
import { LegalDocument } from './legal.types';

const BASE = 'https://api.tilt-us.com/documents/statutory';

describe('LegalService', () => {
  let service: LegalService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LegalService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(LegalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the backend file mapped from the slug', () => {
    service.getDocument('privacy-policy').subscribe();
    // The privacy file is stored as "privacy-police.json" on the backend.
    http.expectOne(`${BASE}/privacy-police.json`).flush(null);
  });

  it('returns the backend document when it is complete', () => {
    const backend: LegalDocument = {
      title: 'Terms of Use',
      sections: [{ heading: 'Live', body: ['from backend'] }],
    };
    let result: LegalDocument | undefined;
    service.getDocument('terms-of-use').subscribe((d) => (result = d));
    http.expectOne(`${BASE}/terms-of-use.json`).flush(backend);
    expect(result).toEqual(backend);
  });

  it('falls back to the dummy when the backend file is empty', () => {
    let result: LegalDocument | undefined;
    service.getDocument('terms-of-use').subscribe((d) => (result = d));
    http.expectOne(`${BASE}/terms-of-use.json`).flush(null);
    expect(result?.title).toBe('Terms of Use');
    expect(result?.sections.length).toBeGreaterThan(0);
  });

  it('falls back to the dummy when the backend has no sections', () => {
    let result: LegalDocument | undefined;
    service.getDocument('privacy-policy').subscribe((d) => (result = d));
    http
      .expectOne(`${BASE}/privacy-police.json`)
      .flush({ title: 'Privacy Policy', sections: [] });
    expect(result?.title).toBe('Privacy Policy');
    expect(result?.sections.length).toBeGreaterThan(0);
  });

  it('falls back to the dummy when the request fails', () => {
    let result: LegalDocument | undefined;
    service.getDocument('privacy-policy').subscribe((d) => (result = d));
    http
      .expectOne(`${BASE}/privacy-police.json`)
      .flush('boom', { status: 500, statusText: 'Server Error' });
    expect(result?.title).toBe('Privacy Policy');
  });

  it('caches the request across multiple subscribers', () => {
    service.getDocument('terms-of-use').subscribe();
    service.getDocument('terms-of-use').subscribe();
    http.expectOne(`${BASE}/terms-of-use.json`).flush(null);
  });
});

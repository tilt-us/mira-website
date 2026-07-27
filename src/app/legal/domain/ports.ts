import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type { LegalDocument, LegalSlug } from './models';
import { createLegalDocumentGateway } from '../adapters/gateway/http-legal.adapter';

/** Outbound port for statutory documents; returns `null` when unavailable. */
export interface LegalDocumentGateway {
  fetch(slug: LegalSlug): Observable<LegalDocument | null>;
}

export const LEGAL_DOCUMENT_GATEWAY = new InjectionToken<LegalDocumentGateway>(
  'LEGAL_DOCUMENT_GATEWAY',
  {
    providedIn: 'root',
    factory: createLegalDocumentGateway,
  },
);

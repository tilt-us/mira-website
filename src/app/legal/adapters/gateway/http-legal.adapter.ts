import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import type { LegalDocument, LegalSlug } from '../../domain/models';
import type { LegalDocumentGateway } from '../../domain/ports';
import { getApiBaseUrl } from '../../../api-client';

/** Route slug → backend file name (the privacy file is stored as "police"). */
const BACKEND_FILE: Record<LegalSlug, string> = {
  'terms-of-use': 'terms-of-use.json',
  'privacy-policy': 'privacy-police.json',
};

/** Outbound adapter: fetches statutory documents over HTTP, `null` on failure. */
export function createLegalDocumentGateway(): LegalDocumentGateway {
  const http = inject(HttpClient);
  const documentsBase = `${getApiBaseUrl()}/documents/statutory`;

  return {
    fetch: (slug) =>
      http
        .get<LegalDocument | null>(`${documentsBase}/${BACKEND_FILE[slug]}`)
        .pipe(catchError(() => of(null))),
  };
}

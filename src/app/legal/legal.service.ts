import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { LegalDocument, LegalSlug } from './legal.types';
import termsDummy from './dummy/terms-of-use.json';
import privacyDummy from './dummy/privacy-policy.json';

const DOCUMENTS_BASE = 'https://api.tilt-us.com/documents/statutory';

/** Route slug → backend file name (the privacy file is stored as "police"). */
const BACKEND_FILE: Record<LegalSlug, string> = {
  'terms-of-use': 'terms-of-use.json',
  'privacy-policy': 'privacy-police.json',
};

/** Bundled placeholder text, shown until the backend files are populated. */
const DUMMY: Record<LegalSlug, LegalDocument> = {
  'terms-of-use': termsDummy,
  'privacy-policy': privacyDummy,
};

@Injectable({ providedIn: 'root' })
export class LegalService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<LegalSlug, Observable<LegalDocument>>();

  /**
   * Resolves a statutory document, preferring the backend copy and falling
   * back to the bundled dummy when the backend file is empty or unreachable.
   */
  getDocument(slug: LegalSlug): Observable<LegalDocument> {
    let request$ = this.cache.get(slug);
    if (!request$) {
      request$ = this.http
        .get<LegalDocument | null>(`${DOCUMENTS_BASE}/${BACKEND_FILE[slug]}`)
        .pipe(
          map((doc) => (this.isComplete(doc) ? doc : DUMMY[slug])),
          catchError(() => of(DUMMY[slug])),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      this.cache.set(slug, request$);
    }
    return request$;
  }

  private isComplete(doc: LegalDocument | null): doc is LegalDocument {
    return !!doc && !!doc.title && Array.isArray(doc.sections) && doc.sections.length > 0;
  }
}

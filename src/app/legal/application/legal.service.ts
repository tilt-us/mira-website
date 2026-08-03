import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { LegalDocument, LegalSlug } from '../domain/models';
import { LEGAL_DOCUMENT_GATEWAY } from '../domain/ports';
import termsDummy from './dummy/terms-of-use.json';
import privacyDummy from './dummy/privacy-policy.json';

/** Bundled placeholder text, shown until the backend files are populated. */
const DUMMY: Record<LegalSlug, LegalDocument> = {
  'terms-of-use': termsDummy,
  'privacy-policy': privacyDummy,
};

@Injectable({ providedIn: 'root' })
export class LegalService {
  private readonly gateway = inject(LEGAL_DOCUMENT_GATEWAY);
  private readonly cache = new Map<LegalSlug, Observable<LegalDocument>>();

  /**
   * Resolves a statutory document, preferring the backend copy and falling
   * back to the bundled dummy when the backend file is empty or unreachable.
   */
  getDocument(slug: LegalSlug): Observable<LegalDocument> {
    let request$ = this.cache.get(slug);
    if (!request$) {
      request$ = this.gateway.fetch(slug).pipe(
        map((doc) => (this.isComplete(doc) ? doc : DUMMY[slug])),
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

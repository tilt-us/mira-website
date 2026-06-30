import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { LegalService } from '../legal.service';
import { LegalDocument, LegalSlug } from '../legal.types';

@Component({
  selector: 'app-legal-page',
  templateUrl: './legal-page.html',
})
export class LegalPage {
  private readonly legal = inject(LegalService);
  private readonly route = inject(ActivatedRoute);

  // Which statutory document to render is declared on the route (see app.routes).
  protected readonly doc = signal<LegalDocument | null>(null);

  constructor() {
    const slug = this.route.snapshot.data['slug'] as LegalSlug;
    this.legal.getDocument(slug).subscribe((doc) => this.doc.set(doc));
  }
}

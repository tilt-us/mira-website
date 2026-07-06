import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

export interface PlaceholderContent {
  title: string;
  tagline: string;
}

@Component({
  selector: 'app-placeholder-page',
  templateUrl: './placeholder-page.html',
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  // Title and tagline are declared per route (see app.routes). Subscribing to
  // data (not the snapshot) keeps the page correct when the router reuses this
  // component while navigating between placeholder tabs.
  protected readonly content = signal<PlaceholderContent | null>(null);

  constructor() {
    this.route.data.subscribe((data) =>
      this.content.set(data['placeholder'] as PlaceholderContent),
    );
  }
}

import { Component, signal } from '@angular/core';

import { Reveal } from '../shared/reveal';
import { APPLICATION_EMAIL, applicationMailto, JOB_POSTINGS, JobPosting } from './domain/jobs.data';

@Component({
  selector: 'app-jobs-page',
  imports: [Reveal],
  templateUrl: './jobs-page.html',
})
export class JobsPage {
  protected readonly email = APPLICATION_EMAIL;
  protected readonly jobs = JOB_POSTINGS;

  // Single-open accordion: holds the id of the currently expanded posting.
  protected readonly expandedId = signal<string | null>(null);

  protected isExpanded(id: string): boolean {
    return this.expandedId() === id;
  }

  protected toggle(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  protected mailtoFor(job: JobPosting): string {
    return applicationMailto(job);
  }
}

import { TestBed } from '@angular/core/testing';

import { JobsPage } from './jobs-page';
import { APPLICATION_EMAIL, applicationMailto, JOB_POSTINGS } from './domain/jobs.data';

function setup() {
  TestBed.configureTestingModule({ imports: [JobsPage] });
  const fixture = TestBed.createComponent(JobsPage);
  fixture.detectChanges();
  return fixture;
}

function toggles(fixture: ReturnType<typeof setup>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="job-toggle"]'));
}

function details(fixture: ReturnType<typeof setup>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="job-details"]'));
}

describe('JobsPage', () => {
  it('renders the careers hero and every posting', () => {
    const fixture = setup();
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Join the team');
    expect(toggles(fixture).length).toBe(JOB_POSTINGS.length);
    for (const job of JOB_POSTINGS) {
      expect(text).toContain(job.title);
      expect(text).toContain(job.category);
    }
  });

  it('shows the number of open positions', () => {
    const fixture = setup();

    expect(
      fixture.nativeElement.querySelector('[data-testid="job-count"]').textContent,
    ).toContain(`${JOB_POSTINGS.length} open positions`);
  });

  it('keeps all postings collapsed initially', () => {
    const fixture = setup();

    expect(details(fixture).length).toBe(0);
    for (const toggle of toggles(fixture)) {
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('expands a posting with its requirements, perks and apply link', () => {
    const fixture = setup();

    toggles(fixture)[0].click();
    fixture.detectChanges();

    const [developer] = JOB_POSTINGS;
    const detail = details(fixture)[0];
    expect(toggles(fixture)[0].getAttribute('aria-expanded')).toBe('true');
    for (const item of [...developer.requirements, ...developer.bonus, ...developer.benefits]) {
      expect(detail.textContent).toContain(item);
    }

    const apply = detail.querySelector('[data-testid="job-apply"]') as HTMLAnchorElement;
    expect(apply.getAttribute('href')).toBe(applicationMailto(developer));
  });

  it('collapses the open posting when another one is expanded', () => {
    const fixture = setup();

    toggles(fixture)[0].click();
    fixture.detectChanges();
    toggles(fixture)[1].click();
    fixture.detectChanges();

    expect(toggles(fixture)[0].getAttribute('aria-expanded')).toBe('false');
    expect(toggles(fixture)[1].getAttribute('aria-expanded')).toBe('true');
    expect(details(fixture).length).toBe(1);
  });

  it('collapses a posting when its toggle is clicked again', () => {
    const fixture = setup();

    toggles(fixture)[0].click();
    fixture.detectChanges();
    toggles(fixture)[0].click();
    fixture.detectChanges();

    expect(details(fixture).length).toBe(0);
  });

  it('offers a general contact address for open applications', () => {
    const fixture = setup();
    const contact = fixture.nativeElement.querySelector(
      '[data-testid="jobs-contact"]',
    ) as HTMLAnchorElement;

    expect(contact.getAttribute('href')).toBe(`mailto:${APPLICATION_EMAIL}`);
    expect(contact.textContent).toContain(APPLICATION_EMAIL);
  });
});

describe('applicationMailto', () => {
  it('addresses the application inbox with an encoded subject and body', () => {
    const href = applicationMailto(JOB_POSTINGS[0]);

    expect(href.startsWith(`mailto:${APPLICATION_EMAIL}?`)).toBe(true);
    expect(href).toContain(`subject=${encodeURIComponent('Application: Developer')}`);
    // The body template asks applicants for the accounts we require.
    expect(href).toContain(encodeURIComponent('GitHub:'));
    expect(href).toContain(encodeURIComponent('Discord:'));
  });
});

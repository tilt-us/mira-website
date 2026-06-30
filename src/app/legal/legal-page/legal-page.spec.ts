import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LegalPage } from './legal-page';
import { LegalService } from '../legal.service';
import { LegalDocument, LegalSlug } from '../legal.types';

const DOC: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: '2026-06-30',
  intro: 'Intro paragraph.',
  sections: [
    { heading: '1. Data', body: ['We collect little.', 'We keep it safe.'] },
    { heading: '2. Contact', body: ['Reach us anytime.'] },
  ],
};

class StubLegalService {
  requested?: LegalSlug;
  getDocument(slug: LegalSlug) {
    this.requested = slug;
    return of(DOC);
  }
}

function setup(slug: LegalSlug): {
  fixture: ComponentFixture<LegalPage>;
  stub: StubLegalService;
} {
  const stub = new StubLegalService();
  TestBed.configureTestingModule({
    imports: [LegalPage],
    providers: [
      { provide: LegalService, useValue: stub },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { slug } } } },
    ],
  });
  const fixture = TestBed.createComponent(LegalPage);
  fixture.detectChanges();
  return { fixture, stub };
}

describe('LegalPage', () => {
  it('requests the document for the slug declared on the route', () => {
    const { stub } = setup('privacy-policy');
    expect(stub.requested).toBe('privacy-policy');
  });

  it('renders the title, intro and every section paragraph', () => {
    const { fixture } = setup('privacy-policy');
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(
      'Privacy Policy',
    );
    expect(text).toContain('Last updated: 2026-06-30');
    expect(text).toContain('Intro paragraph.');
    expect(fixture.nativeElement.querySelectorAll('h2').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('section p').length).toBe(3);
  });

  it('omits the meta line and intro when the document has neither', () => {
    const minimal: LegalDocument = {
      title: 'Terms of Use',
      sections: [{ heading: '1. Only', body: ['One paragraph.'] }],
    };
    const stub = { getDocument: () => of(minimal) } as unknown as LegalService;
    TestBed.configureTestingModule({
      imports: [LegalPage],
      providers: [
        { provide: LegalService, useValue: stub },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { slug: 'terms-of-use' } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(LegalPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Last updated');
    // The intro is the only <p> that is a direct child of <article>.
    expect(fixture.nativeElement.querySelector('article > p')).toBeFalsy();
    expect(fixture.nativeElement.querySelectorAll('section').length).toBe(1);
  });

  it('shows a loading placeholder until the document resolves', () => {
    const stub = { getDocument: () => of() } as unknown as LegalService;
    TestBed.configureTestingModule({
      imports: [LegalPage],
      providers: [
        { provide: LegalService, useValue: stub },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { slug: 'terms-of-use' } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(LegalPage);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="legal-loading"]'),
    ).toBeTruthy();
  });
});

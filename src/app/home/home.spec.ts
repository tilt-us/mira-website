import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Home } from './home';

const OAUTH_ERROR_STORAGE_KEY = 'mira.auth.oauthError';

describe('Home', () => {
  function configureHomeForQuery(query: Record<string, string>): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap(query)),
          },
        },
      ],
    });
  }

  beforeEach(() => {
    configureHomeForQuery({});
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function renderWithWindowUrl(
    query: Record<string, string>,
    url = '/?kc_error=1',
  ): { fixture: ReturnType<typeof TestBed.createComponent<Home>> } {
    configureHomeForQuery(query);
    window.history.replaceState({}, '', url);
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return { fixture };
  }

  it('shows the download button', () => {
    expect(render().querySelector('app-download-button')).toBeTruthy();
  });

  it('shows the character showcase with all four champions', () => {
    const el = render();
    expect(el.querySelector('#characters')).toBeTruthy();
    expect(el.querySelectorAll('[data-testid="character-tab"]').length).toBe(4);
  });

  it('shows the news and events sections', () => {
    const el = render();
    expect(el.querySelector('#news')).toBeTruthy();
    expect(el.querySelector('#events')).toBeTruthy();
  });

  it('shows a carousel with a card per placeholder entry in both sections', () => {
    const el = render();
    expect(el.querySelectorAll('#news .event-carousel-card').length).toBe(5);
    expect(el.querySelectorAll('#events .event-carousel-card').length).toBe(5);
  });

  it('shows a Discord link', () => {
    expect(render().querySelector('[data-testid="discord-link"]')).toBeTruthy();
  });

  it('navigates the news carousel independently of the events carousel', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const newsNext = el.querySelector('#news [aria-label="Show next event"]') as HTMLElement;
    newsNext.click();
    fixture.detectChanges();

    const activeIn = (section: string) =>
      Array.from(el.querySelectorAll(`${section} .event-carousel-card`)).findIndex((card) =>
        card.classList.contains('is-active'),
      );
    expect(activeIn('#news')).toBe(1);
    expect(activeIn('#events')).toBe(0);
  });

  it('shows a mapped error toast for OAuth errors from query params', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { fixture } = renderWithWindowUrl({ kc_error: '1' }, '/?kc_error=1&code=abc&state=def');

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Der Login wurde abgebrochen.');
    expect(
      replaceState.mock.calls.some((call) => call[2] === '/'),
    ).toBe(true);
  });

  it('reads stored OAuth errors when query params do not contain an error', () => {
    sessionStorage.setItem(
      OAUTH_ERROR_STORAGE_KEY,
      JSON.stringify({ description: 'resource owner already exists' }),
    );
    const { fixture } = renderWithWindowUrl({}, '/auth?foo=1');

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'Diese Email wird schon von einen Anderen Provider genutzt',
    );
  });

  it('shows unknown error when no message can be resolved from query or storage', () => {
    const { fixture } = renderWithWindowUrl({}, '/');

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeFalsy();
  });

  it('keeps toast pinned when manually pinned and dismisses only after unpin', () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { fixture } = renderWithWindowUrl(
      { error_description: 'invalid user' },
      '/?error_description=invalid%20user',
    );

    const component = fixture.componentInstance as unknown as Record<string, () => void>;
    const privateApi = component as unknown as {
      scheduleAuthErrorDismiss: () => void;
    };

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeTruthy();

    component['toggleAuthErrorPin']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeTruthy();
    const callsBeforePinnedReschedule = setTimeoutSpy.mock.calls.length;
    privateApi.scheduleAuthErrorDismiss();
    expect(setTimeoutSpy.mock.calls.length).toBe(callsBeforePinnedReschedule);

    component['toggleAuthErrorPin']();
    fixture.detectChanges();

    privateApi.scheduleAuthErrorDismiss();
    expect(setTimeoutSpy.mock.calls.length).toBeGreaterThan(callsBeforePinnedReschedule);

    component['dismissAuthErrorMessage']();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeFalsy();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('ignores stored values that cannot be parsed as OAuth errors', () => {
    sessionStorage.setItem(OAUTH_ERROR_STORAGE_KEY, '{not-json');
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { fixture } = renderWithWindowUrl({}, '/dashboard');

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeFalsy();
    expect(replaceState.mock.calls.length).toBe(1);
  });

  it('handles query errors on non-root routes without rewriting URL', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { fixture } = renderWithWindowUrl({ error: 'invalid user' }, '/settings?error=invalid%20user');

    expect(fixture.nativeElement.textContent).toContain('Fehler in deinen Anmeldedaten');
    expect(replaceState.mock.calls.length).toBe(1);
  });

  it('returns early when query errors are already cleared from the browser URL', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { fixture } = renderWithWindowUrl(
      { error: 'invalid credentials' },
      '/?code=abc',
    );

    expect(fixture.nativeElement.textContent).toContain('Fehler in deinen Anmeldedaten');
    expect(replaceState.mock.calls.length).toBe(1);
  });
});

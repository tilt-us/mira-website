import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Home } from './home';
import { DISCORD_INVITE_URL } from '../shared/community';

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

  it('shows news and events merged into a single section', () => {
    const el = render();
    expect(el.querySelector('#news')).toBeTruthy();
    expect(el.querySelector('#events')).toBeFalsy();
    expect(el.querySelectorAll('[data-testid="event-carousel"]').length).toBe(1);
  });

  it('shows a carousel card per combined placeholder entry', () => {
    const el = render();
    expect(el.querySelectorAll('#news .event-carousel-card').length).toBe(6);
  });

  it('shows a Discord link', () => {
    const link = render().querySelector(
      '[data-testid="discord-link"]',
    ) as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe(DISCORD_INVITE_URL);
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('navigates the combined carousel', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const next = el.querySelector('#news [aria-label="Show next event"]') as HTMLElement;
    next.click();
    fixture.detectChanges();

    const active = Array.from(el.querySelectorAll('#news .event-carousel-card')).findIndex((card) =>
      card.classList.contains('is-active'),
    );
    expect(active).toBe(1);
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

  it('shows unknown error for non-standard OAuth query errors', () => {
    const { fixture } = renderWithWindowUrl({ kc_error: '0' }, '/?kc_error=0');

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Unbekannter Fehler bitte erneut versuchen');
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

  it('reads stored OAuth errors when only kcError is set', () => {
    sessionStorage.setItem(OAUTH_ERROR_STORAGE_KEY, JSON.stringify({ kcError: true }));
    const { fixture } = renderWithWindowUrl({}, '/');

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Der Login wurde abgebrochen.');
  });

  it('falls back to unknown error when stored OAuth payload has no usable message', () => {
    sessionStorage.setItem(OAUTH_ERROR_STORAGE_KEY, JSON.stringify({ kcError: false }));
    const { fixture } = renderWithWindowUrl({}, '/');

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Unbekannter Fehler bitte erneut versuchen');
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

  it('supports pin and close actions from toast controls', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const { fixture } = renderWithWindowUrl(
      { error_description: 'invalid user' },
      '/?error_description=invalid%20user',
    );

    const pinButton = fixture.nativeElement.querySelector(
      '[data-testid="auth-error-pin"]',
    ) as HTMLButtonElement;
    const closeButton = fixture.nativeElement.querySelector(
      '[data-testid="auth-error-close"]',
    ) as HTMLButtonElement;

    expect(pinButton).toBeTruthy();
    expect(closeButton).toBeTruthy();

    pinButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-pin"]')).toBeFalsy();

    closeButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeFalsy();
    expect(replaceState.mock.calls.length).toBe(2);
  });

  it('auto-dismisses auth error toast after timeout when not pinned', () => {
    vi.useFakeTimers();
    const { fixture } = renderWithWindowUrl(
      { error_description: 'invalid user' },
      '/?error_description=invalid%20user',
    );

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeTruthy();

    vi.advanceTimersByTime(5000);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="auth-error-toast"]')).toBeFalsy();
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WritableSignal, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { Header } from './header';
import { AuthService } from '../../auth/auth.service';
import { AuthUser } from '../../auth/auth.types';

function byTestId(fixture: ComponentFixture<Header>, id: string): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
}

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let authPopupOpen: WritableSignal<boolean>;
  let mockAuth: {
    user: WritableSignal<AuthUser | null>;
    isLoggedIn: () => boolean;
    logout: Mock;
    providers: () => string[];
    isLoginPopupOpen: () => boolean;
    openLoginPopup: Mock;
    closeLoginPopup: Mock;
  };
  beforeEach(async () => {
    const authUser = signal<AuthUser | null>(null);
    authPopupOpen = signal(false);

    mockAuth = {
      user: authUser,
      isLoggedIn: () => authUser() !== null,
      logout: vi.fn(),
      providers: () => [],
      isLoginPopupOpen: () => authPopupOpen(),
      openLoginPopup: vi.fn(() => authPopupOpen.set(true)),
      closeLoginPopup: vi.fn(() => authPopupOpen.set(false)),
    };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([
          { path: 'settings', children: [] },
          { path: 'leaderboards', children: [] },
          { path: 'builds', children: [] },
          { path: 'streamers', children: [] },
          { path: 'report', children: [] },
        ]),
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });

  function setScrollY(value: number): void {
    Object.defineProperty(window, 'scrollY', { value, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  }

  function component(): Header {
    return fixture.componentInstance;
  }

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('floats transparently at the top of the page', () => {
    const header = byTestId(fixture, 'site-header');
    expect(header.className).toContain('fixed');
    expect(header.className).toContain('bg-transparent');
  });

  it('gains a solid backdrop once the page is scrolled', () => {
    setScrollY(120);
    expect(byTestId(fixture, 'site-header').className).toContain('bg-black/80');

    setScrollY(0);
    expect(byTestId(fixture, 'site-header').className).toContain('bg-transparent');
  });

  it('renders the Mira brand linking home', () => {
    const brand = fixture.nativeElement.querySelector('a');
    expect(brand.textContent).toContain('Mira');
    expect(brand.getAttribute('href')).toBe('/');
  });

  it('renders a navigation tab for every primary section', () => {
    const nav = byTestId(fixture, 'primary-nav');
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/leaderboards', '/builds', '/streamers', '/report']);
    expect(nav.textContent).toContain('Leaderboards');
    expect(nav.textContent).toContain('Report');
  });

  it('shows a login button while logged out', () => {
    expect(byTestId(fixture, 'login-button')).toBeTruthy();
    expect(byTestId(fixture, 'user-menu-button')).toBeFalsy();
  });

  it('opens the auth popup when the login button is clicked', () => {
    byTestId(fixture, 'login-button').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'auth-popup')).toBeTruthy();
    expect(byTestId(fixture, 'auth-backdrop')).toBeTruthy();
  });

  it('closes the auth popup on backdrop click', () => {
    byTestId(fixture, 'login-button').click();
    fixture.detectChanges();

    byTestId(fixture, 'auth-backdrop').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'auth-popup')).toBeFalsy();
  });

  it('closes the auth popup when close icon is clicked', () => {
    byTestId(fixture, 'login-button').click();
    fixture.detectChanges();

    byTestId(fixture, 'auth-close').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'auth-popup')).toBeFalsy();
  });

  it('opens a popover with the user and a settings link', () => {
    mockAuth.user.set({ displayName: 'Mira Player', email: 'player@tilt-us.com' });
    fixture.detectChanges();

    expect(byTestId(fixture, 'user-menu')).toBeFalsy();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    const menu = byTestId(fixture, 'user-menu');
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('Mira Player');
    expect(byTestId(fixture, 'settings-link').getAttribute('href')).toBe('/settings');
  });

  it('renders a fallback initial when no avatar image is available', () => {
    mockAuth.user.set({ displayName: 'mira player', email: 'player@tilt-us.com' });
    fixture.detectChanges();

    const button = byTestId(fixture, 'user-menu-button');
    const initial = button.querySelector('[class*="avatar-hexagon-label"]') as HTMLElement;

    expect(initial).toBeTruthy();
    expect(initial.textContent?.trim()).toBe('M');
  });

  it('switches to initial fallback when avatar image fails to load', () => {
    mockAuth.user.set({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
      avatarUrl: '/broken-avatar.png',
    });
    fixture.detectChanges();

    const button = byTestId(fixture, 'user-menu-button');
    const image = button.querySelector('img') as HTMLImageElement;
    const errorEvent = new Event('error');

    image.dispatchEvent(errorEvent);
    fixture.detectChanges();

    const initial = button.querySelector('[class*="avatar-hexagon-label"]') as HTMLElement;

    expect(initial).toBeTruthy();
    expect(initial.textContent?.trim()).toBe('M');
  });

  it('uses initial fallback when avatar consent is denied for social avatars', () => {
    mockAuth.user.set({
      displayName: 'Google User',
      email: 'google@tilt-us.com',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar.png',
      avatarRightsConsented: false,
    });
    fixture.detectChanges();

    const button = byTestId(fixture, 'user-menu-button');
    const image = button.querySelector('img');
    const initial = button.querySelector('[class*="avatar-hexagon-label"]') as HTMLElement;

    expect(image).toBeFalsy();
    expect(initial).toBeTruthy();
    expect(initial.textContent?.trim()).toBe('G');
  });

  it('shows blocked social avatar when consent is granted', () => {
    mockAuth.user.set({
      displayName: 'Google User',
      email: 'google@tilt-us.com',
      avatarUrl: 'https://lh3.googleusercontent.com/avatar.png',
      avatarRightsConsented: true,
    });
    fixture.detectChanges();

    const button = byTestId(fixture, 'user-menu-button');
    const image = button.querySelector('img') as HTMLImageElement;
    const initial = button.querySelector('[class*="avatar-hexagon-label"]');

    expect(image).toBeTruthy();
    expect(initial).toBeFalsy();
  });

  it('resets avatar error state after avatar url changes', () => {
    mockAuth.user.set({
      displayName: 'Google User',
      email: 'google@tilt-us.com',
      avatarUrl: 'https://example.com/avatar-a.png',
      avatarRightsConsented: false,
    });
    fixture.detectChanges();

    const button = byTestId(fixture, 'user-menu-button');
    const image = button.querySelector('img') as HTMLImageElement;
    expect(image).toBeTruthy();

    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(button.querySelector('[class*="avatar-hexagon-label"]')).toBeTruthy();

    mockAuth.user.set({
      displayName: 'Google User',
      email: 'google@tilt-us.com',
      avatarUrl: 'https://example.com/avatar-b.png',
      avatarRightsConsented: false,
    });
    fixture.detectChanges();

    const reloadedImage = button.querySelector('img') as HTMLImageElement;
    expect(reloadedImage).toBeTruthy();
  });

  it('uses transparent menu background and blur before scrolling', () => {
    mockAuth.user.set({ displayName: 'Mira Player', email: 'player@tilt-us.com' });
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    const menu = byTestId(fixture, 'user-menu');
    expect(menu.style.backgroundColor.replace(/\s/g, '')).toBe('rgba(0,0,0,0.2)');
    expect(menu.style.backdropFilter).toBe('blur(8px)');
  });

  it('removes transparent menu background after scrolling', () => {
    setScrollY(50);
    mockAuth.user.set({ displayName: 'Mira Player', email: 'player@tilt-us.com' });
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    const menu = byTestId(fixture, 'user-menu');
    expect(menu.style.backgroundColor).toBe('');
    expect(menu.style.backdropFilter).toBe('');
  });

  it('shows fallback label from email when no display name exists', () => {
    mockAuth.user.set({
      displayName: '',
      preferredUsername: '',
      email: 'mira@tilt-us.com',
    });
    fixture.detectChanges();

    const button = byTestId(fixture, 'user-menu-button');
    const initial = button.querySelector('[class*="avatar-hexagon-label"]') as HTMLElement;

    expect(initial).toBeTruthy();
    expect(initial.textContent?.trim()).toBe('M');
  });

  it('shows fallback label when names are unavailable and avatar rights consent is denied', () => {
    mockAuth.user.set({
      displayName: '   ',
      preferredUsername: '   ',
      email: '   ',
    });
    fixture.detectChanges();

    expect(component()['avatarLabel']).toBe('P');
  });

  it('allows avatar URLs to render when social avatar URL is not parseable', () => {
    mockAuth.user.set({
      displayName: 'Link User',
      email: 'link@example.com',
      avatarUrl: 'not-a-url',
      avatarRightsConsented: false,
    });
    fixture.detectChanges();

    const button = byTestId(fixture, 'user-menu-button');
    const image = button.querySelector('img');

    expect(image).toBeTruthy();
    expect(image?.getAttribute('src')).toBe('not-a-url');
  });

  it('falls back to a safe avatar state when URL parsing throws', () => {
    const originalURL = globalThis.URL;
    const brokenURL = function (..._args: unknown[]) {
      throw new Error('invalid URL');
    } as unknown as typeof URL;

    Object.defineProperty(globalThis, 'URL', {
      configurable: true,
      value: brokenURL,
    });

    try {
      mockAuth.user.set({
        displayName: 'Bad URL User',
        email: 'bad@example.com',
        avatarUrl: 'https://googleusercontent.com/avatar.png',
        avatarRightsConsented: false,
      });
      fixture.detectChanges();

      const button = byTestId(fixture, 'user-menu-button');
      const image = button.querySelector('img');
      expect(image).toBeTruthy();
    } finally {
      Object.defineProperty(globalThis, 'URL', {
        configurable: true,
        value: originalURL,
      });
    }
  });

  it('closes an open auth popup on Escape', () => {
    byTestId(fixture, 'login-button').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'auth-popup')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(byTestId(fixture, 'auth-popup')).toBeFalsy();
  });

  it('closes a popover on the click-away layer', () => {
    mockAuth.user.set({ displayName: 'Mira Player', email: 'player@tilt-us.com' });
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    byTestId(fixture, 'menu-backdrop').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'user-menu')).toBeFalsy();
  });

  it('closes a popover on Escape', () => {
    mockAuth.user.set({ displayName: 'Mira Player', email: 'player@tilt-us.com' });
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(byTestId(fixture, 'user-menu')).toBeFalsy();
  });

  it('closes the popover when the settings link is chosen', () => {
    mockAuth.user.set({ displayName: 'Mira Player', email: 'player@tilt-us.com' });
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    byTestId(fixture, 'settings-link').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'user-menu')).toBeFalsy();
  });

  it('logs out from the popover', () => {
    mockAuth.user.set({ displayName: 'Mira Player', email: 'player@tilt-us.com' });
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    byTestId(fixture, 'logout-button').click();
    fixture.detectChanges();

    expect(mockAuth.logout).toHaveBeenCalled();
  });
});

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
  let mockAuth: {
    user: WritableSignal<AuthUser | null>;
    isLoggedIn: () => boolean;
    logout: Mock;
    providers: () => string[];
  };
  beforeEach(async () => {
    const authUser = signal<AuthUser | null>(null);

    mockAuth = {
      user: authUser,
      isLoggedIn: () => authUser() !== null,
      logout: vi.fn(),
      providers: () => [],
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
          { path: 'auth', children: [] },
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

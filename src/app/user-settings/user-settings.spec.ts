import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Mock, vi } from 'vitest';

import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/auth.types';
import { WallpaperService } from '../shared/wallpaper.service';
import { UserSettings } from './user-settings';

function setup(mockAuth: {
  user: WritableSignal<AuthUser | null>;
  isLoggedIn: () => boolean;
  login: Mock;
  logout: Mock;
  saveProfile: Mock;
  startGoogleLogin: Mock;
  startGithubLogin: Mock;
  startDiscordLogin: Mock;
}): ComponentFixture<UserSettings> {
  TestBed.configureTestingModule({
    imports: [UserSettings],
    providers: [
      { provide: AuthService, useValue: mockAuth },
      provideRouter([{ path: 'auth', children: [] }]),
    ],
  });

  const fixture = TestBed.createComponent(UserSettings);
  fixture.detectChanges();
  return fixture;
}

function byTestId(fixture: ComponentFixture<UserSettings>, id: string): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
}

function castUserSettingsComponent(instance: UserSettings): {
  displayName: WritableSignal<string>;
  tagId: WritableSignal<string>;
  accentColor: WritableSignal<string>;
  currentPassword: WritableSignal<string>;
  newPassword: WritableSignal<string>;
  confirmPassword: WritableSignal<string>;
  saveProfile: () => Promise<void>;
  linkProvider: (providerId: string) => void;
  isLinkableProvider: (providerId: string) => boolean;
  getSocialButtonClasses: (providerId: string) => string;
} {
  return instance as unknown as {
    displayName: WritableSignal<string>;
    tagId: WritableSignal<string>;
    accentColor: WritableSignal<string>;
    currentPassword: WritableSignal<string>;
    newPassword: WritableSignal<string>;
    confirmPassword: WritableSignal<string>;
    saveProfile: () => Promise<void>;
    linkProvider: (providerId: string) => void;
    isLinkableProvider: (providerId: string) => boolean;
    getSocialButtonClasses: (providerId: string) => string;
  };
}

describe('UserSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function defaultAuthMock(
    overrides: Partial<AuthUser> | null = null,
    saveProfile = vi.fn().mockResolvedValue(undefined),
  ) {
    const user = overrides
      ? signal<AuthUser | null>({ ...(overrides as AuthUser) } as AuthUser)
      : signal<AuthUser | null>(null);
    return {
      user,
      isLoggedIn: () => user() !== null,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      saveProfile,
      startGoogleLogin: vi.fn(),
      startGithubLogin: vi.fn(),
      startDiscordLogin: vi.fn(),
    };
  }

  it('prompts to log in when the user is signed out', () => {
    const fixture = setup(defaultAuthMock());

    expect(byTestId(fixture, 'settings-signed-out')).toBeTruthy();
    expect(byTestId(fixture, 'display-name')).toBeFalsy();
  });

  it('invokes auth login from signed-out CTA', () => {
    const auth = defaultAuthMock();
    const fixture = setup(auth);

    (byTestId(fixture, 'settings-signed-out') as HTMLElement).querySelector('button')?.click();

    expect(auth.login).toHaveBeenCalledTimes(1);
  });

  it('shows prefilled profile fields when user is logged in', () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
      tagId: 'TAG-001',
    });
    const fixture = setup(auth);
    const component = castUserSettingsComponent(fixture.componentInstance);

    expect(component.displayName()).toBe('Mira Player');
    expect(component.tagId()).toBe('TAG-001');
  });

  it('updates ngModel controls and submits via template events', async () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
      tagId: 'TAG-001',
    });
    const fixture = setup(auth);
    const component = castUserSettingsComponent(fixture.componentInstance);
    const displayName = byTestId(fixture, 'display-name') as HTMLInputElement;
    const tagId = byTestId(fixture, 'tag-id') as HTMLInputElement;
    const accent = byTestId(fixture, 'accent-color') as HTMLInputElement;

    displayName.value = 'Changed Player';
    displayName.dispatchEvent(new Event('input', { bubbles: true }));
    tagId.value = 'TAG-007';
    tagId.dispatchEvent(new Event('input', { bubbles: true }));
    accent.value = '#123456';
    accent.dispatchEvent(new Event('input', { bubbles: true }));
    (byTestId(fixture, 'birthday') as HTMLElement).dispatchEvent(
      new CustomEvent('valueChange', { detail: '2000-01-01' }),
    );

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const currentPassword = byTestId(fixture, 'current-password') as HTMLInputElement;
    const newPassword = byTestId(fixture, 'new-password') as HTMLInputElement;
    const confirmPassword = byTestId(fixture, 'confirm-password') as HTMLInputElement;

    currentPassword.value = 'old-password';
    currentPassword.dispatchEvent(new Event('input', { bubbles: true }));
    newPassword.value = 'new-password';
    newPassword.dispatchEvent(new Event('input', { bubbles: true }));
    confirmPassword.value = 'new-password';
    confirmPassword.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.currentPassword()).toBe('old-password');
    expect(component.newPassword()).toBe('new-password');
    expect(component.confirmPassword()).toBe('new-password');
    expect(auth.saveProfile).toHaveBeenCalledWith({
      displayName: 'Changed Player',
      tagId: 'TAG-007',
      accentColor: '#123456',
    });

    fixture.detectChanges();
    expect(byTestId(fixture, 'settings-save-status')?.textContent).toContain('Änderungen gespeichert.');
  });

  it('sends changed fields to auth.saveProfile', async () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
      tagId: 'TAG-001',
    });
    const fixture = setup(auth);
    const component = castUserSettingsComponent(fixture.componentInstance);

    component.displayName.set('Neue Playerin');
    component.tagId.set('TAG-002');
    fixture.detectChanges();

    await component.saveProfile();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.saveProfile).toHaveBeenCalledWith({
      displayName: 'Neue Playerin',
      tagId: 'TAG-002',
    });
  });

  it('sends accent color updates from the picker input', async () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });
    const fixture = setup(auth);
    const component = castUserSettingsComponent(fixture.componentInstance);

    component.accentColor.set('#fF0000');
    fixture.detectChanges();

    await component.saveProfile();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.saveProfile).toHaveBeenCalledWith({
      accentColor: '#ff0000',
    });
  });

  it('sends wallpaper updates to auth.saveProfile', async () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });
    const fixture = setup(auth);

    TestBed.inject(WallpaperService).set('yuna');
    fixture.detectChanges();

    (byTestId(fixture, 'save-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.saveProfile).toHaveBeenCalledWith({
      background: 'yuna',
    });
  });

  it('does not show phone number field anymore', () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });
    const fixture = setup(auth);

    expect(byTestId(fixture, 'phone')).toBeFalsy();
  });

  it('shows a visible success status after save', async () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });
    const fixture = setup(auth);
    const component = castUserSettingsComponent(fixture.componentInstance);

    component.displayName.set('Neue Playerin');
    fixture.detectChanges();

    await component.saveProfile();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(byTestId(fixture, 'settings-save-status')?.textContent).toContain(
      'Änderungen gespeichert.',
    );
  });

  it('does not save when nothing has changed', async () => {
    const saveProfile = vi.fn().mockResolvedValue(undefined);
    const auth = defaultAuthMock(
      {
        displayName: 'Mira Player',
        email: 'player@tilt-us.com',
        tagId: 'TAG-001',
      },
      saveProfile,
    );
    const fixture = setup(auth);
    const component = castUserSettingsComponent(fixture.componentInstance);

    await component.saveProfile();
    fixture.detectChanges();

    expect(auth.saveProfile).not.toHaveBeenCalled();
    expect(byTestId(fixture, 'settings-save-status')?.textContent).toContain(
      'Keine Änderungen vorhanden.',
    );
  });

  it('shows an error when saveProfile fails', async () => {
    const saveProfile = vi.fn().mockRejectedValue(new Error('Netzfehler'));
    const auth = defaultAuthMock(
      {
        displayName: 'Mira Player',
        email: 'player@tilt-us.com',
      },
      saveProfile,
    );
    const fixture = setup(auth);
    const component = castUserSettingsComponent(fixture.componentInstance);

    component.displayName.set('Neue Playerin');
    await component.saveProfile();
    fixture.detectChanges();

    expect(byTestId(fixture, 'settings-save-error')?.textContent).toContain('Netzfehler');
  });

  it('starts provider linking from buttons and ignores unsupported providers', () => {
    const startGoogleLogin = vi.fn();
    const startGithubLogin = vi.fn();
    const startDiscordLogin = vi.fn();
    const auth = defaultAuthMock(
      {
        displayName: 'Mira Player',
        email: 'player@tilt-us.com',
      },
      vi.fn().mockResolvedValue(undefined),
    );
    auth.startGoogleLogin = startGoogleLogin;
    auth.startGithubLogin = startGithubLogin;
    auth.startDiscordLogin = startDiscordLogin;

    const fixture = setup(auth);

    byTestId(fixture, 'link-google').click();
    byTestId(fixture, 'link-discord').click();
    byTestId(fixture, 'link-github').click();
    byTestId(fixture, 'link-gitlab').click();

    const component = castUserSettingsComponent(fixture.componentInstance);
    component.linkProvider('gitlab');

    expect(startGoogleLogin).toHaveBeenCalledTimes(1);
    expect(startDiscordLogin).toHaveBeenCalledTimes(1);
    expect(startGithubLogin).toHaveBeenCalledTimes(1);

    const gitlabButton = byTestId(fixture, 'link-gitlab');
    expect(gitlabButton.hasAttribute('disabled')).toBe(true);
    expect(gitlabButton.textContent).toContain('Bald');
  });

  it('renders provider button states for all configured providers', () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });
    const fixture = setup(auth);

    expect(byTestId(fixture, 'link-google')?.hasAttribute('disabled')).toBe(false);
    expect(byTestId(fixture, 'link-discord')?.hasAttribute('disabled')).toBe(false);
    expect(byTestId(fixture, 'link-github')?.hasAttribute('disabled')).toBe(false);
    expect(byTestId(fixture, 'link-gitlab')?.hasAttribute('disabled')).toBe(true);
    expect(byTestId(fixture, 'link-instagram')?.hasAttribute('disabled')).toBe(true);
    expect(byTestId(fixture, 'link-x')?.hasAttribute('disabled')).toBe(true);
  });

  it('exposes social button classes for all provider branches', () => {
    const auth = defaultAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });
    const fixture = setup(auth);
    const component = castUserSettingsComponent(fixture.componentInstance);

    expect(component.isLinkableProvider('google')).toBe(true);
    expect(component.isLinkableProvider('github')).toBe(true);
    expect(component.isLinkableProvider('discord')).toBe(true);
    expect(component.isLinkableProvider('instagram')).toBe(false);

    expect(component.getSocialButtonClasses('google')).toContain('text-[#111]');
    expect(component.getSocialButtonClasses('discord')).toContain('hover:brightness-105');
    expect(component.getSocialButtonClasses('github')).toContain('bg-[#0d1117]');
    expect(component.getSocialButtonClasses('instagram')).toBe('min-h-10 px-3 text-sm');
  });
});

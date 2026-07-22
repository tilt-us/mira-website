import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Mock, vi } from 'vitest';

import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/auth.types';
import type { ClientSettingsResponse } from '../../api/types.gen';
import { ClientSettingsService } from '../shared/client-settings.service';
import { ThemeService } from '../shared/theme.service';
import { WallpaperService } from '../shared/wallpaper.service';
import { SettingsSectionId } from './settings-options';
import { UserSettings } from './user-settings';

interface AuthMock {
  user: WritableSignal<AuthUser | null>;
  isLoggedIn: () => boolean;
  login: Mock;
  logout: Mock;
  saveProfile: Mock;
  confirmAvatarRights: Mock;
  startPasswordUpdate: Mock;
  startGoogleLogin: Mock;
  startGithubLogin: Mock;
  startDiscordLogin: Mock;
}

interface SettingsMock {
  settings: WritableSignal<ClientSettingsResponse | null>;
  save: Mock;
  load: Mock;
  reset: Mock;
}

/** The component members are protected; the tests drive them directly. */
interface TestableUserSettings {
  activeSection: WritableSignal<SettingsSectionId>;
  displayName: WritableSignal<string>;
  tagId: WritableSignal<string>;
  accentColor: WritableSignal<string>;
  wallpaper: WritableSignal<string>;
  language: WritableSignal<string>;
  resolution: WritableSignal<string>;
  uiScale: WritableSignal<number>;
  birthday: WritableSignal<string>;
  showEmailPublic: WritableSignal<boolean>;
  useFriendColors: WritableSignal<boolean>;
  resolutionOptions: () => readonly { value: string; label: string }[];
  hasChanges: () => boolean;
  save: () => Promise<void>;
  discard: () => void;
  changePassword: () => Promise<void>;
  confirmAvatarRights: () => Promise<void>;
  linkProvider: (providerId: string) => void;
  isLinkableProvider: (providerId: string) => boolean;
  getSocialButtonClasses: (providerId: string) => string;
}

describe('UserSettings', () => {
  let auth: AuthMock;
  let clientSettings: SettingsMock;

  function createAuthMock(user: Partial<AuthUser> | null = null): AuthMock {
    const currentUser = signal<AuthUser | null>(user ? ({ ...user } as AuthUser) : null);

    return {
      user: currentUser,
      isLoggedIn: () => currentUser() !== null,
      login: vi.fn(),
      logout: vi.fn(),
      saveProfile: vi.fn().mockResolvedValue(undefined),
      confirmAvatarRights: vi.fn().mockResolvedValue(undefined),
      startPasswordUpdate: vi.fn().mockResolvedValue(undefined),
      startGoogleLogin: vi.fn(),
      startGithubLogin: vi.fn(),
      startDiscordLogin: vi.fn(),
    };
  }

  function createSettingsMock(settings: ClientSettingsResponse | null = null): SettingsMock {
    return {
      settings: signal<ClientSettingsResponse | null>(settings),
      save: vi.fn().mockResolvedValue({}),
      load: vi.fn().mockResolvedValue(null),
      reset: vi.fn(),
    };
  }

  function setup(): ComponentFixture<UserSettings> {
    TestBed.configureTestingModule({
      imports: [UserSettings],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ClientSettingsService, useValue: clientSettings },
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

  function componentOf(fixture: ComponentFixture<UserSettings>): TestableUserSettings {
    return fixture.componentInstance as unknown as TestableUserSettings;
  }

  async function settle(fixture: ComponentFixture<UserSettings>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    auth = createAuthMock({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
      publicId: 42,
      tagId: 'TAG-001',
    });
    clientSettings = createSettingsMock();
  });

  it('prompts to log in when the user is signed out', () => {
    auth = createAuthMock(null);
    const fixture = setup();

    expect(byTestId(fixture, 'settings-signed-out')).toBeTruthy();
    expect(byTestId(fixture, 'display-name')).toBeFalsy();

    byTestId(fixture, 'settings-signed-out').querySelector('button')?.click();
    expect(auth.login).toHaveBeenCalledTimes(1);
  });

  it('prefills the account section from the profile', () => {
    const fixture = setup();

    expect((byTestId(fixture, 'display-name') as HTMLInputElement).value).toBe('Mira Player');
    expect((byTestId(fixture, 'tag-id') as HTMLInputElement).value).toBe('TAG-001');
    expect(byTestId(fixture, 'email').textContent).toContain('player@tilt-us.com');
    expect(byTestId(fixture, 'public-id').textContent).toContain('42');
  });

  it('switches the visible panel through the section list', () => {
    const fixture = setup();

    expect(byTestId(fixture, 'section-title').textContent).toContain('Konto');

    byTestId(fixture, 'section-client').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'section-title').textContent).toContain('Spiel-Client');
    expect(byTestId(fixture, 'display-name')).toBeFalsy();
    expect(byTestId(fixture, 'resolution')).toBeTruthy();
  });

  it('keeps a stored value that is missing from the static option list', () => {
    clientSettings = createSettingsMock({ resolution: '1234x567' });
    const fixture = setup();

    expect(componentOf(fixture).resolutionOptions().at(-1)).toEqual({
      value: '1234x567',
      label: '1234x567',
    });
  });

  it('reports nothing to save while the form is untouched', async () => {
    const fixture = setup();
    const component = componentOf(fixture);

    expect(component.hasChanges()).toBe(false);
    await component.save();
    await settle(fixture);

    expect(auth.saveProfile).not.toHaveBeenCalled();
    expect(clientSettings.save).not.toHaveBeenCalled();
    expect(byTestId(fixture, 'settings-save-status').textContent).toContain(
      'Keine Änderungen vorhanden.',
    );
  });

  it('sends only the changed identity fields', async () => {
    const fixture = setup();
    const displayName = byTestId(fixture, 'display-name') as HTMLInputElement;

    displayName.value = 'Neue Playerin';
    displayName.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);

    expect(byTestId(fixture, 'settings-dirty-hint')).toBeTruthy();

    (byTestId(fixture, 'save-button') as HTMLButtonElement).click();
    await settle(fixture);

    expect(auth.saveProfile).toHaveBeenCalledWith({ displayName: 'Neue Playerin' });
    expect(clientSettings.save).not.toHaveBeenCalled();
    expect(byTestId(fixture, 'settings-save-status').textContent).toContain(
      'Änderungen gespeichert.',
    );
  });

  it('sends the tag id together with the display name', async () => {
    const fixture = setup();
    const component = componentOf(fixture);

    component.displayName.set('  Neue Playerin  ');
    component.tagId.set('TAG-007');
    await component.save();

    expect(auth.saveProfile).toHaveBeenCalledWith({
      displayName: 'Neue Playerin',
      tagId: 'TAG-007',
    });
  });

  it('applies the accent colour live and saves it lower-cased', async () => {
    const fixture = setup();

    byTestId(fixture, 'section-appearance').click();
    fixture.detectChanges();

    const accent = byTestId(fixture, 'accent-color') as HTMLInputElement;
    accent.value = '#00FF88';
    accent.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);

    expect(TestBed.inject(ThemeService).accent()).toBe('#00ff88');

    await componentOf(fixture).save();

    expect(clientSettings.save).toHaveBeenCalledWith({ accentColor: '#00ff88' });
  });

  it('applies a picked wallpaper live and saves it as the background', async () => {
    const fixture = setup();

    byTestId(fixture, 'section-appearance').click();
    fixture.detectChanges();

    byTestId(fixture, 'wallpaper-yuna').click();
    await settle(fixture);

    expect(TestBed.inject(WallpaperService).wallpaper()).toBe('yuna');
    expect(byTestId(fixture, 'wallpaper-yuna').getAttribute('aria-checked')).toBe('true');

    await componentOf(fixture).save();

    expect(clientSettings.save).toHaveBeenCalledWith({ background: 'yuna' });
  });

  it('saves the client fields the desktop client reads', async () => {
    clientSettings = createSettingsMock({ language: 'de', uiScale: 1 });
    const fixture = setup();

    byTestId(fixture, 'section-client').click();
    fixture.detectChanges();

    const language = byTestId(fixture, 'language') as HTMLSelectElement;
    language.value = 'en';
    language.dispatchEvent(new Event('change', { bubbles: true }));

    const uiScale = byTestId(fixture, 'ui-scale') as HTMLInputElement;
    uiScale.value = '1.5';
    uiScale.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(fixture);

    expect(byTestId(fixture, 'ui-scale-value').textContent).toContain('150%');

    await componentOf(fixture).save();

    expect(clientSettings.save).toHaveBeenCalledWith({ language: 'en', uiScale: 1.5 });
  });

  it('saves the remaining client selects', async () => {
    const fixture = setup();
    const component = componentOf(fixture);

    component.activeSection.set('client');
    await settle(fixture);

    for (const [testId, value] of [
      ['resolution', '1920x1080'],
      ['screen-mode', 'borderless'],
      ['chat-position', 'right'],
      ['client-animation', 'low'],
    ] as const) {
      const select = byTestId(fixture, testId) as HTMLSelectElement;
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    await settle(fixture);
    await component.save();

    expect(clientSettings.save).toHaveBeenCalledWith({
      resolution: '1920x1080',
      screenMode: 'borderless',
      chatPosition: 'right',
      clientAnimation: 'low',
    });
  });

  it('saves the privacy toggles', async () => {
    const fixture = setup();

    byTestId(fixture, 'section-privacy').click();
    fixture.detectChanges();

    byTestId(fixture, 'show-email-public').click();
    byTestId(fixture, 'use-friend-colors').click();
    await settle(fixture);

    expect(byTestId(fixture, 'show-email-public').getAttribute('aria-checked')).toBe('true');

    await componentOf(fixture).save();

    expect(clientSettings.save).toHaveBeenCalledWith({
      showEmailPublic: true,
      useFriendColors: true,
    });
  });

  it('shows the backend error when saving fails', async () => {
    auth.saveProfile.mockRejectedValue(new Error('Netzfehler'));
    const fixture = setup();
    const component = componentOf(fixture);

    component.displayName.set('Neue Playerin');
    await component.save();
    await settle(fixture);

    expect(byTestId(fixture, 'settings-save-error').textContent).toContain('Netzfehler');
    expect(byTestId(fixture, 'settings-save-status')).toBeFalsy();
  });

  it('restores the stored values and previews when discarding', async () => {
    clientSettings = createSettingsMock({ accentColor: '#123456', background: 'lira' });
    const fixture = setup();
    const component = componentOf(fixture);

    component.activeSection.set('appearance');
    await settle(fixture);

    byTestId(fixture, 'wallpaper-sophia').click();
    component.displayName.set('Neue Playerin');
    component.uiScale.set(1.4);
    await settle(fixture);

    expect(component.hasChanges()).toBe(true);

    (byTestId(fixture, 'discard-button') as HTMLButtonElement).click();
    await settle(fixture);

    expect(component.hasChanges()).toBe(false);
    expect(component.displayName()).toBe('Mira Player');
    expect(TestBed.inject(WallpaperService).wallpaper()).toBe('lira');
    expect(TestBed.inject(ThemeService).accent()).toBe('#123456');
  });

  it('clears status messages when another section is opened', async () => {
    const fixture = setup();

    await componentOf(fixture).save();
    await settle(fixture);
    expect(byTestId(fixture, 'settings-save-status')).toBeTruthy();

    byTestId(fixture, 'section-privacy').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'settings-save-status')).toBeFalsy();
  });

  it('hands the password change to Keycloak', async () => {
    const fixture = setup();

    byTestId(fixture, 'section-security').click();
    fixture.detectChanges();

    byTestId(fixture, 'change-password').click();
    await settle(fixture);

    expect(auth.startPasswordUpdate).toHaveBeenCalledTimes(1);
    expect(byTestId(fixture, 'settings-account-status').textContent).toContain('Keycloak');
  });

  it('reports a failed password redirect', async () => {
    auth.startPasswordUpdate.mockRejectedValue(new Error('Keycloak nicht erreichbar'));
    const fixture = setup();
    const component = componentOf(fixture);

    component.activeSection.set('security');
    await component.changePassword();
    await settle(fixture);

    expect(byTestId(fixture, 'settings-account-error').textContent).toContain(
      'Keycloak nicht erreichbar',
    );
    expect(byTestId(fixture, 'settings-account-status')).toBeFalsy();
  });

  it('logs out from the security section', () => {
    const fixture = setup();

    byTestId(fixture, 'section-security').click();
    fixture.detectChanges();
    byTestId(fixture, 'logout').click();

    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  it('confirms the avatar rights and shows the confirmed state', async () => {
    const fixture = setup();

    byTestId(fixture, 'section-privacy').click();
    fixture.detectChanges();

    byTestId(fixture, 'confirm-avatar-rights').click();
    auth.user.set({ ...auth.user(), avatarRightsConsented: true });
    await settle(fixture);

    expect(auth.confirmAvatarRights).toHaveBeenCalledTimes(1);
    expect(byTestId(fixture, 'settings-account-status').textContent).toContain('Bildrechte');
    expect(byTestId(fixture, 'avatar-rights-state')).toBeTruthy();
  });

  it('reports a failed avatar rights confirmation', async () => {
    auth.confirmAvatarRights.mockRejectedValue(new Error('Abgelehnt'));
    const fixture = setup();
    const component = componentOf(fixture);

    component.activeSection.set('privacy');
    await component.confirmAvatarRights();
    await settle(fixture);

    expect(byTestId(fixture, 'settings-account-error').textContent).toContain('Abgelehnt');
  });

  it('starts provider linking and ignores unsupported providers', () => {
    const fixture = setup();
    const component = componentOf(fixture);

    byTestId(fixture, 'section-connections').click();
    fixture.detectChanges();

    byTestId(fixture, 'link-google').click();
    byTestId(fixture, 'link-discord').click();
    byTestId(fixture, 'link-github').click();
    byTestId(fixture, 'link-gitlab').click();
    component.linkProvider('gitlab');

    expect(auth.startGoogleLogin).toHaveBeenCalledWith(true);
    expect(auth.startDiscordLogin).toHaveBeenCalledWith(true);
    expect(auth.startGithubLogin).toHaveBeenCalledWith(true);
    expect(byTestId(fixture, 'link-gitlab').hasAttribute('disabled')).toBe(true);
    expect(byTestId(fixture, 'link-instagram').hasAttribute('disabled')).toBe(true);
    expect(byTestId(fixture, 'link-x').hasAttribute('disabled')).toBe(true);
  });

  it('exposes the branded classes of every provider', () => {
    const fixture = setup();
    const component = componentOf(fixture);

    expect(component.isLinkableProvider('google')).toBe(true);
    expect(component.isLinkableProvider('instagram')).toBe(false);
    expect(component.getSocialButtonClasses('google')).toContain('text-[#111]');
    expect(component.getSocialButtonClasses('discord')).toContain('#5865f2');
    expect(component.getSocialButtonClasses('github')).toContain('#0d1117');
    expect(component.getSocialButtonClasses('instagram')).toContain('bg-surface-raised');
  });

  it('keeps the birthday on the page until the backend supports it', async () => {
    const fixture = setup();
    const component = componentOf(fixture);

    byTestId(fixture, 'birthday').dispatchEvent(
      new CustomEvent('valueChange', { detail: '2000-01-01' }),
    );
    component.birthday.set('2000-01-01');
    await settle(fixture);

    expect(component.hasChanges()).toBe(false);
  });
});

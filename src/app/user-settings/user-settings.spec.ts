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
  saveProfile: () => Promise<void>;
} {
  return instance as unknown as {
    displayName: WritableSignal<string>;
    tagId: WritableSignal<string>;
    accentColor: WritableSignal<string>;
    saveProfile: () => Promise<void>;
  };
}

describe('UserSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prompts to log in when the user is signed out', () => {
    const authUser = signal<AuthUser | null>(null);
    const saveProfile = vi.fn().mockResolvedValue(undefined);
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => false,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      saveProfile,
    });

    expect(byTestId(fixture, 'settings-signed-out')).toBeTruthy();
    expect(byTestId(fixture, 'display-name')).toBeFalsy();
  });

  it('shows prefilled profile fields when user is logged in', () => {
    const authUser = signal<AuthUser | null>({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
      tagId: 'TAG-001',
    });

    const saveProfile = vi.fn().mockResolvedValue(undefined);
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      saveProfile,
    });
    const component = castUserSettingsComponent(fixture.componentInstance);

    expect(component.displayName()).toBe('Mira Player');
    expect(component.tagId()).toBe('TAG-001');
  });

  it('sends changed fields to auth.saveProfile', async () => {
    const authUser = signal<AuthUser | null>({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
      tagId: 'TAG-001',
    });

    const saveProfile = vi.fn().mockResolvedValue(undefined);
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      saveProfile,
    });
    const component = castUserSettingsComponent(fixture.componentInstance);

    component.displayName.set('Neue Playerin');
    component.tagId.set('TAG-002');
    fixture.detectChanges();

    await component.saveProfile();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveProfile).toHaveBeenCalledWith({
      displayName: 'Neue Playerin',
      tagId: 'TAG-002',
    });
  });

  it('sends accent color updates from the picker input', async () => {
    const authUser = signal<AuthUser | null>({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });

    const saveProfile = vi.fn().mockResolvedValue(undefined);
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      saveProfile,
    });
    const component = castUserSettingsComponent(fixture.componentInstance);

    component.accentColor.set('#ff0000');
    fixture.detectChanges();

    await component.saveProfile();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveProfile).toHaveBeenCalledWith({
      accentColor: '#ff0000',
    });
  });

  it('sends wallpaper updates to auth.saveProfile', async () => {
    const authUser = signal<AuthUser | null>({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });

    const saveProfile = vi.fn().mockResolvedValue(undefined);
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      saveProfile,
    });

    TestBed.inject(WallpaperService).set('yuna');
    fixture.detectChanges();

    (byTestId(fixture, 'save-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(saveProfile).toHaveBeenCalledWith({
      background: 'yuna',
    });
  });

  it('does not show phone number field anymore', () => {
    const authUser = signal<AuthUser | null>({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });

    const saveProfile = vi.fn().mockResolvedValue(undefined);
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      saveProfile,
    });

    expect(byTestId(fixture, 'phone')).toBeFalsy();
  });

  it('shows a visible success status after save', async () => {
    const authUser = signal<AuthUser | null>({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });
    const saveProfile = vi.fn().mockResolvedValue(undefined);

    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
      saveProfile,
    });
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
});

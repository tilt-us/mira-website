import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/auth.types';
import { WallpaperService } from '../shared/wallpaper.service';
import { UserSettings } from './user-settings';

function setup(mockAuth: {
  user: WritableSignal<AuthUser | null>;
  isLoggedIn: () => boolean;
  login: jasmine.Spy;
  logout: jasmine.Spy;
  saveProfile: jasmine.Spy;
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

describe('UserSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prompts to log in when the user is signed out', () => {
    const authUser = signal<AuthUser | null>(null);
    const saveProfile = jasmine.createSpy('saveProfile').and.resolveTo();
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => false,
      login: jasmine.createSpy('login').and.callFake(() => undefined),
      logout: jasmine.createSpy('logout'),
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

    const saveProfile = jasmine.createSpy('saveProfile').and.resolveTo();
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout'),
      saveProfile,
    });

    const displayName = byTestId(fixture, 'display-name') as HTMLInputElement;
    const tagId = byTestId(fixture, 'tag-id') as HTMLInputElement;

    expect(displayName.value).toBe('Mira Player');
    expect(tagId.value).toBe('TAG-001');
  });

  it('sends changed fields to auth.saveProfile', async () => {
    const authUser = signal<AuthUser | null>({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
      tagId: 'TAG-001',
    });

    const saveProfile = jasmine.createSpy('saveProfile').and.resolveTo();
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout'),
      saveProfile,
    });

    const displayName = byTestId(fixture, 'display-name') as HTMLInputElement;
    const tagId = byTestId(fixture, 'tag-id') as HTMLInputElement;

    displayName.value = 'Neue Playerin';
    displayName.dispatchEvent(new Event('input', { bubbles: true }));
    tagId.value = 'TAG-002';
    tagId.dispatchEvent(new Event('input', { bubbles: true }));

    fixture.detectChanges();

    (byTestId(fixture, 'save-button') as HTMLButtonElement).click();
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

    const saveProfile = jasmine.createSpy('saveProfile').and.resolveTo();
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout'),
      saveProfile,
    });

    const color = byTestId(fixture, 'accent-color') as HTMLInputElement;
    color.value = '#ff0000';
    color.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    (byTestId(fixture, 'save-button') as HTMLButtonElement).click();
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

    const saveProfile = jasmine.createSpy('saveProfile').and.resolveTo();
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout'),
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

    const saveProfile = jasmine.createSpy('saveProfile').and.resolveTo();
    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout'),
      saveProfile,
    });

    expect(byTestId(fixture, 'phone')).toBeFalsy();
  });

  it('shows a visible success status after save', async () => {
    const authUser = signal<AuthUser | null>({
      displayName: 'Mira Player',
      email: 'player@tilt-us.com',
    });
    const saveProfile = jasmine.createSpy('saveProfile').and.resolveTo();

    const fixture = setup({
      user: authUser,
      isLoggedIn: () => true,
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout'),
      saveProfile,
    });

    const displayName = byTestId(fixture, 'display-name') as HTMLInputElement;
    displayName.value = 'Neue Playerin';
    displayName.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    (byTestId(fixture, 'save-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(byTestId(fixture, 'settings-save-status')?.textContent).toContain(
      'Änderungen gespeichert.',
    );
  });
});

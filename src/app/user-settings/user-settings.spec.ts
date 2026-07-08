import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/auth.types';
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

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSettings } from './user-settings';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../auth/auth.types';
import { ACCOUNT_PROVIDERS } from './account-providers';

function setup(): {
  fixture: ComponentFixture<UserSettings>;
  auth: AuthService;
} {
  TestBed.configureTestingModule({
    imports: [UserSettings],
    providers: [AuthService],
  });
  const auth = TestBed.inject(AuthService);
  const fixture = TestBed.createComponent(UserSettings);
  fixture.detectChanges();
  return { fixture, auth };
}

describe('UserSettings', () => {
  it('prompts to log in when signed out', () => {
    const { fixture } = setup();
    expect(
      fixture.nativeElement.querySelector('[data-testid="settings-signed-out"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="display-name"]'),
    ).toBeFalsy();
  });

  it('shows the form prefilled with the user name when logged in', async () => {
    const { fixture, auth } = setup();
    auth.login();
    fixture.detectChanges();
    // ngModel writes the initial value to the DOM on a microtask.
    await fixture.whenStable();

    const name = fixture.nativeElement.querySelector(
      '[data-testid="display-name"]',
    ) as HTMLInputElement;
    expect(name.value).toBe('Mira Player');
    expect(
      fixture.nativeElement.querySelector('[data-testid="birthday"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="phone"]'),
    ).toBeTruthy();
  });

  it('edits the form fields and submits without navigating', async () => {
    const { fixture, auth } = setup();
    auth.login();
    fixture.detectChanges();
    await fixture.whenStable();

    const type = (id: string, value: string) => {
      const input = fixture.nativeElement.querySelector(
        `[data-testid="${id}"]`,
      ) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    type('display-name', 'New Name');
    type('birthday', '2000-01-01');
    type('phone', '+43 123 456');
    type('current-password', 'old-secret');
    type('new-password', 'new-secret');
    type('confirm-password', 'new-secret');
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector(
      '[data-testid="display-name"]',
    ) as HTMLInputElement;
    expect(name.value).toBe('New Name');
    const newPassword = fixture.nativeElement.querySelector(
      '[data-testid="new-password"]',
    ) as HTMLInputElement;
    expect(newPassword.value).toBe('new-secret');

    const forms = Array.from(
      fixture.nativeElement.querySelectorAll('form'),
    ) as HTMLFormElement[];
    for (const form of forms) {
      expect(() => form.dispatchEvent(new Event('submit'))).not.toThrow();
    }
  });

  it('logs in from the signed-out prompt', () => {
    const { fixture, auth } = setup();
    const button = fixture.nativeElement.querySelector(
      '[data-testid="settings-signed-out"] button',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(auth.isLoggedIn()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[data-testid="display-name"]'),
    ).toBeTruthy();
  });

  it('falls back to an empty name when the user has no display name', async () => {
    const auth = {
      user: signal<AuthUser | null>({
        displayName: undefined as unknown as string,
        email: 'player@tilt-us.com',
      }),
      isLoggedIn: () => true,
      login: () => undefined,
      logout: () => undefined,
    };
    TestBed.configureTestingModule({
      imports: [UserSettings],
      providers: [{ provide: AuthService, useValue: auth }],
    });
    const fixture = TestBed.createComponent(UserSettings);
    fixture.detectChanges();
    await fixture.whenStable();

    const name = fixture.nativeElement.querySelector(
      '[data-testid="display-name"]',
    ) as HTMLInputElement;
    expect(name.value).toBe('');
  });

  it('includes the wallpaper picker when logged in', () => {
    const { fixture, auth } = setup();
    auth.login();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('app-wallpaper-picker'),
    ).toBeTruthy();
  });

  it('renders a placeholder link button for every provider', () => {
    const { fixture, auth } = setup();
    auth.login();
    fixture.detectChanges();

    for (const provider of ACCOUNT_PROVIDERS) {
      const button = fixture.nativeElement.querySelector(
        `[data-testid="link-${provider.id}"]`,
      ) as HTMLButtonElement;
      expect(button).toBeTruthy();
      expect(button.disabled).toBe(true);
    }

    const save = fixture.nativeElement.querySelector(
      '[data-testid="save-button"]',
    ) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });
});

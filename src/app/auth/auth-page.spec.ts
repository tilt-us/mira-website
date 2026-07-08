import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthPage } from './auth-page';
import { AuthService } from './auth.service';

function setup(mockAuth: {
  startGoogleLogin: jasmine.Spy<() => Promise<void>>;
  startGithubLogin: jasmine.Spy<() => Promise<void>>;
  startDiscordLogin: jasmine.Spy<() => Promise<void>>;
  ensureInitialized: jasmine.Spy<() => Promise<void>>;
  isLoggedIn: () => boolean;
}) {
  TestBed.configureTestingModule({
    imports: [AuthPage],
    providers: [{ provide: AuthService, useValue: mockAuth }, provideRouter([])],
  });

  const fixture = TestBed.createComponent(AuthPage);
  fixture.detectChanges();
  return fixture;
}

function byTestId(fixture: ComponentFixture<AuthPage>, id: string): HTMLButtonElement {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
}

describe('AuthPage', () => {
  it('starts Google OAuth flow from button', async () => {
    const mockAuth = {
      ensureInitialized: jasmine.createSpy('ensureInitialized').and.resolveTo(),
      isLoggedIn: () => false,
      startGoogleLogin: jasmine.createSpy('startGoogleLogin').and.resolveTo(),
      startGithubLogin: jasmine.createSpy('startGithubLogin').and.resolveTo(),
      startDiscordLogin: jasmine.createSpy('startDiscordLogin').and.resolveTo(),
    };

    const fixture = setup(mockAuth);

    byTestId(fixture, 'provider-google').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockAuth.startGoogleLogin).toHaveBeenCalled();
  });

  it('starts GitHub OAuth flow from button', async () => {
    const mockAuth = {
      ensureInitialized: jasmine.createSpy('ensureInitialized').and.resolveTo(),
      isLoggedIn: () => false,
      startGoogleLogin: jasmine.createSpy('startGoogleLogin').and.resolveTo(),
      startGithubLogin: jasmine.createSpy('startGithubLogin').and.resolveTo(),
      startDiscordLogin: jasmine.createSpy('startDiscordLogin').and.resolveTo(),
    };

    const fixture = setup(mockAuth);

    byTestId(fixture, 'provider-github').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockAuth.startGithubLogin).toHaveBeenCalled();
  });

  it('starts Discord OAuth flow from button', async () => {
    const mockAuth = {
      ensureInitialized: jasmine.createSpy('ensureInitialized').and.resolveTo(),
      isLoggedIn: () => false,
      startGoogleLogin: jasmine.createSpy('startGoogleLogin').and.resolveTo(),
      startGithubLogin: jasmine.createSpy('startGithubLogin').and.resolveTo(),
      startDiscordLogin: jasmine.createSpy('startDiscordLogin').and.resolveTo(),
    };

    const fixture = setup(mockAuth);

    byTestId(fixture, 'provider-discord').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockAuth.startDiscordLogin).toHaveBeenCalled();
  });
});

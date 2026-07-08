import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Mock, vi } from 'vitest';

import { AuthPage } from './auth-page';
import { AuthService } from './auth.service';

function setup(mockAuth: {
  startGoogleLogin: Mock;
  startGithubLogin: Mock;
  startDiscordLogin: Mock;
  ensureInitialized: Mock;
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
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      isLoggedIn: () => false,
      startGoogleLogin: vi.fn().mockResolvedValue(undefined),
      startGithubLogin: vi.fn().mockResolvedValue(undefined),
      startDiscordLogin: vi.fn().mockResolvedValue(undefined),
    };

    const fixture = setup(mockAuth);

    byTestId(fixture, 'provider-google').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockAuth.startGoogleLogin).toHaveBeenCalled();
  });

  it('starts GitHub OAuth flow from button', async () => {
    const mockAuth = {
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      isLoggedIn: () => false,
      startGoogleLogin: vi.fn().mockResolvedValue(undefined),
      startGithubLogin: vi.fn().mockResolvedValue(undefined),
      startDiscordLogin: vi.fn().mockResolvedValue(undefined),
    };

    const fixture = setup(mockAuth);

    byTestId(fixture, 'provider-github').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockAuth.startGithubLogin).toHaveBeenCalled();
  });

  it('starts Discord OAuth flow from button', async () => {
    const mockAuth = {
      ensureInitialized: vi.fn().mockResolvedValue(undefined),
      isLoggedIn: () => false,
      startGoogleLogin: vi.fn().mockResolvedValue(undefined),
      startGithubLogin: vi.fn().mockResolvedValue(undefined),
      startDiscordLogin: vi.fn().mockResolvedValue(undefined),
    };

    const fixture = setup(mockAuth);

    byTestId(fixture, 'provider-discord').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mockAuth.startDiscordLogin).toHaveBeenCalled();
  });
});

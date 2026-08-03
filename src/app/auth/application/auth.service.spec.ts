import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { vi } from 'vitest';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
  });

  it('starts logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('opens the auth popup on login', () => {
    const openPopupSpy = vi.spyOn(service, 'openLoginPopup');

    service.login();

    expect(openPopupSpy).toHaveBeenCalled();
  });
});

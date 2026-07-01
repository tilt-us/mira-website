import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AuthService] });
    service = TestBed.inject(AuthService);
  });

  it('starts logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('logs in a mock user', () => {
    service.login();
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.displayName).toBeTruthy();
    expect(service.user()?.email).toContain('@');
  });

  it('logs out again', () => {
    service.login();
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.user()).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

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

  it('opens auth route on login', () => {
    const assignSpy = spyOn(window.location, 'assign');

    service.login();

    expect(assignSpy).toHaveBeenCalledWith('/auth');
  });
});

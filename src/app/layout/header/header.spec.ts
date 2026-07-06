import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';
import { AuthService } from '../../auth/auth.service';

function byTestId(fixture: ComponentFixture<Header>, id: string): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
}

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Header],
      // A real /settings route so the link click resolves instead of erroring.
      providers: [provideRouter([{ path: 'settings', children: [] }]), AuthService],
    });
    fixture = TestBed.createComponent(Header);
    auth = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('renders the Mira brand linking home', () => {
    const brand = fixture.nativeElement.querySelector('a');
    expect(brand.textContent).toContain('Mira');
    expect(brand.getAttribute('href')).toBe('/');
  });

  it('shows a login button while logged out', () => {
    expect(byTestId(fixture, 'login-button')).toBeTruthy();
    expect(byTestId(fixture, 'user-menu-button')).toBeFalsy();
  });

  it('logs in when the login button is clicked', () => {
    byTestId(fixture, 'login-button').click();
    fixture.detectChanges();

    expect(auth.isLoggedIn()).toBe(true);
    expect(byTestId(fixture, 'user-menu-button')).toBeTruthy();
    expect(byTestId(fixture, 'login-button')).toBeFalsy();
  });

  it('opens a popover with the user and a settings link', () => {
    auth.login();
    fixture.detectChanges();

    expect(byTestId(fixture, 'user-menu')).toBeFalsy();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    const menu = byTestId(fixture, 'user-menu');
    expect(menu).toBeTruthy();
    expect(menu.textContent).toContain('Mira Player');
    expect(byTestId(fixture, 'settings-link').getAttribute('href')).toBe(
      '/settings',
    );
  });

  it('closes the popover on the click-away layer', () => {
    auth.login();
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    byTestId(fixture, 'menu-backdrop').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'user-menu')).toBeFalsy();
  });

  it('closes the popover on Escape', () => {
    auth.login();
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(byTestId(fixture, 'user-menu')).toBeFalsy();
  });

  it('closes the popover when the settings link is chosen', () => {
    auth.login();
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    byTestId(fixture, 'settings-link').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'user-menu')).toBeFalsy();
  });

  it('logs out from the popover', () => {
    auth.login();
    fixture.detectChanges();
    byTestId(fixture, 'user-menu-button').click();
    fixture.detectChanges();

    byTestId(fixture, 'logout-button').click();
    fixture.detectChanges();

    expect(auth.isLoggedIn()).toBe(false);
    expect(byTestId(fixture, 'login-button')).toBeTruthy();
  });
});

import {
  DestroyRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService, normalizeLoginError } from '../../application/auth.service';
import { RegisterPayload } from '../../domain/models';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth-page',
  imports: [FormsModule],
  templateUrl: './auth-page.html',
})
export class AuthPage {
  protected readonly authService = inject(AuthService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);

  @Input() compact = false;
  @Output() closed = new EventEmitter<void>();

  protected readonly mode = signal<AuthMode>('login');
  protected readonly email = linkedSignal(() => '');
  protected readonly password = linkedSignal(() => '');
  protected readonly displayName = linkedSignal(() => '');
  protected readonly errorMessage = signal('');
  protected readonly statusMessage = signal('');
  protected readonly isLoading = signal(false);

  protected readonly hasProviderCallback = signal(false);
  protected readonly destroyRef = inject(DestroyRef);
  private callbackHandled = false;

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        const modeFromRoute = queryParams.get('mode');
        if (modeFromRoute === 'register') {
          this.mode.set('register');
        } else if (modeFromRoute === 'login') {
          this.mode.set('login');
        }

        const isCallback =
          queryParams.has('code') ||
          queryParams.has('error') ||
          queryParams.has('error_description');

        const hasProviderRequestParams =
          queryParams.has('client_id') && queryParams.has('code_challenge');

        if (isCallback) {
          if (this.callbackHandled) {
            return;
          }

          this.callbackHandled = true;
          this.hasProviderCallback.set(true);
          void this.handleProviderCallback();
          return;
        }

        this.hasProviderCallback.set(hasProviderRequestParams);

        if (hasProviderRequestParams) {
          this.isLoading.set(false);
          this.errorMessage.set('Der Social-Login konnte nicht gestartet werden.');
          this.callbackHandled = false;
        } else {
          this.callbackHandled = false;
        }
      });
  }

  protected async handleProviderCallback(): Promise<void> {
    this.isLoading.set(true);

    try {
      await this.authService.ensureInitialized();

      if (this.authService.isLoggedIn()) {
        if (this.compact) {
          this.closed.emit();
        } else {
          await this.router.navigateByUrl('/');
        }
        return;
      }

      if (this.route.snapshot.queryParamMap.has('error')) {
        this.errorMessage.set(
          normalizeLoginError(
            this.route.snapshot.queryParamMap.get('error_description') ??
              this.route.snapshot.queryParamMap.get('error'),
          ),
        );
        return;
      }

      this.errorMessage.set('Anmeldung konnte nicht abgeschlossen werden.');
    } catch (error: unknown) {
      this.errorMessage.set(normalizeLoginError(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async submitCredentials(): Promise<void> {
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    if (this.mode() === 'register' && !this.displayName().trim()) {
      this.errorMessage.set('Bitte einen Anzeigenamen eingeben.');
      return;
    }

    this.errorMessage.set('');
    this.statusMessage.set('');
    this.isLoading.set(true);

    try {
      if (this.mode() === 'login') {
        await this.authService.loginWithPassword(this.email(), this.password());
        if (this.compact) {
          this.closed.emit();
        } else {
          await this.router.navigateByUrl('/');
        }
        return;
      }

      const payload: RegisterPayload = {
        displayName: this.displayName().trim(),
        email: this.email().trim(),
        password: this.password(),
      };

      await this.authService.registerAccount(payload);
      this.statusMessage.set('Registrierung erfolgreich. Bitte jetzt einloggen.');
      this.mode.set('login');
      this.password.set('');
    } catch (error: unknown) {
      this.errorMessage.set(normalizeLoginError(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected startGoogleLogin(): void {
    this.errorMessage.set('');
    this.statusMessage.set('');
    this.startProviderLogin(() => this.authService.startGoogleLogin());
  }

  protected startGithubLogin(): void {
    this.errorMessage.set('');
    this.statusMessage.set('');
    this.startProviderLogin(() => this.authService.startGithubLogin());
  }

  protected startDiscordLogin(): void {
    this.errorMessage.set('');
    this.statusMessage.set('');
    this.startProviderLogin(() => this.authService.startDiscordLogin());
  }

  private startProviderLogin(startAttempt: () => Promise<void>): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);

    try {
      void startAttempt().catch((error: unknown) => {
        this.errorMessage.set(normalizeLoginError(error));
        this.isLoading.set(false);
      });
    } catch (error: unknown) {
      this.errorMessage.set(normalizeLoginError(error));
      this.isLoading.set(false);
    }
  }

  protected setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.statusMessage.set('');
  }

  protected close(): void {
    this.closed.emit();
  }
}

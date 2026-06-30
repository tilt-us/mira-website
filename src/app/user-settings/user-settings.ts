import { Component, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../auth/auth.service';
import { WallpaperPicker } from '../shared/wallpaper-picker/wallpaper-picker';
import { ACCOUNT_PROVIDERS } from './account-providers';

@Component({
  selector: 'app-user-settings',
  imports: [FormsModule, WallpaperPicker],
  templateUrl: './user-settings.html',
})
export class UserSettings {
  protected readonly auth = inject(AuthService);
  protected readonly providers = ACCOUNT_PROVIDERS;

  // Local-only form state; persisting it needs a backend endpoint that does
  // not exist yet, so "Save" and the provider links are placeholders.
  // Name is prefilled from the signed-in user but stays editable.
  protected readonly displayName = linkedSignal(
    () => this.auth.user()?.displayName ?? '',
  );
  protected readonly birthday = signal('');
  protected readonly phone = signal('');

  // Change-password form — placeholder only, nothing is sent anywhere yet.
  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly confirmPassword = signal('');
}

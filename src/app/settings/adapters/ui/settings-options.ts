/**
 * Static option lists for the settings page.
 *
 * The values mirror the validation patterns of `UpdateClientSettingsRequest`
 * in mira-service, so everything selectable here is accepted by the backend
 * and understood by the desktop client.
 */

export type SettingsSectionId =
  | 'account'
  | 'appearance'
  | 'client'
  | 'privacy'
  | 'security'
  | 'connections';

export interface SettingsSection {
  readonly id: SettingsSectionId;
  readonly label: string;
  readonly hint: string;
}

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { id: 'account', label: 'Konto', hint: 'Deine Identität in Mira.' },
  { id: 'appearance', label: 'Darstellung', hint: 'Akzentfarbe und Hintergrund.' },
  { id: 'client', label: 'Spiel-Client', hint: 'Wird beim nächsten Start des Clients übernommen.' },
  { id: 'privacy', label: 'Privatsphäre', hint: 'Wer was von dir sehen darf.' },
  { id: 'security', label: 'Sicherheit', hint: 'Passwort und Anmeldung.' },
  { id: 'connections', label: 'Verknüpfungen', hint: 'Externe Konten mit Mira verbinden.' },
];

/** Pattern `^[a-z]{2,16}$`; the client ships German and English. */
export const LANGUAGE_OPTIONS: readonly SelectOption[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
];

/** Pattern `^(windowed|fullscreen|borderless)$`. */
export const SCREEN_MODE_OPTIONS: readonly SelectOption[] = [
  { value: 'fullscreen', label: 'Vollbild' },
  { value: 'borderless', label: 'Rahmenlos' },
  { value: 'windowed', label: 'Fenster' },
];

/** Pattern `^(left|right|top|bottom)$`. */
export const CHAT_POSITION_OPTIONS: readonly SelectOption[] = [
  { value: 'left', label: 'Links' },
  { value: 'right', label: 'Rechts' },
  { value: 'top', label: 'Oben' },
  { value: 'bottom', label: 'Unten' },
];

/** Pattern `^(off|low|medium|high|enabled|disabled|all)$`. */
export const CLIENT_ANIMATION_OPTIONS: readonly SelectOption[] = [
  { value: 'high', label: 'Hoch' },
  { value: 'medium', label: 'Mittel' },
  { value: 'low', label: 'Niedrig' },
  { value: 'off', label: 'Aus' },
];

/** Pattern `^[1-9][0-9]{2,4}x[1-9][0-9]{2,4}$`. */
export const RESOLUTION_OPTIONS: readonly SelectOption[] = [
  { value: '1280x720', label: '1280 × 720' },
  { value: '1600x900', label: '1600 × 900' },
  { value: '1920x1080', label: '1920 × 1080 (Full HD)' },
  { value: '2560x1440', label: '2560 × 1440 (WQHD)' },
  { value: '3840x2160', label: '3840 × 2160 (4K)' },
];

/** Backend bounds for `uiScale`. */
export const UI_SCALE_MIN = 0.5;
export const UI_SCALE_MAX = 2;
export const UI_SCALE_STEP = 0.05;

/**
 * Adds a value the backend already stores but that is missing from the static
 * list, so an option written by the client is never silently replaced.
 */
export function withCurrentValue(
  options: readonly SelectOption[],
  value: string | undefined,
): readonly SelectOption[] {
  if (!value || options.some((option) => option.value === value)) {
    return options;
  }

  return [...options, { value, label: value }];
}

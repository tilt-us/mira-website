import { Component, computed, input, model, signal } from '@angular/core';

export type DatePickerLocale = 'de' | 'en';

type DatePickerView = 'days' | 'months' | 'years';

interface DayCell {
  readonly iso: string;
  readonly day: number;
  readonly inMonth: boolean;
  readonly today: boolean;
}

const LOCALE_TAGS: Record<DatePickerLocale, string> = {
  de: 'de-DE',
  en: 'en-US',
};

// German dates read DD.MM.YYYY, English (US) MM/DD/YYYY.
const PLACEHOLDERS: Record<DatePickerLocale, string> = {
  de: 'TT.MM.JJJJ',
  en: 'MM/DD/YYYY',
};

const LABELS: Record<
  DatePickerLocale,
  { trigger: string; prev: string; next: string; clear: string }
> = {
  de: { trigger: 'Datum wählen', prev: 'Zurück', next: 'Weiter', clear: 'Löschen' },
  en: { trigger: 'Choose date', prev: 'Previous', next: 'Next', clear: 'Clear' },
};

const YEARS_PER_PAGE = 12;

function detectLocale(): DatePickerLocale {
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/** Parses ISO `YYYY-MM-DD`, rejecting impossible dates like `2001-02-31`. */
function parseIso(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const date = new Date(+match[1], +match[2] - 1, +match[3]);
  return date.getFullYear() === +match[1] &&
    date.getMonth() === +match[2] - 1 &&
    date.getDate() === +match[3]
    ? date
    : null;
}

/**
 * Hand-rolled calendar date picker replacing the native `<input type="date">`,
 * styled to match the client. The value is an ISO `YYYY-MM-DD` string (empty
 * when unset); the display follows the locale — German `15.03.2001`, English
 * `03/15/2001`. The header label zooms out days → months → years, so a date
 * can be picked as year, then month, then day.
 */
@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.html',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class DatePicker {
  /** Selected date as ISO `YYYY-MM-DD`, or `''` when nothing is picked. */
  readonly value = model('');
  readonly locale = input<DatePickerLocale>(detectLocale());
  readonly ariaLabel = input('');

  protected readonly open = signal(false);
  protected readonly view = signal<DatePickerView>('days');
  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly viewMonth = signal(new Date().getMonth());

  private readonly tag = computed(() => LOCALE_TAGS[this.locale()]);
  protected readonly labels = computed(() => LABELS[this.locale()]);
  protected readonly placeholder = computed(() => PLACEHOLDERS[this.locale()]);
  protected readonly triggerLabel = computed(() => this.ariaLabel() || this.labels().trigger);

  private readonly selectedDate = computed(() => parseIso(this.value()));
  protected readonly selectedIso = computed(() => {
    const date = this.selectedDate();
    return date ? toIso(date.getFullYear(), date.getMonth(), date.getDate()) : '';
  });

  protected readonly display = computed(() => {
    const date = this.selectedDate();
    if (!date) {
      return '';
    }
    return new Intl.DateTimeFormat(this.tag(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  });

  // German weeks start on Monday, US-English weeks on Sunday.
  private readonly weekStart = computed(() => (this.locale() === 'de' ? 1 : 0));

  protected readonly weekdays = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.tag(), { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) =>
      formatter
        // 2024-01-07 was a Sunday, so day 7 + n has weekday n (0 = Sunday).
        .format(new Date(2024, 0, 7 + ((this.weekStart() + i) % 7)))
        .replace(/\.$/, ''),
    );
  });

  protected readonly monthNames = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.tag(), { month: 'short' });
    return Array.from({ length: 12 }, (_, month) =>
      formatter.format(new Date(2024, month, 1)).replace(/\.$/, ''),
    );
  });

  protected readonly years = computed(() => {
    const first = Math.floor(this.viewYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    return Array.from({ length: YEARS_PER_PAGE }, (_, i) => first + i);
  });

  protected readonly headerLabel = computed(() => {
    switch (this.view()) {
      case 'years': {
        const years = this.years();
        return `${years[0]} – ${years[years.length - 1]}`;
      }
      case 'months':
        return String(this.viewYear());
      default:
        return new Intl.DateTimeFormat(this.tag(), {
          month: 'long',
          year: 'numeric',
        }).format(new Date(this.viewYear(), this.viewMonth(), 1));
    }
  });

  // Fixed 6-week grid including the dimmed lead-in/out days of the
  // neighbouring months, so the panel never changes height.
  protected readonly days = computed<DayCell[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const lead = (new Date(year, month, 1).getDay() - this.weekStart() + 7) % 7;
    const now = new Date();
    const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate());
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(year, month, 1 - lead + i);
      const iso = toIso(date.getFullYear(), date.getMonth(), date.getDate());
      return {
        iso,
        day: date.getDate(),
        inMonth: date.getMonth() === month,
        today: iso === todayIso,
      };
    });
  });

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    const focus = this.selectedDate() ?? new Date();
    this.viewYear.set(focus.getFullYear());
    this.viewMonth.set(focus.getMonth());
    this.view.set('days');
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected previous(): void {
    this.step(-1);
  }

  protected next(): void {
    this.step(1);
  }

  private step(direction: -1 | 1): void {
    switch (this.view()) {
      case 'years':
        this.viewYear.update((year) => year + direction * YEARS_PER_PAGE);
        break;
      case 'months':
        this.viewYear.update((year) => year + direction);
        break;
      default: {
        const month = this.viewMonth() + direction;
        this.viewMonth.set((month + 12) % 12);
        if (month < 0 || month > 11) {
          this.viewYear.update((year) => year + direction);
        }
      }
    }
  }

  // The header button is disabled in the years view, so zooming out stops there.
  protected zoomOut(): void {
    this.view.set(this.view() === 'days' ? 'months' : 'years');
  }

  protected selectDay(iso: string): void {
    this.value.set(iso);
    this.close();
  }

  protected selectMonth(month: number): void {
    this.viewMonth.set(month);
    this.view.set('days');
  }

  protected selectYear(year: number): void {
    this.viewYear.set(year);
    this.view.set('months');
  }

  protected clear(): void {
    this.value.set('');
    this.close();
  }

  protected dayClass(cell: DayCell): string {
    if (cell.iso === this.selectedIso()) {
      return 'bg-brand font-semibold text-brand-fg';
    }
    if (cell.today) {
      return 'font-semibold text-brand hover:bg-surface-raised';
    }
    return cell.inMonth ? 'hover:bg-surface-raised' : 'text-white/30 hover:bg-surface-raised';
  }
}

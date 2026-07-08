import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePicker, DatePickerLocale } from './date-picker';

function byTestId(fixture: ComponentFixture<DatePicker>, id: string): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
}

function isoToday(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

describe('DatePicker', () => {
  let fixture: ComponentFixture<DatePicker>;

  function create(locale?: DatePickerLocale, value = ''): void {
    TestBed.configureTestingModule({ imports: [DatePicker] });
    fixture = TestBed.createComponent(DatePicker);
    if (locale) {
      fixture.componentRef.setInput('locale', locale);
    }
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  }

  function open(): void {
    byTestId(fixture, 'date-picker-trigger').click();
    fixture.detectChanges();
  }

  function weekdayLabels(): string[] {
    return Array.from(byTestId(fixture, 'date-picker-weekdays').querySelectorAll('span')).map(
      (span) => span.textContent!.trim(),
    );
  }

  it('shows the format as placeholder while empty', () => {
    create('en');
    expect(byTestId(fixture, 'date-picker-placeholder').textContent).toContain('MM/DD/YYYY');
    expect(byTestId(fixture, 'date-picker-panel')).toBeFalsy();
  });

  it('shows the German format placeholder for the de locale', () => {
    create('de');
    expect(byTestId(fixture, 'date-picker-placeholder').textContent).toContain('TT.MM.JJJJ');
  });

  it('formats the value as MM/DD/YYYY in English', () => {
    create('en', '2001-03-15');
    expect(byTestId(fixture, 'date-picker-display').textContent).toContain('03/15/2001');
  });

  it('formats the value as DD.MM.YYYY in German', () => {
    create('de', '2001-03-15');
    expect(byTestId(fixture, 'date-picker-display').textContent).toContain('15.03.2001');
  });

  it('detects the browser language as default locale', () => {
    const language = spyOnProperty(navigator, 'language', 'get');

    language.and.returnValue('de-AT');
    create(undefined, '2001-03-15');
    expect(byTestId(fixture, 'date-picker-display').textContent).toContain('15.03.2001');

    language.and.returnValue(undefined as unknown as string);
    TestBed.resetTestingModule();
    create(undefined, '2001-03-15');
    expect(byTestId(fixture, 'date-picker-display').textContent).toContain('03/15/2001');
  });

  it('opens on the month of the selected date with a localized header', () => {
    create('de', '2001-03-15');
    open();
    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('März 2001');
    expect(byTestId(fixture, 'date-picker-day-2001-03-15').getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('opens on the current month when the value is empty', () => {
    create('en');
    open();
    const label = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    expect(byTestId(fixture, 'date-picker-header').textContent).toContain(label);
    expect(byTestId(fixture, `date-picker-day-${isoToday()}`).getAttribute('aria-current')).toBe(
      'date',
    );
  });

  it('falls back to the placeholder for invalid values', () => {
    create('en', '2001-02-31');
    expect(byTestId(fixture, 'date-picker-placeholder')).toBeTruthy();

    fixture.componentRef.setInput('value', 'bogus');
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-placeholder')).toBeTruthy();
  });

  it('starts the week on Monday in German and Sunday in English', () => {
    create('de');
    open();
    expect(weekdayLabels()[0]).toBe('Mo');

    TestBed.resetTestingModule();
    create('en');
    open();
    expect(weekdayLabels()[0]).toBe('Sun');
  });

  it('renders a fixed six-week grid with dimmed out-of-month days', () => {
    create('en', '2001-03-15');
    open();
    const days = byTestId(fixture, 'date-picker-days').querySelectorAll('button');
    expect(days.length).toBe(42);
    // March 2001 starts on a Thursday, so the grid leads with February days.
    expect(byTestId(fixture, 'date-picker-day-2001-02-25').className).toContain('text-white/30');
  });

  it('selects a day, updates the value and closes', () => {
    create('en', '2001-03-15');
    open();
    byTestId(fixture, 'date-picker-day-2001-03-20').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('2001-03-20');
    expect(byTestId(fixture, 'date-picker-panel')).toBeFalsy();
    expect(byTestId(fixture, 'date-picker-display').textContent).toContain('03/20/2001');
  });

  it('navigates months and rolls the year over', () => {
    create('en', '2001-01-15');
    open();
    byTestId(fixture, 'date-picker-prev').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('December 2000');

    byTestId(fixture, 'date-picker-next').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('January 2001');

    byTestId(fixture, 'date-picker-next').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('February 2001');
  });

  it('zooms out to localized month names and back in', () => {
    create('de', '2001-03-15');
    open();
    byTestId(fixture, 'date-picker-header').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('2001');
    expect(byTestId(fixture, 'date-picker-month-11').textContent).toContain('Dez');

    byTestId(fixture, 'date-picker-month-5').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-days')).toBeTruthy();
    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('Juni 2001');
  });

  it('navigates years in the months view', () => {
    create('en', '2001-03-15');
    open();
    byTestId(fixture, 'date-picker-header').click();
    fixture.detectChanges();
    byTestId(fixture, 'date-picker-next').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('2002');
  });

  it('picks a date as year, then month, then day', () => {
    create('en', '2001-03-15');
    open();
    byTestId(fixture, 'date-picker-header').click();
    fixture.detectChanges();
    byTestId(fixture, 'date-picker-header').click();
    fixture.detectChanges();

    const header = byTestId(fixture, 'date-picker-header') as HTMLButtonElement;
    expect(header.textContent).toContain('1992 – 2003');
    expect(header.disabled).toBe(true);
    expect(byTestId(fixture, 'date-picker-year-2001').className).toContain('text-brand');

    byTestId(fixture, 'date-picker-year-1994').click();
    fixture.detectChanges();
    byTestId(fixture, 'date-picker-month-6').click();
    fixture.detectChanges();
    byTestId(fixture, 'date-picker-day-1994-07-08').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('1994-07-08');
  });

  it('pages the years view by twelve', () => {
    create('en', '2001-03-15');
    open();
    byTestId(fixture, 'date-picker-header').click();
    fixture.detectChanges();
    byTestId(fixture, 'date-picker-header').click();
    fixture.detectChanges();
    byTestId(fixture, 'date-picker-prev').click();
    fixture.detectChanges();

    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('1980 – 1991');
    expect(byTestId(fixture, 'date-picker-year-1980')).toBeTruthy();

    byTestId(fixture, 'date-picker-next').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-header').textContent).toContain('1992 – 2003');
  });

  it('clears the value', () => {
    create('de', '2001-03-15');
    open();
    byTestId(fixture, 'date-picker-clear').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('');
    expect(byTestId(fixture, 'date-picker-panel')).toBeFalsy();
    expect(byTestId(fixture, 'date-picker-placeholder')).toBeTruthy();
  });

  it('closes on the click-away layer and re-toggles via the trigger', () => {
    create('en');
    open();
    byTestId(fixture, 'date-picker-backdrop').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-panel')).toBeFalsy();

    open();
    expect(byTestId(fixture, 'date-picker-panel')).toBeTruthy();
    byTestId(fixture, 'date-picker-trigger').click();
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-panel')).toBeFalsy();
  });

  it('closes on Escape', () => {
    create('en');
    open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(byTestId(fixture, 'date-picker-panel')).toBeFalsy();
  });

  it('uses the aria label on trigger and panel', () => {
    create('de');
    expect(byTestId(fixture, 'date-picker-trigger').getAttribute('aria-label')).toBe(
      'Datum wählen',
    );

    fixture.componentRef.setInput('ariaLabel', 'Geburtstag');
    fixture.detectChanges();
    open();
    expect(byTestId(fixture, 'date-picker-trigger').getAttribute('aria-label')).toBe('Geburtstag');
    expect(byTestId(fixture, 'date-picker-panel').getAttribute('aria-label')).toBe('Geburtstag');
  });
});

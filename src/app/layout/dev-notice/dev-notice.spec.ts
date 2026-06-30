import { TestBed } from '@angular/core/testing';

import { DevNotice } from './dev-notice';

describe('DevNotice', () => {
  it('shows the development notice on load', () => {
    const fixture = TestBed.createComponent(DevNotice);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('development');
  });

  it('hides the notice once dismissed', () => {
    const fixture = TestBed.createComponent(DevNotice);
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('[data-testid="dev-notice-dismiss"]')
      .click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="dev-notice-dismiss"]'),
    ).toBeFalsy();
  });
});

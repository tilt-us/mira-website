import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the fixed background layer', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[style*="lira-wallpaper"]'),
    ).toBeTruthy();
  });
});

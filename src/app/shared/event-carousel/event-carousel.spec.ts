import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCarousel } from './event-carousel';
import { CarouselCard } from '../card-carousel/card-carousel';

describe('EventCarousel', () => {
  const items: CarouselCard[] = [
    { id: 'a', title: 'Alpha', body: 'first' },
    { id: 'b', title: 'Beta', body: 'second' },
    { id: 'c', title: 'Gamma', body: 'third' },
  ];

  function create(cards: readonly CarouselCard[] = items): ComponentFixture<EventCarousel> {
    TestBed.configureTestingModule({ imports: [EventCarousel] });
    const fixture = TestBed.createComponent(EventCarousel);
    fixture.componentRef.setInput('items', cards);
    fixture.detectChanges();
    return fixture;
  }

  function region(fixture: ComponentFixture<EventCarousel>): HTMLElement {
    return fixture.nativeElement.querySelector('[data-testid="event-carousel"]') as HTMLElement;
  }

  function cards(fixture: ComponentFixture<EventCarousel>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.event-carousel-card'));
  }

  function activeIds(fixture: ComponentFixture<EventCarousel>): boolean[] {
    return cards(fixture).map((card) => card.classList.contains('is-active'));
  }

  function button(fixture: ComponentFixture<EventCarousel>, label: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement;
  }

  it('renders a slide per item with the first one active and on top', () => {
    const fixture = create();
    expect(region(fixture).getAttribute('aria-label')).toBe('Events');
    expect(cards(fixture).length).toBe(3);
    expect(activeIds(fixture)).toEqual([true, false, false]);
    expect(cards(fixture)[1].getAttribute('aria-label')).toBe('2 of 3');
  });

  it('moves the whole track one step per navigation', () => {
    const fixture = create();
    const track = fixture.nativeElement.querySelector('.event-carousel-track') as HTMLElement;
    expect(track.style.getPropertyValue('--carousel-index')).toBe('0');

    button(fixture, 'Show next event').click();
    fixture.detectChanges();
    expect(track.style.getPropertyValue('--carousel-index')).toBe('1');
    expect(activeIds(fixture)).toEqual([false, true, false]);

    button(fixture, 'Show previous event').click();
    fixture.detectChanges();
    expect(track.style.getPropertyValue('--carousel-index')).toBe('0');
    expect(activeIds(fixture)).toEqual([true, false, false]);
  });

  it('disables previous on the first card and next on the last', () => {
    const fixture = create();
    expect(button(fixture, 'Show previous event').disabled).toBe(true);
    expect(button(fixture, 'Show next event').disabled).toBe(false);

    button(fixture, 'Show next event').click();
    button(fixture, 'Show next event').click();
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([false, false, true]);
    expect(button(fixture, 'Show previous event').disabled).toBe(false);
    expect(button(fixture, 'Show next event').disabled).toBe(true);
  });

  it('centers a side card when it is clicked', () => {
    const fixture = create();
    cards(fixture)[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([false, false, true]);
  });

  it('navigates with the arrow keys and stays within bounds', () => {
    const fixture = create();
    const el = region(fixture);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([true, false, false]);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([false, true, false]);
  });

  it('advances on a left swipe and goes back on a right swipe', () => {
    const fixture = create();
    const el = region(fixture);

    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 300 }));
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 200 }));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([false, true, false]);

    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 200 }));
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 300 }));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([true, false, false]);
  });

  it('ignores drags below the swipe threshold and releases without a press', () => {
    const fixture = create();
    const el = region(fixture);

    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 100 }));
    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 300 }));
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 280 }));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([true, false, false]);
  });

  it('does not treat the click released after a swipe as a card selection', () => {
    const fixture = create();
    const el = region(fixture);

    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 300 }));
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 200 }));
    cards(fixture)[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([false, true, false]);

    // A later plain click selects again as usual.
    cards(fixture)[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([false, false, true]);
  });

  it('clamps the active card when the items shrink', () => {
    const fixture = create();
    button(fixture, 'Show next event').click();
    button(fixture, 'Show next event').click();
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([false, false, true]);

    fixture.componentRef.setInput('items', items.slice(0, 2));
    fixture.detectChanges();
    expect(activeIds(fixture)).toEqual([false, true]);
  });
});

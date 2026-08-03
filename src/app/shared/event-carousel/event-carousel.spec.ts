import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselCard, circularOffset, EventCarousel } from './event-carousel';

describe('EventCarousel', () => {
  const items: CarouselCard[] = [
    { id: 'a', title: 'Alpha', body: 'first' },
    { id: 'b', title: 'Beta', body: 'second' },
    { id: 'c', title: 'Gamma', body: 'third' },
    { id: 'd', title: 'Delta', body: 'fourth' },
    { id: 'e', title: 'Epsilon', body: 'fifth' },
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

  function dots(fixture: ComponentFixture<EventCarousel>): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.event-carousel-dot'));
  }

  function activeFlags(fixture: ComponentFixture<EventCarousel>): boolean[] {
    return cards(fixture).map((card) => card.classList.contains('is-active'));
  }

  function offsets(fixture: ComponentFixture<EventCarousel>): number[] {
    return cards(fixture).map((card) => Number(card.style.getPropertyValue('--card-offset')));
  }

  function button(fixture: ComponentFixture<EventCarousel>, label: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement;
  }

  it('renders a slide per item with the first one active and centred', () => {
    const fixture = create();
    expect(region(fixture).getAttribute('aria-label')).toBe('Events');
    expect(cards(fixture).length).toBe(5);
    expect(activeFlags(fixture)).toEqual([true, false, false, false, false]);
    expect(cards(fixture)[1].getAttribute('aria-label')).toBe('2 of 5');
    expect(offsets(fixture)).toEqual([0, 1, 2, -2, -1]);
  });

  it('hides the far cards from view and assistive tech', () => {
    const fixture = create();
    const farFlags = cards(fixture).map((card) => card.classList.contains('is-far'));
    expect(farFlags).toEqual([false, false, true, true, false]);
    expect(cards(fixture)[2].getAttribute('aria-hidden')).toBe('true');
    expect(cards(fixture)[0].getAttribute('aria-hidden')).toBeNull();
  });

  it('moves every visible card together and teleports only the seam card', () => {
    const fixture = create();
    button(fixture, 'Show next event').click();
    fixture.detectChanges();

    expect(activeFlags(fixture)).toEqual([false, true, false, false, false]);
    expect(offsets(fixture)).toEqual([-1, 0, 1, 2, -2]);
    const wrappingFlags = cards(fixture).map((card) => card.classList.contains('is-wrapping'));
    expect(wrappingFlags).toEqual([false, false, false, true, false]);
  });

  it('loops endlessly in both directions', () => {
    const fixture = create();
    button(fixture, 'Show previous event').click();
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, false, false, false, true]);
    expect(offsets(fixture)).toEqual([1, 2, -2, -1, 0]);

    button(fixture, 'Show next event').click();
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([true, false, false, false, false]);
  });

  it('shows a dot per card and jumps to the card whose dot is clicked', () => {
    const fixture = create();
    const allDots = dots(fixture);
    expect(allDots.length).toBe(5);
    expect(allDots[0].classList.contains('is-active')).toBe(true);
    expect(allDots[3].getAttribute('aria-label')).toBe('Go to event 4');

    allDots[3].click();
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, false, false, true, false]);
    expect(dots(fixture)[3].classList.contains('is-active')).toBe(true);
    expect(dots(fixture)[3].getAttribute('aria-current')).toBe('true');
  });

  it('centres a side card when it is clicked', () => {
    const fixture = create();
    cards(fixture)[4].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, false, false, false, true]);
  });

  it('navigates with the arrow keys across the loop seam', () => {
    const fixture = create();
    const el = region(fixture);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, false, false, false, true]);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([true, false, false, false, false]);
  });

  it('advances on a left swipe and goes back on a right swipe', () => {
    const fixture = create();
    const el = region(fixture);

    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 300 }));
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 200 }));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, true, false, false, false]);

    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 200 }));
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 300 }));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([true, false, false, false, false]);
  });

  it('ignores drags below the swipe threshold and releases without a press', () => {
    const fixture = create();
    const el = region(fixture);

    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 100 }));
    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 300 }));
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 280 }));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([true, false, false, false, false]);
  });

  it('does not treat the click released after a swipe as a card selection', () => {
    const fixture = create();
    const el = region(fixture);

    el.dispatchEvent(new MouseEvent('pointerdown', { clientX: 300 }));
    el.dispatchEvent(new MouseEvent('pointerup', { clientX: 200 }));
    cards(fixture)[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, true, false, false, false]);

    // A later plain click selects again as usual.
    cards(fixture)[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, false, false, true, false]);
  });

  it('renders no slides or dots and ignores navigation without items', () => {
    const fixture = create([]);
    expect(cards(fixture).length).toBe(0);
    expect(dots(fixture).length).toBe(0);

    button(fixture, 'Show next event').click();
    fixture.detectChanges();
    expect(cards(fixture).length).toBe(0);
  });

  it('treats every offset as centred when the list is empty', () => {
    expect(circularOffset(3, 0, 0)).toBe(0);
  });

  it('clamps the active card when the items shrink', () => {
    const fixture = create();
    dots(fixture)[4].click();
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, false, false, false, true]);

    fixture.componentRef.setInput('items', items.slice(0, 2));
    fixture.detectChanges();
    expect(activeFlags(fixture)).toEqual([false, true]);
  });
});

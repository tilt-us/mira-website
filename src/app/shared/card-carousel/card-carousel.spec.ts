import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardCarousel, CarouselCard } from './card-carousel';

describe('CardCarousel', () => {
  const items: CarouselCard[] = [
    { id: 'a', title: 'Alpha', body: 'first' },
    { id: 'b', title: 'Beta', body: 'second' },
  ];

  function create(paused = false): ComponentFixture<CardCarousel> {
    TestBed.configureTestingModule({ imports: [CardCarousel] });
    const fixture = TestBed.createComponent(CardCarousel);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('durationSeconds', 12);
    fixture.componentRef.setInput('paused', paused);
    fixture.detectChanges();
    return fixture;
  }

  it('renders each card duplicated for a seamless loop', () => {
    const el = create().nativeElement as HTMLElement;
    expect(el.querySelectorAll('article').length).toBe(4);
    expect(el.textContent).toContain('Alpha');
    expect(el.textContent).toContain('Beta');
  });

  it('exposes the duration as a CSS variable', () => {
    const marquee = create().nativeElement.querySelector('.marquee') as HTMLElement;
    expect(marquee.style.getPropertyValue('--marquee-duration')).toBe('12s');
  });

  it('marks the track as paused when the paused input is set', () => {
    const fixture = create(false);
    const track = fixture.nativeElement.querySelector('.marquee-track') as HTMLElement;
    expect(track.classList.contains('is-paused')).toBe(false);

    fixture.componentRef.setInput('paused', true);
    fixture.detectChanges();
    expect(track.classList.contains('is-paused')).toBe(true);
  });

  it('emits hover state on mouse enter and leave', () => {
    const fixture = create();
    let lastHover: boolean | undefined;
    fixture.componentInstance.hoveredChange.subscribe((value) => (lastHover = value));
    const marquee = fixture.nativeElement.querySelector('.marquee') as HTMLElement;

    marquee.dispatchEvent(new MouseEvent('mouseenter'));
    expect(lastHover).toBe(true);

    marquee.dispatchEvent(new MouseEvent('mouseleave'));
    expect(lastHover).toBe(false);
  });
});

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reveal } from './reveal';

@Component({
  imports: [Reveal],
  template: `<div appReveal data-testid="target">content</div>`,
})
class HostComponent {}

describe('Reveal', () => {
  let callbacks: IntersectionObserverCallback[];
  let observed: Element[];
  let unobserved: Element[];
  let disconnected: number;

  beforeEach(() => {
    callbacks = [];
    observed = [];
    unobserved = [];
    disconnected = 0;

    class MockIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        callbacks.push(cb);
      }
      observe(el: Element) {
        observed.push(el);
      }
      unobserve(el: Element) {
        unobserved.push(el);
      }
      disconnect() {
        disconnected++;
      }
    }
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      MockIntersectionObserver;

    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  function target(fixture: ComponentFixture<HostComponent>): HTMLElement {
    return fixture.nativeElement.querySelector('[data-testid="target"]');
  }

  it('adds the reveal class and observes the element', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(target(fixture).classList.contains('reveal')).toBe(true);
    expect(observed.length).toBe(1);
  });

  it('reveals when intersecting and stops observing', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    callbacks[0](
      [
        { isIntersecting: true, target: target(fixture) } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(target(fixture).classList.contains('reveal-visible')).toBe(true);
    expect(unobserved.length).toBe(1);
  });

  it('does not reveal when not intersecting', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    callbacks[0](
      [
        { isIntersecting: false, target: target(fixture) } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(target(fixture).classList.contains('reveal-visible')).toBe(false);
  });

  it('disconnects on destroy', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(disconnected).toBe(1);
  });

  it('reveals immediately when IntersectionObserver is unavailable', () => {
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      undefined;
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(target(fixture).classList.contains('reveal-visible')).toBe(true);
  });
});

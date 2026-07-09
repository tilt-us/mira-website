import { Component, computed, input, signal } from '@angular/core';

export interface CarouselCard {
  id: string;
  title: string;
  body: string;
}

// Minimum horizontal drag distance before a pointer gesture counts as a swipe.
const SWIPE_THRESHOLD_PX = 40;

// Signed circular distance from a reference index: 0 is the active card,
// ±1 the visible side peeks, anything further is parked at the edges.
function circularOffset(index: number, reference: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  const distance = (((index - reference) % length) + length) % length;
  return distance > length / 2 ? distance - length : distance;
}

@Component({
  selector: 'app-event-carousel',
  templateUrl: './event-carousel.html',
})
export class EventCarousel {
  readonly items = input.required<readonly CarouselCard[]>();
  readonly label = input('Events');

  private readonly state = signal<{ index: number; wrapped: ReadonlySet<string> }>({
    index: 0,
    wrapped: new Set(),
  });

  // Clamped so the active card stays valid even when the items input shrinks.
  protected readonly activeIndex = computed(() => {
    const last = this.items().length - 1;
    return Math.max(0, Math.min(this.state().index, last));
  });

  private pointerStartX: number | null = null;
  private suppressCardClick = false;

  protected offsetFor(index: number): number {
    return circularOffset(index, this.activeIndex(), this.items().length);
  }

  protected isFar(index: number): boolean {
    return Math.abs(this.offsetFor(index)) >= 2;
  }

  protected isWrapping(id: string): boolean {
    return this.state().wrapped.has(id);
  }

  protected previous(): void {
    this.goTo(this.activeIndex() - 1);
  }

  protected next(): void {
    this.goTo(this.activeIndex() + 1);
  }

  protected select(index: number): void {
    this.goTo(index);
  }

  protected onCardClick(index: number): void {
    // The click fired by a swipe release must not re-select the card under the pointer.
    if (this.suppressCardClick) {
      this.suppressCardClick = false;
      return;
    }
    this.goTo(index);
  }

  protected onPointerDown(event: PointerEvent): void {
    this.pointerStartX = event.clientX;
    this.suppressCardClick = false;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) {
      return;
    }
    const deltaX = event.clientX - this.pointerStartX;
    this.pointerStartX = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
      return;
    }
    this.suppressCardClick = true;
    if (deltaX < 0) {
      this.next();
    } else {
      this.previous();
    }
  }

  private goTo(rawTarget: number): void {
    const length = this.items().length;
    if (length === 0) {
      return;
    }
    const current = this.activeIndex();
    const target = ((rawTarget % length) + length) % length;
    // Cards crossing the circular seam would visibly slide across the whole
    // stage, so they are flagged to jump without a transform transition while
    // parked in the invisible far zone.
    const shift = circularOffset(target, current, length);
    const wrapped = new Set<string>();
    this.items().forEach((card, index) => {
      const delta = circularOffset(index, target, length) - circularOffset(index, current, length);
      if (delta !== -shift) {
        wrapped.add(card.id);
      }
    });
    this.state.set({ index: target, wrapped });
  }
}

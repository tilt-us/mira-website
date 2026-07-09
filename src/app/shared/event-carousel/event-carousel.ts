import { Component, computed, input, signal } from '@angular/core';

import { CarouselCard } from '../card-carousel/card-carousel';

// Minimum horizontal drag distance before a pointer gesture counts as a swipe.
const SWIPE_THRESHOLD_PX = 40;

@Component({
  selector: 'app-event-carousel',
  templateUrl: './event-carousel.html',
})
export class EventCarousel {
  readonly items = input.required<readonly CarouselCard[]>();
  readonly label = input('Events');

  private readonly requestedIndex = signal(0);

  // Clamped so the active card stays valid even when the items input shrinks.
  protected readonly activeIndex = computed(() => {
    const last = this.items().length - 1;
    return Math.max(0, Math.min(this.requestedIndex(), last));
  });

  protected readonly canGoBack = computed(() => this.activeIndex() > 0);
  protected readonly canGoForward = computed(() => this.activeIndex() < this.items().length - 1);

  private pointerStartX: number | null = null;
  private suppressCardClick = false;

  protected previous(): void {
    this.requestedIndex.set(this.activeIndex() - 1);
  }

  protected next(): void {
    this.requestedIndex.set(this.activeIndex() + 1);
  }

  protected onCardClick(index: number): void {
    // The click fired by a swipe release must not re-select the card under the pointer.
    if (this.suppressCardClick) {
      this.suppressCardClick = false;
      return;
    }
    this.requestedIndex.set(index);
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
}

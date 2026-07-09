import { Component, computed, input, output } from '@angular/core';

export interface CarouselCard {
  id: string;
  title: string;
  body: string;
}

@Component({
  selector: 'app-card-carousel',
  templateUrl: './card-carousel.html',
})
export class CardCarousel {
  readonly items = input.required<readonly CarouselCard[]>();
  readonly durationSeconds = input(30);
  readonly paused = input(false);

  // Reports hover so a parent can pause the marquee while it is being read.
  readonly hoveredChange = output<boolean>();

  // Items are duplicated so the marquee animation can loop seamlessly.
  protected readonly loop = computed(() => [...this.items(), ...this.items()]);
}

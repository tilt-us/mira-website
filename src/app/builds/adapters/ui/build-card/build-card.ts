import { Component, computed, input, output } from '@angular/core';

import { championById, itemById } from '../../../domain/catalog';
import { Build, Item } from '../../../domain/models';

/** Renders one build; the owner actions are only wired up in the item builder. */
@Component({
  selector: 'app-build-card',
  templateUrl: './build-card.html',
})
export class BuildCard {
  readonly build = input.required<Build>();
  readonly showOwnerActions = input(false);

  readonly edit = output<Build>();
  readonly remove = output<Build>();
  readonly publishToggled = output<Build>();

  protected readonly champion = computed(() => championById(this.build().championId));

  // Unknown ids are dropped so a stale stored build cannot break the card.
  protected readonly items = computed<Item[]>(() =>
    this.build()
      .itemIds.map((id) => itemById(id))
      .filter((item): item is Item => item !== undefined),
  );
}

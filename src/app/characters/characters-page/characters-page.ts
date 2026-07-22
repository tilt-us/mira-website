import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Reveal } from '../../shared/reveal';
import { CharactersService } from '../characters.service';
import { PLACEHOLDER_NOTICE } from '../characters.data';
import { Character, CharacterRole } from '../characters.types';

/** Sentinel for "no role filter"; doubles as the label of the first chip. */
const ALL_ROLES = 'All';

type RoleFilter = typeof ALL_ROLES | CharacterRole;

@Component({
  selector: 'app-characters-page',
  imports: [Reveal, RouterLink],
  templateUrl: './characters-page.html',
})
export class CharactersPage {
  private readonly charactersService = inject(CharactersService);

  protected readonly notice = PLACEHOLDER_NOTICE;
  protected readonly allRoles = ALL_ROLES;

  private readonly characters = toSignal(this.charactersService.getCharacters(), {
    initialValue: [] as Character[],
  });

  protected readonly activeRole = signal<RoleFilter>(ALL_ROLES);

  // Derived from the roster so a new role in the data shows up without a code change.
  protected readonly roles = computed<RoleFilter[]>(() => [
    ALL_ROLES,
    ...new Set(this.characters().map((character) => character.role)),
  ]);

  protected readonly visibleCharacters = computed(() => {
    const role = this.activeRole();
    return role === ALL_ROLES
      ? this.characters()
      : this.characters().filter((character) => character.role === role);
  });

  protected selectRole(role: RoleFilter): void {
    this.activeRole.set(role);
  }
}

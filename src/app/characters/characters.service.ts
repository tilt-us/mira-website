import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { CHARACTERS } from './characters.data';
import { Character } from './characters.types';

/**
 * Source of truth for the character roster.
 *
 * The backend has no character catalogue yet — it only exposes champion
 * selection inside a running match — so the data is bundled with the app. The
 * API is asynchronous on purpose: once an endpoint exists, only this service
 * changes, not the pages that consume it.
 */
@Injectable({ providedIn: 'root' })
export class CharactersService {
  getCharacters(): Observable<Character[]> {
    return of(CHARACTERS);
  }

  /** Emits `undefined` for an unknown id so pages can show a not-found state. */
  getCharacter(id: string): Observable<Character | undefined> {
    return this.getCharacters().pipe(
      map((characters) => characters.find((character) => character.id === id)),
    );
  }
}

/** Combat role a character fills in a team composition. */
export type CharacterRole = 'Duelist' | 'Controller' | 'Guardian' | 'Support';

/** Slot an ability is bound to in the client. */
export type AbilitySlot = 'Passive' | 'Q' | 'W' | 'E' | 'R';

export interface CharacterStat {
  label: string;
  /** Rating from 0 to STAT_MAX, rendered as a bar. */
  value: number;
}

export interface CharacterAbility {
  slot: AbilitySlot;
  name: string;
  description: string;
  cooldown: string;
}

export interface Character {
  id: string;
  name: string;
  epithet: string;
  role: CharacterRole;
  /** Rating from 1 (easy to pick up) to 3 (high mastery curve). */
  difficulty: number;
  tagline: string;
  image: string;
  /** Lore paragraphs shown on the story tab. */
  story: string[];
  stats: CharacterStat[];
  abilities: CharacterAbility[];
}

/** Upper bound for {@link CharacterStat.value}, shared by data and bar widths. */
export const STAT_MAX = 10;

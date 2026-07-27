/** Combat roles a build can be aimed at; mirrors the roles in champion select. */
export type BuildRole = 'Duelist' | 'Guardian' | 'Mage' | 'Controller' | 'Marksman';

export const BUILD_ROLES: readonly BuildRole[] = [
  'Duelist',
  'Guardian',
  'Mage',
  'Controller',
  'Marksman',
];

export interface Champion {
  readonly id: string;
  readonly name: string;
  readonly epithet: string;
  readonly role: BuildRole;
}

export interface Item {
  readonly id: string;
  readonly name: string;
  readonly category: 'Weapon' | 'Armour' | 'Arcane' | 'Boots';
  readonly description: string;
}

/** The four ability slots; a skill order is the sequence they are levelled in. */
export type SkillSlot = 'Q' | 'W' | 'E' | 'R';

export const SKILL_SLOTS: readonly SkillSlot[] = ['Q', 'W', 'E', 'R'];

export interface Build {
  readonly id: string;
  readonly title: string;
  readonly championId: string;
  readonly role: BuildRole;
  /** Item ids in the order they are meant to be bought. */
  readonly itemIds: readonly string[];
  /** Slots in levelling order, e.g. `Q W Q E R`. */
  readonly skillOrder: readonly SkillSlot[];
  readonly summary: string;
  readonly author: string;
  readonly tags: readonly string[];
  readonly votes: number;
  /** ISO date, used for the "recently updated" sort. */
  readonly updatedAt: string;
  /** Own builds start as drafts and are only listed publicly once published. */
  readonly published: boolean;
}

/** Everything the create form collects; the rest is filled in by the service. */
export type BuildDraft = Pick<
  Build,
  'title' | 'championId' | 'role' | 'itemIds' | 'skillOrder' | 'summary' | 'tags' | 'published'
>;

export type BuildSort = 'popular' | 'recent';

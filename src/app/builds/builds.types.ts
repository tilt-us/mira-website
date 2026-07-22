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
  id: string;
  name: string;
  epithet: string;
  role: BuildRole;
}

export interface Item {
  id: string;
  name: string;
  category: 'Weapon' | 'Armour' | 'Arcane' | 'Boots';
  description: string;
}

/** The four ability slots; a skill order is the sequence they are levelled in. */
export type SkillSlot = 'Q' | 'W' | 'E' | 'R';

export const SKILL_SLOTS: readonly SkillSlot[] = ['Q', 'W', 'E', 'R'];

export interface Build {
  id: string;
  title: string;
  championId: string;
  role: BuildRole;
  /** Item ids in the order they are meant to be bought. */
  itemIds: readonly string[];
  /** Slots in levelling order, e.g. `Q W Q E R`. */
  skillOrder: readonly SkillSlot[];
  summary: string;
  author: string;
  tags: readonly string[];
  votes: number;
  /** ISO date, used for the "recently updated" sort. */
  updatedAt: string;
  /** Own builds start as drafts and are only listed publicly once published. */
  published: boolean;
}

/** Everything the create form collects; the rest is filled in by the service. */
export type BuildDraft = Pick<
  Build,
  'title' | 'championId' | 'role' | 'itemIds' | 'skillOrder' | 'summary' | 'tags' | 'published'
>;

export type BuildSort = 'popular' | 'recent';

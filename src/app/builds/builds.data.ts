import { Build, Champion, Item } from './builds.types';

// Placeholder game data — the backend exposes no champion, item or build
// endpoints yet, so the page ships with a curated sample set (tracked in the
// wiki). Champions match the roster shown on the home page.
export const CHAMPIONS: readonly Champion[] = [
  { id: 'lira', name: 'Lira', epithet: 'The Timeweaver', role: 'Controller' },
  { id: 'ignara', name: 'Ignara', epithet: 'The Flameheart', role: 'Duelist' },
  { id: 'yuna', name: 'Yuna', epithet: 'The Stormcaller', role: 'Mage' },
  { id: 'sophia', name: 'Sophia', epithet: 'The Lightbringer', role: 'Guardian' },
];

export const ITEMS: readonly Item[] = [
  {
    id: 'hourglass-blade',
    name: 'Hourglass Blade',
    category: 'Weapon',
    description: 'Attacks briefly slow the target, stacking with time-based abilities.',
  },
  {
    id: 'emberfang',
    name: 'Emberfang',
    category: 'Weapon',
    description: 'Burns the target over time; the burn refreshes on every hit.',
  },
  {
    id: 'stormpiercer',
    name: 'Stormpiercer',
    category: 'Weapon',
    description: 'Ignores a share of magic resistance on ability damage.',
  },
  {
    id: 'aegis-of-dawn',
    name: 'Aegis of Dawn',
    category: 'Armour',
    description: 'Grants a shield to the lowest-health ally nearby.',
  },
  {
    id: 'bulwark-plating',
    name: 'Bulwark Plating',
    category: 'Armour',
    description: 'Reduces incoming burst damage while below half health.',
  },
  {
    id: 'chronomantle',
    name: 'Chronomantle',
    category: 'Arcane',
    description: 'Shortens ability cooldowns after every takedown.',
  },
  {
    id: 'tidecaller-orb',
    name: 'Tidecaller Orb',
    category: 'Arcane',
    description: 'Increases ability power the longer a fight lasts.',
  },
  {
    id: 'wardens-focus',
    name: "Warden's Focus",
    category: 'Arcane',
    description: 'Heals nearby allies whenever a shield expires.',
  },
  {
    id: 'swiftstep-greaves',
    name: 'Swiftstep Greaves',
    category: 'Boots',
    description: 'Movement speed that ramps up while out of combat.',
  },
  {
    id: 'ironhold-sabatons',
    name: 'Ironhold Sabatons',
    category: 'Boots',
    description: 'Reduces the duration of slows and roots.',
  },
];

/**
 * Sample community builds. These stand in for the published builds other
 * players will submit once the backend supports them.
 */
export const COMMUNITY_BUILDS: readonly Build[] = [
  {
    id: 'community-lira-tempo',
    title: 'Tempo Lira — rewind the teamfight',
    championId: 'lira',
    role: 'Controller',
    itemIds: ['chronomantle', 'swiftstep-greaves', 'wardens-focus', 'aegis-of-dawn'],
    skillOrder: ['Q', 'E', 'Q', 'W', 'R'],
    summary:
      'Stacks cooldown reduction early so the rewind is up for every skirmish. Play around vision and save the ultimate to undo an engage.',
    author: 'Nyx',
    tags: ['teamfight', 'support', 'meta'],
    votes: 412,
    updatedAt: '2026-07-14',
    published: true,
  },
  {
    id: 'community-ignara-dive',
    title: 'Dive Ignara — burn them down',
    championId: 'ignara',
    role: 'Duelist',
    itemIds: ['emberfang', 'swiftstep-greaves', 'hourglass-blade', 'bulwark-plating'],
    skillOrder: ['W', 'Q', 'W', 'E', 'R'],
    summary:
      'Maximises the burn refresh window. Commit only once Emberfang is finished, then stay on the backline as long as the burn keeps ticking.',
    author: 'Rue',
    tags: ['aggressive', 'solo-queue'],
    votes: 287,
    updatedAt: '2026-07-09',
    published: true,
  },
  {
    id: 'community-yuna-control',
    title: 'Zone Yuna — deny the grouping',
    championId: 'yuna',
    role: 'Mage',
    itemIds: ['tidecaller-orb', 'stormpiercer', 'ironhold-sabatons', 'chronomantle'],
    skillOrder: ['E', 'Q', 'E', 'W', 'R'],
    summary:
      'Built for long fights around objectives. Poke with the storm before the fight starts, then scale as Tidecaller Orb ramps.',
    author: 'Halden',
    tags: ['objective', 'scaling', 'meta'],
    votes: 356,
    updatedAt: '2026-07-17',
    published: true,
  },
  {
    id: 'community-sophia-anchor',
    title: 'Anchor Sophia — shield and counter',
    championId: 'sophia',
    role: 'Guardian',
    itemIds: ['aegis-of-dawn', 'ironhold-sabatons', 'wardens-focus', 'bulwark-plating'],
    skillOrder: ['W', 'E', 'W', 'Q', 'R'],
    summary:
      'Frontline setup that turns absorbed damage into pressure. Rotate shields between the carries instead of holding them for yourself.',
    author: 'Marek',
    tags: ['frontline', 'beginner-friendly'],
    votes: 198,
    updatedAt: '2026-07-02',
    published: true,
  },
  {
    id: 'community-ignara-bruiser',
    title: 'Bruiser Ignara — the long game',
    championId: 'ignara',
    role: 'Duelist',
    itemIds: ['emberfang', 'bulwark-plating', 'ironhold-sabatons', 'hourglass-blade'],
    skillOrder: ['Q', 'W', 'Q', 'E', 'R'],
    summary:
      'Trades the dive for survivability so the ramping damage actually pays off. Strong into teams without hard crowd control.',
    author: 'Nyx',
    tags: ['bruiser', 'scaling'],
    votes: 143,
    updatedAt: '2026-06-28',
    published: true,
  },
  {
    id: 'community-lira-poke',
    title: 'Poke Lira — attrition setup',
    championId: 'lira',
    role: 'Controller',
    itemIds: ['tidecaller-orb', 'swiftstep-greaves', 'chronomantle', 'stormpiercer'],
    skillOrder: ['Q', 'W', 'Q', 'E', 'R'],
    summary:
      'Wins the pre-fight by chipping away before anyone commits. Weak if the enemy can force a fight through the poke.',
    author: 'Vex',
    tags: ['poke', 'ranked'],
    votes: 89,
    updatedAt: '2026-07-11',
    published: true,
  },
];

export function championById(id: string): Champion | undefined {
  return CHAMPIONS.find((champion) => champion.id === id);
}

export function itemById(id: string): Item | undefined {
  return ITEMS.find((item) => item.id === id);
}

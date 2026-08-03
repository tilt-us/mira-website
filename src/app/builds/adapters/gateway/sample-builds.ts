import type { Build } from '../../domain/models';

/**
 * Sample community builds. These stand in for the published builds other
 * players will submit once the backend supports them (tracked in the wiki).
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

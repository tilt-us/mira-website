import { Champion, Item } from './models';

// Champion and item reference data. The backend exposes no catalog endpoints
// yet, so the roster is curated here (tracked in the wiki) and matches the
// champions shown on the home page.
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

export function championById(id: string): Champion | undefined {
  return CHAMPIONS.find((champion) => champion.id === id);
}

export function itemById(id: string): Item | undefined {
  return ITEMS.find((item) => item.id === id);
}

import { Character, CharacterAbility, CharacterStat } from './characters.types';

/**
 * Shown above the story and stats sections so visitors do not mistake the
 * bundled placeholder copy for final game data.
 */
export const PLACEHOLDER_NOTICE =
  'Lore, combat values and ability kits are placeholders and will change before release.';

// Every character shares one placeholder kit — the real abilities are not
// announced yet, and inventing per-character kits would read as final data.
function placeholderAbilities(): CharacterAbility[] {
  return [
    {
      slot: 'Passive',
      name: 'Not announced',
      description: 'The passive for this character has not been revealed yet.',
      cooldown: '—',
    },
    {
      slot: 'Q',
      name: 'Not announced',
      description: 'The first ability for this character has not been revealed yet.',
      cooldown: '—',
    },
    {
      slot: 'W',
      name: 'Not announced',
      description: 'The second ability for this character has not been revealed yet.',
      cooldown: '—',
    },
    {
      slot: 'E',
      name: 'Not announced',
      description: 'The third ability for this character has not been revealed yet.',
      cooldown: '—',
    },
    {
      slot: 'R',
      name: 'Not announced',
      description: 'The ultimate for this character has not been revealed yet.',
      cooldown: '—',
    },
  ];
}

// Placeholder ratings. The labels are the axes we want to show; the numbers are
// rough sketches from each character's existing showcase copy, not balance data.
function stats(damage: number, defence: number, mobility: number, utility: number): CharacterStat[] {
  return [
    { label: 'Damage', value: damage },
    { label: 'Defence', value: defence },
    { label: 'Mobility', value: mobility },
    { label: 'Utility', value: utility },
  ];
}

function placeholderStory(name: string, focus: string): string[] {
  return [
    `${name}'s full story has not been written yet.`,
    `This section will cover where ${name} comes from, ${focus}, and how that shaped the fighter players meet in Mira.`,
  ];
}

/**
 * Character roster. Names, epithets and taglines mirror the home page showcase
 * so both surfaces stay in sync; everything else is placeholder content until
 * the game data is final.
 */
export const CHARACTERS: Character[] = [
  {
    id: 'lira',
    name: 'Lira',
    epithet: 'The Timeweaver',
    role: 'Controller',
    difficulty: 3,
    tagline:
      'Bends the flow of battle to her will, rewinding mistakes and hastening allies before the enemy can react.',
    image: '/lira-wallpaper.png',
    story: placeholderStory('Lira', 'how she learned to bend time'),
    stats: stats(6, 4, 6, 9),
    abilities: placeholderAbilities(),
  },
  {
    id: 'ignara',
    name: 'Ignara',
    epithet: 'The Flameheart',
    role: 'Duelist',
    difficulty: 2,
    tagline:
      'A frontline duelist who trades safety for raw power, burning brighter the longer a fight goes on.',
    image: '/ignara-wallpaper.png',
    story: placeholderStory('Ignara', 'where her fire comes from'),
    stats: stats(9, 5, 7, 3),
    abilities: placeholderAbilities(),
  },
  {
    id: 'yuna',
    name: 'Yuna',
    epithet: 'The Stormcaller',
    role: 'Controller',
    difficulty: 2,
    tagline:
      'Commands wind and lightning from afar, controlling space and punishing anyone who groups up.',
    image: '/yuna-wallpaper.png',
    story: placeholderStory('Yuna', 'how she came to command the storm'),
    stats: stats(8, 3, 5, 7),
    abilities: placeholderAbilities(),
  },
  {
    id: 'sophia',
    name: 'Sophia',
    epithet: 'The Lightbringer',
    role: 'Guardian',
    difficulty: 1,
    tagline:
      'A guardian who shields the team and turns incoming damage into openings for a counterattack.',
    image: '/sophia-wallpaper.png',
    story: placeholderStory('Sophia', 'who she swore to protect'),
    stats: stats(4, 9, 4, 8),
    abilities: placeholderAbilities(),
  },
];

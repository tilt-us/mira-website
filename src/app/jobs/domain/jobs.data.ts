export interface JobPosting {
  id: string;
  category: string;
  title: string;
  summary: string;
  location: string;
  workload: string;
  requirements: string[];
  bonus: string[];
  benefits: string[];
}

export const APPLICATION_EMAIL = 'jobs@tilt-us.com';

// Applications arrive by mail — there is no backend endpoint for them,
// so the apply button opens a prefilled draft in the visitor's mail client.
export function applicationMailto(job: JobPosting): string {
  const subject = `Application: ${job.title}`;
  const body = [
    'Hi Mira team,',
    '',
    `I would like to apply for the ${job.title} position.`,
    '',
    'GitHub:',
    'Discord:',
    '',
    'A few words about me and my experience:',
    '',
  ].join('\r\n');
  return `mailto:${APPLICATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const JOB_POSTINGS: JobPosting[] = [
  {
    id: 'developer',
    category: 'Engineering',
    title: 'Developer',
    summary:
      'Build the technology behind Mira — from the game itself to the services and tools around it.',
    location: 'Remote',
    workload: 'Part-time',
    requirements: [
      'At least 1 year of programming experience',
      'Proficiency in Rust, Java or TypeScript',
      'Proficiency in German or English',
      'A GitHub and a Discord account',
    ],
    bonus: ['DevOps experience', 'Experience with the Bevy engine'],
    benefits: [
      'Max. 10 hours per week / 40 hours per month',
      'Approx. €400–€500 per month',
      'Team-based experience on a real game project',
    ],
  },
  {
    id: 'designer',
    category: 'Art & Design',
    title: 'Designer',
    summary:
      'Shape how Mira looks and feels — characters, interfaces and the visual identity of the game.',
    location: 'Remote',
    workload: 'Part-time',
    requirements: [
      'At least 2 years of design experience',
      'Proficiency in Blender, Figma or Photoshop',
      'Proficiency in German or English',
      'A GitHub and a Discord account',
    ],
    bonus: ['DevOps experience', 'Experience with the Bevy engine'],
    benefits: [
      'Max. 10 hours per week / 40 hours per month',
      'Approx. €400–€500 per month',
      'Team-based experience on a real game project',
    ],
  },
];

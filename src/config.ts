export const SITE = {
  name: 'RankOtalk',
  tagline: 'Free college counselling tools for JEE Main students',
  locale: 'en-IN',
  // Shown in titles; change once per counselling season.
  examYear: 2026,
  // Shown as the "last updated" date on the hub page.
  hubUpdated: '2026-10-31',
  // Confirm before launch (see docs/LAUNCH_CHECKLIST.md).
  email: 'contact@rankotalk.com',
  authorName: 'Abhay Vishwakarma',} as const;

export const OFFICIAL = {
  josaa: 'https://josaa.nic.in',
  jeeMain: 'https://jeemain.nta.nic.in',
  csab: 'https://csab.nic.in',
} as const;

export type NavLink = { href: string; label: string };
export type NavMenu = { label: string; groups: { label: string; links: NavLink[] }[] };

// Top-level items stay few; tools live in the dropdown, grouped by audience.
export const NAV: (NavLink | NavMenu)[] = [
  {
    label: 'Tools',
    groups: [
      {
        label: 'JEE Main',
        links: [
          { href: '/jee-main-college-predictor', label: 'College Predictor' },
          { href: '/jee-main-percentile-vs-rank', label: 'Percentile vs Rank Calculator' },
        ],
      },
      {
        label: 'Study abroad',
        links: [
          { href: '/college-admissions-calculator', label: 'College Admissions Calculator' },
          { href: '/mbbs-abroad-university-finder', label: 'MBBS Abroad University Finder' },
        ],
      },
    ],
  },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
];

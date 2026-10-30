export const SITE = {
  name: 'RankOtalk',
  tagline: 'Free college counselling tools for JEE Main students',
  locale: 'en-IN',
  // Shown in titles; change once per counselling season.
  examYear: 2026,
  // Shown as the "last updated" date on the hub page.
  hubUpdated: '2026-10-31',
  // Confirm before launch (see LAUNCH_CHECKLIST.md).
  email: 'contact@rankotalk.com',
  authorName: 'RankOtalk Editorial Team',
} as const;

export const OFFICIAL = {
  josaa: 'https://josaa.nic.in',
  jeeMain: 'https://jeemain.nta.nic.in',
  csab: 'https://csab.nic.in',
} as const;

export const NAV = [
  { href: '/jee-main-college-predictor', label: 'College Predictor' },
  { href: '/jee-main-percentile-vs-rank', label: 'Percentile vs Rank' },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
] as const;

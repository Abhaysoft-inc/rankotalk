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
  jeeAdv: 'https://jeeadv.ac.in',
  csab: 'https://csab.nic.in',
} as const;

export type NavLink = { href: string; label: string };
export type NavMenu = { label: string; groups: { label: string; links: NavLink[] }[] };

// Every MBBS abroad tool, in the order a student needs them. Feeds the nav, the /mbbs-abroad hub and the footer.
export const MBBS_TOOLS: (NavLink & { description: string })[] = [
  {
    href: '/mbbs-abroad/eligibility-checker',
    label: 'Eligibility Checker',
    description: 'Check if you can study MBBS abroad (age, Class 12, NEET) and if your degree will let you practise in India.',
  },
  {
    href: '/mbbs-abroad/university-finder',
    label: 'University Finder',
    description: 'Check the universities you are considering against NMC’s FMGL 2021 rules and your budget.',
  },
  {
    href: '/mbbs-abroad/cost-calculator',
    label: 'Total Cost Calculator',
    description: 'Work out the real cost of the whole course in rupees, including living, travel, fee rises and currency changes.',
  },
  {
    href: '/mbbs-abroad/loans-and-scholarships',
    label: 'Loans and Scholarships',
    description: 'Calculate the EMI and the true cost of an education loan, including interest during study, and see where scholarships exist.',
  },
  {
    href: '/mbbs-abroad/document-checker',
    label: 'Document and Visa Checklist',
    description: 'Tick off every document from passport to visa, plus the records NMC rules need when you return to India.',
  },
];

// Top-level items stay few; tools live in the dropdown, grouped by audience.
export const NAV: (NavLink | NavMenu)[] = [
  {
    label: 'Tools',
    groups: [
      {
        label: 'JEE & JoSAA',
        links: [
          { href: '/jee-main-college-predictor', label: 'JEE Main College Predictor' },
          { href: '/jee-advanced-college-predictor', label: 'JEE Advanced (IIT) Predictor' },
          { href: '/jee-main-percentile-vs-rank', label: 'Percentile vs Rank Calculator' },
        ],
      },
      {
        label: 'MBBS abroad',
        links: [
          { href: '/mbbs-abroad', label: 'All MBBS abroad tools' },
          ...MBBS_TOOLS.map(({ href, label }) => ({ href, label })),
        ],
      },
      {
        label: 'US colleges',
        links: [{ href: '/college-admissions-calculator', label: 'College Admissions Calculator' }],
      },
    ],
  },
  { href: '/guides', label: 'Guides' },
  { href: '/about', label: 'About' },
];

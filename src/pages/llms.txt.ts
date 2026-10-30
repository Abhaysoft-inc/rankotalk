import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../config';

// A plain-text map of the site for AI assistants and other agents (see llmstxt.org).
export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const guides = (await getCollection('guides')).sort((a, b) => a.data.order - b.data.order);

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.name} is an independent, free website for JEE Main students in India. It offers a college predictor for NITs, IIITs and GFTIs, a percentile to rank calculator, a college admissions calculator for US colleges, and plain-language guides to JoSAA counselling. No login is needed.`,
    '',
    'Notes for readers and tools:',
    '- Predictions are estimates based on past closing ranks. They are not official allotments.',
    '- The site is not affiliated with JoSAA, NTA or CSAB. Official dates, fees and rules are on josaa.nic.in, jeemain.nta.nic.in and csab.nic.in.',
    '- IITs are out of scope for the predictor, because they admit through JEE Advanced rank.',
    '',
    '## Tools',
    `- [JEE Main College Predictor](${abs('/jee-main-college-predictor')}): enter rank, category, gender and home state to see Safe, Moderate and Reach options at NITs, IIITs and GFTIs.`,
    `- [JEE Main Percentile vs Rank Calculator](${abs('/jee-main-percentile-vs-rank')}): convert an NTA percentile to an approximate rank, or a rank to a percentile, with the formula explained.`,
    `- [College Admissions Calculator](${abs('/college-admissions-calculator')}): for US college applicants. Compares SAT or ACT, GPA and each college's acceptance rate and middle 50% score range to sort colleges into Reach, Target and Likely, with the rules and the official 2018 ACT/SAT concordance table shown on the page.`,
    '',
    '## Guides',
    ...guides.map((g) => `- [${g.data.title}](${abs(`/guides/${g.id}`)}): ${g.data.description}`),
    '',
    '## About the site',
    `- [About](${abs('/about')}): who we are and what we believe.`,
    `- [Methodology](${abs('/methodology')}): how the predictor turns a rank into Safe, Moderate and Reach options, and its limits.`,
    `- [Contact](${abs('/contact')}): report a mistake or send a suggestion.`,
    `- [Privacy](${abs('/privacy')}): how we handle information.`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

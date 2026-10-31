# RankOtalk: project instructions

RankOtalk is a college counselling website built for an SEO growth competition. The goal is to rank on Google for target keywords with useful tools and real content. It is live at https://rankotalk.vercel.app (Vercel; a push to `main` deploys).

The full plan is in `docs/IMPLEMENTATION_PLAN.md` and the pre-launch gates are in `docs/LAUNCH_CHECKLIST.md`. `docs/competitors_who_are_ranking_currently_content.md` holds competitor research, for reference only. `docs/DATA_SOURCES.md` explains where and how to get the official data for every tool (JoSAA, NBEMS FMGE, College Scorecard, WDOMS and NMC, exchange rates), with checks and a refresh calendar. Follow it for any data work.

## Target keywords and their pages

| Keyword | Page |
| --- | --- |
| jee main college predictor (main target) | `/jee-main-college-predictor` |
| jee main percentile vs rank | `/jee-main-percentile-vs-rank` |
| college admissions calculator | `/college-admissions-calculator` |
| mbbs abroad (hub) | `/mbbs-abroad` |
| mbbs abroad university finder | `/mbbs-abroad/university-finder` (301 from `/mbbs-abroad-university-finder`) |
| mbbs abroad eligibility (NEET, NMC, FMG) | `/mbbs-abroad/eligibility-checker` |
| mbbs abroad total cost calculator | `/mbbs-abroad/cost-calculator` |
| mbbs abroad education loan, scholarships | `/mbbs-abroad/loans-and-scholarships` |
| mbbs abroad documents, visa checklist | `/mbbs-abroad/document-checker` |
| JoSAA counselling long-tail | `/guides/*` (`src/content/guides/*.md`) |

## Working preferences

- Plans, specs and notes go in local Markdown files in `docs/`, never in Claude Docs or published artifacts. `README.md` stays at the repo root.
- Do not run browser tests, Lighthouse, preview servers or screenshots unless asked. The user tests in production with PageSpeed Insights. Unit tests (`npm test`) and `npm run build` are fine for checking your own work.
- Act on clear requests. Ask only when a decision is genuinely the user's.
- Never commit or push unless asked.

## Content rules

- All content must be real, accurate and written to rank. No lorem ipsum, no "coming soon" sections, no filler.
- Facts come from official sources: JoSAA, NTA/JEE Main, CSAB, NMC, ACT/College Board, College Scorecard, Common Data Set. Each page links its sources, and the `AuthorBox` component lists them.
- Never invent numbers (cutoffs, fees, seat counts, statistics). A computed number shows its formula. An example is clearly labelled as an example.
- Never copy competitors' text or numbers.
- Never publish unverified claims about named institutions. Example: NMC publishes no list of approved foreign universities, so the MBBS finder checks the universities a user enters against the rules instead of claiming "NMC approved". Design tools so the user enters the data, or the data is sourced fact by fact.
- Write in plain language. Answer first under each heading, keep paragraphs short, and use tables for comparisons.
- The author is `SITE.authorName` in `src/config.ts` (Abhay Vishwakarma). It is a Person in the Article schema.

## JEE predictor data (important)

- The predictor results currently come from placeholder data (`src/data/mock-cutoffs.json`). The user decided the site should not show a "demo" label, and will connect a real backend with real results.
- The only place to swap the data is `loadCutoffs()` in `src/components/predictor/data.ts`. Rows must match `CutoffRow` in `types.ts`.
- Never quote placeholder numbers in any content page, and never claim a data source or year for the predictor results until real data is in.

## Design rules (strict)

- No gradients anywhere.
- Border radius is 4px at most (2px on tags and small items).
- No box shadows, except `0 1px 2px rgba(0,0,0,.06)` on dropdowns and popovers.
- One accent colour, `#1d4ed8`. All colours are tokens at the top of `src/styles/global.css`. Use the tokens, never new colours.
- Readability first: Inter (self-hosted), 18px body text with line height 1.7, articles at most 720px wide, 1px borders, an 8px spacing grid, inputs and buttons at least 44px tall.
- Links in text are always underlined, so they never rely on colour alone.
- Mobile first: no horizontal page scroll, and tables scroll inside `.table-wrap`.

## Tech conventions

- Astro 7 static output with Preact islands (`client:visible`), Tailwind 4 (used mainly for the reset and theme), Vercel with `vercel.json` (clean URLs and headers) and `@vercel/analytics`.
- `build.format: 'file'` makes `Astro.url.pathname` end in `.html` at build time. Always use `cleanPath()` from `src/lib/url.ts` for canonical URLs and active nav states. A canonical with `.html` once blocked indexing on Bing.
- Astro trims whitespace before `{expressions}` at a line break. Use `{' '}` where a space is needed.
- In `npm run dev`, a one-off warning that the "guides" collection "does not exist or is empty" can appear while files are being edited. The project sits in OneDrive, which can briefly lock files. If `npm run build` lists the guide pages, it is harmless. If it keeps appearing in dev, restart the dev server.
- Env: `SITE_URL` (the live domain) and `PUBLIC_GOOGLE_SITE_VERIFICATION` live in `.env` locally and must also be set in Vercel. `.env` is not committed.
- If a page URL ever changes, add a permanent redirect in `vercel.json` `redirects` so indexed URLs keep working.
- Tool logic lives as pure functions in `src/components/<tool>/*.ts` with Vitest tests next to them. The UI is a Preact island beside the logic.

## Checklist for every new page

1. Title of 60 characters or fewer (including ` | RankOtalk`), meta description of 160 or fewer, exactly one H1, and a keyword-matching URL with no year in it.
2. `Base` layout (SEO, canonical, OG tags), `Breadcrumbs`, JSON-LD from `src/lib/schema.ts` (WebApplication for tools, Article for guides, FAQPage when there is an FAQ), and FAQ answers as plain text, so the schema matches the visible text.
3. Page structure: H1 and lead, the tool, a table of contents, content sections, the FAQ, then `AuthorBox` with the page's sources.
4. Link the new page from:
   - a group in `NAV` in `src/config.ts` (the header shows Tools ▾, Guides and About; add tools only to the dropdown, never as new top-level items). MBBS abroad tools: add one entry to `MBBS_TOOLS` in `src/config.ts`; it feeds the nav, the /mbbs-abroad hub, the footer and llms.txt automatically. MBBS pages live under `src/pages/mbbs-abroad/` with breadcrumbs Home › MBBS Abroad › Tool.
   - `src/components/Footer.astro`
   - the home page cards in `src/pages/index.astro`
   - the About page list
   - `src/pages/llms.txt.ts`
5. Update `CONTENT_UPDATED` in `astro.config.mjs` (the sitemap `lastmod`) when content changes.
6. Run `npm test` and `npm run build`. Check that the canonical has no `.html` and the page is in `dist/sitemap-0.xml`.
7. Tell the user to request indexing for the new URL in Google Search Console and Bing Webmaster Tools.

## SEO files already in place

`robots.txt`, `sitemap-index.xml` (`@astrojs/sitemap`), `llms.txt`, `.well-known/security.txt`, the web manifest, icons, the OG image, the IndexNow key file and `npm run indexnow`, and the Google verification tag (from env). The sitemap is submitted to Google Search Console and Bing.

## Open items (from the launch checklist)

- Connect the real JEE predictor backend before promoting the site.
- Fact-check the guides and the hub page against the current JoSAA bulletin.
- Confirm the contact email (`contact@rankotalk.com` is a placeholder) and a custom domain.

## Commands

`npm run dev` · `npm run build` · `npm run preview` · `npm test` · `npm run indexnow`

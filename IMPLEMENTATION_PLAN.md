# JEE Main College Predictor – Implementation Plan

_As of 2026-10-30_

We build a static Astro site with a client-side predictor island and rank it for **"jee main college predictor"** by surrounding one strong tool page with data-rich supporting pages that all link back to it.

> **Scope for now:**
> 1. All site content is real: accurate, original and written to rank (sections 6 and 7). No placeholder copy anywhere.
> 2. The predictor's *results* use placeholder data during development only. The real predictor backend goes in before deployment. This is a launch gate in section 10, so nothing is deployed or promoted until it passes.
> 3. The UI is flat and readable: no gradients, small radius, almost no shadow, one accent colour (section 8).
>
> Swapping in real data later must not change any component or page.

---

## 1. Goal and success metrics

The goal is to make the top 10 on google.co.in for "jee main college predictor" during the competition window. One page owns the primary keyword. Every other page targets a long-tail variant and links back to it.

| Keyword group | Examples | Page that owns it |
| --- | --- | --- |
| Primary | jee main college predictor, jee main college predictor 2027 | `/jee-main-college-predictor` |
| Rank-based | colleges for 50000 rank in jee main, nit at 1 lakh rank | `/jee-main-rank/[rank]-colleges` |
| Percentile | jee main percentile vs rank, 90 percentile college | `/jee-main-percentile-vs-rank` |
| Institute cutoff | nit trichy cutoff, iiit allahabad josaa cutoff | `/josaa-cutoff/[institute]` |
| Branch cutoff | nit cse cutoff, ece cutoff nits | `/josaa-cutoff/branch/[branch]` |
| Counselling how-to | josaa counselling process, choice filling tips | `/guides/[slug]` |

KPIs, tracked weekly in Search Console:

- Average position and impressions for the primary keyword
- Indexed pages vs pages submitted in the sitemap
- Clicks and CTR across the whole site
- Core Web Vitals passing on mobile (LCP < 2.5 s, INP < 200 ms, CLS < 0.1)
- Predictor completions per visit (engagement signal)

---

## 2. Tech stack

Astro with static output, plus a Preact island for the predictor. Every page ships as complete HTML, and JS loads only where the tool is.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Astro 5, `output: 'static'` | Crawlable HTML, zero JS by default, very good Core Web Vitals |
| Interactive tool | Preact island (`client:visible`) | About 4 KB runtime; hydrates only when the tool scrolls into view |
| Content | Content Collections + MDX | Typed frontmatter (title, description, updated date, author) enforced at build time |
| Data | **Mock JSON now** → JoSAA/CSAB closing-rank JSON later | No backend; the predictor filters in the browser |
| Styling | Tailwind CSS 4 | Purged, tiny CSS; no layout shift |
| SEO | Custom `<SEO>` component, `@astrojs/sitemap`, JSON-LD helpers | Full control of title, meta, canonical, OG and schema per page |
| Images | `astro:assets` (AVIF/WebP, width/height set) | Fast LCP, zero CLS |
| Hosting | **Vercel**, custom `.in` or `.com` domain; `vercel.json` sets headers and clean URLs | Global CDN, free SSL, preview deploys per branch |
| Analytics | **Vercel Web Analytics** (`@vercel/analytics`), plus Search Console and Bing Webmaster Tools | Cookie-free visit counts; Search Console shows indexing and queries |
| Repo/CI | GitHub; Vercel builds on push to `main` | Every change deploys in about a minute |

---

## 3. Site architecture

The predictor page is the hub. Every spoke links up to it with varied anchor text, and the hub links down to the top spokes. URLs are lowercase and hyphenated, with no year in the slug (the year goes in the title), so they keep their rankings across seasons.

| URL | Type | Target keyword | Count |
| --- | --- | --- | --- |
| `/` | Home: tool entry + links to all tools | college counselling, jee counselling | 1 |
| `/jee-main-college-predictor` | **Hub**: tool + long-form guide | jee main college predictor | 1 |
| `/jee-main-percentile-vs-rank` | Calculator + table | jee main percentile vs rank | 1 |
| `/jee-main-rank/[rank]-colleges` | Programmatic: pre-rendered results for one rank | colleges for [rank] rank in jee main | ~40 (later) |
| `/josaa-cutoff/[institute]` | Programmatic: cutoffs per branch, category, round | [institute] cutoff | ~120 (later) |
| `/josaa-cutoff/branch/[branch]` | Programmatic: one branch across institutes | nit cse cutoff | ~15 (later) |
| `/guides/[slug]` | Editorial MDX | josaa counselling process, choice filling, documents required, CSAB | 10–15 |
| `/about`, `/methodology`, `/contact`, `/privacy` | Trust pages | brand queries, E-E-A-T | 4 |

Programmatic pages wait for real data. Publishing them on mock data would mean indexing thin or false pages. Until then, only the hub, the percentile page, the guides and the trust pages go live.

Rules for programmatic pages (once the real data is in):

- At least one unique data table plus 150–300 words of specific commentary (trend vs last year, easiest branch to get, home-state advantage)
- Breadcrumbs: Home > JoSAA Cutoff > NIT Trichy
- A "Related" block linking 4–6 sibling pages, plus a CTA into the predictor with the rank prefilled
- `noindex` any page without enough data until it is filled in

---

## 4. Project structure

```text
/
├─ astro.config.mjs            # site URL, sitemap, trailingSlash: 'never'
├─ public/
│  ├─ robots.txt
│  └─ og/                      # social preview images
└─ src/
   ├─ components/
   │  ├─ SEO.astro             # title, meta, canonical, OG, JSON-LD
   │  ├─ Breadcrumbs.astro
   │  ├─ FAQ.astro
   │  └─ predictor/
   │     ├─ Predictor.tsx      # Preact island: form + results
   │     ├─ predict.ts         # pure logic (dummy now, real later)
   │     └─ types.ts           # CutoffRow, PredictInput, PredictResult
   ├─ data/
   │  └─ mock-cutoffs.json     # ~30 hand-written rows (dummy)
   ├─ content/guides/*.mdx
   ├─ layouts/Base.astro
   └─ pages/
      ├─ index.astro
      ├─ jee-main-college-predictor.astro
      ├─ jee-main-percentile-vs-rank.astro
      ├─ guides/[...slug].astro
      ├─ about.astro · methodology.astro · contact.astro · privacy.astro
      └─ (later) jee-main-rank/, josaa-cutoff/
```

---

## 5. Predictor tool (dummy for now)

The dummy has to look and behave like the real predictor, so the page can be built, styled, tested for speed and indexed now. The only things that get replaced later are the data file and the body of `predict()`.

### 5.1 Shared types (`types.ts`, final from day 1)

```ts
export type Category = 'OPEN' | 'EWS' | 'OBC-NCL' | 'SC' | 'ST';
export type Gender = 'neutral' | 'female';
export type Chance = 'safe' | 'moderate' | 'reach';

export interface CutoffRow {
  institute: string;      // "NIT Trichy"
  slug: string;           // "nit-trichy"
  type: 'NIT' | 'IIIT' | 'GFTI';
  state: string;          // "Tamil Nadu"
  program: string;        // "Computer Science and Engineering"
  category: Category;
  closingRank: number;
}

export interface PredictInput {
  rank: number;
  category: Category;
  gender: Gender;
  homeState?: string;
}

export interface PredictResult extends CutoffRow {
  chance: Chance;
}
```

### 5.2 Mock data (`mock-cutoffs.json`)

- About 30 rows: 6–8 well-known institutes (a few NITs, IIITs, one GFTI) × 3–4 branches × OPEN/OBC-NCL
- Closing ranks are **made-up placeholders** in a plausible order (CSE < ECE < Mechanical < Civil). They are not real cutoffs.

### 5.3 Dummy logic (`predict.ts`)

```ts
export function predict(input: PredictInput, rows: CutoffRow[]): PredictResult[] {
  return rows
    .filter(r => r.category === input.category)
    .map(r => {
      const ratio = input.rank / r.closingRank;
      const chance: Chance | null =
        ratio <= 0.85 ? 'safe' : ratio <= 1.0 ? 'moderate' : ratio <= 1.15 ? 'reach' : null;
      return chance ? { ...r, chance } : null;
    })
    .filter((r): r is PredictResult => r !== null)
    .sort((a, b) => a.closingRank - b.closingRank);
}
```

### 5.4 UX (built fully now)

- Form above the fold on mobile: rank (or percentile), category, gender, home state; 4 fields max
- Results in tabs (Safe / Moderate / Reach) with a branch filter
- Rows show institute, branch and the closing rank used
- Shareable URL with the inputs in query params (`?rank=45000&cat=OBC-NCL`); the page's canonical always points to the clean URL
- No "demo" label on the page (decision: placeholder results are not disclosed on the site)
- Standard disclaimer under the results, as any predictor has: an estimate based on past cutoffs, not an official allotment; always confirm on the official JoSAA portal
- Placeholder data stays inside the bundle only. No page copy, schema or meta text may name a specific data source or year (e.g. no "based on JoSAA 2026 data") until real data is in
- Content pages never quote the placeholder numbers. Any cutoff mentioned in prose must come from an official source

### 5.5 Upgrade path to real data (later)

1. Add `data/raw/` with JoSAA final-round opening and closing ranks (CSV) and `scripts/build-data.ts` to convert them to JSON in the same `CutoffRow` shape, plus `quota`, `year` and `round`.
2. Extend `predict()`: CRL vs category rank, HS/OS quota by home state, female-only pool, year-on-year trend.
3. Replace the bundled mock JSON with the real source: either a JSON file fetched on submit (`fetch('/data/cutoffs.json')`), or your backend API (`POST /api/predict` returning `PredictResult[]`). Only the data-loading step and `predict()` change; the form, tabs and result components stay as they are. If it is an API, enable CORS for the site domain, add rate limiting, and keep the response under about 300 ms so INP stays good.
4. Publish the programmatic pages, and update /methodology to name the real data source and year.

---

## 6. Content outline for the hub page (`/jee-main-college-predictor`)

| Order | Section | Notes |
| --- | --- | --- |
| 1 | H1: "JEE Main College Predictor 2027" + 1-line promise | Keyword in H1, title and first 100 words |
| 2 | The tool | Above the fold on mobile |
| 3 | How the predictor works | Data used, Safe/Moderate/Reach explained, links to /methodology |
| 4 | JEE Main percentile vs rank (summary table) | Links to the full calculator page |
| 5 | Colleges by rank range (1k, 5k, 10k, 25k, 50k, 1L) | Short lists; later link to the rank pages |
| 6 | Home state vs other state quota | Common confusion; strong long-tail value |
| 7 | Category-wise tips (EWS, OBC-NCL, SC, ST, PwD, female pool) | |
| 8 | JoSAA counselling steps + key dates | Link to guides |
| 9 | Choice-filling strategy | Link to guide |
| 10 | FAQs (8–12) | Real questions from "People also ask" |
| 11 | Author / reviewer box + "last updated" date | E-E-A-T |

Target length: 1,800–2,500 words, written by a person, with original examples. All copy is final and publishable (no lorem ipsum, no "coming soon" sections). The writing rules are in section 7.

---

## 7. Content standards and inventory

Every page ships with final, accurate copy. Rankings for this keyword depend on the content being better than what Shiksha, Careers360 and CollegeDunia show, not just on the tool.

### 7.1 Writing rules

- **Answer first.** Put the direct answer in the first 2–3 sentences under each heading, then explain.
- **Facts are verified.** Dates, fees, eligibility, quotas and process steps come from official sources (the JoSAA portal and information bulletin, NTA/JEE Main, CSAB). Each article ends with a Sources list and a "Last reviewed" date.
- **No invented numbers.** Do not publish cutoffs, seat counts or statistics that aren't from a cited source. Where a number is computed (e.g. rank from percentile), show the formula.
- **Original, not rewritten.** Add worked examples, comparisons and decision rules a student can act on. Run a plagiarism check before publishing.
- **Human review.** A named author and reviewer with a short bio on every guide (E-E-A-T). No unedited AI output.
- **Headings read like questions** students type ("Which NIT can I get with 50,000 rank?"). Take them from People Also Ask and autocomplete.
- **Natural keyword use.** Primary keyword in title, H1, first 100 words, one H2 and the meta description. Never stuffed.
- **Scannable.** Paragraphs of 4 sentences or fewer, bullets for parallel items, tables for comparisons, a table of contents on anything over 1,000 words.
- **Links.** 3–5 internal links per page with descriptive anchors, and outbound links to the official source for each key fact.
- **Update rhythm.** Re-check dates and rules at each counselling season. Show the real "last updated" date, and only change it when the content changed.

### 7.2 Inventory

| Page | Words | What it must teach |
| --- | --- | --- |
| `/jee-main-college-predictor` (hub) | 1,800–2,500 | Section 6 outline. How to read a predictor result, how seat types and quotas change the outcome |
| `/jee-main-percentile-vs-rank` | 1,000–1,500 | How NTA percentile is defined; the formula (rank ≈ (100 − percentile) / 100 × candidates appeared); an input for the candidate count; worked examples |
| Guide: JoSAA counselling process | 1,500 | Registration, choice filling, mock allotment, rounds, freeze/float/slide, reporting, withdrawal |
| Guide: JoSAA choice filling strategy | 1,500 | How to order choices, branch vs college, how many choices to fill, common mistakes |
| Guide: Documents required for reporting | 1,000 | Checklist by category, certificate validity, where students get stuck |
| Guide: CSAB special rounds | 1,000 | Who is eligible, how it differs from JoSAA, timeline |
| Guide: Home state vs other state quota | 1,000 | How HS/OS works at NITs, what it means for IIITs and GFTIs |
| Guide: NIT vs IIIT vs GFTI | 1,200 | Funding, fee, placement context, how they differ, who each suits |
| Guide: JEE Main vs JEE Advanced and IITs | 1,000 | Which exam leads to which institutes; why this predictor excludes IITs |
| Guide: OBC-NCL / EWS certificates | 800 | Validity, formats, common rejection reasons |
| Guide: Female-only seats and the gender pool | 800 | How the supernumerary and gender-neutral pools work |
| Guide: Branch vs college | 1,500 | A decision framework with examples |
| `/about`, `/methodology`, `/contact`, `/privacy` | 300–600 each | Who runs the site, how the predictor works in general terms (no data source or year named until real data), how to reach you |

Order of writing: hub, percentile page, JoSAA process, choice filling, documents, CSAB, home-state quota, then the rest.

---

## 8. Design system

The look is plain, flat and readable: a reader should never notice the design. It is built with Tailwind, with the tokens below defined once as CSS variables.

### 8.1 Rules

- **No gradients** anywhere: backgrounds, buttons, hero, images, borders or text.
- **Small radius:** 4 px maximum on buttons, inputs, cards and tags. Tables and images use 0–2 px. No pill shapes and no circles except avatars.
- **Almost no shadow:** none by default. At most `0 1px 2px rgba(0,0,0,0.06)` on a dropdown or popover. Separate areas with a 1 px border or whitespace instead.
- **One colour scheme:** white and light-grey surfaces, near-black text, one accent blue. Safe, Moderate and Reach use muted green, amber and red, only on the result tags.
- **No decorative clutter:** no popups, interstitials, auto-playing media, carousels, or sticky bars that cover content. Respect `prefers-reduced-motion`.

### 8.2 Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#ffffff` | Page background |
| `--surface` | `#f6f7f9` | Cards, table header, tool panel |
| `--border` | `#dfe3e8` | 1 px borders and dividers |
| `--text` | `#1b1f24` | Body text |
| `--muted` | `#566069` | Secondary text, captions |
| `--accent` | `#1d4ed8` | Links, primary button, focus ring |
| `--accent-hover` | `#1e40af` | Hover and pressed |
| `--safe` / `--safe-bg` | `#1a7f37` / `#e8f5ec` | Safe tag |
| `--moderate` / `--moderate-bg` | `#8a5a00` / `#fdf3dc` | Moderate tag |
| `--reach` / `--reach-bg` | `#b42318` / `#fdecea` | Reach tag |
| `--radius` | `4px` | The only radius used |

Check every text/background pair for a contrast ratio of at least 4.5:1 (WCAG AA) before launch. No dark mode in the first version.

### 8.3 Typography and layout

- **Font:** one family (Inter, self-hosted and subsetted, `font-display: swap`) with a system-font fallback. No second font.
- **Body text:** 18 px on desktop and 17 px on mobile, line height 1.7, colour `--text`, left-aligned (never justified).
- **Headings:** H1 34–36 px, H2 26 px, H3 20 px, weight 600, line height 1.25, with clear space above each H2 (at least 40 px).
- **Line length:** articles are one column, max 720 px (about 70 characters). The tool panel can widen to 960 px.
- **Spacing:** an 8 px grid. Paragraph gap 16 px, section gap 48 px.
- **Tables:** 1 px borders, `--surface` header row, horizontal scroll on mobile with the first column fixed, numbers right-aligned.
- **Long pages:** table of contents at the top (jump links), breadcrumbs above the H1, FAQ at the bottom as plain expandable `<details>` elements.
- **Forms and buttons:** inputs at least 44 px tall, visible labels (not placeholder-only), a clearly visible focus ring, one primary button style.
- **Mobile first:** design at 360 px width. The tool sits above the fold, and no horizontal page scroll at any width.

### 8.4 Components to build

`Header` (logo + 4 links), `Footer`, `Breadcrumbs`, `TableOfContents`, `Callout` (a 1 px border with a left rule, no fill gradient), `DataTable`, `Tag` (Safe / Moderate / Reach), `Button`, `Field` (label + input + error), `FAQ`, `AuthorBox`.

---

## 9. Technical SEO checklist

- [ ] Unique `<title>` (≤ 60 chars) and meta description (≤ 155 chars) on every page
- [ ] Self-referencing canonical on every page; query-param URLs canonical to the clean URL
- [ ] One H1 per page; logical H2/H3 order
- [ ] `sitemap-index.xml` via `@astrojs/sitemap`; referenced in `robots.txt`
- [ ] `robots.txt` allows everything except preview/staging hosts
- [ ] JSON-LD: `WebApplication` (predictor), `BreadcrumbList`, `Article` (guides), `Organization` (home), `FAQPage` (helps AI answers; Google shows FAQ rich results only for a few authoritative sites)
- [ ] Open Graph + Twitter card tags with a 1200×630 image per key page
- [ ] `lang="en-IN"`, viewport meta, HTTPS, www → non-www redirect (or the reverse), no trailing-slash duplicates
- [ ] Custom 404 page with links to the tool
- [ ] Lighthouse mobile ≥ 95 on the hub page; images sized, fonts self-hosted with `font-display: swap`
- [ ] Internal links: every page ≤ 3 clicks from home; descriptive anchors
- [ ] Search Console + Bing Webmaster verified; sitemap submitted; URL inspection requested for the hub page
- [ ] IndexNow ping on deploy (Bing/Yandex)

---

## 10. Roadmap

### Phase 1 – Foundation
- [ ] Pick the site name, buy the domain, set up Vercel + GitHub
- [ ] Scaffold Astro + Tailwind + Preact + MDX + sitemap
- [ ] Design tokens and base styles (section 8)
- [ ] `Base` layout, `SEO`, `Breadcrumbs`, `FAQ` components
- [ ] robots.txt, 404, trust pages (about, methodology, contact, privacy)

### Phase 2 – Dummy predictor + hub page
- [ ] `types.ts`, `mock-cutoffs.json`, `predict.ts` (+ unit tests)
- [ ] `Predictor.tsx` island: form, tabs, filters, shareable URL, estimate disclaimer
- [ ] Hub page: final copy (sections 6 and 7) + JSON-LD
- [ ] **Launch gate:** real predictor backend and results connected, and a sample of results (at least 10 ranks across categories) checked against the official JoSAA closing ranks. Do not deploy before this passes
- [ ] Deploy, verify Search Console, submit sitemap, request indexing

### Phase 3 – Supporting content
- [ ] `/jee-main-percentile-vs-rank` calculator + table
- [ ] Guides from the inventory in section 7, highest search demand first (JoSAA process, choice filling, documents, CSAB, home-state quota)
- [ ] Home page linking to everything

### Phase 4 – Real data + programmatic pages
- [ ] JoSAA data pipeline (section 5.5), real `predict()` logic
- [ ] Institute, branch and rank pages with the quality rules from section 3
- [ ] Update /methodology with the real source and year; delete the placeholder data

### Phase 5 – Grow
- [ ] Promotion (section 11)
- [ ] Weekly Search Console review: rewrite titles of pages with high impressions and low CTR
- [ ] More tools: MHT-CET, WBJEE, COMEDK predictors

---

## 11. Promotion and links

- Answer real questions on Quora and Reddit (r/JEENEETards, r/Indian_Academia) with a genuine answer and the tool as a resource. No spam.
- Short YouTube or Instagram video: "Which NIT can you get at 50k rank?" with a link to the tool
- Telegram/WhatsApp JEE groups: share the tool during counselling season
- Outreach to coaching blogs and student bloggers for a mention
- Free embeddable "percentile to rank" widget that links back to the site
- Brand mentions help both Google and AI answers (ChatGPT, Perplexity, AI Overviews)

---

## 12. Risks and open questions

- **Placeholder results reaching production:** students use these results for choice filling, so wrong ranks can mislead them and damage trust. Mitigation: the launch gate in Phase 2. The real backend is connected and checked before the first deploy, and nothing is promoted until then. Until that point the site runs only locally or on a private preview.
- **Backend as a dependency (if you use an API):** it is a new point of failure and a speed risk. Keep the hub page fully readable without it, handle errors in the UI, and cache responses.
- **New domain:** Google gives new domains little trust at first. Index early, publish steadily, get a few real links.
- **Strong competitors:** Shiksha, Careers360, CollegeDunia and others already rank. Compete on speed, accuracy, UX and depth of a single page rather than breadth.
- **Open:** competition end date and how it's judged (rank position? traffic?)
- **Open:** final site name and domain
- **Open:** who writes and reviews content (named author for E-E-A-T)

---

## 13. Second keyword: "college admissions calculator"

Keyword difficulty is about 0 (Ahrefs). The #1 result (CounselMore) is a thin page of about 40 words of body copy. PrepScholar ranks with a long article, but its calculator lives on separate school pages.

Our page is `/college-admissions-calculator`: a working calculator plus the full explanation on one URL.

- **No college database.** Students enter each college's acceptance rate and 25th/75th percentile SAT or ACT scores from College Scorecard or the Common Data Set, so nothing on our side can be wrong or out of date.
- **Transparent rules.** Selectivity band × score position, then GPA and application-strength adjustments. The full rule table is on the page, and the logic is tested in `src/components/admissions/calc.test.ts`.
- **List balance advice.** Count of Reach, Target and Likely, and what to add.
- **Official 2018 ACT/SAT concordance table** (Table A2, checked against ACT's PDF). This also targets "ACT to SAT conversion".
- **A section for international and Indian applicants** that links to the JEE predictor.

Possible upgrade: a college search that fills in the numbers automatically from the College Scorecard API (free API key from api.data.gov).

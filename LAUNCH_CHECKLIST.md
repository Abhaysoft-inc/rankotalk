# Launch checklist

Nothing should go live until every item in **Gate** is done.

## Gate: before the first deploy

- [ ] **Real predictor data.** Replace the body of `loadCutoffs()` in `src/components/predictor/data.ts` with your backend call, returning rows in the `CutoffRow` shape (`src/components/predictor/types.ts`). If your rules differ from the simple ones in `predict.ts`, change `predict()` too. Delete `src/data/mock-cutoffs.json` afterwards.
- [ ] **Check the results.** Compare at least 10 sample ranks across categories against the official JoSAA closing ranks.
- [ ] **Update `/methodology`** so it matches the real data source and year.
- [ ] **Fact-check every page** against the current JoSAA information bulletin and the NTA JEE Main bulletin: the four guides, the hub page, the percentile page, the FAQ answers and the rank-band table. The copy describes the general pattern of recent years. Confirm the quota split, certificate rules, number of rounds and the Freeze/Float/Slide rules.
- [ ] **Authors.** The site says "Written by the RankOtalk editorial team". Add real names and short bios (a named author and reviewer helps E-E-A-T), and update `src/components/AuthorBox.astro`.
- [ ] **Contact email.** `src/config.ts` has `contact@rankotalk.com`. Make sure this mailbox exists, or change it.
- [ ] **Domain.** Buy it, then set `SITE_URL` in Vercel (Project, Settings, Environment Variables). The fallback in `astro.config.mjs` is `https://rankotalk.com`.

## Vercel

- [ ] Import the GitHub repo. Framework preset: Astro. Build command `npm run build`, output `dist`.
- [ ] Add `SITE_URL` (and the optional `PUBLIC_GOOGLE_SITE_VERIFICATION` / `PUBLIC_BING_SITE_VERIFICATION`, see `.env.example`).
- [ ] **Turn on Web Analytics:** Project, Analytics tab, Enable. The `<Analytics />` component is already in `src/layouts/Base.astro`; data only appears on Vercel deployments after you enable it.
- [ ] Add the domain, and redirect `www` to the bare domain (or the reverse) in Domains settings.

## After the first deploy

- [ ] Google Search Console: add the property, verify it, submit `https://<domain>/sitemap-index.xml`, and use URL Inspection to request indexing for `/jee-main-college-predictor`.
- [ ] Bing Webmaster Tools: import the site from Search Console.
- [ ] Run `SITE_URL=https://<domain> npm run indexnow` (the key file is in `public/`).
- [ ] Run Lighthouse on the hub page on mobile. Target 95 or more.
- [ ] Open `/robots.txt`, `/sitemap-index.xml`, `/llms.txt` and `/.well-known/security.txt` on the live domain.
- [ ] Check the social preview of the hub page (paste the link into WhatsApp or a Facebook/LinkedIn debugger).

## Keep up to date

- [ ] When content changes, update `CONTENT_UPDATED` in `astro.config.mjs` (sitemap `lastmod`) and the `updated` date in each guide's frontmatter. Only change a date when the content changed.
- [ ] Each counselling season: update `examYear` and `hubUpdated` in `src/config.ts`, and re-check every date and rule.
- [ ] `security.txt` expires on 2027-10-30. Update `src/pages/.well-known/security.txt.ts` before then.

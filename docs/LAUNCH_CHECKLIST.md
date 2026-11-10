# Launch checklist

Nothing should go live until every item in **Gate** is done.

## Gate: before the first deploy

- [ ] **Real predictor data.** Replace the body of `loadCutoffs()` in `src/components/predictor/data.ts` with your backend call, returning rows in the `CutoffRow` shape (`src/components/predictor/types.ts`). If your rules differ from the simple ones in `predict.ts`, change `predict()` too. Delete `src/data/mock-cutoffs.json` afterwards.
- [ ] **Check the results.** Compare at least 10 sample ranks across categories against the official JoSAA closing ranks.
- [ ] **Update `/methodology`** so it matches the real data source and year.
- [ ] **Fact-check every page** against the current JoSAA information bulletin and the NTA JEE Main bulletin: the four guides, the hub page, the percentile page, the FAQ answers and the rank-band table. The copy describes the general pattern of recent years. Confirm the quota split, certificate rules, number of rounds and the Freeze/Float/Slide rules.
- [ ] **Authors.** The site says "Written by the RankOtalk editorial team". Add real names and short bios (a named author and reviewer helps E-E-A-T), and update `src/components/AuthorBox.astro`.
- [ ] **Contact email.** `src/config.ts` has `contact@rankotalk.in`. Make sure this mailbox exists. Free options: forwarding at the registrar, Cloudflare Email Routing, or Zoho Mail's free plan.
- [ ] **Domain.** `rankotalk.in` is bought. Follow "Domain move" below. The fallback in `astro.config.mjs` is `https://rankotalk.in`.

## Domain move: rankotalk.vercel.app to rankotalk.in

Do these in order. All of them are free.

1. **Vercel → Project → Settings → Domains → Add `rankotalk.in`.** Also add `www.rankotalk.in` and set it to redirect to the bare domain.
2. **DNS at your registrar:** add exactly the records Vercel shows for the domain. Wait until Vercel shows "Valid Configuration" (minutes to hours).
3. **Vercel → Settings → Environment Variables:** set `SITE_URL=https://rankotalk.in`. Also update `PUBLIC_GOOGLE_SITE_VERIFICATION` if you verify the new property with a meta tag (see step 6). Redeploy.
4. **Redirect the old address.** In Domains, edit `rankotalk.vercel.app` and choose "Redirect to Another Domain" → `rankotalk.in`, permanent. Keep it on for as long as you can; Google suggests at least 180 days.
5. **Check the live site:** every old URL should land on the same path at `rankotalk.in`; "view source" on 3 pages should show `<link rel="canonical">` with `rankotalk.in`; open `/sitemap-index.xml`, `/robots.txt` and `/llms.txt` on the new domain.
6. **Google Search Console:** add a new property for `rankotalk.in`. A Domain property verified with a DNS TXT record needs no code change. Submit `https://rankotalk.in/sitemap-index.xml`, then use URL Inspection → Request indexing on the home page and the main tool pages. Keep the old property to watch the redirects. The Change of Address tool is meant for moves between domains you own, so it is not needed here; the redirects do the job.
7. **Bing Webmaster Tools:** add `rankotalk.in` (import from Search Console) and submit the sitemap.
8. **IndexNow:** after the deploy, run `SITE_URL=https://rankotalk.in npm run indexnow`.
9. **Update every link you control:** social profiles, Quora and Reddit answers, and anything you have shared.
10. **Expect a few weeks of movement.** Rankings can dip briefly while Google moves the pages. The favicon and the site name are re-evaluated for the new domain, so "Vercel" should stop appearing in the site name once Google processes the home page.

## Vercel

- [ ] Import the GitHub repo. Framework preset: Astro. Build command `npm run build`, output `dist`.
- [ ] Add `SITE_URL` and `PUBLIC_GOOGLE_SITE_VERIFICATION` (and the optional `PUBLIC_BING_SITE_VERIFICATION`), see `.env.example`. `.env` is not committed, so these must be set in Vercel too. Redeploy after adding them, because they are read at build time.
- [ ] **Turn on Web Analytics:** Project, Analytics tab, Enable. The `<Analytics />` component is already in `src/layouts/Base.astro`; data only appears on Vercel deployments after you enable it.
- [ ] Add the domain, and redirect `www` to the bare domain (or the reverse) in Domains settings.

## After the first deploy

- [ ] Google Search Console: add the property, click Verify (the tag only works once the site is live on that domain), submit `https://<domain>/sitemap-index.xml`, and use URL Inspection to request indexing for `/jee-main-college-predictor`.
- [ ] Bing Webmaster Tools: import the site from Search Console.
- [ ] Run `SITE_URL=https://<domain> npm run indexnow` (the key file is in `public/`).
- [ ] Run Lighthouse on the hub page on mobile. Target 95 or more.
- [ ] After each new page goes live, request indexing for it in Search Console and Bing (latest: `/college-admissions-calculator`, and the MBBS abroad pages: `/mbbs-abroad`, `/mbbs-abroad/university-finder`, `/mbbs-abroad/eligibility-checker`, `/mbbs-abroad/cost-calculator`, `/mbbs-abroad/loans-and-scholarships`, `/mbbs-abroad/document-checker`).
- [ ] View source on 3 live pages and confirm `<link rel="canonical">` is the clean URL (no `.html`, same domain you are indexing).
- [ ] Open `/robots.txt`, `/sitemap-index.xml`, `/llms.txt` and `/.well-known/security.txt` on the live domain.
- [ ] Check the social preview of the hub page (paste the link into WhatsApp or a Facebook/LinkedIn debugger).

## Keep up to date

- [ ] When content changes, update `CONTENT_UPDATED` in `astro.config.mjs` (sitemap `lastmod`) and the `updated` date in each guide's frontmatter. Only change a date when the content changed.
- [ ] Each counselling season: update `examYear` and `hubUpdated` in `src/config.ts`, and re-check every date and rule.
- [ ] `security.txt` expires on 2027-10-30. Update `src/pages/.well-known/security.txt.ts` before then.

# Data sources: how to get real data for every tool

Real data turns RankOtalk's tools from "enter your own numbers" calculators into tools that answer the student's question directly. This guide lists, for each tool, where the official data lives, how to collect it, how to check it, and how often to refresh it.

**Ground rules (from `.claude/CLAUDE.md`):**

- Use official sources only.
- Never copy data from competitors such as Shiksha, Careers360, Collegedunia or agent sites, even when they republish official data. Go to the original.
- Keep a source URL and a fetch date on every row.

---

## 1. Priorities

| # | Dataset | Unlocks | Official source | Effort |
| --- | --- | --- | --- | --- |
| 1 | JoSAA opening and closing ranks | Real predictor results, rank and institute cutoff pages (the main keyword) | JoSAA OR-CR archive | Medium: a form-based scraper |
| 2 | NBEMS FMGE institute-wise results | FMGE explorer, country comparison, a "screening test record" column in the university finder | NBEMS statistics page (PDFs) | Medium: PDF table extraction |
| 3 | US college admissions data | College search with auto-filled numbers in the admissions calculator | College Scorecard API | Low: a JSON API |
| 4 | MBBS universities abroad | University search in the finder, country comparison | WDOMS, NMC notices, each university's own site | High: manual research |
| 5 | Exchange rates | Pre-filled rates in the cost calculator | RBI reference rates, or an exchange-rate API | Low |
| 6 | JEE Main candidates per session | A real candidate count in the percentile calculator | NTA press notes | Low: manual |
| 7 | Loans, visas, scholarships | Better guidance pages | Bank, embassy and ministry pages | Manual, small |

Start with **#1**. It powers the main target keyword and is required before the site is promoted (see `docs/LAUNCH_CHECKLIST.md`).

---

## 2. How the data pipeline should work

Use the same pattern for every dataset:

```
data/
  raw/<source>/<year>/...        # files exactly as downloaded (HTML, PDF, JSON). Not committed (add to .gitignore).
scripts/
  fetch-<source>.py|ts           # downloads raw files politely, with caching
  build-<source>.ts              # cleans raw files into the normalized JSON below
src/data/ or public/data/
  <dataset>.json                 # normalized data the site uses (committed)
  <dataset>.meta.json            # { source, sourceUrl, fetchedAt, rowCount, checks passed }
```

- **Small data** (under about 1 MB): put it in `src/data/` and import it at build time, so it ships with the page.
- **Large data:** put it in `public/data/` and fetch it on demand, as `loadCutoffs()` does today. Alternatively, serve it from your backend API. The site only needs the normalized shape, wherever it comes from.
- **The site never calls a government website live.** All fetching happens in scripts, ahead of time.

**Rules for any scraper:**

1. Check the site's `robots.txt` and terms of use first.
2. Send a clear User-Agent with a contact email.
3. Wait at least 1 to 2 seconds between requests, and never fetch in parallel against government servers.
4. Cache raw responses, and never re-download what you already have.
5. Run scrapers manually, once per data release. Never run them from the website.

---

## 3. JoSAA opening and closing ranks (JEE Main college predictor)

**What it powers:**

- real predictor results, through `loadCutoffs()` in `src/components/predictor/data.ts`;
- the planned `/josaa-cutoff/[institute]` and `/jee-main-rank/[rank]-colleges` pages;
- the rank-band table on the hub page.

**Official source:**

- **Archive of past years:** `https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx`. This path is printed on JoSAA's own documents. If it moves, start from `https://josaa.nic.in` → Archive.
- **Current year:** the "Opening and Closing Ranks" page for each round on the JoSAA portal during counselling (June to July).
- **CSAB special rounds:** the same kind of OR-CR pages on `https://csab.nic.in`.

**How to collect it:**

The archive is an ASP.NET form. You choose the year, round, institute type, institute, academic programme, quota, seat type and gender from dropdowns, and the results table appears after the form posts back. Plain URL scraping does not work, because every dropdown change posts hidden fields (`__VIEWSTATE`, `__EVENTVALIDATION`) back to the server.

Two ways to do it:

1. **Python `requests` + `BeautifulSoup`** (fast and light):
   1. GET the page, and read all hidden inputs and the dropdown `name` attributes from the HTML. Do not guess the control names; read them from the live form.
   2. POST the form with the year selected, plus all hidden fields. Read the new hidden fields from the response.
   3. Repeat for each dropdown in order: round, then institute type, then institute ("ALL" if offered), then programme, quota, seat type and gender ("ALL" where offered).
   4. Parse the final `<table>` into rows. Save the raw HTML for each year and round.
2. **Playwright** (simpler if the postbacks prove difficult): drive a real browser, select each dropdown, wait for the table, and read it. Slower, but it handles the page exactly as a user would.

Choosing "ALL" for institute, programme and seat type keeps it to one request chain per year and round.

**Normalized row** (extends `CutoffRow` in `src/components/predictor/types.ts`):

```json
{
  "year": 2026, "round": 6,
  "institute": "National Institute of Technology, Tiruchirappalli", "slug": "nit-tiruchirappalli",
  "type": "NIT", "state": "Tamil Nadu",
  "program": "Computer Science and Engineering (4 Years, Bachelor of Technology)",
  "quota": "OS", "category": "OPEN", "pwd": false, "gender": "Gender-Neutral",
  "openingRank": 0, "closingRank": 0, "preparatory": false,
  "sourceUrl": "...", "fetchedAt": "2026-07-20"
}
```

(The rank values are placeholders. Fill them only from the scraped table.)

**Cleaning rules:**

- **Drop IIT rows.** IITs use JEE Advanced ranks and are out of scope for a JEE Main predictor.
- **Seat type** combines category and PwD: "OPEN", "OBC-NCL (PwD)" and so on. Split it into `category` and `pwd`.
- **Ranks ending in "P"** (for example `1234P`) are preparatory-course ranks for PwD candidates. Keep the number and set `preparatory: true`, or exclude these rows from the predictor.
- **Gender:** "Gender-Neutral" or "Female-only (including Supernumerary)". Map these to `neutral` and `female`.
- **State:** the archive does not give the institute's state. Keep a small hand-made table of institute → state (about 120 rows, one per institute). Home State quota depends on it.
- **Use the last round** of each year for prediction, and keep all rounds for round-wise pages.

**Checks before publishing:**

- [ ] Row counts per year and round are similar to the previous year, with no sudden drop to zero.
- [ ] Every row has `openingRank ≤ closingRank`.
- [ ] 20 random rows match the live JoSAA page exactly. Record which ones were checked in the meta file.
- [ ] Every institute has a state in the institute → state table.

**Refresh:** after every JoSAA round in June and July, and after the CSAB rounds in August.

**After real data is in:** update `/methodology` with the source and years, then build the institute and rank pages (see section 3 of `docs/IMPLEMENTATION_PLAN.md`).

---

## 4. NBEMS FMGE results (FMGE explorer, country comparison)

**What it powers:**

- the planned FMGE University and Country Explorer;
- the Country vs Country Comparison;
- an optional "past screening test results" line in the university finder.

**Official source:** `https://www.natboard.edu.in/stats`. NBEMS (National Board of Examinations in Medical Sciences) publishes "Institute-wise Performance of Candidates appearing in FMGE" for each year, as PDFs.

**How to collect it:**

1. Download the PDF for each year from the NBEMS stats page. Save it to `data/raw/nbems-fmge/<year>.pdf`.
2. Extract the tables with **`pdfplumber`** (Python), or **`camelot`** if the tables have ruled lines. Check page 1 by eye first, to learn the column order.
3. Normalize each row:

```json
{ "year": 2025, "session": "combined", "country": "Russian Federation",
  "institute": "Example State Medical University", "appeared": 0, "passed": 0,
  "sourceUrl": "https://www.natboard.edu.in/stats", "fetchedAt": "2026-02-01" }
```

(The numbers and the institute name are placeholders.) Calculate `passPct = passed / appeared` in the build script, not by hand.

4. **Join names across years.** Institute spellings change from year to year. Keep `data/fmge-aliases.json`, which maps each spelling to one canonical name and country. Build it once, then add to it each year.

**Checks before publishing:**

- [ ] For each year, the sum of `appeared` and `passed` across all rows equals the totals printed in the PDF.
- [ ] No row has `passed > appeared`.
- [ ] 20 random rows match the PDF exactly.

**How to present it fairly:**

- Show the number of candidates next to every pass rate. A 100% pass rate from 3 candidates means little, so hide or flag institutes with fewer than about 20 candidates.
- Show which year and which session (June, December or combined) each figure comes from.
- Say clearly that FMGE results reflect the candidates as well as the institute.

**Refresh:** after each FMGE session result. NBEMS publishes yearly compilations; check the stats page in January and July.

**Copies hosted elsewhere:** some Indian embassies host older reports, for example the embassy in Bishkek. Use them only to fill gaps, and cite the embassy page.

---

## 5. US college admissions (College Admissions Calculator)

**What it powers:** a "search for a college" box that fills in the acceptance rate and the SAT/ACT ranges, so students do not have to look them up.

**Official source:** the US Department of Education **College Scorecard API**.

- Docs: `https://collegescorecard.ed.gov/data/api-documentation/`
- Data dictionary (field names): `https://collegescorecard.ed.gov/data/documentation`
- Endpoint: `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=YOUR_KEY&...`
- Free API key: sign up at `https://api.data.gov/signup/`

**How to collect it:**

1. Request only the fields you need with `fields=`. For example: `id`, `school.name`, `school.city`, `school.state`, `latest.admissions.admission_rate.overall`, the SAT and ACT 25th and 75th percentile fields, and `school.school_url`. Check every field path against the official data dictionary before relying on it.
2. Page through the results with `page=` and `per_page=`. Keep only schools that report an admission rate.
3. Store the result in `public/data/us-colleges.json` (about one small row per college), and add a search box to `AdmissionsCalculator.tsx` that fills in the row.

**Important caveat:** Scorecard reports SAT percentiles **per section** (reading/writing and math). Adding the two 25th percentiles does **not** give the true 25th percentile of the total score. Label the combined range "approximate", or compare section by section.

**Alternative:** IPEDS bulk downloads (the ADM admissions tables) from `https://nces.ed.gov/ipeds/datacenter/` hold the same underlying data, as CSV files.

**Refresh:** once a year, when Scorecard releases new data.

---

## 6. MBBS universities abroad (University Finder, Country Comparison)

**What it powers:** a searchable list of universities, with course details filled in, in the finder.

There is **no single official dataset**, and **NMC publishes no approved list**. Build the dataset carefully, one fact and one source at a time, and never label a university "NMC approved".

| Field | Official source | How |
| --- | --- | --- |
| Name, country, city, recognition at home | **WDOMS**, the World Directory of Medical Schools (`https://www.wdoms.org`) | Look up each school by hand and record its WDOMS link. Check WDOMS terms before any automated collection; manual lookup for a curated list is safest. |
| NMC warnings | **NMC public notices** (`https://www.nmc.org.in`) | Read the notices list every month. Record the notice title, date and PDF link against the university. |
| Course length, internship, language | **The university's official website** or its written prospectus | Record the exact page URL and the date checked. If the website is unclear, write to the university and keep the reply. |
| Licence for foreign graduates | **That country's medical regulator** | Find the regulator's rules for foreign graduates. Record the URL. |
| Fees (tuition, hostel) | **The university's official fee schedule** | Record the currency, the academic year and the URL. Never use agent price lists. |
| Indian embassy advice | **Indian embassy websites** in that country | Many publish advisories for medical students. Record the URL and date. |
| FMGE record | **NBEMS** data (section 4) | Join by the canonical institute name. |

**Normalized record:**

```json
{
  "id": "example-university-country",
  "name": "...", "country": "...", "city": "...",
  "wdomsUrl": "...",
  "courseMonths": null, "internshipMonths": null, "internshipAtSameInstitution": null,
  "medium": null, "licenceForForeignGraduates": null,
  "nmcNotices": [{ "title": "...", "date": "...", "url": "..." }],
  "fees": [{ "academicYear": "2026-27", "currency": "USD", "tuitionPerYear": null, "hostelPerYear": null, "url": "..." }],
  "sources": { "courseMonths": "https://...", "medium": "https://..." },
  "verifiedAt": "2026-11-15"
}
```

- Leave a field `null` if you cannot source it. The finder already treats unknowns as "Check before you apply".
- **Start small:** the 30 to 50 universities that Indian students choose most often (use the FMGE data to see which ones have the most candidates). Verify those properly before adding more.

**Refresh:** fees and NMC notices every 3 months. Course structure once a year.

---

## 7. Exchange rates (Cost Calculator)

**What it powers:** a pre-filled "rupees per unit" rate in the cost calculator. The student can still edit it.

- **RBI reference rates** (`https://www.rbi.org.in`) cover the US dollar, euro, pound and yen. Use these for USD.
- **Other currencies** (rouble, tenge, som, lari, peso, taka and so on): use a free exchange-rate API that lists its data source, or the rate from your bank's website. Note the source and date beside the field.
- Fetch the rates at build time (a small script that writes `src/data/fx.json` with `rate`, `source` and `date`). Show "rate as of <date>" under the input.

**Refresh:** with every deploy, or weekly.

---

## 8. JEE Main candidates per session (Percentile vs Rank)

**What it powers:** a real "candidates who appeared" number in the percentile calculator, instead of the 12,00,000 example.

**Official source:** NTA press notes and result notices on `https://jeemain.nta.nic.in`. Each session's result note states the number of candidates who registered and appeared.

**How:** collect this by hand, once per session (2 numbers a year). Store it in `src/data/jee-main-candidates.json` with the year, session, the number who appeared and the note's URL. Pre-fill the calculator with the latest figure, and say which session it is from.

**Do not use** "marks vs percentile" tables from coaching sites. NTA does not publish an official marks-to-percentile table.

**Refresh:** after each JEE Main session result (usually February and April).

---

## 9. Smaller guidance datasets (manual)

| Dataset | Official source | Refresh |
| --- | --- | --- |
| Education loan interest rates (for the loan page) | Each bank's official education loan page. Record the rate, the date and the URL. | Every 3 months |
| Student visa requirements per country (for the document checker) | The official student visa page of each country's embassy in India | Every 6 months |
| Apostille member countries | The HCCH status table: `https://www.hcch.net/en/instruments/conventions/status-table/?cid=41` | Every 6 months |
| Scholarships | The ministry or state department running each scheme, and `https://scholarships.gov.in` | Once a year |
| JoSAA rules and dates (for the guides) | The JoSAA information bulletin (PDF) on `https://josaa.nic.in` | Every year in May and June |
| NMC rules for foreign graduates | NMC regulations and public notices | Every month |

---

## 10. Refresh calendar

| Month | Task |
| --- | --- |
| January | NBEMS FMGE data (December session), NMC notices |
| February | JEE Main session 1 candidate count |
| April | JEE Main session 2 candidate count |
| May to June | JoSAA bulletin, update the guides' dates and rules |
| June to July | JoSAA OR-CR after each round |
| July | NBEMS FMGE data (June session) |
| August | CSAB special rounds OR-CR |
| Every 3 months | MBBS university fees, NMC notices, loan rates |
| Every year | College Scorecard data, university course structures, visa requirements |

After every refresh:

1. update the `updated` dates on the affected pages and `CONTENT_UPDATED` in `astro.config.mjs`;
2. run `npm test` and `npm run build`;
3. deploy.

---

## 11. Legal and ethical notes

- **Government data:** JoSAA, NBEMS, NMC and NTA publish their data for the public. Present it with attribution: the source name, a link and the year on the page. Do not imply that RankOtalk is official.
- **Terms of use:** read each site's terms and `robots.txt` before automating anything. If a site forbids automated access, collect the data by hand or ask the publisher.
- **No competitor data**, even when it is copied from official sources. Go to the original.
- **Personal data:** none of these datasets should contain personal information. If a file ever includes candidate names or roll numbers, do not store or publish them.
- **Accuracy over coverage:** a smaller dataset that is verified beats a large one with mistakes. Students make real decisions with this.

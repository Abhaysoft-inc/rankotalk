# RankOtalk

A static Astro site with a Preact predictor island. See `IMPLEMENTATION_PLAN.md` for the plan and `LAUNCH_CHECKLIST.md` before deploying.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Builds the static site into `dist/` |
| `npm run preview` | Serves the build locally |
| `npm test` | Runs unit tests (predictor logic, percentile maths) |
| `npm run indexnow` | After a deploy, pings IndexNow with every URL in the sitemap |

## Where things are

| Path | What it holds |
| --- | --- |
| `src/pages/` | One file per page. `robots.txt.ts`, `llms.txt.ts` and `.well-known/security.txt.ts` generate those files |
| `src/content/guides/*.md` | Guides. Frontmatter: `title` (max 60), `description` (max 160), `published`, `updated`, `order` |
| `src/components/predictor/` | The predictor: `Predictor.tsx` (UI), `predict.ts` (logic), `data.ts` (where data comes from), `types.ts` |
| `src/layouts/Base.astro` | Page shell, icons, analytics |
| `src/components/SEO.astro` | Title, description, canonical, Open Graph, JSON-LD |
| `src/lib/schema.ts` | JSON-LD builders |
| `src/styles/global.css` | Design tokens and all styles |
| `src/config.ts` | Site name, year, email, navigation |
| `vercel.json` | Headers, caching and clean URLs on Vercel |
| `public/` | Icons, social image, web manifest, IndexNow key file |

## Design rules

No gradients, 4px maximum radius, no shadows, one accent colour. Tokens are at the top of `src/styles/global.css`.

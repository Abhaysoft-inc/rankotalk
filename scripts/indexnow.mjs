// Tells Bing and other IndexNow search engines that pages changed.
// Run after a deploy:  SITE_URL=https://yourdomain npm run indexnow
// The key file in /public must be live at https://yourdomain/<key>.txt first.
import { readdirSync, readFileSync } from 'node:fs';

const site = (process.env.SITE_URL ?? '').replace(/\/$/, '');
if (!site) {
  console.error('Set SITE_URL to the live site, for example SITE_URL=https://example.com');
  process.exit(1);
}

const keyFile = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  console.error('No IndexNow key file found in /public');
  process.exit(1);
}
const key = keyFile.replace('.txt', '');

const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, site));

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${keyFile}`, urlList }),
});
console.log(`IndexNow responded ${res.status} for ${urlList.length} URLs`);

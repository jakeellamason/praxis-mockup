// Re-fetch broken chooser thumbnails (rate-limited on first pass) with delays + retries.
import { readFileSync, writeFileSync, statSync } from 'node:fs';

const DIR = 'C:/Users/jake/Praxis Website/photo-chooser';
const UA = 'PraxisWebsiteMockup/1.0 (jake@yxbv.com)';
const manifest = JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let fixed = 0, failed = 0;
for (const [id, title] of Object.entries(manifest)) {
  let size = 0;
  try { size = statSync(`${DIR}/thumbs/${id}.jpg`).size; } catch {}
  if (size > 5000) continue;

  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.search = new URLSearchParams({
    action: 'query', format: 'json', titles: title,
    prop: 'imageinfo', iiprop: 'url', iiurlwidth: '720',
  }).toString();

  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const res = await fetch(api, { headers: { 'User-Agent': UA } });
      const data = await res.json();
      const ii = Object.values(data.query.pages)[0].imageinfo[0];
      const img = await fetch(ii.thumburl, { headers: { 'User-Agent': UA } });
      const buf = Buffer.from(await img.arrayBuffer());
      if (img.ok && buf.length > 5000) {
        writeFileSync(`${DIR}/thumbs/${id}.jpg`, buf);
        ok = true;
      } else {
        await sleep(1500 * attempt);
      }
    } catch { await sleep(1500 * attempt); }
  }
  ok ? fixed++ : (failed++, console.log(`FAILED: ${id}`));
  await sleep(700);
}
console.log(`fixed: ${fixed}, failed: ${failed}`);

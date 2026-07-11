// Fetch candidate photos per city and generate a visual chooser page.
// Local tool only — photo-chooser/ is gitignored and never deploys.
import { writeFileSync, mkdirSync } from 'node:fs';

const DIR = 'C:/Users/jake/Praxis Website/photo-chooser';
mkdirSync(`${DIR}/thumbs`, { recursive: true });
const UA = 'PraxisWebsiteMockup/1.0 (jake@yxbv.com)';

const CITIES = [
  { slug: 'toronto', label: 'Toronto', queries: ['Toronto skyline night', 'Toronto skyline sunset panorama'] },
  { slug: 'niagara', label: 'Niagara Falls', queries: ['Horseshoe Falls aerial', 'Niagara Falls illuminated night', 'Horseshoe Falls rainbow mist'] },
  { slug: 'montreal', label: 'Montréal', queries: ['Montreal skyline panorama', 'Montreal night view Mount Royal'] },
  { slug: 'ottawa', label: 'Ottawa', queries: ['Parliament Hill Ottawa river', 'Parliament Hill Ottawa dusk', 'Ottawa Parliament Centre Block'] },
  { slug: 'vancouver', label: 'Vancouver', queries: ['Vancouver skyline night', 'Vancouver skyline mountains', 'Vancouver Lions Gate Bridge'] },
  { slug: 'banff', label: 'Banff / Alberta Rockies', queries: ['Moraine Lake', 'Lake Louise sunrise', 'Banff Vermilion Lakes Mount Rundle'] },
  { slug: 'calgary', label: 'Calgary', queries: ['Calgary skyline night', 'Calgary downtown skyline'] },
  { slug: 'regina', label: 'Regina', queries: ['Saskatchewan Legislative Building', 'Wascana Lake Regina'] },
  { slug: 'winnipeg', label: 'Winnipeg', queries: ['Canadian Museum for Human Rights Winnipeg', 'Winnipeg Esplanade Riel'] },
  { slug: 'quebec', label: 'Québec City', queries: ['Château Frontenac Quebec City', 'Quebec City Petit Champlain winter'] },
  { slug: 'halifax', label: 'Halifax', queries: ['Peggys Cove lighthouse', 'Halifax harbour waterfront'] },
];

const manifest = {};
let html = '';

for (const { slug, label, queries } of CITIES) {
  const seen = new Set();
  const picks = [];
  for (const q of queries) {
    const api = new URL('https://commons.wikimedia.org/w/api.php');
    api.search = new URLSearchParams({
      action: 'query', format: 'json', generator: 'search',
      gsrnamespace: '6', gsrlimit: '10', gsrsearch: `${q} filetype:bitmap`,
      prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '720',
    }).toString();
    const res = await fetch(api, { headers: { 'User-Agent': UA } });
    const data = await res.json();
    const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => a.index - b.index);
    for (const p of pages) {
      const ii = p.imageinfo?.[0];
      if (!ii || seen.has(p.title)) continue;
      if (ii.width < 1800 || ii.width <= ii.height || !/\.(jpe?g)$/i.test(ii.url)) continue;
      seen.add(p.title);
      picks.push({ title: p.title, thumb: ii.thumburl, w: ii.width, h: ii.height, lic: ii.extmetadata?.LicenseShortName?.value ?? '?' });
      if (picks.length >= 6) break;
    }
    if (picks.length >= 6) break;
  }

  html += `<h2>${label}</h2><div class="grid">`;
  let n = 0;
  for (const p of picks) {
    n++;
    const id = `${slug}-${n}`;
    manifest[id] = p.title;
    const img = await fetch(p.thumb, { headers: { 'User-Agent': UA } });
    const buf = Buffer.from(await img.arrayBuffer());
    writeFileSync(`${DIR}/thumbs/${id}.jpg`, buf);
    const big = p.thumb.replace('/720px-', '/2000px-');
    html += `<a class="card" href="${big}" target="_blank" rel="noreferrer">
      <img src="thumbs/${id}.jpg" alt="${id}" loading="lazy">
      <span class="tag">${id}</span>
      <span class="meta">${p.w}&times;${p.h} · ${p.lic}</span>
    </a>`;
    console.log(`${id}: ok`);
  }
  html += '</div>';
}

const page = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Praxis — hero photo chooser</title>
<style>
  body { font-family: "Segoe UI", sans-serif; background: #F2EFE9; color: #172536; margin: 0; padding: 2.5rem clamp(1rem, 4vw, 3rem); }
  h1 { font-weight: 500; } h2 { margin-top: 2.75rem; border-bottom: 2px solid #172536; padding-bottom: .4rem; }
  p.help { color: #5A6472; max-width: 60em; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .card { position: relative; display: block; background: #fff; text-decoration: none; color: inherit; box-shadow: 0 8px 24px -12px rgba(23,37,54,.35); }
  .card img { width: 100%; aspect-ratio: 16/10; object-fit: cover; display: block; }
  .tag { position: absolute; top: .6rem; left: .6rem; background: #172536; color: #fff; font-size: .8rem; font-weight: 600; letter-spacing: .08em; padding: .25rem .6rem; }
  .meta { display: block; padding: .5rem .75rem; font-size: .75rem; color: #5A6472; }
</style></head><body>
<h1>Choose the hero photos</h1>
<p class="help">Click any image to open it full-size in a new tab. Then tell Claude your picks by tag — e.g. <b>toronto-2, niagara-1, montreal-1, ottawa-4, vancouver-3, banff-2, regina-1</b>. Pick as many or as few cities as you want; you can also say "keep current" for any slot.</p>
${html}
</body></html>`;

writeFileSync(`${DIR}/chooser.html`, page);
writeFileSync(`${DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`\nchooser ready: ${Object.keys(manifest).length} candidates`);

// Builds the bundled Wikipedia pack: articles + their images, stored as static files under public/packs/wiki.
// Run with `npm run packs` (or `node scripts/wiki-pack.mjs --force` to rebuild). Output is committed to the repo,
// so normal builds never need to contact Wikipedia.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from 'node-html-parser';

const OUT = 'public/packs/wiki';
const IMG = `${OUT}/img`;
const force = process.argv.includes('--force');
if (existsSync(`${OUT}/index.json`) && !force) {
  console.log('wiki pack exists (use --force to rebuild)');
  process.exit(0);
}
mkdirSync(IMG, { recursive: true });

const UA = { 'User-Agent': 'OfflinePackBuilder/1.0 (static offline reader)', 'Api-User-Agent': 'OfflinePackBuilder/1.0' };
const groups = JSON.parse(readFileSync('lib/wiki-essentials.json', 'utf8'));
const MAX_IMGS = 6;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const slugify = (t) =>
  t.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.ok) return await r.json();
    } catch {}
    await sleep(800 * (i + 1));
  }
  throw new Error('fetch failed ' + url);
}

async function getImage(src) {
  const url = src.startsWith('//') ? 'https:' + src : src;
  const ext = (url.split('?')[0].match(/\.(png|jpe?g|gif|svg|webp)$/i)?.[1] || 'jpg').toLowerCase();
  const name = createHash('sha1').update(url).digest('hex').slice(0, 16) + '.' + (ext === 'svg' ? 'png' : ext);
  const file = `${IMG}/${name}`;
  if (existsSync(file)) return name;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.ok) {
        writeFileSync(file, Buffer.from(await r.arrayBuffer()));
        return name;
      }
      if (r.status === 429) await sleep(2000 * (i + 1));
    } catch {}
  }
  return null;
}

const SKIP = 'script,style,link,meta,iframe,object,embed,form,input,button,noscript,.mw-editsection,.navbox,.navbox-styles,.ambox,.mw-empty-elt,.reference,.mw-references-wrap,.reflist,.sistersitebox,.side-box,.metadata,.noprint,.portalbox,.authority-control,.mw-cite-backlink,.sidebar,.vertical-navbox,.hatnote,.shortdescription,.mw-kartographer-maplink,.thumbcaption .magnify';
const END = /^(References|External links|Notes|Further reading|Bibliography|Sources|Citations|See also|Gallery|Footnotes)$/i;

async function build(title) {
  const j = await getJSON(
    `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&formatversion=2&redirects=1&disableeditsection=1&disabletoc=1`,
  );
  if (j.error) throw new Error(j.error.info);
  const real = j.parse.title;
  const root = parse(`<div>${j.parse.text}</div>`).firstChild;
  root.querySelectorAll(SKIP).forEach((n) => n.remove());
  // cut everything from the first "References / See also" heading
  for (const h of root.querySelectorAll('h2')) {
    if (END.test(h.text.trim())) {
      let n = h.closest('.mw-heading') || h;
      while (n) {
        const next = n.nextElementSibling;
        n.remove();
        n = next;
      }
      break;
    }
  }
  for (const el of root.querySelectorAll('*')) {
    for (const a of Object.keys(el.attributes)) {
      if (a.startsWith('on') || a === 'style' || a === 'srcset' || a === 'id' || a.startsWith('data-') || a === 'typeof' || a === 'resource' || a === 'decoding') el.removeAttribute(a);
    }
  }
  let kept = 0;
  let lead = null;
  for (const img of root.querySelectorAll('img')) {
    const w = Number(img.getAttribute('width') || 0);
    const src = img.getAttribute('src') || '';
    if (!src || w < 60 || kept >= MAX_IMGS) {
      (img.closest('figure') || img).remove();
      continue;
    }
    const name = await getImage(src);
    if (!name) {
      (img.closest('figure') || img).remove();
      continue;
    }
    img.setAttribute('src', `/packs/wiki/img/${name}`);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('alt', img.getAttribute('alt') || '');
    if (!lead && w >= 150) lead = `/packs/wiki/img/${name}`;
    kept++;
  }
  for (const a of root.querySelectorAll('a')) {
    const href = a.getAttribute('href') || '';
    const m = href.match(/^\/wiki\/([^#?]+)/);
    if (m && !/^(File|Special|Help|Wikipedia|Template|Category|Portal|Talk):/.test(decodeURIComponent(m[1]))) {
      a.setAttribute('data-wiki', decodeURIComponent(m[1]).replace(/_/g, ' '));
      a.setAttribute('href', '#');
    } else if (/^https?:/.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    } else a.removeAttribute('href');
  }
  // remove now-empty figures / tables of images
  root.querySelectorAll('figure').forEach((f) => !f.querySelector('img') && f.remove());
  const firstP = root.querySelectorAll('p').map((p) => p.text.trim()).find((t) => t.length > 80) || '';
  const summary = firstP.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').slice(0, 260);
  const html = root.innerHTML.replace(/\n{2,}/g, '\n');
  const slug = slugify(real);
  writeFileSync(`${OUT}/${slug}.json`, JSON.stringify({ title: real, slug, html, source: `https://en.wikipedia.org/wiki/${encodeURIComponent(real.replace(/ /g, '_'))}` }));
  return { title: real, slug, summary, image: lead, bytes: html.length };
}

const index = [];
for (const [group, titles] of Object.entries(groups)) {
  for (const t of titles) {
    try {
      const a = await build(t);
      index.push({ ...a, group, asked: t });
      console.log('✓', a.title, a.image ? '(img)' : '');
    } catch (e) {
      console.log('✗', t, e.message);
    }
    await sleep(150);
  }
}
writeFileSync(`${OUT}/index.json`, JSON.stringify({ built: new Date().toISOString(), license: 'Text: CC BY-SA 4.0, Wikipedia contributors. Images: Wikimedia Commons, various free licences (see source article).', articles: index }));
console.log(`wiki pack: ${index.length} articles`);

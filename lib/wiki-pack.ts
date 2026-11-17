import pack from '@/public/packs/wiki/index.json';

/** The bundled Wikipedia Essentials pack: articles + images shipped as static files with the site and the apps. */
export type PackArticle = { title: string; slug: string; summary: string; image: string | null; bytes: number; group: string; asked: string };
export const WIKI_PACK = pack as { built: string; license: string; articles: PackArticle[] };
export const PACK_GROUPS = Array.from(new Set(WIKI_PACK.articles.map((a) => a.group)));

const byTitle = new Map<string, PackArticle>();
for (const a of WIKI_PACK.articles) {
  byTitle.set(a.title.toLowerCase(), a);
  byTitle.set(a.asked.toLowerCase(), a);
}
export const packBySlug = (slug: string) => WIKI_PACK.articles.find((a) => a.slug === slug);
export const packByTitle = (t: string) => byTitle.get(t.toLowerCase());

export async function loadPackArticle(slug: string): Promise<{ title: string; html: string; source: string }> {
  const r = await fetch(`/packs/wiki/${slug}.json`);
  if (!r.ok) throw new Error('Article not available offline yet.');
  return r.json();
}

/** Every file in the pack, used to save it for offline use on the website. */
export function packUrls() {
  const urls = ['/packs/wiki/index.json', ...WIKI_PACK.articles.map((a) => `/packs/wiki/${a.slug}.json`)];
  return urls;
}

export function searchPack(q: string, limit = 8) {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return WIKI_PACK.articles
    .map((a) => {
      const title = a.title.toLowerCase();
      const score = (title === t ? 10 : 0) + (title.includes(t) ? 5 : 0) + (a.summary.toLowerCase().includes(t) ? 2 : 0) + t.split(/\s+/).filter((w) => w.length > 2 && (title + ' ' + a.summary.toLowerCase()).includes(w)).length;
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);
}

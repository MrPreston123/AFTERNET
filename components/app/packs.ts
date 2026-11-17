'use client';
import { useEffect, useState } from 'react';
import { idb } from '@/lib/idb';
import { aiState, refreshCached, subscribeAI } from '@/lib/ai';
import { nativeShell } from '@/lib/platform';
import { packUrls, WIKI_PACK } from '@/lib/wiki-pack';

export type MapArea = { id: string; name: string; bounds: [number, number, number, number]; zooms: [number, number]; tiles: number; bytes: number; date: number };
const AREAS = 'afternet-areas';
export const PACK_CACHE = 'afternet-packs';

export function readAreas(): MapArea[] {
  try {
    return JSON.parse(localStorage.getItem(AREAS) || '[]');
  } catch {
    return [];
  }
}
export function writeAreas(a: MapArea[]) {
  try {
    localStorage.setItem(AREAS, JSON.stringify(a));
  } catch {}
  packsChanged();
}
export function packsChanged() {
  dispatchEvent(new Event('afternet-packs'));
}

/** Is the bundled Wikipedia pack stored for offline use? (Always true inside the installed apps.) */
export async function wikiPackSaved() {
  if (nativeShell()) return true;
  try {
    const c = await caches.open(PACK_CACHE);
    const urls = packUrls();
    const last = await c.match(urls[urls.length - 1]);
    return !!last && !!(await c.match(urls[0]));
  } catch {
    return false;
  }
}

/** Save every article + image of the Wikipedia pack into the offline cache. */
export async function saveWikiPack(onProgress: (done: number, total: number) => void) {
  const c = await caches.open(PACK_CACHE);
  const json = packUrls();
  const imgs = new Set<string>();
  let done = 0;
  const all = [...json];
  onProgress(0, all.length);
  // fetch article JSON first, collecting image URLs as we go
  const work = [...json];
  const worker = async () => {
    while (work.length) {
      const u = work.shift()!;
      try {
        const r = await fetch(u, { cache: 'no-cache' });
        if (r.ok) {
          if (u.endsWith('.json') && !u.endsWith('index.json')) {
            const body = await r.clone().json();
            for (const m of String(body.html).matchAll(/src="(\/packs\/wiki\/img\/[^"]+)"/g)) {
              if (!imgs.has(m[1])) {
                imgs.add(m[1]);
                work.push(m[1]);
                all.push(m[1]);
              }
            }
          }
          await c.put(u, r);
        }
      } catch {}
      done++;
      onProgress(done, all.length);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  packsChanged();
}

export async function removeWikiPack() {
  await caches.delete(PACK_CACHE);
  packsChanged();
}

/** Live summary of what's stored on this device. */
export function usePacks() {
  const [s, setS] = useState({ saved: 0, areas: 0, pack: false, models: 0, used: 0, quota: 0, ready: false });
  useEffect(() => {
    const f = async () => {
      let saved = 0;
      try {
        saved = (await idb.all('wiki')).length;
      } catch {}
      let used = 0,
        quota = 0;
      try {
        const e = await navigator.storage?.estimate?.();
        used = e?.usage ?? 0;
        quota = e?.quota ?? 0;
      } catch {}
      const pack = await wikiPackSaved();
      await refreshCached();
      const models = Object.values(aiState().cached).filter(Boolean).length;
      setS({ saved, areas: readAreas().length, pack, models, used, quota, ready: true });
    };
    f();
    addEventListener('afternet-packs', f);
    const un = subscribeAI((st) => setS((p) => ({ ...p, models: Object.values(st.cached).filter(Boolean).length })));
    return () => {
      removeEventListener('afternet-packs', f);
      un();
    };
  }, []);
  return s;
}

export const PACK_STATS = { articles: WIKI_PACK.articles.length };

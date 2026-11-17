'use client';
import { useEffect, useState } from 'react';
import { idb } from '@/lib/idb';

export type MapArea = { id: string; name: string; bounds: [number, number, number, number]; zooms: [number, number]; tiles: number; bytes: number; date: number };
const AREAS = 'afternet-areas';
const MODEL = 'afternet-model';

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
  dispatchEvent(new Event('afternet-packs'));
}
export function readModel(): string | null {
  try {
    return localStorage.getItem(MODEL);
  } catch {
    return null;
  }
}
export function writeModel(id: string | null) {
  try {
    if (id) localStorage.setItem(MODEL, id);
    else localStorage.removeItem(MODEL);
  } catch {}
  dispatchEvent(new Event('afternet-packs'));
}
export function packsChanged() {
  dispatchEvent(new Event('afternet-packs'));
}

/** Live summary of what's stored on this device. */
export function usePacks() {
  const [s, setS] = useState({ wiki: 0, areas: 0, model: null as string | null, used: 0, quota: 0, ready: false });
  useEffect(() => {
    const f = async () => {
      let wiki = 0;
      try {
        wiki = (await idb.all('wiki')).length;
      } catch {}
      let used = 0, quota = 0;
      try {
        const e = await navigator.storage?.estimate?.();
        used = e?.usage ?? 0;
        quota = e?.quota ?? 0;
      } catch {}
      setS({ wiki, areas: readAreas().length, model: readModel(), used, quota, ready: true });
    };
    f();
    addEventListener('afternet-packs', f);
    return () => removeEventListener('afternet-packs', f);
  }, []);
  return s;
}

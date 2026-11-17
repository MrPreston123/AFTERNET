/** Tiny IndexedDB key-value wrapper. Stores saved Wikipedia articles and other offline data. */
const DB = 'afternet';
const STORES = ['wiki', 'meta'] as const;
type Store = (typeof STORES)[number];

let dbp: Promise<IDBDatabase> | null = null;
function db() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        for (const s of STORES) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

function tx<T>(store: Store, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const r = fn(d.transaction(store, mode).objectStore(store));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      }),
  );
}

export const idb = {
  get: <T>(store: Store, key: string) => tx<T | undefined>(store, 'readonly', (s) => s.get(key)),
  set: (store: Store, key: string, val: unknown) => tx(store, 'readwrite', (s) => s.put(val, key)),
  del: (store: Store, key: string) => tx(store, 'readwrite', (s) => s.delete(key)),
  all: <T>(store: Store) => tx<T[]>(store, 'readonly', (s) => s.getAll()),
  clear: (store: Store) => tx(store, 'readwrite', (s) => s.clear()),
};

export function fmtBytes(n: number) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i > 1 ? 1 : 0)} ${u[i]}`;
}

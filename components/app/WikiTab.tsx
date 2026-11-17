'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../Icon';
import { idb, fmtBytes } from '@/lib/idb';
import { useOnline } from '@/lib/install';
import { packsChanged } from './packs';

type Saved = { title: string; html: string; saved: number; bytes: number };
type Hit = { title: string; snippet: string; saved?: boolean };

const API = 'https://en.wikipedia.org/w/api.php';

/** A curated starter pack: the articles you'd most want with no internet. */
export const ESSENTIALS = [
  'First aid', 'Cardiopulmonary resuscitation', 'Bleeding', 'Tourniquet', 'Burn', 'Bone fracture', 'Hypothermia', 'Frostbite',
  'Heat stroke', 'Dehydration', 'Oral rehydration therapy', 'Shock (circulatory)', 'Anaphylaxis', 'Wound', 'Infection',
  'Water purification', 'Portable water purification', 'Solar water disinfection', 'Rainwater harvesting', 'Water well',
  'Food preservation', 'Canning', 'Botulism', 'Fermentation in food processing', 'Root cellar', 'Seed saving', 'Composting',
  'Crop rotation', 'Potato', 'Bread', 'Fire making', 'Rocket stove', 'Carbon monoxide poisoning', 'Survival skills',
  'Navigation', 'Compass', 'Celestial navigation', 'Orienteering', 'Morse code', 'Amateur radio', 'Citizens band radio',
  'Solar panel', 'Lead–acid battery', 'Lithium iron phosphate battery', 'Electric generator', 'Sanitation', 'Pit latrine',
  'Soapmaking', 'Knot', 'Edible plants',
];

function sanitize(raw: string) {
  const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;
  root
    .querySelectorAll(
      'script,style,link,meta,iframe,object,embed,form,input,button,noscript,.mw-editsection,.navbox,.navbox-styles,.ambox,.mw-empty-elt,.reference,.mw-references-wrap,.reflist,.sistersitebox,.side-box,.metadata,.noprint,.portalbox,.authority-control,.mw-cite-backlink,sup.noprint',
    )
    .forEach((n) => n.remove());
  // Drop everything after "References"/"External links" to save space.
  root.querySelectorAll('h2').forEach((h) => {
    if (/^(References|External links|Notes|Further reading|Bibliography|Sources|Citations)$/i.test(h.textContent?.trim() || '')) {
      const wrap = h.closest('.mw-heading') || h;
      let n: Element | null = wrap;
      while (n) {
        const next: Element | null = n.nextElementSibling;
        n.remove();
        n = next;
      }
    }
  });
  root.querySelectorAll('*').forEach((el) => {
    for (const a of Array.from(el.attributes)) {
      if (a.name.startsWith('on') || a.name === 'style' || a.name === 'srcset' || a.name === 'id' || a.name.startsWith('data-mw')) el.removeAttribute(a.name);
    }
  });
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith('//')) img.setAttribute('src', 'https:' + src);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('alt', img.getAttribute('alt') || '');
  });
  root.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const m = href.match(/^\/wiki\/([^#?]+)/);
    if (m && !/^(File|Special|Help|Wikipedia|Template|Category|Portal|Talk):/.test(decodeURIComponent(m[1]))) {
      a.setAttribute('data-wiki', decodeURIComponent(m[1]).replace(/_/g, ' '));
      a.setAttribute('href', '#');
    } else if (/^https?:/.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    } else {
      a.removeAttribute('href');
    }
  });
  return root.innerHTML;
}

async function fetchArticle(title: string): Promise<{ title: string; html: string }> {
  const u = `${API}?action=parse&page=${encodeURIComponent(title)}&prop=text|displaytitle&format=json&formatversion=2&redirects=1&disableeditsection=1&disabletoc=1&origin=*`;
  const r = await fetch(u);
  const j = await r.json();
  if (j.error) throw new Error(j.error.info || 'Not found');
  return { title: j.parse.title, html: sanitize(j.parse.text) };
}

export default function WikiTab({ sub }: { sub: string }) {
  const online = useOnline();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [article, setArticle] = useState<{ title: string; html: string; isSaved: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pack, setPack] = useState<{ done: number; total: number } | null>(null);
  const stop = useRef(false);

  const loadSaved = useCallback(async () => {
    try {
      setSaved((await idb.all<Saved>('wiki')).sort((a, b) => a.title.localeCompare(b.title)));
    } catch {}
  }, []);
  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const open = useCallback(
    async (title: string) => {
      setErr('');
      setBusy(true);
      try {
        const local = await idb.get<Saved>('wiki', title.toLowerCase());
        if (local) setArticle({ title: local.title, html: local.html, isSaved: true });
        else if (!navigator.onLine) throw new Error('This article isn’t saved on your device, and you’re offline.');
        else {
          const a = await fetchArticle(title);
          const again = await idb.get<Saved>('wiki', a.title.toLowerCase());
          setArticle({ ...a, isSaved: !!again });
        }
        document.querySelector('.app-main')?.scrollTo({ top: 0 });
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  // deep link: #wiki/Title
  useEffect(() => {
    if (sub) open(sub);
    else setArticle(null);
  }, [sub, open]);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return setHits(null);
    setErr('');
    const lower = term.toLowerCase();
    const local = saved.filter((s) => s.title.toLowerCase().includes(lower)).map((s) => ({ title: s.title, snippet: 'Saved on this device', saved: true }));
    if (!navigator.onLine) return setHits(local);
    setBusy(true);
    try {
      const r = await fetch(`${API}?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=15&format=json&origin=*`);
      const j = await r.json();
      const names = new Set(saved.map((s) => s.title));
      const remote: Hit[] = (j.query?.search ?? []).map((h: { title: string; snippet: string }) => ({
        title: h.title,
        snippet: h.snippet.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'"),
        saved: names.has(h.title),
      }));
      setHits(remote.length ? remote : local);
    } catch {
      setHits(local);
    } finally {
      setBusy(false);
    }
  };

  const save = async (title: string, html: string) => {
    await idb.set('wiki', title.toLowerCase(), { title, html, saved: Date.now(), bytes: html.length * 2 } satisfies Saved);
    await loadSaved();
    packsChanged();
  };
  const remove = async (title: string) => {
    await idb.del('wiki', title.toLowerCase());
    await loadSaved();
    packsChanged();
  };

  const downloadPack = async () => {
    stop.current = false;
    const have = new Set(saved.map((s) => s.title.toLowerCase()));
    const todo = ESSENTIALS.filter((t) => !have.has(t.toLowerCase()));
    setPack({ done: 0, total: todo.length });
    let i = 0;
    const worker = async () => {
      while (i < todo.length && !stop.current) {
        const t = todo[i++];
        try {
          const a = await fetchArticle(t);
          await idb.set('wiki', a.title.toLowerCase(), { title: a.title, html: a.html, saved: Date.now(), bytes: a.html.length * 2 } satisfies Saved);
        } catch {}
        setPack((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    await loadSaved();
    packsChanged();
    setPack(null);
  };

  const totalBytes = saved.reduce((n, s) => n + (s.bytes || 0), 0);

  if (article) {
    return (
      <div className="pane reader wiki-reader">
        <div className="reader-bar">
          <a href="#wiki" className="back" onClick={() => setArticle(null)}>
            <Icon name="back" size={16} /> Wikipedia
          </a>
          {article.isSaved ? (
            <button className="btn btn-ghost btn-sm" onClick={async () => { await remove(article.title); setArticle({ ...article, isSaved: false }); }}>
              <Icon name="check" size={15} /> <span>Saved offline</span>
            </button>
          ) : (
            <button className="btn btn-red btn-sm" onClick={async () => { await save(article.title, article.html); setArticle({ ...article, isSaved: true }); }}>
              <Icon name="download" size={15} /> <span>Save offline</span>
            </button>
          )}
        </div>
        <h1 className="reader-title">{article.title}</h1>
        <div
          className="wiki-html prose"
          onClick={(e) => {
            const a = (e.target as HTMLElement).closest('a[data-wiki]');
            if (a) {
              e.preventDefault();
              location.hash = `wiki/${a.getAttribute('data-wiki')}`;
            }
          }}
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
        <p className="disclaimer">Text from Wikipedia, available under CC BY-SA 4.0. Images load only when online.</p>
      </div>
    );
  }

  return (
    <div className="pane">
      <div className="pane-head">
        <div>
          <p className="kicker">Offline Wikipedia</p>
          <h1 className="pane-title">Human knowledge, <span className="red">anywhere.</span></h1>
          <p className="muted">{online ? 'Search all of Wikipedia. Save what matters to this device.' : 'Offline: searching the articles saved on this device.'}</p>
        </div>
        <form className="search" onSubmit={search}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={online ? 'Search Wikipedia…' : 'Search saved articles…'} />
          <button type="submit" className="search-go" aria-label="Search"><Icon name="arrow" size={16} /></button>
        </form>
      </div>

      {err && <p className="err">{err}</p>}
      {busy && <div className="loading">Working…</div>}

      {hits && (
        <section className="dash-sec">
          <h2 className="sec-title">Results <button className="link" onClick={() => setHits(null)}>clear</button></h2>
          <div className="hits">
            {hits.map((h) => (
              <a key={h.title} href={`#wiki/${encodeURIComponent(h.title)}`} className="hit">
                <div>
                  <b>{h.title} {h.saved && <span className="tag-ok">Saved</span>}</b>
                  <small>{h.snippet}</small>
                </div>
                <Icon name="arrow" size={16} />
              </a>
            ))}
            {!hits.length && <p className="empty">Nothing found{online ? '' : ' among saved articles'}.</p>}
          </div>
        </section>
      )}

      <section className="pack-card">
        <div>
          <p className="kicker">Pack // Essentials</p>
          <h3>{ESSENTIALS.length} survival-critical articles</h3>
          <p className="muted">Medicine, water, food, power, navigation, radio. Text only, roughly 10–20 MB.</p>
        </div>
        {pack ? (
          <div className="pack-prog">
            <div className="bar"><div style={{ width: `${(pack.done / Math.max(1, pack.total)) * 100}%` }} /></div>
            <small>{pack.done}/{pack.total} downloaded</small>
            <button className="btn btn-ghost btn-sm" onClick={() => (stop.current = true)}><Icon name="stop" size={14} /> <span>Stop</span></button>
          </div>
        ) : (
          <button className="btn btn-red" disabled={!online} onClick={downloadPack}>
            <Icon name="download" size={18} /> <span>{online ? 'Download pack' : 'Needs a connection'}</span>
          </button>
        )}
      </section>

      <section className="dash-sec">
        <h2 className="sec-title"><Icon name="bookmark" size={18} /> Saved on this device <span className="count">{saved.length} · {fmtBytes(totalBytes)}</span></h2>
        {saved.length ? (
          <div className="saved-grid">
            {saved.map((s) => (
              <div key={s.title} className="saved">
                <a href={`#wiki/${encodeURIComponent(s.title)}`}>{s.title}</a>
                <button aria-label={`Delete ${s.title}`} onClick={() => remove(s.title)}><Icon name="trash" size={15} /></button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">No articles saved yet. Search for something and tap “Save offline”, or download the Essentials pack.</p>
        )}
      </section>

      <section className="note-card">
        <Icon name="storage" size={22} />
        <div>
          <b>Want all of Wikipedia?</b>
          <p className="muted">
            The complete English Wikipedia is about 100 GB with images (about 50 GB without). Get it as a single file with the free, open-source{' '}
            <a href="https://kiwix.org" target="_blank" rel="noreferrer" className="red">Kiwix</a> reader for phone and desktop, and keep it on a microSD card or USB drive.
          </p>
        </div>
      </section>
    </div>
  );
}

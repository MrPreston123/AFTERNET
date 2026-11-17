'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../Icon';
import { idb } from '@/lib/idb';
import { useOnline } from '@/lib/install';
import { PACK_GROUPS, WIKI_PACK, loadPackArticle, packBySlug, packByTitle, searchPack } from '@/lib/wiki-pack';
import { packsChanged } from './packs';

type Saved = { title: string; html: string; saved: number; bytes: number };
const API = 'https://en.wikipedia.org/w/api.php';

/** Cleans live Wikipedia HTML (pack articles are cleaned at build time). */
function sanitize(raw: string) {
  const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement;
  root.querySelectorAll('script,style,link,meta,iframe,object,embed,form,input,button,noscript,.mw-editsection,.navbox,.navbox-styles,.ambox,.mw-empty-elt,.reference,.mw-references-wrap,.reflist,.sistersitebox,.side-box,.metadata,.noprint,.sidebar,.hatnote').forEach((n) => n.remove());
  for (const h of Array.from(root.querySelectorAll('h2'))) {
    if (/^(References|External links|Notes|Further reading|Bibliography|Sources|Citations|See also)$/i.test(h.textContent?.trim() || '')) {
      let n: Element | null = h.closest('.mw-heading') || h;
      while (n) {
        const next: Element | null = n.nextElementSibling;
        n.remove();
        n = next;
      }
      break;
    }
  }
  root.querySelectorAll('*').forEach((el) => {
    for (const a of Array.from(el.attributes)) if (a.name.startsWith('on') || a.name === 'style' || a.name === 'srcset' || a.name === 'id') el.removeAttribute(a.name);
  });
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith('//')) img.setAttribute('src', 'https:' + src);
    img.setAttribute('loading', 'lazy');
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
    } else a.removeAttribute('href');
  });
  return root.innerHTML;
}

async function fetchLive(title: string) {
  const r = await fetch(`${API}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&formatversion=2&redirects=1&disableeditsection=1&disabletoc=1&origin=*`);
  const j = await r.json();
  if (j.error) throw new Error(j.error.info || 'Not found');
  return { title: j.parse.title as string, html: sanitize(j.parse.text) };
}

type Doc = { title: string; html: string; kind: 'pack' | 'saved' | 'live'; source?: string };

export default function Wiki({ sub }: { sub: string }) {
  const online = useOnline();
  const [group, setGroup] = useState('All');
  const [q, setQ] = useState('');
  const [live, setLive] = useState<{ title: string; snippet: string }[] | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSaved = useCallback(async () => {
    try {
      setSaved((await idb.all<Saved>('wiki')).sort((a, b) => a.title.localeCompare(b.title)));
    } catch {}
  }, []);
  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // routes: #wiki/<pack-slug>  or  #wiki/live/<Title>
  useEffect(() => {
    let dead = false;
    (async () => {
      setErr('');
      if (!sub) return setDoc(null);
      setBusy(true);
      try {
        if (sub.startsWith('live/')) {
          const title = sub.slice(5);
          const local = await idb.get<Saved>('wiki', title.toLowerCase());
          if (local) !dead && setDoc({ title: local.title, html: local.html, kind: 'saved' });
          else if (!navigator.onLine) throw new Error('This article isn’t saved on your device and you’re offline.');
          else {
            const a = await fetchLive(title);
            !dead && setDoc({ ...a, kind: 'live' });
          }
        } else {
          const a = await loadPackArticle(sub);
          !dead && setDoc({ title: a.title, html: a.html, kind: 'pack', source: a.source });
        }
      } catch (e) {
        !dead && setErr((e as Error).message);
      } finally {
        !dead && setBusy(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [sub]);

  const packHits = useMemo(() => (q.trim() ? searchPack(q, 12) : null), [q]);
  const list = useMemo(() => WIKI_PACK.articles.filter((a) => group === 'All' || a.group === group), [group]);

  const searchLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim() || !navigator.onLine) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=12&format=json&origin=*`);
      const j = await r.json();
      setLive((j.query?.search ?? []).map((h: { title: string; snippet: string }) => ({ title: h.title, snippet: h.snippet.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") })));
    } catch {
      setLive([]);
    } finally {
      setBusy(false);
    }
  };

  const openLink = (title: string) => {
    const p = packByTitle(title);
    location.hash = p ? `wiki/${p.slug}` : `wiki/live/${title}`;
  };

  if (sub) {
    const meta = doc?.kind === 'pack' ? packBySlug(sub) : null;
    return (
      <div className="pane reader wiki-reader">
        <div className="reader-bar">
          <a href="#wiki" className="back"><Icon name="back" size={16} /> Wikipedia</a>
          {doc?.kind === 'pack' && <span className="tag-ok">Saved in AFTERNET</span>}
          {doc?.kind === 'saved' && (
            <button className="btn btn-ghost btn-sm" onClick={async () => { await idb.del('wiki', doc.title.toLowerCase()); await loadSaved(); packsChanged(); setDoc({ ...doc, kind: 'live' }); }}>
              <Icon name="check" size={15} /> <span>Saved offline</span>
            </button>
          )}
          {doc?.kind === 'live' && (
            <button className="btn btn-red btn-sm" onClick={async () => { await idb.set('wiki', doc.title.toLowerCase(), { title: doc.title, html: doc.html, saved: Date.now(), bytes: doc.html.length * 2 }); await loadSaved(); packsChanged(); setDoc({ ...doc, kind: 'saved' }); }}>
              <Icon name="download" size={15} /> <span>Save offline</span>
            </button>
          )}
        </div>
        {busy && !doc && <div className="loading">Opening…</div>}
        {err && <p className="err">{err}</p>}
        {doc && (
          <>
            {meta?.image && (
              <header className="reader-hero slim">
                <img src={meta.image} alt="" />
                <div className="rh-shade" />
              </header>
            )}
            <p className="kicker">{meta ? meta.group : 'Wikipedia'}</p>
            <h1 className="reader-title">{doc.title}</h1>
            <div
              className="wiki-html prose"
              onClick={(e) => {
                const a = (e.target as HTMLElement).closest('a[data-wiki]');
                if (a) {
                  e.preventDefault();
                  openLink(a.getAttribute('data-wiki')!);
                }
              }}
              dangerouslySetInnerHTML={{ __html: doc.html }}
            />
            <p className="disclaimer">
              From Wikipedia, the free encyclopedia. Text under CC BY-SA 4.0; images from Wikimedia Commons under their own free licences.
              {doc.source && online && <> <a href={doc.source} target="_blank" rel="noreferrer" className="red">View original</a></>}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="pane">
      <div className="pane-head">
        <div>
          <p className="kicker">Wikipedia // {WIKI_PACK.articles.length} articles built in</p>
          <h1 className="pane-title">Human knowledge, <span className="red">anywhere.</span></h1>
          <p className="muted">The essential survival articles, with their images, are already inside AFTERNET. {online ? 'Search the rest of Wikipedia and save anything you need.' : ''}</p>
        </div>
        <form className="search" onSubmit={searchLive}>
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setLive(null); }} placeholder={online ? 'Search, Enter for all of Wikipedia' : 'Search saved articles…'} />
          {online && <button type="submit" className="search-go" aria-label="Search all of Wikipedia"><Icon name="globe" size={16} /></button>}
        </form>
      </div>

      {packHits && (
        <section className="home-sec">
          <h2 className="sec-title">In AFTERNET <span className="count">{packHits.length + saved.filter((s) => s.title.toLowerCase().includes(q.toLowerCase())).length}</span></h2>
          <div className="hits">
            {packHits.map((a) => (
              <a key={a.slug} href={`#wiki/${a.slug}`} className="hit">
                {a.image && <img src={a.image} alt="" loading="lazy" />}
                <div><b>{a.title}</b><small>{a.summary}</small></div>
                <Icon name="arrow" size={16} />
              </a>
            ))}
            {saved.filter((s) => s.title.toLowerCase().includes(q.toLowerCase())).map((s) => (
              <a key={s.title} href={`#wiki/live/${encodeURIComponent(s.title)}`} className="hit">
                <div><b>{s.title} <span className="tag-ok">Saved</span></b></div>
                <Icon name="arrow" size={16} />
              </a>
            ))}
          </div>
          {online && !live && <p className="muted small">Press Enter to search all of Wikipedia.</p>}
          {busy && <div className="loading">Searching…</div>}
          {live && (
            <>
              <h2 className="sec-title" style={{ marginTop: 26 }}><Icon name="globe" size={16} /> All of Wikipedia</h2>
              <div className="hits">
                {live.map((h) => (
                  <a key={h.title} href={`#wiki/live/${encodeURIComponent(h.title)}`} className="hit">
                    <div><b>{h.title}</b><small>{h.snippet}</small></div>
                    <Icon name="arrow" size={16} />
                  </a>
                ))}
                {!live.length && <p className="empty">No results.</p>}
              </div>
            </>
          )}
        </section>
      )}

      {!packHits && (
        <>
          <div className="chips">
            {['All', ...PACK_GROUPS].map((g) => (
              <button key={g} className={group === g ? 'is-on' : ''} onClick={() => setGroup(g)}>{g}</button>
            ))}
          </div>
          <div className="card-grid wiki-grid">
            {list.map((a, i) => (
              <a key={a.slug} href={`#wiki/${a.slug}`} className="card stag" style={{ ['--i' as string]: Math.min(i, 14) }}>
                <div className="card-img">{a.image ? <img src={a.image} alt="" loading="lazy" /> : <Icon name="book" size={40} />}</div>
                <div className="card-body">
                  <span className="gc-cat">{a.group}</span>
                  <h3>{a.title}</h3>
                  <p>{a.summary}</p>
                </div>
              </a>
            ))}
          </div>
          {saved.length > 0 && (
            <section className="home-sec">
              <h2 className="sec-title"><Icon name="bookmark" size={18} /> Your saved articles <span className="count">{saved.length}</span></h2>
              <div className="saved-grid">
                {saved.map((s) => (
                  <div key={s.title} className="saved">
                    <a href={`#wiki/live/${encodeURIComponent(s.title)}`}>{s.title}</a>
                    <button aria-label={`Delete ${s.title}`} onClick={async () => { await idb.del('wiki', s.title.toLowerCase()); await loadSaved(); packsChanged(); }}><Icon name="trash" size={15} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="note-card">
            <Icon name="storage" size={22} />
            <div>
              <b>Want all of Wikipedia?</b>
              <p className="muted">The complete English Wikipedia is about 100 GB with images. Keep it on a microSD card or USB drive with the free, open-source <a href="https://kiwix.org" target="_blank" rel="noreferrer" className="red">Kiwix</a> reader.</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

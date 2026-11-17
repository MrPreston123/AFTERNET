'use client';
import { useMemo, useState } from 'react';
import Icon from '../Icon';
import Markdown from '../Markdown';
import { CATEGORIES, GUIDES, GUIDE_WIKI, guideById, categoryById, searchLibrary } from '@/lib/library';
import { packBySlug } from '@/lib/wiki-pack';

const cover = (id: string) => packBySlug(GUIDE_WIKI[id] ?? '')?.image ?? null;

export default function Guides({ sub }: { sub: string }) {
  const [cat, setCat] = useState<string>(sub && (categoryById(sub) || sub === 'survive' || sub === 'rebuild') ? sub : 'all');
  const [q, setQ] = useState('');
  // "#guides/garden" style links may point at a guide or a category
  const guide = sub ? guideById(sub) : undefined;

  const list = useMemo(() => {
    if (q.trim()) {
      const seen = new Set<string>();
      return searchLibrary(q, 40).map((s) => s.guide).filter((g) => !seen.has(g.id) && seen.add(g.id));
    }
    return GUIDES.filter((g) => cat === 'all' || g.cat === cat || (cat === 'survive' && categoryById(g.cat)?.group === 'survive') || (cat === 'rebuild' && categoryById(g.cat)?.group === 'rebuild'));
  }, [q, cat]);

  if (guide) {
    const c = categoryById(guide.cat)!;
    const siblings = GUIDES.filter((g) => g.cat === guide.cat && g.id !== guide.id);
    const wiki = packBySlug(GUIDE_WIKI[guide.id] ?? '');
    return (
      <div className="pane reader">
        <a href="#guides" className="back"><Icon name="back" size={16} /> All guides</a>
        <header className="reader-hero">
          {wiki?.image && <img src={wiki.image} alt="" />}
          <div className="rh-shade" />
          <div className="rh-text">
            <p className="kicker">{c.name} · {guide.minutes} min read</p>
            <h1 className="reader-title">{guide.title}</h1>
            <p className="reader-sum">{guide.summary}</p>
          </div>
        </header>
        <article className="reader-body">
          <Markdown src={guide.body} />
          {wiki && (
            <a href={`#wiki/${wiki.slug}`} className="wiki-link">
              <Icon name="book" size={18} />
              <div><small>Read more on Wikipedia (saved offline)</small><b>{wiki.title}</b></div>
              <Icon name="arrow" size={16} />
            </a>
          )}
          <p className="disclaimer">General information, not a substitute for professional medical advice or training.</p>
        </article>
        {siblings.length > 0 && (
          <div className="related">
            <h4>More in {c.name}</h4>
            {siblings.map((g) => (
              <a key={g.id} href={`#guides/${g.id}`} className="row-link"><span>{g.title}</span><Icon name="arrow" size={16} /></a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pane">
      <div className="pane-head">
        <div>
          <p className="kicker">Survival library // built in</p>
          <h1 className="pane-title">Stay alive. <span className="red">Rebuild.</span></h1>
          <p className="muted">{GUIDES.length} field guides that live inside AFTERNET. No download, no signal needed.</p>
        </div>
        <label className="search">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides…" />
        </label>
      </div>

      {!q && (
        <div className="chips">
          <button className={cat === 'all' ? 'is-on' : ''} onClick={() => setCat('all')}>All</button>
          <button className={cat === 'survive' ? 'is-on' : ''} onClick={() => setCat('survive')}>Survive</button>
          <button className={cat === 'rebuild' ? 'is-on' : ''} onClick={() => setCat('rebuild')}>Rebuild</button>
          <span className="chip-sep" />
          {CATEGORIES.map((c) => (
            <button key={c.id} className={cat === c.id ? 'is-on' : ''} onClick={() => setCat(c.id)}>
              <Icon name={c.icon} size={15} /> {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="card-grid">
        {list.map((g, i) => {
          const c = categoryById(g.cat)!;
          const im = cover(g.id);
          return (
            <a key={g.id} href={`#guides/${g.id}`} className={`card stag ${g.urgent ? 'urgent' : ''}`} style={{ ['--i' as string]: Math.min(i, 12) }}>
              <div className="card-img">
                {im ? <img src={im} alt="" loading="lazy" /> : <Icon name={c.icon} size={40} />}
                {g.urgent && <span className="card-flag">Critical</span>}
              </div>
              <div className="card-body">
                <span className="gc-cat"><Icon name={c.icon} size={13} /> {c.name}</span>
                <h3>{g.title}</h3>
                <p>{g.summary}</p>
                <span className="gc-min">{g.minutes} min read</span>
              </div>
            </a>
          );
        })}
        {list.length === 0 && <p className="empty">No guides match “{q}”.</p>}
      </div>
    </div>
  );
}

'use client';
import { useMemo, useState } from 'react';
import Icon from '../Icon';
import Markdown from '../Markdown';
import { CATEGORIES, GUIDES, guideById, categoryById, searchLibrary } from '@/lib/library';

export default function LibraryTab({ group, sub }: { group: 'survive' | 'rebuild'; sub: string }) {
  const cats = CATEGORIES.filter((c) => c.group === group);
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');

  const guide = sub ? guideById(sub) : undefined;

  const list = useMemo(() => {
    const ids = new Set(cats.map((c) => c.id));
    if (q.trim()) {
      const seen = new Set<string>();
      return searchLibrary(q, 30)
        .map((s) => s.guide)
        .filter((g) => !seen.has(g.id) && seen.add(g.id));
    }
    return GUIDES.filter((g) => ids.has(g.cat) && (cat === 'all' || g.cat === cat));
  }, [q, cat, cats]);

  if (guide) {
    const c = categoryById(guide.cat)!;
    const siblings = GUIDES.filter((g) => g.cat === guide.cat && g.id !== guide.id);
    return (
      <div className="pane reader">
        <a href={`#${c.group === 'survive' ? 'library' : 'rebuild'}`} className="back">
          <Icon name="back" size={16} /> {c.name}
        </a>
        <article>
          <p className="kicker">{c.name} · {guide.minutes} min read</p>
          <h1 className="reader-title">{guide.title}</h1>
          <p className="reader-sum">{guide.summary}</p>
          <Markdown src={guide.body} />
          <p className="disclaimer">General information, not a substitute for professional medical advice or training.</p>
        </article>
        {siblings.length > 0 && (
          <div className="related">
            <h4>More in {c.name}</h4>
            {siblings.map((g) => (
              <a key={g.id} href={`#${c.group === 'survive' ? 'library' : 'rebuild'}/${g.id}`} className="row-link">
                <span>{g.title}</span>
                <Icon name="arrow" size={16} />
              </a>
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
          <p className="kicker">{group === 'survive' ? 'Survival library' : 'Self-sufficiency & rebuilding'}</p>
          <h1 className="pane-title">{group === 'survive' ? 'Stay alive.' : 'Rebuild.'}</h1>
          <p className="muted">Built into the app. Always available, no download needed.</p>
        </div>
        <label className="search">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guides: bleeding, water, solar…" />
        </label>
      </div>

      {!q && (
        <div className="chips">
          <button className={cat === 'all' ? 'is-on' : ''} onClick={() => setCat('all')}>All</button>
          {cats.map((c) => (
            <button key={c.id} className={cat === c.id ? 'is-on' : ''} onClick={() => setCat(c.id)}>
              <Icon name={c.icon} size={15} /> {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="guide-grid">
        {list.map((g) => {
          const c = categoryById(g.cat)!;
          return (
            <a key={g.id} href={`#${c.group === 'survive' ? 'library' : 'rebuild'}/${g.id}`} className={`guide-card ${g.urgent ? 'urgent' : ''}`}>
              <div className="gc-top">
                <span className="gc-icon"><Icon name={c.icon} size={20} /></span>
                <span className="gc-cat">{c.name}</span>
                {g.urgent && <span className="gc-urgent">Critical</span>}
              </div>
              <h3>{g.title}</h3>
              <p>{g.summary}</p>
              <span className="gc-min">{g.minutes} min</span>
            </a>
          );
        })}
        {list.length === 0 && <p className="empty">No guides match “{q}”. Try a simpler word.</p>}
      </div>
    </div>
  );
}

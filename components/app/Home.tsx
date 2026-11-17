'use client';
import { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon';
import { GUIDES, GUIDE_WIKI, categoryById, searchLibrary } from '@/lib/library';
import { packBySlug, searchPack, WIKI_PACK } from '@/lib/wiki-pack';
import { aiState, subscribeAI, MODELS, type AIState } from '@/lib/ai';
import { useOnline } from '@/lib/install';
import { usePacks } from './packs';

const img = (slug: string) => packBySlug(slug)?.image ?? null;

function Count({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

export default function Home() {
  const online = useOnline();
  const packs = usePacks();
  const [ai, setAi] = useState<AIState>(aiState());
  useEffect(() => subscribeAI(setAi), []);
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    if (q.trim().length < 2) return null;
    const seen = new Set<string>();
    const guides = searchLibrary(q, 12).map((s) => s.guide).filter((g) => !seen.has(g.id) && seen.add(g.id)).slice(0, 5);
    return { guides, wiki: searchPack(q, 5) };
  }, [q]);

  const urgent = GUIDES.filter((g) => g.urgent);
  const aiReady = ai.status === 'ready' ? `${MODELS.find((m) => m.id === ai.model)?.name} running` : packs.models ? `${packs.models} model${packs.models > 1 ? 's' : ''} on device` : 'Not downloaded';

  const services = [
    { id: 'guides', title: 'Survival Guides', icon: 'medkit', image: img('survival-kit'), stat: `${GUIDES.length} guides · built in`, ok: true },
    { id: 'wiki', title: 'Wikipedia', icon: 'book', image: img('compass'), stat: `${WIKI_PACK.articles.length} articles with images`, ok: true },
    { id: 'ai', title: 'Local AI', icon: 'chip', image: null, stat: aiReady, ok: packs.models > 0 },
    { id: 'maps', title: 'Offline Maps', icon: 'map', image: img('orienteering'), stat: packs.areas ? `${packs.areas} area${packs.areas > 1 ? 's' : ''} saved` : 'Download your region', ok: packs.areas > 0 },
    { id: 'guides/rebuild', title: 'Self-Sufficiency', icon: 'sprout', image: img('kitchen-garden'), stat: 'Grow · preserve · repair', ok: true },
  ];

  return (
    <div className="pane home">
      <section className="home-hero">
        <p className="kicker stag" style={{ ['--i' as string]: 0 }}>{online ? 'System online // prepare now' : 'Network down // running locally'}</p>
        <h1 className="home-title stag" style={{ ['--i' as string]: 1 }}>
          Knowledge, <span className="red">offline.</span>
        </h1>
        <div className="home-stats stag" style={{ ['--i' as string]: 2 }}>
          <div><b><Count to={GUIDES.length} /></b><small>Field guides</small></div>
          <div><b><Count to={WIKI_PACK.articles.length} /></b><small>Wikipedia articles</small></div>
          <div><b><Count to={packs.models} /></b><small>AI models on device</small></div>
          <div><b><Count to={packs.areas} /></b><small>Map areas</small></div>
        </div>
        <label className="omni stag" style={{ ['--i' as string]: 3 }}>
          <Icon name="search" size={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything: bleeding, purify water, solar, knots…" />
          {q && <button aria-label="Clear" onClick={() => setQ('')}><Icon name="close" size={16} /></button>}
        </label>
        {results && (
          <div className="omni-results">
            {results.guides.length + results.wiki.length === 0 && <p className="empty">Nothing found. Try a simpler word, or ask the <a href="#ai" className="red">Local AI</a>.</p>}
            {results.guides.map((g) => (
              <a key={g.id} href={`#guides/${g.id}`} className="or-row">
                <span className="or-tag">Guide</span>
                <b>{g.title}</b>
                <small>{g.summary}</small>
              </a>
            ))}
            {results.wiki.map((a) => (
              <a key={a.slug} href={`#wiki/${a.slug}`} className="or-row">
                <span className="or-tag wiki">Wiki</span>
                <b>{a.title}</b>
                <small>{a.summary}</small>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="svc-grid">
        {services.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className={`svc stag ${i === 0 ? 'svc-big' : ''}`} style={{ ['--i' as string]: i + 4 }}>
            {s.image ? <img src={s.image} alt="" loading="lazy" /> : <div className="svc-ai"><Icon name="chip" size={90} /></div>}
            <div className="svc-shade" />
            <div className="svc-body">
              <span className="svc-icon"><Icon name={s.icon} size={20} /></span>
              <h3>{s.title}</h3>
              <span className={`svc-stat ${s.ok ? 'ok' : ''}`}><i />{s.stat}</span>
            </div>
            <Icon name="arrow" size={18} className="svc-go" />
          </a>
        ))}
      </section>

      <section className="home-sec">
        <div className="sec-head">
          <h2 className="sec-title"><Icon name="medkit" size={18} /> Emergency</h2>
          <a href="#guides" className="link">All guides</a>
        </div>
        <div className="rail">
          {urgent.map((g, i) => {
            const im = img(GUIDE_WIKI[g.id] ?? '');
            return (
              <a key={g.id} href={`#guides/${g.id}`} className="rail-card stag" style={{ ['--i' as string]: i + 8 }}>
                <div className="rc-img">{im && <img src={im} alt="" loading="lazy" />}</div>
                <div className="rc-body">
                  <span className="gc-cat">{categoryById(g.cat)?.name}</span>
                  <b>{g.title}</b>
                  <small>{g.summary}</small>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <a href="#downloads" className="ready-strip stag" style={{ ['--i' as string]: 12 }}>
        <div>
          <b>Offline readiness</b>
          <small>{packs.pack ? 'Wikipedia saved' : 'Save Wikipedia'} · {packs.models ? 'AI ready' : 'Get the AI'} · {packs.areas ? 'Maps saved' : 'Download maps'}</small>
        </div>
        <div className="bar"><div style={{ width: `${((1 + (packs.pack ? 1 : 0) + (packs.models ? 1 : 0) + (packs.areas ? 1 : 0)) / 4) * 100}%` }} /></div>
        <span className="link">Downloads <Icon name="arrow" size={14} /></span>
      </a>
    </div>
  );
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import { GEAR, GEAR_CATS, gearLink } from '@/lib/gear';

const KEY = 'afternet-kit';

export default function GearShop({ compact = false }: { compact?: boolean }) {
  const [cat, setCat] = useState('All');
  const [owned, setOwned] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      setOwned(new Set(JSON.parse(localStorage.getItem(KEY) || '[]')));
    } catch {}
  }, []);
  const toggle = (id: string) => {
    const n = new Set(owned);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setOwned(n);
    try {
      localStorage.setItem(KEY, JSON.stringify([...n]));
    } catch {}
  };
  const list = useMemo(() => GEAR.filter((g) => cat === 'All' || g.cat === cat), [cat]);
  const essentials = GEAR.filter((g) => g.tier === 'Essential');
  const haveEss = essentials.filter((g) => owned.has(g.id)).length;
  const pct = Math.round((haveEss / essentials.length) * 100);

  return (
    <div className={`shop ${compact ? 'is-compact' : ''}`}>
      <div className="shop-head">
        <div>
          <p className="kicker">Survival gear</p>
          <h1 className={compact ? 'pane-title' : 'h-l'}>
            Power the system. <span className="red">Survive the rest.</span>
          </h1>
          <p className="muted">Hand-picked categories and exactly what to look for. Tick what you already own to track your kit.</p>
        </div>
        <div className="kit-meter">
          <div className="km-top">
            <b>{pct}%</b>
            <small>Essentials covered · {haveEss}/{essentials.length}</small>
          </div>
          <div className="bar"><div style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <div className="chips">
        {GEAR_CATS.map((c) => (
          <button key={c} className={cat === c ? 'is-on' : ''} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="shop-grid">
        {list.map((g) => (
          <article key={g.id} className={`gear ${owned.has(g.id) ? 'is-owned' : ''}`}>
            <div className="gear-top">
              <span className="gear-icon"><Icon name={g.icon} size={26} /></span>
              <span className={`tier t-${g.tier.toLowerCase().replace(' ', '-')}`}>{g.tier}</span>
            </div>
            <h3>{g.name}</h3>
            <p>{g.why}</p>
            <ul>
              {g.look.map((l) => <li key={l}>{l}</li>)}
            </ul>
            <div className="gear-foot">
              <span className="price">{g.price}</span>
              <button className={`own ${owned.has(g.id) ? 'on' : ''}`} onClick={() => toggle(g.id)} aria-pressed={owned.has(g.id)}>
                <span className="check-box">{owned.has(g.id) && <Icon name="check" size={12} />}</span> I have this
              </button>
            </div>
            <a href={gearLink(g)} target="_blank" rel="noreferrer sponsored" className="btn btn-red btn-sm gear-buy">
              <Icon name="cart" size={15} /> <span>Shop options</span> <Icon name="external" size={14} />
            </a>
          </article>
        ))}
      </div>
      <p className="disclaimer">Links open a product search at an external store and need an internet connection. As an affiliate we may earn from qualifying purchases. Prices are typical ranges.</p>
    </div>
  );
}

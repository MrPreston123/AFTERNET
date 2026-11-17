'use client';
import { useEffect, useState } from 'react';
import Icon from '../Icon';
import InstallButton from '../InstallButton';
import { idb, fmtBytes } from '@/lib/idb';
import { useOnline } from '@/lib/install';
import { nativeShell } from '@/lib/platform';
import { SITE } from '@/lib/config';
import { GUIDES } from '@/lib/library';
import { WIKI_PACK } from '@/lib/wiki-pack';
import { MODELS, aiState, deleteModel, downloadModel, subscribeAI, type AIState } from '@/lib/ai';
import { TILE_CACHE } from './Maps';
import { packsChanged, removeWikiPack, saveWikiPack, usePacks, writeAreas } from './packs';

function Service({ icon, title, desc, status, ok, children, i }: { icon: string; title: string; desc: string; status: string; ok?: boolean; children?: React.ReactNode; i: number }) {
  return (
    <div className={`dl stag ${ok ? 'is-ok' : ''}`} style={{ ['--i' as string]: i }}>
      <span className="dl-icon"><Icon name={icon} size={24} /></span>
      <div className="dl-main">
        <div className="dl-top">
          <h3>{title}</h3>
          <span className={`dl-status ${ok ? 'ok' : ''}`}><i />{status}</span>
        </div>
        <p className="muted">{desc}</p>
        {children && <div className="dl-act">{children}</div>}
      </div>
    </div>
  );
}

export default function Downloads() {
  const online = useOnline();
  const packs = usePacks();
  const [ai, setAi] = useState<AIState>(aiState());
  const [native, setNative] = useState<string | null>(null);
  const [wp, setWp] = useState<{ done: number; total: number } | null>(null);
  const [persist, setPersist] = useState('');
  useEffect(() => {
    setNative(nativeShell());
    return subscribeAI(setAi);
  }, []);

  const pct = packs.quota ? Math.min(100, (packs.used / packs.quota) * 100) : 0;
  const packMB = (WIKI_PACK.articles.reduce((n, a) => n + a.bytes, 0) / 1e6 + 11).toFixed(0);
  let i = 0;

  return (
    <div className="pane">
      <div className="pane-head">
        <div>
          <p className="kicker">Downloads // this device</p>
          <h1 className="pane-title">Everything, <span className="red">on board.</span></h1>
          <p className="muted">Each service below can live on this device so it keeps working with no internet. Get them while you’re connected.</p>
        </div>
        <div className="storage">
          <div className="km-top"><b>{fmtBytes(packs.used)}</b><small>used{packs.quota ? ` of ${fmtBytes(packs.quota)}` : ''}</small></div>
          <div className="bar"><div style={{ width: `${pct}%` }} /></div>
          {!native && (
            <button className="link" onClick={async () => {
              try {
                const ok = await navigator.storage?.persist?.();
                setPersist(ok ? 'Protected: the browser won’t clear it.' : 'Browser declined. Installing the app avoids this.');
              } catch { setPersist('Not supported here.'); }
            }}>Protect my data</button>
          )}
          {persist && <small className="muted">{persist}</small>}
        </div>
      </div>

      {!native && (
        <div className="install-hero stag" style={{ ['--i' as string]: i++ }}>
          <div>
            <p className="kicker">The app</p>
            <h3>Install AFTERNET</h3>
            <p className="muted">One tap. A real app for Windows and Android with the guides and Wikipedia already inside. Works with no internet.</p>
          </div>
          <InstallButton />
        </div>
      )}

      <div className="dl-list">
        <Service i={i++} icon="medkit" title="Survival Guides" desc={`${GUIDES.length} step-by-step field guides with images, from first aid to rebuilding.`} status="Built in" ok>
          <a href="#guides" className="btn btn-ghost btn-sm"><span>Open</span></a>
        </Service>

        <Service
          i={i++}
          icon="book"
          title="Wikipedia Essentials"
          desc={`${WIKI_PACK.articles.length} survival-critical articles with their images (~${packMB} MB).`}
          status={native ? 'Built in' : packs.pack ? 'Saved offline' : 'Online only'}
          ok={!!native || packs.pack}
        >
          {native ? null : wp ? (
            <div className="pack-prog">
              <div className="bar"><div style={{ width: `${(wp.done / Math.max(1, wp.total)) * 100}%` }} /></div>
              <small>{wp.done} / {wp.total} files</small>
            </div>
          ) : packs.pack ? (
            <button className="btn btn-ghost btn-sm" onClick={() => removeWikiPack()}><Icon name="trash" size={14} /><span>Remove</span></button>
          ) : (
            <button className="btn btn-red btn-sm" disabled={!online} onClick={async () => { await saveWikiPack((d, t) => setWp({ done: d, total: t })); setWp(null); }}>
              <Icon name="download" size={15} /><span>Save offline</span>
            </button>
          )}
          <a href="#wiki" className="btn btn-ghost btn-sm"><span>Browse</span></a>
        </Service>

        <Service i={i++} icon="chip" title="Local AI" desc="Private assistant that runs on this device. Pick a model size that suits it." status={packs.models ? `${packs.models} on device` : 'Not downloaded'} ok={packs.models > 0}>
          <div className="dl-models">
            {MODELS.map((m) => {
              const busy = ai.status === 'downloading' && ai.model === m.id;
              return (
                <div key={m.id} className="dl-model">
                  <div><b>{m.name}</b> <small>{m.size} · {m.note}</small></div>
                  {busy ? (
                    <div className="pack-prog"><div className="bar"><div style={{ width: `${ai.progress * 100}%` }} /></div><small>{Math.round(ai.progress * 100)}%</small></div>
                  ) : ai.cached[m.id] ? (
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteModel(m.id)}><Icon name="trash" size={14} /><span>Delete</span></button>
                  ) : (
                    <button className="btn btn-red btn-sm" disabled={!online || ai.status === 'downloading'} onClick={() => downloadModel(m.id)}><Icon name="download" size={14} /><span>Download</span></button>
                  )}
                </div>
              );
            })}
          </div>
        </Service>

        <Service i={i++} icon="map" title="Offline Maps" desc="Street-level maps of the areas you choose, plus GPS that needs no signal." status={packs.areas ? `${packs.areas} area${packs.areas > 1 ? 's' : ''} saved` : 'No areas yet'} ok={packs.areas > 0}>
          <a href="#maps" className="btn btn-red btn-sm"><Icon name="map" size={15} /><span>Choose an area</span></a>
          {packs.areas > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={async () => { if (!confirm('Delete all saved map areas?')) return; await caches.delete(TILE_CACHE); writeAreas([]); }}>
              <Icon name="trash" size={14} /><span>Delete all</span>
            </button>
          )}
        </Service>

        <Service i={i++} icon="bookmark" title="Your saved articles" desc="Any extra Wikipedia article you saved while browsing." status={`${packs.saved} saved`} ok={packs.saved > 0}>
          {packs.saved > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={async () => { if (!confirm('Delete all your saved articles?')) return; await idb.clear('wiki'); packsChanged(); }}>
              <Icon name="trash" size={14} /><span>Delete all</span>
            </button>
          )}
        </Service>
      </div>

      <section className="note-card">
        <Icon name="external" size={22} />
        <div>
          <b>Free and open source</b>
          <p className="muted">MIT licensed. Read the code, report issues or host your own copy: <a href={SITE.github} target="_blank" rel="noreferrer" className="red">{SITE.github.replace('https://', '')}</a></p>
        </div>
      </section>
      <section className="note-card">
        <Icon name="external" size={22} />
        <div>
          <b>Help & community</b>
          <p className="muted">Questions or problems? Open a private support ticket in the <a href={SITE.discord} target="_blank" rel="noreferrer" className="red">AFTERNET Discord</a>.</p>
        </div>
      </section>
      <p className="disclaimer">Map data © OpenStreetMap contributors via OpenFreeMap. Wikipedia text CC BY-SA 4.0. AI runs on llama.cpp (wllama, MIT); models under their own licences (Qwen, Llama 3.2).</p>
    </div>
  );
}

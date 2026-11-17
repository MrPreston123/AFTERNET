'use client';
import { useState } from 'react';
import Icon from '../Icon';
import InstallButton from '../InstallButton';
import { idb, fmtBytes } from '@/lib/idb';
import { useInstall, useOnline } from '@/lib/install';
import { SITE } from '@/lib/config';
import { usePacks, writeAreas, writeModel, packsChanged } from './packs';

export default function SystemTab() {
  const packs = usePacks();
  const online = useOnline();
  const { installed } = useInstall();
  const [persist, setPersist] = useState<string>('');

  const askPersist = async () => {
    try {
      const ok = await navigator.storage?.persist?.();
      setPersist(ok ? 'Storage is protected. Your browser won’t clear AFTERNET data when space runs low.' : 'Your browser declined. Installing the app usually allows it.');
    } catch {
      setPersist('Not supported in this browser.');
    }
  };

  const clearWiki = async () => {
    if (!confirm('Delete all saved Wikipedia articles from this device?')) return;
    await idb.clear('wiki');
    packsChanged();
  };
  const clearMaps = async () => {
    if (!confirm('Delete all downloaded map areas from this device?')) return;
    await caches.delete('afternet-tiles');
    writeAreas([]);
  };
  const clearAI = async () => {
    if (!confirm('Delete all downloaded AI models from this device?')) return;
    const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm');
    for (const id of ['Qwen2.5-0.5B-Instruct-q4f16_1-MLC', 'Llama-3.2-1B-Instruct-q4f16_1-MLC', 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC']) {
      await deleteModelAllInfoInCache(id).catch(() => {});
    }
    writeModel(null);
  };

  const pct = packs.quota ? Math.min(100, (packs.used / packs.quota) * 100) : 0;

  return (
    <div className="pane">
      <div className="pane-head">
        <div>
          <p className="kicker">System</p>
          <h1 className="pane-title">This device.</h1>
          <p className="muted">Install, storage and downloaded packs.</p>
        </div>
      </div>

      <section className="sys-grid">
        <div className="sys-card">
          <h3><Icon name="download" size={18} /> Install</h3>
          <p className="muted">{installed ? 'AFTERNET is installed. It opens from your home screen or desktop, even with no internet.' : 'Install AFTERNET so it opens with no internet. No app store or account needed.'}</p>
          {!installed && <InstallButton className="btn btn-red btn-sm" label="Install app" />}
        </div>

        <div className="sys-card">
          <h3><Icon name="storage" size={18} /> Storage</h3>
          <div className="bar"><div style={{ width: `${pct}%` }} /></div>
          <p className="muted small">{fmtBytes(packs.used)} used{packs.quota ? ` of ${fmtBytes(packs.quota)} available to AFTERNET` : ''}</p>
          <button className="btn btn-ghost btn-sm" onClick={askPersist}><Icon name="shield" size={15} /> <span>Protect my data</span></button>
          {persist && <p className="muted small">{persist}</p>}
        </div>

        <div className="sys-card">
          <h3><Icon name={online ? 'wifi' : 'wifiOff'} size={18} /> Test offline mode</h3>
          <ol className="small muted steps-mini">
            <li>Download your packs while connected.</li>
            <li>Turn on airplane mode.</li>
            <li>Close and reopen AFTERNET. Everything you downloaded should still work.</li>
          </ol>
        </div>
      </section>

      <section className="dash-sec">
        <h2 className="sec-title"><Icon name="layers" size={18} /> Packs on this device</h2>
        <div className="packs-list">
          <div className="pk"><div><b>Survival Library</b><small>Built into the app</small></div><span className="tag-ok">Ready</span></div>
          <div className="pk">
            <div><b>Wikipedia</b><small>{packs.wiki} articles saved</small></div>
            <a href="#wiki" className="link">Manage</a>
            {packs.wiki > 0 && <button className="link danger" onClick={clearWiki}>Delete all</button>}
          </div>
          <div className="pk">
            <div><b>Offline maps</b><small>{packs.areas} areas saved</small></div>
            <a href="#maps" className="link">Manage</a>
            {packs.areas > 0 && <button className="link danger" onClick={clearMaps}>Delete all</button>}
          </div>
          <div className="pk">
            <div><b>Local AI</b><small>{packs.model ? packs.model.split('-q4')[0] : 'No model downloaded'}</small></div>
            <a href="#ai" className="link">Manage</a>
            {packs.model && <button className="link danger" onClick={clearAI}>Delete all</button>}
          </div>
        </div>
      </section>

      <section className="note-card">
        <Icon name="external" size={22} />
        <div>
          <b>Open source</b>
          <p className="muted">
            AFTERNET is free and open source under the MIT licence. Read the code, report issues, or host your own copy:{' '}
            <a href={SITE.github} target="_blank" rel="noreferrer" className="red">{SITE.github.replace('https://', '')}</a>
          </p>
        </div>
      </section>

      <p className="disclaimer">
        Map data © OpenStreetMap contributors, served by OpenFreeMap. Wikipedia text CC BY-SA 4.0. AI models run with WebLLM (Apache 2.0). Survival guides are general information, not professional advice.
      </p>
    </div>
  );
}

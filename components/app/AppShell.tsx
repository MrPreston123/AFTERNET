'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Logo from '../Logo';
import Icon from '../Icon';
import InstallButton from '../InstallButton';
import { useOnline } from '@/lib/install';
import { nativeShell } from '@/lib/platform';
import Ambient from './Ambient';
import Home from './Home';
import Guides from './Guides';
import Wiki from './Wiki';
import Downloads from './Downloads';
import GearShop from '../GearShop';

const AI = dynamic(() => import('./AI'), { ssr: false, loading: () => <div className="loading">Loading AI…</div> });
const Maps = dynamic(() => import('./Maps'), { ssr: false, loading: () => <div className="loading">Loading maps…</div> });

export const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'guides', label: 'Guides', icon: 'medkit' },
  { id: 'wiki', label: 'Wikipedia', icon: 'book' },
  { id: 'ai', label: 'Local AI', icon: 'chip' },
  { id: 'maps', label: 'Maps', icon: 'map' },
  { id: 'downloads', label: 'Downloads', icon: 'download' },
  { id: 'gear', label: 'Gear', icon: 'cart' },
] as const;
export type TabId = (typeof TABS)[number]['id'];
const ALIAS: Record<string, TabId> = { library: 'guides', rebuild: 'guides', system: 'downloads' };

function parse(): [TabId, string] {
  const [t, ...rest] = decodeURIComponent(location.hash.slice(1)).split('/');
  const id = (ALIAS[t] ?? TABS.find((x) => x.id === t)?.id ?? 'home') as TabId;
  return [id, rest.join('/')];
}

export default function AppShell() {
  const online = useOnline();
  const [[tab, sub], setRoute] = useState<[TabId, string]>(['home', '']);
  const [visited, setVisited] = useState<Set<TabId>>(new Set());
  const [native, setNative] = useState<string | null>(null);

  useEffect(() => {
    setNative(nativeShell());
    const f = () => {
      const r = parse();
      setRoute(r);
      setVisited((v) => (v.has(r[0]) ? v : new Set(v).add(r[0])));
      scrollTo({ top: 0 });
    };
    f();
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);

  return (
    <div className={`sys ${tab === 'maps' ? 'is-maps' : ''}`}>
      <Ambient />
      <header className="sys-nav">
        <a href={native ? '#home' : '/'} className="sys-brand" title="AFTERNET">
          <Logo size={28} glow={false} />
          <span>AFTERNET</span>
        </a>
        <nav className="sys-links" aria-label="Modules">
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} className={tab === t.id ? 'is-on' : ''} aria-current={tab === t.id ? 'page' : undefined}>
              {t.label}
            </a>
          ))}
        </nav>
        <div className="sys-right">
          <span className={`pill ${online ? 'ok' : 'bad'}`} title={online ? 'Connected' : 'No connection: running from this device'}>
            <i />
            {online ? 'Online' : 'Offline'}
          </span>
          {!native && <InstallButton compact />}
        </div>
      </header>

      <main className="sys-main">
        <div className="view" key={tab + (tab === 'guides' || tab === 'wiki' ? sub : '')}>
          {tab === 'home' && <Home />}
          {tab === 'guides' && <Guides sub={sub} />}
          {tab === 'wiki' && <Wiki sub={sub} />}
          {tab === 'downloads' && <Downloads />}
          {tab === 'gear' && (
            <div className="pane">
              <GearShop compact />
            </div>
          )}
        </div>
        {/* AI and maps stay mounted once opened so a running model or map survives tab switches */}
        {visited.has('ai') && (
          <div hidden={tab !== 'ai'} className="view">
            <AI />
          </div>
        )}
        {visited.has('maps') && (
          <div hidden={tab !== 'maps'} className="maps-host">
            <Maps active={tab === 'maps'} />
          </div>
        )}
      </main>

      <nav className="sys-tabbar" aria-label="Modules">
        {TABS.filter((t) => t.id !== 'gear').map((t) => (
          <a key={t.id} href={`#${t.id}`} className={tab === t.id ? 'is-on' : ''}>
            <Icon name={t.icon} size={20} />
            <span>{t.id === 'ai' ? 'AI' : t.id === 'wiki' ? 'Wiki' : t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

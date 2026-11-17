'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Logo from '../Logo';
import Icon from '../Icon';
import { useOnline } from '@/lib/install';
import Dashboard from './Dashboard';
import LibraryTab from './LibraryTab';
import WikiTab from './WikiTab';
import SystemTab from './SystemTab';
import GearShop from '../GearShop';

const AITab = dynamic(() => import('./AITab'), { ssr: false, loading: () => <div className="loading">Loading AI module…</div> });
const MapsTab = dynamic(() => import('./MapsTab'), { ssr: false, loading: () => <div className="loading">Loading maps…</div> });

export const TABS = [
  { id: 'home', label: 'Dashboard', short: 'Home', icon: 'home' },
  { id: 'library', label: 'Survival Library', short: 'Survive', icon: 'medkit' },
  { id: 'rebuild', label: 'Self-Sufficiency', short: 'Rebuild', icon: 'layers' },
  { id: 'wiki', label: 'Wikipedia', short: 'Wiki', icon: 'book' },
  { id: 'ai', label: 'Local AI', short: 'AI', icon: 'chip' },
  { id: 'maps', label: 'Offline GPS', short: 'Maps', icon: 'map' },
  { id: 'gear', label: 'Gear', short: 'Gear', icon: 'cart' },
  { id: 'system', label: 'System', short: 'System', icon: 'storage' },
] as const;
export type TabId = (typeof TABS)[number]['id'];

export function go(tab: TabId, sub?: string) {
  location.hash = sub ? `${tab}/${sub}` : tab;
}

function parse(): [TabId, string] {
  const [t, ...rest] = decodeURIComponent(location.hash.slice(1)).split('/');
  const tab = (TABS.find((x) => x.id === t)?.id ?? 'home') as TabId;
  return [tab, rest.join('/')];
}

function Clock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    f();
    const i = setInterval(f, 15000);
    return () => clearInterval(i);
  }, []);
  return <span>{t}</span>;
}

export default function AppShell() {
  const online = useOnline();
  const [[tab, sub], setRoute] = useState<[TabId, string]>(['home', '']);
  const [visited, setVisited] = useState<Set<TabId>>(new Set(['home']));

  useEffect(() => {
    const f = () => {
      const r = parse();
      setRoute(r);
      setVisited((v) => (v.has(r[0]) ? v : new Set(v).add(r[0])));
      document.querySelector('.app-main')?.scrollTo({ top: 0 });
    };
    f();
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);

  const label = TABS.find((t) => t.id === tab)!.label;

  return (
    <div className="app">
      <aside className="app-side">
        <a href="/" className="app-brand" title="AFTERNET website">
          <Logo size={34} glow={false} />
          <div>
            <b>AFTERNET</b>
            <small>Offline Survival System</small>
          </div>
        </a>
        <nav className="app-nav" aria-label="Modules">
          {TABS.map((t) => (
            <a key={t.id} href={`#${t.id}`} className={tab === t.id ? 'is-on' : ''} aria-current={tab === t.id ? 'page' : undefined}>
              <Icon name={t.icon} size={19} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
        <div className={`app-net ${online ? 'on' : 'off'}`}>
          <Icon name={online ? 'wifi' : 'wifiOff'} size={16} />
          <div>
            <b>{online ? 'Online' : 'Offline mode'}</b>
            <small>{online ? 'Download packs while you can' : 'Running from this device'}</small>
          </div>
        </div>
      </aside>

      <div className="app-body">
        <header className="app-top">
          <div className="app-top-l">
            <a href="/" className="app-top-logo"><Logo size={24} glow={false} /></a>
            <span className="crumb">AFTERNET</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-cur">{label}</span>
          </div>
          <div className="app-top-r">
            <span className={`pill ${online ? 'ok' : 'bad'}`}>
              <i />
              {online ? 'NET ONLINE' : 'NET OFFLINE'}
            </span>
            <span className="pill"><Clock /></span>
          </div>
        </header>

        <main className="app-main">
          {tab === 'home' && <Dashboard />}
          {tab === 'library' && <LibraryTab group="survive" sub={sub} />}
          {tab === 'rebuild' && <LibraryTab group="rebuild" sub={sub} />}
          {tab === 'wiki' && <WikiTab sub={sub} />}
          {/* AI and maps stay mounted once opened so a loaded model or map isn't thrown away when switching tabs */}
          {visited.has('ai') && <div hidden={tab !== 'ai'}><AITab /></div>}
          {visited.has('maps') && <div hidden={tab !== 'maps'} className="maps-host"><MapsTab active={tab === 'maps'} /></div>}
          {tab === 'gear' && (
            <div className="pane">
              <GearShop compact />
            </div>
          )}
          {tab === 'system' && <SystemTab />}
        </main>
      </div>

      <nav className="app-tabbar" aria-label="Modules">
        {TABS.filter((t) => t.id !== 'rebuild' && t.id !== 'gear').map((t) => (
          <a key={t.id} href={`#${t.id}`} className={tab === t.id ? 'is-on' : ''}>
            <Icon name={t.icon} size={20} />
            <span>{t.short}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

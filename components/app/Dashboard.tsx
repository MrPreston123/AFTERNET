'use client';
import Icon from '../Icon';
import InstallButton from '../InstallButton';
import { GUIDES, categoryById } from '@/lib/library';
import { useInstall, useOnline } from '@/lib/install';
import { usePacks } from './packs';

export default function Dashboard() {
  const online = useOnline();
  const packs = usePacks();
  const { installed } = useInstall();
  const urgent = GUIDES.filter((g) => g.urgent);

  const checks = [
    { ok: true, label: 'Survival library', note: `${GUIDES.length} guides built in`, href: '#library' },
    { ok: installed, label: 'Installed on this device', note: installed ? 'Opens without a connection' : 'Install so it opens offline', href: '#system' },
    { ok: packs.wiki > 0, label: 'Wikipedia articles', note: packs.wiki ? `${packs.wiki} saved` : 'Download the Essentials pack', href: '#wiki' },
    { ok: packs.areas > 0, label: 'Offline maps', note: packs.areas ? `${packs.areas} area${packs.areas > 1 ? 's' : ''} saved` : 'Download your region', href: '#maps' },
    { ok: !!packs.model, label: 'Local AI model', note: packs.model ? 'Ready on this device' : 'Download a model', href: '#ai' },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <div className="pane">
      <div className="dash-hero">
        <div>
          <p className="kicker">{online ? 'Connected // prepare now' : 'Offline // running locally'}</p>
          <h1 className="pane-title">
            {online ? 'The network is up. ' : 'The network is down. '}
            <span className="red">{online ? 'Get ready.' : 'You are not.'}</span>
          </h1>
          <p className="muted">
            {online
              ? 'Load everything you need onto this device now, so it keeps working when the internet doesn’t.'
              : 'Everything below runs from this device. Pick what you need.'}
          </p>
        </div>
        <div className="ready">
          <svg viewBox="0 0 120 120" className="ready-ring">
            <circle cx="60" cy="60" r="52" />
            <circle cx="60" cy="60" r="52" style={{ strokeDashoffset: 327 - (327 * score) / 100 }} />
          </svg>
          <div className="ready-val">
            <b>{packs.ready ? score : '–'}%</b>
            <small>Offline ready</small>
          </div>
        </div>
      </div>

      <section className="dash-sec">
        <h2 className="sec-title"><Icon name="medkit" size={18} /> Emergency quick cards</h2>
        <div className="quick-grid">
          {urgent.map((g) => {
            const c = categoryById(g.cat)!;
            return (
              <a key={g.id} href={`#${c.group === 'survive' ? 'library' : 'rebuild'}/${g.id}`} className="quick">
                <Icon name={c.icon} size={22} />
                <b>{g.title}</b>
                <small>{g.summary}</small>
              </a>
            );
          })}
        </div>
      </section>

      <section className="dash-sec">
        <h2 className="sec-title"><Icon name="download" size={18} /> Offline readiness</h2>
        <div className="checks">
          {checks.map((c) => (
            <a key={c.label} href={c.href} className={`check ${c.ok ? 'ok' : ''}`}>
              <span className="check-box">{c.ok && <Icon name="check" size={14} />}</span>
              <div>
                <b>{c.label}</b>
                <small>{c.note}</small>
              </div>
              <Icon name="arrow" size={16} />
            </a>
          ))}
        </div>
        {!installed && (
          <div className="dash-install">
            <p>Install AFTERNET so it opens with no internet, straight from your home screen or desktop.</p>
            <InstallButton className="btn btn-red btn-sm" label="Install app" />
          </div>
        )}
      </section>

      <section className="dash-sec">
        <h2 className="sec-title"><Icon name="layers" size={18} /> Modules</h2>
        <div className="mod-mini">
          {[
            ['wiki', 'book', 'Wikipedia', 'Search, read and save articles'],
            ['ai', 'chip', 'Local AI', 'Ask questions, fully on-device'],
            ['maps', 'map', 'Offline GPS', 'Maps and your live position'],
            ['rebuild', 'sprout', 'Self-Sufficiency', 'Grow, preserve, repair'],
            ['gear', 'cart', 'Gear', 'Essential kit to buy'],
          ].map(([id, ic, t, d]) => (
            <a key={id} href={`#${id}`} className="mm">
              <Icon name={ic} size={22} />
              <b>{t}</b>
              <small>{d}</small>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

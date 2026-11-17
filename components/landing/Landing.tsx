'use client';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import Nav from '../Nav';
import Logo from '../Logo';
import Icon from '../Icon';
import InstallButton from '../InstallButton';
import { useOnline } from '@/lib/install';
import { sceneState } from '@/lib/scene-state';
import { SITE, TOKEN } from '@/lib/config';
import { GEAR, gearLink } from '@/lib/gear';
import { useScrollDirector, usePinProgress, range, Words } from './motion';

const Scene = dynamic(() => import('../three/Scene'), { ssr: false });

/* ─────────────── HERO ─────────────── */
function Hero() {
  const online = useOnline();
  return (
    <section className="hero" data-scene="hero" id="top">
      <div className="hud hud-tl">
        <span className={`dot ${online ? 'on' : 'off'}`} />
        <span>NETWORK // {online ? 'ONLINE' : 'OFFLINE'}</span>
      </div>
      <div className="hud hud-tr">
        <span>SYS.VER 1.0</span>
        <span>{SITE.ticker}</span>
      </div>
      <div className="hero-inner">
        <p className="kicker rv-h">Offline survival system</p>
        <h1 className="wordmark rv-h" style={{ animationDelay: '.12s' }} aria-label="AFTERNET">
          <span className="wm-a">Λ</span>FTERNET
        </h1>
        <p className="hero-tag rv-h" style={{ animationDelay: '.24s' }}>
          An offline survival system for a <em>post-internet</em> world
        </p>
        <div className="hero-cta rv-h" style={{ animationDelay: '.36s' }}>
          <a href="/app/" className="btn btn-red">
            <Icon name="power" size={18} />
            <span>Launch the system</span>
          </a>
          <InstallButton />
        </div>
      </div>
      <a className="scroll-cue" href="#dark">
        <span>Scroll to cut the cable</span>
        <i />
      </a>
    </section>
  );
}

/* ─────────────── THE INTERNET GOES DARK ─────────────── */
const DEAD = ['Google', 'Wikipedia', 'ChatGPT', 'GPS maps'];
function Collapse() {
  const lines = useRef<(HTMLLIElement | null)[]>([]);
  const links = useRef<HTMLSpanElement>(null);
  const loss = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const ref = usePinProgress((p) => {
    const c = range(p, 0.12, 0.86);
    sceneState.collapse = c;
    lines.current.forEach((el, i) => {
      if (!el) return;
      const at = 0.18 + i * 0.16;
      el.classList.toggle('is-in', p > at - 0.12);
      el.classList.toggle('is-dead', p > at);
    });
    if (links.current) links.current.textContent = String(Math.round(46 * (1 - c))).padStart(2, '0');
    if (loss.current) loss.current.textContent = (c * 100).toFixed(1);
    if (bar.current) bar.current.style.transform = `scaleX(${1 - c})`;
    if (title.current) title.current.style.opacity = String(1 - range(p, 0.86, 1) * 0.6);
  });
  return (
    <section ref={ref} className="collapse" data-scene="collapse" id="dark">
      <div className="pin">
        <div className="collapse-grid">
          <div>
            <p className="kicker">Scenario // 00:00:00</p>
            <h2 ref={title} className="h-l collapse-title">
              What happens when the internet <span className="red">goes dark?</span>
            </h2>
          </div>
          <ul className="dead-list">
            {DEAD.map((d, i) => (
              <li key={d} ref={(el) => void (lines.current[i] = el)}>
                <span className="no">No</span> <span className="name">{d}.</span>
                <span className="tag">SIGNAL LOST</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="telemetry">
          <div>
            <span className="t-label">Global links active</span>
            <span className="t-val"><span ref={links}>46</span>/46</span>
          </div>
          <div className="t-bar"><div ref={bar} /></div>
          <div>
            <span className="t-label">Packet loss</span>
            <span className="t-val"><span ref={loss}>0.0</span>%</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── BOOT ─────────────── */
const BOOT = [
  ['afternet --boot --offline', ''],
  ['mounting knowledge base', 'OK'],
  ['loading survival library // 11 domains', 'OK'],
  ['local inference engine // on-device', 'OK'],
  ['gps receiver // no network required', 'OK'],
  ['external dependencies', 'NONE'],
];
function Boot() {
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const logo = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const ref = usePinProgress((p) => {
    sceneState.boot = range(p, 0.1, 0.7);
    rows.current.forEach((el, i) => el?.classList.toggle('is-in', p > 0.05 + i * 0.07));
    if (logo.current) {
      const l = range(p, 0.42, 0.72);
      logo.current.style.setProperty('--draw', String(l));
      logo.current.style.opacity = String(range(p, 0.38, 0.5));
    }
    if (copy.current) copy.current.classList.toggle('is-in', p > 0.66);
  });
  return (
    <section ref={ref} className="boot" data-scene="boot">
      <div className="pin">
        <div className="boot-log" aria-hidden="true">
          {BOOT.map(([t, s], i) => (
            <div key={t} className="boot-row" ref={(el) => void (rows.current[i] = el)}>
              <span className="prompt">{i === 0 ? '$' : '›'}</span> {t}
              {s && <b className={s === 'NONE' ? 'red' : ''}>[{s}]</b>}
            </div>
          ))}
        </div>
        <div className="boot-center">
          <div ref={logo} className="boot-logo">
            <Logo size={150} />
          </div>
          <div ref={copy} className="boot-copy">
            <h2 className="h-l">AFTERNET is online. <span className="muted">Nothing else is.</span></h2>
            <p>
              An offline survival system anyone can download straight onto their phone or computer. Everything runs locally, without the
              internet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── MODULES ─────────────── */
const MODULES = [
  { n: '01', icon: 'book', tab: 'wiki', title: 'Offline Wikipedia', text: 'Human knowledge, anywhere. Search and read Wikipedia, then save articles and essential packs to your device.', specs: ['Search millions of articles', 'One-tap Essentials pack', 'Full Wikipedia via Kiwix files'] },
  { n: '02', icon: 'medkit', tab: 'library', title: 'Survival Library', text: 'First aid, water, food, shelter, power, navigation. Clear, step-by-step field guides built for stress.', specs: ['25+ field guides', 'Emergency quick cards', 'Zero-download, always there'] },
  { n: '03', icon: 'chip', tab: 'ai', title: 'Local AI', text: 'Your own AI assistant running entirely on your device. Ask anything. No servers ever see your questions.', specs: ['Runs on your GPU', 'Grounded in the survival library', 'Private by design'] },
  { n: '04', icon: 'map', tab: 'maps', title: 'Offline GPS', text: 'Download maps of your region and navigate without Wi-Fi or mobile data. GPS talks to satellites, not the internet.', specs: ['Download any area', 'Live position & heading', 'Saved waypoints'] },
  { n: '05', icon: 'layers', tab: 'rebuild', title: 'Self-Sufficiency', text: 'Guides to survive the long haul and rebuild without modern infrastructure: grow, preserve, repair, organise.', specs: ['Gardens & seed saving', 'Food preservation', 'Tools & community'] },
];
function Modules() {
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const ref = usePinProgress((p) => {
    if (!track.current || innerWidth < 900) return;
    const max = track.current.scrollWidth - innerWidth + 80;
    const t = range(p, 0.08, 0.95);
    track.current.style.transform = `translate3d(${-max * t}px,0,0)`;
    if (fill.current) fill.current.style.transform = `scaleX(${t})`;
    track.current.querySelectorAll<HTMLElement>('.mod').forEach((c) => {
      const r = c.getBoundingClientRect();
      const off = (r.left + r.width / 2 - innerWidth / 2) / innerWidth;
      c.style.setProperty('--ry', `${off * -14}deg`);
      c.style.setProperty('--o', String(1 - Math.min(0.55, Math.abs(off) * 0.6)));
    });
  });
  return (
    <section ref={ref} className="modules" data-scene="modules" id="modules">
      <div className="pin">
        <div className="mod-head">
          <p className="kicker">The system // 5 modules</p>
          <h2 className="h-l">Everything runs <span className="red">locally.</span></h2>
          <div className="mod-progress"><div ref={fill} /></div>
        </div>
        <div ref={track} className="mod-track">
          {MODULES.map((m) => (
            <a key={m.n} href={`/app/#${m.tab}`} className="mod hot">
              <div className="mod-top">
                <span className="mod-n">{m.n}</span>
                <span className="mod-icon"><Icon name={m.icon} size={30} /></span>
              </div>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <ul>
                {m.specs.map((s) => <li key={s}>{s}</li>)}
              </ul>
              <span className="mod-go">Open module <Icon name="arrow" size={16} /></span>
              <i className="mod-corner tl" /><i className="mod-corner br" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── HOW / NO SERVERS ─────────────── */
function How() {
  return (
    <section className="how" data-scene="how" id="how">
      <div className="wrap">
        <div className="no-stack">
          {['No servers.', 'No subscriptions.', 'No internet required.'].map((t, i) => (
            <h2 key={t} className={`h-xxl split-words ${i === 2 ? 'red' : ''}`}><Words text={t} /></h2>
          ))}
        </div>
        <div className="how-grid">
          <div className="how-copy rv">
            <p className="kicker">Deploy // 3 steps</p>
            <h3 className="h-m">Prepare while the lights are on.</h3>
            <p className="muted">The website shows you the system. The installed app works on its own, even if the internet disappears completely.</p>
          </div>
          <ol className="steps">
            {[
              ['Install', 'Add AFTERNET to your phone or computer from the browser. No app store, no account, no tracking.', 'download'],
              ['Load your packs', 'Download Wikipedia articles, maps of your region and the local AI model you want.', 'storage'],
              ['Go dark', 'Switch on airplane mode. Everything keeps working, directly from your device.', 'wifiOff'],
            ].map(([t, d, ic], i) => (
              <li key={t} className="rv" data-d={String(i * 0.08)}>
                <span className="step-n">0{i + 1}</span>
                <Icon name={ic} size={26} />
                <div>
                  <h4>{t}</h4>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="storage-table rv">
          <div className="st-row st-head"><span>Pack</span><span>Size on device</span><span>Needs</span></div>
          <div className="st-row"><span>Survival Library</span><span>Built in</span><span>Nothing</span></div>
          <div className="st-row"><span>Wikipedia Essentials</span><span>~5–15 MB</span><span>Any device</span></div>
          <div className="st-row"><span>Offline maps (one city)</span><span>~20–150 MB</span><span>Any device</span></div>
          <div className="st-row"><span>Local AI model</span><span>0.4–0.9 GB</span><span>WebGPU (recent Chrome / Edge / Safari)</span></div>
          <div className="st-row"><span>Full Wikipedia (Kiwix)</span><span>~100 GB</span><span>Free Kiwix reader</span></div>
        </div>
        <div className="oss rv">
          <div>
            <p className="kicker">Open source // MIT</p>
            <h3 className="h-m">Every line is public.</h3>
            <p className="muted">Knowledge shouldn&apos;t depend on one company, and neither should this. Read the code, fork it, host your own copy, put it on a USB stick.</p>
          </div>
          <a href={SITE.github} target="_blank" rel="noreferrer" className="btn btn-ghost">
            <Icon name="external" size={18} />
            <span>View source on GitHub</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── GEAR TEASER ─────────────── */
function GearTeaser() {
  const picks = GEAR.filter((g) => ['solar-bank', 'crank-radio', 'water-filter', 'trauma-kit'].includes(g.id));
  return (
    <section className="gear-teaser" data-scene="gear" id="gear">
      <div className="wrap">
        <div className="gt-head">
          <div>
            <p className="kicker">Field kit</p>
            <h2 className="h-l rv">Software is half the kit.</h2>
          </div>
          <p className="muted rv">Your phone is only useful while it has power. These are the essentials that keep AFTERNET, and you, running.</p>
        </div>
        <div className="gt-grid">
          {picks.map((g, i) => (
            <a key={g.id} href={gearLink(g)} target="_blank" rel="noreferrer sponsored" className="gt-card rv hot" data-d={String(i * 0.06)}>
              <span className="tier">{g.tier}</span>
              <Icon name={g.icon} size={34} />
              <h4>{g.name}</h4>
              <p>{g.why}</p>
              <span className="price">{g.price}</span>
            </a>
          ))}
        </div>
        <a href="/gear/" className="btn btn-red rv">
          <Icon name="cart" size={18} />
          <span>Browse all survival gear</span>
        </a>
      </div>
    </section>
  );
}

/* ─────────────── TOKEN ─────────────── */
function Token() {
  const [copied, setCopied] = useState(false);
  return (
    <section className="token" data-scene="token" id="token">
      <div className="wrap token-inner">
        <p className="kicker rv">The community</p>
        <h2 className="token-ticker rv">{SITE.ticker}</h2>
        <p className="muted rv token-lede">The token behind the movement to keep knowledge offline, open and in everyone&apos;s hands.</p>
        <div className="ca rv">
          <span className="ca-label">CA</span>
          <code>{TOKEN.ca || 'Coming soon'}</code>
          {TOKEN.ca && (
            <button
              className="ca-copy"
              onClick={() => {
                navigator.clipboard?.writeText(TOKEN.ca);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Icon name={copied ? 'check' : 'copy'} size={16} />
            </button>
          )}
        </div>
        <div className="token-links rv">
          {[
            ['Buy', TOKEN.buyUrl],
            ['Chart', TOKEN.chartUrl],
            ['X / Twitter', TOKEN.xUrl],
            ['Telegram', TOKEN.telegramUrl],
          ].map(([l, u]) =>
            u ? (
              <a key={l} href={u} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">{l}</a>
            ) : (
              <span key={l} className="btn btn-ghost btn-sm is-off">{l}</span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FINAL ─────────────── */
function Final() {
  return (
    <section className="final" data-scene="final">
      <div className="wrap final-inner">
        <Logo size={64} />
        <h2 className="h-xl split-words"><Words text="The internet is temporary." /></h2>
        <h2 className="h-xl split-words red"><Words text="Knowledge shouldn’t be." /></h2>
        <div className="hero-cta rv">
          <a href="/app/" className="btn btn-red">
            <Icon name="power" size={18} />
            <span>Launch the system</span>
          </a>
          <InstallButton />
        </div>
      </div>
      <footer className="foot">
        <span>© {new Date().getFullYear()} AFTERNET · {SITE.ticker}</span>
        <span className="muted">Guides are general information, not a substitute for professional training. Gear links may earn a commission.</span>
        <a href={SITE.github} target="_blank" rel="noreferrer">Open source on GitHub</a>
      </footer>
    </section>
  );
}

export default function Landing() {
  useScrollDirector();
  return (
    <>
      <div className="scene-wrap" aria-hidden="true">
        <Scene />
      </div>
      <div className="scanlines" aria-hidden="true" />
      <Nav />
      <main className="landing">
        <Hero />
        <Collapse />
        <Boot />
        <Modules />
        <How />
        <GearTeaser />
        <Token />
        <Final />
      </main>
    </>
  );
}

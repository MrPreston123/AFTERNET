'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { useInstall } from '@/lib/install';
import { DOWNLOADS, detectOS, type OS } from '@/lib/platform';
import { SITE } from '@/lib/config';
import DiscordCard from './Discord';

type Release = { tag: string; date: string; sizes: Record<string, number> };

/** Live info about the latest GitHub release (version + real file sizes), with a static fallback. */
function useRelease() {
  const [r, setR] = useState<Release | null>(null);
  useEffect(() => {
    const repo = SITE.github.replace('https://github.com/', '');
    fetch(`https://api.github.com/repos/${repo}/releases/latest`)
      .then((x) => (x.ok ? x.json() : null))
      .then((j) => {
        if (!j) return;
        const sizes: Record<string, number> = {};
        for (const a of j.assets ?? []) sizes[a.name] = a.size;
        setR({ tag: j.tag_name, date: j.published_at, sizes });
      })
      .catch(() => {});
  }, []);
  return r;
}

function QR({ url }: { url: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    import('qrcode').then((q) => q.toString(url, { type: 'svg', margin: 1, color: { dark: '#f1f1f1', light: '#0000' }, errorCorrectionLevel: 'M' }).then(setSvg));
  }, [url]);
  return <div className="qr" aria-label="QR code to download the Android app" dangerouslySetInnerHTML={{ __html: svg }} />;
}

const mb = (n?: number) => (n ? `${(n / 1e6).toFixed(0)} MB` : null);

export default function DownloadCards() {
  const rel = useRelease();
  const [os, setOs] = useState<OS>('other');
  const [help, setHelp] = useState<null | 'windows' | 'android'>(null);
  const { canPrompt, prompt } = useInstall();
  useEffect(() => setOs(detectOS()), []);

  return (
    <div className="dlc">
      <div className="dlc-grid">
        {/* Windows */}
        <article className={`dlc-card ${os === 'windows' ? 'is-yours' : ''}`}>
          {os === 'windows' && <span className="dlc-yours">Your device</span>}
          <div className="dlc-head">
            <span className="dlc-os">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M3 5.1 10.4 4v7.1H3zm0 13.8 7.4 1.1v-7H3zm8.3 1.2L21 21.5V13h-9.7zm0-16.2V11H21V2.5z" /></svg>
            </span>
            <div>
              <h3>Windows</h3>
              <small>Windows 10 & 11 · 64-bit</small>
            </div>
          </div>
          <ul>
            <li>One-click installer: installs, adds shortcuts, opens</li>
            <li>Guides & Wikipedia built in, works with no internet</li>
            <li>Local AI uses your graphics card</li>
          </ul>
          <a href={DOWNLOADS.windows.url} className="btn btn-red dlc-btn" onClick={() => setHelp('windows')} download>
            <Icon name="download" size={18} />
            <span>Download for Windows</span>
            <small className="btn-sub">{mb(rel?.sizes[DOWNLOADS.windows.file]) ?? DOWNLOADS.windows.size}</small>
          </a>
          <p className="dlc-note">Not code-signed yet: if Windows warns, click <b>More info → Run anyway</b>.</p>
        </article>

        {/* Android */}
        <article className={`dlc-card ${os === 'android' ? 'is-yours' : ''}`}>
          {os === 'android' && <span className="dlc-yours">Your device</span>}
          <div className="dlc-head">
            <span className="dlc-os">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><path d="M17.6 9.48 19.44 6.3a.38.38 0 0 0-.66-.38l-1.86 3.22a11.4 11.4 0 0 0-9.84 0L5.22 5.92a.38.38 0 0 0-.66.38L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" /></svg>
            </span>
            <div>
              <h3>Android</h3>
              <small>Android 7.0 and newer</small>
            </div>
          </div>
          <div className="dlc-android">
            <ul>
              <li>Tap to download, then <b>Install</b></li>
              <li>Guides & Wikipedia built in, works in airplane mode</li>
              <li>GPS maps with no signal</li>
            </ul>
            {os !== 'android' && (
              <div className="dlc-qr">
                <QR url={DOWNLOADS.android.url} />
                <small>Scan with your phone</small>
              </div>
            )}
          </div>
          <a href={DOWNLOADS.android.url} className="btn btn-red dlc-btn" onClick={() => setHelp('android')} download>
            <Icon name="download" size={18} />
            <span>Download for Android</span>
            <small className="btn-sub">{mb(rel?.sizes[DOWNLOADS.android.file]) ?? DOWNLOADS.android.size}</small>
          </a>
          <p className="dlc-note">If asked, allow your browser to <b>install unknown apps</b>.</p>
        </article>
      </div>

      <div className="dlc-more">
        <div>
          <b>iPhone, Mac or Linux?</b>
          <span className="muted"> Use AFTERNET in your browser and add it to your home screen. It works offline too.</span>
        </div>
        <div className="dlc-more-act">
          {canPrompt ? (
            <button className="btn btn-ghost btn-sm" onClick={() => prompt()}><Icon name="download" size={15} /><span>Install in browser</span></button>
          ) : (
            <a href="/app/" className="btn btn-ghost btn-sm"><Icon name="power" size={15} /><span>Open in browser</span></a>
          )}
        </div>
      </div>

      <section className="oss-trust">
        <div className="ot-head">
          <span className="ot-icon"><Icon name="shield" size={26} /></span>
          <div>
            <p className="kicker">Fully open source // MIT licence</p>
            <h3>Don’t trust us. Verify.</h3>
          </div>
        </div>
        <p className="muted ot-lede">
          Software you rely on in an emergency has to be trustworthy. That’s why every line of AFTERNET is public on GitHub, so anyone can check exactly what it does before installing it.
        </p>
        <div className="ot-grid">
          <div>
            <b>Read every line</b>
            <span>The website, the apps and the survival guides are all public code. Nothing is hidden.</span>
          </div>
          <div>
            <b>Built in public</b>
            <span>The installers are built automatically by GitHub from that public code, not on someone’s private machine.</span>
          </div>
          <div>
            <b>No accounts, no trackers</b>
            <span>No sign-up, no analytics, no ads. Your AI questions and GPS position never leave your device.</span>
          </div>
          <div>
            <b>Check your download</b>
            <span>Every release lists SHA-256 checksums so you can confirm the file you got is the file that was built.</span>
          </div>
        </div>
        <div className="ot-act">
          <a href={SITE.github} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Icon name="external" size={15} /><span>View the source code</span></a>
          <a href={`${SITE.github}/actions/workflows/release.yml`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Icon name="tool" size={15} /><span>See the public builds</span></a>
          <a href={DOWNLOADS.releases} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Icon name="check" size={15} /><span>Checksums</span></a>
        </div>
      </section>

      <p className="dlc-meta">
        {rel ? <>Latest version <b>{rel.tag}</b> · {new Date(rel.date).toLocaleDateString()} · </> : null}
        <a href={DOWNLOADS.releases} target="_blank" rel="noreferrer">Release notes & SHA-256 checksums</a> ·{' '}
        <a href={SITE.github} target="_blank" rel="noreferrer">Source code</a>
      </p>

      <DiscordCard compact />

      {help && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setHelp(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setHelp(null)} aria-label="Close"><Icon name="close" size={18} /></button>
            <p className="kicker">Download started</p>
            <h3>{help === 'windows' ? 'Install on Windows' : 'Install on Android'}</h3>
            <ol className="steps-mini">
              {help === 'windows' ? (
                <>
                  <li>Open <b>AFTERNET-Setup.exe</b> from your downloads.</li>
                  <li>If Windows shows “Windows protected your PC”, click <b>More info</b> → <b>Run anyway</b>.</li>
                  <li>AFTERNET installs and opens. It’s in your Start menu and on your desktop.</li>
                </>
              ) : (
                <>
                  <li>Open <b>AFTERNET.apk</b> from your notifications or Downloads.</li>
                  <li>If asked, allow your browser to <b>install unknown apps</b>, then tap <b>Install</b>.</li>
                  <li>Open AFTERNET from your app drawer.</li>
                </>
              )}
            </ol>
            <p className="muted small">Stuck? Open a support ticket in our <a href={SITE.discord} target="_blank" rel="noreferrer" className="red">Discord</a>.</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setHelp(null)}><span>Got it</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { useInstall } from '@/lib/install';
import { DOWNLOADS, detectOS, nativeShell, type OS } from '@/lib/platform';

/**
 * The one install button. Windows → native installer, Android → APK, anything else → browser install (PWA).
 * Hidden inside the installed apps.
 */
export default function InstallButton({ className, compact = false, label }: { className?: string; compact?: boolean; label?: string }) {
  const { canPrompt, prompt, installed } = useInstall();
  const [os, setOs] = useState<OS>('other');
  const [native, setNative] = useState<string | null>(null);
  const [open, setOpen] = useState<null | 'windows' | 'android' | 'other'>(null);
  useEffect(() => {
    setOs(detectOS());
    setNative(nativeShell());
  }, []);
  if (native) return null;

  const cls = className ?? (compact ? 'btn btn-red btn-sm' : 'btn btn-red');
  const dl = os === 'windows' ? DOWNLOADS.windows : os === 'android' ? DOWNLOADS.android : null;
  const text = label ?? (compact ? 'Install' : dl ? dl.label : installed ? 'Installed' : 'Install the app');

  return (
    <>
      {dl ? (
        <a className={cls} href={dl.url} onClick={() => setOpen(os as 'windows' | 'android')} download>
          <Icon name="download" size={compact ? 16 : 18} />
          <span>{text}</span>
          {!compact && <small className="btn-sub">{dl.size}</small>}
        </a>
      ) : (
        <button
          className={cls}
          onClick={async () => {
            if (canPrompt && (await prompt())) return;
            setOpen('other');
          }}
        >
          <Icon name="download" size={compact ? 16 : 18} />
          <span>{text}</span>
        </button>
      )}

      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Install AFTERNET" onClick={() => setOpen(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setOpen(null)} aria-label="Close"><Icon name="close" size={18} /></button>
            <p className="kicker">Install // {open === 'other' ? 'this device' : open}</p>
            {open === 'windows' && (
              <>
                <h3>Your download has started</h3>
                <ol className="steps-mini">
                  <li>Open <b>{DOWNLOADS.windows.file}</b> from your downloads. It installs and launches by itself.</li>
                  <li>If Windows shows “Windows protected your PC”, click <b>More info</b> → <b>Run anyway</b>. The app is open source and not yet code-signed.</li>
                  <li>AFTERNET appears in your Start menu and on your desktop.</li>
                </ol>
              </>
            )}
            {open === 'android' && (
              <>
                <h3>Your download has started</h3>
                <ol className="steps-mini">
                  <li>Tap <b>{DOWNLOADS.android.file}</b> in your notifications or Downloads.</li>
                  <li>If asked, allow your browser to <b>install unknown apps</b>, then tap <b>Install</b>.</li>
                  <li>Open AFTERNET from your app drawer.</li>
                </ol>
              </>
            )}
            {open === 'other' && (
              <>
                <h3>Install AFTERNET</h3>
                <p className="muted">Native installers are available for Windows and Android. On this device, add AFTERNET from your browser: it then works offline.</p>
                <ol className="steps-mini">
                  {os === 'ios' ? (
                    <>
                      <li>Open this page in <b>Safari</b>.</li>
                      <li>Tap <b>Share</b> → <b>Add to Home Screen</b>.</li>
                    </>
                  ) : (
                    <>
                      <li>Use <b>Chrome</b> or <b>Edge</b>.</li>
                      <li>Click the <b>install icon</b> in the address bar, or the browser menu → <b>Install AFTERNET</b>.</li>
                    </>
                  )}
                  <li>Open AFTERNET and grab your packs under <b>Downloads</b>.</li>
                </ol>
                <div className="modal-alt">
                  <a href={DOWNLOADS.windows.url} className="link">Windows installer</a>
                  <a href={DOWNLOADS.android.url} className="link">Android APK</a>
                  <a href={DOWNLOADS.releases} target="_blank" rel="noreferrer" className="link">All releases</a>
                </div>
              </>
            )}
            <a className="btn btn-ghost btn-sm" href={DOWNLOADS.releases} target="_blank" rel="noreferrer">
              <Icon name="external" size={15} /> <span>Release notes & checksums</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

'use client';
import { useState } from 'react';
import Icon from './Icon';
import { useInstall } from '@/lib/install';

/** One button that installs AFTERNET as an offline app on any device, or explains how. */
export default function InstallButton({ className = 'btn btn-ghost', label = 'Download the app' }: { className?: string; label?: string }) {
  const { canPrompt, prompt, platform, installed } = useInstall();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={className}
        onClick={async () => {
          if (canPrompt && (await prompt())) return;
          setOpen(true);
        }}
      >
        <Icon name="download" size={18} />
        <span>{installed ? 'Installed' : label}</span>
      </button>
      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Install AFTERNET" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setOpen(false)} aria-label="Close">
              <Icon name="close" size={18} />
            </button>
            <p className="kicker">Install // offline mode</p>
            <h3>Put AFTERNET on this device</h3>
            <p className="muted">AFTERNET installs straight from the browser: no app store, no account. Once installed, it opens and runs with no connection.</p>
            <ol className="steps-mini">
              {platform === 'ios' && (
                <>
                  <li>Open this page in <b>Safari</b>.</li>
                  <li>Tap the <b>Share</b> button, then <b>Add to Home Screen</b>.</li>
                  <li>Open AFTERNET from your home screen and download your packs under <b>System</b>.</li>
                </>
              )}
              {platform === 'android' && (
                <>
                  <li>Open this page in <b>Chrome</b>.</li>
                  <li>Tap the <b>⋮</b> menu, then <b>Install app</b> (or <b>Add to Home screen</b>).</li>
                  <li>Open AFTERNET and download your packs under <b>System</b>.</li>
                </>
              )}
              {platform === 'desktop' && (
                <>
                  <li>Use <b>Chrome</b> or <b>Edge</b> on Windows, macOS or Linux.</li>
                  <li>Click the <b>install icon</b> at the right of the address bar, or open the browser menu and choose <b>Install AFTERNET</b>.</li>
                  <li>Launch it from your Start menu, dock or desktop and download your packs under <b>System</b>.</li>
                </>
              )}
            </ol>
            <a className="btn btn-red" href="/app/#system">
              <span>Open the app now</span>
              <Icon name="arrow" size={18} />
            </a>
          </div>
        </div>
      )}
    </>
  );
}

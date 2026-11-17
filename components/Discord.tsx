'use client';
import { useEffect, useState } from 'react';
import { SITE } from '@/lib/config';

export function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.32 4.37A19.8 19.8 0 0 0 15.4 2.8a13.7 13.7 0 0 0-.63 1.3 18.4 18.4 0 0 0-5.53 0 13 13 0 0 0-.64-1.3 19.7 19.7 0 0 0-4.92 1.53C.56 9.04-.29 13.6.13 18.1a19.9 19.9 0 0 0 6.04 3.05c.49-.66.92-1.36 1.29-2.1a12.9 12.9 0 0 1-2.03-.97l.5-.39a14.2 14.2 0 0 0 12.14 0l.5.39c-.65.38-1.33.71-2.04.97.37.74.8 1.44 1.29 2.1a19.8 19.8 0 0 0 6.04-3.05c.5-5.22-.84-9.74-3.54-13.73ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}

/** Live member / online counts from Discord's public invite endpoint (no key needed). */
function useDiscordCounts() {
  const [c, setC] = useState<{ members: number; online: number } | null>(null);
  useEffect(() => {
    const code = SITE.discord.split('/').pop();
    if (!code) return;
    fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setC({ members: d.approximate_member_count, online: d.approximate_presence_count }))
      .catch(() => {});
  }, []);
  return c;
}

/** Full community card: used on the landing page and the download page. */
export default function DiscordCard({ compact = false }: { compact?: boolean }) {
  const c = useDiscordCounts();
  return (
    <div className={`discord-card ${compact ? 'is-compact' : ''}`}>
      <div className="dc-icon"><DiscordIcon size={compact ? 26 : 34} /></div>
      <div className="dc-body">
        <p className="kicker">Community</p>
        <h3>{compact ? 'Need help? Ask the community.' : 'Join the AFTERNET Discord'}</h3>
        <p className="muted">
          Official download links, release news, survival tips, voice chats and AMAs, plus <b>private tech-support tickets</b> with the team.
        </p>
        {c && (
          <div className="dc-stats">
            <span><i className="dot-on" />{c.online.toLocaleString()} online</span>
            <span>{c.members.toLocaleString()} members</span>
          </div>
        )}
      </div>
      <a href={SITE.discord} target="_blank" rel="noreferrer" className="btn btn-red">
        <DiscordIcon size={18} />
        <span>Join the Discord</span>
      </a>
    </div>
  );
}

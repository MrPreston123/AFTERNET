// $AFTERNET launch watcher.
// GET /api/token → { live, ca, price, marketCap, change24h, ... } for the website (CORS open, cached 10 s).
// The first call that sees the coin on-chain posts the launch announcement in Discord (exactly once).
import { waitUntil } from '@vercel/functions';

// The CA is kept in a Vercel env var (TOKEN_CA) so it stays private until launch.
const CA = (process.env.TOKEN_CA || '').trim();
const SITE = 'https://afternet.app';
const RPCS = ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'];
const API = 'https://discord.com/api/v10';
const RED = 0xe5182b;
const ANNOUNCE = process.env.ANNOUNCE_CHANNEL || '📣│announcements';
const TEST = process.env.ANNOUNCE_TEST === '1'; // local preview: no pings
const links = {
  buy: `https://pump.fun/coin/${CA}`,
  chart: `https://dexscreener.com/solana/${CA}`,
  solscan: `https://solscan.io/token/${CA}`,
};

let cache = { t: 0, data: null };
let announced = false;

async function mintExists() {
  for (const url of RPCS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAccountInfo', params: [CA, { encoding: 'base64', commitment: 'confirmed' }] }),
        signal: AbortSignal.timeout(4000),
      });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.result) return j.result.value != null;
    } catch {}
  }
  return null; // unknown
}

async function market() {
  try {
    const r = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${CA}`, { signal: AbortSignal.timeout(4000) });
    const pairs = r.ok ? await r.json() : [];
    if (!Array.isArray(pairs) || !pairs.length) return null;
    const p = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0) || (b.marketCap || 0) - (a.marketCap || 0))[0];
    return {
      price: p.priceUsd ? Number(p.priceUsd) : null,
      marketCap: p.marketCap ?? p.fdv ?? null,
      change24h: p.priceChange?.h24 ?? null,
      volume24h: p.volume?.h24 ?? null,
      dex: p.dexId,
      pairUrl: p.url,
    };
  } catch {
    return null;
  }
}

async function status() {
  const [onChain, m] = await Promise.all([mintExists(), market()]);
  const live = onChain === true || !!m;
  return {
    live,
    ca: live ? CA : null,
    buy: live ? links.buy : null,
    chart: live ? links.chart : null,
    solscan: live ? links.solscan : null,
    ...(m || {}),
    checkedAt: new Date().toISOString(),
  };
}

// ── Discord announcement (idempotent: never posts twice) ──
async function d(method, path, body) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(API + path, { method, headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 429) { const j = await r.json(); await new Promise((s) => setTimeout(s, (j.retry_after || 1) * 1000 + 100)); continue; }
    if (r.status === 204) return {};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${method} ${path} ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
    return j;
  }
}

async function announce(s) {
  if (announced || !process.env.DISCORD_TOKEN) return;
  const guilds = await d('GET', '/users/@me/guilds');
  const g = guilds[0]?.id;
  if (!g) return;
  const [channels, roles, me] = await Promise.all([d('GET', `/guilds/${g}/channels`), d('GET', `/guilds/${g}/roles`), d('GET', '/users/@me')]);
  const ch = channels.find((c) => c.name === ANNOUNCE);
  if (!ch) return;
  const mine = async () => (await d('GET', `/channels/${ch.id}/messages?limit=50`)).filter((m) => m.author.id === me.id && JSON.stringify(m).includes(CA));
  if ((await mine()).length) { announced = true; return; }
  const alerts = roles.find((r) => r.name === '🪙 Token Alerts');
  const msg = await d('POST', `/channels/${ch.id}/messages`, {
    content: TEST ? '(preview: @everyone + 🪙 Token Alerts will be pinged at launch)' : `@everyone${alerts ? ` <@&${alerts.id}>` : ''}`,
    allowed_mentions: TEST ? { parse: [] } : { parse: ['everyone'], roles: alerts ? [alerts.id] : [] },
    embeds: [{
      color: RED,
      title: '🚀 $AFTERNET is LIVE on pump.fun',
      description: [
        'The offline survival system now has its token. Welcome to launch day, survivors.',
        '',
        '**Contract address (CA)**',
        '```' + CA + '```',
        '⚠️ This is the **only** official CA. Always check it matches the website and this post. The team will never DM you.',
      ].join('\n'),
      fields: s.marketCap ? [{ name: 'Market cap', value: `$${Math.round(s.marketCap).toLocaleString('en-US')}`, inline: true }] : [],
      url: links.buy,
      image: { url: `${SITE}/brand/og.jpg` },
      footer: { text: 'Not financial advice. AFTERNET is free, open-source software. The token is a community token.' },
      timestamp: new Date().toISOString(),
    }],
    components: [{ type: 1, components: [
      { type: 2, style: 5, label: 'Buy on pump.fun', emoji: { name: '🪙' }, url: links.buy },
      { type: 2, style: 5, label: 'Chart', emoji: { name: '📈' }, url: links.chart },
      { type: 2, style: 5, label: 'Website', url: SITE },
    ] }],
  });
  announced = true;
  // Two instances racing could both post: keep only the earliest.
  const dupes = (await mine()).sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  for (const m of dupes.slice(1)) await d('DELETE', `/channels/${ch.id}/messages/${m.id}`).catch(() => {});
  if (ch.type === 5 && dupes[0]?.id === msg.id) await d('POST', `/channels/${ch.id}/messages/${msg.id}/crosspost`).catch(() => {});
}

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=5, s-maxage=10, stale-while-revalidate=20' };

export async function GET() {
  if (!CA) return new Response(JSON.stringify({ live: false, ca: null }), { headers });
  if (!cache.data || Date.now() - cache.t > 10000) {
    cache = { t: Date.now(), data: await status() };
  }
  if (cache.data.live && !announced) waitUntil(announce(cache.data).catch((e) => console.error('announce failed', e)));
  return new Response(JSON.stringify(cache.data), { headers });
}

export function OPTIONS() {
  return new Response(null, { headers: { ...headers, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': '*' } });
}

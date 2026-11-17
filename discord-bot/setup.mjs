// One-time (re-runnable) AFTERNET Discord server setup.
// Rebrands the server, hides every old channel in a staff-only ARCHIVE category (nothing is deleted),
// builds the new layout, and posts the welcome / rules / downloads / open-source / support messages.
//   node setup.mjs            → apply
//   node setup.mjs --dry      → print what would happen
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(readFileSync(join(HERE, '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const DRY = process.argv.includes('--dry');
const API = 'https://discord.com/api/v10';
const H = { Authorization: `Bot ${env.DISCORD_TOKEN}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, body, reason = 'AFTERNET server setup') {
  if (DRY && method !== 'GET') { console.log('  [dry]', method, path); return {}; }
  for (;;) {
    const r = await fetch(API + path, { method, headers: { ...H, 'X-Audit-Log-Reason': reason }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 429) { const j = await r.json(); await sleep((j.retry_after || 1) * 1000 + 100); continue; }
    if (r.status === 204) return {};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
    return j;
  }
}

// ── links ──
const SITE = 'https://afternet.app';
const GH = 'https://github.com/MrPreston123/AFTERNET';
const REL = `${GH}/releases/latest`;
const L = {
  site: SITE, app: `${SITE}/app/`, download: `${SITE}/download/`, gear: `${SITE}/gear/`,
  win: `${REL}/download/AFTERNET-Setup.exe`, apk: `${REL}/download/AFTERNET.apk`, sums: `${REL}/download/SHA256SUMS.txt`,
  x: 'https://x.com/afternetapp', gh: GH, rel: REL, issues: `${GH}/issues`, license: `${GH}/blob/main/LICENSE`,
};
const RED = 0xe5182b;

// ── permissions ──
const P = { VIEW: 1n << 10n, SEND: 1n << 11n, MANAGE_MSG: 1n << 13n, EMBED: 1n << 14n, ATTACH: 1n << 15n, HISTORY: 1n << 16n, REACT: 1n << 6n, CONNECT: 1n << 20n, SPEAK: 1n << 21n, PUB_THREAD: 1n << 35n, PRIV_THREAD: 1n << 36n, THREAD_SEND: 1n << 38n };
const bits = (...k) => String(k.reduce((a, x) => a | P[x], 0n));
const READ_ONLY = bits('SEND', 'PUB_THREAD', 'PRIV_THREAD', 'THREAD_SEND');

// ── layout ──
// type: 0 text, 2 voice, 5 announcement, 13 stage
const LAYOUT = [
  { cat: '━━ START HERE ━━', channels: [
    { name: '👋│welcome', type: 0, ro: true, topic: 'Welcome to AFTERNET: the offline survival system.' },
    { name: '📜│rules', type: 0, ro: true, topic: 'Read before posting.' },
    { name: '📣│announcements', type: 5, ro: true, topic: 'Releases, updates and $AFTERNET news.' },
    { name: '⬇️│downloads', type: 0, ro: true, topic: `Windows + Android installers · ${L.download}` },
    { name: '🎭│pick-roles', type: 0, ro: true, topic: 'Tap a button to add or remove a role.' },
    { name: '🧩│open-source', type: 0, ro: true, topic: `Every line is public: ${L.gh}` },
  ] },
  { cat: '━━ COMMUNITY ━━', channels: [
    { name: '💬│general', type: 0, topic: 'Talk AFTERNET, prepping, tech, anything.' },
    { name: '🪙│afternet-token', type: 0, topic: '$AFTERNET chat. Not financial advice.' },
    { name: '🏕️│survival-tips', type: 0, topic: 'Water, fire, shelter, first aid, food. Share what works.' },
    { name: '🎒│gear', type: 0, topic: `Solar banks, radios, filters, kits. Shop: ${L.gear}` },
    { name: '📸│showcase', type: 0, topic: 'Your AFTERNET setup, offline maps, go-bags.' },
    { name: '🌍│international', type: 0, topic: 'Every language welcome (RU, ES, PT, …).' },
  ] },
  { cat: '━━ SUPPORT ━━', channels: [
    { name: '🎫│open-a-ticket', type: 0, ro: true, topic: 'Click the button for private help from the team.' },
    { name: '❓│faq', type: 0, ro: true, topic: 'Quick answers. Still stuck? Open a ticket.' },
    { name: '🐞│bug-reports', type: 0, topic: `Public bug reports. Also welcome on GitHub: ${L.issues}` },
  ] },
  { cat: '━━ VOICE ━━', channels: [
    { name: '🔊 General', type: 2 },
    { name: '🔊 Survival Talk', type: 2 },
    { name: '🔊 Trading', type: 2 },
    { name: '🔊 Support Call', type: 2 },
    { name: '🎙️ AMA Stage', type: 13 },
  ] },
  { cat: '━━ KOL & VIP ━━', private: ['𝐊𝐎𝐋', 'VIP'], channels: [
    { name: '★│kol-lounge', type: 0, topic: 'KOLs, VIPs and the team.' },
    { name: '★│alpha', type: 0, topic: 'Early looks at releases and campaigns.' },
    { name: '🔊 KOL VC', type: 2 },
  ] },
  { cat: '━━ STAFF ━━', private: [], channels: [
    { name: '🛡️│staff-chat', type: 0 },
    { name: '🧾│ticket-logs', type: 0, topic: 'Transcripts of closed tickets.' },
    { name: '📋│mod-updates', type: 0, topic: 'Discord community updates.' },
    { name: '🔊 Staff VC', type: 2 },
  ] },
  { cat: '━━ TICKETS ━━', private: [], channels: [] },
];
const STAFF_ROLES = ['FOUNDER', 'BUILDER', 'ADMIN'];
const ARCHIVE = '🗄️ ARCHIVE (old)';

// ── messages ──
const MESSAGES = {
  '👋│welcome': [{
    embeds: [{
      color: RED, title: 'Welcome to AFTERNET',
      description: [
        '**When the network goes dark, AFTERNET keeps working.**',
        'One free, open-source app with everything you need offline:',
        '',
        '📚 **Offline Wikipedia** · articles with images, no signal needed',
        '🩹 **Survival Library** · 30 field guides: first aid, water, fire, shelter',
        '🧠 **Local AI** · an assistant that runs on your own device',
        '🛰️ **Offline GPS** · live maps, your position, waypoints, saved areas',
        '🌱 **Self-Sufficiency** · food, power, repair, rebuild',
        '',
        '**Start here**',
        '1. Read <#rules>',
        '2. Install the app in <#downloads>',
        '3. Say hi in <#general>',
        '4. Need help? <#open-a-ticket>',
      ].join('\n'),
      image: { url: `${SITE}/brand/og.jpg` },
      footer: { text: 'AFTERNET · offline survival system · open source' },
    }],
    components: [{ type: 1, components: [
      { type: 2, style: 5, label: 'Website', url: L.site },
      { type: 2, style: 5, label: 'Download', url: L.download },
      { type: 2, style: 5, label: 'GitHub', url: L.gh },
      { type: 2, style: 5, label: 'X / Twitter', url: L.x },
    ] }],
  }],
  '📜│rules': [{
    embeds: [{
      color: RED, title: 'Server rules',
      description: [
        '**1. Be decent.** No harassment, slurs, hate or personal attacks.',
        '**2. No scams.** No DMs offering "support", giveaways or wallet help. The team will **never** DM you first or ask for a seed phrase.',
        '**3. Downloads only from official links.** <#downloads>, the website or GitHub. Nothing else is AFTERNET.',
        '**4. No spam or shilling.** No unsolicited promo, invites or other tokens.',
        '**5. Not financial advice.** Talk about $AFTERNET freely, but nothing here is investment advice.',
        '**6. Safety first.** Survival tips are shared in good faith. In a real emergency, contact local emergency services.',
        '**7. Keep it in the right channel.** Support goes in tickets, bugs in <#bug-reports>.',
        '**8. Follow Discord\'s Terms and Guidelines.**',
        '',
        'Breaking the rules gets a warning, a timeout, then a ban, at the team\'s discretion.',
      ].join('\n'),
    }],
  }],
  '⬇️│downloads': [{
    embeds: [{
      color: RED, title: 'Download AFTERNET',
      description: [
        'Free. No account. Works with zero signal once installed.',
        '',
        '🪟 **Windows 10 / 11**: one-click installer, `AFTERNET-Setup.exe`',
        '🤖 **Android 8+**: `AFTERNET.apk` (allow "install unknown apps" when asked)',
        '🌐 **iPhone, Mac, Linux**: open the web app and choose *Add to Home Screen* / *Install*',
        '',
        '**Verify your download** (optional): compare the file\'s SHA-256 with `SHA256SUMS.txt` on the release page.',
        '',
        '⚠️ These are the **only** official links. Never install AFTERNET from a DM.',
      ].join('\n'),
    }],
    components: [
      { type: 1, components: [
        { type: 2, style: 5, label: 'Windows installer', emoji: { name: '🪟' }, url: L.win },
        { type: 2, style: 5, label: 'Android APK', emoji: { name: '🤖' }, url: L.apk },
        { type: 2, style: 5, label: 'Web app', emoji: { name: '🌐' }, url: L.app },
      ] },
      { type: 1, components: [
        { type: 2, style: 5, label: 'All downloads + guide', url: L.download },
        { type: 2, style: 5, label: 'Checksums', url: L.sums },
        { type: 2, style: 5, label: 'Release notes', url: L.rel },
      ] },
    ],
  }],
  '🧩│open-source': [{
    embeds: [{
      color: RED, title: 'Fully open source. Don\'t trust us, verify.',
      description: [
        'A survival app has to be trustworthy, so **every line of AFTERNET is public** on GitHub under the MIT licence.',
        '',
        '🔍 **Read the code**: the website, the Windows app and the Android app all come from one repository.',
        '🏗️ **Built in public**: installers are built by GitHub Actions from that code, not on someone\'s laptop.',
        '🚫 **No accounts, no trackers**: nothing you read, ask the AI or where you are leaves your device.',
        '✅ **Check your download**: every release ships SHA-256 checksums.',
        '',
        'Found a problem? Open an issue or a pull request. Contributions welcome.',
      ].join('\n'),
    }],
    components: [{ type: 1, components: [
      { type: 2, style: 5, label: 'GitHub repository', url: L.gh },
      { type: 2, style: 5, label: 'Releases', url: L.rel },
      { type: 2, style: 5, label: 'Report an issue', url: L.issues },
    ] }],
  }],
  '🎫│open-a-ticket': [{
    embeds: [{
      color: RED, title: 'Tech support',
      description: [
        'Install problem, app not working, AI won\'t start, GPS, maps, anything else?',
        '',
        'Click **Open a ticket**. You get a **private channel** with the team only.',
        '',
        'Helpful to include: your device (Windows / Android / browser), what you tried, and a screenshot.',
        '',
        '🔒 The team will never ask for your seed phrase, passwords or to install anything from a DM.',
      ].join('\n'),
    }],
    components: [{ type: 1, components: [
      { type: 2, style: 1, label: 'Open a ticket', emoji: { name: '🎫' }, custom_id: 'ticket:open' },
    ] }],
  }],
  '❓│faq': [{
    embeds: [{
      color: RED, title: 'FAQ',
      fields: [
        { name: 'Is AFTERNET free?', value: 'Yes. The app is free and open source (MIT).' },
        { name: 'Does it really work offline?', value: 'Yes. Guides, the Wikipedia pack, maps you saved and the AI run with no internet. Download the AI model and map areas once while online.' },
        { name: 'Which AI model should I pick?', value: '**Scout** (≈0.5 GB) for phones, **Ranger** (≈0.8 GB) for most PCs, **Sage** (≈1.1 GB) for stronger PCs.' },
        { name: 'Windows says "unknown publisher"', value: 'Click **More info → Run anyway**. The installer is built publicly on GitHub, and you can check its SHA-256.' },
        { name: 'Android blocks the install', value: 'Allow your browser or files app to **install unknown apps** when Android asks.' },
        { name: 'GPS won\'t find me', value: 'Turn on location (on Windows: Settings → Privacy & security → Location). GPS works offline but needs sky view. You can also set a position by hand.' },
        { name: 'iPhone / Mac?', value: `Open ${L.app} and use *Add to Home Screen* / *Install*.` },
      ],
    }],
  }],
};

// ── run ──
const me = await api('GET', '/users/@me');
const guilds = await api('GET', '/users/@me/guilds');
const GUILD = env.GUILD_ID || guilds[0]?.id;
if (!GUILD) throw new Error('Bot is not in a server yet. Invite it first.');
const guild = await api('GET', `/guilds/${GUILD}`);
console.log(`Bot ${me.username} → server "${guild.name}" (${GUILD})${DRY ? ' [DRY RUN]' : ''}`);

let roles = await api('GET', `/guilds/${GUILD}/roles`);
const roleId = (n) => roles.find((r) => r.name === n)?.id;
const everyone = GUILD;

// Support role for tickets
if (!roleId('Support')) {
  const r = await api('POST', `/guilds/${GUILD}/roles`, { name: 'Support', color: RED, hoist: false, mentionable: true });
  roles.push(r);
  console.log('+ role Support');
}
const staff = [...STAFF_ROLES, 'Support'].map(roleId).filter(Boolean);

// Rebrand
const icon = join(HERE, '..', 'public', 'icons', 'icon-512.png');
const banner = join(HERE, '..', 'public', 'brand', 'banner.png');
await api('PATCH', `/guilds/${GUILD}`, {
  name: 'AFTERNET',
  description: 'Offline survival system: Wikipedia, field guides, local AI and GPS that work with zero signal. Open source.',
  icon: `data:image/png;base64,${readFileSync(icon).toString('base64')}`,
});
console.log('~ server renamed to AFTERNET + icon');
try {
  await api('PATCH', `/guilds/${GUILD}`, { banner: `data:image/png;base64,${readFileSync(banner).toString('base64')}` });
  console.log('~ banner set');
} catch (e) { console.log('  (banner skipped: needs boost level 2)'); }

// Existing channels
let channels = await api('GET', `/guilds/${GUILD}/channels`);
const newNames = new Set(LAYOUT.flatMap((c) => [c.cat, ...c.channels.map((x) => x.name)]));
newNames.add(ARCHIVE);
// Archive category: visible to staff only
let archive = channels.find((c) => c.type === 4 && c.name === ARCHIVE);
const privOverwrites = (extraRoles = []) => [
  { id: everyone, type: 0, deny: bits('VIEW', 'CONNECT'), allow: '0' },
  { id: me.id, type: 1, allow: bits('VIEW', 'SEND', 'HISTORY', 'EMBED', 'MANAGE_MSG', 'CONNECT'), deny: '0' },
  ...[...staff, ...extraRoles].map((id) => ({ id, type: 0, allow: bits('VIEW', 'SEND', 'HISTORY', 'CONNECT', 'SPEAK'), deny: '0' })),
];
const keep = (c) => c.type === 4 || c.type === 20 || newNames.has(c.name) || c.name.startsWith('ticket-');
const toArchive = channels.filter((c) => !keep(c));
if (!archive && toArchive.length) {
  archive = await api('POST', `/guilds/${GUILD}/channels`, { name: ARCHIVE, type: 4, permission_overwrites: privOverwrites(), position: 999 });
  console.log('+ archive category');
}

// Build new categories + channels (find-or-create, so re-running is safe)
const made = {};
let pos = 0;
for (const c of LAYOUT) {
  const extra = (c.private || []).map(roleId).filter(Boolean);
  const catOver = c.private ? privOverwrites(extra) : [];
  let cat = channels.find((x) => x.type === 4 && x.name === c.cat);
  if (!cat) {
    cat = await api('POST', `/guilds/${GUILD}/channels`, { name: c.cat, type: 4, permission_overwrites: catOver });
    console.log('+ category', c.cat);
  }
  made[c.cat] = cat;
  await api('PATCH', `/channels/${cat.id}`, { position: pos++ });
  for (const ch of c.channels) {
    let x = channels.find((y) => y.name === ch.name && y.type === ch.type);
    const over = [...catOver];
    if (ch.ro) over.push({ id: everyone, type: 0, deny: READ_ONLY, allow: bits('REACT', 'HISTORY') });
    if (ch.ro && !c.private) over.push(...staff.map((id) => ({ id, type: 0, allow: bits('SEND'), deny: '0' })), { id: me.id, type: 1, allow: bits('VIEW', 'SEND', 'EMBED', 'MANAGE_MSG', 'HISTORY'), deny: '0' });
    const body = { name: ch.name, type: ch.type, parent_id: cat.id, permission_overwrites: over };
    if (ch.topic && (ch.type === 0 || ch.type === 5)) body.topic = ch.topic;
    if (!x) {
      try {
        x = await api('POST', `/guilds/${GUILD}/channels`, body);
      } catch (e) {
        if (ch.type === 5) { x = await api('POST', `/guilds/${GUILD}/channels`, { ...body, type: 0 }); } else throw e;
      }
      console.log('  + channel', ch.name);
    } else {
      await api('PATCH', `/channels/${x.id}`, { parent_id: cat.id, permission_overwrites: over, ...(body.topic ? { topic: body.topic } : {}) });
    }
    made[ch.name] = x;
  }
}

// Community settings must point at new channels before the old ones are hidden
if (guild.features.includes('COMMUNITY')) {
  await api('PATCH', `/guilds/${GUILD}`, {
    rules_channel_id: made['📜│rules'].id,
    public_updates_channel_id: made['📋│mod-updates'].id,
    system_channel_id: made['💬│general'].id,
  });
  console.log('~ community rules/updates/system channels updated');
}

// Archive: move every old channel into the hidden archive (nothing deleted)
channels = await api('GET', `/guilds/${GUILD}/channels`);
let moved = 0;
for (const c of channels) {
  if (!archive || keep(c) || c.parent_id === archive.id) continue;
  try {
    await api('PATCH', `/channels/${c.id}`, { parent_id: archive.id, lock_permissions: true }, 'Archived during AFTERNET rebrand');
    moved++;
  } catch (e) { console.log('  ! could not archive', c.name, String(e.message).slice(0, 120)); }
}
console.log(`~ archived ${moved} old channels`);
// Hide the now-empty old categories inside the archive view (move them to the bottom, staff-only)
for (const c of channels.filter((x) => x.type === 4 && !newNames.has(x.name))) {
  try { await api('PATCH', `/channels/${c.id}`, { permission_overwrites: privOverwrites(), position: 998 }); } catch {}
}
if (archive) await api('PATCH', `/channels/${archive.id}`, { position: 999 }).catch(() => {});

// Messages (bot posts once; re-running edits its own message instead of duplicating)
const state = existsSync(join(HERE, 'state.json')) ? JSON.parse(readFileSync(join(HERE, 'state.json'), 'utf8')) : { messages: {} };
const chName = (n) => made[Object.keys(made).find((k) => k.endsWith('│' + n))]?.id;
const linkify = (s) => s.replace(/<#([a-z-]+)>/g, (m, n) => (chName(n) ? `<#${chName(n)}>` : `#${n}`));
for (const [name, msgs] of Object.entries(MESSAGES)) {
  const ch = made[name];
  if (!ch) continue;
  for (let i = 0; i < msgs.length; i++) {
    const m = JSON.parse(linkify(JSON.stringify(msgs[i])));
    const key = `${name}#${i}`;
    const prev = state.messages[key];
    if (prev) {
      try { await api('PATCH', `/channels/${ch.id}/messages/${prev}`, m); continue; } catch {}
    }
    const sent = await api('POST', `/channels/${ch.id}/messages`, m);
    state.messages[key] = sent.id;
  }
  console.log('  ✉', name);
}

// Permanent invite for the website
if (!state.invite) {
  const inv = await api('POST', `/channels/${made['👋│welcome'].id}/invites`, { max_age: 0, max_uses: 0, unique: false });
  state.invite = inv.code ? `https://discord.gg/${inv.code}` : undefined;
}
state.guild = GUILD;
state.channels = Object.fromEntries(Object.entries(made).map(([k, v]) => [k, v.id]));
if (!DRY) writeFileSync(join(HERE, 'state.json'), JSON.stringify(state, null, 2));
console.log('Invite:', state.invite);
console.log('Done.');

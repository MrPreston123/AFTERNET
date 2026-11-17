// AFTERNET roles: creates the role set, orders it, gives every existing member "Early Survivor",
// and posts the self-pick roles panel (buttons handled by api/interactions.js).
//   node roles.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(readFileSync(join(HERE, '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const state = JSON.parse(readFileSync(join(HERE, 'state.json'), 'utf8'));
const G = state.guild;
const API = 'https://discord.com/api/v10';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(method, path, body) {
  for (;;) {
    const r = await fetch(API + path, { method, headers: { Authorization: `Bot ${env.DISCORD_TOKEN}`, 'Content-Type': 'application/json', 'X-Audit-Log-Reason': 'AFTERNET roles' }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 429) { const j = await r.json(); await sleep((j.retry_after || 1) * 1000 + 50); continue; }
    if (r.status === 204) return {};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${method} ${path} ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
    return j;
  }
}

// Highest first. hoist = shown separately in the member list. pick = members can self-assign.
const ROLES = [
  { name: 'Moderator', color: 0xff4d5e, hoist: true, mentionable: true },
  { name: 'Support', color: 0xe5182b, hoist: true, mentionable: true },
  { name: 'Holder', color: 0xf5c542, hoist: true },
  { name: 'Contributor', color: 0x3ddc84, hoist: true },
  { name: 'Beta Tester', color: 0x4aa8ff },
  { name: 'Early Survivor', color: 0xc0c4cc, hoist: true },
  { name: 'Survivor', color: 0x8a8f98 },
  // self-pick: interests
  { name: '🩹 Medic', color: 0, pick: 'interest', label: 'Medic', emoji: '🩹', desc: 'first aid & medicine' },
  { name: '🛰️ Navigator', color: 0, pick: 'interest', label: 'Navigator', emoji: '🛰️', desc: 'maps, GPS & routes' },
  { name: '🌱 Homesteader', color: 0, pick: 'interest', label: 'Homesteader', emoji: '🌱', desc: 'food, water & power' },
  { name: '🧠 AI Tinkerer', color: 0, pick: 'interest', label: 'AI Tinkerer', emoji: '🧠', desc: 'local AI models' },
  { name: '📻 Comms', color: 0, pick: 'interest', label: 'Comms', emoji: '📻', desc: 'radio & mesh networks' },
  { name: '🛠️ Builder', color: 0, pick: 'interest', label: 'Builder', emoji: '🛠️', desc: 'code & contributions' },
  // self-pick: notifications
  { name: '🔔 Updates', color: 0, mentionable: true, pick: 'ping', label: 'Release updates', emoji: '🔔', desc: 'new versions & features' },
  { name: '🎙️ AMA', color: 0, mentionable: true, pick: 'ping', label: 'AMAs & events', emoji: '🎙️', desc: 'voice AMAs & KOL events' },
  { name: '🪙 Token Alerts', color: 0, mentionable: true, pick: 'ping', label: '$AFTERNET alerts', emoji: '🪙', desc: 'token news' },
];
// Existing roles kept and placed above the new set (in this order).
const TOP = ['AFTERNETBOT', 'FOUNDER', 'BUILDER', 'ADMIN'];
const AFTER_STAFF = ['𝐊𝐎𝐋', 'VIP'];

let roles = await api('GET', `/guilds/${G}/roles`);
const byName = (n) => roles.find((r) => r.name === n);
for (const def of ROLES) {
  const ex = byName(def.name);
  const body = { name: def.name, color: def.color, hoist: !!def.hoist, mentionable: !!def.mentionable };
  if (ex) await api('PATCH', `/guilds/${G}/roles/${ex.id}`, body);
  else { roles.push(await api('POST', `/guilds/${G}/roles`, body)); console.log('+ role', def.name); }
}
roles = await api('GET', `/guilds/${G}/roles`);

// Order: bot, owner/staff, Moderator, Support, KOL, VIP, Holder…, then everything else (other bots) below.
const order = [...TOP, 'Moderator', 'Support', ...AFTER_STAFF, ...ROLES.slice(2).map((r) => r.name)];
const ordered = order.map(byName).filter(Boolean);
const rest = roles.filter((r) => r.id !== G && !ordered.includes(r)).sort((a, b) => b.position - a.position);
const all = [...ordered, ...rest];
const positions = all.map((r, i) => ({ id: r.id, position: all.length - i }));
try { await api('PATCH', `/guilds/${G}/roles`, positions); console.log('~ roles ordered'); } catch (e) { console.log('! ordering:', e.message); }

// Everyone already here gets Early Survivor (needs the Server Members intent).
const early = byName('Early Survivor');
let after = '0', given = 0, members = 0;
try {
  for (;;) {
    const batch = await api('GET', `/guilds/${G}/members?limit=1000&after=${after}`);
    if (!batch.length) break;
    for (const m of batch) {
      after = m.user.id;
      if (m.user.bot) continue;
      members++;
      if (!m.roles.includes(early.id)) { await api('PUT', `/guilds/${G}/members/${m.user.id}/roles/${early.id}`); given++; }
    }
    if (batch.length < 1000) break;
  }
  console.log(`~ Early Survivor given to ${given} of ${members} members`);
} catch (e) { console.log('! members:', e.message, '\n  Turn on "Server Members Intent" in the Developer Portal → Bot, then re-run.'); }

// Self-pick roles channel + panel
const RED = 0xe5182b;
const chans = await api('GET', `/guilds/${G}/channels`);
const start = chans.find((c) => c.type === 4 && c.name === '━━ START HERE ━━');
let pick = chans.find((c) => c.name === '🎭│pick-roles');
if (!pick) {
  pick = await api('POST', `/guilds/${G}/channels`, {
    name: '🎭│pick-roles', type: 0, parent_id: start.id, topic: 'Tap a button to add or remove a role.',
    permission_overwrites: [{ id: G, type: 0, deny: String((1n << 11n) | (1n << 35n) | (1n << 36n) | (1n << 38n)), allow: String(1n << 16n) }],
  });
  console.log('+ channel 🎭│pick-roles');
}
// place it right after downloads
const startKids = chans.filter((c) => c.parent_id === start.id).sort((a, b) => a.position - b.position);
const dlIdx = startKids.findIndex((c) => c.name === '⬇️│downloads');
const seq = startKids.filter((c) => c.id !== pick.id);
seq.splice(dlIdx + 1, 0, pick);
await api('PATCH', `/guilds/${G}/channels`, seq.map((c, i) => ({ id: c.id, position: i, parent_id: start.id }))).catch(() => {});

const btn = (def) => ({ type: 2, style: 2, label: def.label, emoji: { name: def.emoji }, custom_id: `role:${byName(def.name).id}` });
const rows = (list) => { const out = []; for (let i = 0; i < list.length; i += 5) out.push({ type: 1, components: list.slice(i, i + 5).map(btn) }); return out; };
const interests = ROLES.filter((r) => r.pick === 'interest');
const pings = ROLES.filter((r) => r.pick === 'ping');
const panels = [
  { key: 'interests', body: { embeds: [{ color: RED, title: 'What are you into?', description: 'Pick any. Tap again to remove.\n\n' + interests.map((r) => `${r.emoji} **${r.label}**: ${r.desc}`).join('\n') }], components: rows(interests) } },
  { key: 'pings', body: { embeds: [{ color: RED, title: 'Notifications', description: 'Choose what you want to be pinged for.\n\n' + pings.map((r) => `${r.emoji} **${r.label}**: ${r.desc}`).join('\n') + '\n\n**Holder**, **Contributor** and **Beta Tester** are given by the team. Ask in a ticket.' }], components: rows(pings) } },
];
state.rolePanels ||= {};
for (const p of panels) {
  const prev = state.rolePanels[p.key];
  if (prev) { try { await api('PATCH', `/channels/${pick.id}/messages/${prev}`, p.body); continue; } catch {} }
  state.rolePanels[p.key] = (await api('POST', `/channels/${pick.id}/messages`, p.body)).id;
}
state.channels['🎭│pick-roles'] = pick.id;
state.roles = Object.fromEntries(ROLES.map((r) => [r.name, byName(r.name)?.id]));
writeFileSync(join(HERE, 'state.json'), JSON.stringify(state, null, 2));
const fin = (await api('GET', `/guilds/${G}/roles`)).sort((a, b) => b.position - a.position);
console.log('ROLES:', fin.map((r) => r.name).join(', '));

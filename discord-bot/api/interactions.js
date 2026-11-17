// AFTERNET support tickets as a serverless Discord interactions endpoint (always on, no server to run).
// Discord POSTs every button click / form submit here. Env: DISCORD_TOKEN, DISCORD_PUBLIC_KEY.
import { createPublicKey, verify } from 'node:crypto';
import { waitUntil } from '@vercel/functions';

const API = 'https://discord.com/api/v10';
const RED = 0xe5182b;
const STAFF_ROLES = ['FOUNDER', 'BUILDER', 'ADMIN', 'Moderator', 'Support'];
// Only these can be self-assigned from the #pick-roles buttons.
const PICKABLE = ['🩹 Medic', '🛰️ Navigator', '🌱 Homesteader', '🧠 AI Tinkerer', '📻 Comms', '🛠️ Builder', '🔔 Updates', '🎙️ AMA', '🪙 Token Alerts'];
const TICKET_CAT = '━━ TICKETS ━━';
const LOG = '🧾│ticket-logs';
const EPHEMERAL = 64;
const V = { VIEW: 1n << 10n, SEND: 1n << 11n, EMBED: 1n << 14n, ATTACH: 1n << 15n, HISTORY: 1n << 16n, MANAGE_CH: 1n << 4n, ADMIN: 1n << 3n };
const bits = (...k) => String(k.reduce((a, x) => a | V[x], 0n));

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });

function verified(body, sig, ts) {
  try {
    const raw = Buffer.from(process.env.DISCORD_PUBLIC_KEY, 'hex');
    const key = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]), format: 'der', type: 'spki' });
    return verify(null, Buffer.from(ts + body), key, Buffer.from(sig, 'hex'));
  } catch {
    return false;
  }
}

async function d(method, path, body, isForm = false) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(API + path, {
      method,
      headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}`, ...(isForm || !body ? {} : { 'Content-Type': 'application/json' }) },
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 429) { const j = await r.json(); await new Promise((s) => setTimeout(s, (j.retry_after || 1) * 1000 + 100)); continue; }
    if (r.status === 204) return {};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${method} ${path} ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
    return j;
  }
}
const followup = (i, body) => d('PATCH', `/webhooks/${i.application_id}/${i.token}/messages/@original`, body);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'user';
const field = (i, id) => i.data.components.flatMap((r) => r.components).find((c) => c.custom_id === id)?.value || '';

export async function openTicket(i) {
  const g = i.guild_id, user = i.member.user;
  const [channels, roles] = await Promise.all([d('GET', `/guilds/${g}/channels`), d('GET', `/guilds/${g}/roles`)]);
  const existing = channels.find((c) => c.topic?.includes(`owner:${user.id}`));
  if (existing) return followup(i, { content: `You already have an open ticket: <#${existing.id}>` });
  const cat = channels.find((c) => c.type === 4 && c.name === TICKET_CAT);
  const staff = roles.filter((r) => STAFF_ROLES.includes(r.name));
  const support = roles.find((r) => r.name === 'Support');
  const ch = await d('POST', `/guilds/${g}/channels`, {
    name: `ticket-${slug(user.username)}-${String(Date.now()).slice(-4)}`,
    type: 0,
    parent_id: cat?.id,
    topic: `Support ticket · owner:${user.id}`,
    permission_overwrites: [
      { id: g, type: 0, deny: bits('VIEW'), allow: '0' },
      { id: user.id, type: 1, allow: bits('VIEW', 'SEND', 'HISTORY', 'ATTACH', 'EMBED'), deny: '0' },
      { id: i.application_id, type: 1, allow: bits('VIEW', 'SEND', 'HISTORY', 'ATTACH', 'EMBED', 'MANAGE_CH'), deny: '0' },
      ...staff.map((r) => ({ id: r.id, type: 0, allow: bits('VIEW', 'SEND', 'HISTORY', 'ATTACH'), deny: '0' })),
    ],
  });
  await d('POST', `/channels/${ch.id}/messages`, {
    content: `<@${user.id}>${support ? ` <@&${support.id}>` : ''}`,
    allowed_mentions: { users: [user.id], roles: support ? [support.id] : [] },
    embeds: [{
      color: RED, title: 'Support ticket',
      description: 'Thanks! The team will reply here. Add screenshots if you can.\n\n🔒 We will never ask for a seed phrase or password.',
      fields: [{ name: 'Device', value: field(i, 'device').slice(0, 1000) || '—' }, { name: 'Issue', value: field(i, 'issue').slice(0, 1000) || '—' }],
    }],
    components: [{ type: 1, components: [{ type: 2, style: 4, label: 'Close ticket', emoji: { name: '🔒' }, custom_id: 'ticket:close' }] }],
  });
  return followup(i, { content: `Your ticket is open: <#${ch.id}>` });
}

export async function closeTicket(i, owner) {
  const all = [];
  let before;
  for (;;) {
    const batch = await d('GET', `/channels/${i.channel_id}/messages?limit=100${before ? `&before=${before}` : ''}`);
    if (!batch.length) break;
    all.push(...batch);
    before = batch[batch.length - 1].id;
    if (batch.length < 100) break;
  }
  all.reverse();
  const text = all.map((m) => {
    const extra = [...(m.embeds || []).map((e) => [e.title, e.description, ...(e.fields || []).map((f) => `${f.name}: ${f.value}`)].filter(Boolean).join(' | ')), ...(m.attachments || []).map((a) => a.url)].join(' ');
    return `[${m.timestamp}] ${m.author.username}: ${m.content} ${extra}`.trim();
  }).join('\n');
  const channels = await d('GET', `/guilds/${i.guild_id}/channels`);
  const log = channels.find((c) => c.name === LOG);
  const name = i.channel?.name || 'ticket';
  if (log) {
    const form = new FormData();
    form.append('payload_json', JSON.stringify({
      embeds: [{ color: RED, title: `Closed: #${name}`, timestamp: new Date().toISOString(), fields: [
        { name: 'Owner', value: `<@${owner}>`, inline: true }, { name: 'Closed by', value: `<@${i.member.user.id}>`, inline: true }, { name: 'Messages', value: String(all.length), inline: true },
      ] }],
      attachments: [{ id: 0, filename: `${name}.txt` }],
    }));
    form.append('files[0]', new Blob([text], { type: 'text/plain' }), `${name}.txt`);
    await d('POST', `/channels/${log.id}/messages`, form, true);
  }
  await new Promise((s) => setTimeout(s, 2500));
  await d('DELETE', `/channels/${i.channel_id}`);
}

export async function POST(req) {
  const body = await req.text();
  if (!verified(body, req.headers.get('x-signature-ed25519') || '', req.headers.get('x-signature-timestamp') || '')) return new Response('bad signature', { status: 401 });
  const i = JSON.parse(body);
  if (i.type === 1) return json({ type: 1 }); // PING

  const id = i.data?.custom_id;
  if (i.type === 3 && id === 'ticket:open') {
    return json({ type: 9, data: { custom_id: 'ticket:form', title: 'AFTERNET support', components: [
      { type: 1, components: [{ type: 4, custom_id: 'device', label: 'Device', style: 1, required: true, max_length: 80, placeholder: 'Windows 11 / Android 14 / Chrome on Mac…' }] },
      { type: 1, components: [{ type: 4, custom_id: 'issue', label: 'What is going wrong?', style: 2, required: true, max_length: 1500, placeholder: 'What you tried, what you expected, any error message' }] },
    ] } });
  }
  if (i.type === 5 && id === 'ticket:form') {
    waitUntil(openTicket(i).catch((e) => { console.error(e); return followup(i, { content: 'Could not open a ticket. Please ping the team.' }).catch(() => {}); }));
    return json({ type: 5, data: { flags: EPHEMERAL } });
  }
  if (i.type === 3 && id === 'ticket:close') {
    const topic = i.channel?.topic ?? (await d('GET', `/channels/${i.channel_id}`).catch(() => ({}))).topic;
    const owner = topic?.match(/owner:(\d+)/)?.[1];
    if (!owner) return json({ type: 4, data: { content: 'This is not a ticket channel.', flags: EPHEMERAL } });
    const perms = BigInt(i.member.permissions || '0');
    const staff = (perms & V.ADMIN) !== 0n || (perms & V.MANAGE_CH) !== 0n || (i.member.roles || []).length && await d('GET', `/guilds/${i.guild_id}/roles`).then((rs) => rs.some((r) => STAFF_ROLES.includes(r.name) && i.member.roles.includes(r.id))).catch(() => false);
    if (i.member.user.id !== owner && !staff) return json({ type: 4, data: { content: 'Only the ticket owner or the team can close it.', flags: EPHEMERAL } });
    waitUntil(closeTicket(i, owner).catch((e) => console.error(e)));
    return json({ type: 4, data: { content: '🔒 Closing ticket and saving a transcript…' } });
  }
  if (i.type === 3 && id?.startsWith('role:')) {
    const roleId = id.slice(5);
    const role = (await d('GET', `/guilds/${i.guild_id}/roles`).catch(() => [])).find((r) => r.id === roleId);
    if (!role || !PICKABLE.includes(role.name)) return json({ type: 4, data: { content: 'That role cannot be self-assigned.', flags: EPHEMERAL } });
    const has = (i.member.roles || []).includes(roleId);
    try {
      await d(has ? 'DELETE' : 'PUT', `/guilds/${i.guild_id}/members/${i.member.user.id}/roles/${roleId}`);
      return json({ type: 4, data: { content: has ? `Removed **${role.name}**.` : `Added **${role.name}**. Tap again to remove it.`, flags: EPHEMERAL } });
    } catch (e) {
      console.error(e);
      return json({ type: 4, data: { content: 'Could not update your roles. Please tell the team.', flags: EPHEMERAL } });
    }
  }
  return json({ type: 4, data: { content: 'Unknown action.', flags: EPHEMERAL } });
}

export function GET() {
  return new Response('AFTERNET Discord interactions endpoint is running.');
}

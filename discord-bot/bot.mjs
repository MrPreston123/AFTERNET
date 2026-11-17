// AFTERNET support bot: private ticket channels with a transcript saved to #ticket-logs on close.
// Needs DISCORD_TOKEN in .env (or the environment) and the channels created by setup.mjs.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Client, GatewayIntentBits, ChannelType, PermissionFlagsBits as F, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder, ActivityType,
} from 'discord.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const envFile = join(HERE, '.env');
const env = existsSync(envFile)
  ? Object.fromEntries(readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
  : {};
const TOKEN = process.env.DISCORD_TOKEN || env.DISCORD_TOKEN;
const RED = 0xe5182b;
const STAFF_ROLES = ['FOUNDER', 'BUILDER', 'ADMIN', 'Support'];
const TICKET_CAT = '━━ TICKETS ━━';
const LOG = '🧾│ticket-logs';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const staffRoles = (g) => g.roles.cache.filter((r) => STAFF_ROLES.includes(r.name));
const isStaff = (m) => m.permissions.has(F.Administrator) || m.roles.cache.some((r) => STAFF_ROLES.includes(r.name));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'user';

client.once('clientReady', (c) => {
  console.log(`AFTERNET bot online as ${c.user.tag}`);
  c.user.setActivity('for support tickets', { type: ActivityType.Watching });
});

client.on('interactionCreate', async (i) => {
  try {
    // 1. "Open a ticket" → short form
    if (i.isButton() && i.customId === 'ticket:open') {
      const existing = i.guild.channels.cache.find((c) => c.topic?.includes(`owner:${i.user.id}`) && c.parent?.name === TICKET_CAT);
      if (existing) return i.reply({ content: `You already have an open ticket: ${existing}`, ephemeral: true });
      const modal = new ModalBuilder().setCustomId('ticket:form').setTitle('AFTERNET support');
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('device').setLabel('Device').setPlaceholder('Windows 11 / Android 14 / Chrome on Mac…').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('issue').setLabel('What is going wrong?').setPlaceholder('What you tried, what you expected, any error message').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500)),
      );
      return i.showModal(modal);
    }

    // 2. Form submitted → private channel
    if (i.isModalSubmit() && i.customId === 'ticket:form') {
      await i.deferReply({ ephemeral: true });
      const g = i.guild;
      const cat = g.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === TICKET_CAT);
      const n = String(Date.now()).slice(-4);
      const ch = await g.channels.create({
        name: `ticket-${slug(i.user.username)}-${n}`,
        type: ChannelType.GuildText,
        parent: cat?.id,
        topic: `Support ticket · owner:${i.user.id}`,
        permissionOverwrites: [
          { id: g.roles.everyone.id, deny: [F.ViewChannel] },
          { id: i.user.id, allow: [F.ViewChannel, F.SendMessages, F.ReadMessageHistory, F.AttachFiles, F.EmbedLinks] },
          { id: client.user.id, allow: [F.ViewChannel, F.SendMessages, F.ReadMessageHistory, F.ManageChannels, F.EmbedLinks, F.AttachFiles] },
          ...staffRoles(g).map((r) => ({ id: r.id, allow: [F.ViewChannel, F.SendMessages, F.ReadMessageHistory, F.AttachFiles] })),
        ],
      });
      const support = g.roles.cache.find((r) => r.name === 'Support');
      await ch.send({
        content: `${i.user} ${support ? support.toString() : ''}`.trim(),
        embeds: [new EmbedBuilder().setColor(RED).setTitle('Support ticket').setDescription('Thanks! The team will reply here. Add screenshots if you can.\n\n🔒 We will never ask for a seed phrase or password.')
          .addFields({ name: 'Device', value: i.fields.getTextInputValue('device') }, { name: 'Issue', value: i.fields.getTextInputValue('issue') })],
        components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket:close').setLabel('Close ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger))],
        allowedMentions: { users: [i.user.id], roles: support ? [support.id] : [] },
      });
      return i.editReply(`Your ticket is open: ${ch}`);
    }

    // 3. Close → transcript to #ticket-logs, delete channel
    if (i.isButton() && i.customId === 'ticket:close') {
      const owner = i.channel.topic?.match(/owner:(\d+)/)?.[1];
      if (!owner) return i.reply({ content: 'This is not a ticket channel.', ephemeral: true });
      if (i.user.id !== owner && !isStaff(i.member)) return i.reply({ content: 'Only the ticket owner or the team can close it.', ephemeral: true });
      await i.reply('Closing ticket and saving a transcript…');
      let all = [], before;
      for (;;) {
        const batch = await i.channel.messages.fetch({ limit: 100, before });
        if (!batch.size) break;
        all.push(...batch.values());
        before = batch.last().id;
        if (batch.size < 100) break;
      }
      all.reverse();
      const text = all.map((m) => {
        const extra = [...m.embeds.map((e) => [e.title, e.description, ...(e.fields || []).map((f) => `${f.name}: ${f.value}`)].filter(Boolean).join(' | ')), ...m.attachments.map((a) => a.url)].join(' ');
        return `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content} ${extra}`.trim();
      }).join('\n');
      const log = i.guild.channels.cache.find((c) => c.name === LOG);
      await log?.send({
        embeds: [new EmbedBuilder().setColor(RED).setTitle(`Closed: #${i.channel.name}`).addFields({ name: 'Owner', value: `<@${owner}>`, inline: true }, { name: 'Closed by', value: `${i.user}`, inline: true }, { name: 'Messages', value: String(all.length), inline: true }).setTimestamp()],
        files: [new AttachmentBuilder(Buffer.from(text, 'utf8'), { name: `${i.channel.name}.txt` })],
      });
      setTimeout(() => i.channel.delete('Ticket closed').catch(() => {}), 4000);
    }
  } catch (e) {
    console.error(e);
    const msg = { content: 'Something went wrong. Please try again or ping the team.', ephemeral: true };
    if (i.deferred || i.replied) i.followUp(msg).catch(() => {}); else i.reply?.(msg).catch(() => {});
  }
});

client.login(TOKEN);

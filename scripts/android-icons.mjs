// Generates Android launcher icons + splash screens from the AFTERNET logo.
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const RES = 'android/app/src/main/res';
const logo = await sharp('public/brand/logo-source.png').extract({ left: 227, top: 125, width: 800, height: 800 }).png().toBuffer();
const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, s] of Object.entries(sizes)) {
  const icon = await sharp(logo).resize(s, s).png().toBuffer();
  await sharp(icon).toFile(`${RES}/mipmap-${d}/ic_launcher.png`);
  const mask = Buffer.from(`<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/></svg>`);
  await sharp(icon).composite([{ input: mask, blend: 'dest-in' }]).png().toFile(`${RES}/mipmap-${d}/ic_launcher_round.png`);
  // adaptive foreground: 108dp canvas, logo inside the 66dp safe zone
  const fg = Math.round(s * 2.25), inner = Math.round(fg * 0.58);
  const small = await sharp(logo).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: fg, height: fg, channels: 4, background: { r: 5, g: 5, b: 5, alpha: 1 } } })
    .composite([{ input: small, left: Math.round((fg - inner) / 2), top: Math.round((fg - inner) / 2) }])
    .png().toFile(`${RES}/mipmap-${d}/ic_launcher_foreground.png`);
}
// splash screens: black with the centred logo
for (const dir of readdirSync(RES).filter((n) => n.startsWith('drawable'))) {
  for (const f of readdirSync(`${RES}/${dir}`).filter((n) => n === 'splash.png')) {
    const p = `${RES}/${dir}/${f}`;
    const { width, height } = await sharp(p).metadata();
    const m = Math.round(Math.min(width, height) * 0.32);
    const l = await sharp(logo).resize(m, m).png().toBuffer();
    const buf = await sharp({ create: { width, height, channels: 3, background: '#050505' } }).composite([{ input: l, gravity: 'center' }]).png().toBuffer();
    await sharp(buf).toFile(p);
  }
}
console.log('android icons + splash done');

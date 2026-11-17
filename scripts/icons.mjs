// Builds favicon + PWA icons from the supplied logo
import sharp from 'sharp';
import { existsSync } from 'node:fs';
const src = 'public/brand/logo-source.png';
if (existsSync('public/icons/icon-512.png')) process.exit(0);
await import('node:fs').then((fs) => fs.mkdirSync('public/icons', { recursive: true }));
const crop = sharp(src).extract({ left: 227, top: 125, width: 800, height: 800 });
const buf = await crop.png().toBuffer();
for (const s of [32, 48, 180, 192, 512]) {
  await sharp(buf).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
}
// maskable: logo at ~70% inside a black safe zone
const inner = await sharp(buf).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 3, background: '#000000' } })
  .composite([{ input: inner, left: 76, top: 76 }])
  .png()
  .toFile('public/icons/maskable-512.png');
await sharp('public/brand/banner.png').resize(1200, 400).jpeg({ quality: 82 }).toFile('public/brand/og.jpg');
console.log('icons done');

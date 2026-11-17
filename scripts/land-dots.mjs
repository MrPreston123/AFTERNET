// Samples a Fibonacci sphere and keeps points that fall on land -> public/data/land.json ([lat, lon] pairs)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';

const out = 'public/data/land.json';
if (existsSync(out)) process.exit(0);
const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const N = 42000;
const pts = [];
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = golden * i;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((Math.atan2(Math.sin(th) * r, Math.cos(th) * r) * 180) / Math.PI);
  if (lat < -60) continue; // skip Antarctica for a cleaner silhouette
  if (geoContains(land, [lon, lat])) pts.push(+lat.toFixed(2), +lon.toFixed(2));
}
mkdirSync('public/data', { recursive: true });
writeFileSync(out, JSON.stringify(pts));
console.log('land dots:', pts.length / 2);

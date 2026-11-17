'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as MLMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Icon from '../Icon';
import { fmtBytes } from '@/lib/idb';
import { useOnline } from '@/lib/install';
import { readAreas, writeAreas, type MapArea } from './packs';

const HOST = 'tiles.openfreemap.org';
const STYLE = `afn://${HOST}/styles/dark`;
export const TILE_CACHE = 'afternet-tiles';
const MAX_TILES = 6000;

type Fix = { lat: number; lon: number; acc: number; alt: number | null; speed: number | null; heading: number | null };
type Waypoint = { id: string; name: string; lat: number; lon: number };

const toHttps = (u: string) => u.replace(/^afn:\/\//, 'https://');
const toAfn = (s: string) => s.split(`https://${HOST}`).join(`afn://${HOST}`);

let protocolAdded = false;
/** Every map request goes through here: on-device cache first, network second (and cached for next time). */
function addProtocol(ml: typeof import('maplibre-gl')) {
  if (protocolAdded) return;
  protocolAdded = true;
  ml.addProtocol('afn', async (params, ac) => {
    const url = toHttps(params.url);
    const cache = await caches.open(TILE_CACHE);
    let res = await cache.match(url);
    if (!res) {
      res = await fetch(url, { signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await cache.put(url, res.clone());
    }
    if (params.type === 'json') return { data: JSON.parse(toAfn(await res.text())) };
    return { data: await res.arrayBuffer() };
  });
}

const lon2x = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2y = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
function tileList(b: [number, number, number, number], zmin: number, zmax: number) {
  const [w, s, e, n] = b;
  const out: [number, number, number][] = [];
  for (let z = zmin; z <= zmax; z++) {
    const max = 2 ** z - 1;
    const x0 = Math.max(0, lon2x(Math.max(-180, w), z)), x1 = Math.min(max, lon2x(Math.min(179.999, e), z));
    const y0 = Math.max(0, lat2y(Math.min(85, n), z)), y1 = Math.min(max, lat2y(Math.max(-85, s), z));
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([z, x, y]);
  }
  return out;
}
function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000, k = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * k) / 2) ** 2 + Math.cos(a.lat * k) * Math.cos(b.lat * k) * Math.sin(((b.lon - a.lon) * k) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function bearing(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const k = Math.PI / 180;
  const y = Math.sin((b.lon - a.lon) * k) * Math.cos(b.lat * k);
  const x = Math.cos(a.lat * k) * Math.sin(b.lat * k) - Math.sin(a.lat * k) * Math.cos(b.lat * k) * Math.cos((b.lon - a.lon) * k);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const compassPt = (d: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(d / 45) % 8];
const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`);
function dms(v: number, pos: string, neg: string) {
  const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d - m / 60) * 3600).toFixed(1);
  return `${d}°${String(m).padStart(2, '0')}′${s.padStart(4, '0')}″${v >= 0 ? pos : neg}`;
}
const readWps = (): Waypoint[] => { try { return JSON.parse(localStorage.getItem('afternet-waypoints') || '[]'); } catch { return []; } };
const writeWps = (w: Waypoint[]) => { try { localStorage.setItem('afternet-waypoints', JSON.stringify(w)); } catch {} };

export default function Maps({ active }: { active: boolean }) {
  const online = useOnline();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const lib = useRef<typeof import('maplibre-gl') | null>(null);
  const me = useRef<Marker | null>(null);
  const wpMarkers = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [fix, setFix] = useState<Fix | null>(null);
  const [gpsErr, setGpsErr] = useState('');
  const [tracking, setTracking] = useState(false);
  const [areas, setAreas] = useState<MapArea[]>([]);
  const [wps, setWps] = useState<Waypoint[]>([]);
  const [dl, setDl] = useState<{ done: number; total: number; bytes: number } | null>(null);
  const [est, setEst] = useState<{ tiles: number; zmax: number } | null>(null);
  const [panel, setPanel] = useState(true);
  const stop = useRef(false);
  const watch = useRef<number | null>(null);
  const follow = useRef(true);

  useEffect(() => {
    let dead = false;
    setAreas(readAreas());
    setWps(readWps());
    (async () => {
      const ml = await import('maplibre-gl');
      if (dead || !box.current) return;
      lib.current = ml;
      addProtocol(ml);
      let last: { c: [number, number]; z: number } | null = null;
      try { last = JSON.parse(localStorage.getItem('afternet-map-view') || 'null'); } catch {}
      const m = new ml.Map({ container: box.current, style: STYLE, center: last?.c ?? [0, 25], zoom: last?.z ?? 1.6, attributionControl: { compact: true }, maxZoom: 18 });
      m.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-right');
      m.addControl(new ml.ScaleControl({ unit: 'metric' }), 'bottom-left');
      m.on('moveend', () => {
        const c = m.getCenter();
        try { localStorage.setItem('afternet-map-view', JSON.stringify({ c: [c.lng, c.lat], z: m.getZoom() })); } catch {}
        const z0 = Math.max(0, Math.floor(m.getZoom()));
        const b = m.getBounds();
        const bb: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
        let zmax = Math.min(14, z0 + 3);
        let n = tileList(bb, 0, zmax).length;
        while (n > MAX_TILES && zmax > z0) n = tileList(bb, 0, --zmax).length;
        setEst({ tiles: n, zmax });
      });
      m.on('dragstart', () => (follow.current = false));
      m.once('load', () => { setReady(true); m.fire('moveend'); });
      map.current = m;
    })();
    return () => {
      dead = true;
      if (watch.current != null) navigator.geolocation.clearWatch(watch.current);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (active) setTimeout(() => map.current?.resize(), 40);
  }, [active, panel]);

  useEffect(() => {
    const ml = lib.current, m = map.current;
    wpMarkers.current.forEach((k) => k.remove());
    wpMarkers.current = [];
    if (!ml || !m) return;
    for (const w of wps) {
      const el = document.createElement('div');
      el.className = 'wp-marker';
      const s = document.createElement('span');
      s.textContent = w.name;
      el.appendChild(s);
      wpMarkers.current.push(new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat([w.lon, w.lat]).addTo(m));
    }
  }, [wps, ready]);

  const place = (f: Fix) => {
    setFix(f);
    setGpsErr('');
    const ml = lib.current, m = map.current;
    if (!ml || !m) return;
    if (!me.current) {
      const el = document.createElement('div');
      el.className = 'me-marker';
      el.innerHTML = '<i></i><b></b>';
      me.current = new ml.Marker({ element: el }).setLngLat([f.lon, f.lat]).addTo(m);
      m.flyTo({ center: [f.lon, f.lat], zoom: Math.max(m.getZoom(), 15) });
    } else {
      me.current.setLngLat([f.lon, f.lat]);
      if (follow.current) m.easeTo({ center: [f.lon, f.lat], duration: 600 });
    }
  };

  const manual = () => {
    const v = prompt('Enter your position as "latitude, longitude" (e.g. 37.1363, -8.5376)', fix ? `${fix.lat.toFixed(5)}, ${fix.lon.toFixed(5)}` : '');
    if (!v) return;
    const [lat, lon] = v.split(/[,\s]+/).filter(Boolean).map(Number);
    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return setGpsErr('Could not read those coordinates. Use the format 37.1363, -8.5376.');
    follow.current = true;
    place({ lat, lon, acc: 0, alt: null, speed: null, heading: null });
  };

  const locate = () => {
    setGpsErr('');
    if (!('geolocation' in navigator)) return setGpsErr('This device has no location service.');
    follow.current = true;
    if (watch.current != null) {
      if (fix) map.current?.flyTo({ center: [fix.lon, fix.lat], zoom: Math.max(map.current.getZoom(), 15) });
      return;
    }
    setTracking(true);
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        const f: Fix = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, alt: p.coords.altitude, speed: p.coords.speed, heading: p.coords.heading };
        place(f);
      },
      (e) => {
        const win = /Windows/i.test(navigator.userAgent);
        setGpsErr(
          e.code === 1
            ? win ? 'Location is blocked. Turn on Windows Settings → Privacy & security → Location (and "Let desktop apps access your location"), then try again.' : 'Location permission denied. Allow location for AFTERNET in your browser or phone settings, then try again.'
            : e.code === 2
              ? win ? 'No position available. Turn on Location in Windows Settings → Privacy & security → Location. You can also set your position by hand below.' : 'No position available yet. Turn on location/GPS on your device, or set your position by hand below.'
              : 'Waiting for a GPS fix. Go outside or near a window.',
        );
        if (e.code === 1 && watch.current != null) {
          navigator.geolocation.clearWatch(watch.current);
          watch.current = null;
          setTracking(false);
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
  };

  const addWaypoint = () => {
    const m = map.current;
    if (!m) return;
    const c = fix && follow.current ? { lat: fix.lat, lon: fix.lon } : { lat: m.getCenter().lat, lon: m.getCenter().lng };
    const name = (prompt('Name this waypoint', `Point ${wps.length + 1}`) || '').trim();
    if (!name) return;
    const next = [...wps, { id: crypto.randomUUID(), name: name.slice(0, 40), ...c }];
    setWps(next);
    writeWps(next);
  };

  const download = async () => {
    const m = map.current;
    if (!m || !est) return;
    stop.current = false;
    const b = m.getBounds();
    const bb: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    const z0 = Math.max(0, Math.floor(m.getZoom()));
    const style = m.getStyle();
    const cache = await caches.open(TILE_CACHE);
    const extras: string[] = [toHttps(STYLE)];
    let template = '';
    for (const src of Object.values(style.sources)) {
      const s = src as { type: string; url?: string; tiles?: string[] };
      if (s.type !== 'vector') continue;
      if (s.url) {
        extras.push(toHttps(s.url));
        const tj = await (await fetch(toHttps(s.url))).json();
        template = tj.tiles[0];
      } else if (s.tiles) template = toHttps(s.tiles[0]);
    }
    const sprites = typeof style.sprite === 'string' ? [style.sprite] : (style.sprite ?? []).map((s: { url: string }) => s.url);
    for (const sp of sprites) extras.push(...['.json', '.png', '@2x.json', '@2x.png'].map((x) => toHttps(sp) + x));
    const stacks = new Set<string>();
    for (const l of style.layers) {
      const f = (l as { layout?: { 'text-font'?: unknown } }).layout?.['text-font'];
      if (Array.isArray(f) && f.every((x) => typeof x === 'string')) stacks.add((f as string[]).join(','));
    }
    if (style.glyphs) for (const st of stacks) for (const r of ['0-255', '256-511', '8192-8447']) extras.push(toHttps(style.glyphs).replace('{fontstack}', encodeURIComponent(st)).replace('{range}', r));
    const tiles = tileList(bb, 0, est.zmax).map(([z, x, y]) => template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)));
    const all = [...extras, ...tiles];
    setDl({ done: 0, total: all.length, bytes: 0 });
    let i = 0, bytes = 0, done = 0;
    const worker = async () => {
      while (i < all.length && !stop.current) {
        const u = all[i++];
        try {
          const hit = await cache.match(u);
          if (hit) bytes += Number(hit.headers.get('content-length') || 0);
          else {
            const r = await fetch(u);
            if (r.ok) {
              const blob = await r.clone().blob();
              bytes += blob.size;
              await cache.put(u, r);
            }
          }
        } catch {}
        done++;
        if (done % 8 === 0 || done === all.length) setDl({ done, total: all.length, bytes });
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    if (!stop.current) {
      const name = `Area · ${new Date().toLocaleDateString()} · zoom ${z0}–${est.zmax}`;
      const next = [...readAreas(), { id: crypto.randomUUID(), name, bounds: bb, zooms: [z0, est.zmax] as [number, number], tiles: tiles.length, bytes, date: Date.now() }];
      writeAreas(next);
      setAreas(next);
    }
    setDl(null);
  };

  const removeArea = (id: string) => {
    const next = areas.filter((a) => a.id !== id);
    writeAreas(next);
    setAreas(next);
  };

  return (
    <div className={`maps ${panel ? '' : 'panel-off'}`}>
      <div ref={box} className="map-box" />
      <button className="map-toggle btn btn-ghost btn-sm" onClick={() => setPanel(!panel)}>
        <Icon name={panel ? 'close' : 'layers'} size={16} /> <span>{panel ? 'Hide panel' : 'GPS & downloads'}</span>
      </button>
      <aside className="map-panel">
        <div className="mp-head">
          <p className="kicker">Offline GPS</p>
          <span className={`pill ${online ? 'ok' : 'bad'}`}><i />{online ? 'Online' : 'Offline'}</span>
        </div>
        <div className="gps">
          <button className={`btn ${tracking ? 'btn-ghost' : 'btn-red'} btn-sm`} onClick={locate}>
            <Icon name="locate" size={16} /> <span>{tracking ? 'Centre on me' : 'Find my position'}</span>
          </button>
          {fix ? (
            <div className="gps-read">
              <div><small>LAT</small><b>{fix.lat.toFixed(5)}</b><em>{dms(fix.lat, 'N', 'S')}</em></div>
              <div><small>LON</small><b>{fix.lon.toFixed(5)}</b><em>{dms(fix.lon, 'E', 'W')}</em></div>
              <div><small>ACC</small><b>±{Math.round(fix.acc)} m</b></div>
              <div><small>ALT</small><b>{fix.alt != null ? `${Math.round(fix.alt)} m` : '—'}</b></div>
              <div><small>SPD</small><b>{fix.speed != null ? `${(fix.speed * 3.6).toFixed(1)} km/h` : '—'}</b></div>
              <div><small>HDG</small><b>{fix.heading != null && !isNaN(fix.heading) ? `${Math.round(fix.heading)}° ${compassPt(fix.heading)}` : '—'}</b></div>
            </div>
          ) : (
            <p className="muted small">GPS needs no signal and no internet: your device listens to satellites directly.</p>
          )}
          {gpsErr && <p className="err small">{gpsErr}</p>}
          <button className="link small" onClick={manual}>Set position by hand</button>
        </div>

        <div className="mp-sec">
          <h4><Icon name="download" size={15} /> Save this area offline</h4>
          {dl ? (
            <div className="pack-prog">
              <div className="bar"><div style={{ width: `${(dl.done / dl.total) * 100}%` }} /></div>
              <small>{dl.done.toLocaleString()} / {dl.total.toLocaleString()} · {fmtBytes(dl.bytes)}</small>
              <button className="btn btn-ghost btn-sm" onClick={() => (stop.current = true)}><Icon name="stop" size={14} /> <span>Stop</span></button>
            </div>
          ) : (
            <>
              <p className="muted small">
                Saves what’s on screen{est ? ` down to street level (zoom ${est.zmax}), about ${est.tiles.toLocaleString()} tiles` : ''}.{est && est.zmax < 12 ? ' Zoom in closer for street detail.' : ''} Places you browse are saved automatically too.
              </p>
              <button className="btn btn-red btn-sm" disabled={!online || !est} onClick={download}>
                <Icon name="download" size={16} /> <span>{online ? 'Save visible area' : 'Needs a connection'}</span>
              </button>
            </>
          )}
        </div>

        <div className="mp-sec">
          <h4><Icon name="map" size={15} /> Saved areas <span className="count">{areas.length}</span></h4>
          {areas.length === 0 && <p className="muted small">None yet. Pan to your home region and save it.</p>}
          {areas.map((a) => (
            <div key={a.id} className="mp-row">
              <button onClick={() => map.current?.fitBounds([[a.bounds[0], a.bounds[1]], [a.bounds[2], a.bounds[3]]], { padding: 20 })}>
                <b>{a.name}</b>
                <small>{a.tiles.toLocaleString()} tiles · {fmtBytes(a.bytes)}</small>
              </button>
              <button aria-label="Remove" onClick={() => removeArea(a.id)}><Icon name="trash" size={14} /></button>
            </div>
          ))}
        </div>

        <div className="mp-sec">
          <h4><Icon name="pin" size={15} /> Waypoints <span className="count">{wps.length}</span><button className="link" onClick={addWaypoint}>+ add</button></h4>
          {wps.length === 0 && <p className="muted small">Mark home, water, shelter, meeting points.</p>}
          {wps.map((w) => {
            const d = fix ? haversine(fix, w) : null;
            const br = fix ? bearing(fix, w) : null;
            return (
              <div key={w.id} className="mp-row">
                <button onClick={() => { follow.current = false; map.current?.flyTo({ center: [w.lon, w.lat], zoom: Math.max(map.current.getZoom(), 14) }); }}>
                  <b>{w.name}</b>
                  <small>{d != null && br != null ? `${fmtDist(d)} · ${Math.round(br)}° ${compassPt(br)}` : `${w.lat.toFixed(4)}, ${w.lon.toFixed(4)}`}</small>
                </button>
                <button aria-label="Remove" onClick={() => { const n = wps.filter((x) => x.id !== w.id); setWps(n); writeWps(n); }}><Icon name="trash" size={14} /></button>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

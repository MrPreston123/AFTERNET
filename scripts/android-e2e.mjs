// End-to-end test of the Android app on an emulator (run by .github/workflows/android-test.yml).
// Drives the real WebView over the DevTools protocol and takes device screenshots with adb.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'test-results';
mkdirSync(OUT, { recursive: true });
const PKG = 'app.afternet.offline';
const sh = (c, timeout = 90000) => execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout }).trim();
const trySh = (c, timeout) => { try { return sh(c, timeout); } catch (e) { console.log('cmd failed:', c, String(e).slice(0, 200)); return ''; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = { started: new Date().toISOString(), steps: [] };
const log = (name, data) => {
  results.steps.push({ name, ...data });
  console.log(`▶ ${name}`, JSON.stringify(data).slice(0, 600));
  writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
};
const shot = (name) => {
  try {
    sh('adb shell screencap -p /sdcard/afn.png');
    sh(`adb pull /sdcard/afn.png ${OUT}/${name}.png`);
  } catch (e) {
    console.log('screenshot failed', name, String(e).slice(0, 200));
  }
};
// Always leave diagnostics behind, even if a step throws.
process.on('uncaughtException', finish);
let finished = false;
process.on('unhandledRejection', finish);
function finish(err) {
  if (finished) return;
  finished = true;
  try {
    results.error = String(err?.stack || err);
    results.crash = trySh('adb logcat -d -b crash | tail -60', 30000);
    results.logcat = trySh('adb logcat -d | grep -iE "afternet|chromium|Capacitor|AndroidRuntime|FATAL" | tail -120');
    results.activity = trySh('adb shell dumpsys activity activities | grep -iE "mResumedActivity|topResumedActivity" | head -5');
  } catch {}
  writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  console.error('E2E FAILED', err);
  process.exit(1);
}

// ── launch ──
log('script-start', {});
// Hard stop well before the job limit so results always get published.
setTimeout(() => finish(new Error('global timeout (35 min)')), 35 * 60000).unref();
sh('adb wait-for-device', 120000);
for (let i = 0; i < 60 && trySh('adb shell getprop sys.boot_completed', 15000) !== '1'; i++) await sleep(2000);
log('booted', {});
trySh('adb shell input keyevent 224'); // wake
trySh('adb shell wm dismiss-keyguard');
trySh('adb shell input keyevent 82'); // unlock
await sleep(3000);
trySh(`adb shell pm grant ${PKG} android.permission.ACCESS_FINE_LOCATION`);
trySh(`adb shell pm grant ${PKG} android.permission.ACCESS_COARSE_LOCATION`);
log('pre-launch', { devices: trySh('adb devices -l', 10000) });
log('launching', {});
trySh(`adb shell am start -n ${PKG}/.MainActivity`, 30000);
await sleep(12000);
shot('01-launch');

// ── connect to the WebView ──
let sock = '';
const revive = () => { trySh('adb reconnect offline', 20000); trySh('adb wait-for-device', 120000); };
for (let i = 0; i < 30 && !sock; i++) {
  const st = trySh('adb get-state', 10000);
  if (st !== 'device') {
    console.log('adb state:', st || 'offline', '- reconnecting');
    if (i === 0 || i === 5) log('offline-diag', { attempt: i, devices: trySh('adb devices -l', 10000), emulator: trySh('pgrep -af qemu | head -3', 5000), mem: trySh('free -m', 5000) });
    if (i >= 8) throw new Error('emulator stayed offline after launching the app');
    revive(); await sleep(3000); continue;
  }
  sock = trySh('adb shell cat /proc/net/unix', 30000).split('\n').map((l) => l.match(/@(webview_devtools_remote_\d+)/)?.[1]).find(Boolean) || '';
  if (!sock) await sleep(2000);
}
if (!sock) throw new Error('WebView devtools socket not found. adb: ' + trySh('adb get-state', 10000) + ' Resumed: ' + trySh('adb shell dumpsys activity activities | grep -i mResumedActivity | head -2'));
sh(`adb forward tcp:9222 localabstract:${sock}`);
const pages = await (await fetch('http://127.0.0.1:9222/json', { signal: AbortSignal.timeout(20000) })).json();
const page = pages.find((p) => p.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (pend.has(d.id)) {
    pend.get(d.id)(d);
    pend.delete(d.id);
  }
};
await Promise.race([new Promise((r) => (ws.onopen = r)), sleep(20000).then(() => { throw new Error('devtools websocket did not open'); })]);
log('devtools', { url: page.url });
const call = (method, params = {}) => new Promise((r) => { pend.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr, timeout = 60000) => {
  const d = await Promise.race([call('Runtime.evaluate', { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true }), sleep(timeout).then(() => ({ timeout: true }))]);
  if (d.timeout) return { error: 'timeout' };
  if (d.result?.exceptionDetails) return { error: d.result.exceptionDetails.exception?.description || d.result.exceptionDetails.text };
  return d.result?.result?.value;
};
const go = async (hash, wait = 3500) => {
  await ev(`location.hash = ${JSON.stringify(hash)}; return true;`);
  await sleep(wait);
};

log('device', { model: sh('adb shell getprop ro.product.model'), android: sh('adb shell getprop ro.build.version.release'), webview: sh(`adb shell dumpsys package com.google.android.webview | grep versionName | head -1`) });
log('page', { url: page.url, title: page.title });
trySh('adb emu geo fix -8.5376 37.1363', 20000); // Portimão

log('home', await ev(`
  await new Promise(r => setTimeout(r, 1500));
  return { path: location.pathname, native: !!window.Capacitor?.isNativePlatform?.(), title: document.querySelector('.home-title')?.textContent,
    installButtons: document.querySelectorAll('.sys-right .btn').length, tabbar: document.querySelector('.sys-tabbar') ? getComputedStyle(document.querySelector('.sys-tabbar')).display : 'missing',
    width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, gpu: !!navigator.gpu };`));
shot('02-home');
await ev(`scrollTo(0, 900); return 1;`);
await sleep(1500);
shot('03-home-scrolled');

await go('#guides');
log('guides', await ev(`return { cards: document.querySelectorAll('.card').length, imgs: [...document.querySelectorAll('.card img')].filter(i => i.complete && i.naturalWidth).length };`));
shot('04-guides');
await go('#guides/bleeding');
log('guide-bleeding', await ev(`return { title: document.querySelector('.reader-title')?.textContent, hero: !!document.querySelector('.reader-hero img')?.naturalWidth };`));
shot('05-guide');

await go('#wiki');
log('wiki', await ev(`return { cards: document.querySelectorAll('.card').length };`));
shot('06-wiki');
await go('#wiki/compass', 4500);
log('wiki-compass', await ev(`const im=[...document.querySelectorAll('.wiki-html img')]; return { title: document.querySelector('.reader-title')?.textContent, imgs: im.length, local: im.every(i => i.src.startsWith(location.origin)) };`));
shot('07-wiki-article');

await go('#downloads');
log('downloads', await ev(`return { text: document.querySelector('.dl-list')?.innerText.slice(0, 500), install: !!document.querySelector('.install-hero') };`));
shot('08-downloads');

// ── maps + GPS ──
await go('#maps', 8000);
log('maps', await ev(`return { canvas: !!document.querySelector('.maplibregl-canvas') };`));
await ev(`[...document.querySelectorAll('.gps .btn')][0]?.click(); return 1;`);
await sleep(9000);
log('gps', await ev(`return { readout: document.querySelector('.gps-read')?.innerText || document.querySelector('.gps')?.innerText };`));
shot('09-maps-gps');

// ── local AI on the phone ──
await go('#ai', 4000);
await ev(`const b=[...document.querySelectorAll('.ai-model')].find(x=>/Scout/.test(x.innerText)); b?.click(); return 1;`);
await sleep(800);
await ev(`document.querySelector('.ai-go button')?.click(); return 1;`);
const t0 = Date.now();
let status = '';
while (Date.now() - t0 < 12 * 60000) {
  status = (await ev(`return document.querySelector('.ai-go')?.innerText || '';`, 15000)) || '';
  if (/running|couldn/i.test(status)) break;
  await sleep(10000);
}
log('ai-start', { status, seconds: Math.round((Date.now() - t0) / 1000) });
shot('10-ai-started');
if (/running/i.test(status)) {
  const q0 = Date.now();
  await ev(`const ta=document.querySelector('.chat-input textarea'); const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set; set.call(ta,'How do I purify stream water?'); ta.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,300)); document.querySelector('.chat-input button[type=submit]').click(); return 1;`);
  await sleep(5000);
  while (Date.now() - q0 < 5 * 60000) {
    const busy = await ev(`return !!document.querySelector('.chat-input button[aria-label=Stop]');`, 15000);
    if (!busy) break;
    await sleep(5000);
  }
  log('ai-answer', { seconds: Math.round((Date.now() - q0) / 1000), answer: await ev(`return [...document.querySelectorAll('.msg.assistant .msg-body')].pop()?.innerText;`) });
  shot('11-ai-answer');
}

// ── airplane mode: everything bundled must still work ──
sh('adb shell svc wifi disable');
sh('adb shell svc data disable');
await sleep(4000);
await ev(`location.hash = '#home'; location.reload(); return 1;`, 5000);
await sleep(9000);
log('offline-home', await ev(`return { online: navigator.onLine, pill: document.querySelector('.sys-right .pill')?.innerText, title: document.querySelector('.home-title')?.textContent };`));
shot('12-offline-home');
await go('#wiki/tourniquet', 4500);
log('offline-wiki', await ev(`return { title: document.querySelector('.reader-title')?.textContent, imgs: [...document.querySelectorAll('.wiki-html img')].filter(i=>i.complete&&i.naturalWidth).length };`));
shot('13-offline-wiki');
await go('#guides/water-purify');
log('offline-guide', await ev(`return { title: document.querySelector('.reader-title')?.textContent };`));
await go('#ai', 3000);
log('offline-ai', await ev(`return { status: document.querySelector('.ai-go')?.innerText, cached: [...document.querySelectorAll('.ai-model .tag-ok')].length };`));
shot('14-offline-ai');
sh('adb shell svc wifi enable');
sh('adb shell svc data enable');

const errs = sh(`adb logcat -d -s chromium:E Capacitor/Console:E | tail -40`);
log('console-errors', { errs });
results.finished = new Date().toISOString();
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
ws.close();
console.log('done');
finished = true;
process.exit(0);

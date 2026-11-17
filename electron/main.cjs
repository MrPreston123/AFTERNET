// AFTERNET for Windows: a native window around the same static build the website uses.
// Everything is served from inside the app over a private app:// scheme, so it runs fully offline.
const { app, BrowserWindow, protocol, shell, Menu, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..', 'out');
const ORIGIN = 'app://afternet';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true } },
]);

// Single instance: a second launch focuses the existing window.
if (!app.requestSingleInstanceLock()) app.quit();

// Enable WebGPU so the local AI can use the graphics card.
app.commandLine.appendSwitch('enable-unsafe-webgpu');

function resolveFile(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  let file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) return null; // no path traversal
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  } catch {
    if (!path.extname(file)) file = path.join(file, 'index.html');
  }
  return fs.existsSync(file) ? file : null;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 380,
    minHeight: 560,
    backgroundColor: '#050505',
    title: 'AFTERNET',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.once('ready-to-show', () => win.show());
  win.loadURL(`${ORIGIN}/app/`);

  // External links open in the user's browser, never inside the app.
  const external = (url) => !url.startsWith(ORIGIN);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (external(url)) {
      e.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });
  // Location access for offline GPS (Windows location service).
  win.webContents.session.setPermissionRequestHandler((_wc, perm, cb) => cb(['geolocation', 'clipboard-sanitized-write', 'persistent-storage'].includes(perm)));
  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle('app', async (req) => {
    const { pathname } = new URL(req.url);
    const file = resolveFile(pathname);
    if (!file) return new Response('Not found', { status: 404 });
    const res = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(res.headers);
    // Cross-origin isolation lets the AI use every CPU core.
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    if (file.endsWith('.wasm')) headers.set('Content-Type', 'application/wasm');
    return new Response(res.body, { status: 200, headers });
  });
  const win = createWindow();
  app.on('second-instance', () => {
    if (win.isMinimized()) win.restore();
    win.focus();
  });
});

app.on('window-all-closed', () => app.quit());

// Prepares the Android web bundle: a copy of the static build whose root index.html IS the system app.
// (Capacitor's local server answers every extensionless path, like /app/, with the root index.html,
// so the app must live at the root for the installed app to open into it.)
import { cpSync, rmSync, copyFileSync, existsSync } from 'node:fs';
if (!existsSync('out/app/index.html')) throw new Error('Run `npm run build` first');
rmSync('out-native', { recursive: true, force: true });
cpSync('out', 'out-native', { recursive: true });
copyFileSync('out/app/index.html', 'out-native/index.html');
rmSync('out-native/sw.js', { force: true }); // everything is bundled; no service worker needed in the app
console.log('out-native ready (index.html = system app)');

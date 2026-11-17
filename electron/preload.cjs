// Tells the web UI it is running inside the installed Windows app (hides install buttons, marks packs as built in).
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('afternetNative', { platform: 'windows', version: process.env.npm_package_version || '1.0.0' });

<p align="center">
  <img src="public/icons/icon-192.png" width="96" alt="AFTERNET logo" />
</p>

<h1 align="center">AFTERNET</h1>
<p align="center"><b>An offline survival system for a post-internet world.</b><br/>
Offline Wikipedia · Survival Library · Local AI · Offline GPS · Self-Sufficiency</p>

---

**What happens when the internet goes dark?** No Google. No Wikipedia. No ChatGPT. No GPS maps.

AFTERNET is a free, open-source system you install straight from the browser onto your phone or computer. Once your packs are downloaded, everything runs locally, with no servers, no subscriptions and no internet.

> The internet is temporary. Knowledge shouldn't be.

## Modules

| Module | What it does | Offline |
|---|---|---|
| **Survival Guides** | 30 illustrated step-by-step guides: first aid, water, food, shelter, power, navigation, comms, plus rebuilding (growing, preserving, sanitation, tools, community) | Built in |
| **Wikipedia** | 62 essential articles **with their images** ship inside the app; search and save any other article while online | Built in |
| **Local AI** | Chat assistant running on-device with llama.cpp (WebGPU when available, CPU otherwise), grounded in the survival guides | One-time model download (0.5–1.1 GB) |
| **Offline Maps & GPS** | Dark vector maps, live position, heading, speed, waypoints with distance and bearing | Save any area; GPS needs no network |
| **Downloads** | One screen to install the app and manage every downloadable pack | — |
| **Gear** | Curated survival gear with what-to-look-for specs and a kit tracker | Tracker is local |

## Install

**One button on the website installs the right app for your device:**

- **Windows:** `AFTERNET-Setup.exe`, a one-click installer (adds Start menu + desktop shortcuts and launches). Not yet code-signed: if SmartScreen warns, choose *More info → Run anyway*.
- **Android:** `AFTERNET.apk`. Allow your browser to install unknown apps when asked.
- **iPhone, Mac, Linux:** install from the browser (Safari: *Share → Add to Home Screen*; Chrome/Edge: install icon in the address bar).

Downloads always come from the [latest GitHub Release](https://github.com/MrPreston123/AFTERNET/releases/latest).

## Run it yourself (developers)

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:3500
npm run build      # static export to ./out with an offline service worker
npm run serve      # serve the production build on http://localhost:3501
npm run app:win    # build the Windows installer into dist-electron/
npm run packs      # re-download the bundled Wikipedia pack (articles + images)
```

The website and both apps are the same static build in `out/`:

- **Website:** host `out/` anywhere static (Vercel, Netlify, Cloudflare Pages, a Raspberry Pi).
- **Windows:** Electron serves `out/` from inside the app over a private `app://` scheme ([`electron/main.cjs`](electron/main.cjs)).
- **Android:** Capacitor wraps `out/` ([`android/`](android), [`capacitor.config.json`](capacitor.config.json)). Building it needs JDK 21 + Android SDK, or use CI.

### Releasing the apps

Push a version tag and GitHub Actions builds both apps and publishes them as a release ([`.github/workflows/release.yml`](.github/workflows/release.yml)):

```bash
git tag v1.1.0
git push origin v1.1.0
```

Without signing secrets the APK is debug-signed (installs fine; to update, uninstall first). For a stable release key, add these repository secrets: `ANDROID_KEYSTORE_B64` (base64 of the keystore), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

### Configuration

Edit [`lib/config.ts`](lib/config.ts):

- `SITE.github`: your repository URL
- `TOKEN`: contract address and links shown on the site
- `SHOP.amazonDomain` / `SHOP.amazonTag`: store region and affiliate tag for gear links

### Project layout

```
app/                 Next.js routes: / (landing), /app (the system), /gear
components/landing/  Scroll-driven landing page sections
components/three/    WebGL globe (React Three Fiber + custom shaders)
components/app/      The offline app: library, wiki, AI, maps, system
lib/library.ts       The survival guide content (plain text, easy to contribute to)
lib/ai.ts            Local AI engine (wllama / llama.cpp)
public/packs/wiki/   Bundled Wikipedia articles + images (built by scripts/wiki-pack.mjs)
electron/            Windows app
android/             Android app (Capacitor)
lib/gear.ts          Gear catalogue
public/sw.js         Service worker (precache list is generated at build time)
scripts/             Build helpers: globe land-dots, PWA icons, precache manifest
```

## Contributing

Contributions are very welcome, especially:

- **Library content:** corrections, new guides, translations. Guides live in [`lib/library.ts`](lib/library.ts) in a tiny markdown dialect. Please cite reputable sources (Red Cross, WHO, CDC, national health services) for medical content.
- Offline map styles, vector tile packs and Kiwix (ZIM) integration
- Native desktop/mobile wrappers

Open an issue before large changes.

## Credits & licences

- Code: [MIT](LICENSE)
- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, tiles by [OpenFreeMap](https://openfreemap.org)
- Wikipedia content: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- AI runtime: [wllama](https://github.com/ngxson/wllama) / llama.cpp (MIT); models under their own licences (Qwen: Apache 2.0, Llama 3.2 Community Licence)
- Wikipedia images: Wikimedia Commons, under their individual free licences (linked from each article's source)
- Globe land data: [Natural Earth](https://www.naturalearthdata.com) via `world-atlas`

## Disclaimer

The survival guides are general information and not a substitute for professional medical advice or hands-on training. In an emergency, contact emergency services if you can. Take a first aid course while the world still runs.

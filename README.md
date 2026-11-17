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

| Module | What it does | How it works offline |
|---|---|---|
| **Survival Library** | 25+ step-by-step field guides: first aid, water, food, shelter, power, navigation, comms | Bundled into the app, always available |
| **Self-Sufficiency** | Growing food, seed saving, preserving, sanitation, tools, community organising | Bundled into the app |
| **Offline Wikipedia** | Search and read all of Wikipedia, save any article, one-tap "Essentials" pack | Saved articles live in IndexedDB |
| **Local AI** | Chat assistant that runs on your device's GPU, grounded in the survival library | [WebLLM](https://github.com/mlc-ai/web-llm) models cached in the browser after one download |
| **Offline GPS** | Dark vector maps, live position, heading, speed, waypoints with distance and bearing | Download any visible area; tiles cached by the service worker. GPS needs no network |
| **Gear** | Curated survival gear with what-to-look-for specs and a kit tracker | Kit tracker is local; store links need a connection |

## Install it (users)

1. Open the site and tap **Launch app** (or go to `/app/`).
2. Install it:
   - **iPhone/iPad:** Safari → Share → *Add to Home Screen*
   - **Android:** Chrome → ⋮ → *Install app*
   - **Windows/macOS/Linux:** Chrome or Edge → install icon in the address bar
3. In the app, download your packs: Wikipedia Essentials, your region's maps and an AI model.
4. Turn on airplane mode and test it.

## Run it yourself (developers)

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:3500
npm run build      # static export to ./out with an offline service worker
npm run serve      # serve the production build on http://localhost:3501
```

The build is a fully static site in `out/`. Host it anywhere (Vercel, Netlify, GitHub Pages, Cloudflare Pages, a Raspberry Pi, a USB stick with any static web server). The service worker only registers in production builds.

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
lib/library.ts       The survival library content (plain text, easy to contribute to)
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
- AI runtime: [WebLLM](https://github.com/mlc-ai/web-llm) (Apache 2.0); models under their own licences (Qwen, Llama 3.2 Community Licence)
- Globe land data: [Natural Earth](https://www.naturalearthdata.com) via `world-atlas`

## Disclaimer

The survival guides are general information and not a substitute for professional medical advice or hands-on training. In an emergency, contact emergency services if you can. Take a first aid course while the world still runs.

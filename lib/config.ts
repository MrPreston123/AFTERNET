/** Edit these before launch. Everything else reads from here. */
export const SITE = {
  name: 'AFTERNET',
  ticker: '$AFTERNET',
  tagline: 'An offline survival system for a post-internet world',
  /** Public source repository. The whole system is open source. */
  github: 'https://github.com/MrPreston123/AFTERNET',
  /** Permanent invite to the official Discord (support tickets, downloads, news). */
  discord: 'https://discord.gg/376CCK7MsW',
};

export const TOKEN = {
  /**
   * Live launch status. The CA, pump.fun and chart links come from here automatically the moment
   * the coin exists on-chain (the CA is kept private until then). See discord-bot/api/token.js.
   */
  statusApi: 'https://afternet-discord.vercel.app/api/token',
  xUrl: '',
  telegramUrl: '',
};

/** Gear links go to an Amazon search. Add an Associates tag to earn commission. */
export const SHOP = {
  amazonDomain: 'amazon.com',
  amazonTag: '',
};

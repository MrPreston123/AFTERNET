import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** Static export: the whole system ships as plain files, so it can be cached and run offline. */
export default function config(phase) {
  return {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
    reactStrictMode: true,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  };
}

// After `next build`, list every exported file and bake it into out/sw.js so the whole system works offline.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const root = 'out';
const skip = [/^brand\/logo-source\.png$/, /^brand\/banner\.png$/, /\.txt$/, /^sw\.js$/, /^404/, /^_not-found/];
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(relative(root, p).split(sep).join('/'));
  }
})(root);

const urls = [];
const hash = createHash('sha1');
for (const f of files.sort()) {
  if (skip.some((r) => r.test(f))) continue;
  hash.update(f + statSync(join(root, f)).size);
  if (f.endsWith('index.html')) urls.push('/' + f.slice(0, -'index.html'.length));
  else urls.push('/' + f);
}
const version = hash.digest('hex').slice(0, 10);
const sw = readFileSync(join(root, 'sw.js'), 'utf8')
  .replace("const VERSION = 'dev';", `const VERSION = '${version}';`)
  .replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(urls)};`);
writeFileSync(join(root, 'sw.js'), sw);
console.log(`sw.js: ${urls.length} files precached, version ${version}`);

// Checks every internal link and asset reference in the built site (dist/).
// Catches the classic GitHub Pages project-site bug: a path that forgets the
// /portfolio/ base and 404s in production. Also checks #fragment targets.
// Usage: npm run build && npm run check:links
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, posix } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const BASE = '/portfolio/';

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const idCache = new Map();

const idsIn = (file) => {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
};

// Map a site path (/portfolio/work/x/) to a file in dist, or null.
const resolveFile = (sitePath) => {
  if (!sitePath.startsWith(BASE)) return null;
  const rel = decodeURIComponent(sitePath.slice(BASE.length));
  const candidates = rel === '' || rel.endsWith('/') ? [join(DIST, rel, 'index.html')] : [join(DIST, rel), join(DIST, rel, 'index.html'), join(DIST, `${rel}.html`)];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
};

const errors = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const pagePath = BASE + posix.join(...relative(DIST, dirname(file)).split('/').filter(Boolean), '/').replace(/^\/$/, '');
  const refs = [];

  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  }

  for (const raw of refs) {
    const ref = raw.replaceAll('&amp;', '&');
    if (!ref || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref) || ref.startsWith('//')) continue;
    checked++;

    const [pathPart, hash] = ref.split('#');
    let target;
    if (pathPart === '') target = pagePath; // same-page fragment
    else if (pathPart.startsWith('/')) target = pathPart.split('?')[0];
    else target = posix.normalize(posix.join(pagePath, pathPart.split('?')[0]));

    const where = relative(DIST, file);
    if (!target.startsWith(BASE)) {
      errors.push(`${where}: "${ref}" is missing the ${BASE} base path`);
      continue;
    }
    const resolved = resolveFile(target);
    if (!resolved) {
      errors.push(`${where}: "${ref}" points to a file that does not exist`);
      continue;
    }
    if (hash && resolved.endsWith('.html') && !idsIn(resolved).has(hash)) {
      errors.push(`${where}: "${ref}" points to #${hash}, which is not on that page`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Link check failed (${errors.length} problem${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`Link check passed: ${checked} internal references across ${htmlFiles.length} pages.`);

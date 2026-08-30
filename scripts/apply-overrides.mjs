/**
 * Applies scripts/overrides.json to src/data/facilities.json in place —
 * a fast alternative to a full re-scrape when you only need to correct
 * a few entries. `npm run overrides`
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = resolve(ROOT, 'src/data/facilities.json');

export function applyOverrides(facilities, overrides) {
  let n = 0;
  for (const f of facilities) {
    const o = overrides[f.slug];
    if (!o) continue;
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('_')) continue;
      f[k] = v;
      n++;
    }
    if ('surface' in o && !('surfaceConfidence' in o)) f.surfaceConfidence = 'confirmed';
  }
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  const overrides = JSON.parse(readFileSync(resolve(ROOT, 'scripts/overrides.json'), 'utf8'));
  const n = applyOverrides(data.facilities, overrides);
  data.facilities.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`Applied ${n} override field(s) across ${Object.keys(overrides).filter((k) => !k.startsWith('_')).length} facilities.`);
}

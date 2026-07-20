// CI: fail if any theme JSON file is invalid.
// Covers templates/, config/, locales/, sections/*.json (section groups).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOTS = ['templates', 'config', 'locales', 'sections'];
let checked = 0;
const errors = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      walk(p);
    } else if (extname(p) === '.json') {
      checked++;
      try {
        // Shopify tolerates (and itself writes) /* ... */ banner comments
        // in theme JSON files — strip them before strict parsing.
        const raw = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        JSON.parse(raw);
      } catch (e) {
        errors.push(`${p}: ${e.message}`);
      }
    }
  }
}

for (const root of ROOTS) {
  try {
    walk(root);
  } catch {
    /* root may not exist */
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} invalid JSON file(s):`);
  for (const err of errors) console.error(`  ${err}`);
  process.exit(1);
}
console.log(`✓ ${checked} JSON files valid`);

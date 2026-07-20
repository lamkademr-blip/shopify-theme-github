// CI: configurator asset manifest integrity check.
//
// Phase 5 will make this HEAD-request every asset URL referenced by the
// wheel-configurator catalog (metaobjects snapshot) and fail on any 404,
// plus verify layer canvas dimensions (2000x2000).
//
// Until the catalog exists (Phase 1) this is a no-op stub so the CI job
// wiring can be validated end to end from day one.
const MANIFEST_SNAPSHOT = 'config/configurator-manifest.json';

import { existsSync, readFileSync } from 'node:fs';

if (!existsSync(MANIFEST_SNAPSHOT)) {
  console.log(`✓ no manifest yet (${MANIFEST_SNAPSHOT}) — stub passes (pre-Phase 1)`);
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(MANIFEST_SNAPSHOT, 'utf8'));
const urls = [];
for (const model of manifest.models ?? []) {
  for (const layer of model.layers ?? []) {
    if (layer.src) urls.push(layer.src);
  }
}

let failed = 0;
for (const url of urls) {
  const res = await fetch(url, { method: 'HEAD' });
  if (!res.ok) {
    console.error(`✗ ${res.status} ${url}`);
    failed++;
  }
}

if (failed) {
  console.error(`✗ ${failed}/${urls.length} manifest asset(s) unreachable`);
  process.exit(1);
}
console.log(`✓ ${urls.length} manifest assets reachable`);

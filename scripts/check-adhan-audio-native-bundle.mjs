import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const platform = process.argv[2];
const nativeRoots = {
  android: path.resolve('android/app/src/main/assets/public/audio/adhan'),
  ios: path.resolve('ios/App/App/public/audio/adhan'),
};
const nativeRoot = nativeRoots[platform];

if (nativeRoot === undefined) {
  throw new Error('Usage: node scripts/check-adhan-audio-native-bundle.mjs <android|ios>');
}

const sourceManifestPath = path.resolve('public/audio/adhan/assets.json');
const sourceManifestText = await readFile(sourceManifestPath, 'utf8');
const sourceManifest = JSON.parse(sourceManifestText);

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

for (const asset of sourceManifest.assets) {
  const nativeBytes = await readFile(path.join(nativeRoot, asset.file));
  if (nativeBytes.length !== asset.bytes) {
    throw new Error(
      `${platform} packaged Adhan ${asset.id} byte count ${String(nativeBytes.length)} != ${String(asset.bytes)}`,
    );
  }
  if (digest(nativeBytes) !== asset.sha256) {
    throw new Error(`${platform} packaged Adhan ${asset.id} SHA-256 does not match manifest`);
  }
}

const nativeManifestText = await readFile(path.join(nativeRoot, 'assets.json'), 'utf8');
if (nativeManifestText !== sourceManifestText) {
  throw new Error(`${platform} Adhan asset manifest differs from the production web manifest`);
}
await readFile(path.join(nativeRoot, 'ATTRIBUTION.md'), 'utf8');

console.log(
  `${platform} native bundle contains the exact packaged Adhan recordings, manifest and attribution.`,
);

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../public/audio/adhan/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('assets.json', root), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(`Adhan audio asset check failed: ${message}`);
}

assert(manifest.schemaVersion === 1, 'unexpected manifest schema version');
assert(
  manifest.sourceImport?.repository === 'wali1984/Darul-Irfan',
  'pinned import repository is missing',
);
assert(
  manifest.sourceImport?.commit === 'f4a0bd42b475a0a7a452a6e662a1cd9566e9f5de',
  'pinned import commit changed',
);
assert(Array.isArray(manifest.assets) && manifest.assets.length === 2, 'expected two assets');

const expected = new Map([
  [
    'beautiful-adhan',
    {
      file: 'beautiful-adhan.mp3',
      bytes: 1_848_972,
      sha256: '1ab728372deb9a9fa25ac7b0bacba4e4c6f224230e0299875a9da47d03d5ce70',
      license: 'CC0-1.0',
      author: 'Adam-synagda',
    },
  ],
  [
    'fajr-malmo',
    {
      file: 'fajr-malmo.mp3',
      bytes: 2_971_551,
      sha256: '5de2d9efae530fb55424e5ec244d812784f9b8d6f259f8315534478c9b2813b4',
      license: 'CC-BY-3.0',
      author: 'Islamic Center Malmö',
    },
  ],
]);

for (const asset of manifest.assets) {
  const canonical = expected.get(asset.id);
  assert(canonical !== undefined, `unexpected asset id ${String(asset.id)}`);
  assert(asset.file === canonical.file, `${asset.id} file name changed`);
  assert(asset.bytes === canonical.bytes, `${asset.id} manifest byte count changed`);
  assert(asset.sha256 === canonical.sha256, `${asset.id} manifest SHA-256 changed`);
  assert(asset.codec === 'mp3', `${asset.id} is not MP3`);
  assert(asset.sampleRateHz === 44100, `${asset.id} sample rate changed`);
  assert(asset.channels === 1, `${asset.id} channel count changed`);
  assert(asset.bitRate === 96000, `${asset.id} bit rate changed`);
  assert(asset.normalization?.targetLufs === -16, `${asset.id} LUFS target changed`);
  assert(
    asset.normalization?.targetTruePeakDb === -1.5,
    `${asset.id} true-peak target changed`,
  );
  assert(asset.rights?.license === canonical.license, `${asset.id} license metadata changed`);
  assert(asset.rights?.author === canonical.author, `${asset.id} author metadata changed`);
  assert(
    typeof asset.rights?.source === 'string' && asset.rights.source.startsWith('https://'),
    `${asset.id} source URL is missing`,
  );
  assert(
    typeof asset.rights?.modifications === 'string' && asset.rights.modifications.length > 20,
    `${asset.id} modification notice is missing`,
  );

  const bytes = await readFile(new URL(asset.file, root));
  const digest = createHash('sha256').update(bytes).digest('hex');
  assert(bytes.length === canonical.bytes, `${asset.id} packaged byte count does not match`);
  assert(digest === canonical.sha256, `${asset.id} packaged SHA-256 does not match`);
}

const attribution = await readFile(new URL('ATTRIBUTION.md', root), 'utf8');
for (const required of [
  'Adam-synagda',
  'CC0-1.0',
  'Islamic Center Malmö',
  'CC-BY-3.0',
  'f4a0bd42b475a0a7a452a6e662a1cd9566e9f5de',
]) {
  assert(attribution.includes(required), `ATTRIBUTION.md is missing ${required}`);
}

console.log('Packaged Adhan audio integrity, normalization metadata and rights records passed.');

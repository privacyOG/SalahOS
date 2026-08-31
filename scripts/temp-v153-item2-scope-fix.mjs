import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatorPath = path.join(root, 'scripts', 'generate-australian-mosque-finder.mjs');
const finderPath = path.join(root, 'src', 'data', 'australian-mosque-finder.json');

let generator = await readFile(generatorPath, 'utf8');
const broad = ".replace(/,\\s*/gu, ', ')";
const narrow = ".replace(/,\\s+(?=[^.,])/gu, ', ')";
if (!generator.includes(broad)) throw new Error('Address-normalizer marker not found');
generator = generator.replace(broad, narrow);
await writeFile(generatorPath, generator, 'utf8');

const finder = JSON.parse(await readFile(finderPath, 'utf8'));
const alice = finder.records.find(
  (record) => record.id === 'mosque-finder:alice-springs-larapinta-lyndavale-drive-mosque',
);
if (alice === undefined) throw new Error('Alice Springs fixture not found');
if (alice.address.line1 === '101 Lyndavale Drive, . NT') alice.address.line1 = '101 Lyndavale Drive,. NT';
if (alice.address.formatted === '101 Lyndavale Drive, . NT, Larapinta, NT, 0870') {
  alice.address.formatted = '101 Lyndavale Drive,. NT, Larapinta, NT, 0870';
}
await writeFile(finderPath, `${JSON.stringify(finder, null, 2)}\n`, 'utf8');

for (const args of [
  ['scripts/generate-australian-mosque-finder.mjs'],
  ['scripts/generate-australian-mosque-combined.mjs'],
  ['scripts/generate-mosque-directory-packs.mjs'],
]) {
  execFileSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
}

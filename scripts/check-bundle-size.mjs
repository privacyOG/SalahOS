import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const assetsDirectory = path.join(root, 'dist', 'assets');
const MAX_JS_CHUNK_BYTES = 550_000;
const MAX_TOTAL_JS_BYTES = 1_250_000;
const MIN_JS_CHUNKS = 5;

function assert(condition, message) {
  if (!condition) throw new Error(`Bundle architecture check failed: ${message}`);
}

const files = await readdir(assetsDirectory);
const jsFiles = files.filter((file) => file.endsWith('.js'));
assert(
  jsFiles.length >= MIN_JS_CHUNKS,
  `expected at least ${String(MIN_JS_CHUNKS)} JavaScript chunks`,
);

const sizes = await Promise.all(
  jsFiles.map(async (file) => ({
    file,
    bytes: (await stat(path.join(assetsDirectory, file))).size,
  })),
);
const totalBytes = sizes.reduce((sum, entry) => sum + entry.bytes, 0);
const largest = sizes.toSorted((a, b) => b.bytes - a.bytes)[0];

assert(largest !== undefined, 'no JavaScript chunks were produced');
assert(
  largest.bytes <= MAX_JS_CHUNK_BYTES,
  `${largest.file} is ${String(largest.bytes)} bytes; per-chunk budget is ${String(MAX_JS_CHUNK_BYTES)}`,
);
assert(
  totalBytes <= MAX_TOTAL_JS_BYTES,
  `total JavaScript is ${String(totalBytes)} bytes; budget is ${String(MAX_TOTAL_JS_BYTES)}`,
);

const mainSource = await readFile(path.join(root, 'src', 'main.tsx'), 'utf8');
assert(
  mainSource.includes("import('./ui/AdministrationApplication')"),
  'administration surface must remain dynamically imported',
);
assert(
  mainSource.includes("import('./ui/SmartDisplayRoot')"),
  'smart-display surface must remain dynamically imported',
);

const mosqueLibrarySource = await readFile(
  path.join(root, 'src', 'platform', 'mosqueLibrary.ts'),
  'utf8',
);
assert(
  !mosqueLibrarySource.includes('timetableImport'),
  'mosque library must not statically import the timetable import/export module',
);

console.log(
  `Bundle architecture passed: ${String(jsFiles.length)} chunks, largest ${largest.file} ${String(largest.bytes)} bytes, total ${String(totalBytes)} bytes.`,
);

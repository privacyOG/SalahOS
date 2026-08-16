import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = join(repositoryRoot, 'src');
const executableExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (executableExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

const applicationFiles = (await collectFiles(sourceRoot)).filter(
  (path) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'),
);

const prohibitedPatterns = [
  { label: 'fetch()', pattern: /\bfetch\s*\(/ },
  { label: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { label: 'WebSocket', pattern: /\bnew\s+WebSocket\s*\(/ },
  { label: 'EventSource', pattern: /\bnew\s+EventSource\s*\(/ },
  { label: 'remote HTTP URL literal', pattern: /["'`]https?:\/\// },
];

const violations = [];
for (const file of applicationFiles) {
  const content = await readFile(file, 'utf8');
  for (const { label, pattern } of prohibitedPatterns) {
    if (pattern.test(content)) {
      violations.push(`${relative(repositoryRoot, file)}: ${label}`);
    }
  }
}

if (violations.length > 0) {
  throw new Error(
    `Unreviewed remote-network capability detected. SalahOS v1 application code must remain local-first:\n${violations.join('\n')}`,
  );
}

console.log(`Remote network policy passed for ${applicationFiles.length} application source files.`);

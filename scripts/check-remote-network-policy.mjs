import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = join(repositoryRoot, 'src');
const executableExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const reviewedRemoteNetworkFiles = new Set(['src/platform/managedAdminTransport.ts']);

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
const reviewedCapabilities = [];
for (const file of applicationFiles) {
  const repositoryPath = relative(repositoryRoot, file);
  const content = await readFile(file, 'utf8');
  for (const { label, pattern } of prohibitedPatterns) {
    if (!pattern.test(content)) continue;
    if (reviewedRemoteNetworkFiles.has(repositoryPath)) {
      reviewedCapabilities.push(`${repositoryPath}: ${label}`);
    } else {
      violations.push(`${repositoryPath}: ${label}`);
    }
  }
}

for (const approvedPath of reviewedRemoteNetworkFiles) {
  if (!applicationFiles.some((file) => relative(repositoryRoot, file) === approvedPath)) {
    throw new Error(`Reviewed remote-network adapter is missing: ${approvedPath}`);
  }
}

if (violations.length > 0) {
  throw new Error(
    `Unreviewed remote-network capability detected. SalahOS application code remains local-first except for explicitly reviewed managed-service adapters:\n${violations.join('\n')}`,
  );
}

console.log(
  `Remote network policy passed for ${applicationFiles.length} application source files. Reviewed managed-service capabilities: ${reviewedCapabilities.length}.`,
);

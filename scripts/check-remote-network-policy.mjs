import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = join(repositoryRoot, 'src');
const executableExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const reviewedRemoteNetworkFiles = new Map([
  ['src/platform/managedAdminTransport.ts', 'managed display administration'],
  ['src/platform/prayerBoardWeather.ts', 'explicitly configured prayer-board weather'],
  ['src/platform/qiblaGoogleMaps.ts', 'interactive Qiblah Google Maps provider'],
  [
    'src/platform/mosqueDirectoryExternalActions.ts',
    'user-initiated mosque directions and external navigation',
  ],
  ['src/platform/sharedMosqueDirectoryTransport.ts', 'shared/community mosque directory'],
]);
const nonRoutableFixtureLiteralFiles = new Set(['src/ui/AdminDisplayThemeManagement.tsx']);
const REMOTE_LITERAL_PATTERN = /["'`]https?:\/\/[^"'`\s]+/gu;
const NON_ROUTABLE_FIXTURE_PATTERN = /^https?:\/\/[A-Za-z0-9.-]+\.invalid(?:[/:?#]|$)/u;

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

function containsOnlyNonRoutableFixtureUrls(repositoryPath, content) {
  if (!nonRoutableFixtureLiteralFiles.has(repositoryPath)) return false;
  const literals = [...content.matchAll(REMOTE_LITERAL_PATTERN)].map((match) => match[0].slice(1));
  return (
    literals.length > 0 && literals.every((literal) => NON_ROUTABLE_FIXTURE_PATTERN.test(literal))
  );
}

const violations = [];
const reviewedCapabilities = [];
for (const file of applicationFiles) {
  const repositoryPath = relative(repositoryRoot, file);
  const content = await readFile(file, 'utf8');
  for (const { label, pattern } of prohibitedPatterns) {
    if (!pattern.test(content)) continue;
    if (
      label === 'remote HTTP URL literal' &&
      containsOnlyNonRoutableFixtureUrls(repositoryPath, content)
    ) {
      reviewedCapabilities.push(`${repositoryPath}: non-routable .invalid visual fixture literal`);
      continue;
    }
    if (reviewedRemoteNetworkFiles.has(repositoryPath)) {
      reviewedCapabilities.push(
        `${repositoryPath}: ${label} (${reviewedRemoteNetworkFiles.get(repositoryPath)})`,
      );
    } else {
      violations.push(`${repositoryPath}: ${label}`);
    }
  }
}

for (const approvedPath of reviewedRemoteNetworkFiles.keys()) {
  if (!applicationFiles.some((file) => relative(repositoryRoot, file) === approvedPath)) {
    throw new Error(`Reviewed remote-network adapter is missing: ${approvedPath}`);
  }
}

if (violations.length > 0) {
  throw new Error(
    `Unreviewed remote-network capability detected. Remote application traffic must stay in explicitly reviewed, narrowly scoped adapters:\n${violations.join('\n')}`,
  );
}

console.log(
  `Remote network policy passed for ${applicationFiles.length} application source files. Reviewed capabilities: ${reviewedCapabilities.length}.`,
);

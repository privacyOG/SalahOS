import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import prettier from 'prettier';

const artifactDirectory = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
);
const files = [
  'src/ui/AdminOverviewDashboard.tsx',
  'src/ui/AdminShell.tsx',
  'src/ui/SettingsScreen.tsx',
];

await mkdir(artifactDirectory, { recursive: true });
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const config = (await prettier.resolveConfig(file)) ?? {};
  const formatted = await prettier.format(source, { ...config, filepath: file });
  await writeFile(path.join(artifactDirectory, `prettier-${path.basename(file)}`), formatted);
}

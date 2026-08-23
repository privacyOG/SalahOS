import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as prettier from 'prettier';

const output = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
  '_formatter-diagnostic',
);
const formattedOutput = path.join(output, 'formatted');
const files = [
  'scripts/visual-prayer-board-announcements.mjs',
  'src/domain/prayerBoardAnnouncementRotation.test.ts',
  'src/domain/prayerBoardAnnouncementRotation.ts',
  'src/platform/prayerBoardAnnouncementRotation.test.ts',
  'src/platform/prayerBoardAnnouncementRotation.ts',
  'src/ui/PrayerBoardAnnouncementSettings.tsx',
  'src/ui/SmartDisplay.tsx',
];

await mkdir(formattedOutput, { recursive: true });
for (const file of files) {
  const config = (await prettier.resolveConfig(file)) ?? {};
  const source = await readFile(file, 'utf8');
  const formatted = await prettier.format(source, { ...config, filepath: file });
  const destination = path.join(formattedOutput, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, formatted);
}

await cp(path.resolve('node_modules/prettier'), path.join(output, 'prettier'), {
  recursive: true,
});

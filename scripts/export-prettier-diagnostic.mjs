import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
  '_formatter-diagnostic',
);

await mkdir(output, { recursive: true });
await cp(path.resolve('node_modules/prettier'), path.join(output, 'prettier'), {
  recursive: true,
});

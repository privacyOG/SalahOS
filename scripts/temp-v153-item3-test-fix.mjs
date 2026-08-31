import { readFile, writeFile } from 'node:fs/promises';

const target = 'src/ui/KnowledgeTextDirection.test.tsx';
let source = await readFile(target, 'utf8');
const before = `    .filter((tag) => tag.includes(marker));`;
const after = `    .filter((tag) => new RegExp(\`\\\\b\${marker}(?:\\\\s|=|>)\`, 'u').test(tag));`;
if (!source.includes(before)) throw new Error('Direction assertion matcher not found');
source = source.replace(before, after);
await writeFile(target, source, 'utf8');
console.log('Tightened direction assertion to exact data-attribute matches.');

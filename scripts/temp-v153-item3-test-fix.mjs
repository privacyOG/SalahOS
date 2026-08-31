import { readFile, writeFile } from 'node:fs/promises';

const target = 'src/ui/KnowledgeTextDirection.test.tsx';
let source = await readFile(target, 'utf8');
const before = `function openingTagsContaining(source: string, marker: string): readonly string[] {
  return [...source.matchAll(/<[^>]+>/gu)]
    .map((match) => match[0])
    .filter((tag) => tag.includes(marker));
}`;
const after = `function openingTagsContaining(source: string, marker: string): readonly string[] {
  const pattern = new RegExp(\`\\\\b\${marker}(?:\\\\s|=|>)\`, 'gu');
  return [...source.matchAll(pattern)]
    .map((match) => {
      const markerOffset = match.index ?? 0;
      const start = source.lastIndexOf('<', markerOffset);
      const end = source.indexOf('>', markerOffset);
      return start >= 0 && end > start ? source.slice(start, end + 1) : '';
    })
    .filter(Boolean);
}`;
if (!source.includes(before)) throw new Error('Direction assertion helper not found');
source = source.replace(before, after);
await writeFile(target, source, 'utf8');
console.log('Made direction assertion exact and safe for JSX event-handler arrows.');

import { readFile, writeFile } from 'node:fs/promises';

const target = 'scripts/temp-v153-item3-patch.mjs';
let source = await readFile(target, 'utf8');

const helperAnchor = 'function replaceCount(source, before, after, expected, label) {';
if (!source.includes(helperAnchor)) throw new Error('replaceCount helper anchor missing');
source = source.replace(
  helperAnchor,
  `function replaceFirst(source, before, after, label) {
  if (!source.includes(before)) throw new Error(\`${'${label}'}: expected at least one match\`);
  return source.replace(before, after);
}

${helperAnchor}`,
);

const hadithAnchor = `details = replaceExact(
  details,
  "      <p className=\\"knowledge-card__source-note\\">{entry.sourceNote}</p>\\n",`;
if (!source.includes(hadithAnchor)) throw new Error('Hadith source-note matcher anchor missing');
source = source.replace(hadithAnchor, hadithAnchor.replace('replaceExact', 'replaceFirst'));

await writeFile(target, source, 'utf8');
console.log('Adjusted the Item 3 patcher to replace only the first source-note occurrence.');

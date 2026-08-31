import { readFile, writeFile } from 'node:fs/promises';

const target = 'src/domain/islamicKnowledgeGovernance.ts';
let source = await readFile(target, 'utf8');
const before = `    if (
      source.displayPresentation.lang.trim().length === 0 ||
      (source.displayPresentation.dir !== 'ltr' && source.displayPresentation.dir !== 'rtl')
    ) {`;
const after = `    if (source.displayPresentation.lang.trim().length === 0) {`;
if (!source.includes(before)) throw new Error('Redundant direction-validation block not found');
source = source.replace(before, after);
await writeFile(target, source, 'utf8');
console.log('Removed redundant typed direction condition.');

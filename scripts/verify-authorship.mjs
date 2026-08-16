import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const root = process.cwd();
const expectedAuthor = 'privacyOG';
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'coverage', 'artifacts']);

const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
if (packageJson.author !== expectedAuthor) {
  throw new Error(
    `package.json author must remain ${expectedAuthor}; received ${String(packageJson.author)}`,
  );
}

const markdownFiles = [];
function collectMarkdown(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      collectMarkdown(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) markdownFiles.push(fullPath);
  }
}
collectMarkdown(root);

const authorDeclaration = /^\s*(?:\*\*)?Author(?:\*\*)?:\s*(.+?)\s*$/i;
for (const filePath of markdownFiles) {
  if (!statSync(filePath).isFile()) continue;
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    const match = line.match(authorDeclaration);
    if (match === null) continue;
    const declared = match[1].replace(/\*\*/g, '').trim();
    if (declared !== expectedAuthor) {
      throw new Error(
        `${relative(root, filePath)}:${String(index + 1)} declares unexpected author ${JSON.stringify(declared)}`,
      );
    }
  }
}

const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
if (!readme.includes(`## Author\n\n${expectedAuthor}`)) {
  throw new Error(`README.md must retain the explicit ${expectedAuthor} author section`);
}

console.log(
  `Repository authorship contract passed: package metadata and explicit Markdown author declarations remain ${expectedAuthor}.`,
);

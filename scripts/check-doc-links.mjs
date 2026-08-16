import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const markdownFiles = [];

async function collectMarkdown(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }

    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (path.relative(root, absolute).split(path.sep)[0] === 'docs') {
        await collectMarkdown(absolute);
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      markdownFiles.push(absolute);
    }
  }
}

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.md')) {
    markdownFiles.push(path.join(root, entry.name));
  }
}
await collectMarkdown(path.join(root, 'docs'));

const markdownLink = /\[[^\]]*\]\(([^)]+)\)/g;
const findings = [];

for (const file of markdownFiles) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(markdownLink)) {
    const rawTarget = match[1].trim();
    const target = rawTarget.split('#', 1)[0].split('?', 1)[0];

    if (
      target === '' ||
      target.startsWith('#') ||
      /^[a-z][a-z0-9+.-]*:/i.test(target) ||
      target.startsWith('//')
    ) {
      continue;
    }

    const decodedTarget = decodeURIComponent(target);
    const resolved = decodedTarget.startsWith('/')
      ? path.join(root, decodedTarget.slice(1))
      : path.resolve(path.dirname(file), decodedTarget);

    try {
      await access(resolved);
    } catch {
      findings.push(`${path.relative(root, file).split(path.sep).join('/')} -> ${rawTarget}`);
    }
  }
}

if (findings.length > 0) {
  console.error('Documentation link verification failed:');
  for (const finding of findings.sort()) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Documentation link verification passed for ${markdownFiles.length} Markdown files.`);
}

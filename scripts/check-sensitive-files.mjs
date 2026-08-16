import { readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const skippedDirectories = new Set(['.git', 'node_modules', 'dist', 'coverage']);
const allowedNames = new Set(['.env.example']);
const blockedExtensions = new Set([
  '.key',
  '.pem',
  '.p12',
  '.pfx',
  '.jks',
  '.keystore',
  '.mobileprovision',
]);
const blockedNames = new Set([
  'local.properties',
  'credentials.json',
  'secrets.json',
  'credentials.yaml',
  'secrets.yaml',
  'google-services.json',
]);

function normalize(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function isBlocked(relativePath) {
  const base = path.basename(relativePath);
  if (allowedNames.has(base)) {
    return false;
  }
  if (base === '.env' || base.startsWith('.env.')) {
    return true;
  }
  if (blockedNames.has(base.toLowerCase())) {
    return true;
  }
  return blockedExtensions.has(path.extname(base).toLowerCase());
}

async function collectFiles(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) {
      continue;
    }
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(absolutePath, files);
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
}

const findings = [];
for (const absolutePath of await collectFiles(root)) {
  const relativePath = normalize(path.relative(root, absolutePath));
  if (isBlocked(relativePath)) {
    findings.push(relativePath);
  }
}

if (findings.length > 0) {
  console.error('Sensitive-file policy failed. Remove these files from version control:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else {
  console.log('Sensitive-file policy passed.');
}

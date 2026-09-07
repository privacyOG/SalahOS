import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const platform = process.argv[2];
const nativeRoots = {
  android: path.resolve('android/app/src/main/assets/public'),
  ios: path.resolve('ios/App/App/public'),
};
const nativeRoot = nativeRoots[platform];

if (nativeRoot === undefined) {
  throw new Error('Usage: node scripts/check-quran-native-bundle.mjs <android|ios>');
}

const manifest = JSON.parse(
  await readFile(path.resolve('src/data/quran-offline-manifest.json'), 'utf8'),
);
const relativePackPath = manifest.packPath.replace(/^\//u, '');
const sourcePackPath = path.resolve('public', relativePackPath);
const nativePackPath = path.join(nativeRoot, relativePackPath);
const sourceFontPath = path.resolve('public/fonts/amiri-quran-arabic.woff2');
const nativeFontPath = path.join(nativeRoot, 'fonts/amiri-quran-arabic.woff2');

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const sourcePack = await readFile(sourcePackPath);
const nativePack = await readFile(nativePackPath);
if (digest(sourcePack) !== manifest.sha256) {
  throw new Error('Production Qur’an pack SHA-256 differs from the pinned manifest.');
}
if (digest(nativePack) !== manifest.sha256) {
  throw new Error(`${platform} packaged Qur’an SHA-256 differs from the pinned manifest.`);
}
if (!sourcePack.equals(nativePack)) {
  throw new Error(`${platform} packaged Qur’an is not byte-identical to the production pack.`);
}

const parsedPack = JSON.parse(nativePack.toString('utf8'));
if (parsedPack.counts?.surahs !== 114 || parsedPack.counts?.ayahs !== 6236) {
  throw new Error(`${platform} packaged Qur’an does not report 114 surahs / 6,236 ayat.`);
}
if (!Array.isArray(parsedPack.surahs) || parsedPack.surahs.length !== 114) {
  throw new Error(`${platform} packaged Qur’an surah collection is incomplete.`);
}

const sourceFont = await readFile(sourceFontPath);
const nativeFont = await readFile(nativeFontPath);
if (!sourceFont.equals(nativeFont)) {
  throw new Error(`${platform} packaged Amiri Qur’an font differs from the production font.`);
}
if (nativeFont.length === 0) {
  throw new Error(`${platform} packaged Amiri Qur’an font is empty.`);
}

console.log(
  `${platform} native bundle contains the exact pinned Qur’an corpus and Amiri Qur’an font.`,
);

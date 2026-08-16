import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const version = packageJson.version;
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`package.json must declare a stable x.y.z release version; received ${String(version)}`);
}

const androidBuild = readFileSync(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
const iosInfo = readFileSync(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8');
const releaseNotes = readFileSync(
  new URL(`../docs/RELEASE_NOTES_${version}.md`, import.meta.url),
  'utf8',
);

const androidVersionName = androidBuild.match(/\bversionName\s+["']([^"']+)["']/)?.[1];
const androidVersionCode = androidBuild.match(/\bversionCode\s+(\d+)/)?.[1];
if (androidVersionName !== version) {
  throw new Error(
    `Android versionName ${String(androidVersionName)} does not match package version ${version}`,
  );
}
if (androidVersionCode !== '1') {
  throw new Error(`Android versionCode must remain 1 for the first ${version} release candidate`);
}

function plistStringForKey(key) {
  return iosInfo.match(new RegExp(`<key>${key}<\\/key>\\s*<string>([^<]+)<\\/string>`))?.[1];
}

const iosShortVersion = plistStringForKey('CFBundleShortVersionString');
const iosBuildVersion = plistStringForKey('CFBundleVersion');
if (iosShortVersion !== version) {
  throw new Error(
    `iOS CFBundleShortVersionString ${String(iosShortVersion)} does not match package version ${version}`,
  );
}
if (iosBuildVersion !== '1') {
  throw new Error(`iOS CFBundleVersion must remain 1 for the first ${version} release candidate`);
}
if (iosInfo.includes('$(MARKETING_VERSION)') || iosInfo.includes('$(CURRENT_PROJECT_VERSION)')) {
  throw new Error('Packaged iOS version metadata must be explicit and release-version controlled');
}

if (!releaseNotes.startsWith(`# SalahOS ${version} release notes\n`)) {
  throw new Error(`Release notes heading does not match package version ${version}`);
}

console.log(
  `Release version contract passed: package, Android and packaged iOS metadata all advertise ${version} with first-release build number 1.`,
);

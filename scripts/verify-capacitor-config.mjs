import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const sourcePath = resolve(root, 'capacitor.config.ts');
const source = readFileSync(sourcePath, 'utf8');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const iosWorkflow = readFileSync(resolve(root, '.github/workflows/ios.yml'), 'utf8');

const requiredSourceContracts = [
  "appId: 'com.privacyog.salahos'",
  "appName: 'SalahOS'",
  "webDir: 'dist'",
];
for (const contract of requiredSourceContracts) {
  if (!source.includes(contract)) {
    throw new Error(`Capacitor source configuration changed: missing ${contract}`);
  }
}

for (const forbidden of [
  /\bserver\s*:/,
  /\ballowNavigation\s*:/,
  /\bcleartext\s*:/,
  /\bhostname\s*:/,
  /\bandroidScheme\s*:/,
  /\biosScheme\s*:/,
]) {
  if (forbidden.test(source)) {
    throw new Error(
      `Capacitor configuration contains an unreviewed remote-content or origin override: ${forbidden}`,
    );
  }
}

const androidSync = packageJson.scripts?.['android:sync'];
if (
  typeof androidSync !== 'string' ||
  !androidSync.includes('cap sync android') ||
  !androidSync.includes('npm run verify:capacitor-config') ||
  androidSync.indexOf('npm run verify:capacitor-config') < androidSync.indexOf('cap sync android')
) {
  throw new Error('Android sync must verify generated Capacitor configuration after cap sync android');
}

const iosSyncMarker = 'run: npx cap sync ios';
const iosVerifyMarker = 'run: npm run verify:capacitor-config';
const iosSyncIndex = iosWorkflow.indexOf(iosSyncMarker);
const iosVerifyIndex = iosWorkflow.indexOf(iosVerifyMarker);
if (iosSyncIndex < 0 || iosVerifyIndex < 0 || iosVerifyIndex < iosSyncIndex) {
  throw new Error('iOS workflow must verify generated Capacitor configuration after cap sync ios');
}

const generatedPaths = [
  resolve(root, 'android/app/src/main/assets/capacitor.config.json'),
  resolve(root, 'ios/App/App/capacitor.config.json'),
];

for (const generatedPath of generatedPaths) {
  if (!existsSync(generatedPath)) continue;
  const generated = JSON.parse(readFileSync(generatedPath, 'utf8'));
  if (generated.appId !== 'com.privacyog.salahos') {
    throw new Error(`Generated Capacitor appId is unexpected in ${generatedPath}`);
  }
  if (generated.appName !== 'SalahOS') {
    throw new Error(`Generated Capacitor appName is unexpected in ${generatedPath}`);
  }
  if (generated.webDir !== 'dist') {
    throw new Error(`Generated Capacitor webDir is unexpected in ${generatedPath}`);
  }
  if (Object.prototype.hasOwnProperty.call(generated, 'server')) {
    throw new Error(`Generated Capacitor configuration must not contain a server block: ${generatedPath}`);
  }
}

console.log(
  'Capacitor configuration passed: native shells use the bundled dist application with no remote server, navigation allowlist, cleartext, hostname, or scheme override, and synchronized native copies are rechecked after cap sync.',
);

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const androidVariables = readFileSync(resolve(root, 'android/variables.gradle'), 'utf8');
const androidBuild = readFileSync(resolve(root, 'android/build.gradle'), 'utf8');
const androidAppBuild = readFileSync(resolve(root, 'android/app/build.gradle'), 'utf8');
const androidCapacitorBuild = readFileSync(
  resolve(root, 'android/app/capacitor.build.gradle'),
  'utf8',
);
const iosPackage = readFileSync(resolve(root, 'ios/App/CapApp-SPM/Package.swift'), 'utf8');

const expectedPackages = new Map([
  ['@capacitor/android', '8.4.2'],
  ['@capacitor/core', '8.4.2'],
  ['@capacitor/ios', '8.4.2'],
  ['@capacitor/geolocation', '8.2.0'],
  ['@capacitor/local-notifications', '8.2.1'],
  ['@capacitor/preferences', '8.0.1'],
]);

for (const [name, expectedVersion] of expectedPackages) {
  const actualVersion = packageJson.dependencies?.[name];
  if (actualVersion !== expectedVersion) {
    throw new Error(
      `${name} changed from reviewed native version ${expectedVersion} to ${String(actualVersion)}`,
    );
  }
}
if (packageJson.devDependencies?.['@capacitor/cli'] !== '8.4.2') {
  throw new Error('@capacitor/cli changed from reviewed native tooling version 8.4.2');
}

for (const contract of [
  "androidxActivityVersion = '1.11.0'",
  "androidxAppCompatVersion = '1.7.1'",
  "androidxCoordinatorLayoutVersion = '1.3.0'",
  "androidxCoreVersion = '1.17.0'",
  "androidxFragmentVersion = '1.8.9'",
  "coreSplashScreenVersion = '1.2.0'",
  "androidxWebkitVersion = '1.14.0'",
  "cordovaAndroidVersion = '14.0.1'",
]) {
  if (!androidVariables.includes(contract)) {
    throw new Error(`Reviewed Android native dependency contract changed: ${contract}`);
  }
}

if (!androidBuild.includes("classpath 'com.android.tools.build:gradle:8.13.0'")) {
  throw new Error('Android Gradle plugin changed from reviewed tooling version 8.13.0');
}

function dependencyLines(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) =>
      /^(?:implementation|testImplementation|androidTestImplementation)\b/.test(line),
    );
}

function assertExactLines(label, actualLines, expectedLines) {
  const actual = [...actualLines].sort();
  const expected = [...expectedLines].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} dependency declarations changed; review the native dependency surface before updating this contract`,
    );
  }
}

assertExactLines('Android app', dependencyLines(androidAppBuild), [
  "implementation fileTree(include: ['*.jar'], dir: 'libs')",
  'implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"',
  'implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"',
  'implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"',
  "implementation project(':capacitor-android')",
  'testImplementation "junit:junit:$junitVersion"',
  'androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"',
  'androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"',
  "implementation project(':capacitor-cordova-android-plugins')",
]);

assertExactLines('Generated Capacitor Android', dependencyLines(androidCapacitorBuild), [
  "implementation project(':capacitor-geolocation')",
  "implementation project(':capacitor-local-notifications')",
  "implementation project(':capacitor-preferences')",
]);

function swiftManifestLines(prefix) {
  return iosPackage
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/,$/, ''))
    .filter((line) => line.startsWith(prefix));
}

assertExactLines('iOS Swift package', swiftManifestLines('.package('), [
  '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.2")',
  '.package(name: "CapacitorGeolocation", path: "../../../node_modules/@capacitor/geolocation")',
  '.package(name: "CapacitorLocalNotifications", path: "../../../node_modules/@capacitor/local-notifications")',
  '.package(name: "CapacitorPreferences", path: "../../../node_modules/@capacitor/preferences")',
]);

assertExactLines('iOS Swift products', swiftManifestLines('.product('), [
  '.product(name: "Capacitor", package: "capacitor-swift-pm")',
  '.product(name: "Cordova", package: "capacitor-swift-pm")',
  '.product(name: "CapacitorGeolocation", package: "CapacitorGeolocation")',
  '.product(name: "CapacitorLocalNotifications", package: "CapacitorLocalNotifications")',
  '.product(name: "CapacitorPreferences", package: "CapacitorPreferences")',
]);

const localBinaryRoots = [
  resolve(root, 'android/app/libs'),
  resolve(root, 'android/capacitor-cordova-android-plugins/src/main/libs'),
];
const unreviewedBinaries = [];
function collectNativeBinaries(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      collectNativeBinaries(path);
    } else if (entry.isFile() && /\.(?:aar|jar)$/i.test(entry.name)) {
      unreviewedBinaries.push(relative(root, path));
    }
  }
}
for (const directory of localBinaryRoots) collectNativeBinaries(directory);
if (unreviewedBinaries.length > 0) {
  throw new Error(
    `Unreviewed local Android binary dependencies are not permitted: ${unreviewedBinaries.join(', ')}`,
  );
}

console.log(
  'Native dependency surface passed: reviewed Capacitor/AndroidX/Cordova versions and direct native dependency declarations are pinned, with no unreviewed local Android binaries.',
);

import fs from 'node:fs';
import path from 'node:path';

const pluginRoot = path.resolve('node_modules/@capacitor/local-notifications');
const pluginPackagePath = path.join(pluginRoot, 'package.json');
const pluginManifestPath = path.join(pluginRoot, 'android/src/main/AndroidManifest.xml');
const restoreReceiverPath = path.join(
  pluginRoot,
  'android/src/main/java/com/capacitorjs/plugins/localnotifications/LocalNotificationRestoreReceiver.java',
);

function readRequired(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required Android notification reboot contract file is missing: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function requireFragments(label, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) {
      throw new Error(`${label} is missing required reboot contract fragment: ${fragment}`);
    }
  }
}

const declaredPackage = JSON.parse(readRequired(path.resolve('package.json')));
const installedPackage = JSON.parse(readRequired(pluginPackagePath));
const declaredVersion = declaredPackage.dependencies?.['@capacitor/local-notifications'];
if (typeof declaredVersion !== 'string' || installedPackage.version !== declaredVersion) {
  throw new Error(
    `Local Notifications version mismatch: declared ${String(declaredVersion)}, installed ${String(installedPackage.version)}`,
  );
}

const pluginManifest = readRequired(pluginManifestPath);
requireFragments('Local Notifications Android manifest', pluginManifest, [
  'LocalNotificationRestoreReceiver',
  'android.intent.action.BOOT_COMPLETED',
  'android.intent.action.LOCKED_BOOT_COMPLETED',
  'android.permission.RECEIVE_BOOT_COMPLETED',
]);

const restoreReceiver = readRequired(restoreReceiverPath);
requireFragments('LocalNotificationRestoreReceiver', restoreReceiver, [
  'getSavedNotificationIds()',
  'getSavedNotification(id)',
  'localNotificationManager.schedule(null, notifications)',
]);

const intermediatesRoot = path.resolve('android/app/build/intermediates');
const mergedManifestCandidates = [];
function collectManifests(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectManifests(fullPath);
    else if (entry.isFile() && entry.name === 'AndroidManifest.xml')
      mergedManifestCandidates.push(fullPath);
  }
}
collectManifests(intermediatesRoot);

const mergedManifest = mergedManifestCandidates.find((candidate) => {
  const source = fs.readFileSync(candidate, 'utf8');
  return (
    source.includes('LocalNotificationRestoreReceiver') &&
    source.includes('android.permission.RECEIVE_BOOT_COMPLETED') &&
    source.includes('android.intent.action.BOOT_COMPLETED')
  );
});

if (mergedManifest === undefined) {
  throw new Error(
    'No merged Android manifest contains the Local Notifications boot restore receiver contract',
  );
}

console.log(
  `Android notification reboot contract verified for @capacitor/local-notifications ${installedPackage.version} in ${path.relative(process.cwd(), mergedManifest)}.`,
);

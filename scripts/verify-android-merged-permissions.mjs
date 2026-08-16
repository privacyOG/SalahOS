import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const androidBuildIntermediates = resolve('android/app/build/intermediates');
const expectedMergedPermissions = new Set([
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.INTERNET',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.WAKE_LOCK',
]);

function collectManifestCandidates(directory) {
  if (!existsSync(directory)) return [];
  const candidates = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      candidates.push(...collectManifestCandidates(path));
    } else if (entry === 'AndroidManifest.xml') {
      candidates.push(path);
    }
  }
  return candidates;
}

function declaredPermissions(manifest) {
  return [
    ...manifest.matchAll(/<uses-permission(?:-sdk-\d+)?\s+[^>]*android:name="([^"]+)"[^>]*\/?\s*>/g),
  ].map((match) => match[1]);
}

function containsSalahOsMainActivity(manifest) {
  return (
    manifest.includes('android:name="com.privacyog.salahos.MainActivity"') ||
    manifest.includes('android:name=".MainActivity"')
  );
}

const effectiveCandidates = collectManifestCandidates(androidBuildIntermediates).filter((path) => {
  const manifest = readFileSync(path, 'utf8');
  return (
    containsSalahOsMainActivity(manifest) &&
    manifest.includes('com.capacitorjs.plugins.localnotifications.LocalNotificationRestoreReceiver')
  );
});

if (effectiveCandidates.length === 0) {
  throw new Error(
    'No merged/packaged Android manifest containing the SalahOS activity and Local Notifications restore receiver was found. Run an Android build first.',
  );
}

for (const path of effectiveCandidates) {
  const manifest = readFileSync(path, 'utf8');
  const permissions = declaredPermissions(manifest);
  const uniquePermissions = new Set(permissions);

  if (uniquePermissions.size !== permissions.length) {
    throw new Error(`Merged Android manifest contains duplicate permissions: ${path}`);
  }
  for (const permission of uniquePermissions) {
    if (!expectedMergedPermissions.has(permission)) {
      throw new Error(`Unexpected effective Android permission ${permission} in ${path}`);
    }
  }
  for (const permission of expectedMergedPermissions) {
    if (!uniquePermissions.has(permission)) {
      throw new Error(`Reviewed effective Android permission ${permission} is missing from ${path}`);
    }
  }
}

console.log(
  `Effective Android permission contract passed across ${String(effectiveCandidates.length)} merged/packaged manifest candidate(s): ${String(expectedMergedPermissions.size)} reviewed permissions.`,
);

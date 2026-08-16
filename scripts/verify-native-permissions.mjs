import { readFileSync } from 'node:fs';

const androidManifest = readFileSync(
  new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url),
  'utf8',
);
const androidLegacyBackupRules = readFileSync(
  new URL('../android/app/src/main/res/xml/backup_rules.xml', import.meta.url),
  'utf8',
);
const androidDataExtractionRules = readFileSync(
  new URL('../android/app/src/main/res/xml/data_extraction_rules.xml', import.meta.url),
  'utf8',
);
const iosInfo = readFileSync(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8');
const iosProject = readFileSync(
  new URL('../ios/App/App.xcodeproj/project.pbxproj', import.meta.url),
  'utf8',
);

const expectedAndroidPermissions = new Set([
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.INTERNET',
  'android.permission.SCHEDULE_EXACT_ALARM',
]);

const declaredAndroidPermissions = [
  ...androidManifest.matchAll(/<uses-permission\s+android:name="([^"]+)"\s*\/?>/g),
].map((match) => match[1]);

for (const permission of declaredAndroidPermissions) {
  if (!expectedAndroidPermissions.has(permission)) {
    throw new Error(`Unexpected explicit Android permission: ${permission}`);
  }
}
for (const permission of expectedAndroidPermissions) {
  if (!declaredAndroidPermissions.includes(permission)) {
    throw new Error(`Required reviewed Android permission is missing: ${permission}`);
  }
}
if (new Set(declaredAndroidPermissions).size !== declaredAndroidPermissions.length) {
  throw new Error('Android manifest contains duplicate explicit permissions');
}

for (const requiredManifestBoundary of [
  'android:allowBackup="false"',
  'android:fullBackupContent="@xml/backup_rules"',
  'android:dataExtractionRules="@xml/data_extraction_rules"',
]) {
  if (!androidManifest.includes(requiredManifestBoundary)) {
    throw new Error(`Android local-data backup boundary is missing: ${requiredManifestBoundary}`);
  }
}

const backupDomains = ['root', 'file', 'database', 'sharedpref', 'external'];
for (const domain of backupDomains) {
  const exclusion = `<exclude domain="${domain}" path="." />`;
  if (!androidLegacyBackupRules.includes(exclusion)) {
    throw new Error(`Legacy Android backup rules do not exclude the ${domain} domain`);
  }
  const extractionOccurrences = androidDataExtractionRules.split(exclusion).length - 1;
  if (extractionOccurrences !== 2) {
    throw new Error(
      `Android data-extraction rules must exclude ${domain} from both cloud backup and device transfer`,
    );
  }
}
if (
  !androidDataExtractionRules.includes('<cloud-backup>') ||
  !androidDataExtractionRules.includes('<device-transfer>')
) {
  throw new Error('Android data-extraction rules must cover cloud backup and device transfer');
}

if (!iosInfo.includes('<key>NSLocationWhenInUseUsageDescription</key>')) {
  throw new Error('iOS when-in-use location description is missing');
}
for (const forbidden of [
  'NSLocationAlwaysUsageDescription',
  'NSLocationAlwaysAndWhenInUseUsageDescription',
  'NSCameraUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSContactsUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'UIBackgroundModes',
]) {
  if (iosInfo.includes(`<key>${forbidden}</key>`)) {
    throw new Error(`Unexpected iOS permission/background declaration: ${forbidden}`);
  }
}
if (/CODE_SIGN_ENTITLEMENTS\s*=/.test(iosProject)) {
  throw new Error('Unexpected iOS entitlements file is configured; review it before enabling');
}

console.log(
  `Native permission/privacy contract passed: ${declaredAndroidPermissions.length} reviewed app-owned Android permissions, Android backup/transfer exclusion policy, and iOS when-in-use location only.`,
);

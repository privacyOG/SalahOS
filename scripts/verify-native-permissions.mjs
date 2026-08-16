import { readFileSync } from 'node:fs';

const androidManifest = readFileSync(
  new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url),
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
  `Native permission contract passed: ${declaredAndroidPermissions.length} reviewed Android permissions and iOS when-in-use location only.`,
);

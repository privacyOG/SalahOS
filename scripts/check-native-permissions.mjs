import { readFile } from 'node:fs/promises';

const androidManifestPath = new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url);
const iosInfoPath = new URL('../ios/App/App/Info.plist', import.meta.url);

const [androidManifest, iosInfo] = await Promise.all([
  readFile(androidManifestPath, 'utf8'),
  readFile(iosInfoPath, 'utf8'),
]);

const allowedAndroidPermissions = new Set([
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.INTERNET',
  'android.permission.SCHEDULE_EXACT_ALARM',
]);

const declaredAndroidPermissions = [
  ...androidManifest.matchAll(/<uses-permission\s+android:name="([^"]+)"\s*\/>/g),
].map((match) => match[1]);

const unexpectedAndroidPermissions = declaredAndroidPermissions.filter(
  (permission) => !allowedAndroidPermissions.has(permission),
);

if (unexpectedAndroidPermissions.length > 0) {
  throw new Error(
    `Unexpected Android permissions require explicit review: ${unexpectedAndroidPermissions.join(', ')}`,
  );
}

for (const requiredPermission of [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
]) {
  if (!declaredAndroidPermissions.includes(requiredPermission)) {
    throw new Error(
      `Required foreground Android location permission is missing: ${requiredPermission}`,
    );
  }
}

for (const forbiddenAndroidPermission of [
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
]) {
  if (androidManifest.includes(forbiddenAndroidPermission)) {
    throw new Error(`Forbidden Android permission detected: ${forbiddenAndroidPermission}`);
  }
}

if (!iosInfo.includes('<key>NSLocationWhenInUseUsageDescription</key>')) {
  throw new Error('iOS foreground location usage description is required');
}

for (const forbiddenIosKey of [
  'NSLocationAlwaysUsageDescription',
  'NSLocationAlwaysAndWhenInUseUsageDescription',
  'NSCameraUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSContactsUsageDescription',
]) {
  if (iosInfo.includes(`<key>${forbiddenIosKey}</key>`)) {
    throw new Error(
      `Unexpected iOS privacy capability requires explicit review: ${forbiddenIosKey}`,
    );
  }
}

if (/\<key\>UIBackgroundModes\<\/key\>[\s\S]*?\<string\>location\<\/string\>/.test(iosInfo)) {
  throw new Error(
    'iOS background location mode is not permitted for the current SalahOS location flow',
  );
}

console.log('Native permission policy passed.');

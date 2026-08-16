import { readFileSync } from 'node:fs';

const androidScheduler = readFileSync(
  new URL('../src/platform/androidNotificationScheduler.ts', import.meta.url),
  'utf8',
);
const iosScheduler = readFileSync(
  new URL('../src/platform/iosNotificationScheduler.ts', import.meta.url),
  'utf8',
);
const preferences = readFileSync(
  new URL('../src/domain/notificationPreferences.ts', import.meta.url),
  'utf8',
);
const matrix = readFileSync(
  new URL('../docs/NOTIFICATION_CAPABILITY_MATRIX.md', import.meta.url),
  'utf8',
);

for (const contract of [
  "const silentChannelId = 'salahos-prayer-silent';",
  "const silentVibrationChannelId = 'salahos-prayer-silent-vibration';",
  'vibration: false',
  'vibration: true',
  "record.sound === 'silent'",
  'record.vibration ? silentVibrationChannelId : silentChannelId',
]) {
  if (!androidScheduler.includes(contract)) {
    throw new Error(`Android notification capability contract is missing: ${contract}`);
  }
}

for (const contract of [
  "record.sound === 'silent' ? { silent: true } : { sound: '' }",
  'readonly vibration: boolean;',
]) {
  const source = contract.includes('vibration') ? preferences : iosScheduler;
  if (!source.includes(contract)) {
    throw new Error(`Notification capability contract is missing: ${contract}`);
  }
}

for (const statement of [
  'deterministic independent vibration control for the two silent modes',
  'must not claim complete independent sound/vibration control for audible Android notifications',
  'must not claim that it can force vibration on or off independently',
  'cross-platform vibration TODO remains partial',
]) {
  if (!matrix.includes(statement)) {
    throw new Error(`Notification capability documentation is missing: ${statement}`);
  }
}

console.log(
  'Notification capability contract passed: Android silent-channel vibration is explicit and cross-platform vibration remains honestly partial.',
);

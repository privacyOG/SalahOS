import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const required = [
  'SALAHOS_ANDROID_KEYSTORE_PATH',
  'SALAHOS_ANDROID_KEYSTORE_PASSWORD',
  'SALAHOS_ANDROID_KEY_ALIAS',
  'SALAHOS_ANDROID_KEY_PASSWORD',
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Android production signing is incomplete. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

const keystorePath = process.env.SALAHOS_ANDROID_KEYSTORE_PATH;
if (!existsSync(keystorePath)) {
  console.error(`Android release keystore does not exist: ${keystorePath}`);
  process.exit(1);
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
run(npmCommand, ['run', 'android:sync']);

const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(gradleCommand, ['assembleRelease'], {
  cwd: new URL('../android/', import.meta.url),
  env: {
    ...process.env,
    SALAHOS_ANDROID_REQUIRE_SIGNING: 'true',
  },
});

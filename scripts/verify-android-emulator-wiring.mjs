import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/android.yml', import.meta.url), 'utf8');
const acceptanceScript = readFileSync(
  new URL('./android-emulator-acceptance.sh', import.meta.url),
  'utf8',
);

for (const workflowContract of [
  'runs-on: ubuntu-24.04',
  'reactivecircus/android-emulator-runner@a421e43855164a8197daf9d8d40fe71c6996bb0d',
  'api-level: 35',
  'target: google_apis',
  'arch: x86_64',
  'profile: pixel_7_pro',
  'static_node=kvm',
  'script: bash scripts/android-emulator-acceptance.sh',
  'uses: actions/upload-artifact@v4',
  'name: android-emulator-visual-${{ github.sha }}',
  'path: artifacts/android-emulator/*.png',
  'retention-days: 14',
]) {
  if (!workflow.includes(workflowContract)) {
    throw new Error(`Android emulator workflow contract is missing: ${workflowContract}`);
  }
}

for (const scriptContract of [
  'airplane-mode enable',
  'settings get global airplane_mode_on',
  './gradlew installDebug',
  'am force-stop "$PACKAGE"',
  'am start -W -n "$ACTIVITY"',
  'pidof "$PACKAGE"',
  'android-portrait-cold-start.png',
  'android-landscape.png',
  'android-portrait-restored.png',
  ':app:connectedDebugAndroidTest',
]) {
  if (!acceptanceScript.includes(scriptContract)) {
    throw new Error(`Android emulator acceptance contract is missing: ${scriptContract}`);
  }
}

console.log(
  'Android emulator wiring contract passed: pinned Android 35 emulator, offline cold launch, orientation instrumentation, screenshots, and retained artifacts are required.',
);

import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const workflow = await readFile(
  new URL('../.github/workflows/release-assets.yml', import.meta.url),
  'utf8',
);
const androidBuild = await readFile(
  new URL('../scripts/build-android-release.mjs', import.meta.url),
  'utf8',
);
const androidGradle = await readFile(
  new URL('../android/app/build.gradle', import.meta.url),
  'utf8',
);
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

describe('release asset workflow', () => {
  it('requires an exact current-main release candidate before packaging', () => {
    expect(workflow).toContain('Exact-main release preflight');
    expect(workflow).toContain('git fetch origin main --no-tags');
    expect(workflow).toContain('git rev-parse origin/main');
    expect(workflow).toContain(
      'Release candidate ${HEAD_SHA} is not exact current main ${MAIN_SHA}',
    );
    expect(workflow).toContain('does not match package version v${PACKAGE_VERSION}');
  });

  it('publishes versioned Web/PWA and Raspberry Pi bundles', () => {
    expect(workflow).toContain('SalahOS-v${VERSION}-web-pwa.zip');
    expect(workflow).toContain('SalahOS-v${VERSION}-raspberry-pi-kiosk.tar.gz');
    expect(workflow).toContain('SHA256SUMS.txt');
  });

  it('writes portable checksum manifests and verifies them before publication', () => {
    expect(workflow).toMatch(
      /cd release[\s\S]*sha256sum[\s\S]*SalahOS-v\$\{VERSION\}-web-pwa\.zip/,
    );
    expect(workflow).toMatch(
      /cd release[\s\S]*sha256sum[\s\S]*SalahOS-v\$\{VERSION\}-android\.apk/,
    );
    expect(workflow).toMatch(/cd release[\s\S]*sha256sum --check SHA256SUMS\.txt/);
    expect(workflow).not.toMatch(/sha256sum\s+"release\/SalahOS-v\$\{VERSION\}/);
  });

  it('requires persistent Android signing before creating a release APK', () => {
    expect(workflow).toContain('SALAHOS_ANDROID_KEYSTORE_BASE64');
    expect(workflow).toContain('SALAHOS_ANDROID_KEYSTORE_PASSWORD');
    expect(workflow).toContain('SALAHOS_ANDROID_KEY_ALIAS');
    expect(workflow).toContain('SALAHOS_ANDROID_KEY_PASSWORD');
    expect(workflow).toContain("SALAHOS_ANDROID_REQUIRE_SIGNING: 'true'");
    expect(workflow).toContain('android-actions/setup-android@v3');
    expect(workflow).toContain("sdkmanager 'platforms;android-36' 'build-tools;36.0.0'");
    expect(workflow).toContain('apksigner');
    expect(workflow).toContain('app-release.apk');
    expect(workflow).not.toContain('app-debug.apk');
    expect(workflow).not.toMatch(/SalahOS-v[^\n]*-android-debug\.apk/);
  });

  it('keeps unsigned release validation separate from production signing', () => {
    expect(packageJson.scripts['android:release-check']).toBe(
      'node scripts/build-android-release.mjs',
    );
    expect(packageJson.scripts['android:release-unsigned-check']).toContain('assembleRelease');
    expect(androidBuild).toContain('SALAHOS_ANDROID_KEYSTORE_PATH');
    expect(androidBuild).toContain("SALAHOS_ANDROID_REQUIRE_SIGNING: 'true'");
    expect(androidGradle).toContain('releaseSigningRequired && !releaseSigningConfigured');
    expect(androidGradle).toContain('release keystore does not exist');
  });

  it('runs a final exact-file package preflight before publication', () => {
    expect(workflow).toContain('final-package-preflight:');
    expect(workflow).toContain('Final package preflight');
    expect(workflow).toContain('name: release-final');
    expect(workflow).toContain('unzip -t "release/$WEB"');
    expect(workflow).toContain('tar -tzf "release/$PI"');
    expect(workflow).toContain("find . -maxdepth 1 -type f -printf '%f\\n'");
    expect(workflow).toContain('Reverify checksums immediately before publication');
  });

  it('publishes only the final preflighted package', () => {
    expect(workflow).toMatch(
      /publish:[\s\S]*needs:[\s\S]*- preflight[\s\S]*- final-package-preflight/,
    );
    expect(workflow).toContain('name: release-final');
    expect(workflow).toContain("if: github.event_name == 'push'");
  });

  it('does not misrepresent unsupported consumer installers', () => {
    expect(workflow).not.toMatch(/\.dmg\b/);
    expect(workflow).not.toMatch(/\.ipa\b/);
    expect(workflow).not.toMatch(/Simulator.*release/i);
  });
});

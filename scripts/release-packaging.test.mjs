import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const workflow = await readFile(
  new URL('../.github/workflows/release-assets.yml', import.meta.url),
  'utf8',
);

describe('release asset workflow', () => {
  it('publishes versioned Web/PWA and Raspberry Pi bundles', () => {
    expect(workflow).toContain('SalahOS-v${VERSION}-web-pwa.zip');
    expect(workflow).toContain('SalahOS-v${VERSION}-raspberry-pi-kiosk.tar.gz');
    expect(workflow).toContain('SHA256SUMS.txt');
  });

  it('writes portable checksum manifests and verifies them before publication', () => {
    expect(workflow).toMatch(/cd release[\s\S]*sha256sum[\s\S]*SalahOS-v\$\{VERSION\}-web-pwa\.zip/);
    expect(workflow).toMatch(/cd release[\s\S]*sha256sum[\s\S]*SalahOS-v\$\{VERSION\}-android\.apk/);
    expect(workflow).toMatch(/cd release[\s\S]*sha256sum --check SHA256SUMS\.txt/);
    expect(workflow).not.toMatch(/sha256sum\s+"release\/SalahOS-v\$\{VERSION\}/);
  });

  it('requires persistent Android signing before creating a release APK', () => {
    expect(workflow).toContain('SALAHOS_ANDROID_KEYSTORE_BASE64');
    expect(workflow).toContain('SALAHOS_ANDROID_KEYSTORE_PASSWORD');
    expect(workflow).toContain('SALAHOS_ANDROID_KEY_ALIAS');
    expect(workflow).toContain('SALAHOS_ANDROID_KEY_PASSWORD');
    expect(workflow).toContain('android-actions/setup-android@v3');
    expect(workflow).toContain("sdkmanager 'platforms;android-36' 'build-tools;36.0.0'");
    expect(workflow).toContain('apksigner');
    expect(workflow).toContain('app-release.apk');
    expect(workflow).not.toContain('app-debug.apk');
    expect(workflow).not.toMatch(/SalahOS-v[^\n]*-android-debug\.apk/);
  });

  it('publishes only after the signed Android and Web/Pi jobs succeed', () => {
    expect(workflow).toMatch(/publish:[\s\S]*needs:[\s\S]*- web-kiosk[\s\S]*- android/);
    expect(workflow).toContain("if: github.event_name == 'push'");
  });

  it('does not misrepresent unsupported consumer installers', () => {
    expect(workflow).not.toMatch(/\.dmg\b/);
    expect(workflow).not.toMatch(/\.ipa\b/);
    expect(workflow).not.toMatch(/Simulator.*release/i);
  });
});

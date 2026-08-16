from pathlib import Path

# Branch-only tracker helper; removed before pull request review.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()

# Combined Android/iOS location work is partial until the iOS adapter exists.
todo = replace_once(
    todo,
    '- [ ] Implement native Android/iOS location adapter',
    '- [~] Implement native Android/iOS location adapter',
)

for item in [
    'Configure Android project/shell',
    'Implement native location permissions',
    'Android build succeeds where SDK is available',
    'Document Android build/install',
]:
    todo = replace_once(todo, f'- [ ] {item}', f'- [x] {item}')

android_anchor = '- [x] Implement native location permissions\n'
android_note = (
    "\n**Android native-foundation verification note (2026-08-16):** the committed Capacitor Android project reuses the shared SalahOS application and prayer engine rather than duplicating prayer logic. The application location action now crosses a native-aware platform boundary: browser builds retain the existing one-shot browser adapter, while Android uses the first-party Capacitor geolocation bridge, explicitly checks/requests foreground permission, defaults to non-high-accuracy acquisition with a five-minute reusable-fix window, and discards native accuracy/altitude/heading/speed/timestamp metadata before retaining latitude/longitude. The Android manifest declares foreground `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` plus the generated Internet permission and does not request background location. Cleaned read-only Quality Gate run `31935517985` passed security, dependency/license, documentation, formatting, lint, strict typecheck, 59 test files / 273 tests, production Web/PWA build and artifact verification. Independent permanent Android Build run `31935517977` installed the committed lockfile on Ubuntu with Node 22 and Java 21, ran `npm run android:build`, synchronised the shared app into the native project and passed Gradle `assembleDebug`. `docs/ANDROID.md` records the local build/install path and explicit boundaries. Emulator/physical-device acceptance, persistent-storage device lifecycle, orientation acceptance, native notifications/Adhan, battery/background restrictions, release signing/distribution and all iOS native work remain open.\n"
)
if '**Android native-foundation verification note (2026-08-16):**' not in todo:
    todo = todo.replace(android_anchor, android_anchor + android_note, 1)

todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Android native foundation'
entry = """

### 2026-08-16 — Android native foundation

- Added the committed Capacitor Android project and app identity `com.privacyog.salahos`, reusing the shared React/prayer-domain implementation.
- Added a native-aware current-location adapter that keeps the browser path intact and uses the first-party Capacitor geolocation bridge on native Android.
- Verified foreground permission check/request, fail-closed denial, one-shot low-accuracy-default acquisition, timeout normalization and coordinate-only data retention with four deterministic tests.
- Android manifest permissions are limited to foreground coarse/fine location plus the generated Internet permission; no background-location permission is requested.
- Added `npm run android:sync` and `npm run android:build`, a permanent read-only Android Build workflow, and `docs/ANDROID.md` build/install documentation.
- Cleaned Quality Gate run `31935517985` passed 59 test files / 273 tests plus all repository security, dependency, documentation, formatting, lint, strict typecheck and Web/PWA build gates.
- Permanent Android Build run `31935517977` passed the committed lockfile install, shared-app build/sync and Gradle `assembleDebug` with Node 22 and Java 21.
- Emulator/physical-device execution, persistent-storage device lifecycle, orientation, notifications/Adhan, background/battery restrictions, release signing/distribution and iOS native work remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

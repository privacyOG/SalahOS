from pathlib import Path

# Branch-only tracker helper; removed before pull request review.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()

for item in [
    'Implement local prayer notifications',
    'Handle notification permission versions correctly',
]:
    todo = replace_once(todo, f'- [ ] {item}', f'- [x] {item}')

anchor = '- [x] Handle notification permission versions correctly\n'
note = """

**Android local-notification verification note (2026-08-16):** the committed Android shell now consumes the shared notification scheduling core through the first-party Capacitor Local Notifications bridge. The runtime builds obligatory-prayer inputs for today and tomorrow from the selected calculated or local-mosque source, resolves civil times through the selected IANA timezone, filters already-past deliveries, and reconciles pending native jobs whenever location coordinates, timezone/date, calculation settings, mosque timetable, prayer source, locale or notification preferences change. Android display permission is checked and requested only when future configured alerts require delivery; denial fails closed. SalahOS-owned pending jobs use deterministic positive 32-bit identifiers plus namespaced scheduler metadata, allowing stale jobs to be replaced or cancelled without adopting unrelated notifications. Silent and silent-with-vibration Android channels are configured explicitly; default-sound alerts retain platform-default channel behavior. Cleaned exact-head Quality Gate run `31936818278` passed the sensitive-file, vulnerability, license, documentation, icon, formatting, lint and strict-type gates, 61 test files / 280 tests, production Web/PWA build and deploy-artifact verification. Matching Android Build run `31936818319` passed lockfile install, Capacitor sync and Gradle `assembleDebug` on Node 22/Java 21. Exact-alarm permission/strategy, reboot rescheduling, battery/background acceptance, Adhan playback and emulator/physical-device delivery remain open and are not claimed by this item.
"""
if '**Android local-notification verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)

todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Android local prayer notifications'
entry = """

### 2026-08-16 — Android local prayer notifications

- Added the first-party Capacitor Local Notifications 8.2.1 bridge to the committed Android shell while retaining the existing shared notification intent/reconciliation domain.
- Added today/tomorrow obligatory-prayer input derivation for calculated and local-mosque sources without introducing a parallel Android prayer engine.
- Added deterministic positive 32-bit native notification IDs and namespaced scheduler metadata so only SalahOS-owned pending jobs are reconciled or cancelled.
- Added Android display-permission check/request handling with fail-closed denial and no permission prompt when the desired schedule is empty and stale owned jobs only need cancellation.
- Added silent and silent-with-vibration Android channels, localized English/Arabic notification copy, past-delivery filtering and structured notification-scheduling error classification.
- Cleaned exact-head Quality Gate run `31936818278` passed 61 test files / 280 tests plus security, dependency/license, documentation, icon, formatting, lint, strict typecheck and production Web/PWA artifact verification.
- Matching Android Build run `31936818319` passed the committed lockfile install, Capacitor Android sync and Gradle `assembleDebug` with Node 22 and Java 21.
- Exact-alarm permission/strategy, reboot rescheduling, battery/background acceptance, Adhan playback and emulator/physical-device delivery remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

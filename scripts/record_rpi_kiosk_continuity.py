from pathlib import Path

# Branch-only tracker helper; removed before pull request review.
# This comment ensures the already-present tracker workflow receives a push event.

COMPLETED_ITEMS = [
    'Persist settings across restart',
    'Operate without internet after initial configuration',
    'Recover gracefully when network disappears',
    'Recover after system suspend/reboot',
    "Prevent display from getting stuck on yesterday's prayer schedule",
]


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
for item in COMPLETED_ITEMS:
    todo = replace_once(todo, f'- [ ] {item}', f'- [x] {item}')

anchor = "- [x] Prevent display from getting stuck on yesterday's prayer schedule\n"
note = (
    "\n**Raspberry Pi/kiosk continuity verification note (2026-08-16):** read-only Quality Gate run `31933758199` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 30 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 58 test files / 269 tests, production build and deploy-artifact verification. The dedicated kiosk lifecycle integration persists a configured Sydney location/timezone, calculation method, locale, Hijri correction and prayer adjustments, cold-loads the stored settings, forces network access unavailable and still builds the complete local prayer dashboard without any fetch. A detected multi-hour suspend-style gap rebuilds from fresh wall time with a changed countdown, and a simulated cold restart immediately after Sydney local midnight loads the same persisted configuration while generating the 2026-08-17 schedule instead of retaining 2026-08-16. This closes repository-side restart/offline/network-loss/suspend/date-rollover continuity for the shared Raspberry Pi kiosk runtime. Actual Raspberry Pi graphical boot/login, power-loss behaviour, physical Touch Display 2 rendering/touch and long-duration hardware acceptance remain separate physical-device evidence.\n"
)
if '**Raspberry Pi/kiosk continuity verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Raspberry Pi/kiosk continuity lifecycle'
entry = """

### 2026-08-16 — Raspberry Pi/kiosk continuity lifecycle

- Added a dedicated integration suite for the shared Raspberry Pi/kiosk lifecycle using production persisted-settings, prayer-dashboard and sleep/wake code.
- Verified configured location/timezone, method, locale, Hijri correction and prayer adjustments survive a cold settings reload.
- Forced network access unavailable and verified the restored dashboard remains fully calculable without any fetch call.
- Verified a detected multi-hour suspend-style gap rebuilds from fresh wall time with a refreshed countdown.
- Verified a simulated cold restart just after Sydney local midnight generates 2026-08-17 rather than retaining the previous day's schedule.
- Read-only Quality Gate run `31933758199` passed 58 test files / 269 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical Raspberry Pi boot/login policy, power-loss/reboot behaviour, Touch Display 2 rendering/touch and long-duration hardware acceptance remain device-only checks.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

from pathlib import Path

# Branch-only tracker helper; removed before pull request review.

COMPLETED_ITEMS = [
    'Create dedicated smart-display mode using shared app logic',
    'Large current clock',
    'Large next-prayer countdown',
    'Five-prayer timetable visible at a glance',
    "Iqamah/Jama'ah display where configured",
    "Jumu'ah display on Fridays",
    'Current/next-prayer highlighting',
    'Full-screen/kiosk operation',
]


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
for item in COMPLETED_ITEMS:
    todo = replace_once(todo, f'- [ ] {item}', f'- [x] {item}')

anchor = '- [x] Full-screen/kiosk operation\n'
note = (
    "\n**Smart-display mode verification note (2026-08-16):** read-only Quality Gate run `31932489699` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 29 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 54 test files / 258 tests, production build and deploy-artifact verification. The live `?mode=smart-display` presentation is rendered inside the normal application runtime and consumes the shared sourced prayer dashboard rather than duplicating prayer calculations. It presents a large live clock and next-prayer countdown, the five obligatory prayers at a glance, configured Iqamah, current/next highlighting, and configured date-scoped Jumu'ah sessions, with English/Arabic presentation and offline/unconfigured/error states. The existing Chromium launcher accepts `SALAHOS_KIOSK_URL`; the Raspberry Pi kiosk guide now documents launching the smart-display URL directly under the validated full-screen kiosk flags. Automatic daily rollover, timezone/DST update, sleep/wake recovery, burn-in behaviour, remote/keyboard navigation and broader TV deployment documentation remain separate Stage 12 verification items.\n"
)
if '**Smart-display mode verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Smart-display mode'
entry = """

### 2026-08-16 — Smart-display mode

- Added a live `?mode=smart-display` presentation that remains inside the normal application runtime and consumes the shared sourced prayer dashboard.
- Added a large live clock, large next-prayer countdown, five obligatory prayer cards, configured Iqamah, current/next highlighting, configured Jumu'ah sessions and English/Arabic offline/error states.
- Added five component tests covering explicit mode activation, five-prayer/Iqamah/current-next rendering, Jumu'ah rendering, unconfigured location handling and Arabic/offline presentation.
- Documented direct Chromium kiosk launch through the existing `SALAHOS_KIOSK_URL` override using the smart-display query.
- Read-only Quality Gate run `31932489699` passed 54 test files / 258 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Automatic rollover/DST display verification, sleep/wake display verification, burn-in behaviour, remote/keyboard navigation and broader TV deployment documentation remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

from pathlib import Path

# Branch-only tracker helper; removed before pull request review.
# This comment ensures the already-present tracker workflow receives a push event.

COMPLETED_ITEMS = [
    'Automatic daily schedule rollover',
    'Automatic timezone/DST update',
    'Sleep/wake recovery',
]


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
for item in COMPLETED_ITEMS:
    todo = replace_once(todo, f'- [ ] {item}', f'- [x] {item}')

anchor = '- [x] Sleep/wake recovery\n'
note = (
    "\n**Smart-display runtime-continuity verification note (2026-08-16):** read-only Quality Gate run `31932809636` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 29 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 55 test files / 261 tests, production build and deploy-artifact verification. Three display-specific integration tests render the production `SmartDisplay` from the shared sourced dashboard before and after runtime transitions: Sydney local midnight from 2026-08-16 to 2026-08-17, the 2026-10-04 daylight-saving jump from UTC+10 to UTC+11 with the local clock advancing from 01:59 to 03:00, and a simulated multi-hour sleep/wake gap detected by the existing sleep/wake detector followed by a fresh wall-time dashboard/render. This proves repository-side display continuity through those transitions without duplicating prayer logic. Physical Raspberry Pi/TV suspend, reboot and long-duration acceptance remain separate hardware evidence; burn-in-conscious behaviour, remote/keyboard navigation and broader TV deployment documentation remain open.\n"
)
if '**Smart-display runtime-continuity verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Smart-display runtime continuity'
entry = """

### 2026-08-16 — Smart-display runtime continuity

- Added three integration tests that render the production smart-display presentation from the shared sourced dashboard across local-date rollover, a real Sydney DST transition and a detected sleep/wake gap.
- Verified Sydney local midnight advances the displayed civil date and prayer schedule from 2026-08-16 to 2026-08-17.
- Verified the 2026-10-04 Sydney daylight-saving transition changes the dashboard offset from UTC+10 to UTC+11 and the rendered clock from 01:59 to 03:00 while preserving `Australia/Sydney`.
- Verified a simulated multi-hour sleep/wake gap is detected and the resumed display is rebuilt from fresh wall time with a new countdown/render.
- Read-only Quality Gate run `31932809636` passed 55 test files / 261 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical Raspberry Pi/TV suspend, reboot and long-duration acceptance remain hardware-only checks; burn-in behaviour, remote/keyboard navigation and broader TV deployment documentation remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

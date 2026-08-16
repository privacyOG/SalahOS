from pathlib import Path

# Branch-only tracker helper; removed before pull request review.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(todo, '- [ ] UI/component tests green', '- [x] UI/component tests green')
anchor = '- [x] UI/component tests green\n'
note = (
    "\n**UI/component-test verification note (2026-08-16):** read-only Quality Gate run `31929598905` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 51 test files / 242 tests, production build and deploy-artifact verification. The production next-prayer block and prayer-card presentation were extracted from `App` into `NextPrayerBlock` and `PrayerCard` without moving prayer-domain logic. Server-rendered component tests cover configured/unconfigured next-prayer states, tomorrow/countdown presentation, current/next prayer badges, Iqamah display, high-latitude/manual-adjustment indicators and supplementary-prayer Iqamah suppression; existing bidirectional-text component tests remain green. No new test dependency was added. Stage 17 viewport, screenshot, RTL visual-alignment and scalable-text/accessibility regression work remains separately open.\n"
)
if '**UI/component-test verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — prayer presentation component coverage'
entry = """

### 2026-08-16 — prayer presentation component coverage

- Extracted production `NextPrayerBlock` and `PrayerCard` presentation components from `App` while retaining prayer calculation, source selection, localization and formatting decisions in the application layer.
- Added server-rendered component tests for configured/unconfigured next-prayer state, countdown/tomorrow presentation, current/next prayer state, prayer start and Iqamah, high-latitude/manual-adjustment indicators, and supplementary-prayer Iqamah suppression.
- Retained the existing bidirectional-text component coverage and added no DOM/test-framework dependency.
- Read-only Quality Gate run `31929598905` passed all 51 test files / 242 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Stage 17 viewport, screenshot, RTL visual-alignment and scalable-text/accessibility regression items remain open and are not implied by this component-level gate.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

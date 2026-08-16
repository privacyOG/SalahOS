from pathlib import Path

# Branch-only tracker helper; removed before pull request review.
# This comment ensures the already-present tracker workflow receives a push event.

COMPLETED_ITEMS = [
    'Run clean install from lockfile',
    'Run complete test suite from a clean checkout',
    'Run lint + typecheck + production build',
    'Run prayer-time parity/reference suite',
    'Run DST/high-latitude regression suite',
    'Validate offline operation',
]


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
for item in COMPLETED_ITEMS:
    todo = replace_once(todo, f'- [ ] {item}', f'- [x] {item}')

anchor = '- [x] Validate offline operation\n'
note = (
    "\n**Core release-verification note (2026-08-16):** main-branch Quality Gate run `31934011315` checked out exact commit `49ac83379cdc357cd5ecb43d964291ec44793906` into a clean hosted workspace, installed the committed lockfile with `npm ci --ignore-scripts` (139 packages installed, 140 audited, zero vulnerabilities), passed repository security/license/documentation/icon-reproducibility policies, formatting, lint, strict typecheck, 58 test files / 269 tests, production build and deploy-artifact verification. The passing suite includes `referenceParity.test.ts` and `methods.reference.test.ts` for prayer-time/reference parity; `timezone.test.ts`, `zonedCivilTime.test.ts`, `highLatitudeIndicators.test.ts`, prayer-engine coverage and smart-display DST integration for DST/high-latitude regression; and `offlineStartup.test.ts`, `service-worker-validation.test.mjs` plus `kioskContinuity.test.ts` for deterministic offline startup/cache/kiosk operation. Visual suites, physical phone/Raspberry Pi/TV layouts, native notification environments, final code review, blocker reconciliation, release notes and release tagging remain open and are not implied by this evidence.\n"
)
if '**Core release-verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Core release verification on main'
entry = """

### 2026-08-16 — Core release verification on main

- Quality Gate run `31934011315` checked out exact merged main commit `49ac83379cdc357cd5ecb43d964291ec44793906` in a clean hosted workspace.
- Clean lockfile installation used `npm ci --ignore-scripts`: 139 packages installed, 140 audited and zero vulnerabilities reported.
- Formatting, lint, strict typecheck, 58 test files / 269 tests, production build and deploy-artifact verification all passed.
- Prayer parity/reference coverage passed through `referenceParity.test.ts` and `methods.reference.test.ts`.
- DST/high-latitude regression coverage passed through timezone/zoned-civil-time/high-latitude tests plus prayer-engine and smart-display runtime coverage.
- Deterministic offline verification passed through offline startup, service-worker lifecycle and Raspberry Pi/kiosk continuity suites.
- English/Arabic visual regression, physical layout/device acceptance, Android/iOS notification validation, final review, blocker reconciliation, release notes and release tagging remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

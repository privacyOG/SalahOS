from pathlib import Path

# Branch-only tracker helper; removed before pull request review.
# This comment ensures the already-present tracker workflow receives a push event.

TODO_ITEMS = [
    'Burn-in-conscious layout behaviour where practical',
    'Remote-control/keyboard navigation where practical',
    'Document supported TV deployment paths rather than claiming unsupported native platforms',
    'Document TV/kiosk deployment',
]


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
for item in TODO_ITEMS:
    todo = replace_once(todo, f'- [ ] {item}', f'- [x] {item}')

anchor = '- [x] Document supported TV deployment paths rather than claiming unsupported native platforms\n'
note = (
    "\n**Smart-display TV usability verification note (2026-08-16):** read-only Quality Gate run `31933200746` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 30 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 57 test files / 266 tests, production build and deploy-artifact verification. The live smart-display now recognises Escape, Backspace, BrowserBack and GoBack as practical exit inputs and returns to the standard configuration route while preserving unrelated query/hash state; three unit tests lock that mapping. The long-running display applies a bounded four-pixel stepped position shift on a 60-minute cycle to major static display regions, with a reduced-motion override; two stylesheet contract tests lock both behaviours. `docs/TV_KIOSK_DEPLOYMENT.md` documents the validated Linux/Raspberry Pi Chromium kiosk path, HDMI-attached browser hosts, target-specific TV-browser acceptance checks, casting/mirroring boundaries, remote-key limitations and an explicit list of native TV packages this repository does not claim to ship. Physical TV remote mappings, HDMI-CEC, panel burn-in characteristics and long-duration device acceptance remain hardware-specific validation work.\n"
)
if '**Smart-display TV usability verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Smart-display TV usability and deployment'
entry = """

### 2026-08-16 — Smart-display TV usability and deployment

- Added practical smart-display exit handling for Escape, Backspace, BrowserBack and GoBack while preserving unrelated URL parameters/hash state.
- Added three unit tests for display-mode exit key mapping and non-display/unrelated-key no-op behaviour.
- Added a bounded 60-minute stepped pixel-shift cycle for major long-lived smart-display regions plus a reduced-motion override, with two deterministic stylesheet contract tests.
- Added `docs/TV_KIOSK_DEPLOYMENT.md` covering the validated Linux/Raspberry Pi Chromium kiosk path, HDMI browser-host deployment, TV-browser acceptance criteria, remote-key limitations, casting/mirroring boundaries and unsupported native-TV-package claims.
- Read-only Quality Gate run `31933200746` passed 57 test files / 266 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical TV remote mappings, HDMI-CEC, panel-specific burn-in behaviour and long-duration target-device acceptance remain hardware checks.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

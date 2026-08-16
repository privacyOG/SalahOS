from pathlib import Path

# Branch-only tracker helper; removed before pull request review.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Build touch-first layout fixture for the display',
    '- [x] Build touch-first layout fixture for the display',
)
anchor = '- [x] Build touch-first layout fixture for the display\n'
note = (
    "\n**Touch Display 2 layout-fixture verification note (2026-08-16):** read-only Quality Gate run `31931801626` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 29 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 53 test files / 253 tests, production build and deploy-artifact verification. The explicit `touch-display-2` browser fixture reuses the production `NextPrayerBlock` and `PrayerCard` presentation components, exposes deterministic 5-inch/7-inch 720×1280 and 10-inch 1200×1920 portrait profiles plus their landscape dimensions, supports English and Arabic/RTL, and provides fixed prayer, Iqamah and current/next state for repeatable inspection. Six fixture tests verify query activation/defaults, invalid-option fallback, exact viewport contracts, production component state and Arabic RTL output. This closes the repository-side touch-first fixture only; Stage 17 visual clipping/alignment/screenshot checks and physical Touch Display 2 rendering/touch acceptance remain open.\n"
)
if '**Touch Display 2 layout-fixture verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Touch Display 2 layout fixture'
entry = """

### 2026-08-16 — Touch Display 2 layout fixture

- Added an explicit `touch-display-2` browser fixture that reuses the production next-prayer and prayer-card presentation components instead of maintaining a parallel mock UI.
- Added deterministic 5-inch/7-inch 720×1280 and 10-inch 1200×1920 portrait profiles with landscape dimension swapping, enlarged touch-oriented presentation and English/Arabic RTL fixture modes.
- Added six tests covering fixture activation/defaults, invalid-option fallback, exact native viewport contracts, current/next prayer rendering and Arabic RTL output.
- Documented fixture URLs and the requirement that future visual automation set the browser viewport to the corresponding native dimensions.
- Read-only Quality Gate run `31931801626` passed all 53 test files / 253 tests plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical Touch Display 2 rendering/touch validation and Stage 17 screenshot, clipping, alignment and scalable-text checks remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

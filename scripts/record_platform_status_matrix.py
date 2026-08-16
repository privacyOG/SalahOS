from pathlib import Path

# Branch-only tracker helper; removed before pull request review.

ITEM = 'Actual tested platform/build matrix is documented without overclaiming'


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(todo, f'- [ ] {ITEM}', f'- [x] {ITEM}')
anchor = f'- [x] {ITEM}\n'
note = (
    "\n**Tested platform/build matrix verification note (2026-08-16):** read-only Quality Gate run `31934421125` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete 58-file / 269-test suite, production build and deploy-artifact verification on the cleaned branch. `docs/PLATFORM_STATUS.md` is now the canonical tested matrix and distinguishes automated Web/PWA validation, repository-validated Raspberry Pi/Touch Display 2 and TV/browser-kiosk paths, and planned/unvalidated Android and iOS/iPadOS native paths. `README.md` and `BUILD.md` are synchronized to those boundaries rather than describing repository-validated Pi/TV browser paths as absent. Physical Raspberry Pi/Touch Display 2 and television acceptance, target-specific remote/full-screen behaviour, native Android/iOS projects and device validation, and visual regression remain open; this matrix does not imply those checks passed.\n"
)
if '**Tested platform/build matrix verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Tested platform/build matrix'
entry = """

### 2026-08-16 — Tested platform/build matrix

- Added `docs/PLATFORM_STATUS.md` as the canonical capability matrix, with explicit Automated, Repository-validated path and Planned status definitions.
- Synchronized README platform status and the BUILD target table with currently verified Web/PWA, Raspberry Pi/browser-kiosk and TV/browser-host paths.
- Kept physical Raspberry Pi/Touch Display 2 and TV acceptance distinct from repository-side deployment verification.
- Kept Android and iOS/iPadOS native shells, native adapters, builds and device validation explicitly planned/unvalidated.
- Read-only Quality Gate run `31934421125` passed the complete 58-file / 269-test suite plus security, dependency, documentation, raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- README screenshots, visual regression, native mobile work and physical target-device acceptance remain separately open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

from pathlib import Path

# Branch-only tracker helper; removed before pull request review.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(todo, '- [~] Add installable PWA icons/assets', '- [x] Add installable PWA icons/assets')
anchor = '- [x] Add installable PWA icons/assets\n'
note = (
    "\n**PWA raster-icon verification note (2026-08-16):** read-only Quality Gate run `31929295284` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, deterministic raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification. The manifest now declares first-party 192×192 and 512×512 PNG install icons for both normal and maskable purposes while retaining the vector sources. `scripts/generate_pwa_icons.py` reproduces all four committed PNGs using only the Python standard library and `--check` fails CI if any committed raster bytes drift. The production artifact verifier requires the raster files in `dist/`, validates PNG signatures/dimensions and checks manifest size/type/purpose metadata. Physical browser/device install UX remains a separate release/platform validation concern.\n"
)
if '**PWA raster-icon verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — PWA raster install icons'
entry = """

### 2026-08-16 — PWA raster install icons

- Added first-party 192×192 and 512×512 PNG install icons for both normal and maskable PWA purposes while retaining the existing SVG source assets.
- Added `scripts/generate_pwa_icons.py`, a deterministic Python-standard-library renderer with a `--check` mode that byte-compares all four committed PNGs against regenerated output.
- Added the reproducibility check to the read-only Quality Gate so raster asset drift fails CI.
- Extended the Web/PWA artifact verifier to require the raster icons in `dist/`, validate PNG signatures/dimensions and require matching manifest `sizes`, `type` and `purpose` metadata.
- Read-only Quality Gate run `31929295284` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

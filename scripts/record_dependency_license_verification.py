from pathlib import Path

# Branch-only tracker helper; removed before pull request review.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(todo, '- [ ] Final dependency/license review', '- [x] Final dependency/license review')
anchor = '- [x] Final dependency/license review\n'
note = (
    "\n**Dependency-license verification note (2026-08-16):** read-only Quality Gate run `31928221970` passed the sensitive-file policy, dependency vulnerability audit, the new dependency-license policy, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification. The lockfile policy checks every non-root npm package entry and fails closed on missing or unreviewed license expressions. The verified graph contains 4 production packages using only MIT/CC0-1.0 and 157 development-only packages; 12 MPL-2.0 entries are confined to `lightningcss` build tooling and are explicitly documented as a development-only exception. A future MPL-2.0 production dependency, unknown license, restrictive/source-available license or unreviewed copyleft expression will fail CI until separately reviewed. `docs/DEPENDENCY_LICENSE_REVIEW.md` documents the scope and review boundary; native-platform and non-npm dependencies remain subject to review when introduced.\n"
)
if '**Dependency-license verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — dependency license policy gate'
entry = """

### 2026-08-16 — dependency license policy gate

- Added `npm run security:licenses`, backed by `scripts/check-dependency-licenses.mjs`, and made it part of both `npm run check` and the read-only Quality Gate.
- The policy validates every non-root npm lockfile package, fails on missing/unreviewed license expressions, and keeps the production dependency allowlist permissive-only.
- Verified 4 production packages: 3 MIT and 1 CC0-1.0.
- Verified 157 development-only packages; 12 MPL-2.0 entries belong to `lightningcss` build tooling and are admitted only by the development-only policy after explicit review/documentation.
- Added `docs/DEPENDENCY_LICENSE_REVIEW.md` covering the policy, the development-only MPL-2.0 exception, dependency-change workflow, legal-review boundary and future native/non-npm review boundary.
- Read-only Quality Gate run `31928221970` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Dependency vulnerability review',
    '- [x] Dependency vulnerability review',
)
anchor = '- [x] Dependency vulnerability review\n'
note = (
    "\n**Dependency-vulnerability verification note (2026-08-16):** read-only Quality Gate run `31921578803` passed the sensitive-file policy, `npm audit --audit-level=moderate`, formatting, typed lint, strict typecheck, all tests and production build from the committed lockfile. The audit is now an explicit CI and local `npm run check` gate rather than incidental install output. `docs/DEPENDENCY_SECURITY.md` records the intentionally small direct runtime dependency surface, exact-version/lockfile review policy and the requirement not to weaken the audit threshold merely to make CI pass. A clean audit is treated as point-in-time advisory evidence rather than a permanent safety guarantee, so it must be re-run before release and after dependency changes.\n"
)
if '**Dependency-vulnerability verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — dependency vulnerability review'
entry = """

### 2026-08-16 — dependency vulnerability review

- Added `npm run security:audit` using `npm audit --audit-level=moderate` and wired it into both local `npm run check` and the read-only Quality Gate.
- CI continues to install the committed lockfile with `npm ci --ignore-scripts` before auditing the resolved dependency graph.
- Added `docs/DEPENDENCY_SECURITY.md` documenting the minimal direct runtime dependency surface, exact-version/lockfile review policy and release-time re-audit requirement.
- The audit result is treated as point-in-time advisory evidence rather than a permanent guarantee; the threshold must not be weakened merely to make CI pass.
- Read-only Quality Gate run `31921578803` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [~] Verify app remains useful with internet disabled',
    '- [x] Verify app remains useful with internet disabled',
)
todo = replace_once(todo, '- [~] Test offline page reload', '- [x] Test offline page reload')
todo = replace_once(
    todo,
    '- [~] Test cache/version migration after app upgrade',
    '- [x] Test cache/version migration after app upgrade',
)
anchor = '- [x] Test cache/version migration after app upgrade\n'
note = (
    "\n**PWA offline-lifecycle verification note (2026-08-16):** read-only Quality Gate run `31926514357` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, the complete test suite and production build after exercising the committed `public/sw.js` in a controlled worker/cache environment. The production service worker now uses `salahos-shell-v2`, pre-caches the application shell, serves cached root HTML when a same-origin navigation reload fails because the network is unavailable, and during activation deletes only stale `salahos-shell-*` versions while preserving unrelated origin caches. This combines with the existing offline-startup integration, which proves persisted settings and prayer calculations operate without network access. These deterministic lifecycle tests close offline usefulness, offline reload and cache-version migration behavior; physical browser/device install UX remains a separate release/platform validation concern.\n"
)
if '**PWA offline-lifecycle verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — PWA offline reload and cache migration'
entry = """

### 2026-08-16 — PWA offline reload and cache migration

- Added deterministic lifecycle coverage that evaluates the committed `public/sw.js` directly in a controlled worker-like runtime rather than duplicating its caching logic in a test helper.
- Verified install pre-caches the root shell, manifest and first-party icon assets and requests immediate activation.
- Verified a same-origin navigation reload falls back to cached root HTML when the network request rejects.
- Bumped the application shell cache to `salahos-shell-v2` and verified activation removes stale SalahOS shell versions while leaving unrelated origin caches untouched before claiming clients.
- Together with the existing offline-startup integration, this verifies the configured application remains useful with network access unavailable after its shell and settings have been established.
- Read-only Quality Gate run `31926514357` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, the complete test suite and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

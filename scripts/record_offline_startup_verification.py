from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(todo, '- [ ] Offline startup flow', '- [x] Offline startup flow')
anchor = '- [x] Offline startup flow\n'
note = (
    "\n**Offline-startup integration verification note (2026-08-16):** read-only Quality Gate run `31923333276` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after adding an integration fixture for a previously configured device starting with network access unavailable. The fixture persists Sydney location and calculation settings, replaces network fetch with a failing stub, reloads the stored configuration, and successfully builds the production prayer dashboard locally with the saved method, Hijri correction and prayer adjustment while proving the startup calculation path makes no network request. This verifies the application startup/data path only; browser service-worker cache/offline reload validation remains separately tracked in the PWA stage and is not claimed by this item.\n"
)
if '**Offline-startup integration verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — offline startup integration'
entry = """

### 2026-08-16 — offline startup integration

- Added `src/integration/offlineStartup.test.ts` for a previously configured device starting without network access.
- The fixture persists Sydney location/calculation settings, makes `fetch` fail, reloads the stored state, and builds the production prayer dashboard locally without issuing a network request.
- It verifies the restored method, Hijri correction, manual prayer adjustment, Sydney timezone, civil date and six prayer rows.
- This fixture covers the application startup/data path; browser service-worker cache/offline reload validation remains a separate PWA verification item.
- Read-only Quality Gate run `31923333276` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

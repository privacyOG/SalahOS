from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [~] Cache timezone data for offline use',
    '- [x] Cache timezone data for offline use',
)
anchor = '- [x] Cache timezone data for offline use\n'
note = (
    "\n**Timezone-cache verification note (2026-08-16):** read-only Quality Gate run `31925162040` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after completing the persisted timezone path. Resolved IANA timezone identifiers are already stored with the local persisted location and saved favourites; the production dashboard now consumes that validated cached timezone on startup, imported settings, saved-location selection and offline city/location selection instead of discarding it and re-resolving coordinates. Fresh browser GPS and raw manual-coordinate changes deliberately clear the cache so the bundled offline coordinate resolver recalculates the timezone. Persisted and saved timezone strings are validated through the IANA timezone assertion before runtime use, and integration coverage proves the restored cached zone controls production dashboard civil time/offset.\n"
)
if '**Timezone-cache verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — persisted timezone cache'
entry = """

### 2026-08-16 — persisted timezone cache

- Extended the location prayer context/dashboard input to consume an already-resolved persisted IANA timezone while retaining the bundled coordinate lookup as the fallback.
- The app restores cached timezone data on startup, settings import, saved-location selection and offline city/location selection; fresh GPS or raw coordinate changes clear the cache and trigger local resolution.
- Persisted settings and saved favourites now validate timezone identifiers before they are accepted for runtime use.
- Added `src/integration/timezoneCache.test.ts` to prove a restored cached timezone is consumed by the production dashboard and an invalid cached timezone is rejected.
- Read-only Quality Gate run `31925162040` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

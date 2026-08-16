from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Support manual city/location search',
    '- [x] Support manual city/location search',
)
anchor = '- [x] Support manual city/location search\n'
note = (
    "\n**Manual location-search verification note (2026-08-16):** read-only Quality Gate run `31924790649` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all 231 tests and production build after adding a fully local city/location search path. The app vendors the IANA tzdb 2026c `zone1970.tab` principal-location catalogue at development time, searches more than 300 representative locations locally by city, country, ISO country code, timezone and comments, and never sends the user's query to a remote service. Selecting a result supplies validated representative coordinates to the existing local timezone/prayer-calculation pipeline; integration coverage verifies a Sydney search resolves through the production dashboard as `Australia/Sydney`. English and Arabic UI text explicitly identifies the catalogue as offline/local. Native mobile location adapters and persistent timezone-cache work remain separately open.\n"
)
if '**Manual location-search verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — offline manual city/location search'
entry = """

### 2026-08-16 — offline manual city/location search

- Added a vendored IANA tzdb 2026c principal-location catalogue generated from public-domain `zone1970.tab`; runtime search requires no geocoding service or network request.
- Added `src/domain/locationSearch.ts` with normalized/ranked search across city, country names, ISO country codes, timezone paths and IANA comments, capped to a small result set for the UI.
- Added English/Arabic location-search UI, privacy guidance, responsive result controls and immediate selection into the existing coordinate/prayer-calculation path.
- Added domain coverage for catalogue size, Sydney coordinates/timezone, country-name/code queries, accent/separator normalization and limits, plus `src/integration/manualLocationSearch.test.ts` to verify search result → production dashboard resolution.
- Read-only Quality Gate run `31924790649` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all 231 tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

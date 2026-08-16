from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Settings → recalculation flow',
    '- [x] Settings → recalculation flow',
)
anchor = '- [x] Settings → recalculation flow\n'
note = (
    "\n**Settings-to-recalculation integration verification note (2026-08-16):** read-only Quality Gate run `31921801532` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after adding an integration test that crosses the persisted-settings boundary. The test saves and reloads a Sydney configuration, builds the production dashboard from the loaded settings, then persists changed calculation method, Asr convention, high-latitude rule, Hijri correction and Fajr adjustment and proves the recalculated dashboard reflects those selections and changes the affected prayer times. This verifies persistence → reload → calculation rather than testing the storage and calculation modules only in isolation.\n"
)
if '**Settings-to-recalculation integration verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — settings to recalculation integration'
entry = """

### 2026-08-16 — settings to recalculation integration

- Added `src/integration/settingsRecalculation.test.ts` to exercise persisted settings through the production dashboard calculation path.
- The integration saves and reloads a Sydney configuration, recalculates, persists changed method/Asr/high-latitude/Hijri/adjustment settings, reloads again and verifies the production dashboard reflects the new configuration.
- The test verifies both provenance/configuration fields and changed Asr/Fajr local prayer times, proving a real recalculation rather than serialization alone.
- Read-only Quality Gate run `31921801532` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

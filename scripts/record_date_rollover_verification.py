from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(todo, '- [ ] Date rollover flow', '- [x] Date rollover flow')
anchor = '- [x] Date rollover flow\n'
note = (
    "\n**Date-rollover integration verification note (2026-08-16):** read-only Quality Gate run `31921977275` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after adding a production-dashboard integration fixture across Sydney local midnight. At 23:59:59 on 2026-08-16 the dashboard reports today/tomorrow as August 16/17 and next Fajr as day offset 1; at 00:00:01 it reports August 17/18 and re-bases that next Fajr to day offset 0. Gregorian presentation and the six-row prayer schedule advance with the same civil-date boundary, proving the runtime model does not remain stuck on yesterday's schedule.\n"
)
if '**Date-rollover integration verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — date rollover integration'
entry = """

### 2026-08-16 — date rollover integration

- Added `src/integration/dateRollover.test.ts` around the exact Sydney local-midnight boundary.
- At 23:59:59 the production dashboard keeps August 16 as today and identifies tomorrow Fajr; at 00:00:01 it advances today/tomorrow to August 17/18 and re-bases Fajr to the current civil day.
- The fixture verifies local clock, Gregorian date, today/tomorrow schedules, next-prayer day offset and the six-row dashboard prayer presentation move together.
- Read-only Quality Gate run `31921977275` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

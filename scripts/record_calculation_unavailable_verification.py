from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Handle unavailable calculation results gracefully',
    '- [x] Handle unavailable calculation results gracefully',
)
anchor = '- [x] Handle unavailable calculation results gracefully\n'
note = (
    "\n**Unavailable-calculation verification note (2026-08-16):** read-only Quality Gate run `31920344383` passed formatting, typed lint, strict typecheck, all tests and production build after introducing an explicit dashboard calculation result boundary. Successful schedules report any prayer rows that remain astronomically unavailable; those rows continue to display a neutral dash and now carry localized English/Arabic guidance rather than silent ambiguity. Calculation exceptions are converted into an explicit unavailable state, so the interface remains running and asks the user to verify location/calculation settings without displaying guessed prayer times. Deterministic coverage verifies an ordinary Sydney schedule, polar-day partial unavailability and conversion of a rejected calculation input into the safe unavailable result.\n"
)
if '**Unavailable-calculation verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — unavailable calculation results'
entry = """

### 2026-08-16 — unavailable calculation results

- Added an explicit dashboard calculation-result boundary that distinguishes successful schedules from calculation failure.
- Successful schedules report prayer rows whose astronomical result remains unavailable; the UI keeps the neutral dash and shows localized guidance instead of inventing a time.
- Calculation exceptions degrade to a localized non-crashing state that directs the user to verify location and calculation settings.
- Added deterministic coverage for a normal Sydney schedule, polar-day partial unavailability and conversion of a rejected calculation input into the safe unavailable result.
- Read-only Quality Gate run `31920344383` passed formatting, typed lint, strict typecheck, all tests and production build on the cleaned implementation head.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

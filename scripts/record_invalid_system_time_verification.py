from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Handle invalid system time gracefully",
    "- [x] Handle invalid system time gracefully",
)
anchor = "- [x] Handle invalid system time gracefully\n"
note = (
    "\n**Invalid-system-time verification note (2026-08-16):** read-only Quality Gate run `31920144935` passed formatting, typed lint, strict typecheck, all tests and production build after making runtime wall-clock state explicitly nullable. Non-finite or out-of-range wall-clock reads no longer enter dashboard/date/time formatters or prayer calculations; both runtime discontinuity detectors are cleared, the live clock renders a neutral placeholder, and a localized English/Arabic alert asks the user to correct the device date/time. The next valid wall-clock sample automatically re-establishes both runtime baselines and resumes normal calculation. Unit coverage verifies valid current and pre-epoch times, non-finite values, JavaScript Date-range overflow and injected wall-clock readers.\n"
)
if "**Invalid-system-time verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — invalid system time recovery"
entry = """

### 2026-08-16 — invalid system time recovery

- Added validated wall-clock conversion that returns `null` rather than constructing an invalid `Date` for non-finite or out-of-range values.
- Runtime clock state is nullable; invalid reads suspend prayer/date/time computation, clear clock-discontinuity baselines and show a localized corrective alert instead of throwing downstream.
- The first subsequent valid sample re-establishes sleep/wake and clock-change detector baselines and resumes live calculation automatically.
- Added deterministic coverage for valid current/pre-epoch values, non-finite values, JavaScript Date-range overflow and injected wall-clock readers.
- Read-only Quality Gate run `31920144935` passed formatting, typed lint, strict typecheck, all tests and production build on the cleaned implementation head.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

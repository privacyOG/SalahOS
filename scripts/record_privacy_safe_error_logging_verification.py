from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Add structured error logging without exposing private location unnecessarily',
    '- [x] Add structured error logging without exposing private location unnecessarily',
)
anchor = '- [x] Add structured error logging without exposing private location unnecessarily\n'
note = (
    "\n**Privacy-safe error-logging verification note (2026-08-16):** read-only Quality Gate run `31920530983` passed formatting, typed lint, strict typecheck, all tests and production build after adding a deliberately constrained structured error schema and wiring it to invalid-system-time and prayer-calculation failure transitions. Events contain only a fixed component, fixed code and severity; the API accepts no coordinates, location labels, mosque names, arbitrary context, raw exception messages, stacks or URLs. Invalid-clock logging is transition-deduplicated until valid time returns, while calculation failure logs only on availability-state changes. Unit coverage locks the emitted schema and asserts the absence of private-location/error-detail fields.\n"
)
if '**Privacy-safe error-logging verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — privacy-safe structured error logging'
entry = """

### 2026-08-16 — privacy-safe structured error logging

- Added a fixed structured error schema for runtime-clock and prayer-calculation failure events.
- The logger accepts only fixed error codes and emits only component, code and severity; it exposes no arbitrary metadata path that could capture coordinates, location labels, mosque names, exception messages, stacks or URLs.
- Invalid-system-time logging is deduplicated until the runtime clock recovers; calculation-unavailable logging follows availability-state transitions.
- Unit tests lock the exact serialized schema and verify location/error-detail fields are absent.
- Read-only Quality Gate run `31920530983` passed formatting, typed lint, strict typecheck, all tests and production build on the cleaned implementation head.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

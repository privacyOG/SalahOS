from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Minimise collection of precise location data',
    '- [x] Minimise collection of precise location data',
)
anchor = '- [x] Minimise collection of precise location data\n'
note = (
    "\n**Location-data minimisation verification note (2026-08-16):** read-only Quality Gate run `31920709447` passed formatting, typed lint, strict typecheck, all tests and production build after tightening the browser geolocation adapter. Location acquisition remains explicit and one-shot, defaults to low-accuracy mode with a five-minute reusable fix window, and never starts a continuous watch. The adapter now discards browser accuracy, altitude, altitude accuracy, heading, speed and capture timestamp immediately, retaining only latitude/longitude required for local timezone and prayer calculations plus the source marker. High-accuracy acquisition remains available only through explicit caller opt-in. Tests lock the retained data shape, default request options, one-shot behaviour and explicit opt-in path.\n"
)
if '**Location-data minimisation verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — precise location data minimisation'
entry = """

### 2026-08-16 — precise location data minimisation

- Browser location acquisition remains explicit and one-shot; no continuous location watch is started.
- Default browser geolocation uses low-accuracy mode and permits reuse of a recent fix for five minutes rather than forcing a fresh precise sensor fix.
- The adapter retains only latitude/longitude needed for local timezone and prayer calculations plus the source marker; accuracy, altitude, heading, speed and browser capture timestamp are discarded immediately.
- High-accuracy acquisition requires an explicit caller opt-in.
- Read-only Quality Gate run `31920709447` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

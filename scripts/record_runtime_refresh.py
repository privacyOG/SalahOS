from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Device clock correction while app is running",
    "- [x] Device clock correction while app is running",
)
todo = replace_once(
    todo,
    "- [ ] System suspend/resume recovery",
    "- [x] System suspend/resume recovery",
)
anchor = "- [x] System suspend/resume recovery\n"
note = (
    "\n**Runtime-refresh verification note (2026-08-16):** implementation Quality Gate run `31908092487` passed "
    "formatting, typed lint, strict typecheck, all tests and production build after adding the runtime refresh adapter. "
    "The shared shell continues to sample a fresh system `Date` every second, so a device-clock correction is absorbed on "
    "the next tick, and it now also refreshes immediately on window focus, restored-page (`pageshow`) and document "
    "visibility changes. Unit tests verify all three recovery events and complete listener cleanup.\n"
)
if "**Runtime-refresh verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Device clock and resume recovery"
entry = """

### 2026-08-16 — Device clock and resume recovery

- Added a small platform adapter that installs focus, restored-page and visibility-change refresh listeners without coupling the prayer domain to browser globals.
- The existing one-second clock now uses the same refresh callback, so system clock corrections are reflected from a newly sampled `Date` on the next tick.
- Focus, `pageshow` and `visibilitychange` trigger an immediate refresh after a suspended, backgrounded or restored display becomes active again.
- Unit tests verify all three event paths and confirm listener cleanup prevents refreshes after unmount.
- Implementation Quality Gate run `31908092487` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

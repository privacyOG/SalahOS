from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Detect significant system-clock changes",
    "- [x] Detect significant system-clock changes",
)
anchor = "- [x] Detect significant system-clock changes\n"
note = (
    "\n**System-clock change verification note (2026-08-16):** read-only Quality Gate run `31919019029` passed formatting, typed lint, strict typecheck, all tests and production build after adding a wall-clock discontinuity detector and integrating it into the live runtime clock loop. The detector compares elapsed `Date.now()` time with monotonic `performance.now()` time using a 30-second threshold, detects significant forward/backward corrections and monotonic resets, and rejects invalid samples. Explicit focus/page-restore/visible-resume refreshes reset the detector baseline before updating `now`, so ordinary background resume is handled by the separate resume path rather than intentionally classified as a clock correction. System sleep/wake recovery remains a separate open item because monotonic-clock behavior across sleep varies by platform.\n"
)
if "**System-clock change verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — significant system-clock change detection"
entry = """

### 2026-08-16 — significant system-clock change detection

- Added a platform-neutral detector that compares wall-clock elapsed time with monotonic elapsed time using a configurable threshold.
- Added deterministic coverage for normal progression, forward corrections, backward corrections, sub-threshold corrections, monotonic resets, explicit baseline reset and invalid input.
- Integrated detector sampling into the live one-second runtime clock loop while resetting its baseline on explicit focus/page-restore/visible-resume refreshes.
- Kept system sleep/wake recovery open because browser monotonic-clock behavior across operating-system sleep is platform-dependent and has not been physically verified.
- Read-only Quality Gate run `31919019029` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

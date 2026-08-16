from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Recover correctly after system sleep/wake",
    "- [x] Recover correctly after system sleep/wake",
)
anchor = "- [x] Recover correctly after system sleep/wake\n"
note = (
    "\n**System sleep/wake verification note (2026-08-16):** read-only Quality Gate run `31919909102` passed formatting, typed lint, strict typecheck, all tests and production build after adding a platform-neutral elapsed-gap detector and integrating it with the live runtime clock loop. A wall-clock timer gap of five seconds or more is treated as a suspended/resumed runtime boundary: the system-clock discontinuity detector is re-baselined before the fresh wall time is applied, and the dashboard, local date, current/next prayer and countdown recompute from that current instant rather than replaying missed interval ticks. Explicit focus, page-restore and visible-resume refreshes reset both runtime baselines. Unit coverage verifies ordinary progression, threshold behavior, long gaps representative of sleep/wake, backward clock corrections, explicit re-baselining and invalid samples.\n"
)
if "**System sleep/wake verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — system sleep/wake recovery"
entry = """

### 2026-08-16 — system sleep/wake recovery

- Added a platform-neutral elapsed-gap detector for runtime timer gaps representative of operating-system sleep/wake suspension.
- Integrated the detector with the live one-second clock loop so a resumed runtime re-baselines clock-discontinuity detection and immediately recomputes state from fresh wall time.
- Explicit focus, page-restore and visible-resume refreshes reset both runtime baselines, keeping those recovery paths deterministic and separate from clock-correction classification.
- Added deterministic coverage for ordinary progression, configurable threshold behavior, long gaps, backward wall-clock corrections, explicit reset and invalid input.
- Read-only Quality Gate run `31919909102` passed formatting, typed lint, strict typecheck, all tests and production build on the cleaned implementation head.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

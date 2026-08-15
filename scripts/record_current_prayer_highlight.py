from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [~] Highlight current/next prayer",
    "- [x] Highlight current/next prayer",
)
anchor = "- [x] Highlight current/next prayer\n"
note = (
    "\n**Current/next prayer verification note (2026-08-16):** read-only Quality Gate run `31911967092` passed "
    "formatting, typed lint, strict typecheck, all tests and production build after adding selected-source current-prayer state. "
    "The dashboard now marks the latest entered obligatory prayer as current, keeps Sunrise supplementary, preserves Isha as "
    "current after Isha while next rolls to tomorrow Fajr, and reports no current prayer before the first available obligatory "
    "start of the civil day. Current and next use distinct visual labels/styles, and exact prayer-start boundaries advance next "
    "to the following obligatory prayer instead of marking one prayer as both current and next.\n"
)
if "**Current/next prayer verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Current and next prayer highlighting"
entry = """

### 2026-08-16 — Current and next prayer highlighting

- Added selected-source current-prayer state alongside the existing next-prayer state.
- Current prayer is the latest available obligatory start at or before the current local time; Sunrise remains supplementary and is never treated as the current obligatory prayer.
- Before the first available obligatory prayer of the civil day, current prayer is null rather than fabricating a previous-day state.
- After Isha, Isha remains current while next prayer rolls to tomorrow Fajr using the existing tomorrow-source schedule.
- Today's next-prayer comparison is strict, so at an exact prayer start the new prayer is current and the following obligatory prayer is next rather than one card being both.
- Current and next prayer cards use distinct classes; the current card also carries a localised English/Arabic current-prayer badge.
- Source-domain tests cover local-mosque current selection, Sunrise exclusion, post-Isha rollover and the pre-Fajr no-current case.
- Read-only Quality Gate run `31911967092` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

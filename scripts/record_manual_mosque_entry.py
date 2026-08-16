from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [~] Support manual mosque timetable entry",
    "- [x] Support manual mosque timetable entry",
)
todo = todo.replace(
    "Manual per-day timetable editing and optional vetted remote integrations remain open.",
    "Manual per-day timetable editing was still open at this verification point; optional vetted remote integrations remain open.",
    1,
)
anchor = "- [x] Support manual mosque timetable entry\n"
note = (
    "\n**Manual mosque-entry verification note (2026-08-16):** read-only Quality Gate run `31916508659` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `3d50f0204b7a2162ab92af891467852364ff1f48`. The settings UI now supports bilingual manual entry of one Gregorian timetable day with all five obligatory prayer start times and optional fixed Iqamah times. Inputs use strict 24-hour `HH:MM` validation, saved days are upserted into the existing validated offline mosque library, replacing only the same mosque/date when edited, and the saved timetable is immediately selected as the local-mosque source. The implementation reuses the existing persisted timetable format rather than introducing a parallel manual-only storage model.\n"
)
if "**Manual mosque-entry verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — manual mosque timetable entry"
entry = """

### 2026-08-16 — manual mosque timetable entry

- Added strict manual `HH:MM` parsing for all five obligatory prayer starts with optional fixed Iqamah times.
- Added deterministic manual-day creation and same-date replacement within the existing validated `MosqueTimetable` model.
- Added English/Arabic settings UI for mosque name, Gregorian date, five prayer starts and optional Iqamah values.
- Reused the existing offline mosque library so manually entered days persist, remain selectable, and activate local-mosque mode without a second storage format.
- Added tests for clock parsing, complete day creation, invalid/missing values, deterministic replacement and mosque-name mismatch protection.
- Repaired the sourced-dashboard presentation contract exposed by strict typechecking, keeping calculation metadata under the base dashboard and computing source-aware aggregate high-latitude fallback state.
- Read-only Quality Gate run `31916508659` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `3d50f0204b7a2162ab92af891467852364ff1f48`.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

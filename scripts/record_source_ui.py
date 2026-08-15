from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
replacements = {
    "- [~] Show active source/provenance clearly in the UI": "- [x] Show active source/provenance clearly in the UI",
    "- [~] Clearly distinguish Adhan/start and Iqamah on smart displays": "- [x] Clearly distinguish Adhan/start and Iqamah on smart displays",
    "- [~] Detect Friday and support Jumu'ah presentation": "- [x] Detect Friday and support Jumu'ah presentation",
    "- [ ] Iqamah time where configured": "- [x] Iqamah time where configured",
    "- [ ] Mosque/source selector": "- [~] Mosque/source selector",
}
for old, new in replacements.items():
    todo = replace_once(todo, old, new)

anchor = "- [x] Allow mosque-specific Friday configuration\n"
note = (
    "\n**Source-presentation verification note (2026-08-16):** Quality Gate run `31905085674` passed formatting, "
    "typed lint, strict typecheck, source-domain tests and production build after integrating selected prayer sources. "
    "The dashboard now resolves calculated, calculated-with-adjustments and local-mosque modes explicitly; local-mosque "
    "mode replaces obligatory start times without silent calculated fallback, recomputes next-prayer/countdown from mosque "
    "times, shows configured Iqamah separately from prayer start and presents Friday Jumu'ah sessions. The source selector "
    "is disabled for local-mosque mode until a validated persisted timetable exists. Multiple saved mosques and a dedicated "
    "mosque picker remain open, so the combined mosque/source settings item remains partial.\n"
)
if note.strip() not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Selected source, Iqamah and Jumu'ah presentation"
entry = """

### 2026-08-16 — Selected source, Iqamah and Jumu'ah presentation

- Added a source-aware dashboard projection over the existing calculation and mosque timetable domains rather than duplicating prayer calculations.
- Local-mosque mode uses only timetable-provided obligatory prayer starts; a missing mosque entry stays unavailable instead of silently falling back to a calculated time.
- Next-prayer and countdown selection are recomputed from the active source across today and tomorrow.
- Dashboard prayer cards display prayer start and configured Iqamah separately, while Sunrise remains supplementary information.
- Friday timetable sessions are presented with independent Khutbah and Salah times.
- Source-domain tests cover calculated mode, local mosque starts/Iqamah, missing-entry isolation and next-day mosque Fajr rollover.
- Quality Gate run `31905085674` passed formatting, typed lint, strict typecheck, all tests and production build for the implementation.
- Multiple saved mosques, dedicated mosque management and physical-display visual validation remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [~] Current location / selected mosque",
    "- [x] Current location / selected mosque",
)
todo = replace_once(
    todo,
    "- [~] Mosque/source selector",
    "- [x] Mosque/source selector",
)

anchor = "- [x] Do not rely on fragile arbitrary website scraping as an authoritative source\n"
note = (
    "\n**Mosque-library verification note (2026-08-16):** implementation Quality Gate run `31905789616` "
    "passed formatting, typed lint, strict typecheck, all tests and production build for the local mosque manager. "
    "Read-only Quality Gate run `31907837879` then passed after duplicate-state cleanup, duplicate-translation cleanup "
    "and restoration of the stricter persisted-timetable parser. The settings panel now stores multiple validated mosque "
    "timetables locally, imports documented CSV or JSON data through the existing strict parser, lets the user select or "
    "remove a mosque, and automatically activates the selected timetable as the local-mosque prayer source. Persisted "
    "library entries are revalidated through the strict timetable parser before use. Manual per-day timetable editing and "
    "optional vetted remote integrations remain open.\n"
)
if "**Mosque-library verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Local mosque timetable library and picker"
entry = """

### 2026-08-16 — Local mosque timetable library and picker

- Added a separate versioned local library for multiple mosque timetables.
- Library entries use a normalized mosque-name identifier and reject duplicate identifiers.
- Persisted entries are reconstructed through the same strict JSON timetable parser used by imports before they can be activated.
- Unit tests cover storage round-trip, upsert/remove behavior, duplicate ids, malformed timetable content, corrupt storage fallback and strict persistence validation.
- The settings panel imports documented JSON or CSV timetables, stores multiple mosques locally, selects a mosque for immediate local-mosque activation, and removes the selected mosque safely.
- Selecting or importing a mosque switches the prayer source to local-mosque; removing the active mosque returns local-mosque mode to calculated rather than leaving an unavailable source active.
- Implementation Quality Gate run `31905789616` passed formatting, typed lint, strict typecheck, all tests and production build for the manager integration.
- Read-only Quality Gate run `31907837879` passed after duplicate-state and translation cleanup with the strict persisted-timetable parser active.
- Manual per-day timetable editing, optional vetted remote integrations and physical-display visual validation remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
replacements = {
    "- [ ] Support saved/favourite locations": "- [x] Support saved/favourite locations",
    "- [ ] Location selector": "- [x] Location selector",
}
for old, new in replacements.items():
    todo = replace_once(todo, old, new)

anchor = "- [x] Avoid sending precise location to remote services unless required and explicitly disclosed\n"
note = (
    "\n**Saved-location verification note (2026-08-16):** read-only Quality Gate run `31905379677` "
    "passed the versioned saved-location store and tests, and implementation Quality Gate run `31905467110` passed "
    "formatting, typed lint, strict typecheck, all tests and production build after the UI integration. The web shell now "
    "stores validated favourites locally in a separate versioned library, supports labelled save/update/remove operations, "
    "and lets a user select a favourite to immediately update coordinates and recompute timezone/prayer data. Corrupt saved "
    "location data fails closed to an empty library; no remote service is required. Manual city-name search and native mobile "
    "location adapters remain open.\n"
)
if note.strip() not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Persistent saved locations"
entry = """

### 2026-08-16 — Persistent saved locations

- Added a separate versioned local saved-location library so favourites can evolve without forcing a migration of the core settings envelope.
- Saved locations validate labels, stable ids and coordinates, reject duplicate ids, and fall back to an empty library when persisted data is corrupt.
- Unit tests cover storage round-trip, immutable upsert/remove behavior, duplicate-id rejection, invalid-coordinate rejection and corrupt-storage fallback.
- The location panel now supports saving the active coordinates under a user label, selecting a favourite to recalculate immediately, and removing a saved location.
- Saved favourites remain independent of reset-to-defaults for calculation preferences and require no remote service.
- Read-only Quality Gate run `31905379677` passed the storage/test core; implementation Quality Gate run `31905467110` passed formatting, typed lint, strict typecheck, all tests and production build after UI integration.
- Manual city/location search and native Android/iOS location adapters remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

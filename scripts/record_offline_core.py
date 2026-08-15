from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
replacements = {
    "- [~] Fall back to saved/manual location without breaking prayer calculations": "- [x] Fall back to saved/manual location without breaking prayer calculations",
    "- [ ] Preserve mosque timetable offline": "- [x] Preserve mosque timetable offline",
    "- [ ] Create web app manifest": "- [x] Create web app manifest",
    "- [ ] Add installable PWA icons/assets": "- [~] Add installable PWA icons/assets",
    "- [ ] Implement service worker/static application shell caching": "- [x] Implement service worker/static application shell caching",
    "- [ ] Keep prayer calculation engine fully local/offline": "- [x] Keep prayer calculation engine fully local/offline",
    "- [ ] Persist selected location/timezone/calculation settings locally": "- [x] Persist selected location/timezone/calculation settings locally",
    "- [ ] Persist mosque timetable locally": "- [x] Persist mosque timetable locally",
    "- [ ] Provide clear online/offline state only where relevant": "- [x] Provide clear online/offline state only where relevant",
    "- [ ] Verify app remains useful with internet disabled": "- [~] Verify app remains useful with internet disabled",
    "- [ ] Test offline page reload": "- [~] Test offline page reload",
    "- [ ] Test cache/version migration after app upgrade": "- [~] Test cache/version migration after app upgrade",
    "- [ ] Export settings": "- [~] Export settings",
    "- [ ] Import settings": "- [~] Import settings",
    "- [ ] Reset to defaults": "- [~] Reset to defaults",
    "- [ ] Version/migration system for persisted configuration": "- [x] Version/migration system for persisted configuration",
    "- [ ] Recompute prayer schedule when local date changes": "- [x] Recompute prayer schedule when local date changes",
    "- [ ] Recompute after location change": "- [x] Recompute after location change",
    "- [ ] Recompute after timezone/DST change": "- [x] Recompute after timezone/DST change",
    "- [ ] Avoid countdown drift from long-running intervals": "- [x] Avoid countdown drift from long-running intervals",
    "- [ ] Keep prayer calculations local by default": "- [x] Keep prayer calculations local by default",
    "- [ ] No mandatory account for core prayer-time functionality": "- [x] No mandatory account for core prayer-time functionality",
    "- [ ] No unnecessary analytics/telemetry": "- [x] No unnecessary analytics/telemetry",
    "- [ ] Obtain explicit permission before using location": "- [x] Obtain explicit permission before using location",
    "- [ ] Validate imported CSV/JSON data safely": "- [x] Validate imported CSV/JSON data safely",
    "- [ ] Settings persistence/migration tests": "- [x] Settings persistence/migration tests",
}
for old, new in replacements.items():
    todo = replace_once(todo, old, new)

anchor = "- [~] Test cache/version migration after app upgrade\n"
note = (
    "\n**Offline/persistence verification note (2026-08-16):** read-only Quality Gate run `31904178200` "
    "passed formatting, typed lint, strict typecheck, the complete unit/integration suite and production build. "
    "The web build now has a manifest, first-party SVG icon assets, a production-only same-origin service worker, "
    "a localised offline indicator and a versioned local settings envelope. The current UI restores/persists locale "
    "and selected coordinates; the same validated envelope stores timezone, calculation method, Asr convention, "
    "high-latitude rule, Hijri correction, time format, prayer adjustments, source mode and mosque timetable. "
    "Tests cover full settings round-trip, legacy migration, future-version rejection, corrupt-storage fallback, "
    "invalid nested location/timetable rejection and propagation of stored calculation choices into the dashboard. "
    "A real-browser install/disconnect/reload test and two-version cache-upgrade test remain open; SVG icons also "
    "remain partial until platform-specific raster install assets are added and validated.\n"
)
if note.strip() not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
entry = """

### 2026-08-16 — Offline-first and versioned local persistence core

- Added a versioned `salahos.settings` storage envelope for selected coordinates/timezone, locale, theme/time-format preferences, built-in method, Asr convention, high-latitude rule, Hijri correction, prayer adjustments, source mode and a validated mosque timetable.
- The current dashboard restores and persists its exposed locale and selected-location state, and stored calculation choices are consumed by the shared dashboard model rather than ignored.
- Persistence tests cover complete round-trip, export/import primitives, reset, legacy unversioned migration, unsupported future versions, corrupt storage fallback, invalid coordinates and invalid mosque timetable rejection.
- Added an installable web manifest, first-party SVG icon assets and a production-only same-origin service worker that precaches the shell metadata, runtime-caches successful same-origin GET assets, falls back to the cached root for navigation and deletes obsolete named caches on activation.
- The web shell exposes a localised offline status only when the browser reports that networking is unavailable. No remote API is required for the prayer calculation pipeline.
- Read-only Quality Gate run `31904178200` passed clean lockfile install, formatting, typed lint, strict typecheck, all tests and production build after the final persisted-calculation integration assertion.
- Real-browser offline reload, cache upgrade across two deployed versions and platform-specific raster install-icon validation remain open.
"""
if "### 2026-08-16 — Offline-first and versioned local persistence core" not in testing:
    testing_path.write_text(testing + entry + "\n")

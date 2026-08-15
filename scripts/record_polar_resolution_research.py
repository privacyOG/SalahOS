from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Research nearest-latitude / nearest-valid-day strategies for extreme polar conditions",
    "- [x] Research nearest-latitude / nearest-valid-day strategies for extreme polar conditions",
)
todo = todo.replace(
    "Nearest-latitude/nearest-valid-day research for extreme polar conditions remains open.",
    "Nearest-latitude/nearest-valid-day research was still open at this verification point.",
    1,
)
anchor = "- [x] Research nearest-latitude / nearest-valid-day strategies for extreme polar conditions\n"
note = (
    "\n**Polar-resolution research note (2026-08-16):** read-only Quality Gate run `31915439365` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/POLAR_RESOLUTION_RESEARCH.md`. The research separates high-latitude night-fraction rules from true polar-circle resolution, documents Aqrab al-Bilad (nearest location/latitude) and Aqrab al-Ayyam (nearest valid day), and retains `unresolved` as the safe default. Any future polar estimation must be explicit, preserve the actual observer location/date, record the borrowed reference latitude or date in provenance, and never silently claim that an estimated event was astronomical at the observer's location.\n"
)
if "**Polar-resolution research note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — polar-resolution strategy research"
entry = """

### 2026-08-16 — polar-resolution strategy research

- Added `docs/POLAR_RESOLUTION_RESEARCH.md` separating ordinary high-latitude night-fraction adjustments from true polar-circle estimation.
- Documented nearest-location/latitude (Aqrab al-Bilad) and nearest-valid-day (Aqrab al-Ayyam) approaches against the pinned calculation reference and published prayer-time guidance.
- Retained unresolved polar events as the default and specified that future estimated values must be explicit opt-in choices with reference latitude/date provenance.
- Defined deterministic acceptance criteria for bounded nearest-latitude and nearest-valid-day searches without implementing either strategy prematurely.
- Read-only Quality Gate run `31915439365` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

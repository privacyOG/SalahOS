from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Research optional reputable mosque APIs/integrations",
    "- [x] Research optional reputable mosque APIs/integrations",
)
anchor = "- [x] Research optional reputable mosque APIs/integrations\n"
note = (
    "\n**Mosque-integration research note (2026-08-16):** read-only Quality Gate run `31916720065` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/MOSQUE_INTEGRATION_RESEARCH.md`. MAWAQIT is recorded as a vetted future direct-integration candidate because its provider-maintained ecosystem exposes account-based nearby-mosque selection plus prayer, Iqamah, Shuruq and Jumu'ah data, but direct SalahOS network support remains gated on a documented or explicitly authorized provider contract. Masjidbox explicitly provides no public prayer-times API, so its approved integration paths are its provider-supported iCal and CSV/Excel portability mechanisms rather than scraping or private-endpoint dependencies. No remote provider adapter is marked implemented by this research.\n"
)
if "**Mosque-integration research note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — mosque integration research"
entry = """

### 2026-08-16 — mosque integration research

- Added `docs/MOSQUE_INTEGRATION_RESEARCH.md` with provider-selection and failure-handling requirements for optional remote mosque sources.
- Recorded MAWAQIT as a vetted future direct-integration candidate while requiring a documented or explicitly authorized provider interface before implementation.
- Recorded Masjidbox's provider-supported iCal and CSV/Excel portability paths and its explicit lack of a public prayer-times API.
- Required future provider adapters to terminate at the existing validated `MosqueTimetable` model, retain offline last-known-good data, preserve provider/mosque provenance and surface stale/error state without silent calculated fallback.
- Kept all direct remote provider adapters unimplemented; this milestone closes research only.
- Read-only Quality Gate run `31916720065` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

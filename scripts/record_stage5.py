from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
replacements = {
    "- [ ] Implement `Calculated` prayer-time source mode": "- [x] Implement `Calculated` prayer-time source mode",
    "- [ ] Implement `Local Mosque` timetable source mode": "- [x] Implement `Local Mosque` timetable source mode",
    "- [ ] Implement `Calculated + Adjustments` source mode": "- [x] Implement `Calculated + Adjustments` source mode",
    "- [ ] Show active source/provenance clearly in the UI": "- [~] Show active source/provenance clearly in the UI",
    "- [ ] Support manual mosque timetable entry": "- [~] Support manual mosque timetable entry",
    "- [ ] Support CSV timetable import": "- [x] Support CSV timetable import",
    "- [ ] Define and document CSV schema": "- [x] Define and document CSV schema",
    "- [ ] Ship sample timetable file": "- [x] Ship sample timetable file",
    "- [ ] Support JSON import/export": "- [x] Support JSON import/export",
    "- [ ] Validate imported timetable data before activation": "- [x] Validate imported timetable data before activation",
    "- [ ] Do not rely on fragile arbitrary website scraping as an authoritative source": "- [x] Do not rely on fragile arbitrary website scraping as an authoritative source",
    "- [ ] Model prayer-start time separately from Iqamah/Jama'ah time": "- [x] Model prayer-start time separately from Iqamah/Jama'ah time",
    "- [ ] Support fixed Iqamah time": "- [x] Support fixed Iqamah time",
    "- [ ] Support Iqamah as `prayer start + N minutes`": "- [x] Support Iqamah as `prayer start + N minutes`",
    "- [ ] Support timetable-provided Iqamah times": "- [x] Support timetable-provided Iqamah times",
    "- [ ] Clearly distinguish Adhan/start and Iqamah on smart displays": "- [~] Clearly distinguish Adhan/start and Iqamah on smart displays",
    "- [ ] Detect Friday and support Jumu'ah presentation": "- [~] Detect Friday and support Jumu'ah presentation",
    "- [ ] Support one or multiple Jumu'ah sessions": "- [x] Support one or multiple Jumu'ah sessions",
    "- [ ] Store Khutbah/Jumu'ah times independently of astronomical Dhuhr": "- [x] Store Khutbah/Jumu'ah times independently of astronomical Dhuhr",
    "- [ ] Allow mosque-specific Friday configuration": "- [x] Allow mosque-specific Friday configuration",
    "- [ ] Mosque timetable tests": "- [x] Mosque timetable tests",
    "- [ ] CSV/JSON import/export tests": "- [x] CSV/JSON import/export tests",
    "- [ ] Iqamah-rule tests": "- [x] Iqamah-rule tests",
    "- [ ] Mosque source-selection isolation": "- [x] Mosque source-selection isolation",
    "- [ ] Document mosque timetable import format": "- [x] Document mosque timetable import format",
    "- [ ] Local mosque timetable mode works offline": "- [~] Local mosque timetable mode works offline",
    "- [ ] Prayer-start and Iqamah/Jama'ah times are distinct": "- [x] Prayer-start and Iqamah/Jama'ah times are distinct",
    "- [ ] Jumu'ah timetable support is functional": "- [~] Jumu'ah timetable support is functional",
}
for old, new in replacements.items():
    todo = replace_once(todo, old, new)

anchor = "- [ ] Allow mosque-specific Friday configuration\n"
note = (
    "\n**Stage 5 verification note (2026-08-16):** read-only Quality Gate run `31901969127` "
    "passed formatting, typed lint, strict typecheck, the complete timetable/import suite and production build. "
    "The verified offline domain core implements explicit calculated/local-mosque/calculated-adjustments source "
    "modes, rejects silent source fallback, separates prayer start from fixed or +N Iqamah, supports one or "
    "multiple Friday Jumu'ah sessions independent of Dhuhr, and performs strict CSV plus runtime-structurally-"
    "validated JSON import/export. The CSV schema and sample are documented in `docs/MOSQUE_TIMETABLE.md` and "
    "`examples/mosque-timetable.csv`. Persistent local storage, UI entry/presentation and vetted optional remote "
    "integrations remain open.\n"
)
if note.strip() not in todo:
    todo = todo.replace("- [x] Allow mosque-specific Friday configuration\n", "- [x] Allow mosque-specific Friday configuration\n" + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
entry = """

### 2026-08-16 — Local mosque timetable, Iqamah and Jumu'ah domain core

- Prayer source mode is explicit: `calculated`, `local-mosque` or `calculated-adjustments`; missing mosque entries remain unavailable instead of silently falling back to calculated values.
- Prayer start and Iqamah/Jama'ah are separate values. Fixed local-time and prayer-start-plus-offset Iqamah rules are validated, including prevention of next-day rollover.
- Friday detection supports one or multiple mosque-specific Jumu'ah sessions with Khutbah and Salah stored independently of astronomical Dhuhr.
- CSV import uses the documented fixed schema, 24-hour `HH:MM` prayer times and either fixed `HH:MM` or `+N` Iqamah values. A sample file is committed under `examples/`.
- JSON import reconstructs the domain structure through runtime guards before activation, rejecting malformed nested prayer, Iqamah and Jumu'ah objects and unknown prayer keys rather than trusting a TypeScript cast.
- CSV and JSON round-trip tests, invalid-schema/time tests, duplicate-date tests, source-isolation tests and Iqamah/Jumu'ah validation tests are included.
- Read-only Quality Gate run `31901969127` completed successfully with clean lockfile install, formatting, typed lint, strict typecheck, tests and production build.
- Persistence, UI editing/presentation and optional vetted remote integrations remain separate open work.
"""
if "### 2026-08-16 — Local mosque timetable, Iqamah and Jumu'ah domain core" not in testing:
    testing_path.write_text(testing + entry + "\n")

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Document threat/privacy model",
    "- [x] Document threat/privacy model",
)
anchor = "- [x] Document threat/privacy model\n"
note = (
    "\n**Privacy/threat-model verification note (2026-08-16):** read-only Quality Gate run `31917509097` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/PRIVACY_THREAT_MODEL.md`. The model identifies precise location, saved places, mosque choices, notification schedules and imported timetable/settings data as privacy-relevant; defines local-first trust boundaries; requires explicit location permission and data minimisation; constrains optional remote integrations, logging, service-worker caching and screen exposure; and records security review gates for future networked/native functionality. This closes documentation only: remote-call security, secrets policy enforcement, dependency review, CSP and native permission review remain separate open items.\n"
)
if "**Privacy/threat-model verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — privacy and threat model"
entry = """

### 2026-08-16 — privacy and threat model

- Added `docs/PRIVACY_THREAT_MODEL.md` covering privacy-relevant data, trust boundaries, local-first defaults, permission/data-minimisation expectations and abuse/failure scenarios.
- Defined safeguards for precise location, saved locations, mosque selections, timetable/settings imports, notification schedules, optional remote integrations, logs, caches and information visible on shared displays.
- Added explicit review gates for future networked and native functionality without claiming those controls are implemented yet.
- Kept separate security tracker items open for remote-call security, committed-secret prevention, dependency review, CSP and native-permission review.
- Read-only Quality Gate run `31917509097` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [~] Surface active high-latitude rule in calculation provenance/settings",
    "- [x] Surface active high-latitude rule in calculation provenance/settings",
)
todo = replace_once(
    todo,
    "- [~] High-latitude/manual-adjustment indicator when applicable",
    "- [x] High-latitude/manual-adjustment indicator when applicable",
)
anchor = "- [x] Surface active high-latitude rule in calculation provenance/settings\n"
note = (
    "\n**High-latitude indicator verification note (2026-08-16):** read-only Quality Gate run `31911591791` passed "
    "formatting, typed lint, strict typecheck, all tests and production build after adding source-aware fallback indicators. "
    "Prayer cards now identify when the displayed calculated time actually used a high-latitude fallback and name the active "
    "rule (Angle Based, Middle of the Night or One Seventh). Mosque-provided obligatory start times suppress calculated fallback "
    "badges because those values are replaced by the timetable, while calculated Sunrise remains eligible. The shared provenance "
    "note uses the same source-aware rule. Nearest-latitude/nearest-valid-day research for extreme polar conditions remains open.\n"
)
if "**High-latitude indicator verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Source-aware high-latitude fallback indicators"
entry = """

### 2026-08-16 — Source-aware high-latitude fallback indicators

- Added a pure display helper that decides whether a high-latitude fallback belongs to the currently displayed prayer source.
- Prayer cards now show a fallback badge only when the displayed calculated time actually used the configured high-latitude rule.
- The badge names the active rule using the existing localised Angle Based, Middle of the Night or One Seventh labels.
- Local-mosque obligatory start times suppress calculated fallback indicators because the timetable replaces those displayed values; Sunrise remains calculated and is still eligible.
- The shared provenance note now uses the same source-aware decision and names the configured rule instead of reporting a hidden calculated fallback.
- Tests cover calculated and calculated-adjustment sources, no-fallback cases, local-mosque obligatory suppression and the Sunrise/local-mosque exception.
- Read-only Quality Gate run `31911591791` passed formatting, typed lint, strict typecheck, all tests and production build.
- Nearest-latitude and nearest-valid-day strategies for extreme polar conditions remain open research and are not implied by this UI completion.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

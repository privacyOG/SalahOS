from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Show when a displayed time contains a manual adjustment",
    "- [x] Show when a displayed time contains a manual adjustment",
)
todo = replace_once(
    todo,
    "- [ ] Allow reset-to-method-default",
    "- [x] Allow reset-to-method-default",
)
anchor = "- [x] Allow reset-to-method-default\n"
note = (
    "\n**Manual-adjustment verification note (2026-08-16):** implementation Quality Gate run `31911208279` passed "
    "formatting, typed lint, strict typecheck, all tests and production build after integrating source-aware adjustment "
    "indicators and reset controls. Prayer cards now show the signed offset only when the displayed calculated time actually "
    "contains that adjustment; mosque-provided obligatory start times do not inherit a false badge, while calculated Sunrise "
    "remains correctly eligible in local-mosque mode. The dedicated reset clears only prayer offsets, returning displayed "
    "calculated times to the selected method defaults without resetting the selected method, location, mosque or other settings.\n"
)
if "**Manual-adjustment verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Manual prayer adjustment indicators and reset"
entry = """

### 2026-08-16 — Manual prayer adjustment indicators and reset

- Added pure helpers for detecting non-zero prayer offsets, resetting only the adjustment set and deciding whether an applied adjustment belongs to the currently displayed source.
- Prayer cards use the calculation provenance value rather than merely echoing persisted settings, so the signed badge reflects the adjustment that was actually applied by the prayer engine.
- Local-mosque obligatory start times suppress calculated adjustment badges because the mosque timetable replaces those displayed values; Sunrise remains calculated and can still show its own applied offset.
- Added a dedicated reset-to-method-default action that clears only manual prayer offsets while preserving calculation method, Asr convention, high-latitude rule, location, mosque, notifications and other settings.
- English and Arabic labels plus responsive badge/reset styling were added to the shared settings/dashboard shell.
- Tests cover positive and negative offsets, zero/missing offsets, source-aware display, the Sunrise/local-mosque exception, active-adjustment detection and non-mutating reset behaviour.
- Implementation Quality Gate run `31911208279` passed formatting, typed lint, strict typecheck, all tests and production build.
- The combined Stage 7 high-latitude/manual-adjustment indicator remains partial until the high-latitude visual indicator is completed and verified.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

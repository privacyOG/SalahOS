from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [~] Verify mixed Arabic/Latin text rendering",
    "- [x] Verify mixed Arabic/Latin text rendering",
)
anchor = "- [x] Verify mixed Arabic/Latin text rendering\n"
note = (
    "\n**Mixed-direction text verification note (2026-08-16):** read-only Quality Gate run `31917001417` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `11a0459595e36c7981ccbe72c133b92ec5d3ce67`. Dynamic user/provider values that can contain Arabic, Latin text, identifiers or numerals now use automatic bidirectional isolation: rendered method names, timezone identifiers, mosque names and Jumu'ah labels are wrapped in semantic `<bdi dir=\"auto\">`, while editable/selectable saved-location, method and mosque values use `dir=\"auto\"`. Static-render tests verify mixed Arabic/Latin text and `Australia/Sydney` identifiers produce isolated markup without forcing the surrounding page direction. Full visual RTL verification across every major breakpoint remains a separate partial item.\n"
)
if "**Mixed-direction text verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — mixed-direction text isolation"
entry = """

### 2026-08-16 — mixed-direction text isolation

- Added a reusable semantic `BidiText` renderer using `<bdi dir="auto">` for dynamic values embedded in localized UI text.
- Isolated rendered calculation-method names, IANA timezone identifiers, mosque names and Jumu'ah session labels from the surrounding document direction.
- Added `dir="auto"` to dynamic saved-location, calculation-method and mosque option/input values so user-entered Arabic/Latin content can determine its own direction.
- Added static-render tests proving mixed Arabic/Latin content and an IANA timezone identifier produce bidirectionally isolated markup without changing the parent page direction.
- Kept the separate RTL-at-every-breakpoint tracker item partial because deterministic markup tests do not replace visual browser validation.
- Read-only Quality Gate run `31917001417` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `11a0459595e36c7981ccbe72c133b92ec5d3ce67`.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

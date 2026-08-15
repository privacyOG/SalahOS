from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [~] Calculate and display Sunrise separately from the five obligatory prayers",
    "- [x] Calculate and display Sunrise separately from the five obligatory prayers",
)
anchor = "- [x] Calculate and display Sunrise separately from the five obligatory prayers\n"
note = (
    "\n**Sunrise supplementary verification note (2026-08-16):** read-only Quality Gate run `31912253750` passed "
    "formatting, typed lint, strict typecheck, all tests and production build after formalising the presentation role. The "
    "shared dashboard already calculates and exposes Sunrise as a sixth row between Fajr and Dhuhr, while next/current prayer "
    "selection remains restricted to the five obligatory prayers. The shared UI now derives supplementary styling from the "
    "tested presentation role rather than a component-local string check.\n"
)
if "**Sunrise supplementary verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Sunrise supplementary presentation"
entry = """

### 2026-08-16 — Sunrise supplementary presentation

- Formalised prayer presentation roles so Sunrise is the sole supplementary row and Fajr, Dhuhr, Asr, Maghrib and Isha remain obligatory.
- The shared dashboard already exposes Sunrise separately in the six-row daily sequence, and selected-source current/next state excludes Sunrise from obligatory prayer selection.
- The shared prayer-card UI now applies supplementary styling through the tested presentation role instead of a component-local prayer-name comparison.
- Tests verify Sunrise's supplementary role and the obligatory role of all five daily prayers.
- Read-only Quality Gate run `31912253750` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

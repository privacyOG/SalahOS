from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(todo, "- [~] High-contrast readable typography", "- [x] High-contrast readable typography")
anchor = "- [x] High-contrast readable typography\n"
note = (
    "\n**Readable-typography verification note (2026-08-16):** read-only Quality Gate run `31917294038` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `c23c76db4ac07b5da9b3c3406b4d63c2cebb0c91`. Supporting labels, prayer-time captions, settings notes, notification labels and adjustment badges now use larger minimum text sizes with explicit readable line heights. Theme-specific hard-coded secondary text/border colors were replaced with semantic variables so light, dark and system themes remain consistent. `prefers-contrast: more` increases secondary-text contrast, structural border weight and removes supplementary-card fading, while `forced-colors: active` maps the interface to system colors instead of defeating operating-system high-contrast modes.\n"
)
if "**Readable-typography verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — high-contrast readable typography"
entry = """

### 2026-08-16 — high-contrast readable typography

- Increased small supporting labels and prayer-time captions to readable minimum sizes with explicit line heights and stronger weight where appropriate.
- Replaced late stylesheet dark-theme hard-codes with semantic theme variables so secondary text, borders and subtle backgrounds remain valid in light/dark/system themes.
- Added `prefers-contrast: more` handling that strengthens secondary text and structural borders and removes supplementary-card opacity reduction.
- Added `forced-colors: active` system-color mappings so operating-system high-contrast modes can control canvas, text, borders, highlights and focus treatment.
- Read-only Quality Gate run `31917294038` passed formatting, typed lint, strict typecheck, all tests and production build on exact cleaned head `c23c76db4ac07b5da9b3c3406b4d63c2cebb0c91`.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

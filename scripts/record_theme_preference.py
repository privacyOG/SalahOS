from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
for old, new in (
    ("- [~] Light theme", "- [x] Light theme"),
    ("- [~] Dark theme", "- [x] Dark theme"),
    ("- [~] Follow-system theme", "- [x] Follow-system theme"),
):
    todo = replace_once(todo, old, new)
anchor = "- [x] Follow-system theme\n"
note = (
    "\n**Runtime theme verification note (2026-08-16):** read-only Quality Gate run `31912934726` passed formatting, "
    "typed lint, strict typecheck, all tests and production build after adding a runtime theme adapter. Explicit Light and Dark "
    "preferences apply immediately. Follow-system resolves the current operating-system color-scheme preference, listens for later "
    "changes, updates the effective document theme, and removes the listener when the mode changes or the application unmounts.\n"
)
if "**Runtime theme verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Runtime light, dark and system themes"
entry = """

### 2026-08-16 — Runtime light, dark and system themes

- Added a runtime theme adapter used by the shared application shell.
- Explicit Light and Dark preferences apply their effective theme directly without a system listener.
- Follow-system resolves the operating-system color-scheme preference and reacts to later preference changes.
- Listener cleanup is verified so changing theme mode or unmounting does not retain stale handlers.
- Existing persisted theme selection and CSS variables remain the shared styling source across form factors.
- Read-only Quality Gate run `31912934726` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

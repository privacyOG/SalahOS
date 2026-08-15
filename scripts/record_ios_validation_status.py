from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Document untested iOS items honestly when unavailable on development host",
    "- [x] Document untested iOS items honestly when unavailable on development host",
)
anchor = "- [x] Document untested iOS items honestly when unavailable on development host\n"
note = (
    "\n**iOS validation-status note (2026-08-16):** read-only Quality Gate run `31914072847` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/IOS_VALIDATION_STATUS.md`. The document separates shared CI evidence from macOS/Xcode simulator checks and physical iPhone/iPad checks, and requires native-specific tracker items to remain open until the corresponding evidence is recorded. Signing credentials and private keys are explicitly excluded from the repository.\n"
)
if "**iOS validation-status note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — iOS and iPadOS validation evidence boundary"
entry = """

### 2026-08-16 — iOS and iPadOS validation evidence boundary

- Added `docs/IOS_VALIDATION_STATUS.md` to distinguish shared application CI from native Apple-platform validation.
- Recorded which checks require macOS/Xcode and which require a physical iPhone or iPad.
- Kept native shell, notification delivery, audio lifecycle, reboot recovery and signing/distribution items open until exercised in the required environment.
- Explicitly prohibited committing signing certificates, private keys, provisioning profiles or distribution credentials.
- Read-only Quality Gate run `31914072847` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

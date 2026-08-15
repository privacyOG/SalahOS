from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Test notification behaviour across DST transition",
    "- [~] Test notification behaviour across DST transition",
)
anchor = "- [ ] Document platform-specific limitations instead of promising impossible exact behaviour\n"
note = (
    "\n**Notification-DST verification note (2026-08-16):** read-only Quality Gate run `31910410104` passed "
    "formatting, typed lint, strict typecheck, all tests and production build for IANA wall-clock-to-instant resolution. "
    "The scheduling domain now resolves notification civil times against the selected IANA timezone, including Sydney and "
    "London DST transitions. Repeated wall-clock times are represented explicitly and notification scheduling chooses the "
    "earlier occurrence deterministically; nonexistent spring-forward times are skipped rather than silently shifted or "
    "fabricated. Actual platform notification delivery across DST has not yet been exercised, so the delivery-level DST "
    "tracker item remains partial.\n"
)
if "**Notification-DST verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Notification IANA/DST instant resolution"
entry = """

### 2026-08-16 — Notification IANA/DST instant resolution

- Added wall-clock civil-time resolution against IANA timezone rules without deriving offsets from longitude or assuming one fixed offset for a date.
- Ordinary local times resolve to one exact instant and the offset used for that instant is retained.
- Repeated DST-end local times return both chronological candidates; notification scheduling selects and marks the earlier occurrence deterministically.
- Nonexistent DST-start wall-clock times return an explicit skipped result rather than being silently shifted or fabricated.
- Tests cover exact Sydney resolution, London repeated/skipped hours, Sydney repeated/skipped hours, invalid civil input and notification intent resolution policy.
- Read-only Quality Gate run `31910410104` passed formatting, typed lint, strict typecheck, all tests and production build.
- End-to-end Android/iOS/web delivery, permission/background behaviour and real platform DST scheduling remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

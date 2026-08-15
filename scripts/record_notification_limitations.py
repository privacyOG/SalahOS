from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Document platform-specific limitations instead of promising impossible exact behaviour",
    "- [x] Document platform-specific limitations instead of promising impossible exact behaviour",
)
anchor = "- [x] Document platform-specific limitations instead of promising impossible exact behaviour\n"
note = (
    "\n**Notification platform-limitations verification note (2026-08-16):** read-only Quality Gate run `31913144213` passed "
    "formatting, typed lint, strict typecheck, all tests and production build after adding `docs/NOTIFICATION_LIMITATIONS.md`. "
    "The document separates deterministic scheduling intent from final delivery and records Web/PWA, Android, iOS/iPadOS and "
    "Raspberry Pi/desktop/kiosk constraints around permissions, background execution, suspend/reboot, exact scheduling and Adhan "
    "playback. Product wording must not promise exact delivery until a target-platform adapter is implemented and verified.\n"
)
if "**Notification platform-limitations verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Notification platform limitations"
entry = """

### 2026-08-16 — Notification platform limitations

- Added `docs/NOTIFICATION_LIMITATIONS.md` as the shared product contract for notification and Adhan delivery claims.
- Distinguished deterministic local scheduling intent from operating-system or browser delivery guarantees.
- Documented Web/PWA limits around permissions, closed/suspended pages, event-driven service workers and kiosk process lifetime.
- Documented Android constraints around permission policy, exact scheduling restrictions, battery/background controls, reboot reconstruction and audio lifecycle.
- Documented iOS/iPadOS constraints around user-controlled permission, operating-system presentation, background execution and notification/audio policy.
- Documented Raspberry Pi/desktop/kiosk behaviour across active sessions, sleep, termination, power loss and startup recalculation.
- Read-only Quality Gate run `31913144213` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
for old, new in {
    "- [ ] Reschedule notifications after timezone/location/method changes": "- [~] Reschedule notifications after timezone/location/method changes",
    "- [ ] Reschedule future prayer notifications at date rollover": "- [~] Reschedule future prayer notifications at date rollover",
    "- [ ] Prevent duplicate notifications": "- [~] Prevent duplicate notifications",
}.items():
    todo = replace_once(todo, old, new)

anchor = "- [ ] Document platform-specific limitations instead of promising impossible exact behaviour\n"
note = (
    "\n**Notification-schedule verification note (2026-08-16):** implementation Quality Gate run `31908783069` "
    "passed formatting, typed lint, strict typecheck, all tests and production build for the deterministic scheduling core. "
    "The domain now builds stable per-date/per-prayer reminder, prayer-time and Adhan intents; normalizes reminders that "
    "fall on the prior civil date; deduplicates repeated inputs; and reconciles an installed schedule against recalculated "
    "desired jobs with explicit cancellation and replacement sets. Tests cover changed prayer times, date rollover, "
    "duplicate input and no-op reconciliation. No platform scheduler consumes these intents yet, so rescheduling and duplicate "
    "prevention remain partial. Reboot recovery, timezone-to-instant/DST delivery validation and permission/background handling "
    "remain open.\n"
)
if "**Notification-schedule verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Duplicate-safe notification schedule core"
entry = """

### 2026-08-16 — Duplicate-safe notification schedule core

- Added deterministic notification intents with stable ids scoped by prayer date, prayer and delivery kind.
- Reminder intents can normalize into the previous civil date without losing the original prayer date identity.
- Repeated prayer inputs collapse to one intent id, preventing duplicate jobs at the domain boundary.
- Reconciliation compares installed and desired intents and emits explicit cancellation plus scheduling sets when recalculated prayer times change.
- Date rollover replaces prior-date jobs with next-date ids, while an already-correct schedule produces a no-op reconciliation.
- Tests cover reminder/prayer-time/Adhan intent generation, prior-day reminder normalization, duplicate input, recalculation replacement, date rollover and no-op reconciliation.
- Implementation Quality Gate run `31908783069` passed formatting, typed lint, strict typecheck, all tests and production build.
- Timezone-to-instant conversion, DST delivery tests, platform scheduling, permission handling, reboot recovery and actual delivery remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

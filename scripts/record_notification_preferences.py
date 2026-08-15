from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
for old, new in {
    "- [ ] Per-prayer notification enable/disable": "- [~] Per-prayer notification enable/disable",
    "- [ ] Reminder N minutes before prayer": "- [~] Reminder N minutes before prayer",
    "- [ ] Prayer-time notification": "- [~] Prayer-time notification",
    "- [ ] Per-prayer sound choice": "- [~] Per-prayer sound choice",
    "- [ ] Vibration option where supported": "- [~] Vibration option where supported",
    "- [ ] Adhan enable/disable": "- [~] Adhan enable/disable",
    "- [ ] Per-prayer notifications": "- [~] Per-prayer notifications",
    "- [ ] Adhan settings": "- [~] Adhan settings",
}.items():
    todo = replace_once(todo, old, new)

anchor = "- [ ] Document platform-specific limitations instead of promising impossible exact behaviour\n"
note = (
    "\n**Notification-preferences verification note (2026-08-16):** read-only Quality Gate run `31908401807` "
    "passed the notification preference domain and settings-schema v2 migration, and implementation Quality Gate run "
    "`31908480344` passed formatting, typed lint, strict typecheck, all tests and production build after the settings UI "
    "integration. Each obligatory prayer now has locally persisted enable, 1–180 minute reminder, prayer-time alert, "
    "default/silent sound, vibration and Adhan-enable preferences. Existing v1 settings migrate to v2 without losing "
    "location, calculation or mosque configuration. No platform notification scheduler, permission request or Adhan audio "
    "delivery is implemented yet, so delivery-related tracker items remain partial rather than complete.\n"
)
if "**Notification-preferences verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Notification and Adhan preference core"
entry = """

### 2026-08-16 — Notification and Adhan preference core

- Added a shared per-prayer preference model for Fajr, Dhuhr, Asr, Maghrib and Isha; Sunrise is intentionally excluded from obligatory-prayer delivery preferences.
- Notifications are opt-in by default, with optional 1–180 minute reminders, prayer-time alerts, default/silent sound, vibration and per-prayer Adhan enable flags.
- Preference parsing rejects invalid reminder ranges and safely defaults missing prayer entries.
- Settings persistence advanced from schema v1 to v2 with an explicit migration that preserves existing location, calculation, adjustment, source and mosque data while adding safe notification defaults.
- Settings export/import includes the new validated notification configuration.
- The shared settings UI exposes all current preference fields and explicitly states that actual delivery depends on a later platform scheduler and permission/background constraints.
- The duplicated mosque-library settings panel discovered during this integration was removed.
- Read-only Quality Gate run `31908401807` passed the domain/persistence core; implementation Quality Gate run `31908480344` passed formatting, typed lint, strict typecheck, all tests and production build after UI integration.
- Platform permission flows, notification scheduling, exact-alarm/reboot handling, duplicate suppression, DST rescheduling and actual Adhan audio delivery remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

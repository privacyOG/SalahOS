from pathlib import Path


todo_path = Path("TODO.md")
todo = todo_path.read_text()
anchor = "- [ ] Document platform-specific limitations instead of promising impossible exact behaviour\n"
note = (
    "\n**Notification scheduler-adapter verification note (2026-08-16):** read-only Quality Gate run `31910761615` "
    "passed formatting, typed lint, strict typecheck, all tests and production build for the platform-neutral scheduling "
    "contract. The shared executor now lists installed notification records, reconciles them against exact resolved intents, "
    "cancels stale records before replacement, applies new records, treats a second identical application as a no-op, and "
    "removes installed jobs that become invalid because their local wall-clock time falls in a DST gap. Conflicting records "
    "sharing one stable id are rejected. Real platform adapters, permission/background constraints and reboot persistence remain "
    "open, so delivery-related tracker statuses remain partial.\n"
)
if "**Notification scheduler-adapter verification note (2026-08-16):**" not in todo:
    if anchor not in todo:
        raise RuntimeError("Missing notification limitations tracker anchor")
    todo = todo.replace(anchor, anchor + note, 1)
    todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Platform-neutral notification scheduler adapter"
entry = """

### 2026-08-16 — Platform-neutral notification scheduler adapter

- Added an asynchronous scheduler adapter contract with list, schedule and cancel operations that can be implemented by Android, iOS or another supported runtime.
- Exact notification records retain stable id, prayer, delivery kind, epoch instant, IANA timezone, resolved offset, DST ambiguity policy, sound and vibration metadata.
- The executor reconciles installed records against desired exact-instant resolutions and cancels stale records before scheduling replacements.
- Reapplying an identical desired schedule is a no-op, which prevents repeated duplicate scheduling at the adapter boundary.
- Notifications that resolve to nonexistent DST-gap local times cancel any previously installed record and are not rescheduled.
- Conflicting desired or installed records sharing one stable id are rejected rather than silently choosing one.
- An in-memory conformance adapter verifies initial scheduling, idempotence, recalculation replacement, DST-gap cancellation, metadata replacement and conflicting-id rejection.
- Read-only Quality Gate run `31910761615` passed formatting, typed lint, strict typecheck, all tests and production build.
- Native platform scheduling, notification permissions, reboot restoration and background/exact-delivery constraints remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

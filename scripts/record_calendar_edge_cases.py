from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
for old, new in (
    ("- [ ] Leap year", "- [x] Leap year"),
    ("- [ ] Gregorian year boundary", "- [x] Gregorian year boundary"),
    ("- [ ] Local midnight rollover", "- [x] Local midnight rollover"),
):
    todo = replace_once(todo, old, new)
anchor = "- [x] Local midnight rollover\n"
note = (
    "\n**Calendar edge-case verification note (2026-08-16):** read-only Quality Gate run `31914501854` passed formatting, typed lint, strict typecheck, all tests and production build. Gregorian calendar tests now verify 2024-02-29 and the following March 1 civil date, plus consecutive 2026-12-31/2027-01-01 year-boundary dates. The production IANA location context is also tested across Sydney local midnight, proving the resolved civil date changes from 2026-08-16 to 2026-08-17 exactly between 23:59:59 and 00:00:00 local time.\n"
)
if "**Calendar edge-case verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Gregorian leap year, year boundary and local midnight"
entry = """

### 2026-08-16 — Gregorian leap year, year boundary and local midnight

- Added Gregorian leap-day coverage for 2024-02-29 and its transition to 2024-03-01.
- Added consecutive Gregorian year-boundary coverage for 2026-12-31 and 2027-01-01.
- Added production IANA location-context coverage across Sydney local midnight from 23:59:59 to 00:00:00.
- Verified the local civil date advances exactly at midnight while retaining the resolved Australia/Sydney timezone and expected UTC offset for the fixture.
- Read-only Quality Gate run `31914501854` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

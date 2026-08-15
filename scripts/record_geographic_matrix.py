from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
for item in (
    "Sydney",
    "Melbourne",
    "Cairo",
    "Istanbul",
    "Karachi",
    "Jakarta",
    "London",
    "New York",
    "Oslo",
    "Equatorial location",
    "Northern-hemisphere location",
    "Southern-hemisphere location",
):
    todo = replace_once(todo, f"- [ ] {item}", f"- [x] {item}")

anchor = "- [x] Southern-hemisphere location\n"
note = (
    "\n**Geographic matrix verification note (2026-08-16):** read-only Quality Gate run `31914980103` passed formatting, typed lint, strict typecheck, all tests and production build after expanding the production location → IANA timezone → prayer-calculation integration matrix. March-equinox fixtures now cover Sydney, Melbourne, Cairo, Istanbul, Karachi, Jakarta, London, New York, Oslo and Quito, assert the expected offline-resolved IANA timezone and UTC offset, and verify all six displayed prayer/sunrise times are available and strictly ordered. The matrix also explicitly covers northern, southern and equatorial latitude bands. Madinah, Tromsø and the extreme high-latitude seasonal cases remain open.\n"
)
if "**Geographic matrix verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — geographic integration matrix"
entry = """

### 2026-08-16 — geographic integration matrix

- Expanded the production location → IANA timezone → prayer-calculation integration matrix on the March equinox.
- Verified Sydney, Melbourne, Cairo, Istanbul, Karachi, Jakarta, London, New York, Oslo and Quito resolve through the offline timezone lookup with their expected UTC offsets.
- Verified each ordinary-location fixture produces available Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha values in strict chronological order.
- Explicitly covered northern, southern and equatorial latitude bands while keeping Tromsø and extreme-polar seasonal validation separate.
- Read-only Quality Gate run `31914980103` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

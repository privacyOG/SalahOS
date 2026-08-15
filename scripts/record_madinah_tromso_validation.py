from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
for item in (
    "Madinah",
    "Tromsø",
    "Extreme high-latitude summer case",
    "Extreme high-latitude winter case",
):
    todo = replace_once(todo, f"- [ ] {item}", f"- [x] {item}")

anchor = "- [x] Extreme high-latitude winter case\n"
note = (
    "\n**Madinah/Tromsø geographic verification note (2026-08-16):** read-only Quality Gate run `31915190467` passed formatting, typed lint, strict typecheck, all tests and production build. Madinah resolves through the offline IANA lookup to `Asia/Riyadh` at UTC+03 and produces an ordered equinox prayer schedule. Tromsø resolves to `Europe/Oslo` with UTC+02 in summer and UTC+01 in winter. The polar-summer fixture deliberately leaves Fajr, Sunrise, Maghrib and Isha unavailable rather than fabricating events, while the polar-winter fixture leaves unavailable Sunrise and sunset-based Maghrib explicitly unavailable; neither case falsely reports a high-latitude fallback when the prerequisite night bounds do not exist.\n"
)
if "**Madinah/Tromsø geographic verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Madinah and Tromsø polar-season validation"
entry = """

### 2026-08-16 — Madinah and Tromsø polar-season validation

- Added Madinah to the ordinary-location equinox matrix and verified `Asia/Riyadh`, UTC+03 and strict prayer/sunrise ordering.
- Verified Tromsø resolves to `Europe/Oslo`, using UTC+02 for the June fixture and UTC+01 for the December fixture.
- Verified polar summer does not fabricate Fajr, Sunrise, Maghrib or Isha when the required astronomical events/night bounds are unavailable.
- Verified polar winter keeps unavailable Sunrise and sunset-based Maghrib explicit and does not falsely claim a high-latitude fallback.
- Read-only Quality Gate run `31915190467` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

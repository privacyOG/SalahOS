from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
replacements = {
    "- [ ] Build localisation framework from the beginning": "- [x] Build localisation framework from the beginning",
    "- [ ] English translation complete": "- [x] English translation complete",
    "- [ ] Arabic translation complete": "- [x] Arabic translation complete",
    '- [ ] Enable `dir="rtl"` correctly for Arabic': '- [x] Enable `dir="rtl"` correctly for Arabic',
    "- [ ] Verify mixed Arabic/Latin text rendering": "- [~] Verify mixed Arabic/Latin text rendering",
    "- [ ] Verify Arabic numerals/date/time formatting choices": "- [x] Verify Arabic numerals/date/time formatting choices",
    "- [ ] Ensure prayer names have correct Arabic forms": "- [x] Ensure prayer names have correct Arabic forms",
    "- [ ] Keep all user-facing text out of hard-coded components": "- [x] Keep all user-facing text out of hard-coded components",
    "- [ ] Design translation structure for additional languages later": "- [x] Design translation structure for additional languages later",
    "- [ ] Test RTL at every major breakpoint": "- [~] Test RTL at every major breakpoint",
    "- [ ] Language selector": "- [~] Language selector",
    "- [ ] Phone portrait — Arabic/RTL/dark": "- [~] Phone portrait — Arabic/RTL/dark",
    "- [ ] Verify Arabic/RTL alignment": "- [~] Verify Arabic/RTL alignment",
    "- [ ] English and Arabic/RTL are production-ready": "- [~] English and Arabic/RTL are production-ready",
}
for old, new in replacements.items():
    todo = replace_once(todo, old, new)

anchor = "- [~] Test RTL at every major breakpoint\n"
note = (
    "\n**Stage 6 verification note (2026-08-16):** read-only Quality Gate run `31902384992` "
    "passed formatting, typed lint, strict typecheck, the complete unit suite and production build. The current "
    "shared shell now uses a statically typed English/Arabic catalogue, runtime locale switching, Arabic prayer "
    "names, document `lang`/`dir` updates, RTL-safe logical CSS and locale-aware time/Gregorian-date helpers. "
    "All user-facing prose in the current `App` shell is catalogue-backed. Full visual RTL validation across phone, "
    "tablet, Raspberry Pi and kiosk breakpoints remains open until those responsive layouts and the visual suite exist.\n"
)
if note.strip() not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
entry = """

### 2026-08-16 — English/Arabic localisation and RTL core

- The current shared application shell uses a statically typed English/Arabic translation catalogue instead of hard-coded user-facing prose in `App.tsx`.
- Arabic prayer names are explicitly covered for Fajr, Dhuhr, Asr, Maghrib and Isha.
- Locale switching applies `lang` and `dir` to the document root while the shared shell also receives the matching direction.
- RTL layout uses logical block properties and removes Latin-specific uppercase/letter-spacing treatment for Arabic.
- Locale helpers cover explicit 12/24-hour-capable prayer-time formatting and host-timezone-independent Gregorian civil-date formatting through `Intl.DateTimeFormat`.
- Tests run without a browser-global dependency by targeting the minimal document-root locale contract.
- Read-only Quality Gate run `31902384992` completed successfully with clean lockfile install, formatting, typed lint, strict typecheck, all tests and production build.
- Full mixed-script and RTL visual regression across every target breakpoint remains open for the responsive UI test stage.
"""
if "### 2026-08-16 — English/Arabic localisation and RTL core" not in testing:
    testing_path.write_text(testing + entry + "\n")

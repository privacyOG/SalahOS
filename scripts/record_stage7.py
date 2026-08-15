from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
replacements = {
    "- [~] Support manual latitude/longitude entry": "- [x] Support manual latitude/longitude entry",
    "- [~] Support current-location refresh": "- [x] Support current-location refresh",
    "- [~] Handle denied-location-permission flow gracefully": "- [x] Handle denied-location-permission flow gracefully",
    "- [~] Handle unavailable GPS/location services gracefully": "- [x] Handle unavailable GPS/location services gracefully",
    "- [ ] Fall back to saved/manual location without breaking prayer calculations": "- [~] Fall back to saved/manual location without breaking prayer calculations",
    "- [~] Display Gregorian date": "- [x] Display Gregorian date",
    "- [ ] Ensure date changes update without requiring app restart": "- [x] Ensure date changes update without requiring app restart",
    "- [ ] Current local time": "- [x] Current local time",
    "- [ ] Gregorian date": "- [x] Gregorian date",
    "- [ ] Hijri date": "- [x] Hijri date",
    "- [ ] Current location / selected mosque": "- [~] Current location / selected mosque",
    "- [ ] Today's five prayer times": "- [x] Today's five prayer times",
    "- [ ] Sunrise as supplementary information": "- [x] Sunrise as supplementary information",
    "- [ ] Next-prayer indicator": "- [x] Next-prayer indicator",
    "- [ ] Live next-prayer countdown": "- [x] Live next-prayer countdown",
    "- [ ] Highlight current/next prayer": "- [~] Highlight current/next prayer",
    "- [ ] Calculation method/source indicator": "- [x] Calculation method/source indicator",
    "- [ ] High-latitude/manual-adjustment indicator when applicable": "- [~] High-latitude/manual-adjustment indicator when applicable",
    "- [ ] Phone portrait layout": "- [~] Phone portrait layout",
    "- [ ] Phone landscape layout": "- [~] Phone landscape layout",
    "- [ ] Tablet layout": "- [~] Tablet layout",
    "- [ ] Raspberry Pi Touch Display 2 first-class layout": "- [~] Raspberry Pi Touch Display 2 first-class layout",
    "- [ ] 1920×1080 TV/kiosk layout": "- [~] 1920×1080 TV/kiosk layout",
    "- [ ] Large-format display layout": "- [~] Large-format display layout",
    "- [ ] Avoid separate duplicated application logic for each form factor": "- [x] Avoid separate duplicated application logic for each form factor",
    "- [ ] High-contrast readable typography": "- [~] High-contrast readable typography",
    "- [ ] Scalable text": "- [x] Scalable text",
    "- [ ] Keyboard navigation": "- [x] Keyboard navigation",
    "- [ ] Touch-friendly controls": "- [x] Touch-friendly controls",
    "- [ ] Appropriate semantic/ARIA roles on web targets": "- [x] Appropriate semantic/ARIA roles on web targets",
    "- [ ] Visible focus state": "- [x] Visible focus state",
    "- [ ] Respect reduced-motion preference where applicable": "- [x] Respect reduced-motion preference where applicable",
}
for old, new in replacements.items():
    todo = replace_once(todo, old, new)

anchor = "- [x] Respect reduced-motion preference where applicable\n"
note = (
    "\n**Stage 7 dashboard verification note (2026-08-16):** read-only Quality Gate run `31903663678` "
    "passed formatting, typed lint, strict typecheck, the expanded dashboard/localisation tests and production build. "
    "The shared web shell now accepts one-shot browser location or validated manual coordinates, resolves the IANA "
    "timezone locally, refreshes the live clock every second, recomputes Gregorian/Hijri dates and today/tomorrow "
    "prayer schedules from shared domain logic, shows the five prayers plus Sunrise, identifies the next prayer, "
    "runs a live countdown and exposes calculation source/method. The responsive CSS uses one shared application "
    "model across phone/tablet/display widths with keyboard focus, touch-sized controls, ARIA status/error regions "
    "and reduced-motion handling. Mosque selection/Iqamah presentation, current-prayer highlighting, persistent "
    "saved locations, themes and visual regression on physical target displays remain open.\n"
)
if note.strip() not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
entry = """

### 2026-08-16 — Live shared prayer dashboard

- A pure dashboard model composes coordinates, offline IANA timezone resolution, local clock extraction, Gregorian/Umm al-Qura dates, today/tomorrow prayer schedules and next-prayer selection without duplicating prayer formulas in React.
- The web shell supports one-shot browser location refresh and validated manual latitude/longitude entry; typed permission/unavailable/timeout/unsupported failures direct the user to the manual path.
- The dashboard displays live local time, Gregorian and Hijri dates, coordinates/timezone, calculation method/source, the five obligatory prayers, Sunrise, next-prayer highlighting and a per-second countdown.
- Tomorrow Fajr rollover after Isha and host-timezone-independent clock extraction are covered by dashboard tests.
- Responsive CSS uses one shared app/data model across phone, tablet and large-display widths, with visible keyboard focus, touch-sized controls, semantic status/error messaging and reduced-motion handling.
- Read-only Quality Gate run `31903663678` passed clean lockfile install, formatting, typed lint, strict typecheck, all tests and production build after canonical formatting.
- Mosque selection/Iqamah presentation, persistent saved locations, theme controls, current-prayer highlighting and visual regression on physical target displays remain open.
"""
if "### 2026-08-16 — Live shared prayer dashboard" not in testing:
    testing_path.write_text(testing + entry + "\n")

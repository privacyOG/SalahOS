from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing presentation marker: {old[:120]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
import_marker = "import type { PrayerName } from './domain/prayerEngine';\n"
presentation_import = "import { isSupplementaryPrayer } from './domain/prayerPresentation';\n"
if presentation_import not in app:
    app = replace_once(app, import_marker, import_marker + presentation_import)
old_class = "${prayer.name === 'sunrise' ? ' prayer-card-supplementary' : ''}"
new_class = "${isSupplementaryPrayer(prayer.name) ? ' prayer-card-supplementary' : ''}"
if new_class not in app:
    app = replace_once(app, old_class, new_class)
app_path.write_text(app)

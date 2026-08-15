from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing UI marker: {old[:120]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
old_class = "className={`prayer-card${prayer.isNext ? ' prayer-card-next' : ''}${prayer.name === 'sunrise' ? ' prayer-card-supplementary' : ''}`}"
new_class = "className={`prayer-card${prayer.isCurrent ? ' prayer-card-current' : ''}${prayer.isNext ? ' prayer-card-next' : ''}${prayer.name === 'sunrise' ? ' prayer-card-supplementary' : ''}`}"
if new_class not in app:
    app = replace_once(app, old_class, new_class)

indicator_marker = """                    <div className=\"prayer-indicators\">
                      {displayedHighLatitude && (
"""
indicator_replacement = """                    <div className=\"prayer-indicators\">
                      {prayer.isCurrent && (
                        <span className=\"current-prayer-badge\">
                          {translate(locale, 'currentPrayer')}
                        </span>
                      )}
                      {displayedHighLatitude && (
"""
if "className=\"current-prayer-badge\"" not in app:
    app = replace_once(app, indicator_marker, indicator_replacement)
app_path.write_text(app)

translations_path = Path("src/i18n/translations.ts")
translations = translations_path.read_text()
if "    currentPrayer: 'Current prayer',\n" not in translations:
    translations = replace_once(
        translations,
        "    nextPrayer: 'Next prayer',\n",
        "    currentPrayer: 'Current prayer',\n    nextPrayer: 'Next prayer',\n",
    )
if "    currentPrayer: 'الصلاة الحالية',\n" not in translations:
    translations = replace_once(
        translations,
        "    nextPrayer: 'الصلاة القادمة',\n",
        "    currentPrayer: 'الصلاة الحالية',\n    nextPrayer: 'الصلاة القادمة',\n",
    )
translations_path.write_text(translations)

styles_path = Path("src/styles.css")
styles = styles_path.read_text().rstrip()
addition = """

.prayer-card-current {
  border-color: var(--warning);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--warning) 12%, transparent);
}

.current-prayer-badge {
  display: inline-flex;
  align-items: center;
  min-block-size: 1.75rem;
  padding-inline: 0.55rem;
  border: 1px solid var(--warning);
  border-radius: 999px;
  color: var(--warning) !important;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.2;
}
"""
if ".prayer-card-current {" not in styles:
    styles_path.write_text(styles + addition + "\n")

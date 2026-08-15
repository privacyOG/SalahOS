from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing UI marker: {old[:120]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()

prayer_import = "import type { PrayerName } from './domain/prayerEngine';\n"
adjustment_import = """import {
  displayedManualPrayerAdjustmentMinutes,
  hasManualPrayerAdjustments,
  resetManualPrayerAdjustments,
} from './domain/prayerAdjustments';
"""
if adjustment_import not in app:
    app = replace_once(app, prayer_import, prayer_import + adjustment_import)

update_offset = """  function updatePrayerOffset(prayer: PrayerName, rawValue: string): void {
    setSettings((current) => {
      const nextAdjustments = { ...current.prayerAdjustments };
      if (rawValue.trim() === '') {
        Reflect.deleteProperty(nextAdjustments, prayer);
      } else {
        const value = Number(rawValue);
        if (!Number.isInteger(value) || value < -180 || value > 180) {
          return current;
        }
        nextAdjustments[prayer] = value;
      }
      return { ...current, prayerAdjustments: nextAdjustments };
    });
  }
"""
reset_offset = update_offset + """

  function resetPrayerOffsets(): void {
    setSettings((current) => ({
      ...current,
      prayerAdjustments: resetManualPrayerAdjustments(),
    }));
  }
"""
if "function resetPrayerOffsets(): void" not in app:
    app = replace_once(app, update_offset, reset_offset)

offset_fieldset = """        <fieldset className=\"offsets-fieldset\">
          <legend>{translate(locale, 'prayerOffsets')}</legend>
          <div className=\"offset-grid\">
            {adjustablePrayers.map((prayer) => (
              <label key={prayer}>
                <span>{translate(locale, prayerTranslationKeys[prayer])}</span>
                <input
                  type=\"number\"
                  min=\"-180\"
                  max=\"180\"
                  step=\"1\"
                  value={settings.prayerAdjustments[prayer] ?? ''}
                  onChange={(event) => {
                    updatePrayerOffset(prayer, event.target.value);
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>
"""
offset_with_reset = """        <fieldset className=\"offsets-fieldset\">
          <legend>{translate(locale, 'prayerOffsets')}</legend>
          <div className=\"offset-grid\">
            {adjustablePrayers.map((prayer) => (
              <label key={prayer}>
                <span>{translate(locale, prayerTranslationKeys[prayer])}</span>
                <input
                  type=\"number\"
                  min=\"-180\"
                  max=\"180\"
                  step=\"1\"
                  value={settings.prayerAdjustments[prayer] ?? ''}
                  onChange={(event) => {
                    updatePrayerOffset(prayer, event.target.value);
                  }}
                />
              </label>
            ))}
          </div>
          <div className=\"offset-actions\">
            <button
              type=\"button\"
              disabled={!hasManualPrayerAdjustments(settings.prayerAdjustments)}
              onClick={resetPrayerOffsets}
            >
              {translate(locale, 'resetPrayerOffsets')}
            </button>
          </div>
        </fieldset>
"""
if "translate(locale, 'resetPrayerOffsets')" not in app:
    app = replace_once(app, offset_fieldset, offset_with_reset)

prayer_grid = """          <div className=\"prayer-grid\">
            {sourcedDashboard.prayers.map((prayer) => (
              <article
                className={`prayer-card${prayer.isNext ? ' prayer-card-next' : ''}${prayer.name === 'sunrise' ? ' prayer-card-supplementary' : ''}`}
                key={prayer.name}
              >
                <span>{translate(locale, prayerTranslationKeys[prayer.name])}</span>
                <div className=\"prayer-times\">
                  <span className=\"prayer-time-label\">{translate(locale, 'prayerStart')}</span>
                  <strong>
                    {prayer.localMinutes === null
                      ? '—'
                      : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)}
                  </strong>
                  {prayer.name !== 'sunrise' && prayer.iqamahLocalMinutes !== null && (
                    <>
                      <span className=\"prayer-time-label\">{translate(locale, 'iqamah')}</span>
                      <strong className=\"iqamah-time\">
                        {formatLocalTime(prayer.iqamahLocalMinutes, locale, settings.timeFormat)}
                      </strong>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
"""
prayer_grid_with_badges = """          <div className=\"prayer-grid\">
            {sourcedDashboard.prayers.map((prayer) => {
              const displayedAdjustment = displayedManualPrayerAdjustmentMinutes(
                prayer.name,
                prayer.manualAdjustmentMinutes,
                prayer.source,
              );
              return (
                <article
                  className={`prayer-card${prayer.isNext ? ' prayer-card-next' : ''}${prayer.name === 'sunrise' ? ' prayer-card-supplementary' : ''}`}
                  key={prayer.name}
                >
                  <div className=\"prayer-card-heading\">
                    <span>{translate(locale, prayerTranslationKeys[prayer.name])}</span>
                    {displayedAdjustment !== null && (
                      <span className=\"adjustment-badge\">
                        {translate(locale, 'manualOffset')} {displayedAdjustment > 0 ? '+' : ''}
                        {String(displayedAdjustment)} {translate(locale, 'minutesShort')}
                      </span>
                    )}
                  </div>
                  <div className=\"prayer-times\">
                    <span className=\"prayer-time-label\">{translate(locale, 'prayerStart')}</span>
                    <strong>
                      {prayer.localMinutes === null
                        ? '—'
                        : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)}
                    </strong>
                    {prayer.name !== 'sunrise' && prayer.iqamahLocalMinutes !== null && (
                      <>
                        <span className=\"prayer-time-label\">{translate(locale, 'iqamah')}</span>
                        <strong className=\"iqamah-time\">
                          {formatLocalTime(prayer.iqamahLocalMinutes, locale, settings.timeFormat)}
                        </strong>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
"""
if "className=\"adjustment-badge\"" not in app:
    app = replace_once(app, prayer_grid, prayer_grid_with_badges)

app_path.write_text(app)

translations_path = Path("src/i18n/translations.ts")
translations = translations_path.read_text()
if "resetPrayerOffsets:" not in translations:
    translations = replace_once(
        translations,
        "    prayerOffsets: 'Manual prayer offsets (minutes)',\n",
        "    prayerOffsets: 'Manual prayer offsets (minutes)',\n    resetPrayerOffsets: 'Reset prayer offsets to method defaults',\n    manualOffset: 'Manual offset',\n    minutesShort: 'min',\n",
    )
    translations = replace_once(
        translations,
        "    prayerOffsets: 'تعديلات الصلاة اليدوية (بالدقائق)',\n",
        "    prayerOffsets: 'تعديلات الصلاة اليدوية (بالدقائق)',\n    resetPrayerOffsets: 'إعادة تعديلات الصلاة إلى قيم طريقة الحساب',\n    manualOffset: 'تعديل يدوي',\n    minutesShort: 'د',\n",
    )
translations_path.write_text(translations)

styles_path = Path("src/styles.css")
styles = styles_path.read_text().rstrip()
addition = """

.offset-actions {
  display: flex;
  justify-content: flex-end;
  margin-block-start: 0.8rem;
}

.prayer-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.adjustment-badge {
  display: inline-flex;
  align-items: center;
  min-block-size: 1.75rem;
  padding-inline: 0.55rem;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
}
"""
if ".adjustment-badge {" not in styles:
    styles_path.write_text(styles + addition + "\n")

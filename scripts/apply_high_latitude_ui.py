from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing UI marker: {old[:120]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()

manual_import = """import {
  displayedManualPrayerAdjustmentMinutes,
  hasManualPrayerAdjustments,
  resetManualPrayerAdjustments,
} from './domain/prayerAdjustments';
"""
high_latitude_import = "import { displayedHighLatitudeRuleApplied } from './domain/highLatitudeIndicators';\n"
if high_latitude_import not in app:
    app = replace_once(app, manual_import, manual_import + high_latitude_import)

source_mapping = """const sourceTranslationKeys: Readonly<
  Record<PersistedSettings['prayerSourceMode'], TranslationKey>
> = {
  calculated: 'sourceCalculated',
  'calculated-adjustments': 'sourceCalculatedAdjustments',
  'local-mosque': 'sourceLocalMosque',
};
"""
high_latitude_mapping = source_mapping + """

const highLatitudeRuleTranslationKeys: Readonly<
  Record<PersistedSettings['highLatitudeRule'], TranslationKey>
> = {
  'angle-based': 'highLatitudeAngle',
  'middle-of-night': 'highLatitudeMiddle',
  'one-seventh': 'highLatitudeSeventh',
};
"""
if "const highLatitudeRuleTranslationKeys" not in app:
    app = replace_once(app, source_mapping, high_latitude_mapping)

map_marker = """              const displayedAdjustment = displayedManualPrayerAdjustmentMinutes(
                prayer.name,
                prayer.manualAdjustmentMinutes,
                prayer.source,
              );
              return (
"""
map_replacement = """              const displayedAdjustment = displayedManualPrayerAdjustmentMinutes(
                prayer.name,
                prayer.manualAdjustmentMinutes,
                prayer.source,
              );
              const displayedHighLatitude = displayedHighLatitudeRuleApplied(
                prayer.name,
                prayer.highLatitudeRuleApplied,
                prayer.source,
              );
              return (
"""
if "const displayedHighLatitude =" not in app:
    app = replace_once(app, map_marker, map_replacement)

heading_marker = """                  <div className=\"prayer-card-heading\">
                    <span>{translate(locale, prayerTranslationKeys[prayer.name])}</span>
                    {displayedAdjustment !== null && (
                      <span className=\"adjustment-badge\">
                        {translate(locale, 'manualOffset')} {displayedAdjustment > 0 ? '+' : ''}
                        {String(displayedAdjustment)} {translate(locale, 'minutesShort')}
                      </span>
                    )}
                  </div>
"""
heading_replacement = """                  <div className=\"prayer-card-heading\">
                    <span>{translate(locale, prayerTranslationKeys[prayer.name])}</span>
                    <div className=\"prayer-indicators\">
                      {displayedHighLatitude && (
                        <span className=\"adjustment-badge high-latitude-badge\">
                          {translate(locale, 'highLatitudeAdjustment')} ·{' '}
                          {translate(locale, highLatitudeRuleTranslationKeys[settings.highLatitudeRule])}
                        </span>
                      )}
                      {displayedAdjustment !== null && (
                        <span className=\"adjustment-badge\">
                          {translate(locale, 'manualOffset')} {displayedAdjustment > 0 ? '+' : ''}
                          {String(displayedAdjustment)} {translate(locale, 'minutesShort')}
                        </span>
                      )}
                    </div>
                  </div>
"""
if "className=\"prayer-indicators\"" not in app:
    app = replace_once(app, heading_marker, heading_replacement)

provenance_marker = """          {(dashboard.hasHighLatitudeFallback || dashboard.hasManualAdjustments) && (
            <div className=\"provenance-note\" role=\"status\">
              {dashboard.hasHighLatitudeFallback && (
                <span>{translate(locale, 'highLatitudeAdjustment')}</span>
              )}
              {dashboard.hasManualAdjustments && (
                <span>{translate(locale, 'manualAdjustment')}</span>
              )}
            </div>
          )}
"""
provenance_replacement = """          {(sourcedDashboard.prayers.some((prayer) =>
            displayedHighLatitudeRuleApplied(
              prayer.name,
              prayer.highLatitudeRuleApplied,
              prayer.source,
            ),
          ) || sourcedDashboard.prayers.some((prayer) =>
            displayedManualPrayerAdjustmentMinutes(
              prayer.name,
              prayer.manualAdjustmentMinutes,
              prayer.source,
            ) !== null,
          )) && (
            <div className=\"provenance-note\" role=\"status\">
              {sourcedDashboard.prayers.some((prayer) =>
                displayedHighLatitudeRuleApplied(
                  prayer.name,
                  prayer.highLatitudeRuleApplied,
                  prayer.source,
                ),
              ) && (
                <span>
                  {translate(locale, 'highLatitudeAdjustment')}: {' '}
                  {translate(locale, highLatitudeRuleTranslationKeys[settings.highLatitudeRule])}
                </span>
              )}
              {sourcedDashboard.prayers.some((prayer) =>
                displayedManualPrayerAdjustmentMinutes(
                  prayer.name,
                  prayer.manualAdjustmentMinutes,
                  prayer.source,
                ) !== null,
              ) && <span>{translate(locale, 'manualAdjustment')}</span>}
            </div>
          )}
"""
if "highLatitudeRuleTranslationKeys[settings.highLatitudeRule]" not in app.split("provenance-note")[-1]:
    app = replace_once(app, provenance_marker, provenance_replacement)

app_path.write_text(app)

styles_path = Path("src/styles.css")
styles = styles_path.read_text().rstrip()
addition = """

.prayer-indicators {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.high-latitude-badge {
  font-weight: 650;
}
"""
if ".prayer-indicators {" not in styles:
    styles_path.write_text(styles + addition + "\n")

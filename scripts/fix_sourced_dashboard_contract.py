from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing {label} marker")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
app = replace_once(
    app,
    """                {formatGregorianCivilDate(
                  sourcedDashboard.gregorian,
                  locale,
                  sourcedDashboard.timeZone,
                )}
""",
    """                {formatGregorianCivilDate(sourcedDashboard.base.civilDate, locale)}
""",
    "Gregorian display",
)
app = replace_once(
    app,
    """                {formatHijriCivilDate(sourcedDashboard.hijri, locale, sourcedDashboard.timeZone)}
""",
    """                {formatHijriCivilDate(
                  sourcedDashboard.base.civilDate,
                  locale,
                  settings.hijriCorrectionDays,
                )}
""",
    "Hijri display",
)
app = app.replace(
    "highLatitudeRuleTranslationKeys[sourcedDashboard.highLatitudeRule]",
    "highLatitudeRuleTranslationKeys[sourcedDashboard.base.highLatitudeRule]",
)
app = replace_once(
    app,
    "{manualPrayerAdjustmentMinutes !== 0 && (",
    "{manualPrayerAdjustmentMinutes !== null && (",
    "manual adjustment nullable guard",
)
app = replace_once(
    app,
    "{translate(locale, 'method')}: {sourcedDashboard.method.name}",
    "{translate(locale, 'method')}: {sourcedDashboard.base.method.name}",
    "method provenance",
)
app = replace_once(
    app,
    "{translate(locale, 'timezone')}: {sourcedDashboard.timeZone}",
    "{translate(locale, 'timezone')}: {sourcedDashboard.base.timeZone}",
    "timezone provenance",
)
app_path.write_text(app)

sourced_path = Path("src/domain/sourcedDashboard.ts")
sourced = sourced_path.read_text()
sourced = replace_once(
    sourced,
    """  readonly secondsUntilNextPrayer: number | null;
  readonly jumuahSessions: readonly JumuahSession[];
""",
    """  readonly secondsUntilNextPrayer: number | null;
  readonly hasHighLatitudeFallback: boolean;
  readonly jumuahSessions: readonly JumuahSession[];
""",
    "sourced aggregate interface",
)
sourced = replace_once(
    sourced,
    """  return {
    base: input.dashboard,
""",
    """  const hasHighLatitudeFallback = prayers.some(
    (row) =>
      row.highLatitudeRuleApplied &&
      !(input.sourceMode === 'local-mosque' && row.name !== 'sunrise'),
  );

  return {
    base: input.dashboard,
""",
    "sourced aggregate calculation",
)
sourced = replace_once(
    sourced,
    """    secondsUntilNextPrayer: next === null ? null : Math.max(0, Math.round(next.minutesUntil * 60)),
    jumuahSessions:
""",
    """    secondsUntilNextPrayer: next === null ? null : Math.max(0, Math.round(next.minutesUntil * 60)),
    hasHighLatitudeFallback,
    jumuahSessions:
""",
    "sourced aggregate return",
)
sourced_path.write_text(sourced)

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing source UI marker: {old[:80]}")
    return text.replace(old, new, 1)


path = Path("src/App.tsx")
text = path.read_text()
text = replace_once(
    text,
    "import { buildPrayerDashboard } from './domain/dashboard';\n",
    "import { buildPrayerDashboard } from './domain/dashboard';\nimport { applyPrayerSourceToDashboard } from './domain/sourcedDashboard';\n",
)
text = replace_once(
    text,
    "const adjustablePrayers: readonly PrayerName[] = [\n",
    "const sourceTranslationKeys: Readonly<\n  Record<PersistedSettings['prayerSourceMode'], TranslationKey>\n> = {\n  calculated: 'sourceCalculated',\n  'calculated-adjustments': 'sourceCalculatedAdjustments',\n  'local-mosque': 'sourceLocalMosque',\n};\n\nconst adjustablePrayers: readonly PrayerName[] = [\n",
)
text = replace_once(
    text,
    "  const direction = localeDirection(locale);\n  const resolvedTimeZone = dashboard?.timeZone;\n",
    "  const sourcedDashboard = useMemo(\n    () =>\n      dashboard === null\n        ? null\n        : applyPrayerSourceToDashboard({\n            dashboard,\n            sourceMode: settings.prayerSourceMode,\n            mosqueTimetable: settings.mosqueTimetable,\n          }),\n    [dashboard, settings.mosqueTimetable, settings.prayerSourceMode],\n  );\n  const direction = localeDirection(locale);\n  const resolvedTimeZone = dashboard?.timeZone;\n",
)
settings_marker = """        <div className=\"settings-grid\">\n          <label>\n            <span>{translate(locale, 'calculationMethod')}</span>\n"""
settings_replacement = """        <div className=\"settings-grid\">\n          <label>\n            <span>{translate(locale, 'sourceMode')}</span>\n            <select\n              value={settings.prayerSourceMode}\n              onChange={(event) => {\n                setSettings((current) => ({\n                  ...current,\n                  prayerSourceMode: event.target.value as PersistedSettings['prayerSourceMode'],\n                }));\n              }}\n            >\n              <option value=\"calculated\">{translate(locale, 'sourceCalculated')}</option>\n              <option value=\"calculated-adjustments\">\n                {translate(locale, 'sourceCalculatedAdjustments')}\n              </option>\n              <option value=\"local-mosque\" disabled={settings.mosqueTimetable === null}>\n                {translate(locale, 'sourceLocalMosque')}\n              </option>\n            </select>\n          </label>\n\n          <label>\n            <span>{translate(locale, 'calculationMethod')}</span>\n"""
text = replace_once(text, settings_marker, settings_replacement)
text = replace_once(
    text,
    """        </div>\n\n        <fieldset className=\"offsets-fieldset\">\n""",
    """        </div>\n\n        {settings.mosqueTimetable === null && (\n          <p className=\"inline-message\">{translate(locale, 'localMosqueUnavailable')}</p>\n        )}\n\n        <fieldset className=\"offsets-fieldset\">\n""",
)
text = replace_once(
    text,
    """          <p className=\"value\">\n            {dashboard === null\n              ? translate(locale, 'notConfigured')\n              : translate(locale, 'sourceCalculated')}\n          </p>\n        </div>\n        <div>\n          <p className=\"label\">{translate(locale, 'method')}</p>\n""",
    """          <p className=\"value\">\n            {dashboard === null\n              ? translate(locale, 'notConfigured')\n              : translate(locale, sourceTranslationKeys[settings.prayerSourceMode])}\n          </p>\n        </div>\n        <div>\n          <p className=\"label\">\n            {settings.prayerSourceMode === 'local-mosque'\n              ? translate(locale, 'selectedMosque')\n              : translate(locale, 'method')}\n          </p>\n          <p className=\"value\">\n            {settings.prayerSourceMode === 'local-mosque'\n              ? (sourcedDashboard?.mosqueName ?? translate(locale, 'notConfigured'))\n              : (dashboard?.method.name ?? translate(locale, 'notConfigured'))}\n          </p>\n        </div>\n        <div className=\"source-detail\">\n          <p className=\"label\">{translate(locale, 'method')}</p>\n""",
)
text = replace_once(
    text,
    """          <p className=\"value\">{dashboard?.method.name ?? translate(locale, 'notConfigured')}</p>\n        </div>\n      </section>\n\n      {dashboard === null ? (\n""",
    """          <p className=\"value\">{dashboard?.method.name ?? translate(locale, 'notConfigured')}</p>\n        </div>\n      </section>\n\n      {dashboard === null || sourcedDashboard === null ? (\n""",
)
text = text.replace("dashboard.nextPrayer", "sourcedDashboard.nextPrayer")
text = text.replace("dashboard.nextPrayerDayOffset", "sourcedDashboard.nextPrayerDayOffset")
text = text.replace("dashboard.secondsUntilNextPrayer", "sourcedDashboard.secondsUntilNextPrayer")
text = replace_once(
    text,
    """          <div className=\"prayer-grid\">\n            {dashboard.prayers.map((prayer) => (\n""",
    """          <div className=\"prayer-grid\">\n            {sourcedDashboard.prayers.map((prayer) => (\n""",
)
text = replace_once(
    text,
    """                <strong>\n                  {prayer.localMinutes === null\n                    ? '—'\n                    : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)}\n                </strong>\n              </article>\n""",
    """                <div className=\"prayer-times\">\n                  <span className=\"prayer-time-label\">{translate(locale, 'prayerStart')}</span>\n                  <strong>\n                    {prayer.localMinutes === null\n                      ? '—'\n                      : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)}\n                  </strong>\n                  {prayer.name !== 'sunrise' && prayer.iqamahLocalMinutes !== null && (\n                    <>\n                      <span className=\"prayer-time-label\">{translate(locale, 'iqamah')}</span>\n                      <strong className=\"iqamah-time\">\n                        {formatLocalTime(prayer.iqamahLocalMinutes, locale, settings.timeFormat)}\n                      </strong>\n                    </>\n                  )}\n                </div>\n              </article>\n""",
)
text = replace_once(
    text,
    """          </div>\n\n          {(dashboard.hasHighLatitudeFallback || dashboard.hasManualAdjustments) && (\n""",
    """          </div>\n\n          {sourcedDashboard.jumuahSessions.length > 0 && (\n            <section className=\"jumuah-panel\" aria-label={translate(locale, 'jumuah')}>\n              <h3>{translate(locale, 'jumuah')}</h3>\n              <div className=\"jumuah-grid\">\n                {sourcedDashboard.jumuahSessions.map((session) => (\n                  <article key={`${session.label}-${String(session.salahLocalMinutes)}`}>\n                    <strong>{session.label}</strong>\n                    <span>\n                      {translate(locale, 'khutbah')}: {formatLocalTime(session.khutbahLocalMinutes, locale, settings.timeFormat)}\n                    </span>\n                    <span>\n                      {translate(locale, 'salah')}: {formatLocalTime(session.salahLocalMinutes, locale, settings.timeFormat)}\n                    </span>\n                  </article>\n                ))}\n              </div>\n            </section>\n          )}\n\n          {(dashboard.hasHighLatitudeFallback || dashboard.hasManualAdjustments) && (\n""",
)
path.write_text(text)

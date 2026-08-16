from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing integration marker: {old[:140]}")
    return text.replace(old, new, 1)


app_path = Path('src/App.tsx')
app = app_path.read_text()
app = replace_once(
    app,
    "import { buildPrayerDashboard } from './domain/dashboard';\n",
    "import { buildPrayerDashboardResult } from './domain/dashboardResult';\n",
)
old_dashboard = """  const dashboard = useMemo(
    () =>
      coordinates === null || now === null
        ? null
        : buildPrayerDashboard({
            instant: now,
            coordinates,
            method: calculationMethods[settings.calculationMethodId],
            asrConvention: settings.asrConvention,
            highLatitudeRule: settings.highLatitudeRule,
            adjustments: settings.prayerAdjustments,
            hijriCorrectionDays: settings.hijriCorrectionDays,
          }),
    [coordinates, now, settings],
  );
"""
new_dashboard = """  const dashboardResult = useMemo(
    () =>
      coordinates === null || now === null
        ? null
        : buildPrayerDashboardResult({
            instant: now,
            coordinates,
            method: calculationMethods[settings.calculationMethodId],
            asrConvention: settings.asrConvention,
            highLatitudeRule: settings.highLatitudeRule,
            adjustments: settings.prayerAdjustments,
            hijriCorrectionDays: settings.hijriCorrectionDays,
          }),
    [coordinates, now, settings],
  );
  const dashboard = dashboardResult?.ok === true ? dashboardResult.dashboard : null;
  const calculationUnavailable = dashboardResult?.ok === false;
  const unavailablePrayers = dashboardResult?.ok === true ? dashboardResult.unavailablePrayers : [];
"""
app = replace_once(app, old_dashboard, new_dashboard)
app = replace_once(
    app,
    "      ) : sourcedDashboard === null ? (\n        <section className=\"status-card\">\n",
    "      ) : calculationUnavailable ? (\n"
    "        <section className=\"status-card\" role=\"alert\">\n"
    "          <div>\n"
    "            <p className=\"label\">{translate(locale, 'dailyPrayers')}</p>\n"
    "            <p className=\"value\">{translate(locale, 'calculationUnavailable')}</p>\n"
    "          </div>\n"
    "          <div>\n"
    "            <p className=\"value\">{translate(locale, 'calculationUnavailableHelp')}</p>\n"
    "          </div>\n"
    "        </section>\n"
    "      ) : sourcedDashboard === null ? (\n"
    "        <section className=\"status-card\">\n",
)
app = replace_once(
    app,
    "          </div>\n\n          {sourcedDashboard.jumuahSessions.length > 0 && (\n",
    "          </div>\n\n"
    "          {unavailablePrayers.length > 0 && (\n"
    "            <p className=\"inline-message\" role=\"status\">\n"
    "              {translate(locale, 'somePrayerTimesUnavailable')}\n"
    "            </p>\n"
    "          )}\n\n"
    "          {sourcedDashboard.jumuahSessions.length > 0 && (\n",
)
app_path.write_text(app)

translations_path = Path('src/i18n/translations.ts')
translations = translations_path.read_text()
translations = replace_once(
    translations,
    "    systemTimeInvalidHelp:\n      'Correct the device date and time. Prayer calculations will resume automatically when a valid system time is available.',\n",
    "    systemTimeInvalidHelp:\n"
    "      'Correct the device date and time. Prayer calculations will resume automatically when a valid system time is available.',\n"
    "    calculationUnavailable: 'Prayer times could not be calculated for the current settings.',\n"
    "    calculationUnavailableHelp:\n"
    "      'Verify the location and calculation settings, then try again. The app will keep running without showing guessed prayer times.',\n"
    "    somePrayerTimesUnavailable:\n"
    "      'One or more prayer times are astronomically unavailable for this date and location. Unavailable times are shown as —.',\n",
)
translations = replace_once(
    translations,
    "    systemTimeInvalidHelp:\n      'صحّح تاريخ ووقت الجهاز. ستُستأنف حسابات الصلاة تلقائياً عند توفر وقت نظام صالح.',\n",
    "    systemTimeInvalidHelp:\n"
    "      'صحّح تاريخ ووقت الجهاز. ستُستأنف حسابات الصلاة تلقائياً عند توفر وقت نظام صالح.',\n"
    "    calculationUnavailable: 'تعذّر حساب مواقيت الصلاة بالإعدادات الحالية.',\n"
    "    calculationUnavailableHelp:\n"
    "      'تحقّق من الموقع وإعدادات الحساب ثم أعد المحاولة. سيستمر التطبيق بالعمل من دون عرض مواقيت تخمينية.',\n"
    "    somePrayerTimesUnavailable:\n"
    "      'يتعذّر فلكياً حساب موعد صلاة واحد أو أكثر لهذا التاريخ والموقع. تظهر المواقيت غير المتاحة بالرمز —.',\n",
)
translations_path.write_text(translations)

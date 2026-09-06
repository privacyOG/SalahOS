from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one exact match, found {count}")
    target.write_text(text.replace(old, new, 1))


replace_once(
    "src/platform/settingsStorage.ts",
    "import type { AsrConvention, HighLatitudeRule, PrayerName } from '../domain/prayerEngine';\nimport { assertIanaTimeZone } from '../domain/timezone';",
    "import type { AsrConvention, HighLatitudeRule, PrayerName } from '../domain/prayerEngine';\nimport type { NightEndConvention } from '../domain/supplementaryTimes';\nimport { assertIanaTimeZone } from '../domain/timezone';",
)
replace_once(
    "src/platform/settingsStorage.ts",
    "  readonly highLatitudeRule: HighLatitudeRule;\n  readonly hijriCorrectionDays: number;",
    "  readonly highLatitudeRule: HighLatitudeRule;\n  readonly nightEndConvention?: NightEndConvention;\n  readonly ishraqMinutesAfterSunrise?: number | null;\n  readonly hijriCorrectionDays: number;",
)
replace_once(
    "src/platform/settingsStorage.ts",
    "  highLatitudeRule: 'angle-based',\n  hijriCorrectionDays: 0,",
    "  highLatitudeRule: 'angle-based',\n  nightEndConvention: 'fajr',\n  ishraqMinutesAfterSunrise: null,\n  hijriCorrectionDays: 0,",
)
replace_once(
    "src/platform/settingsStorage.ts",
    "function parseHighLatitudeRule(value: unknown): HighLatitudeRule {\n  if (value === 'middle-of-the-night' || value === 'one-seventh') return value;\n  return 'angle-based';\n}\nfunction parseHijriCorrection(value: unknown): number {",
    "function parseHighLatitudeRule(value: unknown): HighLatitudeRule {\n  if (value === 'middle-of-the-night' || value === 'one-seventh') return value;\n  return 'angle-based';\n}\nfunction parseNightEndConvention(value: unknown): NightEndConvention {\n  return value === 'sunrise' ? 'sunrise' : 'fajr';\n}\nfunction parseIshraqMinutesAfterSunrise(value: unknown): number | null {\n  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 240\n    ? Number(value)\n    : null;\n}\nfunction parseHijriCorrection(value: unknown): number {",
)
replace_once(
    "src/platform/settingsStorage.ts",
    "    highLatitudeRule: parseHighLatitudeRule(migrated.highLatitudeRule),\n    hijriCorrectionDays: parseHijriCorrection(migrated.hijriCorrectionDays),",
    "    highLatitudeRule: parseHighLatitudeRule(migrated.highLatitudeRule),\n    nightEndConvention: parseNightEndConvention(migrated.nightEndConvention),\n    ishraqMinutesAfterSunrise: parseIshraqMinutesAfterSunrise(\n      migrated.ishraqMinutesAfterSunrise,\n    ),\n    hijriCorrectionDays: parseHijriCorrection(migrated.hijriCorrectionDays),",
)

replace_once(
    "src/platform/settingsStorage.test.ts",
    "    highLatitudeRule: 'one-seventh',\n    hijriCorrectionDays: 1,",
    "    highLatitudeRule: 'one-seventh',\n    nightEndConvention: 'sunrise',\n    ishraqMinutesAfterSunrise: 20,\n    hijriCorrectionDays: 1,",
)
replace_once(
    "src/platform/settingsStorage.test.ts",
    "    expect(migrated.calculationMethodId).toBe('muslim-world-league');\n    expect(migrated.notifications).toEqual(defaultPersistedSettings.notifications);",
    "    expect(migrated.calculationMethodId).toBe('muslim-world-league');\n    expect(migrated.nightEndConvention).toBe('fajr');\n    expect(migrated.ishraqMinutesAfterSunrise).toBeNull();\n    expect(migrated.notifications).toEqual(defaultPersistedSettings.notifications);",
)
replace_once(
    "src/platform/settingsStorage.test.ts",
    "    expect(migrated.prayerAdjustments).toEqual({ fajr: 2 });\n    expect(migrated.location?.timeZone).toBe('Australia/Sydney');",
    "    expect(migrated.prayerAdjustments).toEqual({ fajr: 2 });\n    expect(migrated.nightEndConvention).toBe('fajr');\n    expect(migrated.ishraqMinutesAfterSunrise).toBeNull();\n    expect(migrated.location?.timeZone).toBe('Australia/Sydney');",
)
settings_test = Path("src/platform/settingsStorage.test.ts")
settings_test_text = settings_test.read_text()
unsupported_marker = "  it('rejects unsupported future schema versions', () => {"
settings_insertion = """  it('validates night-end convention and the optional Ishraq offset', () => {
    const configured = importPersistedSettings(
      JSON.stringify({
        version: 2,
        nightEndConvention: 'sunrise',
        ishraqMinutesAfterSunrise: 15,
      }),
    );
    expect(configured.nightEndConvention).toBe('sunrise');
    expect(configured.ishraqMinutesAfterSunrise).toBe(15);

    const invalid = importPersistedSettings(
      JSON.stringify({
        version: 2,
        nightEndConvention: 'invalid',
        ishraqMinutesAfterSunrise: 241,
      }),
    );
    expect(invalid.nightEndConvention).toBe('fajr');
    expect(invalid.ishraqMinutesAfterSunrise).toBeNull();
  });

"""
if settings_test_text.count(unsupported_marker) != 1:
    raise SystemExit("settingsStorage.test.ts: unsupported-version marker mismatch")
settings_test.write_text(
    settings_test_text.replace(unsupported_marker, settings_insertion + unsupported_marker, 1)
)

settings_path = Path("src/ui/SettingsScreen.tsx")
settings_text = settings_path.read_text()
base_marker = "const base = { palette: 'Colour palette' };\n"
settings_copy = """const base = { palette: 'Colour palette' };

const ishraqOffsetOptions = [10, 15, 20, 30, 45, 60] as const;
const nightPrayerSettingsCopy: Readonly<
  Record<
    Locale,
    Readonly<{
      nightEnd: string;
      nightEndFajr: string;
      nightEndSunrise: string;
      nightEndHelp: string;
      ishraqOffset: string;
      ishraqUnset: string;
      ishraqHelp: string;
      minutesAfterSunrise: string;
    }>
  >
> = {
  en: {
    nightEnd: 'Night-end convention',
    nightEndFajr: 'Fajr',
    nightEndSunrise: 'Sunrise',
    nightEndHelp: 'Used for Islamic midnight and the final third of the night.',
    ishraqOffset: 'Ishraq / Duha after sunrise',
    ishraqUnset: 'Not set — hide Ishraq',
    ishraqHelp: 'Choose an explicit safety interval after sunrise. No hidden default is applied.',
    minutesAfterSunrise: 'min after sunrise',
  },
  ar: {
    nightEnd: 'نهاية الليل',
    nightEndFajr: 'الفجر',
    nightEndSunrise: 'الشروق',
    nightEndHelp: 'يُستخدم لحساب منتصف الليل الشرعي وبداية الثلث الأخير.',
    ishraqOffset: 'الإشراق / الضحى بعد الشروق',
    ishraqUnset: 'غير محدد — إخفاء الإشراق',
    ishraqHelp: 'اختر مدة أمان صريحة بعد الشروق. لا توجد قيمة افتراضية مخفية.',
    minutesAfterSunrise: 'دقيقة بعد الشروق',
  },
  tr: {
    nightEnd: 'Gece sonu ölçütü',
    nightEndFajr: 'Sabah namazı',
    nightEndSunrise: 'Güneş doğuşu',
    nightEndHelp: 'İslami gece yarısı ve son üçte bir hesabında kullanılır.',
    ishraqOffset: 'İşrak / Duha güneş doğuşundan sonra',
    ishraqUnset: 'Ayarlanmadı — İşrak gizlensin',
    ishraqHelp: 'Güneş doğuşundan sonra açık bir güvenlik aralığı seçin. Gizli varsayılan yoktur.',
    minutesAfterSunrise: 'dk güneş doğuşundan sonra',
  },
  id: {
    nightEnd: 'Batas akhir malam',
    nightEndFajr: 'Subuh',
    nightEndSunrise: 'Matahari terbit',
    nightEndHelp: 'Dipakai untuk menghitung tengah malam Islami dan awal sepertiga malam terakhir.',
    ishraqOffset: 'Isyraq / Duha setelah matahari terbit',
    ishraqUnset: 'Belum diatur — sembunyikan Isyraq',
    ishraqHelp: 'Pilih jeda aman yang eksplisit setelah matahari terbit. Tidak ada default tersembunyi.',
    minutesAfterSunrise: 'mnt setelah matahari terbit',
  },
};
"""
if settings_text.count(base_marker) != 1:
    raise SystemExit("SettingsScreen.tsx: base marker mismatch")
settings_text = settings_text.replace(base_marker, settings_copy, 1)
function_start = settings_text.index("function PrayerSettingsForm(")
locale_marker = "  const locale = settings.locale;\n  return ("
locale_index = settings_text.index(locale_marker, function_start)
settings_text = (
    settings_text[:locale_index]
    + "  const locale = settings.locale;\n  const nightCopy = nightPrayerSettingsCopy[locale];\n  const number = new Intl.NumberFormat(locale);\n  return ("
    + settings_text[locale_index + len(locale_marker) :]
)
hijri_marker = """      <label>
        <span>{translate(locale, 'hijriCorrection')}</span>"""
controls = """      <label>
        <span>{nightCopy.nightEnd}</span>
        <select
          value={settings.nightEndConvention ?? 'fajr'}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              nightEndConvention: event.target.value === 'sunrise' ? 'sunrise' : 'fajr',
            }));
          }}
        >
          <option value="fajr">{nightCopy.nightEndFajr}</option>
          <option value="sunrise">{nightCopy.nightEndSunrise}</option>
        </select>
        <small>{nightCopy.nightEndHelp}</small>
      </label>
      <label>
        <span>{nightCopy.ishraqOffset}</span>
        <select
          value={settings.ishraqMinutesAfterSunrise ?? ''}
          onChange={(event) => {
            updateSettings((current) => ({
              ...current,
              ishraqMinutesAfterSunrise:
                event.target.value === '' ? null : Number(event.target.value),
            }));
          }}
        >
          <option value="">{nightCopy.ishraqUnset}</option>
          {ishraqOffsetOptions.map((minutes) => (
            <option key={minutes} value={minutes}>
              {number.format(minutes)} {nightCopy.minutesAfterSunrise}
            </option>
          ))}
        </select>
        <small>{nightCopy.ishraqHelp}</small>
      </label>
"""
if settings_text.count(hijri_marker) != 1:
    raise SystemExit("SettingsScreen.tsx: Hijri marker mismatch")
settings_path.write_text(settings_text.replace(hijri_marker, controls + hijri_marker, 1))

today_path = Path("src/ui/TodayScreen.tsx")
today_text = today_path.read_text()
for old, new in [
    (
        "import '../today-prayer-provenance.css';\n",
        "import '../today-prayer-provenance.css';\nimport '../today-night.css';\n",
    ),
    (
        "import { calculationMethods } from '../domain/methods';\n",
        "import { calculationMethods } from '../domain/methods';\nimport { buildNightPrayerPresentation } from '../domain/nightPrayerPresentation';\n",
    ),
    (
        "import { TodayJumuahSection } from './TodayJumuahSection';\n",
        "import { TodayJumuahSection } from './TodayJumuahSection';\nimport { TodayNightSection } from './TodayNightSection';\n",
    ),
]:
    if today_text.count(old) != 1:
        raise SystemExit(f"TodayScreen.tsx: import marker mismatch for {old!r}")
    today_text = today_text.replace(old, new, 1)

unavailable_marker = (
    "  const unavailablePrayers = dashboardResult?.ok === true ? dashboardResult.unavailablePrayers : [];\n"
)
night_logic = """  const unavailablePrayers = dashboardResult?.ok === true ? dashboardResult.unavailablePrayers : [];
  const needsPreviousNightSchedule =
    dashboard !== null &&
    dashboard.today.prayers.fajr.roundedLocalMinutes !== null &&
    dashboard.clock.localMinutes < dashboard.today.prayers.fajr.roundedLocalMinutes;
  const previousNightScheduleResult = useMemo(() => {
    if (
      !needsPreviousNightSchedule ||
      coordinates === null ||
      resolvedPrayerTimeZone === null ||
      scheduleCivilDate === null
    ) {
      return null;
    }
    const previousCivilDate = new Date(scheduleCivilDate.getTime() - 86_400_000);
    return buildPrayerDashboardScheduleResult({
      civilDate: previousCivilDate,
      coordinates,
      timeZone: resolvedPrayerTimeZone,
      method: calculationMethods[settings.calculationMethodId],
      asrConvention: settings.asrConvention,
      highLatitudeRule: settings.highLatitudeRule,
      adjustments: settings.prayerAdjustments,
      hijriCorrectionDays: settings.hijriCorrectionDays,
    });
  }, [
    coordinates,
    needsPreviousNightSchedule,
    resolvedPrayerTimeZone,
    scheduleCivilDate,
    settings.asrConvention,
    settings.calculationMethodId,
    settings.highLatitudeRule,
    settings.hijriCorrectionDays,
    settings.prayerAdjustments,
  ]);
  const nightPresentation = useMemo(() => {
    if (dashboard === null || scheduleResult?.ok !== true) return null;
    const previousSchedule = needsPreviousNightSchedule
      ? previousNightScheduleResult?.ok === true
        ? previousNightScheduleResult.schedule.today
        : null
      : scheduleResult.schedule.today;
    if (previousSchedule === null) return null;
    try {
      return buildNightPrayerPresentation({
        previous: previousSchedule,
        today: scheduleResult.schedule.today,
        tomorrow: scheduleResult.schedule.tomorrow,
        localMinutes: dashboard.clock.localMinutes,
        nightEndConvention: settings.nightEndConvention ?? 'fajr',
        ishraqMinutesAfterSunrise: settings.ishraqMinutesAfterSunrise ?? null,
      });
    } catch {
      return null;
    }
  }, [
    dashboard,
    needsPreviousNightSchedule,
    previousNightScheduleResult,
    scheduleResult,
    settings.ishraqMinutesAfterSunrise,
    settings.nightEndConvention,
  ]);
"""
if today_text.count(unavailable_marker) != 1:
    raise SystemExit("TodayScreen.tsx: unavailable marker mismatch")
today_text = today_text.replace(unavailable_marker, night_logic, 1)

promoted_marker = """          {promoteFridayJumuah && (
            <TodayJumuahSection
              sessions={todayJumuahSessions}
              locale={locale}
              timeFormat={settings.timeFormat}
              promoted
            />
          )}

          <div className="today-prayer-provenance">"""
promoted_replacement = """          {promoteFridayJumuah && (
            <TodayJumuahSection
              sessions={todayJumuahSessions}
              locale={locale}
              timeFormat={settings.timeFormat}
              promoted
            />
          )}

          {nightPresentation?.prominent === true && (
            <TodayNightSection
              model={nightPresentation}
              locale={locale}
              timeFormat={settings.timeFormat}
              promoted
            />
          )}

          <div className="today-prayer-provenance">"""
if today_text.count(promoted_marker) != 1:
    raise SystemExit("TodayScreen.tsx: promoted insertion marker mismatch")
today_text = today_text.replace(promoted_marker, promoted_replacement, 1)
secondary_marker = """            <div className="today-secondary-context__content">
              {modules['sunrise-sunset'] && ("""
secondary_replacement = """            <div className="today-secondary-context__content">
              {nightPresentation !== null && !nightPresentation.prominent && (
                <TodayNightSection
                  model={nightPresentation}
                  locale={locale}
                  timeFormat={settings.timeFormat}
                />
              )}

              {modules['sunrise-sunset'] && ("""
if today_text.count(secondary_marker) != 1:
    raise SystemExit("TodayScreen.tsx: secondary insertion marker mismatch")
today_path.write_text(today_text.replace(secondary_marker, secondary_replacement, 1))

from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing {label} marker")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
app = replace_once(
    app,
    "import { buildPrayerDashboard } from './domain/dashboard';\n",
    "import { buildPrayerDashboard } from './domain/dashboard';\nimport {\n  buildManualMosqueDay,\n  MANUAL_MOSQUE_PRAYERS,\n  upsertManualMosqueDay,\n} from './domain/manualMosqueEntry';\nimport type { ManualMosquePrayerDrafts } from './domain/manualMosqueEntry';\n",
    "manual mosque import",
)
app = replace_once(
    app,
    "function initialSettings(): PersistedSettings {\n",
    "function emptyManualMosqueDrafts(): ManualMosquePrayerDrafts {\n  return {\n    fajr: { start: '', iqamah: '' },\n    dhuhr: { start: '', iqamah: '' },\n    asr: { start: '', iqamah: '' },\n    maghrib: { start: '', iqamah: '' },\n    isha: { start: '', iqamah: '' },\n  };\n}\n\nfunction initialSettings(): PersistedSettings {\n",
    "manual mosque draft factory",
)
app = replace_once(
    app,
    "  const [mosqueImportPayload, setMosqueImportPayload] = useState('');\n  const [mosqueMessage, setMosqueMessage] = useState<TranslationKey | null>(null);\n",
    "  const [mosqueImportPayload, setMosqueImportPayload] = useState('');\n  const [manualMosqueName, setManualMosqueName] = useState(\n    settings.mosqueTimetable?.mosqueName ?? '',\n  );\n  const [manualMosqueDate, setManualMosqueDate] = useState('');\n  const [manualMosqueDrafts, setManualMosqueDrafts] = useState<ManualMosquePrayerDrafts>(\n    emptyManualMosqueDrafts,\n  );\n  const [mosqueMessage, setMosqueMessage] = useState<TranslationKey | null>(null);\n",
    "manual mosque state",
)
app = replace_once(
    app,
    "  function importMosqueTimetable(): void {\n",
    "  function updateManualMosqueDraft(\n    prayer: (typeof MANUAL_MOSQUE_PRAYERS)[number],\n    field: 'start' | 'iqamah',\n    value: string,\n  ): void {\n    setManualMosqueDrafts((current) => ({\n      ...current,\n      [prayer]: { ...current[prayer], [field]: value },\n    }));\n    setMosqueMessage(null);\n  }\n\n  function saveManualMosqueDay(): void {\n    try {\n      const name = manualMosqueName.trim();\n      const id = mosqueLibraryId(name);\n      const libraryTimetable = mosqueLibrary.find((entry) => entry.id === id)?.timetable ?? null;\n      const selectedTimetable =\n        settings.mosqueTimetable !== null &&\n        mosqueLibraryId(settings.mosqueTimetable.mosqueName) === id\n          ? settings.mosqueTimetable\n          : null;\n      const day = buildManualMosqueDay(manualMosqueDate, manualMosqueDrafts);\n      const timetable = upsertManualMosqueDay(\n        libraryTimetable ?? selectedTimetable,\n        name,\n        day,\n      );\n      setMosqueLibrary((current) => upsertMosqueTimetable(current, timetable));\n      setSettings((current) => ({\n        ...current,\n        mosqueTimetable: timetable,\n        prayerSourceMode: 'local-mosque',\n      }));\n      setManualMosqueName(timetable.mosqueName);\n      setManualMosqueDate('');\n      setManualMosqueDrafts(emptyManualMosqueDrafts());\n      setMosqueMessage('manualMosqueDaySaved');\n    } catch {\n      setMosqueMessage('manualMosqueDayError');\n    }\n  }\n\n  function importMosqueTimetable(): void {\n",
    "manual mosque save function",
)
app = replace_once(
    app,
    "    setSettings((current) => ({\n      ...current,\n      mosqueTimetable: selected.timetable,\n      prayerSourceMode: 'local-mosque',\n    }));\n    setMosqueMessage(null);\n",
    "    setSettings((current) => ({\n      ...current,\n      mosqueTimetable: selected.timetable,\n      prayerSourceMode: 'local-mosque',\n    }));\n    setManualMosqueName(selected.timetable.mosqueName);\n    setMosqueMessage(null);\n",
    "selected mosque manual name",
)
ui_anchor = """          <div className=\"mosque-import-grid\">\n"""
ui_block = """          <fieldset className=\"manual-mosque-fieldset\">\n            <legend>{translate(locale, 'manualMosqueEntry')}</legend>\n            <p className=\"setting-help\">{translate(locale, 'manualMosqueEntryHelp')}</p>\n            <div className=\"manual-mosque-header\">\n              <label>\n                <span>{translate(locale, 'mosqueName')}</span>\n                <input\n                  value={manualMosqueName}\n                  maxLength={160}\n                  onChange={(event) => {\n                    setManualMosqueName(event.target.value);\n                    setMosqueMessage(null);\n                  }}\n                />\n              </label>\n              <label>\n                <span>{translate(locale, 'timetableDate')}</span>\n                <input\n                  type=\"date\"\n                  value={manualMosqueDate}\n                  onChange={(event) => {\n                    setManualMosqueDate(event.target.value);\n                    setMosqueMessage(null);\n                  }}\n                />\n              </label>\n            </div>\n            <div className=\"manual-mosque-prayer-grid\">\n              {MANUAL_MOSQUE_PRAYERS.map((prayer) => (\n                <article className=\"manual-mosque-prayer\" key={prayer}>\n                  <h4>{translate(locale, prayerTranslationKeys[prayer])}</h4>\n                  <label>\n                    <span>{translate(locale, 'prayerStartTime')}</span>\n                    <input\n                      type=\"time\"\n                      step=\"60\"\n                      required\n                      value={manualMosqueDrafts[prayer].start}\n                      onChange={(event) => {\n                        updateManualMosqueDraft(prayer, 'start', event.target.value);\n                      }}\n                    />\n                  </label>\n                  <label>\n                    <span>{translate(locale, 'iqamahTimeOptional')}</span>\n                    <input\n                      type=\"time\"\n                      step=\"60\"\n                      value={manualMosqueDrafts[prayer].iqamah}\n                      onChange={(event) => {\n                        updateManualMosqueDraft(prayer, 'iqamah', event.target.value);\n                      }}\n                    />\n                  </label>\n                </article>\n              ))}\n            </div>\n            <button type=\"button\" onClick={saveManualMosqueDay}>\n              {translate(locale, 'saveManualMosqueDay')}\n            </button>\n          </fieldset>\n\n          <div className=\"mosque-import-grid\">\n"""
app = replace_once(app, ui_anchor, ui_block, "manual mosque UI")
app_path.write_text(app)

translations_path = Path("src/i18n/translations.ts")
translations = translations_path.read_text()
translations = replace_once(
    translations,
    "    mosqueTimetableRemoved: 'Mosque timetable removed.',\n",
    "    mosqueTimetableRemoved: 'Mosque timetable removed.',\n    manualMosqueEntry: 'Manual timetable day',\n    manualMosqueEntryHelp:\n      'Enter all five prayer start times for one Gregorian date. Iqamah times are optional. Saving replaces that date if it already exists for the mosque.',\n    timetableDate: 'Gregorian date',\n    prayerStartTime: 'Start time',\n    iqamahTimeOptional: 'Iqamah (optional)',\n    saveManualMosqueDay: 'Save timetable day',\n    manualMosqueDaySaved: 'Manual timetable day saved locally and selected.',\n    manualMosqueDayError:\n      'Enter a mosque name, valid date, and all five prayer start times in 24-hour format.',\n",
    "English manual mosque translations",
)
translations = replace_once(
    translations,
    "    localMosqueUnavailable: 'Import a mosque timetable before selecting local mosque mode.',\n",
    "    localMosqueUnavailable:\n      'Add a manual timetable day or import a mosque timetable before selecting local mosque mode.',\n",
    "English local mosque unavailable",
)
translations = replace_once(
    translations,
    "    mosqueTimetableRemoved: 'تم حذف جدول المسجد.',\n",
    "    mosqueTimetableRemoved: 'تم حذف جدول المسجد.',\n    manualMosqueEntry: 'إدخال يوم من جدول المسجد يدوياً',\n    manualMosqueEntryHelp:\n      'أدخل أوقات بداية الصلوات الخمس لتاريخ ميلادي واحد. أوقات الإقامة اختيارية. عند الحفظ يُستبدل اليوم نفسه إذا كان موجوداً في جدول المسجد.',\n    timetableDate: 'التاريخ الميلادي',\n    prayerStartTime: 'وقت البداية',\n    iqamahTimeOptional: 'الإقامة (اختياري)',\n    saveManualMosqueDay: 'احفظ يوم الجدول',\n    manualMosqueDaySaved: 'تم حفظ يوم الجدول محلياً واختياره.',\n    manualMosqueDayError:\n      'أدخل اسم المسجد وتاريخاً صحيحاً وأوقات بداية الصلوات الخمس بصيغة 24 ساعة.',\n",
    "Arabic manual mosque translations",
)
translations = replace_once(
    translations,
    "    localMosqueUnavailable: 'استورد جدول مسجد قبل اختيار وضع المسجد المحلي.',\n",
    "    localMosqueUnavailable:\n      'أضف يوماً يدوياً أو استورد جدول مسجد قبل اختيار وضع المسجد المحلي.',\n",
    "Arabic local mosque unavailable",
)
translations_path.write_text(translations)

styles_path = Path("src/styles.css")
styles = styles_path.read_text()
styles = replace_once(
    styles,
    ".offsets-fieldset {\n",
    ".manual-mosque-fieldset {\n  margin-block: 1.25rem;\n  padding: 1rem;\n  border: 1px solid var(--card-border);\n  border-radius: 0.9rem;\n}\n\n.manual-mosque-fieldset legend {\n  padding-inline: 0.4rem;\n  font-weight: 700;\n}\n\n.manual-mosque-header,\n.manual-mosque-prayer-grid {\n  display: grid;\n  gap: 0.75rem;\n}\n\n.manual-mosque-header {\n  grid-template-columns: 2fr 1fr;\n  margin-block: 0.8rem;\n}\n\n.manual-mosque-prayer-grid {\n  grid-template-columns: repeat(5, minmax(0, 1fr));\n  margin-block-end: 0.9rem;\n}\n\n.manual-mosque-header label,\n.manual-mosque-prayer label {\n  display: grid;\n  gap: 0.35rem;\n  color: var(--muted);\n  font-size: 0.85rem;\n}\n\n.manual-mosque-prayer {\n  display: grid;\n  gap: 0.6rem;\n  padding: 0.75rem;\n  border: 1px solid var(--card-border);\n  border-radius: 0.75rem;\n}\n\n.manual-mosque-prayer h4 {\n  margin: 0;\n}\n\n.offsets-fieldset {\n",
    "manual mosque styles",
)
styles = replace_once(
    styles,
    "  .prayer-grid,\n  .settings-grid,\n  .offset-grid {\n",
    "  .prayer-grid,\n  .settings-grid,\n  .offset-grid,\n  .manual-mosque-prayer-grid {\n",
    "tablet manual mosque grid",
)
styles = replace_once(
    styles,
    "  .prayer-grid,\n  .settings-grid,\n  .offset-grid {\n    grid-template-columns: 1fr;\n",
    "  .prayer-grid,\n  .settings-grid,\n  .offset-grid,\n  .manual-mosque-prayer-grid,\n  .manual-mosque-header {\n    grid-template-columns: 1fr;\n",
    "mobile manual mosque grid",
)
styles_path.write_text(styles)

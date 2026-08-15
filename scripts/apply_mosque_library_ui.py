from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing mosque-library UI marker: {old[:100]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
app = replace_once(
    app,
    "import { applyPrayerSourceToDashboard } from './domain/sourcedDashboard';\n",
    "import { applyPrayerSourceToDashboard } from './domain/sourcedDashboard';\nimport { parseMosqueTimetableCsv, parseMosqueTimetableJson } from './domain/timetableImport';\n",
)
app = replace_once(
    app,
    "import type { BrowserLocationFailureReason } from './platform/browserGeolocation';\n",
    "import type { BrowserLocationFailureReason } from './platform/browserGeolocation';\nimport {\n  loadMosqueLibrary,\n  mosqueLibraryId,\n  removeMosqueTimetable,\n  saveMosqueLibrary,\n  upsertMosqueTimetable,\n} from './platform/mosqueLibrary';\nimport type { MosqueLibraryEntry } from './platform/mosqueLibrary';\n",
)
app = replace_once(
    app,
    "  const [locationMessage, setLocationMessage] = useState<TranslationKey | null>(null);\n",
    "  const [locationMessage, setLocationMessage] = useState<TranslationKey | null>(null);\n  const [mosqueLibrary, setMosqueLibrary] = useState<readonly MosqueLibraryEntry[]>(() => {\n    try {\n      return loadMosqueLibrary(window.localStorage);\n    } catch {\n      return [];\n    }\n  });\n  const [mosqueImportFormat, setMosqueImportFormat] = useState<'json' | 'csv'>('json');\n  const [mosqueImportName, setMosqueImportName] = useState('');\n  const [mosqueImportPayload, setMosqueImportPayload] = useState('');\n  const [mosqueMessage, setMosqueMessage] = useState<TranslationKey | null>(null);\n",
)
app = replace_once(
    app,
    "  async function refreshLocation(): Promise<void> {\n",
    "  useEffect(() => {\n    try {\n      saveMosqueLibrary(window.localStorage, mosqueLibrary);\n    } catch {\n      // The validated mosque library remains usable in memory when storage is unavailable.\n    }\n  }, [mosqueLibrary]);\n\n  async function refreshLocation(): Promise<void> {\n",
)
handler_anchor = "  function updatePrayerOffset(prayer: PrayerName, rawValue: string): void {\n"
handler_block = """  function importMosqueTimetable(): void {\n    try {\n      const timetable =\n        mosqueImportFormat === 'json'\n          ? parseMosqueTimetableJson(mosqueImportPayload)\n          : parseMosqueTimetableCsv(mosqueImportPayload, mosqueImportName.trim());\n      setMosqueLibrary((current) => upsertMosqueTimetable(current, timetable));\n      setSettings((current) => ({\n        ...current,\n        mosqueTimetable: timetable,\n        prayerSourceMode: 'local-mosque',\n      }));\n      setMosqueImportName('');\n      setMosqueImportPayload('');\n      setMosqueMessage('mosqueTimetableImported');\n    } catch {\n      setMosqueMessage('mosqueTimetableImportError');\n    }\n  }\n\n  function selectMosqueTimetable(id: string): void {\n    const selected = mosqueLibrary.find((entry) => entry.id === id);\n    if (selected === undefined) return;\n    setSettings((current) => ({\n      ...current,\n      mosqueTimetable: selected.timetable,\n      prayerSourceMode: 'local-mosque',\n    }));\n    setMosqueMessage(null);\n  }\n\n  function removeSelectedMosqueTimetable(): void {\n    if (settings.mosqueTimetable === null) return;\n    const id = mosqueLibraryId(settings.mosqueTimetable.mosqueName);\n    setMosqueLibrary((current) => removeMosqueTimetable(current, id));\n    setSettings((current) => ({\n      ...current,\n      mosqueTimetable: null,\n      prayerSourceMode: current.prayerSourceMode === 'local-mosque' ? 'calculated' : current.prayerSourceMode,\n    }));\n    setMosqueMessage('mosqueTimetableRemoved');\n  }\n\n  function updatePrayerOffset(prayer: PrayerName, rawValue: string): void {\n"""
app = replace_once(app, handler_anchor, handler_block)
settings_anchor = """        {settings.mosqueTimetable === null && (\n          <p className=\"inline-message\">{translate(locale, 'localMosqueUnavailable')}</p>\n        )}\n\n        <fieldset className=\"offsets-fieldset\">\n"""
settings_block = """        <section className=\"mosque-library-controls\" aria-label={translate(locale, 'mosqueLibrary')}>\n          <div className=\"mosque-library-row\">\n            <label>\n              <span>{translate(locale, 'mosqueLibrary')}</span>\n              <select\n                value={\n                  settings.mosqueTimetable === null\n                    ? ''\n                    : mosqueLibraryId(settings.mosqueTimetable.mosqueName)\n                }\n                onChange={(event) => {\n                  selectMosqueTimetable(event.target.value);\n                }}\n              >\n                <option value=\"\">{translate(locale, 'selectMosque')}</option>\n                {mosqueLibrary.map((entry) => (\n                  <option key={entry.id} value={entry.id}>\n                    {entry.timetable.mosqueName}\n                  </option>\n                ))}\n              </select>\n            </label>\n            <button\n              type=\"button\"\n              disabled={settings.mosqueTimetable === null}\n              onClick={removeSelectedMosqueTimetable}\n            >\n              {translate(locale, 'removeMosque')}\n            </button>\n          </div>\n\n          <div className=\"mosque-import-grid\">\n            <label>\n              <span>{translate(locale, 'timetableFormat')}</span>\n              <select\n                value={mosqueImportFormat}\n                onChange={(event) => {\n                  setMosqueImportFormat(event.target.value as 'json' | 'csv');\n                  setMosqueMessage(null);\n                }}\n              >\n                <option value=\"json\">JSON</option>\n                <option value=\"csv\">CSV</option>\n              </select>\n            </label>\n            {mosqueImportFormat === 'csv' && (\n              <label>\n                <span>{translate(locale, 'mosqueName')}</span>\n                <input\n                  value={mosqueImportName}\n                  maxLength={160}\n                  onChange={(event) => {\n                    setMosqueImportName(event.target.value);\n                    setMosqueMessage(null);\n                  }}\n                />\n              </label>\n            )}\n          </div>\n          <label className=\"mosque-import-payload\">\n            <span>{translate(locale, 'timetableData')}</span>\n            <textarea\n              rows={7}\n              value={mosqueImportPayload}\n              onChange={(event) => {\n                setMosqueImportPayload(event.target.value);\n                setMosqueMessage(null);\n              }}\n            />\n          </label>\n          <button type=\"button\" onClick={importMosqueTimetable}>\n            {translate(locale, 'importMosqueTimetable')}\n          </button>\n          {mosqueMessage !== null && (\n            <p className=\"inline-message\" role=\"status\">\n              {translate(locale, mosqueMessage)}\n            </p>\n          )}\n        </section>\n\n        {settings.mosqueTimetable === null && (\n          <p className=\"inline-message\">{translate(locale, 'localMosqueUnavailable')}</p>\n        )}\n\n        <fieldset className=\"offsets-fieldset\">\n"""
app = replace_once(app, settings_anchor, settings_block)
app_path.write_text(app)

translations_path = Path("src/i18n/translations.ts")
translations = translations_path.read_text()
translations = replace_once(
    translations,
    "    selectedMosque: 'Selected mosque',\n",
    "    selectedMosque: 'Selected mosque',\n    mosqueLibrary: 'Mosque timetables',\n    selectMosque: 'Select a mosque',\n    removeMosque: 'Remove mosque',\n    timetableFormat: 'Timetable format',\n    mosqueName: 'Mosque name',\n    timetableData: 'Timetable data',\n    importMosqueTimetable: 'Import mosque timetable',\n    mosqueTimetableImported: 'Mosque timetable imported and selected.',\n    mosqueTimetableImportError: 'Timetable data is invalid. Check the documented CSV/JSON format.',\n    mosqueTimetableRemoved: 'Mosque timetable removed.',\n",
)
translations = replace_once(
    translations,
    "    selectedMosque: 'المسجد المختار',\n",
    "    selectedMosque: 'المسجد المختار',\n    mosqueLibrary: 'جداول المساجد',\n    selectMosque: 'اختر مسجداً',\n    removeMosque: 'احذف المسجد',\n    timetableFormat: 'تنسيق الجدول',\n    mosqueName: 'اسم المسجد',\n    timetableData: 'بيانات الجدول',\n    importMosqueTimetable: 'استورد جدول المسجد',\n    mosqueTimetableImported: 'تم استيراد جدول المسجد واختياره.',\n    mosqueTimetableImportError: 'بيانات الجدول غير صالحة. تحقق من تنسيق CSV أو JSON الموثق.',\n    mosqueTimetableRemoved: 'تم حذف جدول المسجد.',\n",
)
translations_path.write_text(translations)

styles_path = Path("src/styles.css")
styles = styles_path.read_text().rstrip()
addition = """

.mosque-library-controls {
  display: grid;
  gap: 0.85rem;
  margin-block: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.9rem;
  background: rgba(255, 255, 255, 0.025);
}

.mosque-library-row,
.mosque-import-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.75rem;
}

.mosque-import-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mosque-library-controls label {
  display: grid;
  gap: 0.35rem;
  color: #c2cdc0;
  font-size: 0.85rem;
}

.mosque-import-payload textarea {
  width: 100%;
  resize: vertical;
}

@media (max-width: 760px) {
  .mosque-library-row,
  .mosque-import-grid {
    grid-template-columns: 1fr;
  }
}
"""
if ".mosque-library-controls {" not in styles:
    styles_path.write_text(styles + addition + "\n")

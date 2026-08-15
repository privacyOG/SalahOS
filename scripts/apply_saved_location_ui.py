from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing saved-location UI marker: {old[:100]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
app = replace_once(
    app,
    "import type { BrowserLocationFailureReason } from './platform/browserGeolocation';\n",
    "import type { BrowserLocationFailureReason } from './platform/browserGeolocation';\nimport {\n  loadSavedLocations,\n  removeSavedLocation,\n  saveSavedLocations,\n  savedLocationId,\n  upsertSavedLocation,\n} from './platform/savedLocations';\nimport type { SavedLocation } from './platform/savedLocations';\n",
)
app = replace_once(
    app,
    "  const [settingsMessage, setSettingsMessage] = useState<TranslationKey | null>(null);\n",
    "  const [settingsMessage, setSettingsMessage] = useState<TranslationKey | null>(null);\n  const [savedLocations, setSavedLocations] = useState<readonly SavedLocation[]>(() => {\n    try {\n      return loadSavedLocations(window.localStorage);\n    } catch {\n      return [];\n    }\n  });\n  const [savedLocationLabel, setSavedLocationLabel] = useState('');\n  const [locationMessage, setLocationMessage] = useState<TranslationKey | null>(null);\n",
)
app = replace_once(
    app,
    "  async function refreshLocation(): Promise<void> {\n",
    "  useEffect(() => {\n    try {\n      saveSavedLocations(window.localStorage, savedLocations);\n    } catch {\n      // Saved favourites remain usable in memory when storage is unavailable.\n    }\n  }, [savedLocations]);\n\n  async function refreshLocation(): Promise<void> {\n",
)
handler_anchor = """  function updatePrayerOffset(prayer: PrayerName, rawValue: string): void {\n"""
handler_block = """  function saveCurrentLocation(): void {\n    const label = savedLocationLabel.trim();\n    if (coordinates === null || label.length === 0) {\n      setLocationMessage('savedLocationNeedsLabel');\n      return;\n    }\n\n    const location: SavedLocation = {\n      id: savedLocationId(coordinates),\n      label,\n      coordinates,\n      ...(dashboard === null ? {} : { timeZone: dashboard.timeZone }),\n    };\n    setSavedLocations((current) => upsertSavedLocation(current, location));\n    setSavedLocationLabel('');\n    setLocationMessage('locationSaved');\n  }\n\n  function selectSavedLocation(id: string): void {\n    const selected = savedLocations.find((location) => location.id === id);\n    if (selected === undefined) return;\n    setCoordinates(selected.coordinates);\n    setLatitude(String(selected.coordinates.latitude));\n    setLongitude(String(selected.coordinates.longitude));\n    setLocationFailure(null);\n    setManualError(false);\n    setLocationMessage(null);\n  }\n\n  function removeCurrentSavedLocation(): void {\n    if (coordinates === null) return;\n    const id = savedLocationId(coordinates);\n    setSavedLocations((current) => removeSavedLocation(current, id));\n    setLocationMessage('savedLocationRemoved');\n  }\n\n  function updatePrayerOffset(prayer: PrayerName, rawValue: string): void {\n"""
app = replace_once(app, handler_anchor, handler_block)
location_anchor = """        </div>\n        {locationFailure !== null && (\n"""
location_ui = """        </div>\n        <div className=\"saved-location-controls\">\n          <label>\n            <span>{translate(locale, 'savedLocations')}</span>\n            <select\n              value={\n                coordinates === null ||\n                !savedLocations.some((location) => location.id === savedLocationId(coordinates))\n                  ? ''\n                  : savedLocationId(coordinates)\n              }\n              onChange={(event) => {\n                selectSavedLocation(event.target.value);\n              }}\n            >\n              <option value=\"\">{translate(locale, 'noSavedLocationSelected')}</option>\n              {savedLocations.map((location) => (\n                <option key={location.id} value={location.id}>\n                  {location.label}\n                </option>\n              ))}\n            </select>\n          </label>\n          <label>\n            <span>{translate(locale, 'savedLocationLabel')}</span>\n            <input\n              value={savedLocationLabel}\n              maxLength={100}\n              onChange={(event) => {\n                setSavedLocationLabel(event.target.value);\n                setLocationMessage(null);\n              }}\n            />\n          </label>\n          <button type=\"button\" disabled={coordinates === null} onClick={saveCurrentLocation}>\n            {translate(locale, 'saveCurrentLocation')}\n          </button>\n          <button\n            type=\"button\"\n            disabled={\n              coordinates === null ||\n              !savedLocations.some((location) => location.id === savedLocationId(coordinates))\n            }\n            onClick={removeCurrentSavedLocation}\n          >\n            {translate(locale, 'removeSavedLocation')}\n          </button>\n        </div>\n        {locationMessage !== null && (\n          <p className=\"inline-message\" role=\"status\">\n            {translate(locale, locationMessage)}\n          </p>\n        )}\n        {locationFailure !== null && (\n"""
app = replace_once(app, location_anchor, location_ui)
app_path.write_text(app)

translations_path = Path("src/i18n/translations.ts")
translations = translations_path.read_text()
translations = replace_once(
    translations,
    "    invalidCoordinates: 'Enter valid latitude and longitude values.',\n",
    "    invalidCoordinates: 'Enter valid latitude and longitude values.',\n    savedLocations: 'Saved locations',\n    noSavedLocationSelected: 'Select a saved location',\n    savedLocationLabel: 'Location label',\n    saveCurrentLocation: 'Save current location',\n    removeSavedLocation: 'Remove saved location',\n    locationSaved: 'Location saved locally.',\n    savedLocationRemoved: 'Saved location removed.',\n    savedLocationNeedsLabel: 'Enter a label before saving this location.',\n",
)
translations = replace_once(
    translations,
    "    invalidCoordinates: 'أدخل قيماً صحيحة لخط العرض وخط الطول.',\n",
    "    invalidCoordinates: 'أدخل قيماً صحيحة لخط العرض وخط الطول.',\n    savedLocations: 'المواقع المحفوظة',\n    noSavedLocationSelected: 'اختر موقعاً محفوظاً',\n    savedLocationLabel: 'اسم الموقع',\n    saveCurrentLocation: 'احفظ الموقع الحالي',\n    removeSavedLocation: 'احذف الموقع المحفوظ',\n    locationSaved: 'تم حفظ الموقع محلياً.',\n    savedLocationRemoved: 'تم حذف الموقع المحفوظ.',\n    savedLocationNeedsLabel: 'أدخل اسماً قبل حفظ هذا الموقع.',\n",
)
translations_path.write_text(translations)

styles_path = Path("src/styles.css")
styles = styles_path.read_text().rstrip()
addition = """

.saved-location-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto auto;
  align-items: end;
  gap: 0.75rem;
  margin-block-start: 1rem;
}

.saved-location-controls label {
  display: grid;
  gap: 0.35rem;
  color: #c2cdc0;
  font-size: 0.85rem;
}

@media (max-width: 760px) {
  .saved-location-controls {
    grid-template-columns: 1fr;
  }
}
"""
if ".saved-location-controls {" not in styles:
    styles_path.write_text(styles + addition + "\n")

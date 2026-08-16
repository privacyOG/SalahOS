from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing patch anchor: {old[:100]}')
    return text.replace(old, new, 1)


app_path = Path('src/App.tsx')
app = app_path.read_text()
app = replace_once(
    app,
    "import { buildPrayerDashboardResult } from './domain/dashboardResult';\n",
    "import { buildPrayerDashboardResult } from './domain/dashboardResult';\nimport { searchLocations, type LocationSearchResult } from './domain/locationSearch';\n",
)
app = replace_once(
    app,
    "  const [savedLocationLabel, setSavedLocationLabel] = useState('');\n  const [locationMessage, setLocationMessage] = useState<TranslationKey | null>(null);\n",
    "  const [savedLocationLabel, setSavedLocationLabel] = useState('');\n  const [locationQuery, setLocationQuery] = useState('');\n  const [locationMessage, setLocationMessage] = useState<TranslationKey | null>(null);\n  const locationSearchResults = useMemo(\n    () => searchLocations(locationQuery, { locale, limit: 8 }),\n    [locale, locationQuery],\n  );\n",
)
app = replace_once(
    app,
    "  function saveCurrentLocation(): void {\n",
    "  function selectSearchedLocation(result: LocationSearchResult): void {\n    setCoordinates(result.coordinates);\n    setLatitude(String(result.coordinates.latitude));\n    setLongitude(String(result.coordinates.longitude));\n    setLocationQuery('');\n    setLocationFailure(null);\n    setManualError(false);\n    setLocationMessage('locationSearchSelected');\n  }\n\n  function saveCurrentLocation(): void {\n",
)
app = replace_once(
    app,
    "        </div>\n        <div className=\"saved-location-controls\">\n",
    "        </div>\n        <div className=\"location-search\">\n          <label>\n            <span>{translate(locale, 'locationSearch')}</span>\n            <input\n              value={locationQuery}\n              dir=\"auto\"\n              autoComplete=\"off\"\n              placeholder={translate(locale, 'locationSearchPlaceholder')}\n              onChange={(event) => {\n                setLocationQuery(event.target.value);\n                setLocationMessage(null);\n              }}\n            />\n          </label>\n          <p className=\"location-search-help\">{translate(locale, 'locationSearchHelp')}</p>\n          {locationSearchResults.length > 0 && (\n            <div className=\"location-search-results\" role=\"list\">\n              {locationSearchResults.map((result) => (\n                <button\n                  type=\"button\"\n                  className=\"location-search-result\"\n                  key={result.id}\n                  role=\"listitem\"\n                  onClick={() => {\n                    selectSearchedLocation(result);\n                  }}\n                >\n                  <span dir=\"auto\">\n                    {result.city} — {result.countryNames.join(', ')}\n                  </span>\n                  <small dir=\"ltr\">{result.timeZone}</small>\n                </button>\n              ))}\n            </div>\n          )}\n          {locationQuery.trim().length >= 2 && locationSearchResults.length === 0 && (\n            <p className=\"inline-message\">{translate(locale, 'locationSearchNoResults')}</p>\n          )}\n        </div>\n        <div className=\"saved-location-controls\">\n",
)
app_path.write_text(app)


translations_path = Path('src/i18n/translations.ts')
translations = translations_path.read_text()
translations = replace_once(
    translations,
    "    invalidCoordinates: 'Enter valid latitude and longitude values.',\n    savedLocations: 'Saved locations',\n",
    "    invalidCoordinates: 'Enter valid latitude and longitude values.',\n    locationSearch: 'Search city or location',\n    locationSearchPlaceholder: 'City, country, or timezone',\n    locationSearchHelp:\n      'Searches the built-in offline principal-location catalogue. Your query is not sent to a server.',\n    locationSearchNoResults: 'No matching offline locations.',\n    locationSearchSelected: 'Location selected from the offline catalogue.',\n    savedLocations: 'Saved locations',\n",
)
translations = replace_once(
    translations,
    "    invalidCoordinates: 'أدخل قيماً صحيحة لخط العرض وخط الطول.',\n    savedLocations: 'المواقع المحفوظة',\n",
    "    invalidCoordinates: 'أدخل قيماً صحيحة لخط العرض وخط الطول.',\n    locationSearch: 'ابحث عن مدينة أو موقع',\n    locationSearchPlaceholder: 'مدينة أو دولة أو منطقة زمنية',\n    locationSearchHelp:\n      'يبحث في دليل المواقع الرئيسية المضمّن دون اتصال. لا يتم إرسال بحثك إلى أي خادم.',\n    locationSearchNoResults: 'لا توجد مواقع مطابقة في الدليل المحلي.',\n    locationSearchSelected: 'تم اختيار الموقع من الدليل المحلي.',\n    savedLocations: 'المواقع المحفوظة',\n",
)
translations_path.write_text(translations)


styles_path = Path('src/styles.css')
styles = styles_path.read_text()
styles = replace_once(
    styles,
    ".manual-location input {\n  width: min(13rem, 40vw);\n}\n\n.inline-message {\n",
    ".manual-location input {\n  width: min(13rem, 40vw);\n}\n\n.location-search {\n  display: grid;\n  gap: 0.65rem;\n  margin-block-start: 1rem;\n}\n\n.location-search > label {\n  display: grid;\n  gap: 0.35rem;\n  color: var(--muted);\n  font-size: 0.9rem;\n  line-height: 1.4;\n}\n\n.location-search-help {\n  margin: 0;\n  color: var(--muted);\n  font-size: 0.85rem;\n  line-height: 1.5;\n}\n\n.location-search-results {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));\n  gap: 0.55rem;\n}\n\n.location-search-result {\n  display: grid;\n  justify-items: start;\n  gap: 0.2rem;\n  min-width: 0;\n  padding-block: 0.7rem;\n  text-align: start;\n}\n\n.location-search-result span,\n.location-search-result small {\n  max-width: 100%;\n  overflow-wrap: anywhere;\n}\n\n.location-search-result small {\n  color: var(--muted);\n  font-weight: 500;\n}\n\n.inline-message {\n",
)
styles_path.write_text(styles)

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing patch anchor: {old[:120]}')
    return text.replace(old, new, 1)


# Dashboard accepts an already-validated/persisted timezone and forwards it to the context.
path = Path('src/domain/dashboard.ts')
text = path.read_text()
text = replace_once(
    text,
    "  readonly coordinates: Coordinates;\n  readonly method?: CalculationMethod;\n",
    "  readonly coordinates: Coordinates;\n  readonly timeZone?: string;\n  readonly method?: CalculationMethod;\n",
)
text = replace_once(
    text,
    "  const context = createLocationPrayerContext(input.instant, input.coordinates);\n",
    "  const context = createLocationPrayerContext(input.instant, input.coordinates, input.timeZone);\n",
)
path.write_text(text)


# Validate persisted settings timezone strings rather than trusting arbitrary stored data.
path = Path('src/platform/settingsStorage.ts')
text = path.read_text()
text = replace_once(
    text,
    "import type { AsrConvention, HighLatitudeRule, PrayerName } from '../domain/prayerEngine';\n",
    "import type { AsrConvention, HighLatitudeRule, PrayerName } from '../domain/prayerEngine';\nimport { assertIanaTimeZone } from '../domain/timezone';\n",
)
text = replace_once(
    text,
    "    const timeZone =\n      typeof value.timeZone === 'string' && value.timeZone.trim() ? value.timeZone : undefined;\n",
    "    const timeZone =\n      typeof value.timeZone === 'string' && value.timeZone.trim()\n        ? assertIanaTimeZone(value.timeZone.trim())\n        : undefined;\n",
)
path.write_text(text)


# Apply the same validation to saved/favourite locations.
path = Path('src/platform/savedLocations.ts')
text = path.read_text()
text = replace_once(
    text,
    "import type { Coordinates } from '../domain/coordinates';\n",
    "import type { Coordinates } from '../domain/coordinates';\nimport { assertIanaTimeZone } from '../domain/timezone';\n",
)
text = replace_once(
    text,
    "  const timeZone =\n    typeof value.timeZone === 'string' && value.timeZone.trim().length > 0\n      ? value.timeZone.trim()\n      : undefined;\n",
    "  const timeZone =\n    typeof value.timeZone === 'string' && value.timeZone.trim().length > 0\n      ? assertIanaTimeZone(value.timeZone.trim())\n      : undefined;\n",
)
path.write_text(text)


# Wire the persisted timezone through the application lifecycle.
path = Path('src/App.tsx')
text = path.read_text()
text = replace_once(
    text,
    "  const [coordinates, setCoordinates] = useState<Coordinates | null>(\n    settings.location?.coordinates ?? null,\n  );\n",
    "  const [coordinates, setCoordinates] = useState<Coordinates | null>(\n    settings.location?.coordinates ?? null,\n  );\n  const [timeZoneOverride, setTimeZoneOverride] = useState<string | null>(\n    settings.location?.timeZone ?? null,\n  );\n",
)
text = replace_once(
    text,
    "            coordinates,\n            method: calculationMethods[settings.calculationMethodId],\n",
    "            coordinates,\n            ...(timeZoneOverride === null ? {} : { timeZone: timeZoneOverride }),\n            method: calculationMethods[settings.calculationMethodId],\n",
)
text = replace_once(
    text,
    "    [coordinates, now, settings],\n",
    "    [coordinates, now, settings, timeZoneOverride],\n",
)
text = replace_once(
    text,
    "      setCoordinates(result.location.coordinates);\n      setLatitude(String(result.location.coordinates.latitude));\n",
    "      setCoordinates(result.location.coordinates);\n      setTimeZoneOverride(null);\n      setLatitude(String(result.location.coordinates.latitude));\n",
)
text = replace_once(
    text,
    "      const next = createCoordinates(Number(latitude), Number(longitude));\n      setCoordinates(next);\n",
    "      const next = createCoordinates(Number(latitude), Number(longitude));\n      setCoordinates(next);\n      setTimeZoneOverride(null);\n",
)
text = replace_once(
    text,
    "    setCoordinates(result.coordinates);\n    setLatitude(String(result.coordinates.latitude));\n",
    "    setCoordinates(result.coordinates);\n    setTimeZoneOverride(result.timeZone);\n    setLatitude(String(result.coordinates.latitude));\n",
)
text = replace_once(
    text,
    "    setCoordinates(selected.coordinates);\n    setLatitude(String(selected.coordinates.latitude));\n",
    "    setCoordinates(selected.coordinates);\n    setTimeZoneOverride(selected.timeZone ?? null);\n    setLatitude(String(selected.coordinates.latitude));\n",
)
text = replace_once(
    text,
    "      setCoordinates(imported.location?.coordinates ?? null);\n      setLatitude(imported.location === null ? '' : String(imported.location.coordinates.latitude));\n",
    "      setCoordinates(imported.location?.coordinates ?? null);\n      setTimeZoneOverride(imported.location?.timeZone ?? null);\n      setLatitude(imported.location === null ? '' : String(imported.location.coordinates.latitude));\n",
)
text = replace_once(
    text,
    "    setCoordinates(null);\n    setLatitude('');\n",
    "    setCoordinates(null);\n    setTimeZoneOverride(null);\n    setLatitude('');\n",
)
path.write_text(text)

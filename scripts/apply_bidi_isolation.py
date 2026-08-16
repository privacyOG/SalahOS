from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing {label} marker")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
app = replace_once(
    app,
    "import { installThemePreference } from './platform/themePreference';\n",
    "import { installThemePreference } from './platform/themePreference';\nimport { BidiText } from './ui/BidiText';\n",
    "BidiText import",
)
app = replace_once(
    app,
    "<option key={location.id} value={location.id}>\n                  {location.label}\n                </option>",
    "<option dir=\"auto\" key={location.id} value={location.id}>\n                  {location.label}\n                </option>",
    "saved location option",
)
app = replace_once(
    app,
    "              maxLength={100}\n              onChange={(event) => {\n",
    "              maxLength={100}\n              dir=\"auto\"\n              onChange={(event) => {\n",
    "saved location input",
)
app = replace_once(
    app,
    "                <option key={method.id} value={method.id}>\n                  {method.name}\n                </option>",
    "                <option dir=\"auto\" key={method.id} value={method.id}>\n                  {method.name}\n                </option>",
    "method option",
)
app = replace_once(
    app,
    "                  <option key={entry.id} value={entry.id}>\n                    {entry.timetable.mosqueName}\n                  </option>",
    "                  <option dir=\"auto\" key={entry.id} value={entry.id}>\n                    {entry.timetable.mosqueName}\n                  </option>",
    "mosque option",
)
app = replace_once(
    app,
    "                  value={manualMosqueName}\n                  maxLength={160}\n                  onChange={(event) => {\n",
    "                  value={manualMosqueName}\n                  maxLength={160}\n                  dir=\"auto\"\n                  onChange={(event) => {\n",
    "manual mosque input",
)
app = replace_once(
    app,
    "                  value={mosqueImportName}\n                  maxLength={160}\n                  onChange={(event) => {\n",
    "                  value={mosqueImportName}\n                  maxLength={160}\n                  dir=\"auto\"\n                  onChange={(event) => {\n",
    "mosque import input",
)
app = replace_once(
    app,
    "            <p className=\"value\">{calculationMethods[settings.calculationMethodId].name}</p>",
    "            <p className=\"value\">\n              <BidiText>{calculationMethods[settings.calculationMethodId].name}</BidiText>\n            </p>",
    "status method name",
)
app = replace_once(
    app,
    "                  <strong>{session.label}</strong>",
    "                  <strong>\n                    <BidiText>{session.label}</BidiText>\n                  </strong>",
    "Jumuah label",
)
app = replace_once(
    app,
    "              {translate(locale, 'method')}: {sourcedDashboard.base.method.name}\n",
    "              {translate(locale, 'method')}: <BidiText>{sourcedDashboard.base.method.name}</BidiText>\n",
    "method provenance",
)
app = replace_once(
    app,
    "              {translate(locale, 'timezone')}: {sourcedDashboard.base.timeZone}\n",
    "              {translate(locale, 'timezone')}: <BidiText>{sourcedDashboard.base.timeZone}</BidiText>\n",
    "timezone provenance",
)
app = replace_once(
    app,
    "                {translate(locale, 'selectedMosque')}: {sourcedDashboard.mosqueName}\n",
    "                {translate(locale, 'selectedMosque')}: <BidiText>{sourcedDashboard.mosqueName}</BidiText>\n",
    "mosque provenance",
)
app_path.write_text(app)

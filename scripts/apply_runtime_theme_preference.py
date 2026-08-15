from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing marker: {old[:120]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
import_marker = "import { installRuntimeRefreshListeners } from './platform/runtimeRefresh';\n"
theme_import = "import { installThemePreference } from './platform/themePreference';\n"
if theme_import not in app:
    app = replace_once(app, import_marker, import_marker + theme_import)
old_effect = """  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);
"""
new_effect = """  useEffect(() => {
    return installThemePreference(settings.theme, {
      documentTarget: document,
      windowTarget: window,
    });
  }, [settings.theme]);
"""
if "installThemePreference(settings.theme" not in app:
    app = replace_once(app, old_effect, new_effect)
app_path.write_text(app)

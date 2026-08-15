from pathlib import Path


path = Path("src/App.tsx")
text = path.read_text()

old_import = "import type { PersistedSettings } from './platform/settingsStorage';\n"
new_import = old_import + "import { installRuntimeRefreshListeners } from './platform/runtimeRefresh';\n"
if new_import not in text:
    if old_import not in text:
        raise RuntimeError("Missing settings import anchor")
    text = text.replace(old_import, new_import, 1)

old_effect = """  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1_000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);
"""
new_effect = """  useEffect(() => {
    const refreshNow = () => {
      setNow(new Date());
    };
    const timer = window.setInterval(refreshNow, 1_000);
    const removeRuntimeListeners = installRuntimeRefreshListeners(
      { windowTarget: window, documentTarget: document },
      refreshNow,
    );
    return () => {
      window.clearInterval(timer);
      removeRuntimeListeners();
    };
  }, []);
"""
if new_effect not in text:
    if old_effect not in text:
        raise RuntimeError("Missing clock effect anchor")
    text = text.replace(old_effect, new_effect, 1)

path.write_text(text)

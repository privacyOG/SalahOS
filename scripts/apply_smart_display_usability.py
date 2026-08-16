from pathlib import Path

# Branch-only integration helper; removed before pull request review.
# This comment ensures the already-present integration workflow receives a push event.

app_path = Path('src/App.tsx')
app = app_path.read_text()

import_anchor = "import { installThemePreference } from './platform/themePreference';\n"
import_line = "import { smartDisplayExitPath } from './platform/smartDisplayNavigation';\n"
if import_line not in app:
    if import_anchor not in app:
        raise RuntimeError('Missing App import anchor')
    app = app.replace(import_anchor, import_line + import_anchor, 1)

anchor = "  const currentClock =\n"
effect = '''  useEffect(() => {
    if (!smartDisplayModeRequested(window.location.search)) {
      return;
    }

    const handleDisplayExitKey = (event: KeyboardEvent) => {
      const target = smartDisplayExitPath(window.location.href, event.key);
      if (target === null) {
        return;
      }
      event.preventDefault();
      window.location.assign(target);
    };

    window.addEventListener('keydown', handleDisplayExitKey);
    return () => {
      window.removeEventListener('keydown', handleDisplayExitKey);
    };
  }, []);

'''
if effect not in app:
    if anchor not in app:
        raise RuntimeError('Missing current clock anchor')
    app = app.replace(anchor, effect + anchor, 1)
app_path.write_text(app)

css_path = Path('src/smart-display.css')
css = css_path.read_text().rstrip()
block = r'''

.smart-display-header,
.smart-display-status,
.smart-display-prayers,
.smart-display-jumuah,
.smart-display-footer,
.smart-display-empty {
  animation: smart-display-pixel-shift 60min steps(1, end) infinite;
}

@keyframes smart-display-pixel-shift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  25% {
    transform: translate3d(4px, -3px, 0);
  }

  50% {
    transform: translate3d(-3px, -4px, 0);
  }

  75% {
    transform: translate3d(-4px, 3px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .smart-display-header,
  .smart-display-status,
  .smart-display-prayers,
  .smart-display-jumuah,
  .smart-display-footer,
  .smart-display-empty {
    animation: none;
  }
}
'''
if '@keyframes smart-display-pixel-shift' not in css:
    css_path.write_text(css + block + '\n')

from pathlib import Path

# Branch-only integration helper; removed before pull request review.
# This comment ensures the already-present integration workflow receives a push event.

path = Path('src/App.tsx')
text = path.read_text()

old_import = "import { PrayerCard } from './ui/PrayerCard';\n"
new_import = (
    "import { PrayerCard } from './ui/PrayerCard';\n"
    "import { SmartDisplay, smartDisplayModeRequested } from './ui/SmartDisplay';\n"
)
if new_import not in text:
    if old_import not in text:
        raise RuntimeError('Missing PrayerCard import anchor')
    text = text.replace(old_import, new_import, 1)

old_return = '  return (\n    <main className="app-shell" dir={direction}>\n'
new_return = '''  if (smartDisplayModeRequested(window.location.search)) {
    return (
      <SmartDisplay
        locale={locale}
        currentClock={currentClock}
        dashboard={sourcedDashboard}
        timeFormat={settings.timeFormat}
        hijriCorrectionDays={settings.hijriCorrectionDays}
        offline={!online}
        systemTimeUnavailable={now === null}
        calculationUnavailable={calculationUnavailable}
      />
    );
  }

  return (
    <main className="app-shell" dir={direction}>
'''
if new_return not in text:
    if old_return not in text:
        raise RuntimeError('Missing App return anchor')
    text = text.replace(old_return, new_return, 1)

path.write_text(text)

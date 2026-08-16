from pathlib import Path
import re

path = Path('src/App.tsx')
text = path.read_text()

old_import = "import { BidiText } from './ui/BidiText';\n"
new_import = (
    "import { BidiText } from './ui/BidiText';\n"
    "import { NextPrayerBlock } from './ui/NextPrayerBlock';\n"
    "import { PrayerCard } from './ui/PrayerCard';\n"
)
if old_import not in text:
    raise RuntimeError('BidiText import anchor missing')
text = text.replace(old_import, new_import, 1)

old_next = '''            <div className="next-prayer-block">
              <p>{translate(locale, 'nextPrayer')}</p>
              {sourcedDashboard.nextPrayer === null ? (
                <strong>{translate(locale, 'notConfigured')}</strong>
              ) : (
                <strong>
                  {translate(locale, prayerTranslationKeys[sourcedDashboard.nextPrayer])}
                </strong>
              )}
              <p className="countdown">
                {sourcedDashboard.secondsUntilNextPrayer === null
                  ? '—'
                  : formatCountdown(sourcedDashboard.secondsUntilNextPrayer, locale)}
              </p>
              {sourcedDashboard.nextPrayerDayOffset === 1 && <p>{translate(locale, 'tomorrow')}</p>}
            </div>'''
new_next = '''            <NextPrayerBlock
              nextPrayerLabel={
                sourcedDashboard.nextPrayer === null
                  ? null
                  : translate(locale, prayerTranslationKeys[sourcedDashboard.nextPrayer])
              }
              countdown={
                sourcedDashboard.secondsUntilNextPrayer === null
                  ? '—'
                  : formatCountdown(sourcedDashboard.secondsUntilNextPrayer, locale)
              }
              tomorrow={sourcedDashboard.nextPrayerDayOffset === 1}
              nextPrayerText={translate(locale, 'nextPrayer')}
              notConfiguredText={translate(locale, 'notConfigured')}
              tomorrowText={translate(locale, 'tomorrow')}
            />'''
if old_next not in text:
    raise RuntimeError('Next-prayer block anchor missing')
text = text.replace(old_next, new_next, 1)

pattern = re.compile(
    r"              const classes = \[.*?\n              \);\n            \}\)\}",
    re.DOTALL,
)
replacement = '''              const highLatitudeIndicator = highLatitudeRuleApplied
                ? `${translate(locale, 'highLatitudeAdjustment')} · ${translate(
                    locale,
                    highLatitudeRuleTranslationKeys[sourcedDashboard.base.highLatitudeRule],
                  )}`
                : null;
              const manualAdjustmentIndicator =
                manualPrayerAdjustmentMinutes === null
                  ? null
                  : `${translate(locale, 'manualOffset')} ${
                      manualPrayerAdjustmentMinutes > 0 ? '+' : ''
                    }${String(manualPrayerAdjustmentMinutes)} ${translate(locale, 'minutesShort')}`;
              return (
                <PrayerCard
                  key={prayer.name}
                  prayerName={translate(locale, prayerTranslationKeys[prayer.name])}
                  isCurrent={prayer.isCurrent}
                  isNext={prayer.isNext}
                  isSupplementary={isSupplementary}
                  currentPrayerLabel={translate(locale, 'currentPrayer')}
                  prayerStartLabel={translate(locale, 'prayerStart')}
                  startTime={
                    prayer.localMinutes === null
                      ? '—'
                      : formatLocalTime(prayer.localMinutes, locale, settings.timeFormat)
                  }
                  iqamahLabel={translate(locale, 'iqamah')}
                  iqamahTime={
                    prayer.iqamahLocalMinutes === null
                      ? translate(locale, 'noIqamah')
                      : formatLocalTime(
                          prayer.iqamahLocalMinutes,
                          locale,
                          settings.timeFormat,
                        )
                  }
                  highLatitudeIndicator={highLatitudeIndicator}
                  manualAdjustmentIndicator={manualAdjustmentIndicator}
                />
              );
            })}'''
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise RuntimeError(f'Prayer-card block replacement count was {count}')

path.write_text(text)

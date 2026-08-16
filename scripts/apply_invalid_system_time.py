from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing integration marker: {old[:120]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()
app = replace_once(
    app,
    "import { createSystemSleepWakeDetector } from './platform/systemSleepWake';\n",
    "import { createSystemSleepWakeDetector } from './platform/systemSleepWake';\n"
    "import { readSystemTime, systemTimeFromMilliseconds } from './platform/systemTime';\n",
)
app = replace_once(
    app,
    "  const [now, setNow] = useState(() => new Date());\n",
    "  const [now, setNow] = useState<Date | null>(() => readSystemTime());\n",
)
old_effect = """  useEffect(() => {
    const initialSample = { wallTimeMs: Date.now(), monotonicTimeMs: performance.now() };
    const clockChangeDetector = createSystemClockChangeDetector(initialSample);
    const sleepWakeDetector = createSystemSleepWakeDetector({
      wallTimeMs: initialSample.wallTimeMs,
    });
    const sampleNow = () => ({
      wallTimeMs: Date.now(),
      monotonicTimeMs: performance.now(),
    });
    const refreshNow = () => {
      const sample = sampleNow();
      clockChangeDetector.reset(sample);
      sleepWakeDetector.reset({ wallTimeMs: sample.wallTimeMs });
      setNow(new Date(sample.wallTimeMs));
    };
    const tick = () => {
      const sample = sampleNow();
      const resumedFromSleep = sleepWakeDetector.sample({ wallTimeMs: sample.wallTimeMs });
      if (resumedFromSleep) {
        clockChangeDetector.reset(sample);
      } else {
        clockChangeDetector.sample(sample);
      }
      setNow(new Date(sample.wallTimeMs));
    };
    const timer = window.setInterval(tick, 1_000);
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
new_effect = """  useEffect(() => {
    let clockChangeDetector: ReturnType<typeof createSystemClockChangeDetector> | null = null;
    let sleepWakeDetector: ReturnType<typeof createSystemSleepWakeDetector> | null = null;

    const sampleNow = () => {
      const wallTimeMs = Date.now();
      const monotonicTimeMs = performance.now();
      const instant = systemTimeFromMilliseconds(wallTimeMs);
      if (instant === null || !Number.isFinite(monotonicTimeMs)) {
        return null;
      }
      return { wallTimeMs, monotonicTimeMs, instant };
    };
    const invalidateRuntimeClock = () => {
      clockChangeDetector = null;
      sleepWakeDetector = null;
      setNow(null);
    };
    const resetFromSample = (sample: NonNullable<ReturnType<typeof sampleNow>>) => {
      if (clockChangeDetector === null) {
        clockChangeDetector = createSystemClockChangeDetector(sample);
      } else {
        clockChangeDetector.reset(sample);
      }
      if (sleepWakeDetector === null) {
        sleepWakeDetector = createSystemSleepWakeDetector({ wallTimeMs: sample.wallTimeMs });
      } else {
        sleepWakeDetector.reset({ wallTimeMs: sample.wallTimeMs });
      }
      setNow(sample.instant);
    };
    const refreshNow = () => {
      const sample = sampleNow();
      if (sample === null) {
        invalidateRuntimeClock();
        return;
      }
      resetFromSample(sample);
    };
    const tick = () => {
      const sample = sampleNow();
      if (sample === null) {
        invalidateRuntimeClock();
        return;
      }
      if (clockChangeDetector === null || sleepWakeDetector === null) {
        resetFromSample(sample);
        return;
      }
      const resumedFromSleep = sleepWakeDetector.sample({ wallTimeMs: sample.wallTimeMs });
      if (resumedFromSleep) {
        clockChangeDetector.reset(sample);
      } else {
        clockChangeDetector.sample(sample);
      }
      setNow(sample.instant);
    };

    refreshNow();
    const timer = window.setInterval(tick, 1_000);
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
app = replace_once(app, old_effect, new_effect)
app = replace_once(
    app,
    "      coordinates === null\n        ? null\n        : buildPrayerDashboard({\n            instant: now,\n",
    "      coordinates === null || now === null\n        ? null\n        : buildPrayerDashboard({\n            instant: now,\n",
)
old_clock = """  const currentClock =
    dashboard === null
      ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: settings.timeFormat,
        }).format(now)
      : formatZonedInstantTime(now, dashboard.timeZone, locale, settings.timeFormat);
"""
new_clock = """  const currentClock =
    now === null
      ? '—'
      : dashboard === null
        ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: settings.timeFormat,
          }).format(now)
        : formatZonedInstantTime(now, dashboard.timeZone, locale, settings.timeFormat);
"""
app = replace_once(app, old_clock, new_clock)
app = replace_once(
    app,
    "      {sourcedDashboard === null ? (\n        <section className=\"status-card\">\n",
    "      {now === null ? (\n"
    "        <section className=\"status-card\" role=\"alert\">\n"
    "          <div>\n"
    "            <p className=\"label\">{translate(locale, 'currentTime')}</p>\n"
    "            <p className=\"value\">{translate(locale, 'systemTimeInvalid')}</p>\n"
    "          </div>\n"
    "          <div>\n"
    "            <p className=\"value\">{translate(locale, 'systemTimeInvalidHelp')}</p>\n"
    "          </div>\n"
    "        </section>\n"
    "      ) : sourcedDashboard === null ? (\n"
    "        <section className=\"status-card\">\n",
)
app_path.write_text(app)

translations_path = Path("src/i18n/translations.ts")
translations = translations_path.read_text()
translations = replace_once(
    translations,
    "    currentTime: 'Current local time',\n",
    "    currentTime: 'Current local time',\n"
    "    systemTimeInvalid: 'Device time is unavailable or invalid.',\n"
    "    systemTimeInvalidHelp:\n"
    "      'Correct the device date and time. Prayer calculations will resume automatically when a valid system time is available.',\n",
)
translations = replace_once(
    translations,
    "    currentTime: 'الوقت المحلي الحالي',\n",
    "    currentTime: 'الوقت المحلي الحالي',\n"
    "    systemTimeInvalid: 'وقت الجهاز غير متاح أو غير صالح.',\n"
    "    systemTimeInvalidHelp:\n"
    "      'صحّح تاريخ ووقت الجهاز. ستُستأنف حسابات الصلاة تلقائياً عند توفر وقت نظام صالح.',\n",
)
translations_path.write_text(translations)

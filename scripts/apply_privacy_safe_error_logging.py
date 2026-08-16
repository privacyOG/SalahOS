from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing integration marker: {old[:140]}")
    return text.replace(old, new, 1)


path = Path('src/App.tsx')
text = path.read_text()
text = replace_once(
    text,
    "import type { BrowserLocationFailureReason } from './platform/browserGeolocation';\n",
    "import type { BrowserLocationFailureReason } from './platform/browserGeolocation';\n"
    "import { createStructuredErrorLogger } from './platform/errorLog';\n",
)
text = replace_once(
    text,
    "  const [settings, setSettings] = useState(initialSettings);\n",
    "  const [settings, setSettings] = useState(initialSettings);\n"
    "  const errorLogger = useMemo(() => createStructuredErrorLogger(), []);\n",
)
text = replace_once(
    text,
    "    let clockChangeDetector: ReturnType<typeof createSystemClockChangeDetector> | null = null;\n    let sleepWakeDetector: ReturnType<typeof createSystemSleepWakeDetector> | null = null;\n",
    "    let clockChangeDetector: ReturnType<typeof createSystemClockChangeDetector> | null = null;\n"
    "    let sleepWakeDetector: ReturnType<typeof createSystemSleepWakeDetector> | null = null;\n"
    "    let invalidSystemTimeActive = false;\n",
)
text = replace_once(
    text,
    "    const invalidateRuntimeClock = () => {\n      clockChangeDetector = null;\n      sleepWakeDetector = null;\n      setNow(null);\n    };\n",
    "    const invalidateRuntimeClock = () => {\n"
    "      if (!invalidSystemTimeActive) {\n"
    "        errorLogger.log('invalid-system-time');\n"
    "        invalidSystemTimeActive = true;\n"
    "      }\n"
    "      clockChangeDetector = null;\n"
    "      sleepWakeDetector = null;\n"
    "      setNow(null);\n"
    "    };\n",
)
text = replace_once(
    text,
    "    const resetFromSample = (sample: NonNullable<ReturnType<typeof sampleNow>>) => {\n",
    "    const resetFromSample = (sample: NonNullable<ReturnType<typeof sampleNow>>) => {\n"
    "      invalidSystemTimeActive = false;\n",
)
text = replace_once(text, "  }, []);\n\n  useEffect(() => {\n    const markOnline", "  }, [errorLogger]);\n\n  useEffect(() => {\n    const markOnline",)
marker = """  const calculationUnavailable = dashboardResult?.ok === false;
  const unavailablePrayers = dashboardResult?.ok === true ? dashboardResult.unavailablePrayers : [];
"""
replacement = marker + """

  useEffect(() => {
    if (calculationUnavailable) {
      errorLogger.log('prayer-calculation-unavailable');
    }
  }, [calculationUnavailable, errorLogger]);
"""
text = replace_once(text, marker, replacement)
path.write_text(text)

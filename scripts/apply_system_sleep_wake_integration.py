from pathlib import Path


path = Path("src/App.tsx")
text = path.read_text()

import_old = "import { createSystemClockChangeDetector } from './platform/systemClockChange';\n"
import_new = (
    "import { createSystemClockChangeDetector } from './platform/systemClockChange';\n"
    "import { createSystemSleepWakeDetector } from './platform/systemSleepWake';\n"
)
if "createSystemSleepWakeDetector" not in text:
    if import_old not in text:
        raise RuntimeError("Missing system clock import marker")
    text = text.replace(import_old, import_new, 1)

old = """  useEffect(() => {
    const initialSample = { wallTimeMs: Date.now(), monotonicTimeMs: performance.now() };
    const clockChangeDetector = createSystemClockChangeDetector(initialSample);
    const sampleNow = () => ({
      wallTimeMs: Date.now(),
      monotonicTimeMs: performance.now(),
    });
    const refreshNow = () => {
      const sample = sampleNow();
      clockChangeDetector.reset(sample);
      setNow(new Date(sample.wallTimeMs));
    };
    const tick = () => {
      const sample = sampleNow();
      clockChangeDetector.sample(sample);
      setNow(new Date(sample.wallTimeMs));
    };
"""
new = """  useEffect(() => {
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
"""

if old in text:
    text = text.replace(old, new, 1)
elif new not in text:
    raise RuntimeError("Missing runtime clock integration marker")

path.write_text(text)

export type SmartDisplayBurnInShiftIndex = 0 | 1 | 2 | 3;

const SHIFT_INTERVAL_MS = 15 * 60 * 1000;
const SHIFT_COUNT = 4;

export function smartDisplayBurnInShiftIndex(instant: Date): SmartDisplayBurnInShiftIndex {
  const timestamp = instant.getTime();
  if (!Number.isFinite(timestamp)) return 0;
  const slot = Math.floor(timestamp / SHIFT_INTERVAL_MS);
  const normalized = ((slot % SHIFT_COUNT) + SHIFT_COUNT) % SHIFT_COUNT;
  return normalized as SmartDisplayBurnInShiftIndex;
}

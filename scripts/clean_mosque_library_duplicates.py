from pathlib import Path


def remove_second(text: str, block: str) -> str:
    first = text.find(block)
    if first == -1:
        raise RuntimeError("Expected block not found")
    second = text.find(block, first + len(block))
    if second == -1:
        raise RuntimeError("Expected duplicate block not found")
    return text[:second] + text[second + len(block):]


path = Path("src/App.tsx")
text = path.read_text()

text = remove_second(
    text,
    "import { parseMosqueTimetableCsv, parseMosqueTimetableJson } from './domain/timetableImport';\n",
)

library_import = """import {
  loadMosqueLibrary,
  mosqueLibraryId,
  removeMosqueTimetable,
  saveMosqueLibrary,
  upsertMosqueTimetable,
} from './platform/mosqueLibrary';
import type { MosqueLibraryEntry } from './platform/mosqueLibrary';
"""
text = remove_second(text, library_import)

state_block = """  const [mosqueLibrary, setMosqueLibrary] = useState<readonly MosqueLibraryEntry[]>(() => {
    try {
      return loadMosqueLibrary(window.localStorage);
    } catch {
      return [];
    }
  });
  const [mosqueImportFormat, setMosqueImportFormat] = useState<'json' | 'csv'>('json');
  const [mosqueImportName, setMosqueImportName] = useState('');
  const [mosqueImportPayload, setMosqueImportPayload] = useState('');
  const [mosqueMessage, setMosqueMessage] = useState<TranslationKey | null>(null);
"""
text = remove_second(text, state_block)

persistence_block = """  useEffect(() => {
    try {
      saveMosqueLibrary(window.localStorage, mosqueLibrary);
    } catch {
      // The validated mosque library remains usable in memory when storage is unavailable.
    }
  }, [mosqueLibrary]);
"""
text = remove_second(text, persistence_block)

handler_block = """  function importMosqueTimetable(): void {
    try {
      const timetable =
        mosqueImportFormat === 'json'
          ? parseMosqueTimetableJson(mosqueImportPayload)
          : parseMosqueTimetableCsv(mosqueImportPayload, mosqueImportName.trim());
      setMosqueLibrary((current) => upsertMosqueTimetable(current, timetable));
      setSettings((current) => ({
        ...current,
        mosqueTimetable: timetable,
        prayerSourceMode: 'local-mosque',
      }));
      setMosqueImportName('');
      setMosqueImportPayload('');
      setMosqueMessage('mosqueTimetableImported');
    } catch {
      setMosqueMessage('mosqueTimetableImportError');
    }
  }

  function selectMosqueTimetable(id: string): void {
    const selected = mosqueLibrary.find((entry) => entry.id === id);
    if (selected === undefined) return;
    setSettings((current) => ({
      ...current,
      mosqueTimetable: selected.timetable,
      prayerSourceMode: 'local-mosque',
    }));
    setMosqueMessage(null);
  }

  function removeSelectedMosqueTimetable(): void {
    if (settings.mosqueTimetable === null) return;
    const id = mosqueLibraryId(settings.mosqueTimetable.mosqueName);
    setMosqueLibrary((current) => removeMosqueTimetable(current, id));
    setSettings((current) => ({
      ...current,
      mosqueTimetable: null,
      prayerSourceMode:
        current.prayerSourceMode === 'local-mosque' ? 'calculated' : current.prayerSourceMode,
    }));
    setMosqueMessage('mosqueTimetableRemoved');
  }
"""
text = remove_second(text, handler_block)

path.write_text(text)

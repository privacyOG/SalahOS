from pathlib import Path

reader_path = Path('src/ui/QuranOfflineReader.tsx')
reader = reader_path.read_text()

replacements = [
    ("  loadError: string;\n", "  loadError: string;\n  retry: string;\n"),
    ("    loadError: 'The packaged Qur’an could not be loaded.',\n", "    loadError: 'The packaged Qur’an could not be loaded.',\n    retry: 'Retry',\n"),
    ("    loadError: 'تعذر تحميل القرآن المحفوظ.',\n", "    loadError: 'تعذر تحميل القرآن المحفوظ.',\n    retry: 'إعادة المحاولة',\n"),
    ("    loadError: 'Paketlenmiş Kur’an yüklenemedi.',\n", "    loadError: 'Paketlenmiş Kur’an yüklenemedi.',\n    retry: 'Yeniden dene',\n"),
    ("    loadError: 'Qur’an yang dikemas tidak dapat dimuat.',\n", "    loadError: 'Qur’an yang dikemas tidak dapat dimuat.',\n    retry: 'Coba lagi',\n"),
    ("  const [loadError, setLoadError] = useState(false);\n", "  const [loadError, setLoadError] = useState(false);\n  const [loadAttempt, setLoadAttempt] = useState(0);\n"),
    ("        setPack(loaded);\n", "        setLoadError(false);\n        setPack(loaded);\n"),
    ("  }, []);\n\n  useEffect(() => {\n    if (!pack || !initialVerseKey) return;", "  }, [loadAttempt]);\n\n  useEffect(() => {\n    if (!pack || !initialVerseKey) return;"),
    ("""      {loadError ? (\n        <p className=\"knowledge-empty\" role=\"alert\">\n          {labels.loadError}\n        </p>\n      ) : !pack ? (\n""", """      {loadError ? (\n        <div className=\"knowledge-empty quran-load-error\" role=\"alert\" data-quran-load-error>\n          <p>{labels.loadError}</p>\n          <button\n            type=\"button\"\n            data-quran-load-retry\n            onClick={() => {\n              setLoadError(false);\n              setLoadAttempt((current) => current + 1);\n            }}\n          >\n            {labels.retry}\n          </button>\n        </div>\n      ) : !pack ? (\n"""),
]

for old, new in replacements:
    if old not in reader:
        raise SystemExit(f'reader marker drifted: {old[:80]!r}')
    reader = reader.replace(old, new, 1)
reader_path.write_text(reader)

test_path = Path('src/domain/quranOfflineLibrary.test.ts')
test = test_path.read_text()

test = test.replace(
    "import { describe, expect, it } from 'vitest';",
    "import { afterEach, describe, expect, it, vi } from 'vitest';",
    1,
)
test = test.replace(
    "  listQuranOfflineSurahSummaries,\n",
    "  listQuranOfflineSurahSummaries,\n  loadQuranOfflinePack,\n",
    1,
)
insert_marker = "describe('complete offline Qur’an library navigation', () => {\n"
insert = """describe('complete offline Qur’an library navigation', () => {\n  afterEach(() => {\n    vi.unstubAllGlobals();\n  });\n\n  it('clears a rejected loader promise so a later retry performs a new request', async () => {\n    const fetchMock = vi\n      .fn<typeof fetch>()\n      .mockResolvedValueOnce(new Response('{}', { status: 200 }))\n      .mockResolvedValueOnce(new Response(null, { status: 503 }));\n    vi.stubGlobal('fetch', fetchMock);\n\n    await expect(loadQuranOfflinePack()).rejects.toThrow();\n    await expect(loadQuranOfflinePack()).rejects.toThrow('HTTP 503');\n    expect(fetchMock).toHaveBeenCalledTimes(2);\n  });\n\n"""
if insert_marker not in test:
    raise SystemExit('domain test marker drifted')
test = test.replace(insert_marker, insert, 1)
test_path.write_text(test)

contract = Path('src/ui/QuranLoadRetryV160.test.ts')
contract.write_text("""import { readFileSync } from 'node:fs';\nimport { describe, expect, it } from 'vitest';\n\nconst reader = readFileSync(new URL('./QuranOfflineReader.tsx', import.meta.url), 'utf8');\nconst loader = readFileSync(new URL('../domain/quranOfflineLibrary.ts', import.meta.url), 'utf8');\n\ndescribe('V1.6.0 Qur’an load recovery', () => {\n  it('offers an explicit retry action and returns to loading without mutating reading preferences', () => {\n    expect(reader).toContain('data-quran-load-error');\n    expect(reader).toContain('data-quran-load-retry');\n    expect(reader).toContain('setLoadError(false)');\n    expect(reader).toContain('setLoadAttempt((current) => current + 1)');\n    expect(reader).toContain('}, [loadAttempt]);');\n    const retryBlock = reader.slice(\n      reader.indexOf('data-quran-load-retry'),\n      reader.indexOf('{labels.retry}', reader.indexOf('data-quran-load-retry')),\n    );\n    expect(retryBlock).not.toContain('onPreferencesChange');\n  });\n\n  it('keeps the rejected-promise cache self-healing for HTTP, network and malformed responses', () => {\n    expect(loader).toContain('if (cachedPackPromise === request) cachedPackPromise = null;');\n    expect(loader).toContain('throw new Error(`Qur’an offline pack request failed: HTTP ${String(response.status)}`)');\n    expect(loader).toContain('return validateQuranOfflinePack(payload);');\n  });\n});\n""")

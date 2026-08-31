from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(text: str, before: str, after: str, label: str) -> str:
    if text.count(before) != 1:
        raise SystemExit(f'{label}: expected one match, found {text.count(before)}')
    return text.replace(before, after, 1)

# Reading preferences: only expose bundled Amiri Quran plus the actual system fallback.
p = 'src/platform/quranReadingPreferences.ts'
s = read(p)
s = replace_once(s, "export type QuranArabicFont = 'naskh' | 'traditional' | 'system';", "export type QuranArabicFont = 'amiri-quran' | 'system';", 'font union')
s = replace_once(s, "  arabicFont: 'naskh',", "  arabicFont: 'amiri-quran',", 'default font')
s = replace_once(
    s,
    "function arabicFont(value: unknown): QuranArabicFont {\n  return value === 'naskh' || value === 'traditional' || value === 'system'\n    ? value\n    : defaultQuranReadingPreferences.arabicFont;\n}",
    "function arabicFont(value: unknown): QuranArabicFont {\n  if (value === 'amiri-quran' || value === 'system') return value;\n  if (value === 'naskh' || value === 'traditional') return 'amiri-quran';\n  return defaultQuranReadingPreferences.arabicFont;\n}",
    'font parser',
)
write(p, s)

# Preference coverage includes migration from legacy labels that were not guaranteed to exist.
p = 'src/platform/quranReadingPreferences.test.ts'
s = read(p)
s = replace_once(s, "      arabicFont: 'traditional',", "      arabicFont: 'system',", 'round-trip font')
needle = "  it('toggles bookmarks without mutating the prior state', () => {"
insert = "  it('migrates legacy unbundled font choices to the bundled Qur’anic face', () => {\n    expect(parseQuranReadingPreferences({ arabicFont: 'naskh' }).arabicFont).toBe('amiri-quran');\n    expect(parseQuranReadingPreferences({ arabicFont: 'traditional' }).arabicFont).toBe(\n      'amiri-quran',\n    );\n  });\n\n"
s = replace_once(s, needle, insert + needle, 'legacy migration test')
write(p, s)

# Knowledge picker: only genuinely available/distinct choices.
p = 'src/ui/KnowledgeScreen.tsx'
s = read(p)
s = s.replace('  fontNaskh: string;\n  fontTraditional: string;\n', '  fontAmiri: string;\n')
for before, after in [
    ("    fontNaskh: 'Naskh',\n    fontTraditional: 'Traditional Arabic',\n", "    fontAmiri: 'Amiri Quran',\n"),
    ("    fontNaskh: 'نسخ',\n    fontTraditional: 'عربي تقليدي',\n", "    fontAmiri: 'أميري قرآن',\n"),
    ("    fontNaskh: 'Nesih',\n    fontTraditional: 'Geleneksel Arapça',\n", "    fontAmiri: 'Amiri Quran',\n"),
    ("    fontNaskh: 'Naskh',\n    fontTraditional: 'Arab tradisional',\n", "    fontAmiri: 'Amiri Quran',\n"),
]:
    s = replace_once(s, before, after, 'localized font label')
s = replace_once(
    s,
    '                <option value="naskh">{labels.fontNaskh}</option>\n                <option value="traditional">{labels.fontTraditional}</option>\n                <option value="system">{labels.fontSystem}</option>',
    '                <option value="amiri-quran">{labels.fontAmiri}</option>\n                <option value="system">{labels.fontSystem}</option>',
    'font options',
)
write(p, s)

# Self-hosted font CSS.
write(
    'src/quran-fonts.css',
    """@font-face {
  font-family: 'Salah Amiri Quran';
  src: url('/fonts/amiri-quran-arabic.woff2') format('woff2');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  unicode-range:
    U+0020, U+0600-06FF, U+0750-077F, U+0870-089F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF,
    U+200C-200F, U+202A-202E, U+2066-2069, U+25CC, U+FD3E-FD3F;
}
""",
)

p = 'src/main.tsx'
s = read(p)
s = replace_once(s, "import './islamic-knowledge.css';\n", "import './quran-fonts.css';\nimport './islamic-knowledge.css';\n", 'font css import')
write(p, s)

p = 'src/islamic-knowledge.css'
s = read(p)
s = re.sub(
    r"\.knowledge-card__arabic\[data-quran-font='naskh'\] \{.*?\}\n\n\.knowledge-card__arabic\[data-quran-font='traditional'\] \{.*?\}\n\n",
    ".knowledge-card__arabic[data-quran-font='amiri-quran'] {\n  font-family: 'Salah Amiri Quran', serif;\n}\n\n",
    s,
    count=1,
    flags=re.S,
)
write(p, s)

p = 'src/quran-offline-reader.css'
s = read(p)
s = re.sub(
    r"\.knowledge-card__arabic--naskh \{.*?\}\n\n\.knowledge-card__arabic--traditional \{.*?\}\n\n",
    ".knowledge-card__arabic--amiri-quran {\n  font-family: 'Salah Amiri Quran', serif;\n}\n\n",
    s,
    count=1,
    flags=re.S,
)
write(p, s)

# Record non-package asset licensing/provenance.
p = 'docs/DEPENDENCY_LICENSE_REVIEW.md'
s = read(p).rstrip() + """

## Bundled Qur’anic font: Amiri Quran 1.003

SalahOS self-hosts a subset of **Amiri Quran 1.003** from the upstream `aliftype/amiri` release. The upstream project distributes Amiri under the **SIL Open Font License 1.1 (OFL-1.1)**. The exact release asset is `Amiri-1.003.zip` (upstream SHA-256 `81af0aff7d2086d8af24cea7202f7546130997982534691373485cd96744d05e`).

Release packaging keeps the upstream OFL text at `public/fonts/OFL-Amiri.txt`. The distributed webfont is `public/fonts/amiri-quran-arabic.woff2`, generated from `AmiriQuran.ttf` using FontTools subsetting with Arabic/Qur’anic Unicode coverage and WOFF2 output. FontTools/Brotli are build-time tooling used only to produce the committed asset; they are not added to the npm dependency graph.

The CSS family name `Salah Amiri Quran` distinguishes the bundled application face from host-installed fonts while preserving the upstream notice. No KFGQPC font is bundled or offered by SalahOS in this release; if one is offered later it must remain optional/downloadable and its separate licence/notice restrictions must be reviewed before distribution.
""" + '\n'
write(p, s)

# item4 bootstrap trigger

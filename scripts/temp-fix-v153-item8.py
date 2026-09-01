from pathlib import Path

path = Path('src/ui/HadithHonestyV153.test.tsx')
text = path.read_text(encoding='utf-8')
old = "    const hadithRule = css.match(/\\.knowledge-card__arabic--hadith\\s*\\{[^}]+\\}/u)?.[0] ?? '';"
new = "    const hadithRule = /\\.knowledge-card__arabic--hadith\\s*\\{[^}]+\\}/u.exec(css)?.[0] ?? '';"
if text.count(old) != 1:
    raise SystemExit(f'Expected one lint target, found {text.count(old)}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')

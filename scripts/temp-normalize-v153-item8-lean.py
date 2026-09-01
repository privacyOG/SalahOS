from pathlib import Path

path = Path('src/islamic-knowledge.css')
text = path.read_text(encoding='utf-8')
old = """.knowledge-card--hadith .knowledge-card__arabic--hadith {
  margin-block-end: 0.6rem;
}
"""
new = """.knowledge-card__arabic--hadith {
  margin-block-end: 0.6rem;
  font-family: var(--salah-quran-arabic-font, var(--salah-font-arabic));
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  line-height: 1.75;
}
"""
if text.count(old) != 1:
    raise SystemExit(f'current hadith CSS input: expected one match, found {text.count(old)}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')

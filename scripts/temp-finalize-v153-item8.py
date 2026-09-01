from pathlib import Path

path = Path('TEMP_TODO_V1.5.3.md')
text = path.read_text(encoding='utf-8')

old_header = '## Work Item 8 — Hadith honesty, typography, and scope — OWNER DECISION PENDING'
new_header = '## Work Item 8 — Hadith honesty, typography, and scope — COMPLETE'
if text.count(old_header) != 1:
    raise SystemExit(f'expected one Item 8 pending header, found {text.count(old_header)}')
text = text.replace(old_header, new_header, 1)

old_decision = '- [ ] Decide corpus expansion path with the project owner before implementing expansion.'
new_decision = '- [x] Project owner decision: keep the current curated 3-hadith corpus for v1.5.3 and defer corpus expansion to a separately governed follow-up.'
if text.count(old_decision) != 1:
    raise SystemExit(f'expected one Item 8 decision line, found {text.count(old_decision)}')
text = text.replace(old_decision, new_decision, 1)

path.write_text(text, encoding='utf-8')

from pathlib import Path

tracker = Path('TEMP_TODO_V1.5.3.md')
text = tracker.read_text(encoding='utf-8')
start = text.index("## Work Item 7 — Give the Qur'an its own route and rebuild reading UX")
end = text.index('## Work Item 8 — Hadith honesty, typography, and scope', start)
block = text[start:end]
block = block.replace(
    "## Work Item 7 — Give the Qur'an its own route and rebuild reading UX",
    "## Work Item 7 — Give the Qur'an its own route and rebuild reading UX — COMPLETE",
    1,
)
block = block.replace('- [ ] ', '- [x] ')
tracker.write_text(text[:start] + block + text[end:], encoding='utf-8')

for relative in (
    'scripts/temp-build-v153-item7.py',
    'scripts/temp-fix-v153-item7.py',
    'scripts/temp-finalize-v153-item7.py',
    '.github/workflows/temp-v153-item7-build.yml',
    '.github/workflows/temp-v153-item7-finalize.yml',
):
    path = Path(relative)
    if path.exists():
        path.unlink()

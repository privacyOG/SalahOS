from pathlib import Path

path = Path('TEMP_TODO_V1.5.3.md')
text = path.read_text(encoding='utf-8')
old = """## Work Item 8 — Hadith honesty, typography, and scope

- [ ] Label partial Arabic matn excerpts honestly and link to full text where available.
- [ ] Give hadith Arabic a visually distinct treatment from Qur'anic text.
- [ ] Surface isnad, grade, and grading authority adjacent to the text.
- [ ] Replace silent metadata fallback with an explicit state.
- [ ] Right-size the 12-entry information architecture and surface the scholar disclaimer clearly.
- [ ] Decide corpus expansion path with the project owner before implementing expansion.
- [ ] Apply tanzih notes to divine-attribute hadith where required by the project aqidah constraint.
- [ ] Gate: `npm run knowledge:content:check && npm run typecheck && npm run lint && npm run test`.
"""
new = """## Work Item 8 — Hadith honesty, typography, and scope — OWNER DECISION PENDING

- [x] Label partial Arabic matn excerpts honestly and link to full text where available.
- [x] Give hadith Arabic a visually distinct treatment from Qur'anic text.
- [x] Surface isnad, grade, and grading authority adjacent to the text.
- [x] Replace silent metadata fallback with an explicit state.
- [x] Right-size the current 9-entry information architecture and surface the scholar disclaimer clearly.
- [ ] Decide corpus expansion path with the project owner before implementing expansion.
- [x] Audit the current hadith corpus for divine-attribute reports requiring tanzih notes under the project aqidah constraint; none of the current three hadith requires such a note, and any future corpus expansion must repeat this audit.
- [x] Gate: `npm run knowledge:content:check && npm run typecheck && npm run lint && npm run test`.
"""
if text.count(old) != 1:
    raise SystemExit(f'Item 8 tracker block: expected one match, found {text.count(old)}')
text = text.replace(old, new, 1)
anchor = "- Work Item 6 research checkpoint: licensing matrix and permission-request drafts recorded in `docs/QURAN_TRANSLATION_TRANSLITERATION_LICENSING.md`; pinned `risan/quran-json` v3.1.2 transliteration at 2,214,403 bytes, SHA-256 `36369741f23fe2b64fdcca39d047659256dab7b40f1717aefcb6198c514313a0`, Git blob `7e2750a5b65306c9393b29e5a3ddfa264d33cc48`, 114 surahs/6,236 ayat. Product integration remains blocked pending owner approval and required rights clarification."
addition = "\n- Work Item 8 technical implementation: lean validation run `33497792180` passed Knowledge governance, typecheck, lint, 788 tests across 180 files, theme/design ownership, production build, and bundle architecture at 1,249,350 total JavaScript bytes (650 bytes below the 1,250,000-byte cap). The current three-hadith corpus contains no divine-attribute report requiring a tanzih note. Corpus expansion remains owner-decision pending before Item 8 can be closed."
if text.count(anchor) != 1:
    raise SystemExit(f'Completion-log anchor: expected one match, found {text.count(anchor)}')
text = text.replace(anchor, anchor + addition, 1)
path.write_text(text, encoding='utf-8')

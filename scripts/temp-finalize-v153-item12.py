from pathlib import Path

path = Path('TEMP_TODO_V1.5.3.md')
text = path.read_text(encoding='utf-8')
old = """## Work Item 12 — First-run calculation method and Asr convention

- [ ] Add a second onboarding step after location with only calculation method and Asr convention.
- [ ] Suggest calculation method from an explicit offline ISO-country mapping with documented MWL fallback.
- [ ] Show today's Standard and Hanafi Asr preview times at the user's location.
- [ ] Keep \"Use defaults\" fully available and persist through existing settings storage.
- [ ] Reuse the existing completion-flag onboarding pattern; do not show again after completion.
- [ ] Add domain tests for country mapping and Asr preview computation.
- [ ] Gate: `npm run typecheck && npm run lint && npm run test && npm run format:check`.
"""
new = """## Work Item 12 — First-run calculation method and Asr convention — COMPLETE

- [x] Add a second onboarding step after location with only calculation method and Asr convention.
- [x] Suggest calculation method from an explicit offline ISO-country mapping with documented MWL fallback.
- [x] Show today's Standard and Hanafi Asr preview times at the user's location.
- [x] Keep \"Use defaults\" fully available and persist through existing settings storage.
- [x] Reuse the existing completion-flag onboarding pattern; do not show again after completion.
- [x] Add domain tests for country mapping and Asr preview computation.
- [x] Gate: `npm run typecheck && npm run lint && npm run test && npm run format:check`.
"""
if old not in text:
    raise SystemExit('Item 12 tracker block not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')

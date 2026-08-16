from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(todo, '- [ ] Iqamah settings', '- [x] Iqamah settings')
anchor = '- [x] Iqamah settings\n'
note = (
    "\n**Iqamah-settings verification note (2026-08-16):** read-only Quality Gate run `31926961935` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, the complete test suite and production build after completing the manual local-mosque Iqamah settings surface. Each obligatory prayer can now leave Iqamah unconfigured, use a fixed 24-hour clock time, or use a validated 0–180 minute offset after prayer start. The UI is available in English and Arabic and writes directly into the existing validated mosque-timetable `IqamahRule` model, so local persistence and settings/timetable import-export continue to use the same schema rather than a parallel configuration store. Validation rejects malformed fixed times, out-of-range offsets and offsets that cross into the next civil day. Integration coverage proves an offset rule survives persisted settings reload and resolves to the exact Iqamah minute through the production local-mosque source path.\n"
)
if '**Iqamah-settings verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Iqamah settings controls'
entry = """

### 2026-08-16 — Iqamah settings controls

- Extended manual mosque prayer drafts with an explicit Iqamah mode: unconfigured, fixed local clock time, or offset minutes after prayer start.
- Fixed times continue to use strict 24-hour `HH:MM` parsing; offsets accept integer values from 0 through 180 minutes and reuse the existing timetable validation that rejects next-day rollover.
- Added English/Arabic per-prayer controls that conditionally show the fixed-time or offset input and write directly into the existing mosque-timetable Iqamah rule schema.
- Added domain coverage for fixed, offset and disabled modes plus invalid offsets/fixed times, and `src/integration/iqamahSettings.test.ts` to verify offset persistence and production local-mosque resolution.
- Read-only Quality Gate run `31926961935` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, the complete test suite and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

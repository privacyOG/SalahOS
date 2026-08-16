from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Notification scheduling flow',
    '- [x] Notification scheduling flow',
)
anchor = '- [x] Notification scheduling flow\n'
note = (
    "\n**Notification-scheduling integration verification note (2026-08-16):** read-only Quality Gate run `31923105355` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build after adding an integration fixture across the production notification pipeline. The fixture derives Sydney prayer rows from the production dashboard, creates Fajr reminder and prayer-time intents from user preferences, resolves those civil times through the IANA timezone layer, applies them through the scheduler adapter, then changes the Fajr prayer adjustment by +5 minutes and proves the stable jobs are cancelled and replaced at the new exact instants. Re-applying the same resolved schedule is verified as idempotent with no duplicate scheduling operations.\n"
)
if '**Notification-scheduling integration verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — notification scheduling integration'
entry = """

### 2026-08-16 — notification scheduling integration

- Added `src/integration/notificationScheduling.test.ts` across dashboard prayer calculation, notification preferences, intent generation, IANA civil-time resolution and the scheduler adapter.
- The fixture schedules Fajr reminder/prayer-time jobs, changes the calculated Fajr time by +5 minutes, and verifies stale jobs are cancelled before replacement at the new exact instants.
- A third application of the same resolved schedule performs no operations, proving scheduler reconciliation is idempotent and does not duplicate jobs.
- Read-only Quality Gate run `31923105355` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

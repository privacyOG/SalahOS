from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Re-sync clock/countdown after app resumes from background",
    "- [x] Re-sync clock/countdown after app resumes from background",
)
anchor = "- [x] Re-sync clock/countdown after app resumes from background\n"
note = (
    "\n**Background-resume verification note (2026-08-16):** read-only Quality Gate run `31918624386` passed formatting, typed lint, strict typecheck, all tests and production build after tightening the runtime refresh contract. Focus and page-restore events refresh immediately, while `visibilitychange` refreshes only when the document becomes visible. The `App` refresh callback replaces its wall-clock `now` value, which recomputes the dashboard, current/next prayer and countdown from current time instead of replaying missed interval ticks. Unit coverage verifies hidden visibility changes do not refresh, visible resume does refresh, and listener cleanup still removes every runtime hook. System sleep/wake and significant system-clock change detection remain separate open items.\n"
)
if "**Background-resume verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — background resume refresh"
entry = """

### 2026-08-16 — background resume refresh

- Tightened runtime refresh listeners so hidden document transitions do not trigger work and becoming visible refreshes immediately.
- Focus and page-restore events continue to refresh the application clock immediately.
- The application refresh callback replaces wall-clock `now`, forcing prayer state and countdown recomputation from current time after a background pause.
- Added regression coverage for hidden-to-visible resume behavior and listener cleanup.
- Kept system sleep/wake recovery and significant system-clock change detection as separate open reliability items.
- Read-only Quality Gate run `31918624386` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

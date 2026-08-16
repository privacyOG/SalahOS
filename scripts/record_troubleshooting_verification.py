from pathlib import Path

# Branch-only tracker helper; removed before pull request review.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Document notification platform limitations',
    '- [x] Document notification platform limitations',
)
todo = replace_once(todo, '- [ ] Add troubleshooting section', '- [x] Add troubleshooting section')
anchor = '- [x] Add troubleshooting section\n'
note = (
    "\n**Troubleshooting/documentation verification note (2026-08-16):** read-only Quality Gate run `31928551210` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across all 27 root/docs Markdown files, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification after adding `docs/TROUBLESHOOTING.md`, a README documentation index and an executable local Markdown-link gate. The troubleshooting guide covers the currently implemented shared/Web/PWA install, build/deploy, prayer/location/timezone, DST/date rollover, offline reload, settings, mosque timetable/Iqamah, notification-intent, RTL, service-worker, security/license and bug-report workflows without representing native shells as release-validated. The Stage 19 notification-limitations marker is synchronized here because `docs/NOTIFICATION_LIMITATIONS.md` was already implemented and verified under Stage 10 by Quality Gate run `31913144213`; this tracker update does not claim new native notification delivery capability. README screenshots/platform-status work remains partial.\n"
)
if '**Troubleshooting/documentation verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — troubleshooting and documentation-link verification'
entry = """

### 2026-08-16 — troubleshooting and documentation-link verification

- Added `docs/TROUBLESHOOTING.md` for the currently verified shared/Web/PWA install, deployment, prayer/location/timezone, offline, persistence, mosque/Iqamah, notification-intent, RTL, security/license and reproducible bug-report paths while keeping native platform validation explicitly separate.
- Added a README documentation index linking the build, troubleshooting, notification-limitations, dependency-license, privacy, architecture, research, verification and implementation-tracker documents.
- Added `npm run docs:links`, backed by `scripts/check-doc-links.mjs`, and made it part of both `npm run check` and the read-only Quality Gate.
- The documentation-link verifier successfully resolved local Markdown links across all 27 root/docs Markdown files on the verified branch.
- Synchronized the duplicate Stage 19 notification-platform-limitations marker to complete because `docs/NOTIFICATION_LIMITATIONS.md` was already implemented and verified under Stage 10 by Quality Gate run `31913144213`; no new native delivery capability is claimed by this tracker correction.
- Read-only Quality Gate run `31928551210` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

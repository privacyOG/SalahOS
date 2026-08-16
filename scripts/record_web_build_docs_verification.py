from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(todo, '- [ ] Create `BUILD.md`', '- [x] Create `BUILD.md`')
todo = replace_once(
    todo,
    '- [ ] Document web/PWA build and deployment',
    '- [x] Document web/PWA build and deployment',
)
anchor = '- [x] Document web/PWA build and deployment\n'
note = (
    "\n**Web/PWA build-deployment verification note (2026-08-16):** read-only Quality Gate run `31927318102` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all 238 tests, production build and deploy-artifact verification after adding `BUILD.md` and an executable Web/PWA deployment contract. `BUILD.md` documents the clean lockfile install, full quality gate, production Vite build, local preview, root static-host contract, service-worker/manifest caching requirements, offline smoke checks, upgrade procedure, secrets boundary and an explicit platform matrix that leaves Android, iOS, Raspberry Pi and TV/kiosk release paths unvalidated. CI now runs `npm run verify:web-build` after production build; that verifier requires the built HTML shell, manifest, service worker and first-party icons, validates manifest/start-up expectations and confirms the shipped `dist/sw.js` exactly matches the tested `public/sw.js` source. Native platform build/install documentation and final release-readiness checks remain separately open.\n"
)
if '**Web/PWA build-deployment verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — verified Web/PWA build and deployment contract'
entry = """

### 2026-08-16 — verified Web/PWA build and deployment contract

- Added root `BUILD.md` with the currently verified Web/PWA clean-install, quality, build, preview, static-host deployment, cache/update, offline smoke-check and release-boundary procedures.
- Added `npm run verify:web-build` and made it part of `npm run check` plus the read-only Quality Gate immediately after `npm run build`.
- The verifier requires non-empty built HTML, manifest, service-worker and first-party icon artifacts; validates root/standalone manifest expectations and declared icons; and confirms the deployed `dist/sw.js` is byte-for-byte identical to the `public/sw.js` source exercised by the service-worker lifecycle tests.
- The documented platform matrix deliberately leaves Android, iOS, Raspberry Pi and TV/kiosk build/deployment paths unverified until their real platform-specific gates exist.
- Read-only Quality Gate run `31927318102` passed the sensitive-file policy, dependency vulnerability audit, formatting, typed lint, strict typecheck, all 238 tests, production build and deploy-artifact verification.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

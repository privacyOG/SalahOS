from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Do not commit secrets/API keys',
    '- [x] Do not commit secrets/API keys',
)
anchor = '- [x] Do not commit secrets/API keys\n'
note = (
    "\n**Secrets-policy verification note (2026-08-16):** read-only Quality Gate run `31921396802` passed the sensitive-file policy, formatting, typed lint, strict typecheck, all tests and production build. A root `.gitignore` now excludes local environment files, private keys/certificates, signing stores and platform-local configuration; `scripts/check-sensitive-files.mjs` fails CI when blocked secret-bearing file classes are present in the checkout; and `docs/SECRETS_POLICY.md` prohibits committed credentials/API keys, requires encrypted CI/platform secret stores and documents credential-rotation response. The repository-side filename guard is deliberately not represented as proof that arbitrary source text can never contain a secret, so diff review and hosting-platform secret scanning remain required for future networked integrations.\n"
)
if '**Secrets-policy verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — secrets and credential policy'
entry = """

### 2026-08-16 — secrets and credential policy

- Added a root `.gitignore` covering local environment files, private keys/certificates, signing stores and platform-local configuration.
- Added `scripts/check-sensitive-files.mjs` and wired it into both `npm run check` and the read-only Quality Gate before the existing verification steps.
- Added `docs/SECRETS_POLICY.md` requiring encrypted CI/platform secret stores, prohibiting committed credentials/API keys and documenting revocation/rotation after accidental exposure.
- The repository-side guard intentionally rejects high-risk file classes without claiming filename checks can detect every possible inline secret; future network integrations still require diff review and hosting-platform secret scanning.
- Read-only Quality Gate run `31921396802` passed the sensitive-file policy, formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

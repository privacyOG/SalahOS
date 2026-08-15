from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Prepare signing/build documentation without committing credentials",
    "- [x] Prepare signing/build documentation without committing credentials",
)
anchor = "- [x] Prepare signing/build documentation without committing credentials\n"
note = (
    "\n**iOS build/signing documentation note (2026-08-16):** read-only Quality Gate run `31914265959` passed formatting, typed lint, strict typecheck, all tests and production build after adding `docs/IOS_BUILD_SIGNING.md`. The guide covers local development signing, capability/entitlement review, Release archives, CI secret injection, credential cleanup and distribution-path separation while explicitly prohibiting committed signing keys, certificates, account passwords and distribution secrets. Native Xcode build/archive/device execution remains open until performed on the required Apple environment.\n"
)
if "**iOS build/signing documentation note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — iOS build and signing documentation"
entry = """

### 2026-08-16 — iOS build and signing documentation

- Added `docs/IOS_BUILD_SIGNING.md` with repository-safe local development, Release archive and CI signing procedures.
- Documented capability/entitlement review and required evidence without pre-claiming native support.
- Explicitly prohibited committing signing private keys, certificate bundles, account credentials, distribution API keys and CI secret values.
- Kept actual Xcode build, archive, simulator/device and distribution validation open until executed in the required Apple environment.
- Read-only Quality Gate run `31914265959` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Do not bundle copyrighted Adhan recordings without suitable rights",
    "- [x] Do not bundle copyrighted Adhan recordings without suitable rights",
)
anchor = "- [x] Do not bundle copyrighted Adhan recordings without suitable rights\n"
note = (
    "\n**Adhan audio-rights verification note (2026-08-16):** read-only Quality Gate run `31913475048` passed formatting, "
    "typed lint, strict typecheck, all tests and production build after adding an executable bundled-audio rights policy and "
    "`docs/ADHAN_AUDIO_RIGHTS.md`. Bundled recordings require a stable id, title, rights basis, rights holder/source authority, "
    "evidence reference and attribution where required. Public availability is not treated as redistribution permission. Future "
    "user-selected local audio remains a separate open feature and must not silently become a bundled project asset.\n"
)
if "**Adhan audio-rights verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Adhan audio redistribution rights policy"
entry = """

### 2026-08-16 — Adhan audio redistribution rights policy

- Added `src/domain/adhanAudioRights.ts` with a minimum completeness rule for any future project-bundled Adhan recording.
- Accepted rights bases are public domain, permissive licence or direct permission; each record still requires identified rights evidence.
- Tests reject missing recording identity, title, rights holder/source authority, evidence reference and invalid blank attribution.
- Added `docs/ADHAN_AUDIO_RIGHTS.md` clarifying that public availability does not imply redistribution rights and that uncertain recordings are not eligible for bundling.
- Kept future user-selected local audio separate from project-bundled assets; this batch does not claim local audio selection or playback is implemented.
- Read-only Quality Gate run `31913475048` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [~] Keep internal terminology mathematically precise (`Standard` / `Hanafi`) while explaining madhhab associations in UI",
    "- [x] Keep internal terminology mathematically precise (`Standard` / `Hanafi`) while explaining madhhab associations in UI",
)
anchor = "- [x] Keep internal terminology mathematically precise (`Standard` / `Hanafi`) while explaining madhhab associations in UI\n"
note = (
    "\n**Asr convention explanation verification note (2026-08-16):** read-only Quality Gate run `31912659728` passed "
    "formatting, typed lint, strict typecheck, all tests and production build after adding bilingual explanatory copy while "
    "retaining the engine's precise Standard/Hanafi terminology. The presentation model records Standard as shadow factor 1 "
    "with Shafi'i, Maliki and Hanbali association, and Hanafi as shadow factor 2. The settings UI explains both factors and "
    "that each includes the noon shadow.\n"
)
if "**Asr convention explanation verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)

testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — Asr convention terminology and explanation"
entry = """

### 2026-08-16 — Asr convention terminology and explanation

- Preserved `standard` and `hanafi` as the internal mathematical Asr conventions.
- Added a typed presentation model proving Standard uses shadow factor 1 and Hanafi uses shadow factor 2.
- Recorded the Standard association with Shafi'i, Maliki and Hanbali practice and the Hanafi association separately.
- Added English and Arabic settings guidance that explains the two shadow factors and notes that both include the noon shadow.
- Linked the selector to its explanatory text with `aria-describedby`.
- Read-only Quality Gate run `31912659728` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

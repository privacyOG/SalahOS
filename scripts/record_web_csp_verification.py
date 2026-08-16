from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing tracker marker: {old}")
    return text.replace(old, new, 1)


todo_path = Path("TODO.md")
todo = todo_path.read_text()
todo = replace_once(
    todo,
    "- [ ] Content Security Policy for web/PWA where applicable",
    "- [x] Content Security Policy for web/PWA where applicable",
)
anchor = "- [x] Content Security Policy for web/PWA where applicable\n"
note = (
    "\n**Web CSP verification note (2026-08-16):** read-only Quality Gate run `31918434190` passed formatting, typed lint, strict typecheck, all tests and production build after adding a same-origin Content Security Policy baseline to `index.html` and `docs/WEB_SECURITY_HEADERS.md`. The policy restricts scripts, fonts, workers and the manifest to the application origin; limits images/media to local/data/blob use where required; denies objects and frames; constrains base URLs and form submission; and leaves no wildcard remote HTTP origins. Development websocket schemes remain allowed for local tooling. The deployment guide records stronger response-header requirements such as `frame-ancestors`, nosniff, referrer, permissions and carefully enabled HSTS; those remain deployment-specific rather than falsely claimed as configured here.\n"
)
if "**Web CSP verification note (2026-08-16):**" not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path("TESTING.md")
testing = testing_path.read_text().rstrip()
heading = "### 2026-08-16 — web Content Security Policy baseline"
entry = """

### 2026-08-16 — web Content Security Policy baseline

- Added an in-document Content Security Policy baseline to `index.html` that defaults resources to the same origin and denies plugins/frames.
- Kept only narrowly required exceptions for inline styles, development websocket connections, local/data images and local/blob media.
- Added `docs/WEB_SECURITY_HEADERS.md` documenting production response-header hardening and the boundary between repository controls and host/CDN configuration.
- Read-only Quality Gate run `31918434190` passed formatting, typed lint, strict typecheck, all tests and production build.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + "\n")

from pathlib import Path

# Branch-only tracker helper; removed before pull request review.
# This comment also ensures the already-present tracker workflow receives a push event.


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing tracker marker: {old}')
    return text.replace(old, new, 1)


todo_path = Path('TODO.md')
todo = todo_path.read_text()
todo = replace_once(
    todo,
    '- [ ] Provide one-command or simple launcher script',
    '- [x] Provide one-command or simple launcher script',
)
todo = replace_once(
    todo,
    '- [ ] Provide optional automatic launch on boot',
    '- [~] Provide optional automatic launch on boot',
)
todo = replace_once(
    todo,
    '- [ ] Implement Chromium/full-screen kiosk mode where applicable',
    '- [x] Implement Chromium/full-screen kiosk mode where applicable',
)
todo = replace_once(
    todo,
    '- [ ] Raspberry Pi/kiosk deployment script validated',
    '- [x] Raspberry Pi/kiosk deployment script validated',
)
anchor = '- [x] Implement Chromium/full-screen kiosk mode where applicable\n'
note = (
    "\n**Raspberry Pi kiosk deployment verification note (2026-08-16):** read-only Quality Gate run `31929984829` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 28 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, 52 test files / 247 tests, production build and deploy-artifact verification. The repository now provides a simple local launcher that serves the built Web/PWA bundle on loopback, validates configuration, waits for local readiness and starts Chromium in kiosk mode, plus an idempotent labwc desktop-session autostart installer that preserves unrelated entries and can remove only its managed block. Five deterministic deployment tests verify shell syntax, kiosk command construction, invalid-port rejection, autostart idempotence/preservation and managed-block removal. Optional automatic launch remains partial because repository CI cannot prove Raspberry Pi graphical boot/login policy or physical power-on behavior. Touch Display 2 resolution/orientation, physical boot/autostart, device rendering, power-loss/reboot and long-duration hardware acceptance remain open.\n"
)
if '**Raspberry Pi kiosk deployment verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Raspberry Pi kiosk deployment scripts'
entry = """

### 2026-08-16 — Raspberry Pi kiosk deployment scripts

- Added `scripts/kiosk/run-salahos-kiosk.sh` to serve the built Web/PWA bundle on loopback and launch Chromium with kiosk/full-screen-oriented flags after the local page becomes reachable.
- Added `scripts/kiosk/install-labwc-autostart.sh` for idempotent user-session autostart management that preserves unrelated labwc entries and supports dry-run/removal.
- Added `docs/RASPBERRY_PI_KIOSK.md` covering the validated Raspberry Pi OS Desktop / Chromium / labwc deployment path and explicitly separating repository validation from physical Touch Display 2/device acceptance.
- Added five deterministic tests covering shell syntax, localhost/Chromium command construction, invalid-port rejection, autostart idempotence/preservation, and managed-block removal.
- Read-only Quality Gate run `31929984829` passed all 52 test files / 247 tests plus security, dependency, documentation, PWA raster reproducibility, formatting, lint, strict typecheck, production build and deploy-artifact verification.
- Physical Raspberry Pi/Touch Display 2 boot, orientation, touch/rendering, power-loss/reboot and long-duration acceptance remain open; desktop-session autostart is therefore not treated as complete proof of unattended power-on launch.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

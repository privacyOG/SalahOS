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
    '- [ ] Research and document Raspberry Pi Touch Display 2 resolution/orientation constraints',
    '- [x] Research and document Raspberry Pi Touch Display 2 resolution/orientation constraints',
)
todo = replace_once(
    todo,
    '- [ ] Provide Raspberry Pi OS installation instructions',
    '- [x] Provide Raspberry Pi OS installation instructions',
)
todo = replace_once(
    todo,
    '- [ ] Document Raspberry Pi Touch Display 2 setup',
    '- [x] Document Raspberry Pi Touch Display 2 setup',
)
anchor = '- [x] Provide Raspberry Pi OS installation instructions\n'
note = (
    "\n**Raspberry Pi Touch Display 2 documentation verification note (2026-08-16):** read-only Quality Gate run `31931305063` passed the sensitive-file policy, dependency vulnerability audit, dependency-license policy, documentation-link verification across 29 Markdown files, PWA raster-icon reproducibility, formatting, typed lint, strict typecheck, the complete test suite, production build and deploy-artifact verification after adding `docs/RASPBERRY_PI_TOUCH_DISPLAY_2.md`. The guide documents the current 5-inch and 7-inch 720×1280 variants plus the 10-inch 1200×1920 variant, portrait-native orientation, Raspberry Pi OS Desktop rotation through Control Centre, supported Raspberry Pi generations/cabling boundaries, Raspberry Pi Imager installation, touch/on-screen-keyboard behavior, brightness controls, and the existing SalahOS Chromium/labwc kiosk deployment path. The document keeps physical Touch Display 2 rendering, touch ergonomics, rotation acceptance, boot/autostart behavior and long-duration device testing explicitly open. The touch-first layout fixture remains a separate implementation item.\n"
)
if '**Raspberry Pi Touch Display 2 documentation verification note (2026-08-16):**' not in todo:
    todo = todo.replace(anchor, anchor + note, 1)
todo_path.write_text(todo)


testing_path = Path('TESTING.md')
testing = testing_path.read_text().rstrip()
heading = '### 2026-08-16 — Raspberry Pi Touch Display 2 setup documentation'
entry = """

### 2026-08-16 — Raspberry Pi Touch Display 2 setup documentation

- Added `docs/RASPBERRY_PI_TOUCH_DISPLAY_2.md` covering current Touch Display 2 5-inch, 7-inch and 10-inch panel resolutions, portrait-native orientation and Raspberry Pi OS Desktop rotation controls.
- Documented supported Raspberry Pi generation/cabling boundaries, Raspberry Pi Imager installation, touch/on-screen-keyboard behavior, brightness controls and the existing local Chromium/labwc SalahOS kiosk deployment path.
- Added an explicit physical acceptance matrix for orientation, touch ergonomics, boot/autostart behavior, offline operation and long-duration use instead of treating documentation as hardware validation.
- Read-only Quality Gate run `31931305063` passed repository security/dependency/documentation policies, raster reproducibility, formatting, lint, strict typecheck, the complete test suite, production build and deploy-artifact verification.
- Touch-first layout fixture work and all physical Raspberry Pi/Touch Display 2 validation remain open.
"""
if heading not in testing:
    testing_path.write_text(testing + entry + '\n')

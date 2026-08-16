from pathlib import Path

# Branch-only integration helper; removed before pull request review.

readme_path = Path('README.md')
readme = readme_path.read_text()
old_docs = '- [Build and Web/PWA deployment](BUILD.md)\n- [Troubleshooting](docs/TROUBLESHOOTING.md)\n'
new_docs = '- [Build and Web/PWA deployment](BUILD.md)\n- [Tested platform/build status](docs/PLATFORM_STATUS.md)\n- [Troubleshooting](docs/TROUBLESHOOTING.md)\n'
if old_docs not in readme and new_docs not in readme:
    raise RuntimeError('Missing README documentation anchor')
if new_docs not in readme:
    readme = readme.replace(old_docs, new_docs, 1)

platform_section = '''## Platform status

- **Web / PWA:** automated build and repository verification path.
- **Raspberry Pi / Touch Display 2:** repository-validated browser/kiosk deployment path; physical Touch Display 2 acceptance remains open.
- **TV / generic kiosk:** repository-validated browser-hosted smart-display path; target TV/remote acceptance remains open.
- **Android:** native shell/build and native adapters remain planned, not validated.
- **iOS / iPadOS:** native shell/build and native adapters remain planned, not validated.

See [Tested platform/build status](docs/PLATFORM_STATUS.md) for the exact evidence and capability boundaries.

'''
if '## Platform status\n' not in readme:
    anchor = '## Development\n'
    if anchor not in readme:
        raise RuntimeError('Missing README development anchor')
    readme = readme.replace(anchor, platform_section + anchor, 1)
readme_path.write_text(readme)

build_path = Path('BUILD.md')
build = build_path.read_text()
old_table = '''| Target                       | Current status                                  | Verified path                                |
| ---------------------------- | ----------------------------------------------- | -------------------------------------------- |
| Web / PWA                    | Implemented and automated                       | `npm run build` + `npm run verify:web-build` |
| Android                      | Native build path not yet implemented/validated | Tracked in `TODO.md`                         |
| iOS                          | Native build path not yet implemented/validated | Tracked in `TODO.md`                         |
| Raspberry Pi Touch Display 2 | Deployment path not yet validated               | Tracked in `TODO.md`                         |
| TV / kiosk                   | Deployment path not yet validated               | Tracked in `TODO.md`                         |

The shared web application can be exercised on browser-capable devices, but that does not replace platform-specific validation still marked open in `TODO.md`.
'''
new_table = '''| Target                       | Current status                  | Verified path / boundary                                               |
| ---------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| Web / PWA                    | Implemented and automated       | `npm run build` + `npm run verify:web-build`; automated offline tests  |
| Raspberry Pi Touch Display 2 | Repository-validated kiosk path | Launcher, deployment docs, viewport fixture and continuity tests       |
| TV / kiosk                   | Repository-validated browser path | Smart-display mode, kiosk URL path, usability tests and deployment docs |
| Android                      | Native path planned             | Shared application only; native project/build/device validation open   |
| iOS / iPadOS                 | Native path planned             | Shared application only; native project/build/device validation open   |

The Raspberry Pi and TV rows describe browser-hosted deployment paths verified in the repository, not completed physical-device acceptance. Android and iOS/iPadOS do not yet have validated native shells. See `docs/PLATFORM_STATUS.md` for the exact tested matrix and remaining boundaries.
'''
if old_table not in build and new_table not in build:
    raise RuntimeError('Missing BUILD current-status table')
if new_table not in build:
    build = build.replace(old_table, new_table, 1)

old_gate = '''This runs, in order:

1. sensitive-file policy
2. dependency vulnerability audit
3. formatting check
4. lint
5. strict TypeScript typecheck
6. automated tests
7. production web build
8. deployable web-artifact verification
'''
new_gate = '''This runs, in order:

1. sensitive-file policy
2. dependency vulnerability audit
3. dependency-license policy
4. documentation-link verification
5. formatting check
6. lint
7. strict TypeScript typecheck
8. automated tests
9. production web build
10. deployable web-artifact verification
'''
if old_gate in build:
    build = build.replace(old_gate, new_gate, 1)

old_boundary = '''A successful Web/PWA build does not imply that Android, iOS, Raspberry Pi or TV/kiosk packages have been built or tested. Those targets remain governed by their separate TODO and release-readiness gates. Only mark a platform complete when its actual build/install/deployment path has been exercised in the applicable environment.'''
new_boundary = '''A successful Web/PWA build does not imply that Android or iOS/iPadOS native packages exist, nor does repository validation of the Raspberry Pi/TV browser paths imply physical target-device acceptance. Those targets remain governed by their separate TODO and release-readiness gates. Only claim the level of validation recorded in `docs/PLATFORM_STATUS.md`, and only mark a native or physical platform complete when its applicable build/install/deployment and target-device checks have been exercised.'''
if old_boundary not in build and new_boundary not in build:
    raise RuntimeError('Missing BUILD release-boundary paragraph')
if new_boundary not in build:
    build = build.replace(old_boundary, new_boundary, 1)
build_path.write_text(build)

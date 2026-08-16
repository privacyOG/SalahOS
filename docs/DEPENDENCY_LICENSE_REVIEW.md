# Dependency license review

SalahOS treats dependency licensing as a release-quality gate rather than a one-time manual checklist.

## Scope

The repository's `package-lock.json` is the authoritative dependency inventory for the JavaScript/Web build. The lockfile records the installed package graph and license metadata for direct and transitive packages. The command below reviews every non-root package entry in that graph:

```bash
npm run security:licenses
```

The same command runs in the read-only Quality Gate after the clean lockfile install and vulnerability audit.

## Policy

The automated check is intentionally conservative:

- every lockfile package must declare a non-empty license expression;
- production dependencies must use one of the explicitly approved permissive licenses in `scripts/check-dependency-licenses.mjs`;
- development-only dependencies may use the same permissive licenses plus specifically reviewed build-tool exceptions;
- unknown, missing, source-available, restrictive, custom, or unreviewed copyleft/exception-bearing expressions fail closed;
- both production and development-only packages are checked;
- the script reports production and development-only package counts plus the observed approved license expressions for audit evidence.

A new license identifier must not be added merely to make CI green. The dependency classification and distribution impact must be reviewed first.

## Current development-tool exception: MPL-2.0

The current lockfile includes `lightningcss` and its optional platform binaries as development-only dependencies under MPL-2.0. They are build tooling and are not included as dependency packages in the generated Web/PWA deployment artifact.

Mozilla describes MPL 2.0 as file-level copyleft. Its FAQ explains that use alone does not create distribution obligations, while distribution of MPL-covered executable/source forms can require source-availability notices for the covered MPL code. See:

- <https://www.mozilla.org/en-US/MPL/2.0/FAQ/>

For SalahOS, MPL-2.0 is therefore admitted only by the **development-only** license set. If an MPL-2.0 package becomes a production dependency, the license gate will fail until that new distribution scenario is separately reviewed. This exception does not approve GPL, AGPL, SSPL, business/source-available licenses, or arbitrary copyleft licenses.

## What this check does not claim

This automated policy is a technical compliance control, not legal advice. It does not replace review of unusual attribution, notice, patent, trademark, content, dataset, media, or platform-license obligations. It also does not grant rights to third-party assets merely because a JavaScript package uses an approved software license.

Bundled Adhan recordings remain governed separately by `docs/ADHAN_AUDIO_RIGHTS.md`.

## Dependency changes

When adding or updating a package:

1. update dependencies through npm so `package-lock.json` stays authoritative;
2. run `npm ci --ignore-scripts` from a clean checkout;
3. run `npm run security:audit`;
4. run `npm run security:licenses`;
5. inspect any newly observed license expression before changing either allowlist;
6. confirm whether the package is production or development-only in the lockfile;
7. run the complete `npm run check` gate;
8. record any exceptional notice/attribution obligation in repository documentation before release.

A package whose license cannot be confidently classified must remain blocked until the licensing question is resolved or the package is removed/replaced.

## Release review boundary

Passing this gate establishes that the exact dependency graph pinned by the committed npm lockfile declares only approved license expressions under this policy, with the current MPL-2.0 exception restricted to development-only tooling. Native Android/iOS dependencies, operating-system packages, browser/runtime licenses, externally hosted content, user-supplied files, and future platform integrations require their own review when those components are introduced.

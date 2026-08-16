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
- every license identifier in that expression must be on the project's approved permissive-license allowlist;
- unknown, missing, restrictive, copyleft, source-available, custom, or exception-bearing expressions fail closed and require explicit human review before the allowlist can change;
- both production and development-only packages are checked;
- the script reports production and development-only package counts plus the observed approved license expressions for audit evidence.

The current allowlist is maintained in `scripts/check-dependency-licenses.mjs`. It contains only licenses that are treated as permissive for the current project dependency policy. Adding a new identifier to that list must be a deliberate repository change with normal review and CI evidence; a failing dependency must not be bypassed merely to make the gate green.

## What this check does not claim

This automated policy is a technical compliance control, not legal advice. It does not replace review of unusual attribution, notice, patent, trademark, content, dataset, media, or platform-license obligations. It also does not grant rights to third-party assets merely because a JavaScript package uses an approved software license.

Bundled Adhan recordings remain governed separately by `docs/ADHAN_AUDIO_RIGHTS.md`.

## Dependency changes

When adding or updating a package:

1. update dependencies through npm so `package-lock.json` stays authoritative;
2. run `npm ci --ignore-scripts` from a clean checkout;
3. run `npm run security:audit`;
4. run `npm run security:licenses`;
5. inspect any newly observed license expression before changing the allowlist;
6. run the complete `npm run check` gate;
7. record any exceptional notice/attribution obligation in repository documentation before release.

A package whose license cannot be confidently classified must remain blocked until the licensing question is resolved or the package is removed/replaced.

## Release review boundary

Passing this gate establishes that the exact dependency graph pinned by the committed npm lockfile declares only approved license expressions under this policy. Native Android/iOS dependencies, operating-system packages, browser/runtime licenses, externally hosted content, user-supplied files, and future platform integrations require their own review when those components are introduced.

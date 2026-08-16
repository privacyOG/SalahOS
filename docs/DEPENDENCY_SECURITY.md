# Dependency security review

SalahOS uses a committed npm lockfile and installs dependencies in CI with `npm ci --ignore-scripts` so the resolved dependency graph is reproducible and package lifecycle scripts do not execute during installation.

## Automated review

The Quality Gate runs `npm run security:audit`, which executes npm's vulnerability audit against the committed lockfile and fails when a known vulnerability at moderate severity or above is present. The same command is included in `npm run check` for local verification.

A passing audit is a point-in-time check against the vulnerability data available to the package registry. It does not prove that a dependency is permanently safe. Dependency changes must therefore continue to be reviewed through the lockfile diff and normal code review.

## Current direct dependencies

Runtime dependencies are intentionally small:

- `@photostructure/tz-lookup` provides offline coordinate-to-IANA-timezone lookup.
- `react` and `react-dom` provide the shared application UI runtime.

Development dependencies are limited to formatting, linting, TypeScript, Vite, React build support and Vitest testing tooling.

## Update policy

- Keep exact dependency versions and the lockfile committed.
- Review dependency and lockfile changes together.
- Do not bypass or lower the vulnerability threshold merely to make CI pass; investigate and document any unavoidable exception before accepting it.
- Prefer removing an unnecessary dependency over adding a workaround around it.
- Re-run the audit immediately before a release because advisory data changes over time.
- Treat build-time dependencies as part of the security boundary even when they are not shipped to end users.

License compatibility is reviewed separately from vulnerability status in the final dependency/license quality gate.

# Repository secret handling

SalahOS must not store private credentials, signing material or service keys in version control.

## Repository rules

- Keep local environment configuration outside tracked files. `.env` variants are ignored; a future `.env.example` may contain names and non-sensitive placeholders only.
- Do not commit private-key or certificate-container files. The repository ignore rules cover common local credential containers.
- Do not paste private-key blocks into source, tests, examples, issue fixtures or documentation.
- Store deployment credentials in the target platform's protected secret store and inject them only at runtime/build time when a feature genuinely requires them.
- Keep signing credentials outside the repository. Existing Android/iOS signing guidance remains authoritative for native distribution material.
- If sensitive material is accidentally committed, removing it in a later commit is insufficient. Revoke/rotate it and remove it from repository history using an appropriate incident process.

## Executable guard

The unit suite includes a tracked-file policy test. It reads `git ls-files` and fails when prohibited local-environment/private credential-container paths are tracked or when tracked text contains a private-key block marker. Because the standard Quality Gate runs the complete test suite, these checks run on every branch and pull request without changing the permanent CI workflow.

This guard is intentionally high-confidence rather than a replacement for a full external secret-scanning service. Future provider integrations should add provider-specific detection only when it can be done without false-positive-prone broad token matching.

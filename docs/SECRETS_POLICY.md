# Secrets and credential handling

SalahOS must not commit private credentials, API keys, signing keys, certificates, passwords, access tokens or platform-specific secret configuration to version control.

## Repository rules

- Keep local environment files outside version control. `.env.example` may contain variable names and non-secret placeholders only.
- Keep Android signing stores, Apple signing material, private keys, certificates and local platform configuration outside the repository.
- Do not place credentials directly in source code, tests, documentation, fixtures, sample configuration or generated artifacts.
- Do not use a real credential as a placeholder or test value.
- CI/CD credentials must be supplied through the repository or deployment platform's encrypted secret store and exposed only to the job that needs them.
- Native application signing credentials must remain in the relevant local keychain/keystore or CI secret store and must never be added to the repository.
- Optional remote integrations must read credentials from an injected runtime/build secret mechanism rather than a committed constant.

## Enforcement

The root `.gitignore` blocks common local environment, private-key, signing and platform-local files. The Quality Gate also runs `npm run security:sensitive-files`; it fails when blocked secret-bearing file classes are present in the checkout, including local environment files, signing stores, private key/certificate files and common credential configuration filenames.

This repository-side guard is intentionally conservative and does not claim that filename checks can prove arbitrary source text contains no secret. Before release or after adding any networked integration, maintainers must also review the diff for inline credentials and use the hosting platform's secret-scanning controls where available.

## Response to accidental exposure

If a credential is ever committed, treat it as compromised even if the commit is later removed. Revoke or rotate it first, remove it from current history as appropriate, verify no dependent deployment still uses it, and document the remediation without reproducing the credential value.

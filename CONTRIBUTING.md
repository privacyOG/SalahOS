# Contributing to SalahOS

**Author:** privacyOG

## Development rules

- Keep prayer-domain code deterministic and independent from UI, network, GPS, storage, and platform APIs.
- Use strict TypeScript.
- Do not hard-code user-facing text inside reusable UI components; use localisation keys.
- Keep raw astronomical results separate from rounded/displayed/adjusted values.
- Preserve calculation provenance through every transformation.
- Never log precise coordinates in ordinary diagnostics.
- Validate all imported configuration/timetable data.
- Add or update tests for behavioural changes.
- Update `TODO.md` only when an item has genuinely reached its documented status.
- Update `CHANGELOG.md` for notable user-facing or architectural changes.

## Branches and commits

Use short, descriptive branches and focused commits. Avoid combining unrelated refactors with functional changes.

## Quality gate

Before a milestone is marked complete, the repository must pass its formatting, lint, strict typecheck, automated tests, and production build checks where those checks apply to the milestone.

## Documentation

Architectural decisions belong in `DESIGN.md`; calculation/platform research belongs in `RESEARCH.md`; verification evidence belongs in `TESTING.md`.

# Release blocker review

This document records the release-readiness blocker review for the SalahOS 0.1.0 candidate. It does not replace `TODO.md`; the tracker remains the authoritative completion state.

## `[!]` tracker review

At the time of this review, `TODO.md` contains no task that is actually marked `[!] Blocked`. The only `[!]` text in the file is the status legend and the Stage 20 instruction to review blocked items.

Open work therefore remains represented as `[ ] Not started` or `[~] In progress` rather than being relabelled as blocked without evidence.

## Current external validation constraint

GitHub-hosted workflow jobs have intermittently failed before a runner is assigned. The affected jobs report no executed steps/logs rather than a repository command failure. This prevents the consolidated release-candidate head from obtaining fresh exact-head Quality/Android/iOS evidence while the condition persists.

This is treated as a validation constraint, not as proof that the candidate passes and not as a reason to mark affected tracker items complete. No pull request should be opened from the release candidate until branch validation executes real steps and passes.

## Physical/environmental release evidence still open

The following open tracker classes require applicable target environments and must not be inferred from repository-only checks:

- physical Raspberry Pi Touch Display 2 rendering/touch acceptance;
- TV overscan, remote/CEC navigation and viewing-distance acceptance where applicable;
- final physical phone/tablet layout acceptance where required;
- Android notification delivery in a supported native test environment;
- iOS notification delivery in a supported native test environment;
- platform-specific lifecycle, power-management or DST behaviour that cannot be exercised by the available automated environment.

Automated browser viewport fixtures, emulators and simulators can provide useful software evidence but do not replace the physical/environmental checks above.

## Calculation-method research status

Diyanet/Turkey and Dubai remain intentionally marked `pending-authoritative-source` in the calculation-method registry. This is a verification state, not a runtime blocker: the methods are clearly labelled and the repository does not claim institutional certification. The release decision should preserve those disclosures unless authoritative parity is established and tested.

## Release-tag rule

Do not create the first release tag until:

1. the consolidated release candidate passes its own exact-head repository, Android and iOS gates where applicable;
2. visual artifacts are inspected and the applicable software layout checks are reconciled with `TODO.md`;
3. physical/environmental acceptance items are completed or explicitly left outside the release scope with accurate documentation;
4. final documentation/tracker synchronization is complete;
5. no unresolved issue is being hidden by changing a task from open/partial to complete without evidence.

---

**Author:** privacyOG

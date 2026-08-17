import { readFile, writeFile } from 'node:fs/promises';

async function replaceExact(path, before, after) {
  const content = await readFile(path, 'utf8');
  if (!content.includes(before)) {
    throw new Error(`Expected reconciliation text not found in ${path}`);
  }
  await writeFile(path, content.replace(before, after));
}

await replaceExact(
  'README.md',
  "SalahOS v1 is not tagged yet. The implementation tracker remains authoritative and release tagging is blocked until the applicable visual/device validation, notification/Adhan, remaining method/reference work and a fresh exact-head quality-gate run are complete. Hosted workflow runners are currently unable to start because the repository account's Actions billing/spending state requires attention; this is recorded as an infrastructure blocker rather than a passing or failing application test.",
  "SalahOS v1 is not tagged yet. The implementation tracker remains authoritative and release tagging is blocked until the remaining visual/device validation, notification/Adhan, calculation-method/reference and final regression requirements are complete. The Linux Quality Gate and Android Build now run on the self-hosted EVO-X2 runner and passed on exact main commit `3980a67ed13243d15438d5303ac2fdfd76db6d5f` in runs `31986937094` and `31986937065`. The iOS build remains macOS/Xcode-only; its current hosted macOS job cannot start because the account billing/spending state requires attention, so that infrastructure limitation is kept separate from the passing Linux evidence."
);

await replaceExact(
  'docs/PLATFORM_STATUS.md',
  `## Current quality-gate infrastructure status

The repository quality workflows are configured to use clean hosted runners and the committed lockfile. Previous recorded runs establish the implemented Web/PWA, Android and iOS build evidence described above.

The exact current main revision cannot presently obtain a fresh hosted-runner result because GitHub Actions is refusing to start jobs while the account billing/spending state requires attention. This is an infrastructure blocker: affected jobs terminate before checkout or test steps begin. It must not be represented as either an application test pass or an application test failure.

Once runner access is restored, the exact release revision must pass the complete repository quality gate and applicable Android/iOS build workflows before a release tag is created.`,
  `## Current quality-gate infrastructure status

The Linux Quality Gate and Android Build now target the repository's self-hosted Linux/x64 runner. The Android workflow bootstraps Android SDK API 36 and build-tools 36.0.0 so it does not depend on a user-specific SDK installation.

Exact main commit \`3980a67ed13243d15438d5303ac2fdfd76db6d5f\` passed Quality Gate run \`31986937094\` and Android Build run \`31986937065\` on the self-hosted EVO-X2. The complete Quality Gate passed lockfile installation, security policies, dependency audit/licensing, documentation links, raster-icon reproducibility, formatting, lint, strict typecheck, tests, production build and deploy-artifact verification.

The iOS workflow intentionally remains on macOS because Xcode/iOS Simulator builds cannot run on the Linux EVO-X2. The current exact-main macOS job was rejected before any step executed because the account billing/spending state requires attention. Historical successful Xcode Simulator evidence remains valid for the implementation it exercised, but a current exact-release iOS build still requires an available macOS runner.

Before a release tag is created, the exact release revision must retain a passing Quality Gate and applicable Android build, and the iOS build requirement must either pass on an available macOS runner or remain an explicit unresolved release blocker.`
);

await replaceExact(
  'TODO.md',
  `**Release-blocker reconciliation note (2026-08-17):** all current \`[!]\` items above and in Stages 7, 9 and 11 identify the missing target environment explicitly. In addition, GitHub-hosted Quality Gate, Android Build and iOS Build jobs for PR #88 were created but did not start because the account's Actions billing/spending state blocked runner execution; the check annotation reports that billing/spending condition before any checkout/test step. This blocks a fresh exact-head automated release gate but is not an application test failure. The repository must not be tagged while these applicable blockers remain.`,
  `**Release-blocker reconciliation note (2026-08-17):** all current \`[!]\` items above and in Stages 7, 9 and 11 identify the missing target environment explicitly. PR #91 moved the Linux Quality Gate and Android Build to the self-hosted EVO-X2 runner. Exact merged-main commit \`3980a67ed13243d15438d5303ac2fdfd76db6d5f\` passed Quality Gate \`31986937094\` and Android Build \`31986937065\`. The iOS workflow remains macOS/Xcode-only, and current run \`31986937067\` was rejected before any step executed because the account billing/spending state still blocks hosted macOS execution. This remaining macOS infrastructure limitation is not an application test failure, and the repository must not be tagged while applicable iOS/device/visual/release blockers remain.`
);

await replaceExact(
  'TODO.md',
  `- [!] Automated quality gates pass — previous recorded gates pass, but a fresh exact-head run is blocked by the current Actions billing/spending runner condition`,
  `- [~] Automated quality gates pass — exact-main Linux Quality Gate and Android Build pass on the self-hosted EVO-X2; current exact-main iOS/macOS build remains infrastructure-blocked before job execution`
);

await replaceExact(
  'docs/VALIDATION_2026-08-17.md',
  `## Hosted workflow infrastructure blocker

Hosted Quality Gate, Android Build and iOS Build checks created for PR #88 terminated before normal job execution. GitHub's check annotation states that the jobs were not started because the account's recent payments/spending limit requires attention.

No checkout, dependency install, build or test step executed in those affected runs. The condition is therefore recorded as a hosted-runner infrastructure blocker, not as an application test failure and not as passing evidence.

A fresh exact-head hosted quality/build result remains required before a v1 release tag can be created.`,
  `## Self-hosted Linux validation and remaining macOS blocker

PR #91 moved the Linux Quality Gate and Android Build to the self-hosted Linux/x64 runner named \`evo-x2\`. The Android workflow also gained reproducible Android SDK API 36/build-tools setup after the first self-hosted run correctly exposed a missing SDK environment.

Exact PR head \`0eb779d995913da37a8381611152c119358bbf2e\` passed Quality Gate \`31986806263\` and Android Build \`31986806252\`. After squash merge, exact main commit \`3980a67ed13243d15438d5303ac2fdfd76db6d5f\` passed Quality Gate \`31986937094\` and Android Build \`31986937065\` on the EVO-X2.

The exact-main Quality Gate passed the clean lockfile install, sensitive-file/native/network policies, dependency vulnerability and licence checks, documentation links, PWA icon reproducibility, formatting, lint, strict typecheck, complete tests, production build and deploy-artifact verification. The exact-main Android run passed Node/Java setup, Android SDK bootstrap, lockfile installation, Capacitor synchronization and debug APK assembly.

The iOS workflow remains correctly macOS/Xcode-only. Exact-main iOS run \`31986937067\` was rejected before checkout or any build/test step because the account billing/spending state still blocks the hosted macOS runner. That is an isolated macOS infrastructure blocker, not an application test failure and not a limitation of the EVO-X2 Linux runner.`
);

await replaceExact(
  'docs/VALIDATION_2026-08-17.md',
  `- a fresh exact-head complete quality/build gate after hosted runner access is restored.`,
  `- a current exact-release iOS/macOS build when an eligible macOS runner is available; Linux Quality Gate and Android Build already have exact-main self-hosted evidence.`
);

console.log('Self-hosted validation evidence reconciled.');

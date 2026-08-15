# iOS and iPadOS build and signing guide

This document defines the repository-safe build and signing workflow for the future SalahOS native iOS/iPadOS shell. It intentionally contains no signing credentials, private keys, provisioning profiles or App Store Connect secrets.

## Preconditions

Native iOS packaging requires:

- a supported macOS host;
- a supported Xcode release;
- an Apple Developer account appropriate for the intended distribution path;
- a unique application bundle identifier owned by the project maintainer;
- a native shell that embeds or hosts the shared SalahOS application logic;
- any required capabilities declared explicitly in the Xcode target.

The shared TypeScript/web build passing CI is not evidence that the native Xcode target compiles, signs, archives or runs on-device.

## Local development build

1. Open the native workspace/project in Xcode.
2. Select the intended application target and a development Team.
3. Set a unique Bundle Identifier for the target.
4. Prefer automatic signing for ordinary local development unless a specific deployment environment requires managed profiles.
5. Confirm the minimum deployment target and supported device families before building.
6. Build first for an available Simulator, then for a connected test device.
7. Record Xcode version, target OS version, device/simulator model and result in `TESTING.md`.

Do not change shared application behaviour merely to make signing succeed. Signing configuration and application functionality are separate concerns.

## Capabilities and entitlements

Enable only capabilities the final native implementation actually needs. Potential examples include local notifications or background/audio capabilities, but no capability should be added pre-emptively.

For every enabled capability:

- document why it is required;
- keep the entitlement file reviewable in the repository when it contains no secret material;
- verify the capability exists on the selected App ID/profile;
- test the associated runtime behaviour on the required target environment.

Entitlements are configuration, not credentials. Certificates, private keys and authenticated service tokens remain outside the repository.

## Release archive

Before creating a release archive:

1. Use the intended Release configuration.
2. Confirm the production bundle identifier, version and build number.
3. Confirm the selected Team and distribution method.
4. Build the native target cleanly.
5. Run the project quality gate for the shared application revision being packaged.
6. Create an Xcode Archive from the exact tested revision.
7. Run Xcode validation before export or upload.
8. Record the archive revision and validation result in `TESTING.md` or release evidence.

A successful web production build must not be described as a successful iOS archive.

## Credential handling

The following must never be committed:

- signing certificate private keys;
- exported `.p12` certificate bundles;
- provisioning profiles containing account-specific distribution material unless a future reviewed policy explicitly permits a non-secret managed profile;
- App Store Connect API private keys;
- Apple account passwords or app-specific passwords;
- CI secret values;
- authentication cookies, sessions or generated bearer tokens.

Local credentials belong in the macOS Keychain and Xcode-managed signing state. CI credentials belong in the CI provider's encrypted secret store or an approved external secret manager.

Repository examples may use placeholder identifiers only. They must not contain real secret values.

## Continuous integration

If native iOS CI is added later, use a macOS runner and inject credentials at runtime from encrypted secrets. The workflow should:

- check out an exact revision;
- install deterministic project dependencies;
- build/test the native target;
- import temporary signing material only for jobs that require signing;
- remove temporary keychains/files during cleanup;
- avoid printing secret values in logs;
- publish only intended build/test artifacts.

Unsigned simulator/test builds should be preferred where signing is unnecessary.

## Distribution paths

Treat each distribution path separately because signing and entitlement requirements differ:

- local development/device testing;
- internal or external TestFlight distribution;
- App Store release;
- any future enterprise/custom distribution path for which the project is actually eligible.

Do not document a distribution method as supported merely because Xcode exposes it.

## Completion evidence

The tracker item for signing/build documentation can be completed when this repository-safe procedure is reviewed and CI remains green. Native build, simulator/device, archive, TestFlight and App Store items remain open until executed in the required Apple environment and their evidence is recorded.

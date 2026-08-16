# iOS and iPadOS build, install and signing guide

This document defines the repository-safe build, simulator/device installation and signing workflow for the SalahOS iOS/iPadOS shell. It contains no signing credentials, private keys, provisioning profiles or distribution secrets.

## Preconditions

Native iOS packaging requires:

- a supported macOS host;
- a supported Xcode release and command-line tools;
- Node.js 22 or later;
- an Apple Developer account for signed physical-device or distribution builds;
- a unique application bundle identifier owned by the project maintainer for distribution;
- any required capabilities declared explicitly in the Xcode target.

The committed native project is `ios/App/App.xcodeproj`. The application reuses the shared SalahOS TypeScript/React application and domain logic through Capacitor.

## Prepare the native project

From the repository root:

```bash
npm ci --ignore-scripts
npm run check
npm run build
npx cap sync ios
```

`cap sync ios` copies the current web bundle and synchronises the pinned Capacitor native dependencies. Re-run it whenever web assets, Capacitor configuration or native plugin dependencies change.

## Build for iOS Simulator

The same unsigned simulator build used by repository CI can be run locally:

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$PWD/.derived-data/ios" \
  CODE_SIGNING_ALLOWED=NO \
  build
```

For interactive testing, open `ios/App/App.xcodeproj` in Xcode, select an installed iPhone or iPad Simulator, and run the `App` scheme. This is the preferred path for responsive-layout, offline cold-start and local-notification acceptance because it launches the actual native shell rather than only compiling it.

### Command-line simulator install

After building for a booted simulator, locate the generated `App.app` under the selected DerivedData build products and install it with:

```bash
xcrun simctl install booted /path/to/App.app
xcrun simctl launch booted com.privacyog.salahos
```

If the bundle identifier is changed for a local target, use that target's actual identifier in the launch command.

## Install on a physical iPhone or iPad

1. Open `ios/App/App.xcodeproj` in Xcode.
2. Select the `App` target and choose the intended development Team under Signing & Capabilities.
3. Confirm the Bundle Identifier is valid for that Team.
4. Connect and trust the test device, then select it as the run destination.
5. Build and run the `App` scheme.
6. Grant only the permissions required by the feature being exercised.
7. Record the Xcode version, iOS/iPadOS version, device model and acceptance result in `TESTING.md`.

A physical-device run requires local signing state. Certificates, private keys and account credentials remain outside the repository.

## Capabilities and entitlements

Enable only capabilities the implementation actually needs. Every enabled capability must be justified, documented and tested on its target environment.

Current permission boundaries are documented in `NATIVE_PERMISSIONS.md`. In particular, current location acquisition is user-initiated and foreground-only; always/background location capability must not be added without a new reviewed requirement.

Entitlements are configuration, not credentials. Certificates, private keys and authenticated service tokens remain outside the repository.

## Release archive

Before creating a release archive:

1. Use the intended Release configuration.
2. Confirm the production bundle identifier, version and build number.
3. Confirm the selected Team and distribution method.
4. Run `npm ci --ignore-scripts`, `npm run check`, `npm run build` and `npx cap sync ios` from the exact release revision.
5. Build the native target cleanly.
6. Create an Xcode Archive from that exact tested revision.
7. Run Xcode validation before export or upload.
8. Record the archive revision and validation result in `TESTING.md` or the release evidence.

A successful web production build or unsigned simulator build must not be described as a successful signed release archive.

## Credential handling

The following must never be committed:

- signing certificate private keys;
- exported `.p12` certificate bundles;
- account-specific distribution provisioning material;
- App Store Connect API private keys;
- Apple account passwords or app-specific passwords;
- CI secret values;
- authentication cookies, sessions or generated bearer tokens.

Local credentials belong in the macOS Keychain and Xcode-managed signing state. CI credentials belong in the CI provider's encrypted secret store or an approved external secret manager.

Repository examples may use placeholder identifiers only. They must not contain real secret values.

## Continuous integration

The committed `.github/workflows/ios.yml` uses a macOS runner, installs the exact npm lockfile, runs the repository quality gate, synchronises the native project and compiles an unsigned generic iOS Simulator application with Xcode. This verifies that the native project compiles without requiring distribution credentials.

Signed device/archive jobs, if added later, must inject signing material at runtime, remove temporary keychains/files during cleanup, avoid printing secret values, and publish only intended artifacts.

## Distribution paths

Treat each distribution path separately because signing and entitlement requirements differ:

- local development/device testing;
- internal or external TestFlight distribution;
- App Store release;
- any future enterprise/custom distribution path for which the project is actually eligible.

Do not document a distribution method as supported merely because Xcode exposes it.

## Completion evidence

Build/install documentation is complete when these commands and device steps remain synchronized with the committed native project. Simulator compilation, interactive simulator execution, physical-device execution, signed archives, TestFlight and App Store distribution are separate validation layers and must only be claimed when their corresponding evidence exists.

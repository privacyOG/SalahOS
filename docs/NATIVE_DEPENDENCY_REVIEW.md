# Native dependency review

This review extends the repository dependency/license boundary to the committed Android and iOS/iPadOS shells. It complements the npm lockfile review rather than replacing it.

## Reviewed runtime dependency families

### Capacitor

The native shells use the Capacitor runtime and first-party Geolocation, Local Notifications and Preferences plugins pinned in `package.json`. The iOS Swift package also pins `capacitor-swift-pm` exactly to `8.4.2`.

The upstream Capacitor repository is MIT licensed. The locally referenced first-party plugin packages remain part of the npm dependency graph and therefore continue to be checked by the existing npm lockfile/license policy as well as the native version contract.

### AndroidX

The generated Android project centralizes the reviewed AndroidX versions in `android/variables.gradle`. AndroidX is principally distributed under Apache-2.0. The current direct Android app dependencies are AppCompat, CoordinatorLayout and Core SplashScreen; other reviewed AndroidX versions are retained by the generated Capacitor project and its test/build paths.

### Apache Cordova Android

The generated Capacitor compatibility project retains Cordova Android `14.0.1`. Apache Cordova Android is Apache-2.0 licensed. SalahOS does not add a separate unreviewed Cordova plugin dependency in this candidate.

## Tooling boundary

The Android Gradle plugin is pinned to `8.13.0`. It is build tooling rather than an application runtime dependency. The iOS project uses Swift Package Manager and the committed generated package manifest rather than an unpinned CocoaPods dependency file.

Build-tool upgrades still require intentional review because they can change generated manifests, packaging behavior and transitive dependency resolution even when they are not shipped as ordinary application libraries.

## Direct declaration boundary

The executable native dependency contract allowlists the complete direct dependency declarations in both Android Gradle files that contribute application/plugin dependencies. An additional `implementation`, `testImplementation` or `androidTestImplementation` declaration fails the repository gate until reviewed.

The iOS package contract likewise allowlists the complete `.package(...)` and `.product(...)` declaration sets. Adding another Swift package or exposing another package product therefore requires an intentional review rather than silently widening the native graph.

This declaration-level check is important because pinning only version variables would not detect a newly added dependency that introduced its own literal version or project module.

## Post-sync verification

Capacitor synchronization can regenerate native dependency files. A pre-sync repository check alone is therefore insufficient for release evidence.

The Android `android:sync` path runs `npm run verify:native-dependencies` immediately after `cap sync android`. The permanent iOS workflow runs the same verifier immediately after `npx cap sync ios` and before the Xcode build. The verifier also checks that these post-sync calls remain wired in place.

This means a generated dependency change caused by the installed plugin graph is checked in the exact native build workspace rather than relying only on the committed pre-sync files.

## Local native binary boundary

The generated Android template contains local library search paths for compatibility with native/Cordova plugins. SalahOS currently relies on no reviewed local `.jar` or `.aar` binary in those paths.

`scripts/verify-native-dependency-surface.mjs` therefore fails if a local Android `.jar` or `.aar` appears under the application or generated Cordova-plugin library directories. A future native binary must be source/license/security reviewed before the verifier is deliberately updated.

## Version and surface enforcement

`npm run verify:native-dependencies` locks the reviewed native dependency surface:

- Capacitor Android/Core/iOS `8.4.2`;
- Capacitor Geolocation `8.2.0`;
- Capacitor Local Notifications `8.2.1`;
- Capacitor Preferences `8.0.1`;
- Capacitor CLI `8.4.2`;
- generated AndroidX/Cordova version declarations currently committed under `android/variables.gradle`;
- Android Gradle plugin `8.13.0`;
- the exact reviewed Android application and generated Capacitor dependency declaration sets;
- iOS `capacitor-swift-pm` exact `8.4.2`, the local first-party plugin package paths, and the exact reviewed Swift package/product declaration sets;
- required post-sync re-verification on Android and iOS;
- absence of unreviewed local Android `.jar/.aar` binaries.

A dependency upgrade or addition is not forbidden. It must be intentional and accompanied by an updated dependency/license/security review instead of silently changing the generated native graph.

## Evidence boundary

This repository review verifies direct committed version/dependency declarations, known upstream license families and absence of local native binary injection. It does not claim that every transitive artifact downloaded by Gradle or Swift Package Manager has been independently relicensed by SalahOS. Exact resolved-build evidence still comes from the Android/iOS candidate workflows and must pass on the release-candidate head before the tracker is synchronized.

---

**Author:** privacyOG

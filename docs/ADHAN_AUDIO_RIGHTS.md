# Adhan audio rights policy

SalahOS must not bundle an Adhan recording merely because the file is publicly accessible. Audio may be packaged with a release only when the project has documented rights to redistribute that specific recording.

## Default repository policy

- Do not add third-party Adhan recordings without suitable redistribution rights.
- A recording found on a website, social platform, streaming service or file-sharing service is not presumed redistributable.
- User-provided local audio is distinct from project-bundled audio. Selecting a local file does not grant SalahOS redistribution rights and must not copy that recording into the project or release assets.
- The project should prefer no bundled recording over an unverified recording.

## Accepted rights bases

A bundled recording must use one of these documented bases:

- **Public domain:** the specific recording is demonstrably free of applicable exclusive recording rights or has been validly dedicated to the public domain.
- **Permissive licence:** the specific recording is distributed under terms that permit the project's intended copying and redistribution, with all required conditions followed.
- **Direct permission:** the relevant rights holder has granted permission covering the intended project distribution.

A statement that the underlying Adhan text is traditional or religious does not establish rights to a particular recorded performance or sound recording.

## Required rights record

Every packaged Adhan recording must have a rights record containing:

- a stable recording identifier;
- recording title;
- rights basis;
- identified rights holder or public-domain source authority;
- an evidence reference retained with project documentation;
- attribution text when required by the applicable permission or licence.

`src/domain/adhanAudioRights.ts` encodes the minimum completeness rule. A packaging path that is later added must call the same policy before accepting a bundled recording.

## Local user audio

Future local-audio support should keep the selected file on the user's device where the target platform permits it. The application should store only the minimum locator/permission data needed to use that file. Local user selection must not silently upload, redistribute or transform the recording into a project asset.

## Review rule

If the rights basis is uncertain, the recording is not eligible for bundling. Recordings can be reconsidered when adequate evidence or permission is available.

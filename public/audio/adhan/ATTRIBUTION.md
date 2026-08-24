# SalahOS packaged Adhan audio attribution

The files in this directory are shipped with SalahOS for offline-capable in-app Adhan playback and preview. They are not fetched from these sources at runtime.

## Beautiful Adhan

- File: `beautiful-adhan.mp3`
- Original work: **Beautiful adhan**
- Author: **Adam-synagda**
- Source: https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg
- License: **CC0 1.0 Universal (`CC0-1.0`)**
- Pinned import source: `wali1984/Darul-Irfan` commit `f4a0bd42b475a0a7a452a6e662a1cd9566e9f5de`, path `DarulIrfanApp/Resources/Audio/azan-full.mp3`
- SalahOS modification: loudness normalization to a −16 LUFS integrated target / −1.5 dBTP true-peak target, mono 44.1 kHz 96 kbps MP3 re-encode.

CC0 does not require attribution; the credit and provenance are retained anyway.

## Fajr Adhan — Malmö Mosque

- File: `fajr-malmo.mp3`
- Original work: **Eid al-Fitr Fajr azan at Malmö Mosque - 19 August 2012**
- Author: **Islamic Center Malmö**
- Source: https://commons.wikimedia.org/wiki/File:Eid_al-Fitr_Fajr_azan_at_Malm%C3%B6_Mosque_-_19_August_2012.webm
- License: **Creative Commons Attribution 3.0 Unported (`CC-BY-3.0`)**
- Pinned import source: `wali1984/Darul-Irfan` commit `f4a0bd42b475a0a7a452a6e662a1cd9566e9f5de`, path `DarulIrfanApp/Resources/Audio/azan-fajr-full.mp3`
- Upstream modification: audio was extracted from the original video and converted to MP3.
- SalahOS modification: loudness normalization to a −16 LUFS integrated target / −1.5 dBTP true-peak target, mono 44.1 kHz 96 kbps MP3 re-encode.

The author, source, license and modification notice above are retained to satisfy the attribution requirement for the Fajr recording.

## Integrity

`assets.json` records the exact byte size, SHA-256 digest, codec metadata, normalization target and rights metadata for every packaged recording. `npm run adhan:audio:check` fails if packaged bytes or manifest metadata drift.

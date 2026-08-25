# Offline Qur'an reading

SalahOS v1.5 Stage 6 packages a complete Qur'an reader for local use on web, Android and iOS builds. The runtime reader does not download Qur'an text or translation data from an upstream service.

## Corpus and provenance

The generated pack contains 114 surahs and 6,236 ayat. Every ayah keeps a canonical `surah:ayah` key, Uthmani Arabic text, the configured approved translation, juz and page metadata.

The Arabic source is pinned to `mjmirza/quran-dataset` commit `c0dc86b060b854d03f62848692bf1d2936dba630`, path `data/quran.json`. The pinned dataset records Tanzil Uthmani provenance and is used under the CC BY 4.0 terms applicable at that commit.

The English translation is Mohammed Marmaduke Pickthall's 1930 translation, pinned through `Kristories/quran` commit `3a796d5d7f80c80b83adae5b39affcec2aeb426c`, path `fixtures/en/pickthall/source.json`.

The generated pack is accepted only when its SHA-256 equals `fc81a35d049c10cbaa7817ea5546f60a06d10706a75f250c094f79bad73d3070`. Source commits, paths, counts and the expected digest are recorded in `src/data/quran-offline-manifest.json`.

## Reproducible packaging

`npm run quran:offline:prepare` creates `public/data/quran/quran-offline-pack.json` from the pinned immutable sources. The generator validates all 114 surahs, exactly 6,236 unique ayat, canonical verse keys, Arabic text and Pickthall coverage before writing the pack.

`npm run quran:offline:check` validates the packaged asset and its pinned digest without fetching replacement data. Quality Gate prepares the pinned corpus and then runs the integrity check before the wider knowledge-governance suite.

The generated JSON is intentionally ignored by Git because it is reproducible build output. `npm run dev` and every production `npm run build` prepare it before Vite starts, so Capacitor synchronization includes the same static asset in Android and iOS packages.

## Reader behaviour

The complete reader supports surah navigation, direct `surah:ayah` lookup, Arabic/translation/surah-name search, Arabic-only or approved Pickthall display, Arabic font selection, font sizing, bookmarks, last-read resume and ayah sharing. Reading preferences use the versioned SalahOS application-storage contract and therefore work with the native Capacitor preference store as well as web storage.

Curated Qur'an entries can additionally expose approved Tafsir al-Jalalayn summaries, topic metadata and related ayat. These tafsir texts are clearly identified as concise SalahOS summaries rather than quotations, and retain their approved source attribution through the Stage 5 Islamic Knowledge governance registry.

## Offline boundary

Upstream source URLs exist only in the build-time packager under `scripts/`. Application source loads the packaged `/data/quran/quran-offline-pack.json` asset and does not contain an unreviewed remote Qur'an network adapter. Once a web/native build has been produced, normal Qur'an reading is local and does not require the upstream GitHub repositories to be reachable.

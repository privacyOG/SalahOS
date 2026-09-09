# V1.6.0 release contract correction

The first exact-main `release/v1.6.0` packaging attempt reached the signed Android job successfully but the Web/Raspberry Pi job stopped in `quran:salahos-2026:check` before packaging.

The failure was a validator/schema mismatch: `src/data/quran-offline-manifest.json` declares the complete corpus as top-level `surahs` / `ayahs` fields and Arabic provenance under `arabicSource`, while the new validator incorrectly queried nonexistent `counts` and `arabicText` objects.

This correction aligns the validator with the established manifest schema without changing the Qur’an corpus, its SHA-256, Uthmani/Hafs/Medina provenance, SalahOS 2026 wording, or the recorded whole-corpus sign-off. The permanent Quality workflow now runs the SalahOS 2026 contract and simulates the release-ref editorial gate before release promotion.

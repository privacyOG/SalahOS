# SalahOS Qur’an Uthmani text provenance

## Canonical packaged Arabic text

SalahOS packages the Arabic Qur’an from the pinned `mjmirza/quran-dataset` repository at commit `c0dc86b060b854d03f62848692bf1d2936dba630`, using `data/quran.json`. The pinned dataset identifies its Arabic source as Tanzil Uthmani text and retains King Fahd Complex verification/source metadata.

The upstream Tanzil Uthmani source used by that pinned dataset is the Unicode Uthmani text aligned to the **Medina Mushaf**. Tanzil’s text documentation identifies the underlying reading as **Hafs**. The source download selected by the pinned dataset is `quranType=uthmani`.

Traceability is recorded in `src/data/quran-offline-manifest.json`, including:

- pinned repository, commit and file path;
- source licence/attribution boundary;
- Uthmani script identity;
- Medina Mushaf edition/alignment;
- Hafs reading;
- Tanzil / King Fahd Complex upstream identity and source URL;
- the SHA-256 hash of the generated complete offline pack.

The generated pack must contain exactly 114 surahs and 6,236 ayat. CI regenerates and hashes the pack and fails when the pinned source output does not match the committed manifest/package contract.

## Canonical display text versus search normalization

The Arabic string stored in the packaged corpus is the canonical display/copy/share value. SalahOS does **not** strip harakat or Uthmani marks from that stored/displayed text in order to make search easier.

Search derives a separate in-memory comparison key. That key removes combining Qur’anic/Arabic marks and tatweel, normalises the Uthmani alef-wasla form for matching, and normalises whitespace/case where applicable. The derived key is never written back to the corpus and is not used for display, copy, share or export.

This separation allows an unvocalised Arabic query such as `بسم الله الرحمن الرحيم` to match the fully marked Uthmani text while preserving the original packaged Arabic string unchanged.

## Source documentation

- Pinned SalahOS Arabic dataset: `https://github.com/mjmirza/quran-dataset/tree/c0dc86b060b854d03f62848692bf1d2936dba630`
- Pinned dataset’s Tanzil source selector: `https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2`
- Tanzil Qur’an text documentation: `https://tanzil.net/docs/quran_text`
- Tanzil Medina Mushaf documentation: `https://tanzil.net/docs/Medina_Mushaf`

These provenance statements identify the Arabic text source only. They do not constitute scholarly approval of SalahOS English wording for Muhkam/Mutashabih passages; that review remains governed separately by `docs/quran-editorial-policy-v1.6.0.md` and the named-scholar release gate.

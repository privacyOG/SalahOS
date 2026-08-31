# Qur'an translation and transliteration licensing research

Status: **research checkpoint only — no product integration is approved**

Checked: 2026-09-01 (Australia/Sydney)

This document records the V1.5.3 Work Item 6 licensing position before any translation or Latin transliteration is added to SalahOS product code or distributable content. The release tracker requires explicit project-owner approval after this report and before integration.

## Decision summary

| Candidate                                                                                | Evidence checked                                                                                                                                                                                                                                                                                                                                   | Current engineering position                                                                                                                                              | Required next action                                                                                                                                               |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mustafa Khattab, _The Clear Quran_                                                       | Publisher copyright page states that Al-Furqaan divisions hold the exclusive publication/distribution licence and that reproduction requires prior written consent, apart from a narrow qualifying 501(c)(3) educational exception.                                                                                                                | **Do not bundle without written permission.** SalahOS is not relying on the limited 501(c)(3) excerpt exception.                                                          | Ask Al-Furqaan / Book of Signs for explicit app, offline and redistribution rights.                                                                                |
| Aisha & Abdalhaqq Bewley, _The Noble Qur'an — a New Rendering of its Meaning in English_ | The 2012 Diwan sample says all rights reserved and requires written publisher permission. Diwan's current catalogue says the flagship current edition is published by Ta-Ha Publishing of London.                                                                                                                                                  | **Do not bundle without written permission.** Rights routing for the current edition needs confirmation.                                                                  | Ask Diwan to identify/confirm the controlling rights holder and, if appropriate, route the request to Ta-Ha/current publisher.                                     |
| M. A. S. Abdel Haleem, _The Qur'an_                                                      | OUP identifies the relevant paperback ISBN as `9780199535958`; OUP's permissions page directs Academic-book reuse through PLSclear and warns that OUP may not always control every right.                                                                                                                                                          | **Do not bundle without permission.**                                                                                                                                     | Submit a digital/mobile/offline reuse request through OUP/PLSclear for the identified edition and confirm the rights holder.                                       |
| Talal Itani, ClearQuran.com                                                              | The currently opened download page states non-commercial use and CC BY-NC-ND 4.0. A recent indexed snapshot of the same page has also advertised CC BY-ND 4.0 with commercial use, creating a material conflict in published terms.                                                                                                                | **Do not treat as commercially cleared.** The stricter currently opened terms control the engineering decision until the publisher resolves the inconsistency in writing. | Request written confirmation of the operative edition/licence and whether unchanged offline app redistribution is allowed in commercial and non-commercial builds. |
| Latin transliteration from `risan/quran-json` v3.1.2                                     | The project states its English transliteration is sourced from Tanzil. Its `package.json` says CC BY 4.0 while its README says CC BY-SA 4.0. Tanzil separately states developer resources are available for non-commercial purposes, and its translation repository says its downloads are non-commercial unless necessary permission is obtained. | **Pinned for provenance/review only; not cleared for distribution.**                                                                                                      | Ask Tanzil/rightsholder to clarify commercial/offline redistribution of `en.transliteration`; do not rely only on the downstream package licence field.            |

## Primary permission request — Mustafa Khattab / The Clear Quran

Route: The Clear Quran copyright-request form, selecting **Use of The Clear Quran English Translation**, and/or Al-Furqaan Foundation at `info@furqaan.org`.

Subject: Permission request — The Clear Quran English translation in SalahOS

> Assalamu alaikum,
>
> I am requesting written permission to include Dr. Mustafa Khattab's _The Clear Quran_ English translation in SalahOS, a privacy-focused cross-platform Islamic prayer and Qur'an application.
>
> We would like permission to distribute the English translation inside the application for verse-by-verse reading, including offline use. Distribution may occur through web, desktop and mobile builds and through normal application-store/download channels. The translation would remain textually unmodified apart from technical formatting needed to map verses and render them in the interface.
>
> Please confirm whether permission can cover: (1) the complete English translation, (2) local/offline storage in distributed application packages or approved downloadable content, (3) web/desktop/mobile display, (4) commercial as well as non-commercial distribution if applicable, (5) app-store and other ordinary redistribution channels, and (6) the exact attribution, copyright notice, trademark wording and source/version requirements you require.
>
> We will not represent the translation as the Arabic Qur'an itself, and we can preserve publisher/translator attribution and any required links or notices. If a specific digital source file or edition must be used, please identify it so that SalahOS can provenance-pin the approved text.
>
> Please also advise whether any separate agreement, fee, reporting requirement, update obligation or approval of the final implementation is required.
>
> Jazakum Allahu khayran.

### Evidence

- The Clear Quran copyright information: `https://mail.theclearquran.org/copyright-information/`
- Al-Furqaan contact: `https://furqaan.org/contact-us/`

## Fallback permission request — Bewley

Initial route: Diwan Press, `info@diwanpress.com`. Because Diwan's current catalogue says the present flagship edition is published by Ta-Ha Publishing of London, the request explicitly asks Diwan to identify or forward to the controlling rights holder.

Subject: Rights-holder confirmation and app permission request — Bewley Noble Qur'an translation

> Assalamu alaikum,
>
> I am seeking permission to use Aisha and Abdalhaqq Bewley's _The Noble Qur'an — a New Rendering of its Meaning in English_ in SalahOS, a cross-platform Islamic prayer and Qur'an application.
>
> The Diwan Press sample states that reproduction requires written publisher permission, while the current Diwan catalogue identifies the current flagship edition as published by Ta-Ha Publishing of London. Could you please confirm who currently controls the digital/application rights and either consider this request or direct/forward it to the correct rights holder?
>
> The requested scope is the complete English rendering for verse-by-verse reading, including offline storage and distribution in web, desktop and mobile application builds and ordinary application-store/download channels. We would preserve the translation text except for technical verse mapping and UI formatting and would display all required translator, publisher, copyright, edition and source notices.
>
> Please specify whether commercial distribution is permitted, which exact edition/source file must be used, any licence fee or agreement required, required attribution, and whether final implementation approval is needed.
>
> Jazakum Allahu khayran.

### Evidence

- Diwan Qur'an sample copyright notice: `https://www.diwanpress.com/wp-content/uploads/woocommerce_uploads/2014/01/Quransample.pdf`
- Diwan current catalogue/contact: `https://www.diwanpress.com/`
- Diwan contact page: `https://www.diwanpress.com/contact/`

## Fallback permission request — M. A. S. Abdel Haleem

Route: Oxford University Press Academic permissions / PLSclear. Identify the work with ISBN `9780199535958`.

Subject: Digital reuse permission request — M. A. S. Abdel Haleem, The Qur'an

> I am requesting permission to reproduce M. A. S. Abdel Haleem's English translation of _The Qur'an_ (Oxford University Press; paperback ISBN 9780199535958) in SalahOS, a cross-platform Islamic prayer and Qur'an application.
>
> Requested rights are for the complete translation as verse-by-verse text, including local/offline storage and distribution through web, desktop and mobile builds and ordinary app-store/download channels. The translation would not be editorially rewritten; technical processing would be limited to verse mapping, structured storage and interface formatting.
>
> Please confirm whether Oxford University Press controls the required rights for this edition and, if so, the terms for commercial and non-commercial application distribution, territory/duration, attribution and copyright notices, permitted technical formatting, source/version requirements, fees, and any approval or reporting obligations. If OUP does not control the necessary rights, please identify the rights holder or next permissions route.

### Evidence

- OUP rights and permissions: `https://academic.oup.com/pages/purchasing/rights-and-permissions`
- OUP catalogue evidence for ISBN `9780199535958` and Abdel Haleem's _The Qur'an_.

## Talal Itani / ClearQuran.com verification

The current ClearQuran download page opened during this review says files are for **non-commercial purposes**, asks that they not be modified/derived, and labels them **CC BY-NC-ND 4.0**. A separate recent search snapshot of the same URL states commercial use is allowed under CC BY-ND 4.0. Because these are materially different permissions on the same source, SalahOS must not select the more permissive snapshot by convenience.

Engineering rule: until ClearQuran confirms the operative terms in writing, treat this option as **non-commercial + no-derivatives only** and therefore not cleared as SalahOS's unrestricted secondary translation.

Confirmation request:

> Please confirm the currently operative licence for the downloadable Talal Itani ClearQuran English text. In particular, can an unchanged verse-by-verse copy be packaged/stored offline and redistributed inside a mobile, desktop and web application that may be distributed commercially? We have seen recent versions of your download page referring both to CC BY-NC-ND 4.0 and to CC BY-ND 4.0, so we need written confirmation of which terms govern the current downloadable edition and the exact required attribution.

Evidence: `https://blog.clearquran.com/download/`

## Tanzil-derived Latin transliteration provenance pin

Candidate review source only:

- repository: `risan/quran-json`
- release/tag: `v3.1.2`
- file: `dist/quran_transliteration.json`
- source declaration: `quran-json` README says the English transliteration is sourced from `https://tanzil.net/trans/en.transliteration`
- Git blob SHA-1: `7e2750a5b65306c9393b29e5a3ddfa264d33cc48`
- raw byte size: **2,214,403 bytes**
- SHA-256: **`36369741f23fe2b64fdcca39d047659256dab7b40f1717aefcb6198c514313a0`**
- structural check: **114 chapters / 6,236 verses**

The checksum was independently calculated from the tag-pinned raw GitHub file and its Git blob hash was verified to equal the repository blob SHA above.

### Licence caveat

Do not infer upstream permission from the downstream package metadata:

- `quran-json` v3.1.2 `package.json` declares `CC-BY-4.0`.
- the same tag's README labels the project `CC-BY-SA 4.0`.
- the README identifies Tanzil as the transliteration source.
- Tanzil's FAQ says developer resources are available for non-commercial purposes.
- Tanzil's translation download terms say translations are for non-commercial purposes unless the necessary permission is obtained from the translator/publisher.

That conflict is sufficient to block product redistribution until the provenance chain is clarified with Tanzil/the applicable rightsholder. The pin remains useful for exact review, comparison and future permission correspondence.

### Proofreading budget

Before release, budget human verification in addition to automated structural/checksum tests:

- **Primary line-by-line pass: 80–105 hours.** At roughly 45–60 seconds per ayah across 6,236 ayat, this covers Arabic-to-Latin alignment, obvious omissions/duplication, punctuation/token boundary issues and systematic transliteration anomalies.
- **Second-pass/exception QA: 16–25 hours.** Use a second reviewer for flagged cases plus a risk-weighted sample across all surahs, especially hamzah/ʿayn, long vowels, shaddah, divine names, pause-sensitive boundaries and names.
- Automated checks should separately confirm 114 surahs, 6,236 ayat, stable identifiers, non-empty transliteration values, expected Unicode/Latin-script constraints and a pinned checksum.

These are engineering planning estimates, not a vendor quote.

## Post-licence integration plan — design only

No code is authorized by this section. Once a translation licence is approved:

1. Represent translation choice as explicit preference state rather than a UI-locale side effect. The model should support `off` plus one selected licensed translation and remain extensible to additional licensed translations.
2. Keep transliteration as an **independent** preference stream; users may enable/disable it regardless of translation state.
3. Each content stream carries source/provenance metadata, display name, BCP 47 language metadata and explicit direction.
4. Arabic Qur'an remains `lang="ar" dir="rtl"`.
5. Licensed English translation content uses its own English language metadata and `dir="ltr"`, even when the SalahOS interface locale is Arabic.
6. Latin transliteration uses a source-appropriate Latin-script language tag and `dir="ltr"`; finalize the exact BCP 47 tag when the approved source/metadata is fixed.
7. Preserve the `BidiText`/isolation boundaries established in V1.5.3 Work Item 3 for mixed-script labels and verse references.
8. Keep source/version, checksum, licence/permission record and required attribution adjacent to the packaged corpus manifest so release validation can prove exactly what was distributed.
9. Run the Work Item 6 post-approval gate only after the approved corpus and notices are integrated.

## Approval boundary

Before product code or distributable translation/transliteration content changes, the project owner must approve a rights strategy. Recommended order:

1. pursue written permission for **The Clear Quran** as the preferred English translation;
2. simultaneously or subsequently pursue **Bewley** and **Abdel Haleem** as fallbacks;
3. treat **Talal Itani** only as a secondary candidate after the licence-version conflict is resolved;
4. seek explicit clarification from **Tanzil/the applicable transliteration rights holder** before distributing the pinned transliteration.

Until that approval and the required rights are obtained, Work Item 6 remains intentionally incomplete and the post-approval gate must not be run as a claim of release readiness.

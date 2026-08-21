# Family & Classroom prayer board

Stage 23.7 adds the sixth required SalahOS prayer-board template, `family-classroom`.

## Presentation contract

The renderer consumes only the shared `PrayerBoardData` presentation contract. Selecting Family & Classroom does not recalculate prayer times or change the selected prayer source, configured Iqamah values, notification behaviour, or next-prayer semantics.

The design is intended for homes, Islamic schools and children's learning spaces while remaining suitable for a dignified shared prayer display. It uses large prayer labels, numbered prayer rows and restrained first-party line iconography rather than toy-like illustration or animation.

## Athan / Start and Iqamah learning hierarchy

All five obligatory prayers remain visible. Start/Athan and Iqamah occupy separate, consistently aligned columns with distinct visual treatment so a learner can understand that the prayer start time and the congregational Iqamah time are different concepts. Current and next prayer states also include explicit text/border treatment and do not depend on colour alone.

The next-prayer focus repeats Start/Athan and Iqamah with dedicated icons and values while preserving the authoritative data already supplied by the shared prayer-board contract.

## Optional educational and daylight cues

Simplified educational hints are explicitly opt-in. They are disabled by default so the Family & Classroom template can be used on ordinary mosque signage without automatically adding classroom explanatory copy.

When enabled, the teaching panel explains the Start/Athan and Iqamah distinction using localized copy for English, Arabic, Turkish and Indonesian. Daylight cues are enabled by default but can be disabled independently; when present they expose Sunrise and sunset/Maghrib timing without changing prayer calculations.

## Visual and offline behaviour

The visual system uses a bright but dignified high-contrast palette, large typography and local CSS/SVG line iconography. It has no remote imagery or runtime content dependency. Existing smart-display palette variants are respected, and the layout supports Arabic/RTL plus deliberately long mosque names.

Permanent visual acceptance covers 1920×1080 and 3840×2160 English and Arabic/RTL scenarios, hints on/off, daylight cues on/off, long mosque names, exact five-prayer rendering, explicit Start/Iqamah columns, local-only requests, viewport containment and zero horizontal clipping.

Stage 23.7 must remain incomplete in the trackers until the exact code head passes Quality Gate, Android Build, Visual Regression and iOS Build and the generated screenshots receive human review.

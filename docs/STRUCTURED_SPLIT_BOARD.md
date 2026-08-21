# Structured Split Board prayer display

Stage 23.5 adds the fourth required SalahOS prayer-board template, `structured-split-board`.

## Presentation contract

The renderer consumes only the shared `PrayerBoardData` presentation contract. Selecting Structured Split Board does not recalculate prayer times or change the selected prayer source, configured Iqamah values, notification behaviour, or next-prayer semantics.

The template is intended for mosques, schools, community centres and other displays where precise timetable comparison is more important than a large decorative hero.

## Information architecture

The display is deliberately divided into two visually distinct regions:

- a structured five-prayer timetable with aligned prayer-name, Start/Athan and Iqamah/Jama'ah columns;
- a separate information rail containing current time, Gregorian and Hijri dates, next prayer and countdown;
- compact Jumu'ah session information that can represent multiple configured sessions;
- compact sunrise and sunset information;
- mosque identity, source, timezone and offline state as subordinate metadata.

Current and next prayer states remain understandable without relying on colour alone. The table uses strong spacing, typography and column rhythm rather than dense spreadsheet chrome.

## Responsive and RTL behaviour

The permanent display layout targets both 1920×1080 and 3840×2160 screens. English and Arabic/RTL are first-class visual acceptance targets, including deliberately long mosque names. Logical-direction layout keeps the timetable and information rail coherent in RTL without changing the underlying prayer sequence or data contract.

The focused visual harness verifies:

- exactly five obligatory prayer rows;
- a distinct timetable and clock/next-prayer rail;
- alignment of all five Start/Athan cells;
- alignment of all five Iqamah/Jama'ah cells;
- at least 90% viewport-height use;
- no horizontal clipping or hidden overflow;
- stable rendering at 1080p and 4K in English and Arabic/RTL.

## Acceptance evidence

Code-bearing head `13ad0a56597bc37fc955a942f4db3d7f6c8a4bd1` passed:

- Quality Gate `32489547751`;
- Android Build `32489547621`;
- Visual Regression `32489547618`;
- iOS Build `32489547663`, including fresh iPhone and iPad Simulator install, launch, and relaunch acceptance.

Human review of the exact-head screenshots confirmed clear separation between timetable and information rail, crisp Start/Iqamah alignment, readable current/next states, composed Arabic/RTL layout, and strong information density without a spreadsheet-like appearance. The exact-head screenshots remained byte-identical after the formatting-only cleanup.

Stage 23.6 Scenic Spiritual and Stage 23.7 Family & Classroom remain separate template work. Stage 23.9 remains responsible for template gallery/configuration/assignment UX, and Stage 23.13 remains responsible for phone-adapted Today/home variants and the visual Display Themes selector.

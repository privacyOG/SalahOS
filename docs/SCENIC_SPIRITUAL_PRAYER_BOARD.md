# Scenic Spiritual prayer board

Stage 23.6 adds the fifth required SalahOS prayer-board template, `scenic-spiritual`.

## Presentation contract

The renderer consumes only the shared `PrayerBoardData` presentation contract. Selecting Scenic Spiritual does not recalculate prayer times or change the selected prayer source, configured Iqamah values, notification behaviour, or next-prayer semantics.

The display keeps the prayer hierarchy explicit: current local time, next prayer and countdown dominate one readable region while all five obligatory prayers remain visible in a separate Start/Iqamah timetable. Gregorian/Hijri date, Jumu'ah sessions, sunrise/sunset, source, timezone and offline state remain available without competing with the core prayer information.

## Artwork, ownership and contrast

The built-in scenic background is `public/artwork/scenic-spiritual.svg`. It is original first-party SalahOS artwork authored for this repository and carries the in-file `privacyOG` ownership metadata. It is distributed with SalahOS and does not depend on a third-party image service, remote URL or runtime media request.

Artwork mode uses full-bleed `background-size: cover` presentation. Layered dark scrims plus translucent/solid focus and timetable surfaces keep clock, prayer names, Start times and Iqamah values readable independently of the decorative background. The artwork itself does not encode prayer information.

The explicit artwork-disabled mode removes the SVG and uses a deterministic local gradient field instead. The full clock, next-prayer/countdown, five-prayer timetable, Jumu'ah and solar information remain available, so media failure or deliberate imagery disablement never makes the prayer board unusable.

## Acceptance evidence

Code-bearing head `5084a6086aa39f2481b5ac2fcb38759d2faa262b` passed:

- Quality Gate `32500835938`;
- Android Build `32500835956`;
- Visual Regression `32500835923`;
- iOS Build `32500835937`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance.

The permanent visual matrix covers English and Arabic/RTL at 1920×1080 and 3840×2160, artwork-on and artwork-off modes, deliberately long mosque names, exact five-prayer rendering, contrast-region presence, local-only request enforcement, viewport containment and zero horizontal clipping. Visual artifact `9453619560` received human review; the four Scenic screenshots were accepted for long-distance hierarchy, artwork/text balance, composed RTL, plain-mode usefulness and absence of clipping.

Stage 23.7 Family & Classroom remains separate. Stage 23.9 retains responsibility for visual template selection/configuration/assignment, and Stage 23.13 remains responsible for phone-adapted Today/home variants and the visual Settings selector.

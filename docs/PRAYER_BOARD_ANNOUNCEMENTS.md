# Prayer-board announcements and rotation

Stage 23.12 adds an optional announcement region to SalahOS prayer boards without introducing a second display scheduler.

## Existing signage scheduler is authoritative

Prayer-board announcement rotation uses the existing signage contracts in `src/domain/signageScene.ts` and `src/domain/signagePlaylist.ts`:

- each display announcement is projected as an `announcement` signage scene;
- the ordered scene list and dwell duration use `SignagePlaylist`;
- time-window and prayer-relative activation use `SignageScheduleRule` and `resolveSignageSchedule`;
- mosque-local prayer clocks are supplied by the existing sourced prayer dashboard rather than recalculated by the announcement module.

The Stage 23.12 rotation layer only selects which already-approved announcement may occupy the prayer-board announcement region. It does not own a competing timer, calendar or prayer calculation.

## Display-targeted content only

The runtime reads the existing community-content library and considers only announcements that:

- belong to the mosque selected by the configured signage playlist;
- explicitly include the `display` surface;
- are currently in the published lifecycle state;
- have a configured announcement signage scene in the active playlist.

Expired, archived, scheduled-for-later, mobile-only and other-mosque announcements are excluded.

## Prayer information always wins

Announcement content is presentation-only and cannot alter prayer calculations, selected prayer source, Iqamah values, notifications or next-prayer semantics.

The announcement region is suppressed when:

- the per-display `announcements` prayer-board module is hidden;
- announcement rotation is disabled;
- no signage schedule rule is active;
- the next obligatory prayer is within the ten-minute prayer guard;
- the current wall clock is between a prayer's Athan/start time and its configured Iqamah;
- no eligible published announcement exists.

The complete prayer timetable remains rendered while an announcement is visible.

## Administration

Display administration exposes an **Announcement rotation** panel alongside the prayer-board theme controls. It discovers announcements already marked for the display surface and builds a revisioned signage playlist plus an all-day schedule rule for the selected mosque. Each announcement has a bounded 5–120 second dwell time.

The prayer-board template's existing **Announcements** module switch remains the final per-display control. Administrators can therefore keep a mosque rotation configuration while disabling announcement presentation on prayer-board-only displays.

More complex daypart, Jumu'ah, Ramadan and prayer-relative playlist rules remain compatible with the same underlying signage scheduler and can be supplied through the managed signage configuration path without changing the Stage 23.12 runtime.

## Persistence and failure behaviour

The rotation configuration is validated before use and stored under its own versioned application-storage key. It participates in the native Preferences allow-list on Android and iOS.

Invalid or corrupt persisted rotation configuration fails closed to disabled rotation. Missing community content or an inactive schedule simply removes the optional announcement region; local prayer information continues normally.

## Motion and kiosk behaviour

The announcement region uses one restrained entrance transition only. `prefers-reduced-motion: reduce` disables the animation and all announcement transitions. Rotation selection is derived deterministically from playlist dwell durations and wall time, so no accumulating interval drift or second competing scheduler is introduced into a long-running kiosk.

## Verification boundary

Repository acceptance covers domain selection/suppression, persistence validation, five-prayer preservation, per-display module disablement, English and Arabic/RTL rendering, reduced-motion behaviour and the administration surface. Physical panel viewing-distance acceptance remains part of the broader Stage 25/26 device and visual matrix.

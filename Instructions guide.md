# SalahOS Instructions Guide

This guide covers everyday SalahOS use and mosque/smart-display operation on Android, iPhone/iPad, Web/PWA, Raspberry Pi and TV/kiosk installations.

## 1. First setup

1. Open SalahOS and allow location access if you want prayer times calculated from the device position. Location is used for prayer calculation and Qiblah features; core prayer calculation remains local.
2. If location access is unavailable or unwanted, choose a saved location, offline city or manual coordinates.
3. Open **Settings** and confirm your calculation method, Asr convention/madhhab, timezone and time format before relying on the timetable.
4. Check the **Today** screen against a trusted local timetable when first configuring a location, particularly where a mosque uses custom angles, fixed times or local adjustments.
5. The primary application navigation exposes **Today, Calendar, Mosques, Qiblah, Knowledge, Community and Settings**. Arabic uses the corresponding RTL navigation order/presentation.

## 2. Prayer calculation and madhhab

SalahOS calculates prayer times from the selected location and calculation profile. The calculation method controls parameters such as Fajr and Isha angles. The Asr convention controls the shadow-length rule used for Asr; select the convention appropriate to the madhhab or timetable you follow.

Manual prayer adjustments are intended for documented local requirements. If a local mosque timetable is selected as the prayer source, its imported or configured times take precedence according to that source's configuration.

High-latitude handling should be configured for locations where normal twilight events are unavailable or unsuitable. Do not use manual adjustments to conceal an incorrect location, timezone or calculation method.

**Fajr and Sunrise:** the Fajr prayer time begins at true dawn and ends when the sun begins to rise. SalahOS therefore shows **Sunrise** in the daily schedule as a non-prayer boundary labelled **Fajr ends**. Sunrise is not one of the five obligatory prayers and is never treated as the current or next obligatory prayer.

## 3. Hijri date and Prayer Calendar

SalahOS presents Gregorian dates alongside the Umm al-Qura Hijri calendar. The English Hijri month names are Muharram, Safar, Rabi al-Awwal, Rabi al-Akhir, Jumada al-Ula, Jumada al-Akhirah, Rajab, Sha'ban, Ramadan, Shawwal, Dhu al-Qi'dah and Dhu al-Hijjah.

A local Hijri correction of up to **±3 days** can be applied when your community follows a local moon-sighting decision that differs from the calculated Umm al-Qura date. The correction changes Hijri presentation; it does not move the underlying Gregorian civil date.

The separate **Calendar** area provides compact mobile agenda/card presentation and access to fuller prayer-timetable views. Calendar uses the same location, timezone and prayer-calculation pipeline as Today so displayed dates and prayer times remain aligned. The Calendar is separate from the **Today** screen.

## 4. Iqamah and Jumu'ah

The **Today** screen intentionally presents prayer **start times only**. It does not show Iqamah labels, values, placeholders or an empty Iqamah column.

Mosque profiles and mosque/administration display workflows can still configure Iqamah as fixed times or offsets from prayer time. Confirm each rule after changing the prayer source or calculation settings. Jumu'ah can contain one or multiple sessions; enter the actual congregation times used by the mosque.

For a public mosque display, verify the day's prayer starts, Iqamah and Jumu'ah values before placing the display into unattended service. Removing Iqamah from Today does not delete or disable mosque-specific Iqamah data elsewhere.

## 5. Qiblah Finder

Open **Qiblah Finder/Compass** and select the intended location source. The bearing is calculated locally using the great-circle direction to the Ka'bah. On a device with orientation sensors, follow calibration guidance and keep the device away from magnetic cases, speakers, vehicles and large metal objects.

If orientation sensors are unavailable or permission is denied, SalahOS can still present the calculated Qiblah bearing and map-oriented fallback rather than relying on a live compass. A map can be used as a visual cross-check. Compass accuracy depends on the device sensors and environment, while the calculated true-north Qiblah bearing depends on the selected location.

## 6. Adhan and notifications

Enable the prayer notifications you want and grant the operating-system notification permission when requested. Android and iOS can restrict background work, exact timing and audio according to OS policy and device settings.

Foreground Adhan playback and background notification delivery are different capabilities. A full Adhan is not guaranteed to play while the application is terminated or background-restricted. Check battery optimisation, notification permissions, Focus/Do Not Disturb and device volume if alerts are missing.

Notification controls remain available through Settings even after onboarding is skipped or permission is declined. On Android, exact-alarm capability is handled separately from ordinary notification permission and can fall back to inexact scheduling where exact alarms are unavailable.

## 7. Language, RTL, appearance and colour palettes

Language and display settings are available in **Settings**. Arabic uses right-to-left layout. Appearance can be **Light, Dark or System**, and the colour palette is selected independently from that appearance mode.

The V1.6 palette set includes **Standard, Light Blue, Emerald, Navy, Warm Sand and Soft Lavender**. Palette previews are available before selection and the palette can be reset to the default. Changing Light/Dark/System does not silently replace the selected palette.

System appearance follows the operating-system light/dark preference. SalahOS includes permanent visual/contrast checks for the supported appearance and palette combinations, but you should still verify readability on the actual display used for a public installation.

## 8. Offline operation and Qur'an preparation

Core prayer calculations, saved settings and installed application data are designed to continue without a network connection. Features that inherently require remote data can fail independently without disabling local prayer calculation.

The complete Qur'an reader is packaged with the project corpus and Amiri Quran font. On native Android/iOS builds, the release pipeline verifies that the Qur'an pack and font are present in the native application bundle. On Web/PWA, use the reader's **Prepare for offline** action while online before depending on Qur'an access without a connection. The status distinguishes **Preparing**, **Ready** and **Unavailable**; native builds identify their verified bundled state separately.

If a Qur'an load fails because of a network error, HTTP failure or malformed/interrupted pack, use **Retry**. Retry starts a new load attempt and does not require deleting bookmarks or last-read state.

Before relying on a kiosk or mosque display offline, launch it once after installation/update, confirm its location and settings, and test it with networking disabled.

## 9. Qur'an and Islamic Knowledge

Open **Knowledge** for the Qur'an, Hadith and **Fiqh & questions** scopes. Each scope reports its own collection/result counts rather than presenting unrelated duplicate filters.

The Qur'an reader is reading-first: the selected surah remains the dominant surface, while navigation and reading preferences can be opened when needed. You can search surahs/ayat, resume the last-read location, use bookmarks and share supported reading content. When following a search result into the reader, SalahOS preserves a route back to the search context.

The reader labels the packaged English translation as **M. M. Pickthall (1930)**. Qur'anic Arabic, English translation and separately identified commentary/summary content retain distinct language/direction metadata. Dataset page grouping is navigation metadata and should not be interpreted as a claim that the screen reproduces a particular printed mushaf page facsimile.

Hadith metadata uses **Companion narrator** for the companion-level narrator field. Grading, source and school/juristic distinctions should be read according to the cited metadata rather than inferred from the label alone.

## 10. Android

Install the signed SalahOS APK supplied by the project/release channel. Android may require permission to install an application from the browser or file manager used to open the APK. After installation:

1. Grant only the location and notification permissions required for the features you use.
2. Confirm the correct location and timezone.
3. Configure calculation method, Asr convention and adjustments.
4. Enable notifications/Adhan as required.
5. If notification timing is unreliable, review Android battery optimisation and exact-alarm behaviour for the device.
6. Before relying on offline Qur'an access, confirm the reader opens correctly with networking disabled.

When updating from an APK, use an APK signed with the same SalahOS release identity so Android can update the installed application rather than treating it as an unrelated package.

## 11. iPhone and iPad

SalahOS uses the shared iOS/iPadOS application with native permission and notification integration. Grant foreground location access when location-based calculation is desired and grant notifications for prayer alerts.

Apple distribution requires valid signing/provisioning. A Simulator build is not an installable consumer iPhone/iPad package. Where a signed build is supplied through an authorised distribution route, follow that route's installation instructions.

If notifications do not appear, check iOS notification permissions, Focus modes and SalahOS notification settings.

## 12. Web and PWA

Open the deployed SalahOS web address in a supported modern browser. For an app-like installation, use the browser's **Install app** or **Add to Home Screen** option when available.

The PWA caches the application shell and locally required data for offline continuity. Qur'an offline preparation is explicit: while online, open the Qur'an reader and use **Prepare for offline**, then confirm the state reports **Ready** before disconnecting. An unprepared or interrupted cache must not be assumed to contain the complete corpus/font.

After an application update, reload the installed PWA while online so the new service-worker/application assets can be installed. If an old version remains visible, close all SalahOS tabs/windows and reopen it before clearing data.

Browser permissions govern web location and notifications. Private/incognito sessions may not retain settings.

## 13. Raspberry Pi

The Raspberry Pi deployment uses the production Web/PWA application in Chromium kiosk mode. For a dedicated prayer display:

1. Install the release kiosk package and its Chromium/autostart helpers.
2. Configure the display resolution/orientation and prevent unwanted screen blanking using the operating-system/display configuration appropriate to the installation.
3. Launch SalahOS once interactively and configure the mosque/location profile.
4. Select the required smart-display template/theme and confirm prayer/Iqamah hierarchy at the actual viewing distance.
5. Reboot and confirm the kiosk starts automatically and continues to display correct times.
6. Test network loss and restoration before unattended deployment.

Keep administrative credentials outside public view and do not expose remote-management endpoints directly to the public Internet.

## 14. TV and generic kiosk displays

Use a supported browser at the display's native resolution. Enter the smart-display/kiosk route, select the mosque profile and choose a display-oriented theme. Confirm readability from the furthest expected viewing position.

Mosque branding, announcements and decorative backgrounds must not reduce the contrast of the clock, next prayer, prayer times or Iqamah information. Prefer a simpler/high-contrast presentation on low-quality panels or brightly lit walls.

For unattended use, configure the host device to reopen the browser/application after reboot and prevent sleep where appropriate. Keep a keyboard/remote exit path available for administration.

## 15. Mosque profiles, timetables and announcements

A mosque administrator should maintain a single reviewed profile for each physical mosque/display group. Confirm:

- mosque name and location;
- prayer source and calculation method;
- timezone;
- Asr convention;
- fixed/manual adjustments;
- Iqamah rules;
- Jumu'ah sessions;
- Ramadan/Taraweeh information where used;
- announcements/events;
- display theme and branding.

CSV/JSON timetable import should be reviewed before it becomes the active prayer source. A syntactically valid timetable can still contain incorrect local times.

## 16. Updating SalahOS

Before an important mosque deployment, update during a maintenance window rather than immediately before a prayer. After an update, verify location, today's prayer times, Hijri date, mosque Iqamah/Jumu'ah data where used, notifications and smart-display rendering.

For Web/PWA and kiosk installations, refresh the application online after deployment so new assets are cached. If Qur'an offline use is required, repeat/verify the Qur'an **Prepare for offline** state after the update. For Android, install a correctly signed update. iOS/iPadOS updates follow the configured Apple distribution route.

## 17. Troubleshooting

**Prayer times are wrong:** verify location, timezone, calculation method, Asr convention, high-latitude rule, prayer source and manual adjustments in that order.

**Hijri date differs from the local mosque:** verify the Gregorian civil date/timezone first. If the mosque follows a local sighting, use the Hijri **±3-day** correction rather than changing the Gregorian date.

**Compass appears wrong:** recalibrate the device, move away from magnetic interference, confirm the selected location and compare the calculated bearing with the map direction. If the device has no usable orientation sensor, use the calculated bearing/map fallback.

**Notifications are late or absent:** check SalahOS notification settings, OS permission, battery optimisation/Focus modes and whether the platform permits the requested background behaviour.

**Qur'an failed to load:** use **Retry** first. On Web/PWA, reconnect and run **Prepare for offline** again if the prior preparation was unavailable or interrupted. Do not clear application/site data merely to retry because that can remove local settings and reading state.

**PWA appears stale:** reconnect, reload, close all SalahOS browser windows and reopen. Clear site data only as a last resort because locally stored settings may be removed.

**Kiosk is blank after reboot:** verify network-independent application assets were loaded previously, Chromium/autostart configuration, display output and the kiosk URL.

## 18. Reset, import/export and recovery

Before resetting, export any mosque timetable/profile data that must be retained. Settings includes import/export/reset controls for supported application settings. Browser site-data deletion or application-data clearing is a destructive recovery action and can remove saved settings, locations and locally imported timetable data.

After a reset, repeat first setup and verify prayer times against a trusted reference before relying on alerts or public display output.

## 19. Operational checklist for mosque displays

Before leaving a display unattended, verify today's Gregorian and Hijri dates, all prayer times, mosque Iqamah times where the display uses them, Jumu'ah sessions, the next-prayer indicator/countdown, timezone, announcements, display readability and restart behaviour. Test both network-connected and offline operation where the deployment is expected to survive connectivity loss.

For technical build/signing details, consult the repository's platform-specific documentation and tested-platform status files.

## 20. Australian mosque directory and corrections

The **Mosques** experience includes a bundled offline-first Australian directory containing the project's current 254 deduplicated mosque and musalla records. You can search the bundled data and use nearby ordering when you have explicitly selected or permitted a location. Browsing the bundled catalogue does not require a live request to OpenStreetMap or Australian Mosque Finder.

Use **Favourite** to retain a mosque without changing Today. Use **Use mosque** when you want the selected directory mosque to become the active mosque context on Today. SalahOS then calculates prayer starts at the mosque's coordinates using your existing calculation method and madhhab/Asr settings; it does not silently overwrite your separately saved personal location.

Where the Australian Mosque Finder listing explicitly publishes mosque-specific daily congregation times, SalahOS retains those values as published Iqamah/Jama'ah context in mosque-specific surfaces. Multiple published sessions remain available. If the listing does not publish a congregation time for a prayer, SalahOS does not manufacture an Iqamah. The generic locality seven-day prayer calendar shown on Mosque Finder is not treated as a mosque Iqamah timetable. **Today itself remains prayer-start-only in V1.6.0.**

Directory records preserve source provenance and data-quality/freshness information where available. **Directions** may open an external map provider and therefore requires network access. If a listing is wrong or incomplete, use the shared **report/edit** correction workflow rather than treating a nearby record as the same mosque or manually collapsing two distinct venues.

For the current dataset accounting, upstream-source boundary and reproducibility details, see `docs/AUSTRALIAN_MOSQUE_DIRECTORY.md` in the project repository.

## 21. V1.6 acceptance boundary

Automated Quality, browser, emulator and Simulator tests verify many release behaviors, but they are not a substitute for every real device or editorial review requirement. The V1.6 audit separately requires physical Android/iOS acceptance and named qualified scholarly sign-off for the complete Muhkam/Mutashabih Qur'an review. Until those items are recorded as complete in `TEMP_TODO_V1.6.0.md`, a V1.6.0 release must not be represented as fully accepted or published.

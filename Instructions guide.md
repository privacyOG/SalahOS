# SalahOS Instructions Guide

This guide covers everyday SalahOS use and mosque/smart-display operation on Android, iPhone/iPad, Web/PWA, Raspberry Pi and TV/kiosk installations.

## 1. First setup

1. Open SalahOS and allow location access if you want prayer times calculated from the device position. Location is used for prayer calculation and Qiblah features; core prayer calculation remains local.
2. If location access is unavailable or unwanted, choose a saved location, offline city or manual coordinates.
3. Open **Settings** and confirm your calculation method, Asr convention/madhhab, timezone and time format before relying on the timetable.
4. Check the **Today** screen against a trusted local timetable when first configuring a location, particularly where a mosque uses custom angles, fixed times or local adjustments.

## 2. Prayer calculation and madhhab

SalahOS calculates prayer times from the selected location and calculation profile. The calculation method controls parameters such as Fajr and Isha angles. The Asr convention controls the shadow-length rule used for Asr; select the convention appropriate to the madhhab or timetable you follow.

Manual prayer adjustments are intended for documented local requirements. If a local mosque timetable is selected as the prayer source, its imported or configured times take precedence according to that source's configuration.

High-latitude handling should be configured for locations where normal twilight events are unavailable or unsuitable. Do not use manual adjustments to conceal an incorrect location, timezone or calculation method.

## 3. Hijri date and Prayer Calendar

SalahOS presents Gregorian dates alongside the Umm al-Qura Hijri calendar. The English Hijri month names are Muharram, Safar, Rabi al-Awwal, Rabi al-Akhir, Jumada al-Ula, Jumada al-Akhirah, Rajab, Sha'ban, Ramadan, Shawwal, Dhu al-Qi'dah and Dhu al-Hijjah.

A local Hijri correction of up to ±2 days can be applied when your community follows a local moon-sighting decision that differs from the calculated Umm al-Qura date. The correction changes Hijri presentation; it does not move the underlying Gregorian civil date.

The separate **Calendar** area provides Daily, Weekly, Monthly and Yearly views. These views use the same location, timezone and prayer-calculation pipeline so the displayed dates and prayer times remain aligned. The Calendar is separate from the **Today** screen.

## 4. Iqamah and Jumu'ah

Mosque profiles can configure Iqamah as fixed times or offsets from prayer time. Confirm each rule after changing the prayer source or calculation settings. Jumu'ah can contain one or multiple sessions; enter the actual congregation times used by the mosque.

For a public display, verify the day's prayer, Iqamah and Jumu'ah values before placing the display into unattended service.

## 5. Qiblah Finder

Open **Qiblah Finder/Compass** and select the intended location source. The bearing is calculated locally using the great-circle direction to the Ka'bah. On a device with orientation sensors, follow calibration guidance and keep the device away from magnetic cases, speakers, vehicles and large metal objects.

A map can be used as a visual cross-check. Compass accuracy depends on the device sensors and environment, while the calculated true-north Qiblah bearing depends on the selected location.

## 6. Adhan and notifications

Enable the prayer notifications you want and grant the operating-system notification permission when requested. Android and iOS can restrict background work, exact timing and audio according to OS policy and device settings.

Foreground Adhan playback and background notification delivery are different capabilities. A full Adhan is not guaranteed to play while the application is terminated or background-restricted. Check battery optimisation, notification permissions, Focus/Do Not Disturb and device volume if alerts are missing.

## 7. Language, RTL, appearance and colour palettes

Language and display settings are available in **Settings**. Arabic uses right-to-left layout. Appearance can be Light, Dark or System, and the colour palette is selected independently. Available palettes include Salah Classic, Midnight Gold, Emerald Mosque, Royal Blue, Desert Sand, Olive Heritage, Monochrome and High Contrast.

Use High Contrast when maximum distinction is more important than decorative styling. System appearance follows the operating-system light/dark preference.

## 8. Offline operation

Core prayer calculations, saved settings and installed application data are designed to continue without a network connection. Features that inherently require remote data can fail independently without disabling local prayer calculation.

Before relying on a kiosk or mosque display offline, launch it once after installation/update, confirm its location and settings, and test it with networking disabled.

## 9. Android

Install the signed SalahOS APK supplied by the project/release channel. Android may require permission to install an application from the browser or file manager used to open the APK. After installation:

1. Grant only the location and notification permissions required for the features you use.
2. Confirm the correct location and timezone.
3. Configure calculation method, Asr convention and adjustments.
4. Enable notifications/Adhan as required.
5. If notification timing is unreliable, review Android battery optimisation and exact-alarm behaviour for the device.

When updating from an APK, use an APK signed with the same SalahOS release identity so Android can update the installed application rather than treating it as an unrelated package.

## 10. iPhone and iPad

SalahOS uses the shared iOS/iPadOS application with native permission and notification integration. Grant foreground location access when location-based calculation is desired and grant notifications for prayer alerts.

Apple distribution requires valid signing/provisioning. A simulator build is not an installable consumer iPhone/iPad package. Where a signed build is supplied through an authorised distribution route, follow that route's installation instructions.

If notifications do not appear, check iOS notification permissions, Focus modes and SalahOS notification settings.

## 11. Web and PWA

Open the deployed SalahOS web address in a supported modern browser. For an app-like installation, use the browser's **Install app** or **Add to Home Screen** option when available.

The PWA caches the application shell and locally required data for offline continuity. After an application update, reload the installed PWA while online so the new service-worker/application assets can be installed. If an old version remains visible, close all SalahOS tabs/windows and reopen it before clearing data.

Browser permissions govern web location and notifications. Private/incognito sessions may not retain settings.

## 12. Raspberry Pi

The Raspberry Pi deployment uses the production Web/PWA application in Chromium kiosk mode. For a dedicated prayer display:

1. Install the release kiosk package and its Chromium/autostart helpers.
2. Configure the display resolution/orientation and prevent unwanted screen blanking using the operating-system/display configuration appropriate to the installation.
3. Launch SalahOS once interactively and configure the mosque/location profile.
4. Select the required smart-display template/theme and confirm prayer/Iqamah hierarchy at the actual viewing distance.
5. Reboot and confirm the kiosk starts automatically and continues to display correct times.
6. Test network loss and restoration before unattended deployment.

Keep administrative credentials outside public view and do not expose remote-management endpoints directly to the public Internet.

## 13. TV and generic kiosk displays

Use a supported browser at the display's native resolution. Enter the smart-display/kiosk route, select the mosque profile and choose a display-oriented theme. Confirm readability from the furthest expected viewing position.

Mosque branding, announcements and decorative backgrounds must not reduce the contrast of the clock, next prayer, prayer times or Iqamah information. Prefer a high-contrast or simpler theme on low-quality panels or brightly lit walls.

For unattended use, configure the host device to reopen the browser/application after reboot and prevent sleep where appropriate. Keep a keyboard/remote exit path available for administration.

## 14. Mosque profiles, timetables and announcements

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

## 15. Updating SalahOS

Before an important mosque deployment, update during a maintenance window rather than immediately before a prayer. After an update, verify location, today's prayer times, Hijri date, Iqamah/Jumu'ah values, notifications and smart-display rendering.

For Web/PWA and kiosk installations, refresh the application online after deployment so new assets are cached. For Android, install a correctly signed update. iOS/iPadOS updates follow the configured Apple distribution route.

## 16. Troubleshooting

**Prayer times are wrong:** verify location, timezone, calculation method, Asr convention, high-latitude rule, prayer source and manual adjustments in that order.

**Hijri date differs from the local mosque:** verify the Gregorian civil date/timezone first. If the mosque follows a local sighting, use the Hijri ±2-day correction rather than changing the Gregorian date.

**Compass appears wrong:** recalibrate the device, move away from magnetic interference, confirm the selected location and compare the calculated bearing with the map direction.

**Notifications are late or absent:** check SalahOS notification settings, OS permission, battery optimisation/Focus modes and whether the platform permits the requested background behaviour.

**PWA appears stale:** reconnect, reload, close all SalahOS browser windows and reopen. Clear site data only as a last resort because locally stored settings may be removed.

**Kiosk is blank after reboot:** verify network-independent application assets were loaded previously, Chromium/autostart configuration, display output and the kiosk URL.

## 17. Reset and recovery

Before resetting, export any mosque timetable/profile data that must be retained. Use the application's reset/import-export controls where available. Browser site-data deletion or application-data clearing is a destructive recovery action and can remove saved settings, locations and locally imported timetable data.

After a reset, repeat first setup and verify prayer times against a trusted reference before relying on alerts or public display output.

## 18. Operational checklist for mosque displays

Before leaving a display unattended, verify today's Gregorian and Hijri dates, all prayer times, Iqamah times, Jumu'ah sessions, the next-prayer indicator/countdown, timezone, announcements, display readability and restart behaviour. Test both network-connected and offline operation where the deployment is expected to survive connectivity loss.

For technical build/signing details, consult the repository's platform-specific documentation and tested-platform status files.
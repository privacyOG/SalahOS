# SalahOS Managed Masjid Platform Roadmap

## Purpose

SalahOS already provides a strong local-first prayer-time application and smart-display foundation. The next major product phase should extend that foundation into a complete masjid operations and community communication platform without weakening the existing privacy-first individual experience.

The target is not to copy another product's interface or branding. SalahOS should provide equivalent or stronger capability through its own visual language, architecture and privacy model.

The resulting platform should support five coordinated product surfaces:

1. **Congregation app** — prayer times, Iqamah, mosque follow/favourites, announcements, events, notifications and optional donation links.
2. **Masjid admin console** — prayer/Iqamah management, content publishing, scheduling, display management and permissions.
3. **Managed smart displays** — TV/kiosk signage, prayer boards, announcement rotations and scheduled content.
4. **Public web layer** — mosque profile pages, monthly timetables, embeddable widgets and documented integration endpoints.
5. **Optional integrations** — donations, calendars, local-network/home automation and future third-party mosque systems.

Core prayer calculations, saved personal settings and normal SalahOS use must continue to work without a mandatory account or network connection.

---

## Product principles

- Preserve local-first prayer calculations and offline usefulness.
- Require accounts only for managed mosque administration and synchronized community features.
- Treat mosque-provided Salah and Iqamah data as a distinct source with explicit provenance.
- Never silently replace a user's selected calculation method or mosque timetable.
- Keep remote synchronization modular so the personal prayer application remains useful if the service is unavailable.
- Design for phones, tablets, Raspberry Pi Touch Display 2, 1080p/4K TVs and kiosk deployments from the same shared application/domain model.
- Make English and Arabic/RTL first-class across admin, congregation and signage surfaces.
- Keep the interface modern, restrained and highly readable rather than visually dense.
- Prefer progressive disclosure: everyday prayer information first, advanced configuration behind clear secondary navigation.
- Build accessibility, touch ergonomics, remote-control navigation and large-display readability into the design system rather than retrofitting them later.
- Keep all product authorship and branding under SalahOS / privacyOG.

---

## Capability benchmark and resulting SalahOS scope

The benchmarked masjid-management category commonly provides centralized prayer/Iqamah management, TV signage, content scheduling, congregation mobile notifications, mosque discovery, web embeds, monthly timetables, household/community announcements and donation surfaces.

SalahOS already covers the calculation engine, local mosque timetable import, Iqamah/Jumu'ah modelling, notifications, mobile shells, PWA/offline operation and smart-display runtime. The major gaps are therefore not prayer mathematics; they are **managed data, publishing workflows, synchronization, content scheduling and community-facing UX**.

---

## Phase 2A — UX and information architecture foundation

### 2A.1 SalahOS design system

- [ ] Define semantic colour tokens for light, dark and high-contrast themes.
- [ ] Define typography scale for phone, tablet, kiosk and long-distance TV viewing.
- [ ] Define spacing, radius, elevation, focus and motion tokens.
- [ ] Define reusable components for cards, prayer rows, stat blocks, segmented controls, dialogs, sheets, tabs, banners, empty states and forms.
- [ ] Create consistent iconography and visual rules for prayer, mosque, calendar, announcement, display and settings concepts.
- [ ] Define responsive navigation patterns for phone bottom navigation, tablet/desktop side navigation and TV/kiosk focus navigation.
- [ ] Add skeleton/loading, offline, sync-pending, sync-error and stale-data states.
- [ ] Add human-reviewed visual acceptance criteria in addition to geometry/overflow regression tests.

### 2A.2 Primary information architecture

Congregation application:

- [ ] Home / Today.
- [ ] Mosques.
- [ ] Calendar / Events.
- [ ] Community / Announcements.
- [ ] Settings.

Managed-masjid administration:

- [ ] Overview dashboard.
- [ ] Prayer & Iqamah.
- [ ] Jumu'ah / Ramadan schedules.
- [ ] Announcements.
- [ ] Events.
- [ ] Media library.
- [ ] Signage playlists and schedules.
- [ ] Displays / devices.
- [ ] Web publishing / embeds.
- [ ] Members / roles.
- [ ] Integrations.
- [ ] Audit/activity history.

### 2A.3 Home-screen redesign

- [ ] Redesign the existing dashboard around one dominant next-prayer card with countdown, start and Iqamah.
- [ ] Present today's full prayer schedule as a clean secondary timetable.
- [ ] Surface selected mosque, location and data provenance without overwhelming the primary view.
- [ ] Add compact upcoming Jumu'ah / Ramadan context where relevant.
- [ ] Add optional announcement/event preview cards below prayer content.
- [ ] Keep advanced calculation details discoverable but visually subordinate.
- [ ] Create polished empty states for no location, no mosque, no network and no managed content.

---

## Phase 2B — Managed mosque domain model

### 2B.1 Mosque profile

- [ ] Introduce stable mosque identifiers independent of display names.
- [ ] Store mosque name in English/Arabic where provided.
- [ ] Store address, coordinates, timezone and public contact fields.
- [ ] Store mosque logo/brand assets with validated type/size limits.
- [ ] Support mosque description, facilities and accessibility metadata.
- [ ] Support website/social/contact links as optional explicitly remote fields.
- [ ] Support one mosque organization managing multiple locations.
- [ ] Support branch/campus relationships.

### 2B.2 Prayer configuration

- [ ] Reuse the existing SalahOS calculation engine as the default calculated source.
- [ ] Allow mosque administrators to publish calculated, adjusted or fully supplied prayer-start times.
- [ ] Support fixed and offset Iqamah rules per prayer.
- [ ] Support date-specific overrides without mutating the base rule.
- [ ] Support seasonal rule ranges.
- [ ] Support multiple Jumu'ah sessions with khutbah/start metadata.
- [ ] Support Ramadan-specific Isha/Taraweeh and Suhur/Imsak/Iftar presentation.
- [ ] Add publish-preview validation before timetable changes become public.
- [ ] Record who changed a timetable, what changed and when.
- [ ] Support rollback to a previous published timetable revision.

### 2B.3 Mosque following and favourites

- [ ] Allow users to follow one or more mosques.
- [ ] Allow one mosque to be selected as the preferred local timetable source.
- [ ] Keep mosque following separate from precise device location.
- [ ] Cache followed-mosque prayer data for offline display.
- [ ] Clearly mark last synchronization time and stale remote data.

---

## Phase 2C — Authentication, authorization and administration

### 2C.1 Account boundary

- [ ] Keep all existing personal prayer functionality account-free.
- [ ] Require authentication only for managed-mosque administration and cross-device synchronized community features.
- [ ] Document exactly which data is local and which data is synchronized.

### 2C.2 Roles and permissions

- [ ] Define organization owner role.
- [ ] Define mosque administrator role.
- [ ] Define prayer-time manager role.
- [ ] Define content/editor role.
- [ ] Define signage operator role.
- [ ] Define read-only/auditor role.
- [ ] Enforce least privilege in both client UX and server authorization.
- [ ] Add invitation, expiry, revocation and role-change workflows.
- [ ] Add session/device management and explicit sign-out-all-devices control.

### 2C.3 Admin dashboard

- [ ] Create at-a-glance status for today's published prayer times.
- [ ] Show upcoming scheduled content and events.
- [ ] Show display/device online, stale and offline states.
- [ ] Show draft versus published changes.
- [ ] Surface failed synchronization or media-processing errors prominently.
- [ ] Make common daily tasks achievable in very few interactions.

---

## Phase 2D — Announcements, events and community publishing

### 2D.1 Announcements

- [ ] Create announcements with title, body, optional image and call-to-action.
- [ ] Support English and Arabic content independently.
- [ ] Support draft, scheduled, published, expired and archived states.
- [ ] Allow priority/pinned announcements.
- [ ] Define target surfaces: mobile, web, smart display or any combination.
- [ ] Define optional start/end publication windows.
- [ ] Support recurring announcements where appropriate.
- [ ] Add preview for phone, web and TV before publishing.

### 2D.2 Events

- [ ] Create mosque events with title, description, date/time, venue and optional image.
- [ ] Support all-day and timed events.
- [ ] Support recurring events.
- [ ] Support registration/external-link metadata without forcing a payment provider.
- [ ] Expose upcoming events to mobile, web and signage surfaces.
- [ ] Generate calendar-compatible exports/feeds where appropriate.

### 2D.3 Notification publishing

- [ ] Allow administrators to send announcement/event notifications to followers of a mosque.
- [ ] Separate urgent service announcements from normal promotional/community content.
- [ ] Give congregation users category-level notification preferences.
- [ ] Add quiet-hours and local-time safeguards.
- [ ] Prevent duplicate delivery across retry/reconnect paths.
- [ ] Retain prayer notifications as a distinct local scheduling subsystem.

---

## Phase 2E — Digital signage and managed displays

### 2E.1 Signage content model

- [ ] Keep the existing prayer board as a first-class signage scene.
- [ ] Add announcement scene.
- [ ] Add event scene.
- [ ] Add image scene.
- [ ] Add approved web-content scene with strict security controls.
- [ ] Add QR-code scene for safe external actions such as donations, registration or information.
- [ ] Add optional countdown scene for Ramadan, Jumu'ah or events.
- [ ] Ensure every scene has deterministic offline fallback behaviour.

### 2E.2 Playlists and scheduling

- [ ] Create ordered playlists of signage scenes.
- [ ] Configure per-scene dwell duration.
- [ ] Schedule playlists by date, weekday and time window.
- [ ] Support prayer-relative scheduling, for example a reminder scene before Iqamah.
- [ ] Support Jumu'ah-specific playlists.
- [ ] Support Ramadan schedule overrides.
- [ ] Resolve schedule conflicts deterministically and show the winning rule in admin preview.
- [ ] Cache the currently active and next playlist locally on each display.

### 2E.3 Display pairing and fleet management

- [ ] Introduce a display/device identity model.
- [ ] Implement short-lived pairing codes rather than typing admin credentials into a public TV.
- [ ] Assign a display to an organization/mosque/location.
- [ ] Assign display orientation, resolution/profile and playlist.
- [ ] Show last-seen, app version, content revision and sync state.
- [ ] Provide revoke/unpair action.
- [ ] Make displays continue operating from cached configuration when the network disappears.
- [ ] Reconcile automatically after reconnect without losing local prayer functionality.

### 2E.4 TV/kiosk UX

- [ ] Create professionally designed 16:9 prayer-board templates.
- [ ] Create portrait signage templates for foyer displays.
- [ ] Create Touch Display 2 templates optimized for close interaction.
- [ ] Ensure high readability from several metres on 1080p and 4K screens.
- [ ] Keep burn-in mitigation compatible with composed signage scenes.
- [ ] Keep keyboard/remote escape and recovery controls available to administrators.

---

## Phase 2F — Mosque discovery and congregation experience

### 2F.1 Mosque directory

- [ ] Add optional network-backed mosque search by name and broad area.
- [ ] Do not upload precise device coordinates unless the user explicitly requests nearby search.
- [ ] Support list and map-independent result presentation so core UX does not require a map provider.
- [ ] Show prayer/Iqamah freshness and source provenance in mosque profiles.
- [ ] Allow favourite/follow directly from results.

### 2F.2 Mosque profile screen

- [ ] Show today's Salah and Iqamah times prominently.
- [ ] Show Jumu'ah sessions.
- [ ] Show next prayer countdown using the mosque's timezone/timetable.
- [ ] Show announcements and upcoming events.
- [ ] Show address/contact/facilities where published.
- [ ] Show monthly timetable access.
- [ ] Show optional donation/support action where configured.

---

## Phase 2G — Monthly timetable and web integration

### 2G.1 Monthly timetable

- [ ] Generate month views from the same authoritative prayer-source model used by the app.
- [ ] Include Salah start, Iqamah and Jumu'ah fields where configured.
- [ ] Support Gregorian month selection and relevant Hijri context.
- [ ] Provide clean print/PDF-friendly styling.
- [ ] Provide multiple SalahOS-owned visual templates.
- [ ] Provide CSV/JSON export for administrators.

### 2G.2 Embeddable widgets

- [ ] Build embeddable daily prayer widget.
- [ ] Build embeddable monthly timetable widget.
- [ ] Build embeddable next-prayer widget.
- [ ] Support light/dark and constrained theme parameters.
- [ ] Support English and Arabic/RTL.
- [ ] Make embed configuration copy/paste simple for nontechnical mosque administrators.
- [ ] Apply strict CSP/origin and framing rules to the hosted integration layer.

### 2G.3 Documented API/integration surface

- [ ] Define stable read-only public endpoints for published mosque prayer data where appropriate.
- [ ] Version schemas explicitly.
- [ ] Rate-limit and cache public endpoints.
- [ ] Never expose administration or private member data through public endpoints.
- [ ] Document examples for websites and local signage integrations.

---

## Phase 2H — Donations and external actions

SalahOS should not require its own payment processor to reach useful feature parity. Initial support can safely focus on presentation and routing.

- [ ] Allow a mosque administrator to configure one or more approved donation URLs.
- [ ] Render optional donation action in mosque profile.
- [ ] Generate QR code for configured donation URL on signage.
- [ ] Allow campaign-specific title/image/date metadata while keeping payment processing external.
- [ ] Validate URL scheme/host policy and prevent arbitrary executable/content injection.
- [ ] Clearly identify when the user is leaving SalahOS for an external payment provider.
- [ ] Research direct payment-provider integrations only as a separate security/compliance project.

---

## Phase 2I — Synchronization architecture

- [ ] Define server-side organization, mosque, publication, event, display and role schemas.
- [ ] Keep prayer-calculation code independent of the remote service.
- [ ] Define revisioned synchronization payloads.
- [ ] Use optimistic concurrency/version checks for admin edits.
- [ ] Make publication changes transactional where multiple surfaces depend on one revision.
- [ ] Cache last-known-good public mosque data locally.
- [ ] Define deterministic stale-data policy.
- [ ] Define retry/backoff and reconnect behaviour.
- [ ] Never block local prayer calculation because remote synchronization failed.
- [ ] Support server/service migration without invalidating locally stored personal settings.

---

## Phase 2J — Security and privacy expansion

- [ ] Expand threat model for authenticated administration and hosted mosque data.
- [ ] Define data-retention rules for account, audit and device records.
- [ ] Add server-side authorization tests for every privileged operation.
- [ ] Add CSRF/session/token protections appropriate to the chosen authentication model.
- [ ] Add rate limiting for authentication, pairing and public APIs.
- [ ] Add media upload validation and safe storage rules.
- [ ] Prevent arbitrary script/HTML execution in announcements and signage.
- [ ] Add audit log for prayer-time changes, publishing, role changes and display pairing.
- [ ] Add account recovery policy that does not weaken mosque ownership security.
- [ ] Add backup/export strategy for mosque-managed content.
- [ ] Add deletion/offboarding workflow for organizations.
- [ ] Preserve zero mandatory telemetry for personal prayer use.

---

## Phase 2K — Accessibility, localisation and content quality

- [ ] Verify every new admin flow by keyboard.
- [ ] Verify touch targets on mobile/tablet/Pi displays.
- [ ] Verify focus order and focus restoration across dialogs/sheets.
- [ ] Add Arabic/RTL coverage for every new surface before it is considered complete.
- [ ] Ensure administrator-supplied mixed Arabic/Latin content is bidi-isolated safely.
- [ ] Verify 200% text scaling on core congregation/admin views where platform permits.
- [ ] Verify TV templates at realistic viewing distance on physical hardware when available.
- [ ] Add additional languages only through the existing typed localisation architecture.

---

## Phase 2L — Test and release gates

### Domain and integration tests

- [ ] Mosque profile validation tests.
- [ ] Published timetable revision tests.
- [ ] Role/permission matrix tests.
- [ ] Announcement scheduling tests.
- [ ] Event recurrence tests.
- [ ] Signage playlist conflict-resolution tests.
- [ ] Display pairing/revocation tests.
- [ ] Offline cached-display tests.
- [ ] Reconnect/reconciliation tests.
- [ ] Embed/public API contract tests.
- [ ] Stale remote data and local-prayer fallback tests.

### Visual and UX regression

- [ ] Congregation phone portrait/landscape matrix.
- [ ] Admin tablet/desktop matrix.
- [ ] Arabic/RTL admin matrix.
- [ ] 1080p and 4K signage template matrix.
- [ ] Raspberry Pi Touch Display 2 matrix.
- [ ] Human aesthetic review before each major UI release.
- [ ] Task-based usability checks for common administrator workflows.

### Managed-platform release gate

A managed-masjid milestone must not be called production-ready until:

- [ ] Personal/offline prayer mode still passes all existing v1 gates.
- [ ] A mosque can publish prayer/Iqamah changes and followers receive the correct resulting schedule.
- [ ] A paired display can cold-start from cached data with the network unavailable.
- [ ] Announcements/events can be scheduled once and appear only on selected surfaces/windows.
- [ ] Role boundaries are verified server-side, not only hidden in the UI.
- [ ] English and Arabic/RTL are verified across congregation, admin and display surfaces.
- [ ] Web/embed interfaces cannot expose private administrative data.
- [ ] Security, dependency, privacy and release documentation are current.

---

## Recommended delivery sequence

### Milestone M1 — UI/UX modernization

Complete Phase 2A first. Refactor the current large application surface into reusable navigation, page and design-system components before adding networked product complexity.

### Milestone M2 — Local managed-mosque prototype

Implement Phase 2B and a local-only version of announcements, events and signage scheduling using the existing persistence architecture. This proves the domain/UX without immediately coupling the project to backend infrastructure.

### Milestone M3 — Remote administration and display sync

Implement Phase 2C, Phase 2E display pairing/fleet management and Phase 2I synchronization. Preserve last-known-good offline display operation as a hard acceptance criterion.

### Milestone M4 — Congregation community layer

Implement mosque following, public mosque profiles, remote announcements/events and category notification preferences.

### Milestone M5 — Web publishing and integration

Implement monthly timetable generation, widgets, public read-only APIs and optional donation-link/QR presentation.

### Milestone M6 — Production hardening

Complete Phase 2J–2L, physical display acceptance, accessibility review, full RTL coverage and managed-platform release documentation.

---

## TODO.md integration

When implementation begins, promote the sections above into the main `TODO.md` after the existing Phase 2 roadmap. Keep this roadmap as the product-level specification while `TODO.md` remains the authoritative implementation/evidence tracker.

Suggested tracker grouping:

- Stage 22 — UI/UX modernization and design system.
- Stage 23 — Managed mosque profiles and prayer publishing.
- Stage 24 — Authentication, roles and admin console.
- Stage 25 — Announcements, events and community notifications.
- Stage 26 — Digital signage scheduling and display fleet management.
- Stage 27 — Mosque directory and congregation following.
- Stage 28 — Monthly timetable, embeds and public integrations.
- Stage 29 — Optional donation/external-action surfaces.
- Stage 30 — Remote synchronization, security and privacy hardening.
- Stage 31 — Managed-platform acceptance and release gates.

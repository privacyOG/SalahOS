# Current prayer state convention

SalahOS treats the Today screen's **current prayer** indicator as a civil-day schedule presentation, not as a fiqh ruling about the legal end of a prayer time.

The selected prayer-source dashboard exposes three states:

- `active` — an obligatory prayer is the current displayed schedule interval.
- `before-first-obligatory-prayer` — local civil time is after midnight but before the first available obligatory prayer start for that civil day.
- `no-current-obligatory-prayer` — no obligatory prayer is current under the display schedule, including the interval after the calculated sunrise boundary and before Dhuhr.

Before Fajr, SalahOS deliberately does **not** silently carry the previous civil day's Isha forward as the current prayer. The UI states that the user is before today's first obligatory prayer. This convention keeps the product behavior explicit while avoiding an implied fiqh judgment.

# Mosque profile screen

The congregation mosque profile surface presents published mosque information without changing the local prayer calculation subsystem.

## Surface

The screen supports:

- today's Salah start and Iqamah times;
- a prominent next-prayer name and countdown supplied by the caller using the mosque timetable/timezone;
- one or more Jumu'ah sessions with optional khutbah time;
- published announcements and upcoming events;
- published address, contact and facilities;
- prayer-data provenance and freshness labels;
- optional monthly timetable access;
- optional external mosque support action.

## Data boundary

The component is presentation-only. It does not calculate prayer times, fetch remote mosque data, mutate follow state, process payments, or select a mosque as the user's personal calculation source. Those responsibilities remain separate so normal SalahOS prayer use continues to work locally and account-free.

Optional links are rendered only when a validated upstream configuration supplies them. Payment processing remains external to SalahOS.

# Community notification publishing

This document defines the Stage 25 community-notification publishing boundary for managed mosques.

## Scope

Managed mosque administrators may prepare community notifications for followers of a mosque from three explicit categories:

- service notices;
- announcements;
- events.

Prayer notifications are intentionally not part of this domain. Existing SalahOS prayer reminders remain a distinct local scheduling subsystem and continue to work without a managed-mosque account or community-delivery service.

## Community categories and urgency

Normal announcements and event notifications are community content. Urgent delivery is reserved for service notices such as an unexpected closure, access problem or other operational message that needs prompt visibility.

An `urgent-service` request is invalid unless it uses the `service` category. This prevents normal promotional or community content from silently bypassing user safeguards.

## User preferences

Congregation users can enable or disable community notification categories independently:

- service;
- announcement;
- event.

These preferences are evaluated before a delivery is accepted.

## Quiet hours and local-time safeguards

Quiet hours use explicit local wall-clock `HH:mm` values and support both daytime and overnight windows. Normal community content is deferred while quiet hours are active.

Urgent service notices may bypass quiet hours only when the user has kept the service-notice category enabled. The domain deliberately accepts a resolved local wall-clock value rather than performing timezone or network lookup itself; the application boundary supplying that value remains responsible for resolving the user's local time correctly.

A quiet-hours window with identical start and end values represents an all-day quiet period.

## Duplicate prevention

Every community notification carries a stable idempotency key. Delivery evaluation returns `duplicate` when that key already appears in the delivered-key set. This contract is intended to remain stable across retry, reconnect and transport changes.

A future transport implementation must persist idempotency state atomically with accepted delivery and must not rely only on an in-memory set.

## Delivery decisions

The domain produces one of four deterministic decisions:

- `deliver` — the message may be passed to the delivery transport;
- `quiet-hours` — normal content should be deferred;
- `disabled` — the user disabled that category;
- `duplicate` — the idempotency key was already accepted.

## Boundaries

This slice does not introduce:

- push-provider credentials;
- remote persistence;
- authenticated server mutations;
- APNs, FCM or web-push transport;
- retry queues or provider-specific delivery receipts;
- follower-directory storage;
- device-token storage;
- prayer-reminder scheduling changes.

Those concerns belong to later synchronization, security and deployment work. This domain establishes the provider-independent rules that those implementations must preserve.

# Managed Mosque Authorization Boundary

## Purpose

This document defines the local domain contract for SalahOS managed-mosque authorization before any remote authentication provider or server transport is selected.

Existing personal prayer calculation, saved settings, local notifications and offline prayer use remain account-free. Authentication is required only for managed-mosque administration and future synchronized community features.

## Roles

The authorization domain defines the six roadmap roles:

- organization owner
- mosque administrator
- prayer-time manager
- content/editor
- signage operator
- read-only/auditor

Permissions are explicit and least-privilege. Organization owners can manage the organization and members. Mosque administrators can manage mosque-level administration but do not receive organization-management permission. Prayer, content and signage specialist roles receive only the permissions required for their function. Read-only auditors receive read and audit access without publish or management permissions.

## Scope

Every managed membership is scoped to one mosque organization and zero or more mosque IDs.

An organization owner with an empty mosque list represents organization-wide scope. Other roles are constrained to their declared mosque IDs. Permission checks therefore combine membership status, role permission and mosque scope.

This model is intentionally independent of device location and congregation following state.

## Membership lifecycle

Memberships are either active or revoked. Role changes create a new immutable membership value with the same identity and scope. Revoked memberships cannot authorize any operation.

Invitation contracts include creation time, expiry time, scope, role and lifecycle state. Pending invitations become expired when evaluated at or after their expiry timestamp. Revoked, expired or already accepted invitations cannot be accepted.

## Sessions and devices

Managed sessions record a stable session ID, member ID, human-readable device label, creation time and optional revocation time. The domain supports both individual revocation and sign-out-all-devices behavior for a member.

This is a data and policy contract only. Token issuance, cookie/session storage, MFA, recovery and server-side enforcement are deliberately deferred until the remote authentication architecture is selected.

## Local versus synchronized data

Personal SalahOS prayer data remains local-first and does not require an account.

Future synchronized managed data will include organization membership, invitations, sessions/devices, audit events and other mosque administration records. Server-side authorization must enforce the same permission and scope model defined here; client UI checks are never sufficient on their own.

## Security invariants

- No revoked membership authorizes any operation.
- A role cannot obtain permissions outside its fixed permission set.
- Mosque-scoped roles cannot operate on a mosque outside their assigned scope.
- Organization-wide access is reserved for the organization-owner role.
- Expired or revoked invitations cannot be accepted.
- Session revocation cannot predate session creation.
- Sign-out-all-devices only revokes active sessions belonging to the selected member.
- Personal prayer functionality remains independent of managed authentication state.

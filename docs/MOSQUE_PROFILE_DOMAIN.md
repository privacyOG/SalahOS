# Managed Mosque Profile Domain

## Purpose

Stage 23 introduces the first managed-masjid domain boundary without making normal SalahOS prayer use dependent on an account, server, or network connection.

The profile model describes stable mosque identity and public metadata. It deliberately does **not** implement authentication, synchronization, publishing, donations, or remote administration. Those remain separate later stages so the existing local prayer engine stays independent.

## Stable identity

`MosqueId` and `MosqueOrganizationId` are opaque application identifiers created through `createMosqueId` and `createMosqueOrganizationId`.

IDs:

- are independent of mosque display names;
- are canonicalized to lowercase;
- are limited to 2-128 characters;
- permit letters, numbers, `.`, `_`, `:`, and `-`;
- reject whitespace and path-like values.

A mosque may therefore rename its English or Arabic public name without changing references, follows, published timetable ownership, or future display assignments.

## Mosque organization

`MosqueOrganization` provides the first organization/branch relationship model. An organization has:

- a stable organization ID;
- at least one English or Arabic organization name;
- up to 100 unique branch mosque IDs.

The domain layer validates uniqueness after ID normalization, preventing the same branch from being represented twice with case differences.

## Mosque profile

`MosqueProfile` stores:

- stable mosque ID;
- optional organization ID;
- optional parent mosque/campus ID;
- English and/or Arabic name;
- optional bilingual description;
- formatted public address and optional two-letter country code;
- validated latitude/longitude;
- validated IANA timezone identifier;
- supported facility flags;
- optional bilingual accessibility notes;
- optional public email and phone;
- up to 10 validated public links;
- optional bounded raster logo metadata.

A profile may not reference itself as its parent.

## Public-link safety boundary

Published profile links are restricted to absolute HTTP or HTTPS URLs. URLs containing embedded username/password credentials are rejected. Duplicate normalized URLs are also rejected.

This model stores link metadata only. It does not fetch remote pages or execute administrator-supplied markup.

## Logo metadata boundary

The initial logo contract accepts metadata for PNG, JPEG, or WebP assets only. A logo must be:

- at least 1 byte and no more than 5 MB;
- between 1 and 4096 pixels in both dimensions.

This does not by itself constitute media-upload validation. Future upload/storage work must additionally verify actual file signatures, decoded dimensions, storage quotas, authorization, and safe delivery headers before managed media is accepted.

## Privacy and offline boundary

The profile model is pure local domain code. Creating or validating a profile:

- performs no network request;
- does not read precise device location;
- does not modify the user's selected calculation method or local mosque timetable;
- does not require an account;
- does not change existing prayer calculations or notification scheduling.

Future synchronization may serialize this domain model, but remote service availability must never become a prerequisite for local SalahOS prayer calculation.

## Follow-on Stage 23 work

The next managed-mosque domain slices should build on these stable identities for:

1. authoritative prayer/Iqamah publication configuration;
2. date-specific and seasonal overrides;
3. multiple Jumu'ah sessions;
4. Ramadan-specific presentation metadata;
5. publish-preview validation;
6. immutable publication revisions and rollback provenance.

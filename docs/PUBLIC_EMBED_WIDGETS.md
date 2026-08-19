# Public embed widgets

Stage 28 provides a constrained public embed contract for mosque websites without exposing administration or private congregation data.

## Widget types

The public embed path supports three read-only widget kinds:

- `daily` — today's published Salah and Iqamah presentation.
- `monthly` — the published monthly timetable presentation.
- `next-prayer` — the next published mosque prayer and countdown presentation.

Each widget accepts only a constrained light/dark theme and English/Arabic locale. Arabic renders right-to-left.

## Copy and paste configuration

`buildPublicEmbedSnippet()` produces a complete iframe snippet for nontechnical mosque administrators. The generated frame is lazy-loaded, uses `no-referrer`, and applies a restricted sandbox containing only `allow-same-origin`.

The application configurator displays the exact hosted path and iframe source so administrators can copy it into an existing mosque website.

## Framing and content policy

`publicEmbedSecurityPolicy()` produces policy metadata for the hosted integration layer. It requires explicitly approved credential-free HTTPS frame origins and constructs a restrictive content security policy with:

- `default-src 'none'`
- same-origin scripts
- constrained styles and images
- explicit `frame-ancestors`
- no base URI
- no form submission

The hosted deployment must apply these headers at the HTTP edge or application server. A browser component cannot enforce response headers by itself.

## Data boundary

Embed widgets are public and read-only. They may present already-published mosque profile and prayer data only. They must not expose administrator sessions, member records, invitation state, device pairing secrets, unpublished drafts, audit records, or mutation endpoints.

The public API and hosted delivery implementation are defined separately in Phase 2G.3.

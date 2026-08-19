export type PublicEmbedKind = 'daily' | 'monthly' | 'next-prayer';
export type PublicEmbedTheme = 'light' | 'dark';
export type PublicEmbedLocale = 'en' | 'ar';

export interface PublicEmbedConfig {
  readonly mosqueId: string;
  readonly kind: PublicEmbedKind;
  readonly theme: PublicEmbedTheme;
  readonly locale: PublicEmbedLocale;
}

export interface PublicEmbedSecurityPolicy {
  readonly frameAncestors: readonly string[];
  readonly contentSecurityPolicy: string;
  readonly referrerPolicy: 'no-referrer';
}

const MOSQUE_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u;

export function createPublicEmbedConfig(config: PublicEmbedConfig): PublicEmbedConfig {
  const mosqueId = config.mosqueId.trim().toLowerCase();
  if (mosqueId.length < 2 || mosqueId.length > 160 || !MOSQUE_ID_PATTERN.test(mosqueId)) {
    throw new RangeError('Mosque ID must use a stable lowercase-safe identifier');
  }

  return Object.freeze({
    mosqueId,
    kind: config.kind,
    theme: config.theme,
    locale: config.locale,
  });
}

export function buildPublicEmbedPath(config: PublicEmbedConfig): string {
  const normalized = createPublicEmbedConfig(config);
  const params = new URLSearchParams({
    theme: normalized.theme,
    lang: normalized.locale,
  });
  return `/embed/${normalized.kind}/${encodeURIComponent(normalized.mosqueId)}?${params.toString()}`;
}

export function buildPublicEmbedSnippet(
  origin: string,
  config: PublicEmbedConfig,
  title: string,
): string {
  const parsed = new URL(origin);
  if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
    throw new RangeError('Embed origin must be credential-free HTTPS');
  }

  const normalizedTitle = title.trim().replace(/\s+/gu, ' ');
  if (normalizedTitle.length === 0 || normalizedTitle.length > 160) {
    throw new RangeError('Embed title must be between 1 and 160 characters');
  }

  const src = `${parsed.origin}${buildPublicEmbedPath(config)}`;
  return `<iframe src="${src}" title="${escapeAttribute(normalizedTitle)}" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-same-origin" style="width:100%;border:0;min-height:320px" />`;
}

export function publicEmbedSecurityPolicy(
  allowedOrigins: readonly string[],
): PublicEmbedSecurityPolicy {
  const normalized = allowedOrigins.map((origin) => {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
      throw new RangeError('Allowed frame origins must be credential-free HTTPS origins');
    }
    return parsed.origin;
  });

  const frameAncestors = Object.freeze([...new Set(normalized)].sort());
  const contentSecurityPolicy = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    `frame-ancestors ${frameAncestors.length === 0 ? "'none'" : frameAncestors.join(' ')}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');

  return Object.freeze({
    frameAncestors,
    contentSecurityPolicy,
    referrerPolicy: 'no-referrer',
  });
}

export function publicEmbedDirection(locale: PublicEmbedLocale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

function escapeAttribute(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/"/gu, '&quot;').replace(/</gu, '&lt;');
}

export interface RemoteApiPolicy {
  readonly allowedOrigins: readonly string[];
}

export type RemoteFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function normalizedAllowedOrigins(origins: readonly string[]): ReadonlySet<string> {
  return new Set(
    origins.map((origin) => {
      const parsed = new URL(origin);
      if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
        throw new TypeError('Optional remote API origins must be credential-free HTTPS origins');
      }
      if (parsed.pathname !== '/' || parsed.search !== '' || parsed.hash !== '') {
        throw new TypeError('Optional remote API allowlist entries must be origins, not paths');
      }
      return parsed.origin;
    }),
  );
}

export function validateRemoteApiUrl(rawUrl: string | URL, policy: RemoteApiPolicy): URL {
  const url = rawUrl instanceof URL ? new URL(rawUrl.href) : new URL(rawUrl);
  if (url.protocol !== 'https:') {
    throw new TypeError('Optional remote API requests require HTTPS');
  }
  if (url.username !== '' || url.password !== '') {
    throw new TypeError('Credentials must not be embedded in optional remote API URLs');
  }

  const allowed = normalizedAllowedOrigins(policy.allowedOrigins);
  if (!allowed.has(url.origin)) {
    throw new TypeError(`Remote API origin is not explicitly allowed: ${url.origin}`);
  }
  return url;
}

export function hardenedRemoteRequestInit(init: RequestInit = {}): RequestInit {
  if (init.credentials !== undefined && init.credentials !== 'omit') {
    throw new TypeError('Optional remote API requests must not send browser credentials');
  }
  if (init.redirect !== undefined && init.redirect !== 'error') {
    throw new TypeError('Optional remote API requests must fail on redirects');
  }
  if (init.referrerPolicy !== undefined && init.referrerPolicy !== 'no-referrer') {
    throw new TypeError('Optional remote API requests must not disclose a referrer');
  }

  return {
    ...init,
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
  };
}

export async function secureRemoteFetch(
  rawUrl: string | URL,
  init: RequestInit,
  policy: RemoteApiPolicy,
  fetcher: RemoteFetch = fetch,
): Promise<Response> {
  const url = validateRemoteApiUrl(rawUrl, policy);
  return fetcher(url, hardenedRemoteRequestInit(init));
}

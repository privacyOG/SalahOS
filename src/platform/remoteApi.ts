export interface RemoteApiPolicy {
  readonly allowedOrigins: readonly string[];
}

export type RemoteFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const forbiddenCredentialHeaders = new Set([
  'authorization',
  'cookie',
  'proxy-authorization',
  'x-api-key',
]);

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
  if (url.hash !== '') {
    throw new TypeError('Optional remote API URLs must not contain fragments');
  }

  const allowed = normalizedAllowedOrigins(policy.allowedOrigins);
  if (!allowed.has(url.origin)) {
    throw new TypeError(`Remote API origin is not explicitly allowed: ${url.origin}`);
  }
  return url;
}

function rejectSensitiveHeaders(headersInit: HeadersInit | undefined): void {
  const headers = new Headers(headersInit);
  for (const name of forbiddenCredentialHeaders) {
    if (headers.has(name)) {
      throw new TypeError(`Optional remote API requests must not include ${name} headers`);
    }
  }
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
  if (init.referrer !== undefined && init.referrer !== '') {
    throw new TypeError('Optional remote API requests must not set an explicit referrer');
  }
  if (init.mode !== undefined && init.mode !== 'cors') {
    throw new TypeError('Optional remote API requests require CORS mode');
  }
  if (init.cache !== undefined && init.cache !== 'no-store') {
    throw new TypeError('Optional remote API requests must not use browser HTTP cache');
  }
  rejectSensitiveHeaders(init.headers);

  return {
    ...init,
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
    referrer: '',
    mode: 'cors',
    cache: 'no-store',
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

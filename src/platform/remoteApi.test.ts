import { describe, expect, it, vi } from 'vitest';
import {
  hardenedRemoteRequestInit,
  secureRemoteFetch,
  validateRemoteApiUrl,
  type RemoteFetch,
} from './remoteApi';

const policy = { allowedOrigins: ['https://api.example.test'] } as const;

describe('optional remote API security boundary', () => {
  it('accepts only explicitly allowlisted HTTPS origins', () => {
    expect(validateRemoteApiUrl('https://api.example.test/v1/mosques', policy).href).toBe(
      'https://api.example.test/v1/mosques',
    );
    expect(() => validateRemoteApiUrl('http://api.example.test/v1/mosques', policy)).toThrow(
      TypeError,
    );
    expect(() => validateRemoteApiUrl('https://other.example.test/v1/mosques', policy)).toThrow(
      TypeError,
    );
    expect(() => validateRemoteApiUrl('https://user:secret@api.example.test/v1', policy)).toThrow(
      TypeError,
    );
    expect(() => validateRemoteApiUrl('https://api.example.test/v1#secret', policy)).toThrow(
      TypeError,
    );
  });

  it('requires allowlist entries to be credential-free HTTPS origins', () => {
    expect(() =>
      validateRemoteApiUrl('https://api.example.test/v1', {
        allowedOrigins: ['https://api.example.test/base'],
      }),
    ).toThrow(TypeError);
    expect(() =>
      validateRemoteApiUrl('https://api.example.test/v1', {
        allowedOrigins: ['http://api.example.test'],
      }),
    ).toThrow(TypeError);
  });

  it('hardens credential, redirect, referrer, cache and request-mode behavior', () => {
    expect(hardenedRemoteRequestInit({ method: 'GET' })).toMatchObject({
      method: 'GET',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      referrer: '',
      mode: 'cors',
      cache: 'no-store',
    });
    expect(() => hardenedRemoteRequestInit({ credentials: 'include' })).toThrow(TypeError);
    expect(() => hardenedRemoteRequestInit({ redirect: 'follow' })).toThrow(TypeError);
    expect(() => hardenedRemoteRequestInit({ referrerPolicy: 'origin' })).toThrow(TypeError);
    expect(() => hardenedRemoteRequestInit({ referrer: 'https://salahos.test/' })).toThrow(
      TypeError,
    );
    expect(() => hardenedRemoteRequestInit({ mode: 'no-cors' })).toThrow(TypeError);
    expect(() => hardenedRemoteRequestInit({ cache: 'default' })).toThrow(TypeError);
  });

  it('rejects manually supplied credential-bearing headers', () => {
    for (const [name, value] of [
      ['Authorization', 'Bearer secret'],
      ['Cookie', 'session=secret'],
      ['Proxy-Authorization', 'Basic secret'],
      ['X-Api-Key', 'secret'],
    ] as const) {
      expect(() => hardenedRemoteRequestInit({ headers: { [name]: value } }), name).toThrow(
        TypeError,
      );
    }

    expect(
      hardenedRemoteRequestInit({ headers: { Accept: 'application/json' } }).headers,
    ).toEqual({ Accept: 'application/json' });
  });

  it('passes the validated URL and hardened request options to the injected fetcher', async () => {
    const fetcher = vi.fn<RemoteFetch>(async () => new Response('{}', { status: 200 }));

    const response = await secureRemoteFetch(
      'https://api.example.test/v1/mosques',
      { method: 'GET' },
      policy,
      fetcher,
    );

    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBeInstanceOf(URL);
    expect(String(url)).toBe('https://api.example.test/v1/mosques');
    expect(init).toMatchObject({
      method: 'GET',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      referrer: '',
      mode: 'cors',
      cache: 'no-store',
    });
  });
});

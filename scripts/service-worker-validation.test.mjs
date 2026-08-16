import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const SERVICE_WORKER_PATH = new URL('../public/sw.js', import.meta.url);

class MemoryCache {
  constructor(entries = []) {
    this.entries = new Map(entries);
  }

  async addAll(urls) {
    for (const url of urls) {
      this.entries.set(url, new Response(`cached:${url}`, { status: 200 }));
    }
  }

  async put(request, response) {
    const key = typeof request === 'string' ? request : request.url;
    this.entries.set(key, response);
  }

  async match(request) {
    const key = typeof request === 'string' ? request : request.url;
    return this.entries.get(key);
  }
}

function createCacheStorage(initialCaches = {}) {
  const stores = new Map(
    Object.entries(initialCaches).map(([name, entries]) => [name, new MemoryCache(entries)]),
  );
  const deleted = [];

  return {
    deleted,
    stores,
    async open(name) {
      let cache = stores.get(name);
      if (cache === undefined) {
        cache = new MemoryCache();
        stores.set(name, cache);
      }
      return cache;
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      deleted.push(name);
      return stores.delete(name);
    },
    async match(request) {
      for (const cache of stores.values()) {
        const response = await cache.match(request);
        if (response !== undefined) return response;
      }
      return undefined;
    },
  };
}

async function loadServiceWorker({ caches, fetchImpl }) {
  const source = await readFile(SERVICE_WORKER_PATH, 'utf8');
  const listeners = new Map();
  let claimed = false;
  let skippedWaiting = false;

  const self = {
    location: { origin: 'https://salahos.test' },
    clients: {
      async claim() {
        claimed = true;
      },
    },
    async skipWaiting() {
      skippedWaiting = true;
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
  };

  vm.runInNewContext(source, {
    self,
    caches,
    fetch: fetchImpl,
    URL,
    Response,
    Promise,
  });

  return {
    listeners,
    wasClaimed: () => claimed,
    skippedWaiting: () => skippedWaiting,
  };
}

async function runLifecycleListener(listener) {
  let pending;
  listener({
    waitUntil(value) {
      pending = value;
    },
  });
  expect(pending).toBeDefined();
  await pending;
}

describe('production service worker', () => {
  it('pre-caches the app shell during install', async () => {
    const caches = createCacheStorage();
    const worker = await loadServiceWorker({
      caches,
      fetchImpl: async () => new Response('network'),
    });

    await runLifecycleListener(worker.listeners.get('install'));

    expect([...caches.stores.keys()]).toEqual(['salahos-shell-v2']);
    const shell = caches.stores.get('salahos-shell-v2');
    expect(await shell.match('/')).toBeInstanceOf(Response);
    expect(await shell.match('/manifest.webmanifest')).toBeInstanceOf(Response);
    expect(await shell.match('/icons/salahos.svg')).toBeInstanceOf(Response);
    expect(await shell.match('/icons/salahos-maskable.svg')).toBeInstanceOf(Response);
    expect(worker.skippedWaiting()).toBe(true);
  });

  it('serves the cached app shell when an offline navigation reload cannot reach the network', async () => {
    const cachedShell = new Response('<html>offline shell</html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    const caches = createCacheStorage({
      'salahos-shell-v2': [['/', cachedShell]],
    });
    const worker = await loadServiceWorker({
      caches,
      fetchImpl: async () => {
        throw new TypeError('network unavailable');
      },
    });
    const listener = worker.listeners.get('fetch');
    let responsePromise;

    listener({
      request: {
        method: 'GET',
        mode: 'navigate',
        url: 'https://salahos.test/settings',
      },
      respondWith(value) {
        responsePromise = value;
      },
    });

    expect(responsePromise).toBeDefined();
    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<html>offline shell</html>');
  });

  it('removes only stale SalahOS shell caches during a v1 to v2 activation', async () => {
    const caches = createCacheStorage({
      'salahos-shell-v1': [],
      'salahos-shell-v2': [],
      'unrelated-app-cache': [],
    });
    const worker = await loadServiceWorker({
      caches,
      fetchImpl: async () => new Response('network'),
    });

    await runLifecycleListener(worker.listeners.get('activate'));

    expect(caches.deleted).toEqual(['salahos-shell-v1']);
    expect([...caches.stores.keys()].sort()).toEqual(
      ['salahos-shell-v2', 'unrelated-app-cache'].sort(),
    );
    expect(worker.wasClaimed()).toBe(true);
  });
});

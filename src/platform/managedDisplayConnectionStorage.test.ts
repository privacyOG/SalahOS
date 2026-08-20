import { describe, expect, it } from 'vitest';

import type { KeyValueStorage } from './settingsStorage';
import {
  clearManagedDisplayConnection,
  loadManagedDisplayConnection,
  parseManagedDisplayConnection,
  saveManagedDisplayConnection,
  serializeManagedDisplayConnection,
} from './managedDisplayConnectionStorage';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const connection = {
  baseUrl: 'https://admin.example.org',
  displayId: 'display:lobby',
  deviceToken: 'd'.repeat(48),
} as const;

describe('managed display connection storage', () => {
  it('round-trips a validated managed display connection', () => {
    expect(parseManagedDisplayConnection(serializeManagedDisplayConnection(connection))).toEqual({
      ...connection,
      baseUrl: 'https://admin.example.org',
    });
  });

  it('persists, loads and clears the device connection', () => {
    const storage = new MemoryStorage();
    saveManagedDisplayConnection(storage, connection);
    expect(loadManagedDisplayConnection(storage)).toEqual(connection);

    clearManagedDisplayConnection(storage);
    expect(loadManagedDisplayConnection(storage)).toBeNull();
  });

  it('fails closed on invalid persisted connection data', () => {
    const storage = new MemoryStorage();
    storage.setItem('salahos.managedDisplayConnection', '{"version":99}');
    expect(loadManagedDisplayConnection(storage)).toBeNull();
  });

  it('rejects non-HTTPS remote service URLs outside loopback', () => {
    expect(() =>
      serializeManagedDisplayConnection({
        ...connection,
        baseUrl: 'http://admin.example.org',
      }),
    ).toThrow(/HTTPS/u);
  });
});

import type { NotificationPreferences } from '../domain/notificationPreferences';
import type { ObligatoryPrayerName } from '../domain/prayerEngine';

const DATABASE_NAME = 'salahos-local-media';
const DATABASE_VERSION = 1;
const STORE_NAME = 'adhan-audio';
const SELECTED_AUDIO_KEY = 'selected';

export const MAX_LOCAL_ADHAN_AUDIO_BYTES = 25 * 1024 * 1024;

export interface LocalAdhanAudioRecord {
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly blob: Blob;
}

export interface LocalAdhanPrayerRow {
  readonly name: string;
  readonly localMinutes: number | null;
}

function isAudioMimeType(type: string): boolean {
  return type.toLowerCase().startsWith('audio/');
}

export function validateLocalAdhanAudio(input: {
  readonly name: string;
  readonly type: string;
  readonly size: number;
}): void {
  if (input.name.trim().length === 0) {
    throw new TypeError('Local Adhan audio must have a file name');
  }
  if (!isAudioMimeType(input.type)) {
    throw new TypeError('Local Adhan audio must use an audio MIME type');
  }
  if (!Number.isInteger(input.size) || input.size <= 0) {
    throw new RangeError('Local Adhan audio must not be empty');
  }
  if (input.size > MAX_LOCAL_ADHAN_AUDIO_BYTES) {
    throw new RangeError('Local Adhan audio exceeds the local size limit');
  }
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Unable to open local media storage'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionRequest<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const request = action(transaction.objectStore(STORE_NAME));
        request.onerror = () => reject(request.error ?? new Error('Local media storage request failed'));
        request.onsuccess = () => resolve(request.result);
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error('Local media storage transaction failed'));
        };
      }),
  );
}

export async function loadLocalAdhanAudio(): Promise<LocalAdhanAudioRecord | null> {
  const result = await transactionRequest<LocalAdhanAudioRecord | undefined>('readonly', (store) =>
    store.get(SELECTED_AUDIO_KEY),
  );
  if (result === undefined) {
    return null;
  }

  validateLocalAdhanAudio(result);
  if (!(result.blob instanceof Blob) || result.blob.size !== result.size) {
    throw new TypeError('Stored local Adhan audio is invalid');
  }
  return result;
}

export async function saveLocalAdhanAudio(file: File): Promise<LocalAdhanAudioRecord> {
  validateLocalAdhanAudio(file);
  const record: LocalAdhanAudioRecord = {
    name: file.name,
    type: file.type,
    size: file.size,
    blob: file,
  };
  await transactionRequest<IDBValidKey>('readwrite', (store) =>
    store.put(record, SELECTED_AUDIO_KEY),
  );
  return record;
}

export async function removeLocalAdhanAudio(): Promise<void> {
  await transactionRequest<undefined>('readwrite', (store) => store.delete(SELECTED_AUDIO_KEY));
}

export function foregroundAdhanPlaybackKey(input: {
  readonly date: string;
  readonly localMinutes: number;
  readonly prayers: readonly LocalAdhanPrayerRow[];
  readonly notifications: NotificationPreferences;
}): string | null {
  if (!Number.isFinite(input.localMinutes)) {
    return null;
  }

  const currentMinute = Math.floor(input.localMinutes);
  for (const prayer of input.prayers) {
    if (prayer.name === 'sunrise' || prayer.localMinutes === null) {
      continue;
    }
    const preference = input.notifications[prayer.name as ObligatoryPrayerName];
    if (
      preference !== undefined &&
      preference.enabled &&
      preference.adhanEnabled &&
      Math.floor(prayer.localMinutes) === currentMinute
    ) {
      return `${input.date}:${prayer.name}:local-adhan`;
    }
  }
  return null;
}

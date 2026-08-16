import type { NotificationPreferences } from '../domain/notificationPreferences';
import type { PrayerName } from '../domain/prayerEngine';

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
  readonly name: PrayerName;
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
    request.onerror = () => {
      reject(request.error ?? new Error('Unable to open local media storage'));
    };
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
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
        let requestResult: T | undefined;
        let requestSucceeded = false;
        let settled = false;

        const closeAndReject = (error: unknown) => {
          if (settled) return;
          settled = true;
          database.close();
          reject(error instanceof Error ? error : new Error('Local media storage failed'));
        };

        request.onerror = () => {
          closeAndReject(request.error ?? new Error('Local media storage request failed'));
        };
        request.onsuccess = () => {
          requestResult = request.result;
          requestSucceeded = true;
        };
        transaction.oncomplete = () => {
          if (settled) return;
          if (!requestSucceeded) {
            closeAndReject(new Error('Local media storage transaction completed without a result'));
            return;
          }
          settled = true;
          database.close();
          resolve(requestResult as T);
        };
        transaction.onerror = () => {
          closeAndReject(transaction.error ?? new Error('Local media storage transaction failed'));
        };
        transaction.onabort = () => {
          closeAndReject(transaction.error ?? new Error('Local media storage transaction aborted'));
        };
      }),
  );
}

export async function loadLocalAdhanAudio(): Promise<LocalAdhanAudioRecord | null> {
  const result = await transactionRequest<LocalAdhanAudioRecord | undefined>(
    'readonly',
    (store) => store.get(SELECTED_AUDIO_KEY) as IDBRequest<LocalAdhanAudioRecord | undefined>,
  );
  if (result === undefined) {
    return null;
  }

  validateLocalAdhanAudio(result);
  if (
    !(result.blob instanceof Blob) ||
    result.blob.size !== result.size ||
    result.blob.type !== result.type
  ) {
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
  await transactionRequest<IDBValidKey>('readwrite', (store) => {
    return store.put(record, SELECTED_AUDIO_KEY);
  });
  return record;
}

export async function removeLocalAdhanAudio(): Promise<void> {
  await transactionRequest<undefined>('readwrite', (store) => {
    return store.delete(SELECTED_AUDIO_KEY);
  });
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
    const preference = input.notifications[prayer.name];
    if (
      preference.enabled &&
      preference.adhanEnabled &&
      Math.floor(prayer.localMinutes) === currentMinute
    ) {
      return `${input.date}:${prayer.name}:local-adhan`;
    }
  }
  return null;
}

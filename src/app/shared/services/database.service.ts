import { Injectable } from '@angular/core';
import { AppState } from '../models/transaction.model';

const DATABASE_NAME = 'binance_database';
const DATABASE_VERSION = 1;
const STORE_NAME = 'records';
const STATE_KEY = 'finance_state';

interface DatabaseRecord<T> {
  key: string;
  value: T;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async getFinanceState(): Promise<AppState | null> {
    return this.get<AppState>(STATE_KEY);
  }

  async saveFinanceState(state: AppState): Promise<void> {
    await this.put(STATE_KEY, state);
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) {
      return this.databasePromise;
    }

    this.databasePromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not available.'));
        return;
      }

      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Unable to open database.'));
      request.onblocked = () => reject(new Error('Database upgrade was blocked.'));
    });

    return this.databasePromise;
  }

  private async get<T>(key: string): Promise<T | null> {
    try {
      const database = await this.openDatabase();

      return await new Promise<T | null>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const record = request.result as DatabaseRecord<T> | undefined;
          resolve(record?.value ?? null);
        };
        request.onerror = () => reject(request.error ?? new Error('Unable to read database.'));
      });
    } catch {
      return null;
    }
  }

  private async put<T>(key: string, value: T): Promise<void> {
    try {
      const database = await this.openDatabase();

      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const record: DatabaseRecord<T> = {
          key,
          value,
          updatedAt: new Date().toISOString(),
        };

        store.put(record);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('Unable to write database.'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Database write was aborted.'));
      });
    } catch {
      return;
    }
  }
}

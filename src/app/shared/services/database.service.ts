import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppState, Goal, RecurringRule, Transaction } from '../models/transaction.model';

const DATABASE_NAME = 'binance_database';
const DATABASE_VERSION = 1;
const STORE_NAME = 'records';
const STATE_KEY = 'finance_state';

interface DatabaseRecord<T> {
  key: string;
  value: T;
  updatedAt: string;
}

interface CloudStateRow {
  id: string;
  state: AppState;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private databasePromise: Promise<IDBDatabase> | null = null;
  private readonly supabaseUrl = environment.supabase.url.replace(/\/$/, '');
  private readonly supabaseAnonKey = environment.supabase.anonKey;
  private readonly sharedStateId = environment.supabase.stateId;

  async getFinanceState(): Promise<AppState | null> {
    const cloudState = await this.getCloudFinanceState();

    if (cloudState) {
      await this.saveLocalFinanceState(cloudState);
      return cloudState;
    }

    return this.getLocalFinanceState();
  }

  async saveFinanceState(state: AppState): Promise<void> {
    await this.saveLocalFinanceState(state);
    await this.saveCloudFinanceState(state);
  }

  async getLocalFinanceState(): Promise<AppState | null> {
    return this.get<AppState>(STATE_KEY);
  }

  async saveLocalFinanceState(state: AppState): Promise<void> {
    await this.put(STATE_KEY, state);
  }

  async getCloudFinanceState(): Promise<AppState | null> {
    if (!this.cloudConfigured()) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/binance_app_state?id=eq.${encodeURIComponent(this.sharedStateId)}&select=id,state,updated_at&limit=1`,
        {
          headers: this.cloudHeaders(),
        },
      );

      if (!response.ok) {
        return null;
      }

      const rows = await response.json() as CloudStateRow[];
      return rows[0]?.state ?? null;
    } catch {
      return null;
    }
  }

  async saveCloudFinanceState(state: AppState): Promise<void> {
    if (!this.cloudConfigured()) {
      return;
    }

    try {
      const existingState = await this.getCloudFinanceState();
      const stateToSave = existingState ? this.mergeStates(existingState, state) : state;

      await fetch(`${this.supabaseUrl}/rest/v1/binance_app_state?on_conflict=id`, {
        method: 'POST',
        headers: {
          ...this.cloudHeaders(),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: this.sharedStateId,
          state: stateToSave,
          updated_at: new Date().toISOString(),
        }),
      });
    } catch {
      return;
    }
  }

  private cloudConfigured(): boolean {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey && this.sharedStateId);
  }

  private cloudHeaders(): HeadersInit {
    return {
      apikey: this.supabaseAnonKey,
      Authorization: `Bearer ${this.supabaseAnonKey}`,
      'Content-Type': 'application/json',
    };
  }

  private mergeStates(remote: AppState, local: AppState): AppState {
    return {
      transactions: this.mergeById(remote.transactions, local.transactions),
      goals: this.mergeById(remote.goals, local.goals),
      recurringRules: this.mergeById(remote.recurringRules, local.recurringRules),
      lowBalanceThreshold: local.lowBalanceThreshold ?? remote.lowBalanceThreshold,
    };
  }

  private mergeById<T extends Transaction | Goal | RecurringRule>(remoteItems: T[], localItems: T[]): T[] {
    const items = new Map<string, T>();

    for (const item of remoteItems) {
      items.set(item.id, item);
    }

    for (const item of localItems) {
      items.set(item.id, item);
    }

    return [...items.values()];
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

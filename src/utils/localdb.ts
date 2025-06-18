import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Document {
  id: string;
  name: string;
  category: string;
  expiryDate?: string;
  file?: File;
  createdAt: string;
  tags: string[];
  customNotificationDays?: number;
  enableCustomNotification?: boolean;
}

export interface Card {
  id: string;
  name: string;
  lastFourDigits: string;
  bank: string;
  expiryDate: string;
  type: 'debit' | 'credit';
  supportContact?: string;
  createdAt: string;
  customNotificationDays?: number;
  enableCustomNotification?: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly' | 'weekly';
  renewalDate: string;
  autoRenewal: boolean;
  managementUrl?: string;
  cost?: number;
  currency?: string;
  createdAt: string;
  customNotificationDays?: number;
  enableCustomNotification?: boolean;
}

interface DocuMateDB extends DBSchema {
  documents: {
    key: string;
    value: Document;
  };
  cards: {
    key: string;
    value: Card;
  };
  subscriptions: {
    key: string;
    value: Subscription;
  };
  settings: {
    key: string;
    value: any;
  };
}

let db: IDBPDatabase<DocuMateDB> | null = null;

export async function initDB(): Promise<void> {
  if (db) return;

  try {
    db = await openDB<DocuMateDB>('documate-db', 1, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cards')) {
          db.createObjectStore('cards', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('subscriptions')) {
          db.createObjectStore('subscriptions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

async function ensureDB(): Promise<IDBPDatabase<DocuMateDB>> {
  if (!db) {
    await initDB();
  }
  if (!db) {
    throw new Error('Failed to initialize database');
  }
  return db;
}

// Document operations
export async function saveDocument(document: Document): Promise<void> {
  const database = await ensureDB();
  await database.put('documents', document);
}

export async function getDocuments(): Promise<Document[]> {
  const database = await ensureDB();
  return await database.getAll('documents');
}

export async function deleteDocument(id: string): Promise<void> {
  const database = await ensureDB();
  await database.delete('documents', id);
}

// Card operations
export async function saveCard(card: Card): Promise<void> {
  const database = await ensureDB();
  await database.put('cards', card);
}

export async function getCards(): Promise<Card[]> {
  const database = await ensureDB();
  return await database.getAll('cards');
}

export async function deleteCard(id: string): Promise<void> {
  const database = await ensureDB();
  await database.delete('cards', id);
}

// Subscription operations
export async function saveSubscription(subscription: Subscription): Promise<void> {
  const database = await ensureDB();
  await database.put('subscriptions', subscription);
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const database = await ensureDB();
  return await database.getAll('subscriptions');
}

export async function deleteSubscription(id: string): Promise<void> {
  const database = await ensureDB();
  await database.delete('subscriptions', id);
}

// Settings operations
export async function saveSetting(key: string, value: any): Promise<void> {
  const database = await ensureDB();
  await database.put('settings', { key, value });
}

export async function getSetting(key: string, defaultValue: any = null): Promise<any> {
  const database = await ensureDB();
  const result = await database.get('settings', key);
  return result ? result.value : defaultValue;
}

// Export/Import operations
export async function exportAllData(): Promise<{
  documents: Document[];
  cards: Card[];
  subscriptions: Subscription[];
  settings: any;
}> {
  const [documents, cards, subscriptions] = await Promise.all([
    getDocuments(),
    getCards(),
    getSubscriptions()
  ]);

  // Export all settings
  const database = await ensureDB();
  const settingsData = await database.getAll('settings');
  const settings: any = {};
  settingsData.forEach(item => {
    settings[item.key] = item.value;
  });

  return { documents, cards, subscriptions, settings };
}

export async function importAllData(data: {
  documents?: Document[];
  cards?: Card[];
  subscriptions?: Subscription[];
  settings?: any;
}): Promise<void> {
  const promises: Promise<void>[] = [];

  if (data.documents) {
    promises.push(...data.documents.map(doc => saveDocument(doc)));
  }

  if (data.cards) {
    promises.push(...data.cards.map(card => saveCard(card)));
  }

  if (data.subscriptions) {
    promises.push(...data.subscriptions.map(sub => saveSubscription(sub)));
  }

  if (data.settings) {
    Object.entries(data.settings).forEach(([key, value]) => {
      promises.push(saveSetting(key, value));
    });
  }

  await Promise.all(promises);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const database = await ensureDB();
  const tx = database.transaction(['documents', 'cards', 'subscriptions', 'settings'], 'readwrite');
  
  await Promise.all([
    tx.objectStore('documents').clear(),
    tx.objectStore('cards').clear(),
    tx.objectStore('subscriptions').clear(),
    tx.objectStore('settings').clear(),
    tx.done
  ]);
}
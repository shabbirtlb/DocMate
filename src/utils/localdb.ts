interface Document {
  id: string;
  name: string;
  category: string;
  expiryDate?: string;
  file?: File;
  createdAt: string;
  tags: string[];
  userId: string; // Added user association
}

interface Card {
  id: string;
  name: string;
  lastFourDigits: string;
  bank: string;
  expiryDate: string;
  type: 'debit' | 'credit';
  supportContact?: string;
  createdAt: string;
  userId: string; // Added user association
}

interface Subscription {
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
  userId: string; // Added user association
}

const DB_VERSION = 1;

let db: IDBDatabase;
let currentUserId: string | null = null;

// Get current user ID from auth
function getCurrentUserId(): string | null {
  try {
    const authData = localStorage.getItem('documate-auth');
    if (!authData) return null;
    const { userId } = JSON.parse(authData);
    return userId;
  } catch {
    return null;
  }
}

// Get user-specific database name
function getUserDBName(userId: string): string {
  return `DocumenteDB_${userId}`;
}

export async function initDB(): Promise<void> {
  currentUserId = getCurrentUserId();
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  const dbName = getUserDBName(currentUserId);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create documents store
      if (!db.objectStoreNames.contains('documents')) {
        const documentsStore = db.createObjectStore('documents', { keyPath: 'id' });
        documentsStore.createIndex('category', 'category', { unique: false });
        documentsStore.createIndex('expiryDate', 'expiryDate', { unique: false });
        documentsStore.createIndex('userId', 'userId', { unique: false });
      }

      // Create cards store
      if (!db.objectStoreNames.contains('cards')) {
        const cardsStore = db.createObjectStore('cards', { keyPath: 'id' });
        cardsStore.createIndex('expiryDate', 'expiryDate', { unique: false });
        cardsStore.createIndex('userId', 'userId', { unique: false });
      }

      // Create subscriptions store
      if (!db.objectStoreNames.contains('subscriptions')) {
        const subscriptionsStore = db.createObjectStore('subscriptions', { keyPath: 'id' });
        subscriptionsStore.createIndex('renewalDate', 'renewalDate', { unique: false });
        subscriptionsStore.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
}

// Document operations
export async function saveDocument(document: Omit<Document, 'userId'>): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const documentWithUser: Document = { ...document, userId };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents'], 'readwrite');
    const store = transaction.objectStore('documents');
    const request = store.put(documentWithUser);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getDocuments(): Promise<Document[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents'], 'readonly');
    const store = transaction.objectStore('documents');
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteDocument(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['documents'], 'readwrite');
    const store = transaction.objectStore('documents');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Card operations
export async function saveCard(card: Omit<Card, 'userId'>): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const cardWithUser: Card = { ...card, userId };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cards'], 'readwrite');
    const store = transaction.objectStore('cards');
    const request = store.put(cardWithUser);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getCards(): Promise<Card[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cards'], 'readonly');
    const store = transaction.objectStore('cards');
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteCard(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cards'], 'readwrite');
    const store = transaction.objectStore('cards');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Subscription operations
export async function saveSubscription(subscription: Omit<Subscription, 'userId'>): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

  const subscriptionWithUser: Subscription = { ...subscription, userId };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['subscriptions'], 'readwrite');
    const store = transaction.objectStore('subscriptions');
    const request = store.put(subscriptionWithUser);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['subscriptions'], 'readonly');
    const store = transaction.objectStore('subscriptions');
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deleteSubscription(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['subscriptions'], 'readwrite');
    const store = transaction.objectStore('subscriptions');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Export all data for current user
export async function exportAllData(): Promise<{
  documents: Document[];
  cards: Card[];
  subscriptions: Subscription[];
}> {
  const [documents, cards, subscriptions] = await Promise.all([
    getDocuments(),
    getCards(),
    getSubscriptions()
  ]);

  return { documents, cards, subscriptions };
}

// Import all data for current user
export async function importAllData(data: {
  documents?: Document[];
  cards?: Card[];
  subscriptions?: Subscription[];
}): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');

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

  await Promise.all(promises);
}

export type { Document, Card, Subscription };
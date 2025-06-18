import { supabase, EncryptionService } from './supabase';
import { getCurrentUser } from './auth';
import { generateUUID } from './uuid';

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

function getCurrentUserId(): string {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

// Document operations
export async function saveDocument(document: Document): Promise<void> {
  const userId = getCurrentUserId();
  const encryptedData = EncryptionService.encrypt(document, userId);

  const { error } = await supabase
    .from('documents')
    .upsert({
      id: document.id,
      user_id: userId,
      encrypted_data: encryptedData,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to save document: ${error.message}`);
  }
}

export async function getDocuments(): Promise<Document[]> {
  const userId = getCurrentUserId();

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get documents: ${error.message}`);
  }

  return data.map(row => EncryptionService.decrypt(row.encrypted_data, userId));
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

// Card operations
export async function saveCard(card: Card): Promise<void> {
  const userId = getCurrentUserId();
  const encryptedData = EncryptionService.encrypt(card, userId);

  const { error } = await supabase
    .from('cards')
    .upsert({
      id: card.id,
      user_id: userId,
      encrypted_data: encryptedData,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to save card: ${error.message}`);
  }
}

export async function getCards(): Promise<Card[]> {
  const userId = getCurrentUserId();

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get cards: ${error.message}`);
  }

  return data.map(row => EncryptionService.decrypt(row.encrypted_data, userId));
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete card: ${error.message}`);
  }
}

// Subscription operations
export async function saveSubscription(subscription: Subscription): Promise<void> {
  const userId = getCurrentUserId();
  const encryptedData = EncryptionService.encrypt(subscription, userId);

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      id: subscription.id,
      user_id: userId,
      encrypted_data: encryptedData,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to save subscription: ${error.message}`);
  }
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const userId = getCurrentUserId();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get subscriptions: ${error.message}`);
  }

  return data.map(row => EncryptionService.decrypt(row.encrypted_data, userId));
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete subscription: ${error.message}`);
  }
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

// Settings operations
export async function getUserSettings(): Promise<any> {
  const userId = getCurrentUserId();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('settings')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get user settings: ${error.message}`);
  }

  return EncryptionService.decrypt(data.settings, userId);
}

export async function saveUserSettings(settings: any): Promise<void> {
  const userId = getCurrentUserId();
  const encryptedSettings = EncryptionService.encrypt(settings, userId);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      settings: encryptedSettings,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to save user settings: ${error.message}`);
  }
}
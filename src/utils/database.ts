import { supabase, EncryptionService } from './supabase';
import { getCurrentUser } from './auth';

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
  try {
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
      console.error('Error saving document:', error);
      throw new Error(`Failed to save document: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in saveDocument:', error);
    throw error;
  }
}

export async function getDocuments(): Promise<Document[]> {
  try {
    const userId = getCurrentUserId();

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting documents:', error);
      throw new Error(`Failed to get documents: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(row => {
      try {
        return EncryptionService.decrypt(row.encrypted_data, userId);
      } catch (decryptError) {
        console.error('Error decrypting document:', decryptError);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Error in getDocuments:', error);
    return [];
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    throw error;
  }
}

// Card operations
export async function saveCard(card: Card): Promise<void> {
  try {
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
      console.error('Error saving card:', error);
      throw new Error(`Failed to save card: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in saveCard:', error);
    throw error;
  }
}

export async function getCards(): Promise<Card[]> {
  try {
    const userId = getCurrentUserId();

    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting cards:', error);
      throw new Error(`Failed to get cards: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(row => {
      try {
        return EncryptionService.decrypt(row.encrypted_data, userId);
      } catch (decryptError) {
        console.error('Error decrypting card:', decryptError);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Error in getCards:', error);
    return [];
  }
}

export async function deleteCard(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting card:', error);
      throw new Error(`Failed to delete card: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteCard:', error);
    throw error;
  }
}

// Subscription operations
export async function saveSubscription(subscription: Subscription): Promise<void> {
  try {
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
      console.error('Error saving subscription:', error);
      throw new Error(`Failed to save subscription: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in saveSubscription:', error);
    throw error;
  }
}

export async function getSubscriptions(): Promise<Subscription[]> {
  try {
    const userId = getCurrentUserId();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting subscriptions:', error);
      throw new Error(`Failed to get subscriptions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(row => {
      try {
        return EncryptionService.decrypt(row.encrypted_data, userId);
      } catch (decryptError) {
        console.error('Error decrypting subscription:', decryptError);
        return null;
      }
    }).filter(Boolean);
  } catch (error) {
    console.error('Error in getSubscriptions:', error);
    return [];
  }
}

export async function deleteSubscription(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subscription:', error);
      throw new Error(`Failed to delete subscription: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteSubscription:', error);
    throw error;
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
  try {
    const userId = getCurrentUserId();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('settings')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting user settings:', error);
      throw new Error(`Failed to get user settings: ${error.message}`);
    }

    if (!data || !data.settings) {
      // Return default settings if none exist
      return {
        notifications: {
          enabled: false,
          documentExpiryDays: 30,
          cardExpiryDays: 90,
          subscriptionRenewalDays: 7,
          notificationTimes: ["09:00"],
          frequency: 'daily',
          urgentOnly: false
        },
        expiryThresholds: {
          documents: { expiringSoonDays: 30, urgentDays: 7 },
          cards: { expiringSoonDays: 90, urgentDays: 30 },
          subscriptions: { expiringSoonDays: 7, urgentDays: 3 }
        },
        country: 'IN',
        theme: 'system'
      };
    }

    return EncryptionService.decrypt(data.settings, userId);
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    // Return default settings on error
    return {
      notifications: {
        enabled: false,
        documentExpiryDays: 30,
        cardExpiryDays: 90,
        subscriptionRenewalDays: 7,
        notificationTimes: ["09:00"],
        frequency: 'daily',
        urgentOnly: false
      },
      expiryThresholds: {
        documents: { expiringSoonDays: 30, urgentDays: 7 },
        cards: { expiringSoonDays: 90, urgentDays: 30 },
        subscriptions: { expiringSoonDays: 7, urgentDays: 3 }
      },
      country: 'IN',
      theme: 'system'
    };
  }
}

export async function saveUserSettings(settings: any): Promise<void> {
  try {
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
      console.error('Error saving user settings:', error);
      throw new Error(`Failed to save user settings: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in saveUserSettings:', error);
    throw error;
  }
}
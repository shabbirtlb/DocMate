import { getSetting, saveSetting } from './localdb';

export interface NotificationSettings {
  enabled: boolean;
  documentExpiryDays: number;
  cardExpiryDays: number;
  subscriptionRenewalDays: number;
  notificationTimes: string[]; // Array of times like ["09:00", "18:00"]
  frequency: 'daily' | 'weekly' | 'monthly';
  urgentOnly: boolean; // Only notify for items expiring within 7 days
}

export interface ExpiryThresholds {
  documents: {
    expiringSoonDays: number;
    urgentDays: number;
  };
  cards: {
    expiringSoonDays: number;
    urgentDays: number;
  };
  subscriptions: {
    expiringSoonDays: number;
    urgentDays: number;
  };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  documentExpiryDays: 30,
  cardExpiryDays: 90,
  subscriptionRenewalDays: 7,
  notificationTimes: ["09:00"],
  frequency: 'daily',
  urgentOnly: false
};

export const DEFAULT_EXPIRY_THRESHOLDS: ExpiryThresholds = {
  documents: {
    expiringSoonDays: 30,
    urgentDays: 7
  },
  cards: {
    expiringSoonDays: 90,
    urgentDays: 30
  },
  subscriptions: {
    expiringSoonDays: 7,
    urgentDays: 3
  }
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const settings = await getSetting('notificationSettings', DEFAULT_NOTIFICATION_SETTINGS);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function saveNotificationSettings(notificationSettings: NotificationSettings): Promise<void> {
  try {
    await saveSetting('notificationSettings', notificationSettings);
  } catch (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }
}

export async function getExpiryThresholds(): Promise<ExpiryThresholds> {
  try {
    const thresholds = await getSetting('expiryThresholds', DEFAULT_EXPIRY_THRESHOLDS);
    return { ...DEFAULT_EXPIRY_THRESHOLDS, ...thresholds };
  } catch (error) {
    console.error('Error loading expiry thresholds:', error);
    return DEFAULT_EXPIRY_THRESHOLDS;
  }
}

export async function saveExpiryThresholds(expiryThresholds: ExpiryThresholds): Promise<void> {
  try {
    await saveSetting('expiryThresholds', expiryThresholds);
  } catch (error) {
    console.error('Error saving expiry thresholds:', error);
    throw error;
  }
}

export async function getSelectedCountry(): Promise<string> {
  try {
    return await getSetting('selectedCountry', 'IN');
  } catch (error) {
    console.error('Error loading selected country:', error);
    return 'IN';
  }
}

export async function setSelectedCountry(countryCode: string): Promise<void> {
  try {
    await saveSetting('selectedCountry', countryCode);
  } catch (error) {
    console.error('Error saving selected country:', error);
    throw error;
  }
}

export async function getTheme(): Promise<string> {
  try {
    return await getSetting('theme', 'system');
  } catch (error) {
    console.error('Error loading theme:', error);
    return 'system';
  }
}

export async function setTheme(theme: string): Promise<void> {
  try {
    await saveSetting('theme', theme);
  } catch (error) {
    console.error('Error saving theme:', error);
    throw error;
  }
}

export async function resetToDefaults(): Promise<void> {
  try {
    await Promise.all([
      saveSetting('notificationSettings', DEFAULT_NOTIFICATION_SETTINGS),
      saveSetting('expiryThresholds', DEFAULT_EXPIRY_THRESHOLDS),
      saveSetting('selectedCountry', 'IN'),
      saveSetting('theme', 'system')
    ]);
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}
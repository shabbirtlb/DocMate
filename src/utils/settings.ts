import { getUserSettings, saveUserSettings } from './database';

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

let cachedSettings: any = null;

async function getSettings(): Promise<any> {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    cachedSettings = await getUserSettings();
    return cachedSettings;
  } catch (error) {
    console.error('Error loading settings from database:', error);
    // Return defaults if database fails
    return {
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      expiryThresholds: DEFAULT_EXPIRY_THRESHOLDS,
      country: 'IN',
      theme: 'system'
    };
  }
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const settings = await getSettings();
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings.notifications };
}

export async function saveNotificationSettings(notificationSettings: NotificationSettings): Promise<void> {
  try {
    const settings = await getSettings();
    settings.notifications = notificationSettings;
    await saveUserSettings(settings);
    cachedSettings = settings;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }
}

export async function getExpiryThresholds(): Promise<ExpiryThresholds> {
  const settings = await getSettings();
  return { ...DEFAULT_EXPIRY_THRESHOLDS, ...settings.expiryThresholds };
}

export async function saveExpiryThresholds(expiryThresholds: ExpiryThresholds): Promise<void> {
  try {
    const settings = await getSettings();
    settings.expiryThresholds = expiryThresholds;
    await saveUserSettings(settings);
    cachedSettings = settings;
  } catch (error) {
    console.error('Error saving expiry thresholds:', error);
    throw error;
  }
}

export async function getSelectedCountry(): Promise<string> {
  const settings = await getSettings();
  return settings.country || 'IN';
}

export async function setSelectedCountry(countryCode: string): Promise<void> {
  try {
    const settings = await getSettings();
    settings.country = countryCode;
    await saveUserSettings(settings);
    cachedSettings = settings;
  } catch (error) {
    console.error('Error saving country setting:', error);
    throw error;
  }
}

export async function getTheme(): Promise<string> {
  const settings = await getSettings();
  return settings.theme || 'system';
}

export async function setTheme(theme: string): Promise<void> {
  try {
    const settings = await getSettings();
    settings.theme = theme;
    await saveUserSettings(settings);
    cachedSettings = settings;
  } catch (error) {
    console.error('Error saving theme setting:', error);
    throw error;
  }
}

export async function resetToDefaults(): Promise<void> {
  try {
    const defaultSettings = {
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      expiryThresholds: DEFAULT_EXPIRY_THRESHOLDS,
      country: 'IN',
      theme: 'system'
    };
    await saveUserSettings(defaultSettings);
    cachedSettings = defaultSettings;
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

// Clear cache when needed
export function clearSettingsCache(): void {
  cachedSettings = null;
}
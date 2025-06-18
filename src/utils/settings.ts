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

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  documentExpiryDays: 30,
  cardExpiryDays: 90,
  subscriptionRenewalDays: 7,
  notificationTimes: ["09:00"],
  frequency: 'daily',
  urgentOnly: false
};

const DEFAULT_EXPIRY_THRESHOLDS: ExpiryThresholds = {
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

const NOTIFICATION_SETTINGS_KEY = 'documate-notification-settings';
const EXPIRY_THRESHOLDS_KEY = 'documate-expiry-thresholds';

export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading notification settings:', error);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
}

export function getExpiryThresholds(): ExpiryThresholds {
  try {
    const saved = localStorage.getItem(EXPIRY_THRESHOLDS_KEY);
    if (saved) {
      return { ...DEFAULT_EXPIRY_THRESHOLDS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading expiry thresholds:', error);
  }
  return DEFAULT_EXPIRY_THRESHOLDS;
}

export function saveExpiryThresholds(thresholds: ExpiryThresholds): void {
  try {
    localStorage.setItem(EXPIRY_THRESHOLDS_KEY, JSON.stringify(thresholds));
  } catch (error) {
    console.error('Error saving expiry thresholds:', error);
  }
}

export function resetToDefaults(): void {
  localStorage.removeItem(NOTIFICATION_SETTINGS_KEY);
  localStorage.removeItem(EXPIRY_THRESHOLDS_KEY);
}
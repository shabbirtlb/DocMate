import { getNotificationSettings } from './settings';
import { getCurrentUser } from './auth';

// Store timeout IDs for cleanup
let scheduledTimeouts: NodeJS.Timeout[] = [];

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
}

export async function checkUpcomingExpirations(
  items: Array<{ 
    id: string; 
    name: string; 
    type: 'document' | 'card' | 'subscription';
    expiryDate?: string; 
    renewalDate?: string 
  }>
): Promise<void> {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return; // Don't check notifications if user is not authenticated
    }

    const settings = await getNotificationSettings();
    
    if (!settings.enabled) {
      return;
    }

    const now = new Date();

    items.forEach(item => {
      const expiryDate = item.expiryDate || item.renewalDate;
      if (!expiryDate) return;

      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Only show notifications for items that haven't expired yet
      if (daysUntilExpiry > 0) {
        let shouldNotify = false;
        let notificationThreshold = 0;

        // Determine notification threshold based on item type and settings
        switch (item.type) {
          case 'document':
            notificationThreshold = settings.documentExpiryDays;
            break;
          case 'card':
            notificationThreshold = settings.cardExpiryDays;
            break;
          case 'subscription':
            notificationThreshold = settings.subscriptionRenewalDays;
            break;
        }

        // Check if we should notify based on threshold
        if (daysUntilExpiry <= notificationThreshold) {
          shouldNotify = true;
        }

        // If urgent only mode is enabled, only notify for very urgent items
        if (settings.urgentOnly && daysUntilExpiry > 7) {
          shouldNotify = false;
        }

        if (shouldNotify) {
          const isUrgent = daysUntilExpiry <= 7;
          const itemTypeText = item.type === 'subscription' ? 'renews' : 'expires';
          
          showNotification(
            `${item.name} ${itemTypeText} in ${daysUntilExpiry} day(s)`,
            {
              body: isUrgent 
                ? `⚠️ Urgent: Don't forget to renew your ${item.name}`
                : `📅 Reminder: Your ${item.name} ${itemTypeText} soon`,
              tag: `expiry-${item.id}`,
              requireInteraction: isUrgent,
            }
          );
        }
      }
    });
  } catch (error) {
    console.error('Error checking upcoming expirations:', error);
  }
}

export async function scheduleNotifications(): Promise<void> {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return; // Don't schedule notifications if user is not authenticated
    }

    const settings = await getNotificationSettings();
    
    if (!settings.enabled) {
      return;
    }

    // Clear existing scheduled notifications
    clearScheduledNotifications();

    // Schedule notifications based on user's preferred times
    settings.notificationTimes.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const timeUntilNotification = scheduledTime.getTime() - now.getTime();

      const timeoutId = setTimeout(() => {
        // This would trigger the notification check
        console.log('Scheduled notification check triggered');
      }, timeUntilNotification);

      scheduledTimeouts.push(timeoutId);
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

export function clearScheduledNotifications(): void {
  // Clear all existing timeouts
  scheduledTimeouts.forEach(timeoutId => {
    clearTimeout(timeoutId);
  });
  scheduledTimeouts = [];
}
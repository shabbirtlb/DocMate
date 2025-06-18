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

export function checkUpcomingExpirations(
  items: Array<{ id: string; name: string; expiryDate?: string; renewalDate?: string }>
): void {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  items.forEach(item => {
    const expiryDate = item.expiryDate || item.renewalDate;
    if (!expiryDate) return;

    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Only show notifications for items that haven't expired yet
    if (daysUntilExpiry > 0) {
      if (daysUntilExpiry <= 7) {
        showNotification(`${item.name} expires in ${daysUntilExpiry} day(s)`, {
          body: `Don't forget to renew your ${item.name}`,
          tag: `expiry-${item.id}`,
        });
      } else if (daysUntilExpiry <= 30) {
        // Show less urgent notification for items expiring within a month
        if (Math.random() < 0.1) { // Show only 10% of the time to avoid spam
          showNotification(`${item.name} expires in ${daysUntilExpiry} days`, {
            body: `Consider renewing your ${item.name} soon`,
            tag: `expiry-${item.id}`,
          });
        }
      }
    }
  });
}
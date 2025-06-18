import { useEffect } from 'react';
import { getDocuments, getCards, getSubscriptions } from '@/utils/localdb';
import { checkUpcomingExpirations, scheduleNotifications, clearScheduledNotifications } from '@/utils/notifications';

export function NotificationManager() {
  useEffect(() => {
    const checkExpirations = async () => {
      try {
        const [documents, cards, subscriptions] = await Promise.all([
          getDocuments(),
          getCards(),
          getSubscriptions()
        ]);

        const allItems = [
          ...documents.map(doc => ({ ...doc, renewalDate: doc.expiryDate })),
          ...cards.map(card => ({ ...card, renewalDate: card.expiryDate })),
          ...subscriptions
        ];

        checkUpcomingExpirations(allItems);
      } catch (error) {
        console.error('Error checking expirations:', error);
      }
    };

    // Check on mount
    checkExpirations();

    // Schedule notifications after authentication
    scheduleNotifications();

    // Set up interval to check daily
    const interval = setInterval(checkExpirations, 24 * 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearScheduledNotifications();
    };
  }, []);

  return null;
}
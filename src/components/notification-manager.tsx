import { useEffect } from 'react';
import { getDocuments, getCards, getSubscriptions } from '@/utils/localdb';
import { checkUpcomingExpirations, scheduleNotifications, clearScheduledNotifications, initializeNotifications } from '@/utils/notifications';
import { useAuth } from '@/components/auth/auth-provider';

export function NotificationManager() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      clearScheduledNotifications();
      return;
    }

    const checkExpirations = async () => {
      try {
        const [documents, cards, subscriptions] = await Promise.all([
          getDocuments(),
          getCards(),
          getSubscriptions()
        ]);

        const allItems = [
          ...documents.map(doc => ({ ...doc, type: 'document' as const })),
          ...cards.map(card => ({ ...card, type: 'card' as const })),
          ...subscriptions.map(sub => ({ ...sub, type: 'subscription' as const, expiryDate: sub.renewalDate }))
        ];

        await checkUpcomingExpirations(allItems);
      } catch (error) {
        console.error('Error checking expirations:', error);
      }
    };

    // Initialize notifications
    initializeNotifications();

    // Check on mount
    checkExpirations();

    // Set up interval to check daily
    const interval = setInterval(checkExpirations, 24 * 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearScheduledNotifications();
    };
  }, [isAuthenticated]);

  return null;
}
import { differenceInDays } from 'date-fns';
import { getExpiryThresholds } from './settings';

export type ItemStatus = 'active' | 'expiring' | 'expired' | 'urgent';

export function getDocumentStatus(expiryDate?: string): ItemStatus {
  if (!expiryDate) return 'active';
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, now);
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'urgent'; // Default urgent threshold
  if (daysUntilExpiry <= 30) return 'expiring'; // Default expiring threshold
  return 'active';
}

export function getCardStatus(expiryDate: string): ItemStatus {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, now);
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'urgent'; // Default urgent threshold for cards
  if (daysUntilExpiry <= 90) return 'expiring'; // Default expiring threshold for cards
  return 'active';
}

export function getSubscriptionStatus(renewalDate: string): ItemStatus {
  const now = new Date();
  const renewal = new Date(renewalDate);
  const daysUntilRenewal = differenceInDays(renewal, now);
  
  if (daysUntilRenewal < 0) return 'expired';
  if (daysUntilRenewal <= 3) return 'urgent'; // Default urgent threshold for subscriptions
  if (daysUntilRenewal <= 7) return 'expiring'; // Default expiring threshold for subscriptions
  return 'active';
}

export function getStatusBadgeVariant(status: ItemStatus) {
  switch (status) {
    case 'expired':
      return 'destructive';
    case 'urgent':
      return 'destructive';
    case 'expiring':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function getStatusColor(status: ItemStatus) {
  switch (status) {
    case 'expired':
      return 'text-red-600 dark:text-red-400';
    case 'urgent':
      return 'text-red-600 dark:text-red-400';
    case 'expiring':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-green-600 dark:text-green-400';
  }
}

export function getStatusText(status: ItemStatus) {
  switch (status) {
    case 'expired':
      return 'Expired';
    case 'urgent':
      return 'Urgent';
    case 'expiring':
      return 'Expiring';
    default:
      return 'Active';
  }
}
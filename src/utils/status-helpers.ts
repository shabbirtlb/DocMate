import { differenceInDays } from 'date-fns';
import { getExpiryThresholds } from './settings';

export type ItemStatus = 'active' | 'expiring' | 'expired' | 'urgent';

export function getDocumentStatus(expiryDate?: string): ItemStatus {
  if (!expiryDate) return 'active';
  
  const thresholds = getExpiryThresholds();
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, now);
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= thresholds.documents.urgentDays) return 'urgent';
  if (daysUntilExpiry <= thresholds.documents.expiringSoonDays) return 'expiring';
  return 'active';
}

export function getCardStatus(expiryDate: string): ItemStatus {
  const thresholds = getExpiryThresholds();
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, now);
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= thresholds.cards.urgentDays) return 'urgent';
  if (daysUntilExpiry <= thresholds.cards.expiringSoonDays) return 'expiring';
  return 'active';
}

export function getSubscriptionStatus(renewalDate: string): ItemStatus {
  const thresholds = getExpiryThresholds();
  const now = new Date();
  const renewal = new Date(renewalDate);
  const daysUntilRenewal = differenceInDays(renewal, now);
  
  if (daysUntilRenewal < 0) return 'expired';
  if (daysUntilRenewal <= thresholds.subscriptions.urgentDays) return 'urgent';
  if (daysUntilRenewal <= thresholds.subscriptions.expiringSoonDays) return 'expiring';
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
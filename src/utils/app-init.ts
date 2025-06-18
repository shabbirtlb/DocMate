import { generateUUID } from './uuid';
import { initDB } from './localdb';
import { requestNotificationPermission } from './notifications';

export async function initializeApp() {
  // Generate or retrieve user ID
  let userId = localStorage.getItem('documate-user-id');
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem('documate-user-id', userId);
  }

  // Initialize IndexedDB
  await initDB();

  // Request notification permission
  await requestNotificationPermission();

  // Set up periodic expiry checks
  setInterval(() => {
    checkExpiryAlerts();
  }, 24 * 60 * 60 * 1000); // Check daily

  // Check expiry alerts on app load
  checkExpiryAlerts();
}

async function checkExpiryAlerts() {
  // This will be implemented to check for upcoming expirations
  // and show notifications if permission is granted
}
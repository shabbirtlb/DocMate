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
}
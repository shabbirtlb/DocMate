import { generateUUID } from './uuid';
import { initDB } from './localdb';
import { initializeNotifications } from './notifications';

export async function initializeApp() {
  // Generate or retrieve user ID
  let userId = localStorage.getItem('documate-user-id');
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem('documate-user-id', userId);
  }

  // Initialize IndexedDB
  await initDB();

  // Register Service Worker for Push Notifications
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  } else {
    console.warn('⚠️ Service Worker not supported in this browser');
  }

  // Initialize your local notification scheduler
  await initializeNotifications();
}

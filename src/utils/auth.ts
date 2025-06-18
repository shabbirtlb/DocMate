export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = 'documate-auth';
const USERS_STORAGE_KEY = 'documate-users';

// Simulate password hashing (in production, use proper bcrypt)
function hashPassword(password: string): string {
  // Simple hash for demo - use proper bcrypt in production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function getCurrentUser(): User | null {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) return null;
    
    const { userId } = JSON.parse(authData);
    const users = getStoredUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
      // Update last login
      user.lastLoginAt = new Date().toISOString();
      saveUsers(users);
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

function getStoredUsers(): User[] {
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting stored users:', error);
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export async function signUp(email: string, password: string, name: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Validate input
    if (!email || !password || !name) {
      return { success: false, error: 'All fields are required' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    const users = getStoredUsers();
    
    // Check if user already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // Create new user
    const user: User = {
      id: generateUserId(),
      email: email.toLowerCase(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    // Store user with hashed password
    users.push(user);
    saveUsers(users);
    
    // Store password separately (in production, this would be properly secured)
    const passwords = JSON.parse(localStorage.getItem('documate-passwords') || '{}');
    passwords[user.id] = hashPassword(password);
    localStorage.setItem('documate-passwords', JSON.stringify(passwords));

    // Set current user
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: user.id }));

    return { success: true, user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: 'Failed to create account. Please try again.' };
  }
}

export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Check password
    const passwords = JSON.parse(localStorage.getItem('documate-passwords') || '{}');
    const storedPasswordHash = passwords[user.id];
    const inputPasswordHash = hashPassword(password);

    if (storedPasswordHash !== inputPasswordHash) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    saveUsers(users);

    // Set current user
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: user.id }));

    return { success: true, user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Failed to sign in. Please try again.' };
  }
}

export function signOut(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  // Clear any cached data
  window.location.reload();
}

export function deleteAccount(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        resolve(false);
        return;
      }

      // Remove user from users list
      const users = getStoredUsers();
      const updatedUsers = users.filter(u => u.id !== currentUser.id);
      saveUsers(updatedUsers);

      // Remove password
      const passwords = JSON.parse(localStorage.getItem('documate-passwords') || '{}');
      delete passwords[currentUser.id];
      localStorage.setItem('documate-passwords', JSON.stringify(passwords));

      // Clear auth
      localStorage.removeItem(AUTH_STORAGE_KEY);

      // Clear user-specific data from IndexedDB
      const dbName = `DocumenteDB_${currentUser.id}`;
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => resolve(true); // Still consider success even if DB deletion fails
    } catch (error) {
      console.error('Error deleting account:', error);
      resolve(false);
    }
  });
}
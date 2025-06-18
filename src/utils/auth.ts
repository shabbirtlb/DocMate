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

const AUTH_STORAGE_KEY = 'documate-auth-user';

export function getCurrentUser(): User | null {
  try {
    const userData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  return null;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function hashPassword(password: string): string {
  // Simple hash for demo purposes - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
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

    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('documate-users') || '[]');
    const existingUser = existingUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
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

    // Store user credentials (hashed password)
    const userCredentials = {
      ...user,
      passwordHash: hashPassword(password)
    };

    existingUsers.push(userCredentials);
    localStorage.setItem('documate-users', JSON.stringify(existingUsers));

    // Set current user
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

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

    // Get stored users
    const existingUsers = JSON.parse(localStorage.getItem('documate-users') || '[]');
    const userCredentials = existingUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!userCredentials) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (userCredentials.passwordHash !== passwordHash) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Create user object (without password hash)
    const user: User = {
      id: userCredentials.id,
      email: userCredentials.email,
      name: userCredentials.name,
      createdAt: userCredentials.createdAt,
      lastLoginAt: new Date().toISOString()
    };

    // Update last login time
    userCredentials.lastLoginAt = user.lastLoginAt;
    localStorage.setItem('documate-users', JSON.stringify(existingUsers));

    // Set current user
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

    return { success: true, user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Failed to sign in. Please try again.' };
  }
}

export async function signOut(): Promise<void> {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.reload();
  } catch (error) {
    console.error('Sign out error:', error);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.reload();
  }
}

export async function deleteAccount(): Promise<boolean> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Remove user from stored users
    const existingUsers = JSON.parse(localStorage.getItem('documate-users') || '[]');
    const updatedUsers = existingUsers.filter((u: any) => u.id !== currentUser.id);
    localStorage.setItem('documate-users', JSON.stringify(updatedUsers));

    // Clear current user
    localStorage.removeItem(AUTH_STORAGE_KEY);

    // Clear all user data from IndexedDB
    const { clearAllData } = await import('./localdb');
    await clearAllData();

    window.location.reload();
    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.reload();
    return false;
  }
}

// Initialize auth state listener (for compatibility)
export function initAuthListener(callback: (user: User | null) => void) {
  // For local storage, we'll just call the callback with current user
  const user = getCurrentUser();
  callback(user);
  
  // Listen for storage changes (for multi-tab support)
  window.addEventListener('storage', (e) => {
    if (e.key === AUTH_STORAGE_KEY) {
      const user = getCurrentUser();
      callback(user);
    }
  });
}
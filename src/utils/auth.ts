import { supabase, EncryptionService } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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

export function getCurrentUser(): User | null {
  try {
    const cachedUser = localStorage.getItem('documate-current-user');
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
  } catch (error) {
    console.error('Error getting cached user:', error);
  }
  
  return null;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

async function createUserProfile(supabaseUser: SupabaseUser, name: string): Promise<User> {
  const user: User = {
    id: supabaseUser.id,
    email: supabaseUser.email!,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  try {
    // Encrypt user settings
    const defaultSettings = {
      country: 'IN',
      theme: 'system',
      notifications: {
        enabled: false,
        documentExpiryDays: 30,
        cardExpiryDays: 90,
        subscriptionRenewalDays: 7,
        notificationTimes: ["09:00"],
        frequency: 'daily',
        urgentOnly: false
      },
      expiryThresholds: {
        documents: { expiringSoonDays: 30, urgentDays: 7 },
        cards: { expiringSoonDays: 90, urgentDays: 30 },
        subscriptions: { expiringSoonDays: 7, urgentDays: 3 }
      }
    };

    const encryptedSettings = EncryptionService.encrypt(defaultSettings, user.id);

    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email,
        name: user.name,
        settings: encryptedSettings
      });

    if (error) {
      console.error('Error creating user profile:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return user;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
}

async function getUserProfile(supabaseUser: SupabaseUser): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      createdAt: data.created_at,
      lastLoginAt: new Date().toISOString()
    };

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return user;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
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

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          name: name.trim()
        }
      }
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account' };
    }

    // Create user profile
    const user = await createUserProfile(data.user, name);
    
    // Cache user locally
    localStorage.setItem('documate-current-user', JSON.stringify(user));

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

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (error) {
      console.error('Supabase auth error:', error);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to sign in' };
    }

    // Get or create user profile
    let user: User;
    try {
      user = await getUserProfile(data.user);
    } catch (profileError) {
      console.log('Profile not found, creating new one...');
      // If profile doesn't exist, create it (for existing auth users)
      user = await createUserProfile(data.user, data.user.user_metadata?.name || 'User');
    }

    // Cache user locally
    localStorage.setItem('documate-current-user', JSON.stringify(user));

    return { success: true, user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Failed to sign in. Please try again.' };
  }
}

export async function signOut(): Promise<void> {
  try {
    // Clear local storage first
    localStorage.removeItem('documate-current-user');
    
    // Then sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase sign out error:', error);
    }
    
    // Force page reload to clear all state
    window.location.reload();
  } catch (error) {
    console.error('Sign out error:', error);
    // Still clear local storage and reload even if Supabase call fails
    localStorage.removeItem('documate-current-user');
    window.location.reload();
  }
}

export async function deleteAccount(): Promise<boolean> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Delete user data from all tables
    const deletePromises = [
      supabase.from('documents').delete().eq('user_id', currentUser.id),
      supabase.from('cards').delete().eq('user_id', currentUser.id),
      supabase.from('subscriptions').delete().eq('user_id', currentUser.id),
      supabase.from('user_profiles').delete().eq('id', currentUser.id)
    ];

    await Promise.all(deletePromises);

    // Clear local storage
    localStorage.removeItem('documate-current-user');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Force page reload to clear all state
    window.location.reload();

    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    // Still try to clear local state
    localStorage.removeItem('documate-current-user');
    window.location.reload();
    return false;
  }
}

// Initialize auth state listener
export function initAuthListener(callback: (user: User | null) => void) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (event === 'SIGNED_IN' && session?.user) {
        let user: User;
        try {
          user = await getUserProfile(session.user);
        } catch (profileError) {
          console.log('Profile not found during auth state change, creating new one...');
          // If profile doesn't exist, create it (for existing auth users)
          user = await createUserProfile(session.user, session.user.user_metadata?.name || 'User');
        }
        localStorage.setItem('documate-current-user', JSON.stringify(user));
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('documate-current-user');
        callback(null);
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      callback(null);
    }
  });
}
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback configuration for development
const defaultUrl = 'https://aoozvekvlmbrfrdoqwnu.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb3p2ZWt2bG1icmZyZG9xd251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NzE2NzQsImV4cCI6MjA2NjA0NzY3NH0.VJxuJOQOGOhWJOQOGOhWJOQOGOhWJOQOGOhWJOQOGOhW';

const finalUrl = supabaseUrl || defaultUrl;
const finalKey = supabaseAnonKey || defaultKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Using fallback values.');
}

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Encryption utilities
export class EncryptionService {
  private static getEncryptionKey(userId: string): string {
    // In production, this should be derived from user's password or a secure key derivation function
    return CryptoJS.SHA256(userId + 'documate-encryption-salt-2024').toString();
  }

  static encrypt(data: any, userId: string): string {
    try {
      const key = this.getEncryptionKey(userId);
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(encryptedData: string, userId: string): any {
    try {
      const key = this.getEncryptionKey(userId);
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption resulted in empty string');
      }
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
          settings: string; // encrypted JSON
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          settings?: string;
        };
        Update: {
          email?: string;
          name?: string;
          settings?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          encrypted_data: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          encrypted_data: string;
        };
        Update: {
          encrypted_data?: string;
          updated_at?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          encrypted_data: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          encrypted_data: string;
        };
        Update: {
          encrypted_data?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          encrypted_data: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          encrypted_data: string;
        };
        Update: {
          encrypted_data?: string;
          updated_at?: string;
        };
      };
    };
  };
}
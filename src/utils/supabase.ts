import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Encryption utilities
export class EncryptionService {
  private static getEncryptionKey(userId: string): string {
    // In production, this should be derived from user's password or a secure key derivation function
    return CryptoJS.SHA256(userId + 'documate-encryption-salt').toString();
  }

  static encrypt(data: any, userId: string): string {
    const key = this.getEncryptionKey(userId);
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
    return encrypted;
  }

  static decrypt(encryptedData: string, userId: string): any {
    try {
      const key = this.getEncryptionKey(userId);
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
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
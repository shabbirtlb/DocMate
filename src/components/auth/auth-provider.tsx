import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, signIn, signUp, signOut, deleteAccount } from '@/utils/auth';
import type { User, AuthState } from '@/utils/auth';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check for existing authentication on mount
    const user = getCurrentUser();
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false
    });
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.success && result.user) {
      setAuthState({
        user: result.user,
        isAuthenticated: true,
        isLoading: false
      });
    }
    return result;
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    const result = await signUp(email, password, name);
    if (result.success && result.user) {
      setAuthState({
        user: result.user,
        isAuthenticated: true,
        isLoading: false
      });
    }
    return result;
  };

  const handleSignOut = () => {
    signOut();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
    return success;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        deleteAccount: handleDeleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
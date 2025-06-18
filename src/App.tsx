import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from '@/components/auth/auth-provider';
import { AuthForm } from '@/components/auth/auth-form';
import { Toaster } from '@/components/ui/sonner';
import { initDB } from '@/utils/localdb';
import { Sidebar } from '@/components/sidebar';
import { Dashboard } from '@/pages/dashboard';
import { Documents } from '@/pages/documents';
import { Cards } from '@/pages/cards';
import { Subscriptions } from '@/pages/subscriptions';
import { Settings } from '@/pages/settings';
import { NotificationManager } from '@/components/notification-manager';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const initializeDB = async () => {
      if (isAuthenticated) {
        try {
          await initDB();
          setDbInitialized(true);
        } catch (error) {
          console.error('Failed to initialize database:', error);
        }
      }
    };

    initializeDB();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing your secure storage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NotificationManager />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-18">
          <div className="container mx-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/cards" element={<Cards />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="documate-theme">
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
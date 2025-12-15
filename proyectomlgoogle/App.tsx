
import React, { useState, useCallback, useEffect } from 'react';
import LoginPage from './features/auth/LoginPage';
import MainLayout from './components/layout/MainLayout';
import MetricsView from './features/metrics/MetricsView';
import SalesView from './features/sales/SalesView';
import PaymentsView from './features/payments/PaymentsView';
import CogsView from './features/cogs/CogsView';
import SuppliesView from './features/supplies/SuppliesView';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Page } from './types';
import { supabase } from './lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('metrics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);
  
  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const renderContent = () => {
    switch (currentPage) {
      case 'metrics':
        return <MetricsView />;
      case 'sales':
        return <SalesView />;
      case 'payments':
        return <PaymentsView />;
      case 'cogs':
        return <CogsView />;
      case 'supplies':
        return <SuppliesView />;
      default:
        return <MetricsView />;
    }
  };
  
  if (isLoading) {
      return <div className="h-screen w-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900"><p className="text-white">Loading...</p></div>;
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
     <AuthProvider value={{ user: session.user, logout: handleLogout }}>
        <NotificationProvider>
            <MainLayout currentPage={currentPage} navigate={navigate}>
                {renderContent()}
            </MainLayout>
        </NotificationProvider>
     </AuthProvider>
  );
};

export default App;

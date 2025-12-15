
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Page } from '../../types';

interface MainLayoutProps {
  children: ReactNode;
  currentPage: Page;
  navigate: (page: Page) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPage, navigate }) => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar currentPage={currentPage} navigate={navigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;


import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Page } from '../../types';
import { LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
    currentPage: Page;
}

const pageTitles: Record<Page, string> = {
    metrics: 'Dashboard de Métricas',
    sales: 'Ventas',
    payments: 'Cobros',
    cogs: 'Costos (COGS)',
    supplies: 'Insumos',
};

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{pageTitles[currentPage]}</h1>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <UserIcon className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 p-1" />
          <span>{user?.email}</span>
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20">
            <button
              onClick={() => {
                logout();
                setDropdownOpen(false);
              }}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

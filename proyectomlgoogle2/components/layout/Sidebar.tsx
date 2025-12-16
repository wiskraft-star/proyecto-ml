
import React from 'react';
import { BarChart2, ShoppingCart, DollarSign, Archive, Package, Aperture } from 'lucide-react';
import { Page } from '../../types';

interface SidebarProps {
  currentPage: Page;
  navigate: (page: Page) => void;
}

const navItems = [
  { id: 'metrics', label: 'Métricas', icon: BarChart2 },
  { id: 'sales', label: 'Ventas', icon: ShoppingCart },
  { id: 'payments', label: 'Cobros', icon: DollarSign },
  { id: 'cogs', label: 'COGS', icon: Archive },
  { id: 'supplies', label: 'Insumos', icon: Package },
];

const NavLink: React.FC<{
  id: Page;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ id, label, icon: Icon, isActive, onClick }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, navigate }) => {
  return (
    <aside className="w-64 bg-gray-800 dark:bg-gray-900 text-white flex flex-col">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <Aperture className="w-8 h-8 text-blue-400" />
        <span className="ml-2 text-xl font-bold">ML Margin</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            id={item.id as Page}
            label={item.label}
            icon={item.icon}
            isActive={currentPage === item.id}
            onClick={() => navigate(item.id as Page)}
          />
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 text-center text-xs text-gray-400">
        <p>&copy; 2024 ML Margin App</p>
        <p>Frontend Prototype</p>
      </div>
    </aside>
  );
};

export default Sidebar;

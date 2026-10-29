import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuthStore from '../store/authStore';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  useEffect(() => {
    refreshUser();

    const handleFocus = () => {
      refreshUser();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshUser]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transition duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
        <Header>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-400 dark:text-slate-400 lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </Header>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4 transition-colors duration-200">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-3 px-4 transition-colors duration-200">
          <div className="container mx-auto text-center text-xs text-gray-600 dark:text-slate-400">
            Powered by{' '}
            <a 
              href="https://www.botivate.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium"
            >
              Botivate
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
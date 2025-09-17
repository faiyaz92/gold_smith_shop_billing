'use client';

import { useState } from 'react';
import AdminHeader from './Componenets/AdminHeader';
import AdminSidebar from './Componenets/AdminSidebar/AdminSidebar';
import Footer from '@/app/Componenets/Footer';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Sidebar with smooth transition */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-y-0 left-0 z-30 w-56"
          >
            <AdminSidebar toggleSidebar={toggleSidebar} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Overlay when sidebar is open */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-20"
            onClick={toggleSidebar}
          ></motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 flex flex-col">
        <AdminHeader toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <Footer className="w-full bg-blue-50 border-t border-blue-200 py-4 text-center text-gray-600" />
      </div>
    </div>
  );
}

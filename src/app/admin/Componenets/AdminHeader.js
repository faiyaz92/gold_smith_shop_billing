'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Menu, X, Home, Package, ShoppingBag, Users, MessageSquare, CreditCard } from 'lucide-react';
import { useAdminLanguage } from "@/app/context/AdminLanguageContext"; // Use admin context
import { useAdminTranslation } from '@/app/utils/useAdminTranslation'; // Use admin translation

const NAV_ITEMS = [
  { id: 'dashboard', label: 'dashboard', icon: <Home className="w-4 h-4" />, href: '/admin/dashboard' },
  { id: 'products', label: 'products', icon: <Package className="w-4 h-4" />, href: '/admin/products' },
  { id: 'orders', label: 'orders', icon: <ShoppingBag className="w-4 h-4" />, href: '/admin/orders' },
  { id: 'inquiries', label: 'inquiries', icon: <MessageSquare className="w-4 h-4" />, href: '/admin/inquiries' },
  { id: 'users', label: 'users', icon: <Users className="w-4 h-4" />, href: '/admin/users' },
  { id: 'billing', label: 'billing', icon: <CreditCard className="w-4 h-4" />, href: '/admin/billing' },
];

export default function AdminHeader({ toggleSidebar, isSidebarOpen }) {
  const router = useRouter();
  const { language, changeLanguage } = useAdminLanguage(); // Use admin language context
  const { t } = useAdminTranslation(); // Use admin translation

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/admin/login');
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6 bg-white backdrop-blur-md border-b border-blue-500/30 shadow-sm"
    >
      <div className="flex items-center space-x-4">
        {/* Hamburger Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-blue-600"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent"
        >
          EASY2 Admin
        </motion.div>
      </div>

      {/* Desktop & Mobile Navigation */}
      <div className="flex items-center space-x-2 lg:space-x-6 text-sm">
        <div className="hidden lg:flex items-center space-x-6">
          {NAV_ITEMS.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1 rounded-md transition-colors hover:text-blue-600"
              onClick={() => handleNavigation(item.href)}
            >
              {item.icon}
              {t(item.label)}
            </motion.button>
          ))}
        </div>
        {/* Language Switcher - visible on all screens */}
        <button
          onClick={() => changeLanguage(language === "ar" ? "en" : "ar")}
          className="px-2 py-1 rounded bg-blue-100 text-blue-700 ml-2"
          aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
        >
          {language === "ar" ? "EN" : "ع"}
        </button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center space-x-1 px-3 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 ml-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm lg:text-base">{t('logout')}</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}
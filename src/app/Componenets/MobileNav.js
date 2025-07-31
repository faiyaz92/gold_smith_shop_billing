'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileNav({ cart, openCart }) {
  const [activeTab, setActiveTab] = useState('home');
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') setActiveTab('home');
    else if (pathname === '/cart') setActiveTab('cart');
    else if (pathname === '/account') setActiveTab('account');
  }, [pathname]);

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { id: 'cart', icon: ShoppingCart, label: 'Cart', action: openCart },
    { id: 'account', icon: User, label: 'Account', action: () => {} },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white rounded-full shadow-2xl border border-gray-200/60 px-6 py-3 flex items-center justify-between w-[90vw] max-w-md relative">
        {/* Active background highlight */}
        <AnimatePresence>
          {activeTab && (
            <motion.div
              className="absolute top-0 bottom-0 rounded-full bg-blue-50 z-0"
              initial={false}
              animate={{
                left: `${tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length)}%`,
                width: `${100 / tabs.length}%`,
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            />
          )}
        </AnimatePresence>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCart = tab.id === 'cart';

          return (
            <motion.button
              key={tab.id}
              className="relative z-10 flex flex-col items-center justify-center w-[64px] h-[56px]"
              onClick={() => {
                tab.action();
                setActiveTab(tab.id);
              }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{ y: isActive ? -4 : 0, scale: isActive ? 1.15 : 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 300 }}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-blue-600 stroke-[2.5]' : 'text-gray-600 stroke-[1.5]'
                  } transition-all`}
                />
              </motion.div>

              {/* Cart badge */}
              {isCart && cart.length > 0 && (
                <motion.span
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                >
                  {cart.length}
                </motion.span>
              )}

              {/* Active label */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    className="text-xs mt-1 text-blue-600 font-medium"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

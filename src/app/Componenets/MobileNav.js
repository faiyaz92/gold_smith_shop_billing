'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ShoppingCart, User, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';

export default function MobileNav({ cart = [], openCart, onSearch }) { // Add onSearch prop
  const [activeTab, setActiveTab] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false); // State for search input
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    if (pathname === '/') setActiveTab('home');
    else if (pathname === '/cart') setActiveTab('cart');
    else if (pathname === '/User/Account') setActiveTab('account');
  }, [pathname]);

  // Memoize search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  }, [onSearch]);

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { id: 'cart', icon: ShoppingCart, label: 'Cart', action: openCart },
    { id: 'search', icon: Search, label: 'Search', action: () => setIsSearchOpen(!isSearchOpen) }, // Add search tab
    { id: 'account', icon: User, label: 'Account', action: () => router.push('../User/Account') },
  ];

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-4 px-4 safe-pb">
      <div className="bg-white rounded-full shadow-2xl border border-gray-200/60 px-6 py-3 flex items-center justify-between w-full max-w-md mx-auto relative">
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

              {isCart && Array.isArray(cart) && cart.length > 0 && (
                <motion.span
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 300 }}
                >
                  {cart.length}
                </motion.span>
              )}

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

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className="bg-white rounded-t-lg shadow-2xl border border-gray-200/60 px-4 py-3 mt-2 w-full max-w-md mx-auto"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search clothes, services..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-full border border-gray-300 bg-gray-100 py-2 px-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

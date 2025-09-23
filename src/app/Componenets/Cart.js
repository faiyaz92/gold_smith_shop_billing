'use client';
import { ShoppingCart, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useTranslation } from '@/app/utils/useTranslation'; // Add this import

function groupItemsByCategory(items) {
  const groups = {};
  items.forEach(item => {
    const catName = item.categoryName || 'Other';
    if (!groups[catName]) groups[catName] = [];
    groups[catName].push(item);
  });
  return groups;
}

export default function Cart({ cart, isMobile, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { t } = useTranslation(); // Add this line

  // Check authentication
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsAuthenticated(!!currentUser);
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Animation for mount/unmount
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  // Navigate to checkout - now allows both authenticated and non-authenticated users
  const handleCheckout = () => {
    // Save cart to localStorage
    localStorage.setItem('checkoutCart', JSON.stringify(cart));
    
    // Save user authentication status for checkout page
    localStorage.setItem('isAuthenticatedUser', isAuthenticated.toString());
    
    if (user) {
      // Save user info if authenticated
      localStorage.setItem('checkoutUserInfo', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || ''
      }));
    }
    
    // Navigate to checkout page regardless of authentication status
    router.push('/User/CheckoutPage?method=cod');
  };

  // Animation variants
  const mobileVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { y: "100%", opacity: 0, transition: { duration: 0.3 } }
  };

  const desktopVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { x: 50, opacity: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
    exit: { opacity: 0, x: -20 }
  };

  if (isMobile) {
    return (
      <AnimatePresence>
        {isVisible && (
          <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm">
            <motion.div 
              className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-6 max-h-[85vh] flex flex-col shadow-xl"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileVariants}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{t('yourCart')}</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
                    <ShoppingCart className="w-8 h-8 stroke-[1.5] text-gray-300 mb-2" />
                    <p className="text-gray-500">{t('emptyCart')}</p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {Object.entries(groupItemsByCategory(cart)).map(([catName, items]) => (
                      <div key={catName} className="mb-4">
                        <div className="px-4 py-2 font-semibold text-blue-700 border-b border-blue-200 bg-blue-50 rounded-t-lg">
                          {catName}
                        </div>
                        <div>
                          {items.map((item, idx) => (
                            <motion.li 
                              key={`${item.id}-${idx}`}
                              custom={idx}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              variants={itemVariants}
                              className="text-sm flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                              layout
                            >
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">{t('qty')}: {item.quantity} × {t('currency')} {item.price}</p>
                              </div>
                              <span className="font-medium">{t('currency')} {item.price * item.quantity}</span>
                            </motion.li>
                          ))}
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                )}
              </ul>

              <motion.div className="border-t pt-4 mt-4 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="flex justify-between mb-3">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold">{t('currency')} {total}</span>
                </div>
                
                {/* Updated checkout button text and functionality */}
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium" 
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  {isAuthenticated ? t('proceedToCheckout') : t('continueAsGuest')}
                </motion.button>
                
                {/* Optional login prompt for non-authenticated users */}
                {!isAuthenticated && cart.length > 0 && (
                  <div className="mt-2 text-xs text-center text-gray-500">
                    <p>{t('noAccountNeeded')}</p>
                    <button 
                      onClick={() => router.push('/User/Auth/')}
                      className="text-blue-600 hover:text-blue-700 underline mt-1"
                    >
                      {t('orLogin')}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.aside 
        className="hidden lg:block basis-[30%]"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={desktopVariants}
      >
        <div className="sticky top-24 bg-white rounded-xl shadow-md p-6 flex flex-col h-[70vh] border border-gray-100">
          <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 stroke-[1.5]" /> 
            <span>{t('yourCart')}</span>
            {cart.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </h2>

          <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full">
                <ShoppingCart className="w-10 h-10 stroke-[1.5] text-gray-300 mb-3" />
                <p className="text-gray-500">{t('emptyCart')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('addItems')}</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {Object.entries(groupItemsByCategory(cart)).map(([catName, items]) => (
                  <div key={catName} className="mb-4">
                    <div className="px-4 py-2 font-semibold text-blue-700 border-b border-blue-200 bg-blue-50 rounded-t-lg">
                      {catName}
                    </div>
                    <div>
                      {items.map((item, idx) => (
                        <motion.li 
                          key={`${item.id}-${idx}`}
                          custom={idx}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={itemVariants}
                          className="text-sm flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          layout
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-gray-500">{t('qty')}: {item.quantity} × {t('currency')} {item.price}</p>
                          </div>
                          <span className="font-medium">{t('currency')} {item.price * item.quantity}</span>
                        </motion.li>
                      ))}
                    </div>
                  </div>
                ))}
              </AnimatePresence>
            )}
          </ul>

          <motion.div className="border-t pt-4 mt-4 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex justify-between mb-3">
              <span className="font-medium">{t('subtotal')}</span>
              <span className="font-semibold">{t('currency')} {total}</span>
            </div>
            <div className="flex justify-between mb-3 text-xs text-gray-500">
              <span>{t('shipping')}</span>
              <span>{cart.length > 0 ? t('calculatedAtCheckout') : '—'}</span>
            </div>
            
            {/* Updated checkout button */}
            <motion.button 
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-50 font-medium shadow-md" 
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              {isAuthenticated ? t('proceedToCheckout') : t('continueAsGuest')}
            </motion.button>
            
            {/* Optional login prompt for non-authenticated users */}
            {!isAuthenticated && cart.length > 0 && (
              <div className="mt-3 text-xs text-center text-gray-500">
                <p className="mb-1">{t('noAccountNeeded')}</p>
                <button 
                  onClick={() => router.push('/User/Auth/')}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  {t('orLogin')} →
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </motion.aside>
    </AnimatePresence>  
  );
}

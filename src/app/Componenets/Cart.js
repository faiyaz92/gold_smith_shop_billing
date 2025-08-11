'use client';
import { ShoppingCart, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function Cart({ cart, isMobile, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Check authentication
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Animation for mount/unmount
  useEffect(() => {
    setIsVisible(true);
    return () => setIsVisible(false);
  }, []);

  // Navigate on checkout
  const handleCheckout = () => {
    if (isAuthenticated) {
      router.push('/User/Checkoutpage/');
    } else {
      router.push('/User/Auth/');
    }
  };

  // Mobile drawer animation variants
  const mobileVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { y: "100%", opacity: 0, transition: { duration: 0.3 } }
  };

  // Desktop sidebar animation variants
  const desktopVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 }
    },
    exit: { x: 50, opacity: 0, transition: { duration: 0.3 } }
  };

  // Item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    }),
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
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <button 
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full"
                  >
                    <ShoppingCart className="w-8 h-8 stroke-[1.5] text-gray-300 mb-2" />
                    <p className="text-gray-500">Your cart is empty</p>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item, index) => (
                      <motion.li 
                        key={`${item.id}-${index}`}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={itemVariants}
                        className="text-sm flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        layout
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                        <span className="font-medium">₹{item.price * item.quantity}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                )}
              </ul>

              <motion.div 
                className="border-t pt-4 mt-4 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-between mb-3">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold">₹{total}</span>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium" 
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  Checkout
                </motion.button>
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
            <span>Your Cart</span>
            {cart.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </h2>

          <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full"
              >
                <ShoppingCart className="w-10 h-10 stroke-[1.5] text-gray-300 mb-3" />
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-gray-400 text-sm mt-1">Add items to get started</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {cart.map((item, index) => (
                  <motion.li 
                    key={`${item.id}-${index}`}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={itemVariants}
                    className="text-sm flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    layout
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                    </div>
                    <span className="font-medium">₹{item.price * item.quantity}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            )}
          </ul>

          <motion.div 
            className="border-t pt-4 mt-4 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between mb-3">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold">₹{total}</span>
            </div>
            <div className="flex justify-between mb-3 text-xs text-gray-500">
              <span>Shipping</span>
              <span>{cart.length > 0 ? 'Calculated at checkout' : '—'}</span>
            </div>
            <motion.button 
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-50 font-medium shadow-md" 
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </motion.button>
          </motion.div>
        </div>
      </motion.aside>
    </AnimatePresence>  
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/app/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import Navbar from '@/app/Componenets/Navbar';
import { User, Shield } from 'lucide-react';

export const PICKUP_TIMES = [
  { value: 'morning', label: 'Morning (9-12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12-5 PM)' },
  { value: 'evening', label: 'Evening (5-8 PM)' },
];

export const DELIVERY_PREFS = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express (+KWD5)' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get('method') || 'cod';

  // Define Firestore paths
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'abc_pvt_ltd';
  const tenantUsersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`;
  const tenantOrdersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`;

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    zip: '',
    address: ''
  });
  const [schedule, setSchedule] = useState({
    pickupTime: 'morning',
    deliveryPref: 'standard',
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Check authentication status and load data
  useEffect(() => {
    const auth = getAuth();
    
    // Get authentication status from Cart component
    const isAuthenticatedUser = localStorage.getItem('isAuthenticatedUser') === 'true';
    const userInfo = localStorage.getItem('checkoutUserInfo');
    
    setIsAuthenticated(isAuthenticatedUser);
    setIsGuest(!isAuthenticatedUser);

    if (isAuthenticatedUser && userInfo) {
      // User is authenticated, get their data
      const parsedUserInfo = JSON.parse(userInfo);
      
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          
          try {
            const userRef = doc(db, `${tenantUsersPath}/${currentUser.uid}`);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setForm({
                name: userData.name || currentUser.displayName || '',
                email: userData.email || currentUser.email || '',
                phone: userData.phone || '',
                city: userData.city || '',
                zip: userData.zip || '',
                address: userData.address || ''
              });
            } else {
              // Pre-fill with Firebase Auth data
              setForm({
                name: currentUser.displayName || '',
                email: currentUser.email || '',
                phone: currentUser.phoneNumber || '',
                city: '',
                zip: '',
                address: ''
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      });

      return () => unsubscribe();
    }
    // If not authenticated, user can proceed as guest
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    setCart(savedCart);
    
    // If no cart items, redirect to home
    if (savedCart.length === 0) {
      router.push('/');
    }
  }, [router]);

  // Handle input change for address form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle schedule change
  const handleScheduleChange = (e) => {
    setSchedule({ ...schedule, [e.target.name]: e.target.value });
  };

  // Save address to Firestore (only for authenticated users)
  const saveAddress = async () => {
    if (!form.name || !form.phone || !form.city || !form.zip || !form.email || !form.address) {
      alert('Please fill all delivery details');
      return false;
    }

    if (isAuthenticated && user) {
      try {
        const userRef = doc(db, `${tenantUsersPath}/${user.uid}`);
        const updates = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          zip: form.zip,
          address: form.address,
          userType: 'Customer',
          updatedAt: serverTimestamp()
        };

        // Check if user document exists
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          await updateDoc(userRef, updates);
        } else {
          // Create user document if it doesn't exist
          await setDoc(userRef, {
            ...updates,
            createdAt: serverTimestamp()
          });
        }
        return true;
      } catch (error) {
        console.error('Error saving address:', error);
        alert('Error saving address');
        return false;
      }
    }
    
    // For guest users, we don't save address, just validate
    return true;
  };

  // Place order
  const placeOrder = async () => {
    if (!form.name || !form.phone || !form.city || !form.zip || !form.email || !form.address) {
      alert('Please fill all delivery details');
      return;
    }

    setLoading(true);
    try {
      const saved = await saveAddress();
      if (!saved) {
        setLoading(false);
        return;
      }

      // Generate a guest user ID for non-authenticated users
      const guestUserId = isGuest ? `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : user.uid;

      const orderData = {
        userId: guestUserId,
        items: cart,
        total: total,
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        zip: form.zip,
        address: form.address,
        paymentMethod: method === 'cod' ? 'COD' : 'razorpay',
        paymentStatus: method === 'cod' ? 'pending' : 'completed',
        status: 'Pending',
        timestamp: serverTimestamp(),
        pickupTime: schedule.pickupTime,
        deliveryPref: schedule.deliveryPref,
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        
        // Additional fields for order tracking
        isGuestOrder: isGuest,
        orderSource: 'Website',
        customerType: isGuest ? 'Guest' : 'Registered',
        
        // Admin will call to confirm
        adminCallRequired: true,
        adminCallStatus: 'pending',
        orderConfirmed: false,
        
        // Laundry status tracking
        laundryStatus: {
          pickupManVerified: false,
          customerPickupVerified: false,
          receivedAtFacility: false,
          sortingDone: false,
          washingDone: false,
          dryingDone: false,
          ironingDone: false,
          foldingDone: false,
          qualityCheckDone: false,
          deliveryManDone: false,
          customerDeliveryConfirmed: false,
        }
      };

      // If guest user, also create a minimal user record for order tracking
      if (isGuest) {
        const guestUserData = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          zip: form.zip,
          address: form.address,
          userType: 'Guest',
          isGuestUser: true,
          createdAt: serverTimestamp(),
          createdFrom: 'Website Checkout'
        };

        await setDoc(doc(db, tenantUsersPath, guestUserId), guestUserData);
      }

      await addDoc(collection(db, tenantOrdersPath), orderData);

      // Clear localStorage
      localStorage.removeItem('checkoutCart');
      localStorage.removeItem('isAuthenticatedUser');
      localStorage.removeItem('checkoutUserInfo');

      // Show success message and redirect
      alert(isGuest 
        ? 'Order placed successfully! Our admin will call you to confirm the order details.' 
        : 'Order placed successfully!'
      );
      
      if (isGuest) {
        router.push('/'); // Redirect guests to home page
      } else {
        router.push('/User/Account/'); // Redirect registered users to account page
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
    setLoading(false);
  };

  // Group items by category
  const groupItemsByCategory = (items) => {
    return items.reduce((acc, item) => {
      const category = item.categoryName || item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  };

  const grouped = groupItemsByCategory(cart);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Checkout</h1>
          
          {/* User status indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100">
            {isGuest ? (
              <>
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Guest Checkout</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Registered User</span>
              </>
            )}
          </div>
        </div>

        {/* Guest user notice */}
        {isGuest && (
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-800">Guest Checkout</h3>
            </div>
            <p className="text-blue-700 text-sm">
              You&apos;re checking out as a guest. Our admin will call you to confirm your order details. 
              <button 
                onClick={() => router.push('/User/Auth/')}
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                Want to create an account for faster future orders?
              </button>
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: Delivery Details, then Schedule */}
          <div className="flex flex-col gap-8">
            <motion.div
              className="bg-white p-6 rounded-lg shadow-md border border-blue-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-lg font-semibold mb-4 text-blue-800">Delivery Details</h2>
              <div className="space-y-4">
                <input
                  name="name"
                  placeholder="Full Name *"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address *"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  name="phone"
                  placeholder="Phone Number *"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  name="city"
                  placeholder="City *"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  name="zip"
                  placeholder="Zip Code *"
                  value={form.zip}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <textarea
                  name="address"
                  placeholder="Complete Address *"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              className="bg-white p-6 rounded-lg shadow-md border border-blue-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-lg font-semibold mb-4 text-blue-800">Schedule</h2>
              <div className="mb-4">
                <div className="font-medium mb-2 text-blue-700">Pickup Time</div>
                <div className="space-y-2">
                  {PICKUP_TIMES.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pickupTime"
                        value={opt.value}
                        checked={schedule.pickupTime === opt.value}
                        onChange={handleScheduleChange}
                        className="accent-blue-600"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-2 text-blue-700">Delivery Preference</div>
                <div className="space-y-2">
                  {DELIVERY_PREFS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryPref"
                        value={opt.value}
                        checked={schedule.deliveryPref === opt.value}
                        onChange={handleScheduleChange}
                        className="accent-blue-600"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column: Order Summary */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md border border-blue-100 flex flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Order Summary</h2>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {cart.length === 0 ? (
                <p className="text-gray-500">Your cart is empty</p>
              ) : (
                Object.entries(grouped).map(([catName, items]) => (
                  <div key={catName} className="mb-4 border rounded-lg border-blue-200 bg-blue-50">
                    <div className="px-4 py-2 font-semibold text-blue-700 border-b border-blue-200">{catName}</div>
                    <div className="p-4 space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span>KWD {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-blue-100 pt-4">
              <div className="flex justify-between mb-2 text-blue-900">
                <span>Subtotal</span>
                <span>KWD {total.toFixed(2)}</span>
              </div>
              {schedule.deliveryPref === 'express' && (
                <div className="flex justify-between mb-2 text-blue-700">
                  <span>Express Delivery</span>
                  <span>KWD 5.00</span>
                </div>
              )}
              <div className="flex justify-between mb-2 text-blue-500 text-sm">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-semibold text-lg text-blue-700">
                <span>Total</span>
                <span>KWD {(total + (schedule.deliveryPref === 'express' ? 5 : 0)).toFixed(2)}</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              disabled={cart.length === 0 || loading}
              onClick={placeOrder}
              className="w-full py-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Placing Order...' : 
                isGuest ? 
                  `Place Order as Guest (COD)` : 
                  `Place Order (${method === 'cod' ? 'COD' : 'Online Payment'})`
              }
            </motion.button>
            
            {isGuest && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Admin will call you to confirm order details
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
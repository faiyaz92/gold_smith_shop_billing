'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/app/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import Navbar from '@/app/Componenets/Navbar';
import { groupItemsByCategory } from '@/app/utils/utils';
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
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    zip: '',
    address: ''
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Fetch user and address
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/User/Auth/');
        return;
      }

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
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    setCart(savedCart);
  }, []);

  // Handle input change for address form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save address to Firestore
  const saveAddress = async () => {
    if (!form.name || !form.phone || !form.city || !form.zip || !form.email || !form.address) {
      alert('Please fill all delivery details');
      return false;
    }

    try {
      const userRef = doc(db, `${tenantUsersPath}/${user.uid}`);
      const updates = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        zip: form.zip,
        address: form.address
      };

      await updateDoc(userRef, updates);
      return true;
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error saving address');
      return false;
    }
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

      await addDoc(collection(db, tenantOrdersPath), {
        userId: user.uid,
        items: cart, // cart already has all product details
        total: total,
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        zip: form.zip,
        address: form.address,
        paymentMethod: method === 'cod' ? 'COD' : 'razorpay',
        status: method === 'cod' ? 'Pending' : 'Completed',
        timestamp: serverTimestamp(),
        ...(method !== 'cod' && { deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) })
      });

      localStorage.removeItem('checkoutCart');
      router.push('/User/Account/');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    }
    setLoading(false);
  };

  // Group items by category
  const groupItemsByCategory = (items) => {
    return items.reduce((acc, item) => {
      const category = item.category || 'Other';
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
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Checkout</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md border border-blue-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Delivery Details</h2>
            <div className="space-y-4">
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-blue-200 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-blue-200 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-blue-200 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                className="w-full border border-blue-200 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                name="zip"
                placeholder="Zip Code"
                value={form.zip}
                onChange={handleChange}
                className="w-full border border-blue-200 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <textarea
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
                className="w-full border border-blue-200 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                required
              />
            </div>
          </motion.div>

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
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )  }
            </div>

            <div className="mt-4 border-t border-blue-100 pt-4">
              <div className="flex justify-between mb-2 text-blue-900">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className="flex justify-between mb-2 text-blue-500 text-sm">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-semibold text-lg text-blue-700">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              disabled={cart.length === 0 || loading}
              onClick={placeOrder}
              className="w-full py-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Placing Order...' : `Place Order (${method === 'cod' ? 'COD' : 'Online Payment'})`}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
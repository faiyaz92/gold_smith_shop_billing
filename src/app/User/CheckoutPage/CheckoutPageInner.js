'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/app/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { motion } from 'framer-motion';
import Navbar from '@/app/Componenets/Navbar';

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    userPhone: '',
    city: '',
    zip: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get('method') || 'cod';

  // 🛒 Safe total calculation
  const total = Array.isArray(cart)
    ? cart.reduce(
        (sum, item) => sum + (item?.price || 0) * (item?.quantity || 0),
        0
      )
    : 0;

  // ✅ Load cart safely
  useEffect(() => {
    try {
      const saved = localStorage.getItem('checkoutCart');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCart(Array.isArray(parsed) ? parsed : []);
      } else {
        setCart([]);
      }
    } catch (err) {
      console.error('Error loading cart:', err);
      setCart([]);
    }
  }, []);

  // 📝 Form input handler
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🛍️ Place order
  const placeOrder = async () => {
    if (!form.name || !form.userPhone || !form.city || !form.zip || !form.email) {
      alert('Please fill all delivery details');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push('/User/Auth/');
        return;
      }

      // ✅ Ensure cart is array before saving
      const orderItems = Array.isArray(cart)
        ? cart.map((item) => ({
            name: item?.name || '',
            price: item?.price || 0,
            quantity: item?.quantity || 1,
          }))
        : [];

      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: orderItems,
        total: total || 0,
        name: form.name,
        email: form.email,
        userPhone: form.userPhone,
        city: form.city,
        zip: form.zip,
        paymentMethod: method === 'cod' ? 'COD' : 'Razorpay',
        status: method === 'cod' ? 'Pending' : 'Completed',
        timestamp: serverTimestamp(),
        ...(method !== 'cod' && {
          deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        }),
      });

      // 🧹 Clear cart
      localStorage.removeItem('checkoutCart');
      setCart([]);

      router.push('/User/Account/');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Checkout</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Delivery Details */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md border border-blue-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-blue-800">
              Delivery Details
            </h2>
            <div className="space-y-4">
              {['name', 'email', 'userPhone', 'city', 'zip'].map((field) => (
                <input
                  key={field}
                  name={field}
                  type={field === 'email' ? 'email' : 'text'}
                  placeholder={
                    field === 'name'
                      ? 'Full Name'
                      : field === 'email'
                      ? 'Email Address'
                      : field === 'userPhone'
                      ? 'Phone Number'
                      : field === 'city'
                      ? 'City'
                      : 'Zip Code'
                  }
                  value={form[field]}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ))}
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md border border-blue-100 flex flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-blue-800">
              Order Summary
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {!Array.isArray(cart) || cart.length === 0 ? (
                <p className="text-gray-500">Your cart is empty</p>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm border-b border-blue-100 pb-2"
                  >
                    <div>
                      <p className="font-medium text-blue-900">
                        {item?.name || 'Unnamed'}
                      </p>
                      <p className="text-blue-500 text-xs">
                        Qty: {item?.quantity || 1} × ₹{item?.price || 0}
                      </p>
                    </div>
                    <span className="font-medium text-blue-700">
                      ₹{(item?.price || 0) * (item?.quantity || 1)}
                    </span>
                  </div>
                ))
              )}
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
              disabled={!Array.isArray(cart) || cart.length === 0 || loading}
              onClick={placeOrder}
              className="w-full py-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading
                ? 'Placing Order...'
                : `Place Order (${method === 'cod' ? 'COD' : 'Online Payment'})`}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

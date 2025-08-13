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

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
        setCart(savedCart);
    }, []);

    // Handle input change
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Place order (COD)
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

            await addDoc(collection(db, 'orders'), {
                userId: user.uid,
                items: cart,
                total: total,
                name: form.name,
                email: form.email,
                userPhone: form.userPhone,
                city: form.city,
                zip: form.zip,
                paymentMethod: method === 'cod' ? 'COD' : 'razorpay',
                status: method === 'cod' ? 'Pending' : 'Completed',
                timestamp: serverTimestamp(),
                ...(method !== 'cod' && { deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }) // Add delivery date 3 days from now for online payments
            });

            // Clear cart
            localStorage.removeItem('checkoutCart');

            router.push('/User/Account/');
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Error placing order');
        }
        setLoading(false);
    };

    return (
        <>
            <Navbar />
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <h1 className="text-2xl font-bold mb-6">Checkout</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Delivery Form */}
                    <motion.div
                        className="bg-white p-6 rounded-lg shadow-md border"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h2 className="text-lg font-semibold mb-4">Delivery Details</h2>
                        <div className="space-y-4">
                            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="w-full border p-2 rounded" />
                            <input name="email" type="email" placeholder="Email Address" value={form.email} onChange={handleChange} className="w-full border p-2 rounded" />
                            <input name="userPhone" placeholder="Phone Number" value={form.userPhone} onChange={handleChange} className="w-full border p-2 rounded" />
                            <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="w-full border p-2 rounded" />
                            <input name="zip" placeholder="Zip Code" value={form.zip} onChange={handleChange} className="w-full border p-2 rounded" />
                        </div>
                    </motion.div>

                    {/* Order Summary */}
                    <motion.div
                        className="bg-white p-6 rounded-lg shadow-md border flex flex-col"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                            {cart.length === 0 ? (
                                <p className="text-gray-500">Your cart is empty</p>
                            ) : (
                                cart.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm border-b pb-2">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-gray-500 text-xs">Qty: {item.quantity} × ₹{item.price}</p>
                                        </div>
                                        <span className="font-medium">₹{item.price * item.quantity}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 border-t pt-4">
                            <div className="flex justify-between mb-2">
                                <span>Subtotal</span>
                                <span>₹{total}</span>
                            </div>
                            <div className="flex justify-between mb-2 text-gray-500 text-sm">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>₹{total}</span>
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            whileHover={{ scale: 1.02 }}
                            disabled={cart.length === 0 || loading}
                            onClick={placeOrder}
                            className="w-full py-3 mt-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Placing Order...' : `Place Order (${method === 'cod' ? 'COD' : 'Online Payment'})`}
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
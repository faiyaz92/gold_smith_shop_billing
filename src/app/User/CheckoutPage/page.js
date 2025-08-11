"use client";

import { useState } from 'react';
import { useCart } from '@/app/context/CartContext';
import { db } from '@/app/firebase';
import Script from 'next/script';
import Navbar from '@/app/Componenets/Navbar'; // ✅ Fixed path case
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getAuth } from "firebase/auth";

const CheckoutPage = () => {
    const { cart, cartCount, clearCart } = useCart();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        zip: '',
    });

    const shippingCharge = 50;

    const calculateTotal = () => {
        const cartTotal = cart.reduce((total, item) => {
            const price = Number(item.price);
            return total + price * item.quantity;
        }, 0);
        return cartTotal + shippingCharge;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const sendWhatsApp = async (orderData) => {
        try {
            await fetch("/api/send-wp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });
        } catch (err) {
            console.error("❌ WhatsApp send error:", err);
        }
    };

    const saveOrderToFirebase = async (paymentId) => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert("Please log in before placing an order.");
            return;
        }

        const enrichedCart = cart.map((item) => ({
            id: item.id,
            name: item.name,
            image: item.image,
            quantity: item.quantity,
            price: item.price,
        }));

        const orderData = {
            ...formData,
            cart: enrichedCart,
            total: calculateTotal(),
            paymentMethod: 'razorpay',
            paymentId,
            status: 'Paid',
            timestamp: new Date(),
            userId: user.uid,
            userPhone: user.phoneNumber || '',
        };

        try {
            await addDoc(collection(db, 'orders'), orderData);

            const promises = cart.map(async (item) => {
                const productRef = doc(db, 'products', item.id);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    const currentQty = productSnap.data().quantity || 0;
                    const newQty = Math.max(currentQty - item.quantity, 0);
                    await updateDoc(productRef, { quantity: newQty });
                }
            });

            await Promise.all(promises);

            await sendWhatsApp(orderData);
            clearCart();
            alert('Order placed successfully!');
            router.push('/User/User_Account');

        } catch (err) {
            console.error('❌ Error saving order:', err);
            alert('Something went wrong saving your order.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        loadRazorpay();
    };

    const loadRazorpay = () => {
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
            amount: calculateTotal() * 100,
            currency: 'INR',
            name: 'SAF Perfume',
            description: 'Purchase from SAF',
            image: '/logo.png',
            handler: async function (response) {
                if (response.razorpay_payment_id) {
                    await saveOrderToFirebase(response.razorpay_payment_id);
                } else {
                    alert('Payment failed or was cancelled.');
                }
            },
            prefill: {
                name: formData.name,
                email: formData.email,
                contact: '9999999999',
            },
            notes: {
                address: formData.address,
            },
            theme: {
                color: '#2563EB',
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    return (
        <>
            <Navbar />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-6xl mx-auto px-4 sm:px-6 py-16 bg-white"
            >
                <motion.h1
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-3xl font-semibold mb-8 text-center sm:text-left text-blue-800"
                >
                    Checkout
                </motion.h1>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Shipping Form */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="bg-white border border-blue-200 rounded-lg p-6 shadow-lg"
                    >
                        <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-blue-200 text-blue-700">
                            Shipping Information
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium mb-1 text-blue-700">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded-md border border-blue-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium mb-1 text-blue-700">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 rounded-md border border-blue-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium mb-1 text-blue-700">Address</label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-md border border-blue-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium mb-1 text-blue-700">City</label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-md border border-blue-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="zip" className="block text-sm font-medium mb-1 text-blue-700">ZIP Code</label>
                                        <input
                                            type="text"
                                            id="zip"
                                            name="zip"
                                            value={formData.zip}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-md border border-blue-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-xl font-semibold mt-8 mb-4 pb-2 border-b border-blue-200 text-blue-700">
                                Payment Method
                            </h2>
                            <p className="text-blue-600">Payment will be processed securely via Razorpay.</p>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
                            >
                                Pay with Razorpay
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Order Summary */}
                    <motion.div
                        initial={{ x: 20 }}
                        animate={{ x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white border border-blue-200 rounded-lg p-6 h-fit shadow-lg sticky top-6"
                    >
                        <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-blue-200 text-blue-700">
                            Order Summary ({cartCount})
                        </h2>
                        <div className="space-y-4 mb-6">
                            {cart.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex justify-between items-center py-2 border-b border-blue-100"
                                >
                                    <div>
                                        <span className="font-medium text-blue-800">{item.name}</span>
                                        <span className="text-blue-400 ml-2">x{item.quantity}</span>
                                    </div>
                                    <span className="font-medium text-blue-800">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                </motion.div>
                            ))}

                            <div className="flex justify-between text-sm text-blue-600">
                                <span>Shipping</span>
                                <span>₹{shippingCharge.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between text-lg font-semibold mt-4 pt-4 border-t border-blue-200 text-blue-800">
                            <span>Total</span>
                            <span>₹{calculateTotal().toFixed(2)}</span>
                        </div>
                    </motion.div>
                </div>

                <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
            </motion.div>
        </>
    );
};

export default CheckoutPage;

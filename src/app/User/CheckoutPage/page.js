"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/app/context/CartContext';
import { db } from '@/app/firebase';
import Script from 'next/script';
import Navbar from '@/app/Componenets/Navbar';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getAuth } from "firebase/auth";
import Image from 'next/image';

const CheckoutPageComponent = () => {
    // Always call hooks at the top level
    const { cart = [], cartCount = 0, clearCart = () => {} } = useCart() || {};
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        zip: '',
    });

    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        // calculate total price
        const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
        setTotalPrice(total);
    }, [cart]);

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePlaceOrder = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                router.push("/login");
                return;
            }

            const orderData = {
                ...formData,
                cart,
                totalPrice,
                status: "pending",
                createdAt: new Date(),
                userId: user.uid
            };

            await addDoc(collection(db, "orders"), orderData);
            clearCart();
            router.push("/User/Orders");
        } catch (error) {
            console.error("Error placing order:", error);
        }
    };

    return (
        <>
            <Navbar />
            <div className="checkout-container max-w-3xl mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Checkout</h1>

                <div className="form-section mb-6">
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="border w-full p-2 mb-2"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="border w-full p-2 mb-2"
                    />
                    <input
                        type="text"
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="border w-full p-2 mb-2"
                    />
                    <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="border w-full p-2 mb-2"
                    />
                    <input
                        type="text"
                        name="zip"
                        placeholder="ZIP Code"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className="border w-full p-2 mb-2"
                    />
                </div>

                <div className="order-summary mb-6">
                    <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
                    {cart.map((item, index) => (
                        <div key={index} className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Image
                                    src={item.image || "/placeholder.jpg"}
                                    alt={item.name}
                                    width={50}
                                    height={50}
                                    className="rounded"
                                />
                                <span>{item.name}</span>
                            </div>
                            <span>₹{(item.price || 0) * (item.quantity || 1)}</span>
                        </div>
                    ))}
                    <div className="font-bold mt-4">Total: ₹{totalPrice}</div>
                </div>

                <motion.button
                    onClick={handlePlaceOrder}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 text-white w-full py-2 rounded"
                >
                    Place Order
                </motion.button>
            </div>
        </>
    );
};

export default CheckoutPageComponent;

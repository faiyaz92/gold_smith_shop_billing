"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/app/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CheckoutPageInner() {
  const [cart, setCart] = useState([]);

  // ✅ Load cart safely from localStorage (only client side)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = JSON.parse(localStorage.getItem("checkoutCart")) || [];
      setCart(savedCart);
    }
  }, []);

  // ✅ Place COD order
  const handlePlaceOrder = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please login first!");
        return;
      }

      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: cart || [],
        paymentMethod: "COD",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Order placed successfully!");
      setCart([]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("checkoutCart");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Something went wrong while placing order.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      {Array.isArray(cart) && cart.length > 0 ? (
        <div className="space-y-2">
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between border p-2 rounded"
            >
              <span>{item.name || "Unnamed product"}</span>
              <span>₹{item.price || 0}</span>
            </div>
          ))}

          <button
            onClick={handlePlaceOrder}
            className="mt-4 bg-black text-white px-4 py-2 rounded"
          >
            Place COD Order
          </button>
        </div>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </div>
  );
}

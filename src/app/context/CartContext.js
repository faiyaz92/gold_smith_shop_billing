"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '@/app/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useFirestorePaths } from '@/app/utils/firestorePaths';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { getCartsPath, getUserCartPath } = useFirestorePaths();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchCart(user.uid);
      } else {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCart(localCart);
        setCartCount(localCart.reduce((sum, item) => sum + (item.quantity || 1), 0));
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchCart = async (userId) => {
    try {
      const cartRef = doc(db, getUserCartPath(userId));
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const cartData = cartSnap.data().items || [];
        setCart(cartData);
        setCartCount(cartData.reduce((sum, item) => sum + (item.quantity || 1), 0));
      } else {
        await setDoc(cartRef, { items: [] });
        setCart([]);
        setCartCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      // Fallback to localStorage
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCart(localCart);
      setCartCount(localCart.reduce((sum, item) => sum + (item.quantity || 1), 0));
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item) => {
    const auth = getAuth();
    const user = auth.currentUser;

    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    let newCart;

    if (existingItemIndex >= 0) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity = (newCart[existingItemIndex].quantity || 1) + 1;
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }

    setCart(newCart);
    setCartCount(newCart.reduce((sum, item) => sum + (item.quantity || 1), 0));

    if (user) {
      try {
        const cartRef = doc(db, getUserCartPath(user.uid));
        await updateDoc(cartRef, { items: newCart });
      } catch (error) {
        console.error("Error updating cart:", error);
      }
    } else {
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  const removeFromCart = async (itemId) => {
    const auth = getAuth();
    const user = auth.currentUser;

    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    setCartCount(newCart.reduce((sum, item) => sum + (item.quantity || 1), 0));

    if (user) {
      try {
        const cartRef = doc(db, getUserCartPath(user.uid));
        await updateDoc(cartRef, { items: newCart });
      } catch (error) {
        console.error("Error updating cart:", error);
      }
    } else {
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    const auth = getAuth();
    const user = auth.currentUser;

    const newCart = cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );

    setCart(newCart);
    setCartCount(newCart.reduce((sum, item) => sum + (item.quantity || 1), 0));

    if (user) {
      try {
        const cartRef = doc(db, getUserCartPath(user.uid));
        await updateDoc(cartRef, { items: newCart });
      } catch (error) {
        console.error("Error updating cart:", error);
      }
    } else {
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  const clearCart = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    setCart([]);
    setCartCount(0);

    if (user) {
      try {
        const cartRef = doc(db, getUserCartPath(user.uid));
        await updateDoc(cartRef, { items: [] });
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    } else {
      localStorage.removeItem('cart');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
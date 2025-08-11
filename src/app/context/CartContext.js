'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);

    // Load cart from localStorage on first render
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            setCart(parsedCart);
            setCartCount(parsedCart.reduce((total, item) => total + item.quantity, 0));
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        setCartCount(count);
    }, [cart]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

// Hook to use the cart
export const useCart = () => useContext(CartContext);

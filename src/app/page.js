'use client';
import { useState } from 'react';
import Head from 'next/head';
import Navbar from '@/app/Componenets/Navbar';
import Products from '@/app/Componenets/Products';
import Cart from '@/app/Componenets/Cart';
import Footer from '@/app/Componenets/Footer';
import MobileNav from '@/app/Componenets/MobileNav';
import Categories from './Componenets/Categories';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // ✅ Add or increase quantity
  const addToCart = (name, price) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === name);
      if (existing) {
        return prev.map(item =>
          item.name === name ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { name, price, quantity: 1 }];
      }
    });
  };

  // ✅ Remove or decrease quantity
  const removeFromCart = (name) => {
    setCart(prev => {
      return prev
        .map(item =>
          item.name === name ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter(item => item.quantity > 0); // Remove if quantity reaches 0
    });
  };

  // ✅ Calculate total
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-gray-50 text-gray-900 leading-relaxed min-h-screen">
      <Head>
        <title>Easy2 Laundry – Clean Clothes, Easy Life</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />
      
      <Categories isMobile={true} />
      
      <main className="max-w-7xl mx-auto lg:flex lg:space-x-6 px-4 lg:px-8 py-6">
        <Categories isMobile={false} />

        {/* ✅ Pass cart, addToCart, and removeFromCart to Products */}
        <Products 
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />

        {/* ✅ Same for Cart */}
        <Cart 
          cart={cart} 
          total={total} 
          isMobile={false}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      </main>

      <Footer />
      
      <MobileNav 
        cart={cart} 
        openCart={() => setMobileCartOpen(true)} 
      />
      
      {mobileCartOpen && (
        <Cart 
          cart={cart} 
          total={total} 
          isMobile={true} 
          onClose={() => setMobileCartOpen(false)}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      )}
    </div>
  );
}

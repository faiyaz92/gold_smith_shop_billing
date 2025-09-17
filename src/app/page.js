'use client';
import { useState, useCallback } from 'react';
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
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = (id, name, price) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, { id, name, price, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCategoryClick = useCallback((categoryId) => {
    const el = document.querySelector(`[data-categoryid="${categoryId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Memoize onSearch to prevent unnecessary re-renders
  const onSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  return (
    <div className="bg-gray-50 text-gray-900 leading-relaxed min-h-screen">
      <Head>
        <title>Easy2 Laundry – Clean Clothes, Easy Life</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar onSearch={onSearch} />

      <Categories isMobile={true} onCategoryClick={handleCategoryClick} activeCategory={activeCategory} />

      <main className="max-w-7xl mx-auto lg:flex lg:space-x-6 px-4 lg:px-8 py-6">
        <Categories isMobile={false} onCategoryClick={handleCategoryClick} activeCategory={activeCategory} />

        <Products
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          onActiveCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
        />

        <Cart cart={cart} total={total} isMobile={false} addToCart={addToCart} removeFromCart={removeFromCart} />
      </main>

      <Footer />

      <MobileNav cart={cart} openCart={() => setMobileCartOpen(true)} onSearch={onSearch} />

      {mobileCartOpen && (
        <Cart cart={cart} total={total} isMobile={true} onClose={() => setMobileCartOpen(false)} addToCart={addToCart} removeFromCart={removeFromCart} />
      )}
    </div>
  );
}
'use client';
import { useState, useCallback } from 'react';
import Head from 'next/head';
import Navbar from '@/app/Componenets/Navbar';
import Products from '@/app/Componenets/Products';
import Cart from '@/app/Componenets/Cart';
import Footer from '@/app/Componenets/Footer';
import Categories from './Componenets/Categories';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false); // Track programmatic scrolls

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleCategoryClick = useCallback((categoryId) => {
    setIsProgrammaticScroll(true); // Mark as programmatic scroll
    setActiveCategory(categoryId); // Update activeCategory immediately
    const el = document.querySelector(`[data-categoryid="${categoryId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reset programmatic scroll flag after scroll completes
      setTimeout(() => setIsProgrammaticScroll(false), 1000); // Adjust timeout as needed
    }
  }, []);

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

      <main className="max-w-7xl mx-auto flex px-4 lg:px-8 py-6 space-x-6">
        <div className="w-56 flex-shrink-0">
          <Categories
            isMobile={false}
            onCategoryClick={handleCategoryClick}
            activeCategory={activeCategory}
          />
        </div>
        <div className="flex-1 min-w-0 h-[calc(100vh-120px)] overflow-y-auto">
          <Products
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            onActiveCategoryChange={(categoryId) => {
              if (!isProgrammaticScroll) {
                setActiveCategory(categoryId); // Only update if not programmatic
              }
            }}
            searchQuery={searchQuery}
          />
        </div>
        <div className="hidden lg:block w-[350px] flex-shrink-0">
          <Cart
            cart={cart}
            isMobile={false}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
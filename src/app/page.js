'use client';
import { useState, useCallback } from 'react';
import Head from 'next/head';
import Navbar from '@/app/Componenets/Navbar';
import Products from '@/app/Componenets/Products';
import Cart from '@/app/Componenets/Cart';
import Footer from '@/app/Componenets/Footer';
import Categories from './Componenets/Categories';
import MobileNav from '@/app/Componenets/MobileNav';
import CategoriesHorizontal from '@/app/Componenets/CategoryHorizontal';

export default function Home() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false); // Track programmatic scrolls
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false); // Track mobile category drawer

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
    setMobileCategoryOpen(false); // Close mobile category drawer after selection
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

      <Navbar
        onSearch={onSearch}
        onOpenMobileCategory={() => setMobileCategoryOpen(true)} // Trigger mobile category drawer
      />

      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row px-2 sm:px-4 lg:px-8 py-4 lg:py-6 gap-4 lg:gap-6">
        {/* Desktop Categories */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <Categories
            isMobile={false}
            onCategoryClick={handleCategoryClick}
            activeCategory={activeCategory}
          />
        </div>
        {/* Mobile Categories Horizontal List */}
        <div className="block lg:hidden sticky top-0 z-40 bg-gray-50">
          <CategoriesHorizontal
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            setActiveSubcategory={setActiveSubcategory}
            activeSubcategory={activeSubcategory}
          />
        </div>
        {/* Products */}
        <div className="flex-1 min-w-0 h-[calc(100vh-120px)] overflow-y-auto">
          <Products
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            onActiveCategoryChange={(categoryId) => {
              if (!isProgrammaticScroll) {
                setActiveCategory(categoryId);
              }
            }}
            searchQuery={searchQuery}
            activeSubcategory={activeSubcategory}
          />
        </div>
        {/* Desktop Cart */}
        <div className="hidden lg:block w-[350px] flex-shrink-0">
          <Cart
            cart={cart}
            isMobile={false}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
          />
        </div>
      </main>
      <MobileNav
        cart={cart}
        openCart={() => setMobileCartOpen(true)}
        onSearch={onSearch}
      />
      <Footer />

      {mobileCartOpen && (
        <Cart
          cart={cart}
          isMobile={true}
          onClose={() => setMobileCartOpen(false)}
        />
      )}

      {mobileCategoryOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileCategoryOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 max-w-full bg-white h-full shadow-lg z-10">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setMobileCategoryOpen(false)}
            >
              ✕
            </button>
            <Categories
              isMobile={true}
              onCategoryClick={(catId) => {
                handleCategoryClick(catId);
                setMobileCategoryOpen(false);
              }}
              activeCategory={activeCategory}
            />
          </div>
        </div>
      )}
    </div>
  );
}
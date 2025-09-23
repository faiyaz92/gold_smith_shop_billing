'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '@/app/Componenets/Navbar';
import Products from '@/app/Componenets/Products';
import Cart from '@/app/Componenets/Cart';
import Footer from '@/app/Componenets/Footer';
import Categories from './Componenets/Categories';
import MobileNav from '@/app/Componenets/MobileNav';
import CategoriesHorizontal from '@/app/Componenets/CategoryHorizontal';
import Link from 'next/link';
import { auth } from '@/app/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { AboutUsModal, ContactUsModal } from '@/app/Componenets/AboutContactModals';
import { useTranslation } from '@/app/utils/useTranslation'; // <-- import here

export default function Home() {
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false); // Track programmatic scrolls
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false); // Track mobile category drawer
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const contactName = useRef();
  const contactEmail = useRef();
  const contactMessage = useRef();
  const contactPurpose = useRef();
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');

  const { t } = useTranslation(); // <-- use translation hook

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

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

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    setContactSuccess('');
    try {
      // Example: send to Firestore or your backend
      // await sendContactMessage({
      //   name: contactName.current.value,
      //   email: contactEmail.current.value,
      //   purpose: contactPurpose.current.value,
      //   message: contactMessage.current.value,
      // });
      setContactSuccess('Message sent successfully!');
      contactName.current.value = '';
      contactEmail.current.value = '';
      contactPurpose.current.value = '';
      contactMessage.current.value = '';
    } catch (err) {
      setContactError('Failed to send message. Please try again.');
    }
    setContactLoading(false);
  };

  return (
    <div className="bg-gray-50 text-gray-900 leading-relaxed min-h-screen">
      <Head>
        <title>{t('pageTitle')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="sticky top-0 z-50 bg-gray-50">
        <Navbar
          onSearch={onSearch}
          onOpenMobileCategory={() => setMobileCategoryOpen(true)}
        />
      </div>

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
        <div className="block lg:hidden sticky top-[56px] z-40 bg-gray-50">
          <CategoriesHorizontal
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            setActiveSubcategory={setActiveSubcategory}
            activeSubcategory={activeSubcategory}
          />
        </div>
        {/* Gray horizontal divider */}
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
            onActiveSubcategoryChange={(subcategoryId) => {
              if (!isProgrammaticScroll) {
                setActiveSubcategory(subcategoryId);
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
          addToCart={addToCart}
          removeFromCart={removeFromCart}
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
          <div className="relative w-72 max-w-full bg-white h-full shadow-lg z-10 flex flex-col">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setMobileCategoryOpen(false)}
              aria-label={t('closeMenu')}
            >
              ✕
            </button>
            <div className="flex flex-col pt-12 px-6 gap-3">
              {/* My Profile/Login */}
              <Link
                href={isLoggedIn ? "/User/Account" : "/User/Auth"}
                onClick={() => setMobileCategoryOpen(false)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg font-medium transition 
                  ${isLoggedIn 
                    ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
              >
                <span className="text-lg">
                  {isLoggedIn ? "👤" : "🔑"}
                </span>
                {isLoggedIn ? t('myProfile') : t('login')}
              </Link>
              {/* About Us */}
              <button
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-blue-700 hover:bg-blue-50 font-medium text-left transition"
                onClick={() => {
                  setShowAbout(true);
                  setMobileCategoryOpen(false);
                }}
              >
                <span className="text-lg">ℹ️</span>
                {t('aboutUs')}
              </button>
              {/* Contact Us */}
              <button
                className="flex items-center gap-2 py-2 px-3 rounded-lg text-blue-700 hover:bg-blue-50 font-medium text-left transition"
                onClick={() => {
                  setShowContact(true);
                  setMobileCategoryOpen(false);
                }}
              >
                <span className="text-lg">📞</span>
                {t('contactUs')}
              </button>
              {/* Logout (only if logged in) */}
              {isLoggedIn && (
                <button
                  className="flex items-center gap-2 py-2 px-3 rounded-lg text-red-600 hover:bg-red-50 font-medium text-left transition mt-2 border-t border-gray-100"
                  onClick={async () => {
                    try {
                      await signOut(auth);
                      setMobileCategoryOpen(false);
                      window.location.href = "/";
                    } catch (error) {
                      // Optionally handle error
                    }
                  }}
                >
                  <span className="text-lg">🚪</span>
                  {t('logout')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AboutUsModal open={showAbout} onClose={() => setShowAbout(false)} />
      <ContactUsModal
        open={showContact}
        onClose={() => setShowContact(false)}
        contactName={contactName}
        contactEmail={contactEmail}
        contactPurpose={contactPurpose}
        contactMessage={contactMessage}
        contactLoading={contactLoading}
        contactError={contactError}
        contactSuccess={contactSuccess}
        handleContactSubmit={handleContactSubmit}
      />
    </div>
  );
}

// Absolutely, your rules are clear:

// No duplicate keys in locale files.
// If a label already exists (same label, same meaning), use the existing key.
// If a label does not exist, add it with a unique key (do not reuse a key for a different label).
// If a key exists but with a different label, use a new unique key for the new label.
// Below is a cleaned-up example for your en.json and ar.json locale files, following your rules.
// No duplicate keys, and all keys are unique and meaningful.
//this localization change only affect lable localization can not 
// affect logic if enum or array are there in english then also
//  logic should not change logic depends on only english key word got it like 
// enum or array only lable will change on UI
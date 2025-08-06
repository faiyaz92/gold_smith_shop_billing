'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiX, FiHelpCircle, FiHome } from 'react-icons/fi';
import Link from 'next/link';

export default function Navbar() {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`sticky top-0 w-full bg-white z-40 transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Logo Only - No Home Icon */}
        <div className="font-semibold tracking-tight text-lg text-blue-700 select-none flex items-center">
          <span className="mr-2">🧺</span>
          <span className="hidden sm:inline">Easy2 Laundry</span>
          <span className="sm:hidden">E2L</span>
        </div>

        {/* Desktop Search */}
        <div className="flex-1 mx-4 hidden sm:block">
          <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search clothes, services..."
              className="w-full rounded-full border border-gray-300 bg-gray-100 py-2 px-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        {/* Right Side Navigation (Desktop) */}
        <div className="hidden sm:flex gap-6 items-center text-sm">
          <Link href="/" className="hover:text-blue-600 transition">
            <FiHome size={20} className="text-gray-600 hover:text-blue-600" />
          </Link>
          
          <button className="hover:text-blue-600 transition flex items-center gap-1">
            <FiHelpCircle className="text-base" />
            <span>Help</span>
          </button>

          <Link href="/User/Account">
            <button className="py-1.5 px-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition hover:scale-105 active:scale-95">
              Login
            </button>
          </Link>
        </div>

        {/* Mobile Right Side (Home + Search) */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link href="/" className="hover:text-blue-600 transition p-2">
            <FiHome size={20} />
          </Link>
          <button
            className="p-2 text-gray-600 hover:text-blue-600 transition"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            {isMobileSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Panel */}
      <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clothes, services..."
              className="w-full rounded-full border border-gray-300 bg-gray-100 py-2 px-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>
    </nav>
  );
}
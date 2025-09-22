'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiHelpCircle, FiHome } from 'react-icons/fi';
import Link from 'next/link';
import { auth, db } from '@/app/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRef } from 'react';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { getCompanyId } from '@/app/utils/firestorePaths';
import Image from 'next/image';

export default function Navbar({ onSearch, onOpenMobileCategory }) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const contactName = useRef();
  const contactEmail = useRef();
  const contactMessage = useRef();
  const contactPurpose = useRef();
  // Firestore path for contact us
  const companyId = getCompanyId();
  const contactPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/contactUs`;
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    setContactSuccess('');
    try {
      await addDoc(collection(db, contactPath), {
        name: contactName.current.value,
        email: contactEmail.current.value,
        purpose: contactPurpose.current.value,
        message: contactMessage.current.value,
        timestamp: serverTimestamp(),
      });
      setContactSuccess('Thank you for contacting us!');
      contactName.current.value = '';
      contactEmail.current.value = '';
      contactPurpose.current.value = '';
      contactMessage.current.value = '';
    } catch (err) {
      setContactError('Failed to send message. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  // Memoize search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  }, [onSearch]);

  useEffect(() => {
    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    // Check authentication status
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    // Cleanup listeners
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    async function fetchLogoAndName() {
      const companyId = getCompanyId();
      const docRef = doc(
        db,
        `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/settings/general`
      );
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.companyName) setCompanyName(data.companyName);
      }
    }
    fetchLogoAndName();
  }, []);

  return (
    <>
      <nav className={`sticky top-0 w-full bg-white z-40 transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-8 h-16">
          {/* Desktop Logo - Make it clickable */}
          <Link href="/" className="hidden sm:block">
            <div className="font-semibold tracking-tight text-lg text-blue-700 select-none flex items-center hover:text-blue-800 transition-colors cursor-pointer">
              {logoUrl ? (
                <span className="mr-2 relative w-7 h-7 inline-block align-middle">
                  <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                </span>
              ) : (
                <span className="mr-2">🧺</span>
              )}
              <span className="hidden sm:inline">{companyName || 'Laundry'}</span>
              <span className="sm:hidden">E2L</span>
            </div>
          </Link>

          <div className="flex-1 mx-4 hidden sm:block">
            <div className="relative w-full max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search clothes, services..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-full border border-gray-300 bg-gray-100 py-2 px-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          <div className="hidden sm:flex gap-6 items-center text-sm">
            <Link href="/" className="hover:text-blue-600 transition">
              <FiHome size={20} className="text-gray-600 hover:text-blue-600" />
            </Link>
            <button className="hover:text-blue-600 transition flex items-center gap-1" onClick={() => setShowAbout(true)}>
              <span>About Us</span>
            </button>
            <button className="hover:text-blue-600 transition flex items-center gap-1" onClick={() => setShowContact(true)}>
              <span>Contact Us</span>
            </button>
            <Link href="/User/Account">
              <button
                className={`py-1.5 px-4 rounded-full text-white transition hover:scale-105 active:scale-95 ${
                  isLoggedIn ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoggedIn ? 'My Profile' : 'Login'}
              </button>
            </Link>
          </div>

          <div className="flex items-center sm:hidden w-full">
            {/* Hamburger menu - leftmost */}
            <button
              className="p-2 text-gray-600 hover:text-blue-600 transition"
              onClick={onOpenMobileCategory}
              aria-label="Open categories"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Logo - centered */}
            <Link href="/" className="flex-1 text-center">
              <div className="font-semibold tracking-tight text-lg text-blue-700 select-none inline-flex items-center hover:text-blue-800 transition-colors cursor-pointer">
                {logoUrl ? (
                  <span className="mr-2 relative w-7 h-7 inline-block align-middle">
                    <Image src={logoUrl} alt="Logo" fill className="object-contain" />
                  </span>
                ) : (
                  <span className="mr-2">🧺</span>
                )}
                <span>{companyName || 'Laundry'}</span>
              </div>
            </Link>

            {/* Search icon - right aligned and stick to right edge */}
            <div className="flex-shrink-0">
              <button
                className="p-2 text-gray-600 hover:text-blue-600 transition"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                style={{ marginRight: 0 }}
              >
                {isMobileSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileSearchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clothes, services..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-full border border-gray-300 bg-gray-100 py-2 px-4 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>
        </div>
      </nav>
      {/* About Us Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowAbout(false)}>
              <FiX size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-700">About Easy2 Laundry</h2>
            <p className="text-gray-700 mb-2">Easy2 Laundry is your trusted partner for fast, reliable, and affordable laundry and dry cleaning services. We pick up, clean, and deliver your clothes right to your doorstep, so you can focus on what matters most.</p>
            <ul className="list-disc pl-6 text-gray-600 mb-2">
              <li>Doorstep pickup and delivery</li>
              <li>Professional cleaning for all garments</li>
              <li>Express and eco-friendly options</li>
              <li>Transparent pricing</li>
              <li>Customer support 7 days a week</li>
            </ul>
            <p className="text-gray-700">We are committed to making laundry day hassle-free for families, professionals, and businesses alike.</p>
          </div>
        </div>
      )}
      {/* Contact Us Modal */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowContact(false)}>
              <FiX size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-700">Contact Us</h2>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input ref={contactName} type="text" className="w-full border border-gray-300 rounded px-3 py-2" required disabled={contactLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input ref={contactEmail} type="email" className="w-full border border-gray-300 rounded px-3 py-2" required disabled={contactLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <select ref={contactPurpose} className="w-full border border-gray-300 rounded px-3 py-2" required disabled={contactLoading} defaultValue="">
                  <option value="" disabled>Select purpose</option>
                  <option value="B2B">B2B Partnership</option>
                  <option value="Bulk">Bulk Order</option>
                  <option value="Marriage">Marriage Clothes</option>
                  <option value="Recurring">Recurring Service</option>
                  <option value="Issue">Issue</option>
                  <option value="Concern">Concern</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea ref={contactMessage} className="w-full border border-gray-300 rounded px-3 py-2" rows={4} required disabled={contactLoading}></textarea>
              </div>
              {contactError && <p className="text-red-500 text-sm">{contactError}</p>}
              {contactSuccess && <p className="text-green-600 text-sm">{contactSuccess}</p>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded" disabled={contactLoading}>
                {contactLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
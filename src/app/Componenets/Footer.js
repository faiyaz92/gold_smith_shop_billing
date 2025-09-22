'use client';

import { useEffect, useState } from 'react';
import { db } from '@/app/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Truck, Headphones, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const [settings, setSettings] = useState(null);
  const [showFaq, setShowFaq] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
      const docRef = doc(
        db,
        `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/settings/general`
      );
      const snap = await getDoc(docRef);
      if (snap.exists()) setSettings(snap.data());
    }
    fetchSettings();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Contact Us</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-400" />
              <a href={`tel:${settings?.contactNumber || '+919687283344'}`} className="text-gray-400 hover:text-blue-400 transition-colors">
                {settings?.contactNumber || '+91 9687283344'}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-400" />
              <a href={`mailto:${settings?.email || 'sales@easy2Solutions.com'}`} className="text-gray-400 hover:text-blue-400 transition-colors">
                {settings?.email || 'sales@easy2Solutions.com'}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400">{settings?.address || 'C-1212 Shidhidhi Vinayak Business Tower, Ahmedabad, India 383315'}</span>
            </li>
          </ul>
        </div>

        {/* Fast Delivery */}
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Fast Delivery</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400">Same Day Delivery Available</span>
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400">Track Your Order</span>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Support</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-blue-400" />
              <button
                className="text-gray-400 hover:text-blue-400 transition-colors underline"
                onClick={() => setShowFaq(true)}
              >
                FAQs
              </button>
            </li>
            <li className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-blue-400" />
              <button
                className="text-gray-400 hover:text-blue-400 transition-colors underline"
                onClick={() => setShowPrivacy(true)}
              >
                Privacy Policy
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* FAQ Dialog */}
      {showFaq && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowFaq(false)}>✕</button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">FAQs</h2>
            <div className="prose max-w-none text-gray-800 whitespace-pre-line">{settings?.faqs || 'No FAQs set.'}</div>
          </div>
        </div>
      )}

      {/* Privacy Policy Dialog */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowPrivacy(false)}>✕</button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Privacy Policy</h2>
            <div className="prose max-w-none text-gray-800 whitespace-pre-line">{settings?.privacyPolicy || 'No Privacy Policy set.'}</div>
          </div>
        </div>
      )}

      <div className="text-center py-4 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <p>
          Powered by{' '}
          <a href="https://www.easy2Solutions.com" className="text-blue-400 hover:underline">
            Easy2Solutions
          </a>
        </p>
        <p className="mt-2">&copy; 2025 Easy2Laundry. All rights reserved.</p>
      </div>
    </footer>
  );
}
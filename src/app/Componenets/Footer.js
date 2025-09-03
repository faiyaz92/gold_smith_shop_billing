'use client';

import Link from 'next/link';
import { Truck, Headphones, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Contact Us</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-400" />
              <a href="tel:+919687283344" className="text-gray-400 hover:text-blue-400 transition-colors">
                +91 9687283344
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-400" />
              <a href="mailto:sales@easy2Solutions.com" className="text-gray-400 hover:text-blue-400 transition-colors">
                sales@easy2Solutions.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400">C-1212 Shidhidhi Vinayak Business Tower, Ahmedabad, India 383315</span>
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
              <Link href="/faqs" className="text-gray-400 hover:text-blue-400 transition-colors">
                FAQs
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-blue-400" />
              <Link href="/privacy-policy" className="text-gray-400 hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

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
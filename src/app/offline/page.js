// src/app/offline/page.js
"use client";

import { useState, useEffect } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    // If user comes back online, redirect to main app
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L12 12m-6.364 6.364L12 12m6.364-6.364L12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re Offline
        </h1>

        <p className="text-gray-600 mb-6">
          Don&apos;t worry! Your sales will be saved locally and synced automatically when you&apos;re back online.
        </p>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Offline Features Available:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Record sales and orders</li>
              <li>• View inventory (cached)</li>
              <li>• Access customer information</li>
              <li>• Generate receipts</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">When Back Online:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• All data will sync automatically</li>
              <li>• No information will be lost</li>
              <li>• Real-time updates resume</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Check Connection
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>Perfume Seller Management System</p>
          <p>Offline Mode Active</p>
        </div>
      </div>
    </div>
  );
}
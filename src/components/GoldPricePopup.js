"use client";
import { useState, useEffect } from 'react';
import { fetchGoldPrice, getLatestGoldPrice } from '@/utils/goldPriceAPI';
import { X, RefreshCw, Calculator } from 'lucide-react';

const OUNCE_TO_GRAM = 31.1035; // More precise conversion

export default function GoldPricePopup({ isOpen, onClose, onPriceConfirm, initialAmount = 0, amountType = 'usd' }) {
  const [goldPrice, setGoldPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usdAmount, setUsdAmount] = useState(initialAmount);
  const [goldGrams, setGoldGrams] = useState(0);
  const [inputType, setInputType] = useState(amountType); // 'usd' or 'gold'

  // Load latest gold price on mount
  useEffect(() => {
    if (isOpen) {
      loadGoldPrice();
    }
  }, [isOpen]);

  // Calculate conversions when price or amounts change
  useEffect(() => {
    if (goldPrice) {
      if (inputType === 'usd' && usdAmount > 0) {
        const grams = usdAmount / goldPrice.pricePerGram;
        setGoldGrams(parseFloat(grams.toFixed(4)));
      } else if (inputType === 'gold' && goldGrams > 0) {
        const usd = goldGrams * goldPrice.pricePerGram;
        setUsdAmount(parseFloat(usd.toFixed(2)));
      }
    }
  }, [goldPrice, usdAmount, goldGrams, inputType]);

  const loadGoldPrice = async () => {
    setLoading(true);
    try {
      // Try to get latest cached price first
      const cachedPrice = await getLatestGoldPrice();
      if (cachedPrice) {
        setGoldPrice(cachedPrice);
      }

      // Fetch fresh price
      const freshPrice = await fetchGoldPrice();
      if (freshPrice.success) {
        setGoldPrice(freshPrice);
      }
    } catch (error) {
      console.error('Error loading gold price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (onPriceConfirm && goldPrice) {
      onPriceConfirm({
        usdAmount: parseFloat(usdAmount),
        goldGrams: parseFloat(goldGrams),
        pricePerOunce: goldPrice.pricePerOunce,
        pricePerGram: goldPrice.pricePerGram,
        source: goldPrice.source,
        timestamp: goldPrice.timestamp
      });
      onClose();
    }
  };

  const handleUsdChange = (value) => {
    setInputType('usd');
    setUsdAmount(parseFloat(value) || 0);
  };

  const handleGoldChange = (value) => {
    setInputType('gold');
    setGoldGrams(parseFloat(value) || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-yellow-600" />
            Gold Price Calculator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Gold Price */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-800">Current Gold Price</span>
              <button
                onClick={loadGoldPrice}
                disabled={loading}
                className="text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {goldPrice ? (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Per Ounce:</span>
                  <span className="font-semibold">${goldPrice.pricePerOunce.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Per Gram:</span>
                  <span className="font-semibold">${goldPrice.pricePerGram.toFixed(2)}</span>
                </div>
                <div className="text-xs text-yellow-600 mt-2">
                  Source: {goldPrice.source} • {goldPrice.timestamp?.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-yellow-700 text-sm">
                {loading ? 'Loading price...' : 'Unable to load gold price'}
              </div>
            )}
          </div>

          {/* Conversion Calculator */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Amount Conversion</h3>

            {/* USD Input */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                USD Amount ($)
              </label>
              <input
                type="number"
                value={usdAmount}
                onChange={(e) => handleUsdChange(e.target.value)}
                placeholder="Enter USD amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                step="0.01"
                min="0"
              />
            </div>

            {/* Gold Grams Input */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Pure Gold (grams)
              </label>
              <input
                type="number"
                value={goldGrams}
                onChange={(e) => handleGoldChange(e.target.value)}
                placeholder="Enter gold grams"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                step="0.0001"
                min="0"
              />
            </div>

            {/* Conversion Info */}
            {goldPrice && (usdAmount > 0 || goldGrams > 0) && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>USD Amount:</span>
                  <span className="font-medium">${usdAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gold Grams:</span>
                  <span className="font-medium">{goldGrams.toFixed(4)}g</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span>Rate:</span>
                  <span className="font-medium">${goldPrice.pricePerGram.toFixed(2)}/g</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!goldPrice || (usdAmount === 0 && goldGrams === 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Conversion
          </button>
        </div>
      </div>
    </div>
  );
}
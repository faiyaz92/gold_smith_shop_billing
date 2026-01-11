"use client";
import { useState, useEffect } from 'react';
import { X, RefreshCw, Save, Calculator } from 'lucide-react';
import { fetchGoldPrice, getLatestGoldPrice, saveGoldPrice } from '@/utils/goldPriceAPI';

const OUNCE_TO_GRAM = 31.1035;

export default function GoldPriceManager({ isOpen, onClose }) {
  const [goldPrice, setGoldPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pricePerOunce, setPricePerOunce] = useState('');
  const [pricePerGram, setPricePerGram] = useState('');
  const [activeField, setActiveField] = useState(null); // Track which field user is editing

  // Load latest gold price on mount
  useEffect(() => {
    if (isOpen) {
      loadGoldPrice();
    }
  }, [isOpen]);

  // Update gram price when ounce price changes (only when ounce field is active)
  useEffect(() => {
    if (pricePerOunce && !isNaN(pricePerOunce) && activeField === 'ounce') {
      const gramPrice = parseFloat(pricePerOunce) / OUNCE_TO_GRAM;
      setPricePerGram(gramPrice.toFixed(2));
    }
  }, [pricePerOunce, activeField]);

  // Update ounce price when gram price changes (only when gram field is active)
  useEffect(() => {
    if (pricePerGram && !isNaN(pricePerGram) && activeField === 'gram') {
      const ouncePrice = parseFloat(pricePerGram) * OUNCE_TO_GRAM;
      setPricePerOunce(ouncePrice.toFixed(2));
    }
  }, [pricePerGram, activeField]);

  const loadGoldPrice = async () => {
    setLoading(true);
    try {
      const priceData = await getLatestGoldPrice();
      if (priceData) {
        setGoldPrice(priceData);
        setPricePerOunce(priceData.pricePerOunce?.toString() || '');
        setPricePerGram(priceData.pricePerGram?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading gold price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrice = async () => {
    setLoading(true);
    try {
      const freshPrice = await fetchGoldPrice();
      if (freshPrice.success) {
        setGoldPrice(freshPrice);
        setPricePerOunce(freshPrice.pricePerOunce?.toString() || '');
        setPricePerGram(freshPrice.pricePerGram?.toString() || '');
      }
    } catch (error) {
      console.error('Error refreshing gold price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrice = async () => {
    if (!pricePerOunce || !pricePerGram) {
      alert('Please enter both ounce and gram prices');
      return;
    }

    setSaving(true);
    try {
      const customPrice = {
        pricePerOunce: parseFloat(pricePerOunce),
        pricePerGram: parseFloat(pricePerGram),
        source: 'manual_override',
        timestamp: new Date(),
        success: true
      };

      await saveGoldPrice(customPrice);
      setGoldPrice(customPrice);
      alert('Gold price updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving gold price:', error);
      alert('Failed to save gold price. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-yellow-600" />
            Gold Price Manager
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
          {/* Current Price Display */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">Current Gold Price (24k)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-yellow-700">Per Ounce</p>
                <p className="text-lg font-bold text-yellow-900">
                  ${goldPrice?.pricePerOunce?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-yellow-700">Per Gram</p>
                <p className="text-lg font-bold text-yellow-900">
                  ${goldPrice?.pricePerGram?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              Source: {goldPrice?.source || 'N/A'} • Last updated: {goldPrice?.timestamp ? new Date(goldPrice.timestamp).toLocaleString() : 'N/A'}
            </p>
          </div>

          {/* Price Input Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Update Gold Price</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Ounce ($)
                </label>
                <input
                  type="text"
                  value={pricePerOunce}
                  onFocus={() => setActiveField('ounce')}
                  onBlur={() => setActiveField(null)}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setPricePerOunce(value);
                    }
                  }}
                  placeholder="Enter price per ounce (e.g., 4500)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Gram ($)
                </label>
                <input
                  type="text"
                  value={pricePerGram}
                  onFocus={() => setActiveField('gram')}
                  onBlur={() => setActiveField(null)}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow only numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setPricePerGram(value);
                    }
                  }}
                  placeholder="Enter price per gram (e.g., 145)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              💡 Click in a field to edit it. The other field will auto-update when you finish editing. Enter numbers only (e.g., 4500).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={handleRefreshPrice}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh from API
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                disabled={saving || !pricePerOunce || !pricePerGram}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Price'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
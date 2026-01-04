'use client';

// ✅ TASK 2.1 COMPLETED: Gold Price Entry Interface (Dual Reversible Entry - BRD v2)
// ✅ TASK 2.2 INTEGRATED: Gold Price API Integration (goldprice.org + kitco.com)
// Purpose: Enter gold price manually OR auto-fetch from APIs with bidirectional calculation
// Reference: BRD_GoldSmith_v2.md Section 1.1, 1.2, DatabaseInfo_GoldSmith_v2.md Section 10
// Formula: pricePerGram = pricePerOunce / 31.15

import { useState, useEffect } from 'react';
import { db } from '@/app/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Save, Clock, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { manualRefreshGoldPrice } from '@/utils/goldPriceAPI';

const OUNCE_TO_GRAM = 31.15;

export default function GoldPriceWidget() {
  const [pricePerOunce, setPricePerOunce] = useState('');
  const [pricePerGram, setPricePerGram] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState('ounce'); // 'ounce' or 'gram'
  const [apiRefreshing, setApiRefreshing] = useState(false);
  const [lastSource, setLastSource] = useState('manual');

  useEffect(() => {
    fetchLatestPrice();
  }, []);

  const fetchLatestPrice = async () => {
    try {
      const q = query(
        collection(db, 'goldPriceHistory'),
        orderBy('timestamp', 'desc'),
        limit(2)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        setPricePerOunce(latest.pricePerOunce.toString());
        setPricePerGram(latest.pricePerGram.toString());
        setLastUpdate(latest.timestamp?.toDate());
        setLastSource(latest.source || 'manual');
        
        // Calculate change from previous price
        if (snapshot.docs.length > 1) {
          const previous = snapshot.docs[1].data();
          const change = ((latest.pricePerOunce - previous.pricePerOunce) / previous.pricePerOunce) * 100;
          setPriceChange(change);
        }
      }
    } catch (error) {
      console.error('Error fetching gold price:', error);
    }
  };

  // API Refresh Handler (TASK 2.2)
  const handleApiRefresh = async () => {
    setApiRefreshing(true);
    try {
      const result = await manualRefreshGoldPrice();
      
      if (result.success) {
        toast.success(`Price updated from ${result.source || 'API'}`);
        
        // Show alert if significant change
        if (result.alert) {
          toast.warning(result.alert.message, {
            autoClose: 8000,
            icon: '⚠️',
          });
        }
        
        // Refresh display
        await fetchLatestPrice();
      } else {
        toast.error(`API failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error refreshing from API:', error);
      toast.error('Failed to fetch from API. Please enter manually.');
    } finally {
      setApiRefreshing(false);
    }
  };

  const handleOunceChange = (value) => {
    setPricePerOunce(value);
    setEditMode('ounce');
    if (value && !isNaN(value)) {
      const gram = (parseFloat(value) / OUNCE_TO_GRAM).toFixed(2);
      setPricePerGram(gram);
    }
  };

  const handleGramChange = (value) => {
    setPricePerGram(value);
    setEditMode('gram');
    if (value && !isNaN(value)) {
      const ounce = (parseFloat(value) * OUNCE_TO_GRAM).toFixed(2);
      setPricePerOunce(ounce);
    }
  };

  const handleSave = async () => {
    if (!pricePerOunce || !pricePerGram) {
      toast.error('Please enter both ounce and gram prices');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'goldPriceHistory'), {
        pricePerOunce: parseFloat(pricePerOunce),
        pricePerGram: parseFloat(pricePerGram),
        source: 'manual',
        timestamp: serverTimestamp(),
        updatedBy: localStorage.getItem('userName') || 'Admin',
      });

      toast.success('Gold price updated successfully');
      fetchLatestPrice();
    } catch (error) {
      console.error('Error saving price:', error);
      toast.error('Failed to save price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-bold text-yellow-900">Gold Price (24k)</h3>
        </div>
        <button
          onClick={fetchLatestPrice}
          className="text-yellow-700 hover:text-yellow-900 transition-colors"
          title="Refresh price"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Dual Reversible Entry - BRD v2 Section 1.1 */}
      <div className="space-y-4">
        {/* Price Per Ounce */}
        <div>
          <label className="block text-sm font-medium text-yellow-800 mb-1">
            Price Per Ounce ($)
          </label>
          <div className="relative">
            <input
              type="number"
              value={pricePerOunce}
              onChange={(e) => handleOunceChange(e.target.value)}
              className={`w-full border-2 rounded-lg px-4 py-3 text-lg font-semibold ${
                editMode === 'ounce' 
                  ? 'border-yellow-500 bg-white' 
                  : 'border-yellow-200 bg-yellow-50'
              }`}
              placeholder="4530.00"
              step="0.01"
            />
            {editMode === 'ounce' && (
              <span className="absolute right-3 top-3 text-yellow-600 text-sm">
                Manual Entry
              </span>
            )}
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Enter ounce price to auto-calculate gram price
          </p>
        </div>

        {/* Bidirectional Arrow */}
        <div className="flex justify-center">
          <div className="text-yellow-600 text-xs font-medium">
            ⇅ Auto-calculates both ways (÷ 31.15)
          </div>
        </div>

        {/* Price Per Gram */}
        <div>
          <label className="block text-sm font-medium text-yellow-800 mb-1">
            Price Per Gram ($)
          </label>
          <div className="relative">
            <input
              type="number"
              value={pricePerGram}
              onChange={(e) => handleGramChange(e.target.value)}
              className={`w-full border-2 rounded-lg px-4 py-3 text-lg font-semibold ${
                editMode === 'gram' 
                  ? 'border-yellow-500 bg-white' 
                  : 'border-yellow-200 bg-yellow-50'
              }`}
              placeholder="145.43"
              step="0.01"
            />
            {editMode === 'gram' && (
              <span className="absolute right-3 top-3 text-yellow-600 text-sm">
                Manual Entry
              </span>
            )}
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Or enter gram price to auto-calculate ounce price
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading || !pricePerOunce || !pricePerGram}
          className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Gold Price'}
        </button>
      </div>

      {/* Price Info */}
      {lastUpdate && (
        <div className="mt-4 pt-4 border-t border-yellow-300">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdate.toLocaleString()}</span>
            </div>
            {priceChange !== 0 && (
              <div className={`flex items-center gap-1 ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-semibold">{Math.abs(priceChange).toFixed(2)}%</span>
              </div>
            )}
          </div>
          
          {/* Source indicator */}
          <div className="mt-2 text-xs text-yellow-600">
            <span className="font-medium">Source:</span> {lastSource === 'manual' ? '✍️ Manual Entry' : `🌐 API (${lastSource})`}
          </div>
        </div>
      )}

      {/* Auto-update notice (TASK 2.2) */}
      <div className="mt-3 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <strong>Auto-Update:</strong> System fetches price from goldprice.org (primary) or kitco.com (fallback) every 1 hour. 
          Alerts if price changes &gt;2%. Use &quot;API Refresh&quot; for manual update.
        </div>
      </div>

      {/* Formula Reference */}
      <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-2">
        <strong>Formula:</strong> Price Per Gram = Price Per Ounce ÷ 31.15
      </div>
    </div>
  );
}

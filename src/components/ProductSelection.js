'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../app/firebase';
import { Package, Calculator, IndianRupee } from 'lucide-react';

export default function ProductSelection({
  selectedCategory,
  selectedKarat,
  weight,
  makingChargePerGram,
  productName,
  onCategoryChange,
  onKaratChange,
  onWeightChange,
  onMakingChargeChange,
  onProductNameChange,
  className = ""
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const categoriesPath = `companies/${companyId}/categories`;

  // Karat options for gold
  const karatOptions = [
    { value: '24k', label: '24k (99.9% Pure)', purity: 1.0 },
    { value: '22k', label: '22k (91.67% Pure)', purity: 0.9167 },
    { value: '18k', label: '18k (75% Pure)', purity: 0.75 }
  ];

  useEffect(() => {
    // Fetch categories with real-time updates
    const categoriesQuery = query(collection(db, categoriesPath), orderBy('sortOrder'));
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate prices
  const calculatePrices = () => {
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData || !weight || !makingChargePerGram) return null;

    const baseRate = parseFloat(selectedCategoryData.metalRatePerGram) || 0;
    const weightNum = parseFloat(weight) || 0;
    const makingChargeNum = parseFloat(makingChargePerGram) || 0;

    // Find selected karat purity
    const selectedKaratData = karatOptions.find(k => k.value === selectedKarat);
    const purity = selectedKaratData ? selectedKaratData.purity : 1.0;

    // Calculate effective metal rate based on purity
    const effectiveMetalRate = baseRate * purity;

    const metalCost = weightNum * effectiveMetalRate;
    const makingChargeTotal = weightNum * makingChargeNum;
    const subtotal = metalCost + makingChargeTotal;
    const gst = subtotal * 0.03; // 3% GST for gold jewelry
    const total = subtotal + gst;

    return {
      baseRate,
      effectiveMetalRate,
      metalCost,
      makingChargeTotal,
      subtotal,
      gst,
      total
    };
  };

  const prices = calculatePrices();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">Product Selection</h3>
      </div>

      {/* Metal Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metal Category *
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Metal</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.categoriesname} - ₹{category.metalRatePerGram}/g (24k)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Karat/Purity *
          </label>
          <select
            value={selectedKarat}
            onChange={(e) => onKaratChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Karat</option>
            {karatOptions.map(karat => (
              <option key={karat.value} value={karat.value}>
                {karat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weight and Making Charge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (grams) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => onWeightChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Making Charge per Gram (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={makingChargePerGram}
            onChange={(e) => onMakingChargeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Description
        </label>
        <input
          type="text"
          value={productName}
          onChange={(e) => onProductNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Gold Bracelet, Silver Necklace"
        />
      </div>

      {/* Price Calculation Display */}
      {prices && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Price Calculation</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Rate (24k):</span>
                <span className="font-medium">₹{prices.baseRate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Effective Rate ({selectedKarat}):</span>
                <span className="font-medium">₹{prices.effectiveMetalRate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Metal Cost ({weight}g):</span>
                <span className="font-medium">₹{prices.metalCost.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Making Charge ({weight}g):</span>
                <span className="font-medium">₹{prices.makingChargeTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{prices.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (3%):</span>
                <span className="font-medium">₹{prices.gst.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-300 mt-3 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-800">Total Amount:</span>
              <div className="flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-green-600">
                  ₹{prices.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
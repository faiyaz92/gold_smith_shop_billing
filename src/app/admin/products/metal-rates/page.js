'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { TrendingUp, History, Calculator, Edit, Save, X } from 'lucide-react';

export default function MetalRatesPage() {
  const [categories, setCategories] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRate, setEditingRate] = useState(null);
  const [newRate, setNewRate] = useState({
    categoryId: '',
    rate24k: 0,
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchCategories();
    fetchRates();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesRef = collection(db, 'categories');
      const querySnapshot = await getDocs(categoriesRef);

      const categoriesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(cat => cat.active);

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRates = async () => {
    try {
      const ratesRef = collection(db, 'metalRates');
      const ratesQuery = query(ratesRef, orderBy('effectiveDate', 'desc'));
      const querySnapshot = await getDocs(ratesQuery);

      const ratesData = [];
      for (const docSnap of querySnapshot.docs) {
        const rateData = { id: docSnap.id, ...docSnap.data() };

        // Fetch category name
        if (rateData.categoryId) {
          try {
            const categoryDoc = await getDocs(doc(db, 'categories', rateData.categoryId));
            if (categoryDoc.exists()) {
              rateData.categoryName = categoryDoc.data().categoryName;
            }
          } catch (error) {
            console.error('Error fetching category:', error);
          }
        }

        ratesData.push(rateData);
      }

      setRates(ratesData);
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rateData = {
        ...newRate,
        rate24k: parseFloat(newRate.rate24k),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'metalRates'), rateData);

      setNewRate({
        categoryId: '',
        rate24k: 0,
        effectiveDate: new Date().toISOString().split('T')[0]
      });

      fetchRates();
    } catch (error) {
      console.error('Error adding rate:', error);
      alert('Error adding metal rate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEditRate = (rate) => {
    setEditingRate({
      ...rate,
      rate24k: rate.rate24k || 0,
      effectiveDate: rate.effectiveDate || new Date().toISOString().split('T')[0]
    });
  };

  const saveEditRate = async () => {
    if (!editingRate) return;

    setLoading(true);
    try {
      const rateRef = doc(db, 'metalRates', editingRate.id);
      await updateDoc(rateRef, {
        rate24k: parseFloat(editingRate.rate24k),
        effectiveDate: editingRate.effectiveDate,
        updatedAt: serverTimestamp()
      });

      setEditingRate(null);
      fetchRates();
    } catch (error) {
      console.error('Error updating rate:', error);
      alert('Error updating metal rate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingRate(null);
  };

  const getPurityConversion = (baseRate24k, karat) => {
    const conversions = {
      '24k': 1.0,
      '22k': 0.9167,
      '18k': 0.75,
      '999': 0.999, // Silver
      '925': 0.925, // Silver
      '950': 0.95   // Platinum
    };

    return baseRate24k * (conversions[karat] || 1.0);
  };

  const getCurrentRates = () => {
    const currentRates = {};
    rates.forEach(rate => {
      if (!currentRates[rate.categoryId] || new Date(rate.effectiveDate) > new Date(currentRates[rate.categoryId].effectiveDate)) {
        currentRates[rate.categoryId] = rate;
      }
    });
    return currentRates;
  };

  const currentRates = getCurrentRates();

  if (loading && categories.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Metal Rate Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current Rates Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={24} className="text-green-600" />
            Current Metal Rates (24k)
          </h2>

          <div className="space-y-4">
            {categories.map(category => {
              const currentRate = currentRates[category.id];
              return (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {category.categoryImage && (
                      <img
                        src={category.categoryImage}
                        alt={category.categoryName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium text-gray-900">{category.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹{currentRate ? currentRate.rate24k.toLocaleString() : '0'}/g
                    </div>
                    <div className="text-xs text-gray-500">
                      {currentRate ? new Date(currentRate.effectiveDate).toLocaleDateString() : 'No rate set'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Purity Conversion Calculator */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calculator size={24} className="text-blue-600" />
            Purity Conversion Calculator
          </h2>

          <div className="space-y-4">
            {categories.slice(0, 2).map(category => { // Show first 2 categories as examples
              const currentRate = currentRates[category.id];
              if (!currentRate) return null;

              return (
                <div key={category.id} className="space-y-2">
                  <h3 className="font-medium text-gray-700">{category.categoryName} Conversions</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-yellow-50 p-2 rounded">
                      <div className="font-medium">22k</div>
                      <div className="text-yellow-700">₹{getPurityConversion(currentRate.rate24k, '22k').toLocaleString()}/g</div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded">
                      <div className="font-medium">18k</div>
                      <div className="text-yellow-700">₹{getPurityConversion(currentRate.rate24k, '18k').toLocaleString()}/g</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add New Rate */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Metal Rate</h2>

        <form onSubmit={handleNewRateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metal Category *
            </label>
            <select
              value={newRate.categoryId}
              onChange={(e) => setNewRate(prev => ({ ...prev, categoryId: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate (24k) ₹/gram *
            </label>
            <input
              type="number"
              value={newRate.rate24k}
              onChange={(e) => setNewRate(prev => ({ ...prev, rate24k: parseFloat(e.target.value) || 0 }))}
              required
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter rate"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date *
            </label>
            <input
              type="date"
              value={newRate.effectiveDate}
              onChange={(e) => setNewRate(prev => ({ ...prev, effectiveDate: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Adding...' : 'Add Rate'}
            </button>
          </div>
        </form>
      </div>

      {/* Rate History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History size={24} className="text-gray-600" />
          Rate History
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Metal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate (24k)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Effective Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    {rate.categoryName || 'Unknown'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {editingRate && editingRate.id === rate.id ? (
                      <input
                        type="number"
                        value={editingRate.rate24k}
                        onChange={(e) => setEditingRate(prev => ({ ...prev, rate24k: parseFloat(e.target.value) || 0 }))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
                        min="0"
                        step="100"
                      />
                    ) : (
                      `₹${rate.rate24k?.toLocaleString() || '0'}/g`
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {editingRate && editingRate.id === rate.id ? (
                      <input
                        type="date"
                        value={editingRate.effectiveDate}
                        onChange={(e) => setEditingRate(prev => ({ ...prev, effectiveDate: e.target.value }))}
                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
                      />
                    ) : (
                      new Date(rate.effectiveDate).toLocaleDateString()
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium">
                    {editingRate && editingRate.id === rate.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditRate}
                          className="text-green-600 hover:text-green-900"
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditRate(rate)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
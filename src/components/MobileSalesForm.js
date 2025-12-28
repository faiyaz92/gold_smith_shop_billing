// src/components/MobileSalesForm.js
"use client";

import { useState, useEffect } from 'react';
import OfflineSalesService from '../utils/OfflineSalesService';
import { useVanSeller } from '../context/VanSellerContext';

export default function MobileSalesForm({ onSaleRecorded }) {
  const { vanSellers, getVanSellerById } = useVanSeller();
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ pendingCount: 0, syncInProgress: false });
  const [offlineService, setOfflineService] = useState(null);

  // Get current van seller (this would come from auth context in real app)
  const currentVanSeller = vanSellers[0]; // For demo purposes

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    items: [{ productName: '', quantity: 1, price: 0, discount: 0 }],
    totalAmount: 0,
    paymentMethod: 'cash',
    notes: ''
  });

  // Initialize offline service
  useEffect(() => {
    if (currentVanSeller) {
      const service = new OfflineSalesService('laundry_q8', currentVanSeller.vanSellerId);
      setOfflineService(service);

      // Update sync status periodically
      const updateSyncStatus = async () => {
        const status = service.getSyncStatus();
        const pendingSales = await service.getPendingSales();
        setSyncStatus({
          ...status,
          pendingCount: pendingSales.length
        });
      };

      updateSyncStatus();
      const interval = setInterval(updateSyncStatus, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentVanSeller]);

  // Monitor online status
  useEffect(() => {
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

  // Calculate total amount
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => {
      const itemTotal = (item.quantity * item.price) - item.discount;
      return sum + itemTotal;
    }, 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.items]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, price: 0, discount: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!offlineService) {
      alert('Offline service not initialized');
      return;
    }

    try {
      const saleData = {
        ...formData,
        vanSellerId: currentVanSeller?.vanSellerId,
        vanSellerName: currentVanSeller?.name,
        location: currentVanSeller?.territoryId,
        saleType: 'mobile_sale',
        status: 'completed'
      };

      const saleId = await offlineService.recordOfflineSale(saleData);

      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        items: [{ productName: '', quantity: 1, price: 0, discount: 0 }],
        totalAmount: 0,
        paymentMethod: 'cash',
        notes: ''
      });

      // Notify parent component
      if (onSaleRecorded) {
        onSaleRecorded(saleId, isOnline);
      }

      alert(isOnline ? 'Sale recorded successfully!' : 'Sale saved offline and will sync when online!');

    } catch (error) {
      console.error('Error recording sale:', error);
      alert('Error recording sale. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-4">
      {/* Online/Offline Status */}
      <div className={`mb-4 p-3 rounded-lg ${isOnline ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className={`text-sm font-medium ${isOnline ? 'text-green-800' : 'text-yellow-800'}`}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>
          {!isOnline && syncStatus.pendingCount > 0 && (
            <span className="text-xs text-yellow-600">
              {syncStatus.pendingCount} pending to sync
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Customer Information</h3>

          <input
            type="text"
            placeholder="Customer Name"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.customerPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="text-orange-600 text-sm font-medium hover:text-orange-700"
            >
              + Add Item
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Product Name"
                value={item.productName}
                onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                required
              />

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  min="1"
                  required
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  min="0"
                  step="0.01"
                  required
                />

                <input
                  type="number"
                  placeholder="Discount"
                  value={item.discount}
                  onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Payment Information */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Payment</h3>

          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
            <option value="credit">Credit</option>
          </select>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Amount:</span>
              <span className="text-lg font-bold text-orange-600">
                ₹{formData.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <textarea
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          rows="2"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={syncStatus.syncInProgress}
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {syncStatus.syncInProgress ? 'Syncing...' : (isOnline ? 'Record Sale' : 'Save Offline')}
        </button>
      </form>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Offline Mode:</strong> Your sale will be saved locally and automatically synced when you reconnect to the internet.
          </p>
        </div>
      )}
    </div>
  );
}
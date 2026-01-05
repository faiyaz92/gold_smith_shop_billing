"use client";
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import { X, Calculator, PackageCheck, DollarSign } from 'lucide-react';
import GoldPricePopup from './GoldPricePopup';

export default function SaleForm({ isOpen, onClose, companyId, userRole }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGoldPricePopup, setShowGoldPricePopup] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    weight: '',
    karat: '24k',
    usdAmount: '',
    paymentMethod: 'cash', // 'cash', 'gold', or 'credit'
    description: '',
    goldPriceData: null
  });

  const [errors, setErrors] = useState({});

  // Load customers
  useEffect(() => {
    if (!isOpen || !companyId) return;

    const customersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/customers`;
    const customersQuery = query(collection(db, customersPath), orderBy('name'));
    const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(customersData);
    });

    return () => customersUnsubscribe();
  }, [isOpen, companyId]);

  const handleGoldPriceConfirm = (priceData) => {
    setFormData(prev => ({
      ...prev,
      goldPriceData: priceData,
      usdAmount: priceData.usdAmount.toString()
    }));
    setShowGoldPricePopup(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Please select a customer';
    }

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Please enter valid jewelry weight';
    }

    if (!formData.karat) {
      newErrors.karat = 'Please select karat';
    }

    if (formData.paymentMethod === 'cash' && (!formData.usdAmount || parseFloat(formData.usdAmount) <= 0)) {
      newErrors.usdAmount = 'Please enter valid USD amount for cash payment';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePureGold = (weight, karat) => {
    const purityCoefficient = {
      '24k': 1.0,
      '22k': 0.9166,
      '21k': 0.875,
      '18k': 0.75,
      '14k': 0.5833
    };
    return weight * (purityCoefficient[karat] || 0.75);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const accountingEngine = new AccountingEngine(companyId);
      const salesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/sales`;

      const pureGoldAmount = calculatePureGold(parseFloat(formData.weight), formData.karat);
      const customer = customers.find(c => c.id === formData.customerId);
      const customerAccountCode = customer?.accountCode || `CUST-${formData.customerId.slice(-4).toUpperCase()}`;

      let accountingEntries = [];

      if (formData.paymentMethod === 'cash') {
        // Cash payment - debit cash, credit customer receivable (reverse sale)
        accountingEntries = [
          {
            accountCode: '1201', // Cash
            accountName: 'Cash',
            debit: parseFloat(formData.usdAmount),
            credit: 0,
            balanceType: 'usd'
          },
          {
            accountCode: customerAccountCode,
            accountName: `${customer?.name || 'Customer'} - Receivable`,
            debit: 0,
            credit: pureGoldAmount,
            balanceType: 'gold'
          }
        ];
      } else if (formData.paymentMethod === 'gold') {
        // Gold payment - debit gold in hand, credit customer receivable
        accountingEntries = [
          {
            accountCode: '1104', // Gold in Hand
            accountName: 'Gold in Hand',
            debit: pureGoldAmount,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: customerAccountCode,
            accountName: `${customer?.name || 'Customer'} - Receivable`,
            debit: 0,
            credit: pureGoldAmount,
            balanceType: 'gold'
          }
        ];
      } else {
        // Credit sale - debit customer receivable, credit finished goods (no cash movement)
        accountingEntries = [
          {
            accountCode: customerAccountCode,
            accountName: `${customer?.name || 'Customer'} - Receivable`,
            debit: pureGoldAmount,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: '1103', // Finished Goods Inventory
            accountName: 'Finished Goods Inventory',
            debit: 0,
            credit: pureGoldAmount,
            balanceType: 'gold'
          }
        ];
      }

      // Create sale record
      const saleData = {
        customerId: formData.customerId,
        customerName: customer?.name || 'Unknown',
        customerAccountCode,
        weight: parseFloat(formData.weight),
        karat: formData.karat,
        pureGoldAmount,
        usdAmount: formData.paymentMethod === 'cash' ? parseFloat(formData.usdAmount) : 0,
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        goldPriceData: formData.goldPriceData,
        status: 'completed',
        createdAt: serverTimestamp(),
        createdBy: userRole,
        accountingRecorded: false
      };

      const saleRef = await addDoc(collection(db, salesPath), saleData);

      // Record accounting entry
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Sale to ${saleData.customerName}: ${formData.description}`,
        transactionType: 'sale',
        referenceId: saleRef.id,
        referenceType: 'sale',
        entries: accountingEntries
      });

      alert('✅ Sale recorded successfully!');
      onClose();

      // Reset form
      setFormData({
        customerId: '',
        weight: '',
        karat: '24k',
        usdAmount: '',
        paymentMethod: 'cash',
        description: '',
        goldPriceData: null
      });
      setErrors({});

    } catch (error) {
      console.error('Error recording sale:', error);
      alert('❌ Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-teal-600" />
              Sale Invoice
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || customer.customerName}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
              )}
            </div>

            {/* Weight and Karat */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jewelry Weight (g) *
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Enter weight in grams"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  step="0.001"
                  min="0"
                />
                {errors.weight && (
                  <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Karat *
                </label>
                <select
                  value={formData.karat}
                  onChange={(e) => setFormData(prev => ({ ...prev, karat: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    errors.karat ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="24k">24k (99.9%)</option>
                  <option value="22k">22k (91.6%)</option>
                  <option value="21k">21k (87.5%)</option>
                  <option value="18k">18k (75%)</option>
                  <option value="14k">14k (58.3%)</option>
                </select>
                {errors.karat && (
                  <p className="text-red-500 text-xs mt-1">{errors.karat}</p>
                )}
              </div>
            </div>

            {/* Pure Gold Calculation Display */}
            {formData.weight && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>Pure Gold Equivalent:</span>
                  <span className="font-semibold">
                    {calculatePureGold(parseFloat(formData.weight), formData.karat).toFixed(4)}g
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="mr-2"
                  />
                  Cash (USD)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="gold"
                    checked={formData.paymentMethod === 'gold'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="mr-2"
                  />
                  Gold
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="credit"
                    checked={formData.paymentMethod === 'credit'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="mr-2"
                  />
                  Credit (Udhar)
                </label>
              </div>
            </div>

            {/* USD Amount (for cash payments) */}
            {formData.paymentMethod === 'cash' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    USD Amount *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGoldPricePopup(true)}
                    className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                  >
                    <Calculator className="w-4 h-4" />
                    Calculate from Gold
                  </button>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={formData.usdAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, usdAmount: e.target.value }))}
                    placeholder="Enter USD amount"
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      errors.usdAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    step="0.01"
                    min="0"
                  />
                </div>
                {errors.usdAmount && (
                  <p className="text-red-500 text-xs mt-1">{errors.usdAmount}</p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter sale description"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recording...' : 'Record Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Gold Price Popup */}
      <GoldPricePopup
        isOpen={showGoldPricePopup}
        onClose={() => setShowGoldPricePopup(false)}
        onPriceConfirm={handleGoldPriceConfirm}
        initialAmount={parseFloat(formData.usdAmount) || 0}
        amountType="usd"
      />
    </>
  );
}
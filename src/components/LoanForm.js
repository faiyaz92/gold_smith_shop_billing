"use client";
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import { LoanEngine } from '@/utils/loanEngine';
import { X, Calculator, IndianRupee, DollarSign } from 'lucide-react';
import GoldPricePopup from './GoldPricePopup';

export default function LoanForm({ isOpen, onClose, companyId, userRole }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGoldPricePopup, setShowGoldPricePopup] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    usdAmount: '',
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

    if (!formData.usdAmount || parseFloat(formData.usdAmount) <= 0) {
      newErrors.usdAmount = 'Please enter valid USD amount';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter loan description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const customer = customers.find(c => c.id === formData.customerId);
      const loanEngine = new LoanEngine(companyId);

      // Record the cash loan - this will convert USD to gold grams and update accounting
      const loanResult = await loanEngine.recordCashLoan({
        customerId: formData.customerId,
        customerName: customer?.name || 'Unknown',
        usdAmount: parseFloat(formData.usdAmount),
        description: formData.description,
        goldPriceData: formData.goldPriceData,
        createdBy: userRole
      });

      alert(`✅ Loan recorded successfully!\n\nCustomer: ${customer?.name || 'Unknown'}\nAmount: $${formData.usdAmount}\nGold Equivalent: ${loanResult.goldGrams?.toFixed(4)}g`);
      onClose();

      // Reset form
      setFormData({
        customerId: '',
        usdAmount: '',
        description: '',
        goldPriceData: null
      });
      setErrors({});

    } catch (error) {
      console.error('Error recording loan:', error);
      alert('❌ Failed to record loan. Please try again.');
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
              <IndianRupee className="w-5 h-5 text-orange-600" />
              Loan to Customer
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
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

            {/* USD Amount with Calculator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Loan Amount (USD) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowGoldPricePopup(true)}
                  className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
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
                  placeholder="Enter loan amount in USD"
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
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

            {/* Gold Equivalent Display */}
            {formData.goldPriceData && formData.usdAmount && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-sm text-orange-800">
                  <div className="flex justify-between">
                    <span>Gold Equivalent:</span>
                    <span className="font-semibold">{formData.goldPriceData.goldGrams?.toFixed(4)}g pure gold</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Price per gram:</span>
                    <span className="font-semibold">${formData.goldPriceData.pricePerGram?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter loan details (purpose, terms, etc.)"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Cash loan amount is converted to equivalent pure gold grams</li>
                <li>• Customer&apos;s receivable account increases by the gold equivalent</li>
                <li>• Cash account decreases by the loan amount</li>
                <li>• Customer can repay with gold or USD (converted back)</li>
              </ul>
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
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recording...' : 'Record Loan'}
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
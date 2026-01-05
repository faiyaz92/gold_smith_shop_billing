"use client";
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import { X, Calculator, DollarSign, CreditCard } from 'lucide-react';
import GoldPricePopup from './GoldPricePopup';

export default function ReceivePaymentForm({ isOpen, onClose, companyId, userRole }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGoldPricePopup, setShowGoldPricePopup] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    paymentAmount: '',
    paymentMethod: 'cash', // cash, bank_transfer, check
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

    return () => {
      customersUnsubscribe();
    };
  }, [isOpen, companyId]);

  const handleGoldPriceConfirm = (priceData) => {
    setFormData(prev => ({
      ...prev,
      goldPriceData: priceData,
      paymentAmount: priceData.usdAmount.toString()
    }));
    setShowGoldPricePopup(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Please select a customer';
    }

    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      newErrors.paymentAmount = 'Please enter valid payment amount';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select payment method';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter payment description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const accountingEngine = new AccountingEngine(companyId);
      const paymentsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/payments`;

      const selectedCustomer = customers.find(c => c.id === formData.customerId);

      // Generate payment reference number
      const paymentsSnapshot = await onSnapshot(query(collection(db, paymentsPath), orderBy('createdAt', 'desc'), limit(1)), () => {});
      let paymentNumber = 'PAY-001-' + new Date().getFullYear();
      // Note: In a real implementation, you'd get the actual snapshot data

      // Create payment record
      const paymentData = {
        paymentNumber,
        paymentType: 'customer_payment',
        customerId: formData.customerId,
        customerName: selectedCustomer?.name || 'Unknown',
        paymentAmount: parseFloat(formData.paymentAmount),
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        status: 'received',
        receivedDate: serverTimestamp(),
        accountingRecorded: false,
        goldPriceData: formData.goldPriceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId,
        createdBy: userRole
      };

      const paymentRef = await addDoc(collection(db, paymentsPath), paymentData);

      // Create accounting entry: Debit Cash/Bank, Credit Customer Receivables
      const customerAccountCode = selectedCustomer?.accountCode || `CUST-${formData.customerId.slice(-4).toUpperCase()}`;

      await accountingEngine.createEntry({
        date: new Date(),
        description: `Payment received from ${selectedCustomer?.name} - ${formData.description}`,
        transactionType: 'customer_payment',
        referenceId: paymentRef.id,
        referenceType: 'payment',
        entries: [
          {
            accountCode: formData.paymentMethod === 'cash' ? '1201' : '1202', // Cash or Bank
            accountName: formData.paymentMethod === 'cash' ? 'Cash' : 'Bank Account',
            debit: parseFloat(formData.paymentAmount),
            credit: 0,
            balanceType: 'usd'
          },
          {
            accountCode: customerAccountCode,
            accountName: `${selectedCustomer?.name} - Receivables`,
            debit: 0,
            credit: parseFloat(formData.paymentAmount),
            balanceType: 'usd'
          }
        ]
      });

      // Update payment with accounting status
      await updateDoc(paymentRef, {
        accountingRecorded: true,
        updatedAt: serverTimestamp()
      });

      alert(`✅ Payment received successfully!\n\nPayment: ${paymentNumber}\nAmount: $${formData.paymentAmount}\nFrom: ${selectedCustomer?.name}`);
      onClose();

      // Reset form
      setFormData({
        customerId: '',
        paymentAmount: '',
        paymentMethod: 'cash',
        description: '',
        goldPriceData: null
      });
      setErrors({});

    } catch (error) {
      console.error('Error recording payment:', error);
      alert('❌ Failed to record payment. Please try again.');
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
              <CreditCard className="w-5 h-5 text-green-600" />
              Receive Payment from Customer
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <div className="px-6 py-3 bg-green-50 border-b">
            <p className="text-sm text-green-800">
              Record customer payments against outstanding receivables. Payments can be in USD or converted from gold.
            </p>
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
              )}
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount (USD) *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                  placeholder="Enter payment amount"
                  step="0.01"
                  min="0"
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.paymentAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowGoldPricePopup(true)}
                  className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md flex items-center gap-1"
                >
                  <Calculator className="w-4 h-4" />
                  Convert
                </button>
              </div>
              {errors.paymentAmount && (
                <p className="text-red-500 text-xs mt-1">{errors.paymentAmount}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="card">Credit/Debit Card</option>
              </select>
              {errors.paymentMethod && (
                <p className="text-red-500 text-xs mt-1">{errors.paymentMethod}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter payment description (e.g., Payment for Invoice #123)"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recording...' : 'Record Payment'}
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
        initialAmount={parseFloat(formData.paymentAmount) || 0}
        amountType="usd"
      />
    </>
  );
}
"use client";
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import { X, Calculator, DollarSign, CreditCard, Building } from 'lucide-react';

export default function PayManufacturerForm({ isOpen, onClose, companyId, userRole }) {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    manufacturerId: '',
    paymentAmount: '',
    paymentMethod: 'cash', // cash, bank_transfer, check
    description: '',
    manufacturerData: null
  });

  const [errors, setErrors] = useState({});

  // Load manufacturers
  useEffect(() => {
    if (!isOpen || !companyId) return;

    const manufacturersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`;
    const manufacturersQuery = query(collection(db, manufacturersPath), orderBy('name'));
    const manufacturersUnsubscribe = onSnapshot(manufacturersQuery, (snapshot) => {
      const manufacturersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setManufacturers(manufacturersData);
    });

    return () => {
      manufacturersUnsubscribe();
    };
  }, [isOpen, companyId]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.manufacturerId) {
      newErrors.manufacturerId = 'Please select a manufacturer';
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

      const selectedManufacturer = manufacturers.find(m => m.id === formData.manufacturerId);

      // Generate payment reference number
      const paymentsSnapshot = await onSnapshot(query(collection(db, paymentsPath), orderBy('createdAt', 'desc'), limit(1)), () => {});
      let paymentNumber = 'PAY-M-' + new Date().getFullYear();
      // Note: In a real implementation, you'd get the actual snapshot data

      // Create payment record
      const paymentData = {
        paymentNumber,
        paymentType: 'manufacturer_payment',
        manufacturerId: formData.manufacturerId,
        manufacturerName: selectedManufacturer?.name || 'Unknown',
        paymentAmount: parseFloat(formData.paymentAmount),
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        status: 'paid',
        paidDate: serverTimestamp(),
        accountingRecorded: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId,
        createdBy: userRole
      };

      const paymentRef = await addDoc(collection(db, paymentsPath), paymentData);

      // Create accounting entry: Debit Manufacturer Payables, Credit Cash/Bank
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Payment made to ${selectedManufacturer?.name} - ${formData.description}`,
        transactionType: 'manufacturer_payment',
        referenceId: paymentRef.id,
        referenceType: 'payment',
        entries: [
          {
            accountCode: '2101', // Manufacturer Payables
            accountName: 'Manufacturer Payables',
            debit: parseFloat(formData.paymentAmount),
            credit: 0,
            balanceType: 'usd'
          },
          {
            accountCode: formData.paymentMethod === 'cash' ? '1201' : '1202', // Cash or Bank
            accountName: formData.paymentMethod === 'cash' ? 'Cash' : 'Bank Account',
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

      // Update manufacturer balance
      const manufacturerRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`, formData.manufacturerId);
      const currentBalance = selectedManufacturer?.currentBalanceUSD || 0;
      const newBalance = Math.max(0, currentBalance - parseFloat(formData.paymentAmount));

      await updateDoc(manufacturerRef, {
        currentBalanceUSD: newBalance,
        lastPaymentDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      alert(`✅ Payment made successfully!\n\nPayment: ${paymentNumber}\nAmount: $${formData.paymentAmount}\nTo: ${selectedManufacturer?.name}`);
      onClose();

      // Reset form
      setFormData({
        manufacturerId: '',
        paymentAmount: '',
        paymentMethod: 'cash',
        description: '',
        manufacturerData: null
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Pay Manufacturer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-3 bg-blue-50 border-b">
          <p className="text-sm text-blue-800">
            Pay outstanding amounts to manufacturers for purchases made on credit.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Manufacturer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer *
            </label>
            <select
              value={formData.manufacturerId}
              onChange={(e) => {
                const selectedManufacturer = manufacturers.find(m => m.id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  manufacturerId: e.target.value,
                  manufacturerData: selectedManufacturer,
                  description: selectedManufacturer ? `Payment to ${selectedManufacturer.name}` : ''
                }));
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.manufacturerId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Manufacturer</option>
              {manufacturers
                .filter(m => (m.currentBalanceUSD || 0) > 0)
                .map(manufacturer => (
                <option key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.name} {manufacturer.phone ? `(${manufacturer.phone})` : ''}
                  {manufacturer.currentBalanceUSD ? ` - Balance: $${manufacturer.currentBalanceUSD.toFixed(2)}` : ''}
                </option>
              ))}
            </select>
            {errors.manufacturerId && (
              <p className="text-red-500 text-xs mt-1">{errors.manufacturerId}</p>
            )}
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount (USD) *
            </label>
            <input
              type="number"
              value={formData.paymentAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
              placeholder="Enter payment amount"
              step="0.01"
              min="0"
              max={formData.manufacturerData?.currentBalanceUSD || undefined}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.paymentAmount ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formData.manufacturerData && (
              <p className="text-sm text-gray-600 mt-1">
                Outstanding balance: ${formData.manufacturerData.currentBalanceUSD?.toFixed(2) || '0.00'}
              </p>
            )}
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
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
              placeholder="Payment description"
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay Manufacturer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
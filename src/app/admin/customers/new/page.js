'use client';

// ✅ TASK 3.1 UPGRADED: Customer Creation Form (Pure Gold Balance - BRD v2)
// Reference: BRD_GoldSmith_v2.md Section 6.6, DatabaseInfo_GoldSmith_v2.md Section 4
// Auto-creates customer account with 1301-CUST-XXX code

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useRouter } from 'next/navigation';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;
  
  // Validation constants
  const MAX_CREDIT_LIMIT_GOLD = 10000; // 10kg max
  const MAX_CREDIT_LIMIT_USD = 1500000; // $1.5M max
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    shopName: '',
    address: '',
    email: '',
    gstNumber: '',
    creditLimitGold: 0,
    creditLimitUSD: 0,
    paymentTerms: 'immediate',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'creditLimitGold') {
      const goldGrams = parseFloat(value) || 0;
      
      // Validate
      const newErrors = { ...errors };
      if (goldGrams < 0) {
        newErrors.creditLimitGold = 'Credit limit cannot be negative';
      } else if (goldGrams > MAX_CREDIT_LIMIT_GOLD) {
        newErrors.creditLimitGold = `Maximum credit limit is ${MAX_CREDIT_LIMIT_GOLD}g (${MAX_CREDIT_LIMIT_GOLD/1000}kg)`;
      } else {
        delete newErrors.creditLimitGold;
      }
      setErrors(newErrors);
      
      const goldPricePerGram = 145.43; // TODO: Fetch from goldPriceHistory
      setFormData(prev => ({
        ...prev,
        creditLimitGold: goldGrams,
        creditLimitUSD: goldGrams * goldPricePerGram
      }));
    } else if (name === 'creditLimitUSD') {
      const usdAmount = parseFloat(value) || 0;
      
      // Validate
      const newErrors = { ...errors };
      if (usdAmount < 0) {
        newErrors.creditLimitUSD = 'Credit limit cannot be negative';
      } else if (usdAmount > MAX_CREDIT_LIMIT_USD) {
        newErrors.creditLimitUSD = `Maximum credit limit is $${MAX_CREDIT_LIMIT_USD.toLocaleString()}`;
      } else {
        delete newErrors.creditLimitUSD;
      }
      setErrors(newErrors);
      
      const goldPricePerGram = 145.43;
      setFormData(prev => ({
        ...prev,
        creditLimitUSD: usdAmount,
        creditLimitGold: usdAmount / goldPricePerGram
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generateCustomerCode = async () => {
    try {
      const customersRef = collection(db, `${basePath}/customers`);
      const querySnapshot = await getDocs(customersRef);

      // Find the highest customer code number
      let maxNumber = 0;
      querySnapshot.forEach((doc) => {
        const customerCode = doc.data().customerCode;
        if (customerCode && customerCode.startsWith('1301-CUST-')) {
          const number = parseInt(customerCode.replace('1301-CUST-', ''));
          if (number > maxNumber) maxNumber = number;
        }
      });

      // Format: 1301-CUST-XXX (1301 = Accounts Receivable parent code)
      return `1301-CUST-${String(maxNumber + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating customer code:', error);
      // Fallback to timestamp-based code
      return `1301-CUST-${Date.now().toString().slice(-6)}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      alert('Please fix validation errors before submitting');
      return;
    }
    
    setLoading(true);

    try {
      const customerCode = await generateCustomerCode();

      const customerData = {
        ...formData,
        customerCode,
        isActive: true,
        currentPureGoldBalance: 0,           // v2: Pure gold balance in grams
        totalPureGoldOrdered: 0,             // v2: Lifetime ordered (grams)
        totalPureGoldPaid: 0,                // v2: Lifetime paid (grams)
        availableCreditGold: formData.creditLimitGold || 0,
        transactions: [],                     // v2: Transaction history array
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId
      };

      const docRef = await addDoc(collection(db, `${basePath}/customers`), customerData);

      // ✅ Auto-create accounting receivable sub-account using CENTRALIZED method
      const accountManager = new HierarchicalAccountManager(companyId);
      const accountResult = await accountManager.createCustomerAccount({
        customerId: docRef.id, // Use the actual customer document ID
        customerName: formData.customerName
      });

      if (!accountResult.success) {
        console.error('Failed to create customer account:', accountResult.message);
        // Don't fail the entire operation, just log the error
        // Customer is created, account creation failed
      } else {
        // ✅ Store account relationship in customer document (like manufacturers/gold banks)
        await updateDoc(docRef, {
          accountCode: accountResult.account.accountCode,
          accountId: accountResult.account.accountId
        });
      }

      alert('✅ Customer and account created successfully!');
      router.push('/admin/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error creating customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/customers"
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Customer</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                name="customerName"
                required
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Name
              </label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter shop name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter complete address"
            />
          </div>

          {/* Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter GST number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Limit (Pure Gold - g)
              </label>
              <input
                type="number"
                name="creditLimitGold"
                value={formData.creditLimitGold}
                onChange={handleInputChange}
                min="0"
                step="any"
                className={`w-full px-3 py-2 border ${errors.creditLimitGold ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                placeholder="Enter credit limit in grams"
              />
              {errors.creditLimitGold && (
                <p className="text-xs text-red-600 mt-1">⚠️ {errors.creditLimitGold}</p>
              )}
              {formData.creditLimitGold > 0 && !errors.creditLimitGold && (
                <p className="text-xs text-gray-500 mt-1">
                  USD Reference: ${formData.creditLimitUSD.toFixed(2)} @ $145.43/g
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Limit (USD Reference)
              </label>
              <input
                type="number"
                name="creditLimitUSD"
                value={formData.creditLimitUSD}
                onChange={handleInputChange}
                min="0"
                step="any"
                className={`w-full px-3 py-2 border ${errors.creditLimitUSD ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                placeholder="Enter credit limit in USD"
              />
              {errors.creditLimitUSD && (
                <p className="text-xs text-red-600 mt-1">⚠️ {errors.creditLimitUSD}</p>
              )}
              {formData.creditLimitUSD > 0 && !errors.creditLimitUSD && (
                <p className="text-xs text-gray-500 mt-1">
                  Gold Equivalent: {formData.creditLimitGold.toFixed(3)}g
                </p>
              )}
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Terms
            </label>
            <select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleInputChange}
              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="immediate">Immediate Payment</option>
              <option value="7days">7 Days Credit</option>
              <option value="15days">15 Days Credit</option>
              <option value="30days">30 Days Credit</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Any additional notes about the customer"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/customers"
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
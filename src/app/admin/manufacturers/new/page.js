'use client';

// ✅ TASK 4.1 UPGRADED: Manufacturer Creation Form (USD Balance - BRD v2)
// Reference: BRD_GoldSmith_v2.md Section 7.0, DatabaseInfo_GoldSmith_v2.md Section 5B
// Manufacturers paid in USD for making charges only

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useRouter } from 'next/navigation';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewManufacturerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;
  
  const [formData, setFormData] = useState({
    manufacturerName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    specialization: '',
    gstNumber: '',
    makingChargeRateUSD: 0,
    paymentTerms: '15days',
    creditLimitUSD: 0,
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'creditLimitUSD' || name === 'makingChargeRateUSD') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const generateManufacturerCode = async () => {
    try {
      const manufacturersRef = collection(db, `${basePath}/manufacturers`);
      const querySnapshot = await getDocs(manufacturersRef);

      // Find the highest manufacturer code number
      let maxNumber = 0;
      querySnapshot.forEach((doc) => {
        const manufacturerCode = doc.data().manufacturerCode;
        if (manufacturerCode && manufacturerCode.startsWith('2101-MFG-')) {
          const number = parseInt(manufacturerCode.replace('2101-MFG-', ''));
          if (number > maxNumber) maxNumber = number;
        }
      });

      // Format: 2101-MFG-XXX (2101 = Manufacturer Payables parent code)
      return `2101-MFG-${String(maxNumber + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating manufacturer code:', error);
      // Fallback to timestamp-based code
      return `2101-MFG-${Date.now().toString().slice(-6)}`;
    }
  };

  const checkRequiredAccounts = async () => {
    try {
      const accountManager = new HierarchicalAccountManager(companyId);
      
      // Check if required GoldSmith parent accounts exist
      const manufacturerPayablesAccount = await accountManager.getAccountByCode('2101');
      const goldTransitAccount = await accountManager.getAccountByCode('1102');

      if (!manufacturerPayablesAccount || !goldTransitAccount) {
        throw new Error('Required GoldSmith accounts (2101 Manufacturer Payables, 1102 Gold in Transit) not found. Please initialize accounts from the Accounting page first.');
      }
      return true;
    } catch (error) {
      console.error('Error checking required accounts:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const manufacturerCode = await generateManufacturerCode();

      const manufacturerData = {
        ...formData,
        manufacturerCode,
        isActive: true,
        currentBalanceUSD: 0,              // v2: USD balance (making charges)
        totalMakingChargesUSD: 0,          // v2: Lifetime making charges
        totalPaidUSD: 0,                   // v2: Lifetime payments
        goldInTransit: 0,                  // v2: Gold grams with manufacturer
        transactions: [],                  // v2: Transaction history
        completedOrders: 0,
        avgDeliveryDays: 0,
        qualityRating: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId
      };

      const docRef = await addDoc(collection(db, `${basePath}/manufacturers`), manufacturerData);

      // ✅ Check required parent accounts exist
      await checkRequiredAccounts();

      // ✅ Use centralized account creation method for payables
      const accountManager = new HierarchicalAccountManager(companyId);
      const accountResult = await accountManager.createManufacturerAccount({
        manufacturerId: docRef.id,
        manufacturerName: formData.manufacturerName
      });

      if (!accountResult.success) {
        throw new Error(`Failed to create payables account: ${accountResult.message}`);
      }

      // ✅ Create gold transit account for this manufacturer
      const goldTransitAccountResult = await accountManager.createManufacturerGoldTransitAccount({
        manufacturerId: docRef.id,
        manufacturerName: formData.manufacturerName
      });

      if (!goldTransitAccountResult.success) {
        throw new Error(`Failed to create gold transit account: ${goldTransitAccountResult.message}`);
      }

      // Update manufacturer document with both account codes
      await updateDoc(docRef, {
        accountCode: accountResult.account.accountCode,
        accountId: accountResult.account.id,
        goldTransitAccountCode: goldTransitAccountResult.account.accountCode,
        goldTransitAccountId: goldTransitAccountResult.account.id
      });

      alert('✅ Manufacturer and account created successfully!');
      router.push('/admin/manufacturers');
    } catch (error) {
      console.error('Error creating manufacturer:', error);
      alert('Error creating manufacturer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/manufacturers"
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Add New Manufacturer</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer Name *
              </label>
              <input
                type="text"
                name="manufacturerName"
                required
                value={formData.manufacturerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter manufacturer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter contact person name"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select specialization</option>
                <option value="Gold Jewelry">Gold Jewelry</option>
                <option value="Silver Jewelry">Silver Jewelry</option>
                <option value="Diamond Setting">Diamond Setting</option>
                <option value="Platinum Jewelry">Platinum Jewelry</option>
                <option value="Casting">Casting</option>
                <option value="Polishing">Polishing</option>
                <option value="General">General</option>
              </select>
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
                Making Charge Rate (USD/gram)
              </label>
              <input
                type="number"
                name="makingChargeRateUSD"
                value={formData.makingChargeRateUSD}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter making charge rate per gram"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Limit (USD)
              </label>
              <input
                type="number"
                name="creditLimitUSD"
                value={formData.creditLimitUSD}
                onChange={handleInputChange}
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter credit limit in USD"
              />
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
              <option value="45days">45 Days Credit</option>
              <option value="60days">60 Days Credit</option>
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
              placeholder="Any additional notes about the manufacturer"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/manufacturers"
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
              {loading ? 'Creating...' : 'Create Manufacturer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
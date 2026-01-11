"use client";
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, getDocs, limit } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';
import { X, Calculator, Truck, DollarSign } from 'lucide-react';
import GoldPricePopup from './GoldPricePopup';

export default function QuickChallanForm({ isOpen, onClose, companyId, userRole }) {
  const [manufacturers, setManufacturers] = useState([]);
  const [goldBanks, setGoldBanks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGoldPricePopup, setShowGoldPricePopup] = useState(false);

  const [formData, setFormData] = useState({
    orderId: '',
    customerId: '',
    manufacturerId: '',
    goldBankId: '',
    weight: '',
    karat: '24k',
    usdAmount: '',
    description: '',
    goldPriceData: null
  });

  const [errors, setErrors] = useState({});

  // Load data
  useEffect(() => {
    if (!isOpen || !companyId) return;

    const manufacturersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`;
    const manufacturersQuery = query(collection(db, manufacturersPath), orderBy('manufacturerName'));
    const manufacturersUnsubscribe = onSnapshot(manufacturersQuery, (snapshot) => {
      const manufacturersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setManufacturers(manufacturersData);
    });

    const goldBanksPath = `goldBanks`; // ✅ FIXED: Root level collection
    const goldBanksQuery = query(collection(db, goldBanksPath), orderBy('bankName'));
    const goldBanksUnsubscribe = onSnapshot(goldBanksQuery, (snapshot) => {
      const goldBanksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoldBanks(goldBanksData);
    });

    const ordersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`;
    const ordersQuery = query(collection(db, ordersPath), orderBy('createdAt', 'desc'));
    const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(order => order.status !== 'Completed' && order.status !== 'Cancelled');
      setOrders(ordersData);
    });

    const customersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/customers`;
    const customersQuery = query(collection(db, customersPath), orderBy('customerName'));
    const customersUnsubscribe = onSnapshot(customersQuery, async (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch account balances for customers
      const accountManager = new HierarchicalAccountManager(companyId);
      const customersWithBalances = await Promise.all(
        customersData.map(async (customer) => {
          try {
            let balance = 0;

            // Method 1: Use accountCode from customer document if available
            if (customer.accountCode) {
              const account = await accountManager.getAccountByCode(customer.accountCode);
              balance = account ? (account.currentBalanceGold || account.currentBalance || 0) : 0;
            } else {
              // Method 2: Fallback - find account by customerId
              const allAccounts = await accountManager.getAllAccounts();
              const customerAccount = allAccounts.find(account => 
                account.customerId === customer.id && account.accountCode?.startsWith('CUST-')
              );
              balance = customerAccount ? 
                (customerAccount.currentBalanceGold || customerAccount.currentBalance || 0) : 0;
            }

            return {
              ...customer,
              accountBalance: balance
            };
          } catch (error) {
            console.error(`Error fetching balance for customer ${customer.id}:`, error);
            return {
              ...customer,
              accountBalance: 0
            };
          }
        })
      );

      setCustomers(customersWithBalances);
    });

    return () => {
      manufacturersUnsubscribe();
      goldBanksUnsubscribe();
      ordersUnsubscribe();
      customersUnsubscribe();
    };
  }, [isOpen, companyId]);

  // Auto-fill form when order is selected
  useEffect(() => {
    if (formData.orderId) {
      const selectedOrder = orders.find(o => o.id === formData.orderId);
      if (selectedOrder) {
        setFormData(prev => ({
          ...prev,
          customerId: selectedOrder.customerId || '',
          manufacturerId: selectedOrder.manufacturerId || '',
          weight: selectedOrder.weight?.toString() || '',
          karat: selectedOrder.karat || '24k',
          description: `Gold challan for Order ${selectedOrder.id.slice(-8)} - ${selectedOrder.productName || 'Jewelry'}`
        }));
      }
    }
  }, [formData.orderId, orders]);

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

    // Order is now optional - if no order selected, customer becomes required
    if (!formData.orderId && !formData.customerId) {
      newErrors.customerId = 'Please select a customer/party when no order is selected';
    }

    if (!formData.manufacturerId) {
      newErrors.manufacturerId = 'Please select a manufacturer';
    }

    if (!formData.goldBankId) {
      newErrors.goldBankId = 'Please select a gold bank';
    }

    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Please enter valid weight';
    }

    if (!formData.karat) {
      newErrors.karat = 'Please select karat';
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
      const challansPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/challans`;

      const selectedOrder = orders.find(o => o.id === formData.orderId);
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      const manufacturer = manufacturers.find(m => m.id === formData.manufacturerId);
      const goldBank = goldBanks.find(b => b.id === formData.goldBankId);

      const pureGoldAmount = calculatePureGold(parseFloat(formData.weight), formData.karat);

      // Generate challan number
      const challansSnapshot = await getDocs(query(collection(db, challansPath), orderBy('createdAt', 'desc'), limit(1)));
      let challanNumber = 'CH-Q-001-' + new Date().getFullYear();
      if (!challansSnapshot.empty) {
        const lastChallan = challansSnapshot.docs[0].data();
        const lastNumber = parseInt(lastChallan.challanNumber.split('-')[2]) || 0;
        challanNumber = `CH-Q-${String(lastNumber + 1).padStart(3, '0')}-${new Date().getFullYear()}`;
      }

      // Create challan document
      const challanData = {
        challanNumber,
        challanType: 'gold_withdrawal',
        orderId: formData.orderId || null, // Optional now
        customerId: selectedOrder?.customerId || formData.customerId || '',
        customerName: selectedOrder?.customerName || selectedCustomer?.name || 'Unknown',
        manufacturerId: formData.manufacturerId,
        manufacturerName: manufacturer?.manufacturerName || 'Unknown',
        pureGoldAmount,
        weight: parseFloat(formData.weight),
        karat: formData.karat,
        purpose: formData.description,
        status: 'issued',
        issuedDate: serverTimestamp(),
        accountingRecorded: false,
        sharafReleaseConfirmation: false,
        goldBankId: formData.goldBankId,
        goldBankName: goldBank?.bankName || 'Unknown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId,
        createdBy: userRole
      };

      const challanRef = await addDoc(collection(db, challansPath), challanData);

      // ✅ ACCOUNT CODE AUDIT: Ensure manufacturer has gold transit account code
      let goldTransitAccountCode = manufacturer?.goldTransitAccountCode;
      if (!goldTransitAccountCode) {
        // Create manufacturer gold transit account if missing
        const accountManager = new HierarchicalAccountManager(companyId);
        const goldTransitAccountResult = await accountManager.createManufacturerGoldTransitAccount({
          manufacturerId: manufacturer.id,
          manufacturerName: manufacturer.manufacturerName || manufacturer.name
        });
        if (!goldTransitAccountResult.success) {
          throw new Error(`Failed to create gold transit account: ${goldTransitAccountResult.message}`);
        }
        goldTransitAccountCode = goldTransitAccountResult.account.accountCode;
        // Update manufacturer document with new account code
        await updateDoc(doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`, manufacturer.id), {
          goldTransitAccountCode: goldTransitAccountCode,
          updatedAt: serverTimestamp()
        });
        // Update local data
        manufacturer.goldTransitAccountCode = goldTransitAccountCode;
      }

      // ✅ ACCOUNT CODE AUDIT: Ensure gold bank has account code
      let goldBankAccountCode = goldBank?.accountCode;
      if (!goldBankAccountCode) {
        // Create gold bank account if missing
        const accountManager = new HierarchicalAccountManager(companyId);
        const goldBankAccountResult = await accountManager.createGoldBankAccount({
          goldBankId: goldBank.id,
          bankName: goldBank.bankName,
          location: goldBank.location
        });
        if (!goldBankAccountResult.success) {
          throw new Error(`Failed to create gold bank account: ${goldBankAccountResult.message}`);
        }
        goldBankAccountCode = goldBankAccountResult.account.accountCode;
        // Update gold bank document with new account code
        await updateDoc(doc(db, `goldBanks`, goldBank.id), { // ✅ FIXED: Root level collection
          accountCode: goldBankAccountCode,
          updatedAt: serverTimestamp()
        });
        // Update local data
        goldBank.accountCode = goldBankAccountCode;
      }

      // Create accounting entry: Debit Gold in Transit, Credit Gold Bank
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Gold withdrawal challan ${challanNumber} issued for Order ${formData.orderId.slice(-8)}`,
        transactionType: 'gold_challan_issued',
        referenceId: challanRef.id,
        referenceType: 'challan',
        entries: [
          {
            accountCode: goldTransitAccountCode, // ✅ FIXED: Use specific manufacturer gold transit account
            accountName: `${manufacturer?.manufacturerName} - Gold in Transit`,
            debit: pureGoldAmount,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: goldBankAccountCode, // ✅ FIXED: Use specific gold bank account
            accountName: `${goldBank?.bankName} - Gold Custody`,
            debit: 0,
            credit: pureGoldAmount,
            balanceType: 'gold'
          }
        ]
      });

      // Update challan with accounting status
      // Update manufacturer's goldInTransit
      try {
        const manufacturerRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`, formData.manufacturerId);
        const manufacturerSnap = await getDoc(manufacturerRef);
        if (manufacturerSnap.exists()) {
          const currentGoldInTransit = manufacturerSnap.data().goldInTransit || 0;
          await updateDoc(manufacturerRef, {
            goldInTransit: currentGoldInTransit + pureGoldAmount,
            updatedAt: serverTimestamp()
          });
        }
      } catch (mfgError) {
        console.error('Error updating manufacturer goldInTransit:', mfgError);
      }

      alert(`✅ Challan issued successfully!\n\nChallan: ${challanNumber}\nGold: ${pureGoldAmount.toFixed(4)}g pure gold`);
      onClose();

      // Reset form
      setFormData({
        orderId: '',
        customerId: '',
        manufacturerId: '',
        goldBankId: '',
        weight: '',
        karat: '24k',
        usdAmount: '',
        description: '',
        goldPriceData: null
      });
      setErrors({});

    } catch (error) {
      console.error('Error issuing challan:', error);
      alert('❌ Failed to issue challan. Please try again.');
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
              <Truck className="w-5 h-5 text-cyan-600" />
              Quick Gold Challan
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <div className="px-6 py-3 bg-cyan-50 border-b">
            <p className="text-sm text-cyan-800">
              Issue gold withdrawal challans to manufacturers for any customer/party. Can be linked to an order or issued independently.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Order Selection - Now Optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order (Optional)
              </label>
              <select
                value={formData.orderId}
                onChange={(e) => setFormData(prev => ({ ...prev, orderId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">No specific order</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.id.slice(-8)} - {order.customerName} - {order.productName} ({order.weight}g {order.karat})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Leave empty to issue challan to any party/customer</p>
            </div>

            {/* Customer/Party Selection - Required when no order selected */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer/Party {!formData.orderId && '*'}
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!!formData.orderId} // Disabled when order is selected
              >
                <option value="">
                  {formData.orderId ? 'Auto-filled from order' : 'Select Customer/Party'}
                </option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || customer.customerName} {customer.phone ? `(${customer.phone})` : ''} 
                    {customer.accountBalance > 0 ? ` - Balance: ${customer.accountBalance.toFixed(3)}g gold` : ''} 
                    {customer.accountBalance > 0 ? ` - Balance: ${customer.accountBalance.toFixed(3)}g gold` : ''}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
              )}
              {formData.orderId && (
                <p className="text-xs text-gray-500 mt-1">Customer auto-filled from selected order</p>
              )}
            </div>

            {/* Manufacturer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer *
              </label>
              <select
                value={formData.manufacturerId}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturerId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errors.manufacturerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map(manufacturer => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.manufacturerName || manufacturer.name}
                  </option>
                ))}
              </select>
              {errors.manufacturerId && (
                <p className="text-red-500 text-xs mt-1">{errors.manufacturerId}</p>
              )}
            </div>

            {/* Gold Bank Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gold Bank *
              </label>
              <select
                value={formData.goldBankId}
                onChange={(e) => setFormData(prev => ({ ...prev, goldBankId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errors.goldBankId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Gold Bank</option>
                {goldBanks.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName}
                  </option>
                ))}
              </select>
              {errors.goldBankId && (
                <p className="text-red-500 text-xs mt-1">{errors.goldBankId}</p>
              )}
            </div>

            {/* Weight and Karat */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gold Weight (g) *
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Enter weight in grams"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
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
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>Pure Gold Equivalent:</span>
                  <span className="font-semibold">
                    {calculatePureGold(parseFloat(formData.weight), formData.karat).toFixed(4)}g
                  </span>
                </div>
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
                placeholder="Enter challan description"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
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
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-transparent rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Issuing...' : 'Issue Challan'}
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
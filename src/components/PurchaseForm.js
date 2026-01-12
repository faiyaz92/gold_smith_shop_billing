"use client";
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';
import { X, Calculator, ShoppingBag, DollarSign } from 'lucide-react';
import GoldPricePopup from './GoldPricePopup';

export default function PurchaseForm({ isOpen, onClose, companyId, userRole }) {
  const [suppliers, setSuppliers] = useState([]);
  const [goldBanks, setGoldBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGoldPricePopup, setShowGoldPricePopup] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: '',
    purchaseType: 'pure_gold', // 'pure_gold' or 'finished_goods'
    goldBankId: '',
    weight: '',
    karat: '24k',
    usdAmount: '',
    paymentMethod: 'cash', // 'cash' or 'credit'
    description: '',
    goldPriceData: null
  });

  const [errors, setErrors] = useState({});

  // Load suppliers and gold banks
  useEffect(() => {
    if (!isOpen || !companyId) return;

    const suppliersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`;
    const suppliersQuery = query(collection(db, suppliersPath), orderBy('manufacturerName'));
    const suppliersUnsubscribe = onSnapshot(suppliersQuery, (snapshot) => {
      const suppliersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSuppliers(suppliersData);
    });

    const goldBanksQuery = query(collection(db, 'goldBanks'), orderBy('bankName'));
    const goldBanksUnsubscribe = onSnapshot(goldBanksQuery, (snapshot) => {
      const goldBanksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoldBanks(goldBanksData);
    });

    return () => {
      suppliersUnsubscribe();
      goldBanksUnsubscribe();
    };
  }, [isOpen, companyId]);

  const handleGoldPriceConfirm = (priceData) => {
    setFormData(prev => ({
      ...prev,
      goldPriceData: priceData,
      usdAmount: priceData.usdAmount.toString(),
      weight: formData.purchaseType === 'pure_gold' ? priceData.goldGrams.toString() : prev.weight
    }));
    setShowGoldPricePopup(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supplierId) {
      newErrors.supplierId = 'Please select a supplier';
    }

    if (formData.purchaseType === 'pure_gold') {
      if (!formData.goldBankId) {
        newErrors.goldBankId = 'Please select a gold bank';
      }
      if (!formData.weight || parseFloat(formData.weight) <= 0) {
        newErrors.weight = 'Please enter valid gold weight';
      }
    } else {
      if (!formData.weight || parseFloat(formData.weight) <= 0) {
        newErrors.weight = 'Please enter valid jewelry weight';
      }
      if (!formData.karat) {
        newErrors.karat = 'Please select karat';
      }
    }

    if (!formData.usdAmount || parseFloat(formData.usdAmount) <= 0) {
      newErrors.usdAmount = 'Please enter valid USD amount';
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
      const purchasesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/purchases`;

      let pureGoldAmount = 0;
      let accountingEntries = [];

      if (formData.purchaseType === 'pure_gold') {
        // Pure gold purchase
        pureGoldAmount = parseFloat(formData.weight);

        if (formData.paymentMethod === 'cash') {
          accountingEntries = [
            {
              accountCode: formData.goldBankId ? goldBanks.find(b => b.id === formData.goldBankId)?.accountCode || '1101' : '1101',
              accountName: formData.goldBankId ? goldBanks.find(b => b.id === formData.goldBankId)?.bankName + ' - Gold Custody' : 'Gold Bank (Sharaf)',
              debit: pureGoldAmount,
              credit: 0,
              balanceType: 'gold'
            },
            {
              accountCode: '1201', // Cash
              accountName: 'Cash',
              debit: 0,
              credit: pureGoldAmount,
              balanceType: 'gold'
            }
          ];
        } else {
          // Credit purchase
          const supplier = suppliers.find(s => s.id === formData.supplierId);
          
          // ✅ ACCOUNT CODE AUDIT: Ensure supplier has account code
          let supplierAccountCode = supplier?.accountCode;
          if (!supplierAccountCode) {
            // Create supplier account if missing
            const accountManager = new HierarchicalAccountManager(companyId);
            supplierAccountCode = await accountManager.createManufacturerAccount(supplier);
            // Update supplier document with new account code
            await updateDoc(doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`, supplier.id), {
              accountCode: supplierAccountCode,
              updatedAt: serverTimestamp()
            });
            // Update local data
            supplier.accountCode = supplierAccountCode;
          }

          // ✅ ACCOUNT CODE AUDIT: Ensure gold bank has account code
          let goldBankAccountCode = '1101'; // Default fallback should not be used
          let goldBankName = 'Gold Bank (Sharaf)';
          if (formData.goldBankId) {
            const goldBank = goldBanks.find(b => b.id === formData.goldBankId);
            goldBankAccountCode = goldBank?.accountCode;
            goldBankName = goldBank?.bankName + ' - Gold Custody';
            if (!goldBankAccountCode) {
              // Create gold bank account if missing
              const accountManager = new HierarchicalAccountManager(companyId);
              const goldBankAccountResult = await accountManager.createGoldBankAccount(goldBank);
              if (!goldBankAccountResult.success) {
                throw new Error(`Failed to create gold bank account: ${goldBankAccountResult.message}`);
              }
              goldBankAccountCode = goldBankAccountResult.account.accountCode;
              // Update gold bank document with new account code
              await updateDoc(doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/goldbanks`, goldBank.id), {
                accountCode: goldBankAccountCode,
                updatedAt: serverTimestamp()
              });
              // Update local data
              goldBank.accountCode = goldBankAccountCode;
            }
          }
          
          accountingEntries = [
            {
              accountCode: goldBankAccountCode, // ✅ FIXED: Use specific gold bank account
              accountName: goldBankName,
              debit: pureGoldAmount,
              credit: 0,
              balanceType: 'gold'
            },
            {
              accountCode: supplierAccountCode, // ✅ FIXED: Use specific supplier account
              accountName: `${supplier?.manufacturerName || 'Supplier'} - Payables`,
              debit: 0,
              credit: pureGoldAmount,
              balanceType: 'gold'
            }
          ];
        }
      } else {
        // Finished goods purchase
        pureGoldAmount = calculatePureGold(parseFloat(formData.weight), formData.karat);

        if (formData.paymentMethod === 'cash') {
          accountingEntries = [
            {
              accountCode: '1103', // Finished Goods Inventory
              accountName: 'Finished Goods Inventory',
              debit: pureGoldAmount,
              credit: 0,
              balanceType: 'gold'
            },
            {
              accountCode: '1201', // Cash
              accountName: 'Cash',
              debit: 0,
              credit: pureGoldAmount,
              balanceType: 'gold'
            }
          ];
        } else {
          // Credit purchase - finished goods
          const supplier = suppliers.find(s => s.id === formData.supplierId);
          
          // ✅ ACCOUNT CODE AUDIT: Ensure supplier has account code
          let supplierAccountCode = supplier?.accountCode;
          if (!supplierAccountCode) {
            // Create supplier account if missing
            const accountManager = new HierarchicalAccountManager(companyId);
            supplierAccountCode = await accountManager.createManufacturerAccount(supplier);
            // Update supplier document with new account code
            await updateDoc(doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`, supplier.id), {
              accountCode: supplierAccountCode,
              updatedAt: serverTimestamp()
            });
            // Update local data
            supplier.accountCode = supplierAccountCode;
          }

          accountingEntries = [
            {
              accountCode: '1103', // Finished Goods Inventory
              accountName: 'Finished Goods Inventory',
              debit: pureGoldAmount,
              credit: 0,
              balanceType: 'gold'
            },
            {
              accountCode: supplierAccountCode, // ✅ FIXED: Use specific supplier account
              accountName: `${supplier?.manufacturerName || 'Supplier'} - Payables`,
              debit: 0,
              credit: pureGoldAmount,
              balanceType: 'gold'
            }
          ];
        }
      }

      // Create purchase record
      const purchaseData = {
        supplierId: formData.supplierId,
        supplierName: suppliers.find(s => s.id === formData.supplierId)?.manufacturerName || 'Unknown',
        purchaseType: formData.purchaseType,
        weight: parseFloat(formData.weight),
        karat: formData.karat,
        pureGoldAmount,
        usdAmount: parseFloat(formData.usdAmount),
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        goldBankId: formData.goldBankId || null,
        goldBankName: formData.goldBankId ? goldBanks.find(b => b.id === formData.goldBankId)?.bankName : null,
        goldPriceData: formData.goldPriceData,
        status: 'completed',
        createdAt: serverTimestamp(),
        createdBy: userRole,
        accountingRecorded: false
      };

      const purchaseRef = await addDoc(collection(db, purchasesPath), purchaseData);

      // Record accounting entry
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Purchase from ${purchaseData.supplierName}: ${formData.description}`,
        transactionType: 'purchase',
        referenceId: purchaseRef.id,
        referenceType: 'purchase',
        entries: accountingEntries
      });

      // Update purchase with accounting status
      // Note: In a real implementation, you'd update the document here

      alert('✅ Purchase recorded successfully!');
      onClose();

      // Reset form
      setFormData({
        supplierId: '',
        purchaseType: 'pure_gold',
        goldBankId: '',
        weight: '',
        karat: '24k',
        usdAmount: '',
        paymentMethod: 'cash',
        description: '',
        goldPriceData: null
      });
      setErrors({});

    } catch (error) {
      console.error('Error recording purchase:', error);
      alert('❌ Failed to record purchase. Please try again.');
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
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              Purchase from Supplier
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
            {/* Supplier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.supplierId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.manufacturerName || supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <p className="text-red-500 text-xs mt-1">{errors.supplierId}</p>
              )}
            </div>

            {/* Purchase Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="pure_gold"
                    checked={formData.purchaseType === 'pure_gold'}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseType: e.target.value }))}
                    className="mr-2"
                  />
                  Pure Gold
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="finished_goods"
                    checked={formData.purchaseType === 'finished_goods'}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseType: e.target.value }))}
                    className="mr-2"
                  />
                  Finished Goods
                </label>
              </div>
            </div>

            {/* Gold Bank Selection (for pure gold) */}
            {formData.purchaseType === 'pure_gold' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gold Bank *
                </label>
                <select
                  value={formData.goldBankId}
                  onChange={(e) => setFormData(prev => ({ ...prev, goldBankId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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
            )}

            {/* Weight and Karat */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.purchaseType === 'pure_gold' ? 'Gold Weight (g) *' : 'Jewelry Weight (g) *'}
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Enter weight in grams"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  step="0.001"
                  min="0"
                />
                {errors.weight && (
                  <p className="text-red-500 text-xs mt-1">{errors.weight}</p>
                )}
              </div>

              {formData.purchaseType === 'finished_goods' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Karat *
                  </label>
                  <select
                    value={formData.karat}
                    onChange={(e) => setFormData(prev => ({ ...prev, karat: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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
              )}
            </div>

            {/* Pure Gold Calculation Display */}
            {formData.weight && formData.purchaseType === 'finished_goods' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span>Pure Gold Equivalent:</span>
                  <span className="font-semibold">
                    {calculatePureGold(parseFloat(formData.weight), formData.karat).toFixed(4)}g
                  </span>
                </div>
              </div>
            )}

            {/* USD Amount with Calculator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  USD Amount *
                </label>
                <button
                  type="button"
                  onClick={() => setShowGoldPricePopup(true)}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
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
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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
                  Cash
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter purchase description"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recording...' : 'Record Purchase'}
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
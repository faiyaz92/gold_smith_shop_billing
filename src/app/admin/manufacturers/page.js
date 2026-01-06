'use client';

// ✅ TASK 4.1 UPGRADED: Manufacturer Management Page (USD Balance + Gold in Transit - BRD v2)
// ✅ TASK 4.2 COMPLETE: Manufacturer Payment Processing (USD payments with accounting)
// Reference: BRD_GoldSmith_v2.md Section 7.0, 7.2, 3.11, DatabaseInfo_GoldSmith_v2.md Section 5B
// Manufacturers paid in USD for making charges, gold tracked separately

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, addDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import Link from 'next/link';
import { Plus, Search, Edit, Eye, ToggleLeft, ToggleRight, DollarSign, Scale, CreditCard } from 'lucide-react';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash or bank_transfer
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const manufacturersRef = collection(db, `${basePath}/manufacturers`);
      const querySnapshot = await getDocs(manufacturersRef);

      const manufacturersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch account balances for manufacturers
      const accountManager = new HierarchicalAccountManager(companyId);
      const manufacturersWithBalances = await Promise.all(
        manufacturersData.map(async (manufacturer) => {
          try {
            let usdBalance = 0;

            // Method 1: Use accountCode from manufacturer document if available
            if (manufacturer.accountCode) {
              const account = await accountManager.getAccountByCode(manufacturer.accountCode);
              // Manufacturer accounts are liability accounts (credit balance)
              // Positive balance means they owe us money
              usdBalance = account ? (account.currentBalance || 0) : 0;
            } else {
              // Method 2: Try to find account by manufacturerId
              const allAccounts = await accountManager.getAllAccounts();
              const manufacturerAccount = allAccounts.find(account => 
                account.manufacturerId === manufacturer.id && account.accountCode?.startsWith('2101-MFG-')
              );
              usdBalance = manufacturerAccount ? (manufacturerAccount.currentBalance || 0) : 0;
            }

            return {
              ...manufacturer,
              currentBalanceUSD: usdBalance // Add the actual balance from accounting system
            };
          } catch (error) {
            console.error(`Error fetching balance for manufacturer ${manufacturer.id}:`, error);
            return {
              ...manufacturer,
              currentBalanceUSD: manufacturer.currentBalanceUSD || 0 // Fallback to stored value
            };
          }
        })
      );

      // Sort by manufacturer code descending (newest first)
      manufacturersWithBalances.sort((a, b) => {
        const codeA = a.manufacturerCode || '';
        const codeB = b.manufacturerCode || '';
        return codeB.localeCompare(codeA);
      });

      setManufacturers(manufacturersWithBalances);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (manufacturerId, currentStatus) => {
    try {
      const manufacturerRef = doc(db, `${basePath}/manufacturers`, manufacturerId);
      await updateDoc(manufacturerRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });

      // Update local state
      setManufacturers(prev => prev.map(manufacturer =>
        manufacturer.id === manufacturerId
          ? { ...manufacturer, isActive: !currentStatus }
          : manufacturer
      ));
    } catch (error) {
      console.error('Error updating manufacturer status:', error);
      alert('Error updating manufacturer status. Please try again.');
    }
  };

  const handlePaymentClick = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentMethod('cash');
    setShowPaymentDialog(true);
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (!selectedManufacturer) return;

    setProcessingPayment(true);
    try {
      const amount = parseFloat(paymentAmount);

      // Update manufacturer document (remove balance update since it's now fetched from accounting)
      const manufacturerRef = doc(db, `${basePath}/manufacturers`, selectedManufacturer.id);
      await updateDoc(manufacturerRef, {
        totalPaidUSD: (selectedManufacturer.totalPaidUSD || 0) + amount,
        lastPaymentDate: new Date(),
        lastPaymentAmount: amount,
        updatedAt: new Date()
      });

      // Create payment record
      const paymentsRef = collection(db, `${basePath}/manufacturerPayments`);
      const paymentNumber = `MPAY-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      await addDoc(paymentsRef, {
        paymentNumber,
        manufacturerId: selectedManufacturer.id,
        manufacturerCode: selectedManufacturer.manufacturerCode,
        manufacturerName: selectedManufacturer.manufacturerName || selectedManufacturer.name,
        amountUSD: amount,
        paymentMethod,
        notes: paymentNotes,
        createdAt: new Date(),
        createdBy: localStorage.getItem('userName') || 'Admin',
        status: 'completed'
      });

      // Create accounting entry
      const AccountingEngine = (await import('@/utils/accountingEngine')).default;
      const accountingEngine = new AccountingEngine(companyId);

      // Debit: Cash/Bank (1201 or 1202), Credit: Manufacturer Payable (2101-MFG-XXX)
      const accountCode = paymentMethod === 'cash' ? '1201' : '1202';
      await accountingEngine.createJournalEntry({
        description: `Payment to ${selectedManufacturer.manufacturerName || selectedManufacturer.name} - ${paymentMethod}`,
        reference: paymentNumber,
        entries: [
          {
            accountCode: selectedManufacturer.accountCode || `2101-MFG-${selectedManufacturer.manufacturerCode}`,
            accountName: `Manufacturer Payable - ${selectedManufacturer.manufacturerName || selectedManufacturer.name}`,
            debit: amount,
            credit: 0,
            description: `Payment to manufacturer (making charges)`
          },
          {
            accountCode: accountCode,
            accountName: paymentMethod === 'cash' ? 'Cash in Hand' : 'Bank Account',
            debit: 0,
            credit: amount,
            description: `Payment made via ${paymentMethod}`
          }
        ]
      });

      alert(`✅ Payment of $${amount.toFixed(2)} recorded successfully!\n\nPayment Number: ${paymentNumber}`);

      // Update local state (balance will be refreshed from accounting system)
      setManufacturers(prev => prev.map(m =>
        m.id === selectedManufacturer.id
          ? { 
              ...m, 
              totalPaidUSD: (m.totalPaidUSD || 0) + amount,
              lastPaymentDate: new Date(),
              lastPaymentAmount: amount
            }
          : m
      ));

      // Close dialog
      setShowPaymentDialog(false);
      setSelectedManufacturer(null);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredManufacturers = manufacturers.filter(manufacturer => {
    const matchesSearch = searchTerm === '' ||
      manufacturer.manufacturerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.phone?.includes(searchTerm) ||
      manufacturer.manufacturerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && manufacturer.isActive) ||
      (statusFilter === 'inactive' && !manufacturer.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
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
        <h1 className="text-3xl font-bold text-gray-900">Manufacturers</h1>
        <Link
          href="/admin/manufacturers/new"
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Manufacturer
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, phone, code, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manufacturers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  USD Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gold in Transit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredManufacturers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? 'No manufacturers found matching your criteria.' : 'No manufacturers found. Add your first manufacturer to get started.'}
                  </td>
                </tr>
              ) : (
                filteredManufacturers.map((manufacturer) => (
                  <tr key={manufacturer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {manufacturer.manufacturerCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {manufacturer.manufacturerName || manufacturer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manufacturer.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manufacturer.specialization || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        (manufacturer.currentBalanceUSD || 0) > 0 ? 'text-red-600' : 
                        (manufacturer.currentBalanceUSD || 0) < 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        ${Math.abs(manufacturer.currentBalanceUSD || 0).toFixed(2)}
                        {(manufacturer.currentBalanceUSD || 0) > 0 ? ' (Owe)' : 
                         (manufacturer.currentBalanceUSD || 0) < 0 ? ' (Overpaid)' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Scale size={14} className="text-yellow-600" />
                        {(manufacturer.goldInTransit || 0).toFixed(3)}g
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        manufacturer.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {manufacturer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* Record Payment Button (TASK 4.2) */}
                        {manufacturer.currentBalanceUSD > 0 && (
                          <button
                            onClick={() => handlePaymentClick(manufacturer)}
                            className="text-green-600 hover:text-green-900"
                            title="Record Payment"
                          >
                            <CreditCard size={18} />
                          </button>
                        )}
                        <Link
                          href={`/admin/manufacturers/${manufacturer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/admin/manufacturers/${manufacturer.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => toggleStatus(manufacturer.id, manufacturer.isActive)}
                          className={`${
                            manufacturer.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                          title={manufacturer.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {manufacturer.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Manufacturers</h3>
          <p className="text-3xl font-bold text-yellow-600">{manufacturers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Manufacturers</h3>
          <p className="text-3xl font-bold text-green-600">
            {manufacturers.filter(m => m.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total USD Owed</h3>
          <p className="text-3xl font-bold text-red-600">
            ${manufacturers.reduce((sum, m) => sum + Math.max(m.currentBalanceUSD || 0, 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Gold in Transit</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {manufacturers.reduce((sum, m) => sum + (m.goldInTransit || 0), 0).toFixed(3)}g
          </p>
        </div>
      </div>

      {/* Payment Dialog (TASK 4.2) */}
      {showPaymentDialog && selectedManufacturer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Record Payment</h3>
                  <p className="text-gray-600 mt-1">
                    {selectedManufacturer.manufacturerName || selectedManufacturer.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Code: {selectedManufacturer.manufacturerCode}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* Current Balance Card */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 font-medium">Current Balance Owed</p>
                    <p className="text-3xl font-bold text-red-900">
                      ${(selectedManufacturer.currentBalanceUSD || 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-red-600" />
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={selectedManufacturer.currentBalanceUSD || 0}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ${(selectedManufacturer.currentBalanceUSD || 0).toFixed(2)}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 border-2 rounded-lg text-left transition-colors ${
                        paymentMethod === 'cash'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">Cash</p>
                      <p className="text-xs text-gray-600">Pay from cash in hand</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-3 border-2 rounded-lg text-left transition-colors ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">Bank Transfer</p>
                      <p className="text-xs text-gray-600">Pay from bank account</p>
                    </button>
                  </div>
                </div>

                {/* Payment Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Payment reference, invoice numbers, etc."
                  />
                </div>

                {/* Balance Preview */}
                {paymentAmount && parseFloat(paymentAmount) > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Balance After Payment</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Current Balance:</p>
                        <p className="font-bold text-blue-900">
                          ${(selectedManufacturer.currentBalanceUSD || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Payment Amount:</p>
                        <p className="font-bold text-blue-900">
                          -${parseFloat(paymentAmount).toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-blue-200">
                        <p className="text-blue-700">New Balance:</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${((selectedManufacturer.currentBalanceUSD || 0) - parseFloat(paymentAmount)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accounting Impact */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Accounting Entry</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        <span className="font-medium">Debit:</span> Manufacturer Payable (2101-MFG-{selectedManufacturer.manufacturerCode})
                      </span>
                      <span className="font-mono text-green-600">
                        ${paymentAmount ? parseFloat(paymentAmount).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        <span className="font-medium">Credit:</span> {paymentMethod === 'cash' ? 'Cash (1201)' : 'Bank Account (1202)'}
                      </span>
                      <span className="font-mono text-red-600">
                        ${paymentAmount ? parseFloat(paymentAmount).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || processingPayment}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
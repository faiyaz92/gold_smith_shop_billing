"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useAccounting } from '@/app/context/AccountingContext';
import { AccountingEngine } from '@/utils/accountingEngine';
import AdminLayout from '@/app/admin/AdminLayout';
import { Plus, Edit, Trash2, Save, X, Search, Filter } from 'lucide-react';

// Jewelry Accounting Entry Form Component
function JournalEntryForm({ entry, onSave, onCancel, accounts }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' }
    ]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        description: entry.description || '',
        reference: entry.reference || '',
        lines: entry.lines || [
          { accountId: '', debit: 0, credit: 0, description: '' },
          { accountId: '', debit: 0, credit: 0, description: '' }
        ]
      });
    }
  }, [entry]);

  const addLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', debit: 0, credit: 0, description: '' }]
    }));
  };

  const removeLine = (index) => {
    if (formData.lines.length > 2) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index)
      }));
    }
  };

  const updateLine = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    return { totalDebit, totalCredit };
  };

  const validateForm = () => {
    const newErrors = {};
    const { totalDebit, totalCredit } = calculateTotals();

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      newErrors.balance = 'Debit and credit amounts must balance';
    }

    if (formData.lines.some(line => !line.accountId)) {
      newErrors.lines = 'All lines must have an account selected';
    }

    if (formData.lines.some(line => (parseFloat(line.debit) || 0) === 0 && (parseFloat(line.credit) || 0) === 0)) {
      newErrors.amounts = 'Each line must have either debit or credit amount';
    }

    // ✅ Helper function to check if account has children
    const hasChildren = (accountId) => {
      return accounts.some(acc => 
        acc.parentAccount === accountId || 
        acc.parentAccount === accounts.find(a => a.id === accountId)?.accountCode ||
        acc.parentAccount === accounts.find(a => a.id === accountId)?.id
      );
    };

    // ✅ Validate no direct posting to parent accounts with children
    const usedAccountIds = formData.lines.map(line => line.accountId).filter(id => id);
    for (const accountId of usedAccountIds) {
      const account = accounts.find(acc => acc.id === accountId);
      if (account && hasChildren(accountId)) {
        newErrors.parentWithChildren = `❌ Cannot post directly to parent account "${account.accountCode} - ${account.accountName}". Use sub-accounts instead.`;
        break;
      }
    }

    // ✅ Validate no parent-child transactions
    const usedAccountIds2 = formData.lines.map(line => line.accountId).filter(id => id);
    for (let i = 0; i < usedAccountIds2.length; i++) {
      for (let j = i + 1; j < usedAccountIds2.length; j++) {
        const account1 = accounts.find(acc => acc.accountId === usedAccountIds2[i]);
        const account2 = accounts.find(acc => acc.accountId === usedAccountIds2[j]);
        
        if (account1 && account2) {
          // Check if account1 is parent of account2
          if (account2.parentAccount === account1.id || account2.parentAccount === account1.accountCode) {
            newErrors.parentChild = `❌ Invalid: "${account1.accountCode}" is parent of "${account2.accountCode}". Cannot create entries between parent and child accounts.`;
            break;
          }
          // Check if account2 is parent of account1
          if (account1.parentAccount === account2.id || account1.parentAccount === account2.accountCode) {
            newErrors.parentChild = `❌ Invalid: "${account2.accountCode}" is parent of "${account1.accountCode}". Cannot create entries between parent and child accounts.`;
            break;
          }
        }
      }
      if (newErrors.parentChild) break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const { totalDebit, totalCredit } = calculateTotals();
    const journalEntry = {
      ...formData,
      totalDebit,
      totalCredit,
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      lines: formData.lines.filter(line => line.accountId && ((parseFloat(line.debit) || 0) > 0 || (parseFloat(line.credit) || 0) > 0))
    };

    onSave(journalEntry);
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {entry ? 'Edit Jewelry Accounting Entry' : 'New Jewelry Accounting Entry'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Header Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter jewelry accounting entry description"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference
          </label>
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
            placeholder="Jewelry transaction reference or invoice ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Journal Lines */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Jewelry Transaction Lines</h3>
            <button
              onClick={addLine}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Transaction Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit (₹)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit (₹)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.lines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Account</option>
                        {accounts
                          .sort((a, b) => {
                            // Sort by accountCode to group parent and children together
                            return a.accountCode.localeCompare(b.accountCode);
                          })
                          .map(account => {
                            const isSubAccount = account.level === 2 || account.parentAccount;
                            const prefix = isSubAccount ? '\u00A0\u00A0\u00A0\u00A0↳ ' : '';
                            return (
                              <option 
                                key={account.accountId} 
                                value={account.accountId}
                                className={isSubAccount ? 'text-gray-600' : 'font-semibold'}
                              >
                                {prefix}{account.accountCode} - {account.accountName || account.name}
                              </option>
                            );
                          })}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="Transaction description"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={line.debit}
                        onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={line.credit}
                        onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {formData.lines.length > 2 && (
                        <button
                          onClick={() => removeLine(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="2" className="px-4 py-3 text-right font-semibold">
                    TOTALS:
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {errors.lines && (
            <p className="text-red-500 text-sm mt-2">{errors.lines}</p>
          )}
          {errors.amounts && (
            <p className="text-red-500 text-sm mt-2">{errors.amounts}</p>
          )}
          {errors.balance && (
            <p className="text-red-500 text-sm mt-2">{errors.balance}</p>
          )}
          {errors.parentChild && (
            <div className="bg-red-50 border border-red-300 rounded-md p-3 mt-2">
              <p className="text-red-700 text-sm font-semibold">{errors.parentChild}</p>
              <p className="text-red-600 text-xs mt-1">
                💡 Accounting Standard: Journal entries must be between different independent accounts. 
                Parent and sub-account transactions are not allowed as they represent the same account.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isBalanced}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 inline mr-1" />
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Journal Entries Component
export default function JournalEntriesPage() {
  const { companyId, userRole } = useAccounting();
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Load journal entries and accounts
  useEffect(() => {
    if (!companyId) return;

    const entriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;
    const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;

    // Load accounts
    const accountsQuery = query(collection(db, accountsPath), orderBy('accountCode'));
    const unsubscribeAccounts = onSnapshot(accountsQuery, (snapshot) => {
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAccounts(accountsData);
    });

    // Load journal entries
    const entriesQuery = query(collection(db, entriesPath), orderBy('date', 'desc'));
    const unsubscribeEntries = onSnapshot(entriesQuery, (snapshot) => {
      const entriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(entriesData);
      setLoading(false);
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeEntries();
    };
  }, [companyId]);

  const saveEntry = async (entryData) => {
    if (!companyId) return;

    try {
      const entriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;
      const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;

      const entryToSave = {
        ...entryData,
        date: new Date(entryData.date),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userRole,
        status: 'posted',
        entryType: 'manual-journal-entry',
        _version: '2.0',
        _migrationStatus: 'active',
        _v3Ready: true,
        _v4Ready: true
      };

      if (editingEntry) {
        // Update existing entry
        await updateDoc(doc(db, entriesPath, editingEntry.id), {
          ...entryToSave,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new entry
        await addDoc(collection(db, entriesPath), entryToSave);
      }

      // ✅ Use AccountingEngine to handle all accounting logic
      const accountingEngine = new AccountingEngine(companyId);
      await accountingEngine.createJournalEntry({
        entryDate: entryData.date,
        description: entryData.description,
        reference: entryData.reference,
        entries: entryData.lines,
        createdBy: userRole
      });

      setShowForm(false);
      setEditingEntry(null);
      alert('✅ Journal entry saved and account balances updated!');
    } catch (error) {
      console.error('Error saving jewelry accounting entry:', error);
      alert('Failed to save jewelry accounting entry. Please try again.');
    }
  };

  const deleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this jewelry accounting entry?')) return;

    try {
      const entriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;
      await deleteDoc(doc(db, entriesPath, entryId));
    } catch (error) {
      console.error('Error deleting jewelry accounting entry:', error);
      alert('Failed to delete jewelry accounting entry. Please try again.');
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || entry.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📝 Jewelry Accounting Journal Entries</h1>
            <p className="text-gray-600 mt-1">Create and manage jewelry business accounting entries</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Jewelry Entry
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jewelry transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
                <option value="voided">Voided</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {(showForm || editingEntry) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <JournalEntryForm
                entry={editingEntry}
                onSave={saveEntry}
                onCancel={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                }}
                accounts={accounts}
              />
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
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
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.date?.toDate?.()?.toLocaleDateString('en-IN') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(entry.totalDebit || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(entry.totalCredit || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'posted'
                          ? 'bg-green-100 text-green-800'
                          : entry.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No jewelry accounting entries found.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first jewelry accounting entry
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
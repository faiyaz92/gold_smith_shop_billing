"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useAccounting } from '@/app/context/AccountingContext';
import { Plus, Edit, Trash2, Save, X, FolderTree, ChevronRight, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const { companyId, userRole } = useAccounting();
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [expandedAccounts, setExpandedAccounts] = useState({});
  const [formData, setFormData] = useState({
    accountCode: '',
    accountName: '',
    accountType: 'asset',
    category: '',
    balanceType: 'debit',
    parentAccount: null,
    description: '',
    isActive: true,
  });

  // Fetch accounts
  useEffect(() => {
    if (!companyId) return;

    const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
    const accountsQuery = query(collection(db, accountsPath), orderBy('accountCode'));

    const unsubscribe = onSnapshot(accountsQuery, (snapshot) => {
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        accountId: doc.id,
        ...doc.data()
      }));
      setAccounts(accountsData);
    });

    return () => unsubscribe();
  }, [companyId]);

  // Account types and categories
  const accountTypes = {
    asset: {
      label: 'Asset',
      categories: ['Current Assets', 'Fixed Assets', 'Other Assets'],
      balanceType: 'debit'
    },
    liability: {
      label: 'Liability',
      categories: ['Current Liabilities', 'Long-term Liabilities', 'Other Liabilities'],
      balanceType: 'credit'
    },
    equity: {
      label: 'Equity',
      categories: ["Owner's Equity", 'Retained Earnings', 'Other Equity'],
      balanceType: 'credit'
    },
    income: {
      label: 'Income/Revenue',
      categories: ['Operating Income', 'Non-operating Income', 'Other Income'],
      balanceType: 'credit'
    },
    expense: {
      label: 'Expense',
      categories: ['Operating Expenses', 'Cost of Goods Sold', 'Other Expenses'],
      balanceType: 'debit'
    }
  };

  // Get parent accounts (for sub-account creation)
  const getParentAccounts = () => {
    return accounts.filter(acc => !acc.parentAccount);
  };

  // Get sub-accounts for a parent
  const getSubAccounts = (parentAccountId) => {
    // Sub-accounts can reference parent by id OR accountCode
    const parentAccount = accounts.find(acc => acc.id === parentAccountId);
    if (!parentAccount) return [];
    
    return accounts.filter(acc => 
      acc.parentAccount === parentAccountId || 
      acc.parentAccount === parentAccount.accountCode ||
      acc.parentAccount === parentAccount.id
    );
  };

  // Toggle account expansion
  const toggleExpand = (accountId) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;

      if (editingAccount) {
        // Update existing account
        const accountRef = doc(db, accountsPath, editingAccount.id);
        await updateDoc(accountRef, {
          ...formData,
          updatedAt: serverTimestamp(),
          updatedBy: userRole
        });
        alert('✅ Account updated successfully!');
      } else {
        // Create new account using centralized method
        const accountManager = new HierarchicalAccountManager(companyId);

        // Check for duplicate account code first
        const existingAccount = await accountManager.getAccountByCode(formData.accountCode);
        if (existingAccount) {
          alert('❌ Account code already exists. Please choose a different code.');
          return;
        }

        // Determine level based on parent account
        const level = formData.parentAccount ? 2 : 1;

        // Call CORE createAccount method with manual account additional fields
        const createdAccount = await accountManager.createAccount({
          accountCode: formData.accountCode,
          accountName: formData.accountName,
          accountType: formData.accountType,
          category: formData.category,
          balanceType: formData.balanceType,
          currentBalance: 0,
          currentBalanceGold: 0,
          description: formData.description,
          parentAccount: formData.parentAccount,
          level: level,
          isSystem: false,
          isActive: formData.isActive,
          createdBy: userRole
        }, {
          // Manual account specific additional fields
          // Migration-ready fields
          _version: "2.0",
          _migrationStatus: "active",
          _v3Ready: true,
          _v4Ready: false
        });

        alert('✅ Account created successfully!');
      }

      // Reset form
      setShowForm(false);
      setEditingAccount(null);
      setFormData({
        accountCode: '',
        accountName: '',
        accountType: 'asset',
        category: '',
        balanceType: 'debit',
        parentAccount: null,
        description: '',
        isActive: true,
      });
    } catch (error) {
      console.error('Error saving account:', error);
      alert('❌ Failed to save account. Please try again.');
    }
  };

  // Handle edit
  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      accountCode: account.accountCode,
      accountName: account.accountName || account.name,
      accountType: account.accountType,
      category: account.category,
      balanceType: account.balanceType,
      parentAccount: account.parentAccount || null,
      description: account.description || '',
      isActive: account.isActive !== false,
    });
    setShowForm(true);
  };

  // Render account tree
  const renderAccount = (account, level = 0) => {
    const subAccounts = getSubAccounts(account.id);
    const hasChildren = subAccounts.length > 0;
    const isExpanded = expandedAccounts[account.id];

    return (
      <div key={account.id}>
        <div
          className={`flex items-center justify-between p-3 border-b hover:bg-gray-50 ${
            level > 0 ? 'ml-' + (level * 8) : ''
          }`}
          style={{ marginLeft: level * 32 + 'px' }}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(account.id)}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            {!hasChildren && <div className="w-6 mr-2" />}
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-gray-700">
                  {account.accountCode}
                </span>
                <button
                  onClick={() => router.push(`/admin/accounting/general-ledger?accountId=${account.id}`)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  title="View ledger for this account"
                >
                  {account.accountName || account.name}
                </button>
                {level > 0 && (
                  <span className="text-xs text-gray-500">(Sub-account)</span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                <span className="capitalize">{account.accountType}</span>
                <span>•</span>
                <span>{account.category}</span>
                <span>•</span>
                <span className="capitalize">{account.balanceType} balance</span>
                {account.description && (
                  <>
                    <span>•</span>
                    <span className="italic">{account.description}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Current Balance Display */}
            <div className="text-right min-w-[150px]">
              <div className="text-sm font-semibold text-gray-900">
                {account.currentBalanceGold !== undefined && account.currentBalanceGold !== null ? (
                  <span className={account.currentBalanceGold < 0 ? 'text-red-600' : 'text-yellow-600'}>
                    {account.currentBalanceGold.toFixed(3)}g
                  </span>
                ) : account.currentBalance !== undefined ? (
                  <span className={account.balanceType === 'debit' && account.currentBalance < 0 ? 'text-red-600' : 'text-gray-900'}>
                    ${account.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-gray-400">$0.00</span>
                )}
              </div>
              {account.currentBalanceGold !== undefined && account.currentBalanceGold !== null && account.currentBalance !== undefined && account.currentBalance > 0 && (
                <div className="text-xs text-gray-500">
                  ${account.currentBalance.toFixed(2)}
                </div>
              )}
            </div>
            
            {!account.isSystem && (
              <button
                onClick={() => handleEdit(account)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit account"
              >
                <Edit size={16} />
              </button>
            )}
            {account.isSystem && (
              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                System
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {subAccounts.map(sub => renderAccount(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.accountType;
    if (!acc[type]) acc[type] = [];
    if (!account.parentAccount) { // Only show parent accounts at top level
      acc[type].push(account);
    }
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FolderTree className="text-blue-600" />
              Chart of Accounts
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your accounting structure - Main accounts and sub-accounts
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingAccount(null);
              setFormData({
                accountCode: '',
                accountName: '',
                accountType: 'asset',
                category: '',
                balanceType: 'debit',
                parentAccount: null,
                description: '',
                isActive: true,
              });
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus size={20} />
            New Account
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Total Accounts</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{accounts.length}</div>
          <div className="text-xs text-blue-600 mt-1">
            {accounts.filter(a => a.level === 1 || !a.parentAccount).length} main • {accounts.filter(a => a.level === 2 || a.parentAccount).length} sub-accounts
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Total Assets</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            ${accounts.filter(a => a.accountType === 'asset').reduce((sum, a) => sum + (a.currentBalance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            {accounts.filter(a => a.accountType === 'asset').reduce((sum, a) => sum + (a.currentBalanceGold || 0), 0).toFixed(3)}g gold
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Total Liabilities</div>
          <div className="text-2xl font-bold text-purple-900 mt-1">
            ${accounts.filter(a => a.accountType === 'liability').reduce((sum, a) => sum + (a.currentBalance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            {accounts.filter(a => a.accountType === 'liability').length} accounts
          </div>
        </div>
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAccount ? 'Edit Account' : 'Create New Account'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAccount(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Code *
                </label>
                <input
                  type="text"
                  value={formData.accountCode}
                  onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                  placeholder="e.g., 1101, MAIN-1001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier for the account (e.g., 1101 for Gold Bank, MAIN-1001 for Cash)
                </p>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., Gold Bank (Sharaf), Cash in Hand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Parent Account (for sub-accounts) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Account (Optional - for sub-accounts)
                </label>
                <select
                  value={formData.parentAccount || ''}
                  onChange={(e) => setFormData({ ...formData, parentAccount: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Main Account)</option>
                  {getParentAccounts().map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountCode} - {acc.accountName || acc.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for main account, select parent to create sub-account
                </p>
              </div>

              {/* Account Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type *
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => {
                      const type = e.target.value;
                      setFormData({
                        ...formData,
                        accountType: type,
                        balanceType: accountTypes[type].balanceType,
                        category: accountTypes[type].categories[0]
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.entries(accountTypes).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {accountTypes[formData.accountType].categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Balance Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Normal Balance *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="debit"
                      checked={formData.balanceType === 'debit'}
                      onChange={(e) => setFormData({ ...formData, balanceType: e.target.value })}
                      className="mr-2"
                    />
                    Debit (Assets, Expenses)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="credit"
                      checked={formData.balanceType === 'credit'}
                      onChange={(e) => setFormData({ ...formData, balanceType: e.target.value })}
                      className="mr-2"
                    />
                    Credit (Liabilities, Equity, Income)
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description or notes about this account"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white rounded-lg shadow">
        {Object.entries(accountTypes).map(([typeKey, typeInfo]) => {
          const typeAccounts = accountsByType[typeKey] || [];
          if (typeAccounts.length === 0) return null;

          return (
            <div key={typeKey} className="border-b last:border-b-0">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-bold text-gray-900 uppercase text-sm">
                  {typeInfo.label} ({typeAccounts.length})
                </h3>
              </div>
              <div>
                {typeAccounts.map(account => renderAccount(account))}
              </div>
            </div>
          );
        })}

        {accounts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FolderTree size={48} className="mx-auto mb-4 opacity-50" />
            <p>No accounts found. Create your first account to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

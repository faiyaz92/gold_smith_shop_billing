"use client";
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useAccounting } from '@/app/context/AccountingContext';
import { AccountingEngine } from '@/utils/accountingEngine';
import { initializeDefaultAccounts } from '@/utils/initializeCoreAccounts';
import { LineChart, BarChart, PieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { useRouter } from 'next/navigation';
import { FolderTree, BookOpen, Scale, ArrowRightLeft } from 'lucide-react';

// Metric Card Component
function MetricCard({ title, value, trend, icon, color = "blue" }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatValue = (val) => {
    if (typeof val === 'number' && title.toLowerCase().includes('ratio')) {
      return val.toFixed(2) + ':1';
    }
    if (typeof val === 'number' && title.toLowerCase().includes('margin')) {
      return val.toFixed(1) + '%';
    }
    if (typeof val === 'number' && (title.toLowerCase().includes('₹') || title.toLowerCase().includes('position') || title.toLowerCase().includes('profit'))) {
      return formatCurrency(val);
    }
    return val;
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          {trend && (
            <p className={`text-sm ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {trend} vs Last Mo
            </p>
          )}
        </div>
        {icon && <div className={`text-${color}-500 text-2xl`}>{icon}</div>}
      </div>
    </div>
  );
}

// P&L Statement Component
function PLStatement({ data }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              This Month
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Month
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={index} className={item.name.includes('Profit') ? 'bg-green-50 font-semibold' : ''}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(item.current)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(item.previous)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={item.current > item.previous ? 'text-green-600' : 'text-red-600'}>
                  {item.previous > 0 ? (((item.current - item.previous) / item.previous) * 100).toFixed(1) : 0}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Balance Sheet Component
function BalanceSheet({ data }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value, total) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Assets */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900">ASSETS</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">Current Assets</span>
            <div className="text-right">
              <div className="text-sm font-medium">{formatCurrency(data.assets.current)}</div>
              <div className="text-xs text-gray-500">{formatPercent(data.assets.current, data.assets.total)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">Fixed Assets</span>
            <div className="text-right">
              <div className="text-sm font-medium">{formatCurrency(data.assets.fixed)}</div>
              <div className="text-xs text-gray-500">{formatPercent(data.assets.fixed, data.assets.total)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 font-semibold">
            <span className="text-sm text-gray-900">Total Assets</span>
            <div className="text-right">
              <div className="text-sm font-bold">{formatCurrency(data.assets.total)}</div>
              <div className="text-xs text-gray-500">100%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Liabilities & Equity */}
      <div>
        <h4 className="text-lg font-semibold mb-4 text-gray-900">LIABILITIES & EQUITY</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">Current Liabilities</span>
            <div className="text-right">
              <div className="text-sm font-medium">{formatCurrency(data.liabilities.current)}</div>
              <div className="text-xs text-gray-500">{formatPercent(data.liabilities.current, data.assets.total)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">Long-term Liabilities</span>
            <div className="text-right">
              <div className="text-sm font-medium">{formatCurrency(data.liabilities.longTerm)}</div>
              <div className="text-xs text-gray-500">{formatPercent(data.liabilities.longTerm, data.assets.total)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">Owner&apos;s Equity</span>
            <div className="text-right">
              <div className="text-sm font-medium">{formatCurrency(data.equity)}</div>
              <div className="text-xs text-gray-500">{formatPercent(data.equity, data.assets.total)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 font-semibold">
            <span className="text-sm text-gray-900">Total Liab & Equity</span>
            <div className="text-right">
              <div className="text-sm font-bold">{formatCurrency(data.liabilities.total + data.equity)}</div>
              <div className="text-xs text-gray-500">100%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Accounting Alerts Component
function AccountingAlerts({ alerts }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Pending Tasks */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">⚠️ Pending Tasks</h3>
        <div className="space-y-3">
          {alerts.pendingTasks.map((task, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">{task.description}</span>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {task.count}
              </span>
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
          [View All Tasks]
        </button>
      </div>

      {/* Recent Entries */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📋 Recent Entries</h3>
        <div className="space-y-3">
          {alerts.recentEntries.map((entry, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">{entry.description}</span>
              <span className="text-xs text-gray-500">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 0
                }).format(entry.amount)}
              </span>
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
          [View All Entries]
        </button>
      </div>
    </div>
  );
}

// Main Accounting Dashboard Component
export default function AccountingDashboard() {
  const { financialData, loading, getAccountingAlerts, userRole, companyId } = useAccounting();
  const [currentPeriod, setCurrentPeriod] = useState('thisMonth');
  const [alerts, setAlerts] = useState({ pendingTasks: [], recentEntries: [] });
  const [accountsInitialized, setAccountsInitialized] = useState(false);
  const [goldAccountsInitialized, setGoldAccountsInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [initializingGold, setInitializingGold] = useState(false);

  const router = useRouter();

  // Check if generic accounts exist
  const checkGenericAccountsExist = async () => {
    if (!companyId) return false;
    try {
      const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
      const accountsQuery = query(collection(db, accountsPath));
      const snapshot = await getDocs(accountsQuery);
      const coreAccounts = ['MAIN-1001', 'MAIN-1002', 'MAIN-2001', 'MAIN-3001', 'MAIN-4001', 'MAIN-5001'];
      const existingCodes = snapshot.docs.map(doc => doc.data().accountCode);
      return coreAccounts.every(code => existingCodes.includes(code));
    } catch (error) {
      console.error('Error checking generic accounts:', error);
      return false;
    }
  };

  // Check if Gold Smith accounts exist
  const checkGoldAccountsExist = async () => {
    if (!companyId) return false;
    try {
      const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
      console.log('🔍 Checking path:', accountsPath);
      const accountsQuery = query(collection(db, accountsPath));
      const snapshot = await getDocs(accountsQuery);
      console.log('🔍 Total accounts found:', snapshot.docs.length);
      
      const goldAccounts = ['1101', '1102', '1103', '1301', '4101'];
      const existingCodes = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('🔍 Account doc:', doc.id, 'Code:', data.accountCode, 'Name:', data.accountName || data.name);
        return data.accountCode;
      }).filter(code => code); // Filter out undefined
      
      console.log('🔍 All account codes found:', existingCodes);
      console.log('🔍 Looking for gold codes:', goldAccounts);
      const hasGold = goldAccounts.every(code => existingCodes.includes(code));
      console.log('🔍 Gold accounts exist?', hasGold);
      return hasGold;
    } catch (error) {
      console.error('Error checking gold accounts:', error);
      return false;
    }
  };

  // Initialize gold smith specific accounts (15 accounts)
  const initializeGoldSmithAccounts = async () => {
    if (!companyId || userRole !== 'company_admin') return;

    setInitializingGold(true);
    try {
      const result = await initializeDefaultAccounts(companyId);
      console.log('🔍 Initialization result:', result);
      if (result.success) {
        alert('✅ Gold Smith accounts initialized successfully!\n15 accounts created including Gold Bank (Sharaf), Gold in Transit, Commission Income, etc.');
        // Wait a bit for Firestore to sync, then check again
        setTimeout(async () => {
          const goldExists = await checkGoldAccountsExist();
          console.log('🔍 After creation, gold accounts exist?', goldExists);
          setGoldAccountsInitialized(goldExists);
          setInitializingGold(false);
          if (!goldExists) {
            alert('⚠️ Accounts created but not detected. Please refresh the page.');
          }
        }, 2000);
      } else {
        alert('❌ Failed to initialize Gold Smith accounts: ' + result.message);
        setInitializingGold(false);
      }
    } catch (error) {
      console.error('Gold Smith account initialization failed:', error);
      alert('❌ Failed to initialize Gold Smith accounts. Please try again.');
      setInitializingGold(false);
    }
  };

  // Initialize generic business accounts (43 accounts)
  const initializeGenericAccounts = async () => {
    if (!companyId || userRole !== 'company_admin') return;

    setInitializing(true);
    try {
      const coreAccounts = [
        // Assets
        { accountCode: 'MAIN-1001', name: 'Cash in Hand', type: 'Asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1002', name: 'Bank Account - Primary', type: 'Asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1003', name: 'Accounts Receivable', type: 'Asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1004', name: 'Inventory', type: 'Asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1005', name: 'Prepaid Expenses', type: 'Asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1006', name: 'GST Input Tax Credit', type: 'Asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1201', name: 'Furniture & Fixtures', type: 'Asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1202', name: 'Equipment', type: 'Asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1203', name: 'Vehicles', type: 'Asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1204', name: 'Buildings', type: 'Asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1205', name: 'Accumulated Depreciation', type: 'Asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1206', name: 'Land', type: 'Asset', category: 'Fixed Asset' },

        // Liabilities
        { accountCode: 'MAIN-2001', name: 'Accounts Payable', type: 'Liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2002', name: 'GST Payable', type: 'Liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2003', name: 'Salaries Payable', type: 'Liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2004', name: 'Utilities Payable', type: 'Liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2005', name: 'Loans Payable - Short Term', type: 'Liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2101', name: 'Loans Payable - Long Term', type: 'Liability', category: 'Long-term Liability' },
        { accountCode: 'MAIN-2102', name: 'Owner&apos;s Loan', type: 'Liability', category: 'Long-term Liability' },
        { accountCode: 'MAIN-2103', name: 'Deferred Tax Liability', type: 'Liability', category: 'Long-term Liability' },

        // Equity
        { accountCode: 'MAIN-3001', name: 'Owner&apos;s Capital', type: 'Equity', category: 'Owner&apos;s Equity' },
        { accountCode: 'MAIN-3002', name: 'Retained Earnings', type: 'Equity', category: 'Owner&apos;s Equity' },
        { accountCode: 'MAIN-3003', name: 'Current Year Profit/Loss', type: 'Equity', category: 'Owner&apos;s Equity' },
        { accountCode: 'MAIN-3004', name: 'Opening Balance Equity', type: 'Equity', category: 'Owner&apos;s Equity' },
        { accountCode: 'MAIN-3005', name: 'Drawings', type: 'Equity', category: 'Owner&apos;s Equity' },

        // Income
        { accountCode: 'MAIN-4001', name: 'Sales Revenue', type: 'Income', category: 'Operating Income' },
        { accountCode: 'MAIN-4002', name: 'Service Income', type: 'Income', category: 'Operating Income' },
        { accountCode: 'MAIN-4003', name: 'Other Income', type: 'Income', category: 'Non-operating Income' },
        { accountCode: 'MAIN-4004', name: 'Interest Income', type: 'Income', category: 'Non-operating Income' },
        { accountCode: 'MAIN-4005', name: 'Discount Received', type: 'Income', category: 'Non-operating Income' },
        { accountCode: 'MAIN-4006', name: 'Late Payment Fees', type: 'Income', category: 'Non-operating Income' },

        // Expenses
        { accountCode: 'MAIN-5001', name: 'Cost of Goods Sold', type: 'Expense', category: 'Operating Expense' },
        { accountCode: 'MAIN-5101', name: 'Salaries & Wages', type: 'Expense', category: 'Operating Expense' },
        { accountCode: 'MAIN-5102', name: 'Utilities', type: 'Expense', category: 'Operating Expense' },
        { accountCode: 'MAIN-5103', name: 'Rent', type: 'Expense', category: 'Operating Expense' },
        { accountCode: 'MAIN-5104', name: 'Insurance', type: 'Expense', category: 'Operating Expense' },
        { accountCode: 'MAIN-5105', name: 'Repairs & Maintenance', type: 'Expense', category: 'Operating Expense' },
        { accountCode: 'MAIN-5106', name: 'Advertising & Marketing', type: 'Expense', category: 'Operating Expense' },
        { accountCode: 'MAIN-5107', name: 'Office Supplies', type: 'Expense', category: 'Operating Expense' }
      ];

      const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
      const batch = writeBatch(db);

      coreAccounts.forEach(account => {
        const accountRef = doc(collection(db, accountsPath));
        batch.set(accountRef, {
          ...account,
          balance: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userRole,
          _version: '2.0',
          _migrationStatus: 'active',
          _v3Ready: true,
          _v4Ready: true
        });
      });

      await batch.commit();
      setAccountsInitialized(true);
      // Refresh dashboard data
      window.location.reload();
    } catch (error) {
      console.error('Account initialization failed:', error);
      alert('Failed to initialize accounts. Please try again.');
    } finally {
      setInitializing(false);
    }
  };

  // Check accounts on component mount
  useEffect(() => {
    const checkAccounts = async () => {
      const genericExists = await checkGenericAccountsExist();
      const goldExists = await checkGoldAccountsExist();
      setAccountsInitialized(genericExists);
      setGoldAccountsInitialized(goldExists);
    };
    if (companyId) {
      checkAccounts();
    }
  }, [companyId]);

  useEffect(() => {
    setAlerts(getAccountingAlerts());
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="accounting-dashboard p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">💰 Jewelry Accounting Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin/accounting/chart-of-accounts')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              <FolderTree size={20} />
              Chart of Accounts
            </button>
            <button
              onClick={() => router.push('/admin/accounting/general-ledger')}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              <BookOpen size={20} />
              General Ledger
            </button>
            <button
              onClick={() => router.push('/admin/accounting/balance-sheet')}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              <Scale size={20} />
              Balance Sheet
            </button>
            <button
              onClick={() => router.push('/admin/accounting/quick-transfer')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              <ArrowRightLeft size={20} />
              Quick Transfer
            </button>
            <button
              onClick={() => router.push('/admin/accounting/journal-entries')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <BookOpen size={20} />
              Journal Entries
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Gold Smith Wholesaler | Fiscal Year: 2025-26 | As of: {new Date().toLocaleDateString('en-IN')}
          </p>
          <div className="flex space-x-2">
            <select
              value={currentPeriod}
              onChange={(e) => setCurrentPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gold Smith Account Initialization */}
      {!goldAccountsInitialized && userRole === 'company_admin' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>💎 Gold Smith Accounting Setup</strong>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Gold Smith specific accounts not found. Initialize pure gold accounting system:
              </p>
              <div className="mt-3">
                <button
                  onClick={initializeGoldSmithAccounts}
                  disabled={initializingGold}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50"
                >
                  {initializingGold ? 'Initializing...' : '💎 Initialize Gold Smith Accounts (15)'}
                </button>
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                Creates: Gold Bank (Sharaf), Gold in Transit, Customer Receivables (gold grams), Commission Income, Making Charges, etc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generic Account Initialization - TEMPORARILY HIDDEN (for reuse in other projects) */}
      {false && !accountsInitialized && userRole === 'company_admin' && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>📊 Generic Business Accounting Setup</strong>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Generic business accounts not found. Initialize standard accounting system:
              </p>
              <div className="mt-3">
                <button
                  onClick={initializeGenericAccounts}
                  disabled={initializing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50"
                >
                  {initializing ? 'Initializing...' : '📊 Initialize Generic Accounts (43)'}
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Creates: Cash, Bank, Inventory, GST, Accounts Receivable/Payable, P&L accounts for any business.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content - Only show when any accounts are initialized */}
      {(accountsInitialized || goldAccountsInitialized) && (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="💵 Cash Position"
              value={financialData.cashPosition}
              trend="+8%"
              color="green"
            />
            <MetricCard
              title="💎 Jewelry Sales"
              value={financialData.revenue}
              trend="+15%"
              color="blue"
            />
            <MetricCard
              title="🏪 Operating Expenses"
          value={financialData.expenses}
          trend="+12%"
          color="red"
        />
        <MetricCard
          title="💰 Commission Income"
          value={financialData.commissionIncome || 0}
          trend="+18%"
          color="purple"
        />
      </div>

      {/* P&L Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">📊 PROFIT & LOSS STATEMENT (Jewelry Business Performance)</h2>
        <PLStatement data={financialData.plData} />
      </div>

      {/* Balance Sheet */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">📈 BALANCE SHEET (Gold Smith Financial Position)</h2>
        <BalanceSheet data={financialData.balanceSheet} />
      </div>

      {/* Key Ratios & Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">📊 JEWELRY BUSINESS METRICS & RATIOS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <MetricCard
            title="Current Ratio"
            value={financialData.ratios.currentRatio}
            trend="+0.1 MoM"
            color="blue"
          />
          <MetricCard
            title="Commission Margin"
            value={financialData.commissionMargin || 0}
            trend="+2.5%"
            color="green"
          />
          <MetricCard
            title="Metal Inventory Turnover"
            value={financialData.metalTurnover || 0}
            trend="+0.3 MoM"
            color="yellow"
          />
          <MetricCard
            title="Gross Margin"
            value={financialData.ratios.grossMargin}
            trend="+2% MoM"
            color="purple"
          />
        </div>
      </div>

      {/* Accounting Alerts */}
      <div className="mb-8">
        <AccountingAlerts alerts={alerts} />
      </div>

      {/* Accounting Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">🛠️ ACCOUNTING ACTIONS (Quick Access)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/accounting/journal-entries"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center"
          >
            📝 New Journal Entry
          </a>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors">
            💳 Record Payment
          </button>
          <a
            href="/admin/accounting/reports"
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center"
          >
            📊 View Reports
          </a>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-colors">
            📄 Generate Invoice
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
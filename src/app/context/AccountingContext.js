"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/app/firebase';

const AccountingContext = createContext();

export function AccountingProvider({ children }) {
  const [companyId] = useState(process.env.NEXT_PUBLIC_COMPANY_ID || 'laundry_q8');
  const [userRole] = useState('company_admin'); // This should come from auth context
  const [financialData, setFinancialData] = useState({
    cashPosition: 0,
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    plData: [],
    balanceSheet: {
      assets: { current: 0, fixed: 0, total: 0 },
      liabilities: { current: 0, longTerm: 0, total: 0 },
      equity: 0
    },
    ratios: {
      currentRatio: 0,
      quickRatio: 0,
      debtToEquity: 0,
      grossMargin: 0
    }
  });
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listeners for accounting data
  useEffect(() => {
    if (!companyId) return;

    const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
    const transactionsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/transactions`;

    // Accounts listener
    const accountsQuery = query(collection(db, accountsPath), orderBy('accountId'));
    const unsubscribeAccounts = onSnapshot(accountsQuery, (snapshot) => {
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAccounts(accountsData);
      calculateFinancialMetrics(accountsData, transactions);
    });

    // Transactions listener (last 30 days for performance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactionsQuery = query(
      collection(db, transactionsPath),
      where('date', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('date', 'desc')
    );
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transactionsData);
      calculateFinancialMetrics(accounts, transactionsData);
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeTransactions();
    };
  }, [companyId]);

  // Calculate financial metrics from accounts and transactions
  const calculateFinancialMetrics = (accountsData, transactionsData) => {
    // Calculate account balances from transactions
    const accountBalances = {};
    accountsData.forEach(account => {
      accountBalances[account.accountId] = account.openingBalance || 0;
    });

    // Process transactions to update balances
    transactionsData.forEach(transaction => {
      if (transaction.debitAccountId && accountBalances[transaction.debitAccountId] !== undefined) {
        accountBalances[transaction.debitAccountId] += transaction.amount;
      }
      if (transaction.creditAccountId && accountBalances[transaction.creditAccountId] !== undefined) {
        accountBalances[transaction.creditAccountId] -= transaction.amount;
      }
    });

    // Calculate financial overview
    const cashAccounts = accountsData.filter(acc => acc.accountType === 'Asset' && acc.accountName.toLowerCase().includes('cash'));
    const revenueAccounts = accountsData.filter(acc => acc.accountType === 'Revenue');
    const expenseAccounts = accountsData.filter(acc => acc.accountType === 'Expense');

    const cashPosition = cashAccounts.reduce((sum, acc) => sum + (accountBalances[acc.accountId] || 0), 0);
    const revenue = revenueAccounts.reduce((sum, acc) => sum + (accountBalances[acc.accountId] || 0), 0);
    const expenses = expenseAccounts.reduce((sum, acc) => sum + Math.abs(accountBalances[acc.accountId] || 0), 0);
    const netProfit = revenue - expenses;

    // Calculate balance sheet
    const assetAccounts = accountsData.filter(acc => acc.accountType === 'Asset');
    const liabilityAccounts = accountsData.filter(acc => acc.accountType === 'Liability');
    const equityAccounts = accountsData.filter(acc => acc.accountType === 'Equity');

    const totalAssets = assetAccounts.reduce((sum, acc) => sum + (accountBalances[acc.accountId] || 0), 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) => sum + Math.abs(accountBalances[acc.accountId] || 0), 0);
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + (accountBalances[acc.accountId] || 0), 0);

    // Current vs Fixed Assets (simplified categorization)
    const currentAssets = assetAccounts
      .filter(acc => acc.accountName.toLowerCase().includes('cash') || acc.accountName.toLowerCase().includes('inventory'))
      .reduce((sum, acc) => sum + (accountBalances[acc.accountId] || 0), 0);
    const fixedAssets = totalAssets - currentAssets;

    // Current vs Long-term Liabilities (simplified)
    const currentLiabilities = liabilityAccounts
      .filter(acc => acc.accountName.toLowerCase().includes('payable') || acc.accountName.toLowerCase().includes('accrued'))
      .reduce((sum, acc) => sum + Math.abs(accountBalances[acc.accountId] || 0), 0);
    const longTermLiabilities = totalLiabilities - currentLiabilities;

    // Calculate ratios
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities > 0 ? (currentAssets - (totalAssets * 0.1)) / currentLiabilities : 0; // Simplified quick assets
    const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
    const grossMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;

    // P&L data for charts
    const plData = [
      { name: 'Sales Revenue', current: revenue, previous: revenue * 0.88 }, // Mock previous month
      { name: 'COGS', current: expenses * 0.67, previous: expenses * 0.67 * 0.92 },
      { name: 'Gross Profit', current: revenue - expenses * 0.67, previous: (revenue * 0.88) - (expenses * 0.67 * 0.92) },
      { name: 'Operating Expenses', current: expenses * 0.33, previous: expenses * 0.33 * 0.95 },
      { name: 'Net Profit', current: netProfit, previous: netProfit * 0.88 }
    ];

    setFinancialData({
      cashPosition,
      revenue,
      expenses,
      netProfit,
      plData,
      balanceSheet: {
        assets: { current: currentAssets, fixed: fixedAssets, total: totalAssets },
        liabilities: { current: currentLiabilities, longTerm: longTermLiabilities, total: totalLiabilities },
        equity: totalEquity
      },
      ratios: {
        currentRatio,
        quickRatio,
        debtToEquity,
        grossMargin
      }
    });

    setLoading(false);
  };

  // Get pending tasks and alerts
  const getAccountingAlerts = () => {
    // Mock alerts - in real implementation, this would check for:
    // - Unpaid invoices
    // - Due bills
    // - Tax payments
    // - Low cash alerts
    return {
      pendingTasks: [
        { type: 'invoice', count: 3, description: '3 invoices unpaid' },
        { type: 'bill', count: 2, description: '2 bills due' },
        { type: 'tax', count: 1, description: 'Tax payment due' }
      ],
      recentEntries: [
        { type: 'sale', amount: 45000, description: 'Sales: ₹45,000' },
        { type: 'expense', amount: 12000, description: 'Expense: ₹12,000' },
        { type: 'transfer', amount: 25000, description: 'Transfer: ₹25,000' }
      ]
    };
  };

  const value = {
    companyId,
    userRole,
    financialData,
    accounts,
    transactions,
    loading,
    getAccountingAlerts,
    calculateFinancialMetrics
  };

  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  );
}

export function useAccounting() {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
}
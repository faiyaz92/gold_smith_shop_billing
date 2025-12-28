// Accounting Engine for Financial Calculations
// Based on BRD_v2.md Section 6.1-6.4 Accounting Engine Requirements

export class AccountingEngine {
  constructor(companyId) {
    this.companyId = companyId;
    this.accountHierarchy = {
      // Asset Accounts (1001-1999)
      'MAIN-1001': { type: 'Asset', level: 1, parent: null, name: 'Cash in Hand' },
      'MAIN-1002': { type: 'Asset', level: 1, parent: null, name: 'Bank Accounts' },
      'MAIN-1003': { type: 'Asset', level: 1, parent: null, name: 'Accounts Receivable' },
      'MAIN-1004': { type: 'Asset', level: 1, parent: null, name: 'Inventory' },
      'MAIN-1005': { type: 'Asset', level: 1, parent: null, name: 'Fixed Assets' },

      // Liability Accounts (2001-2999)
      'MAIN-2001': { type: 'Liability', level: 1, parent: null, name: 'Accounts Payable' },
      'MAIN-2002': { type: 'Liability', level: 1, parent: null, name: 'Loans Payable' },
      'MAIN-2003': { type: 'Liability', level: 1, parent: null, name: 'Taxes Payable' },

      // Equity Accounts (3001-3999)
      'MAIN-3001': { type: 'Equity', level: 1, parent: null, name: 'Owner Capital' },
      'MAIN-3002': { type: 'Equity', level: 1, parent: null, name: 'Retained Earnings' },

      // Revenue Accounts (4001-4999)
      'MAIN-4001': { type: 'Revenue', level: 1, parent: null, name: 'Sales Revenue' },
      'MAIN-4002': { type: 'Revenue', level: 1, parent: null, name: 'Service Revenue' },
      'MAIN-4003': { type: 'Revenue', level: 1, parent: null, name: 'Other Income' },

      // Expense Accounts (5001-5999)
      'MAIN-5001': { type: 'Expense', level: 1, parent: null, name: 'Cost of Goods Sold' },
      'MAIN-5002': { type: 'Expense', level: 1, parent: null, name: 'Operating Expenses' },
      'MAIN-5003': { type: 'Expense', level: 1, parent: null, name: 'Depreciation' },
      'MAIN-5004': { type: 'Expense', level: 1, parent: null, name: 'Taxes' },
      'MAIN-5005': { type: 'Expense', level: 1, parent: null, name: 'Interest Expense' },
      'MAIN-5006': { type: 'Expense', level: 1, parent: null, name: 'Other Expenses' },
      'MAIN-5007': { type: 'Expense', level: 1, parent: null, name: 'Administrative Expenses' }
    };
  }

  /**
   * Calculate account balance from transactions
   * @param {Array} transactions - Array of transaction objects
   * @param {string} accountId - Account ID to calculate balance for
   * @returns {number} Account balance
   */
  calculateAccountBalance(transactions, accountId) {
    const account = this.accountHierarchy[accountId];
    if (!account) return 0;

    let balance = 0;

    transactions.forEach(transaction => {
      if (transaction.debitAccountId === accountId) {
        balance += transaction.amount;
      }
      if (transaction.creditAccountId === accountId) {
        balance -= transaction.amount;
      }
    });

    return balance;
  }

  /**
   * Calculate Profit & Loss statement
   * @param {Array} accounts - Array of account objects
   * @param {Array} transactions - Array of transaction objects
   * @param {Date} startDate - Start date for P&L
   * @param {Date} endDate - End date for P&L
   * @returns {Object} P&L statement data
   */
  calculatePLStatement(accounts, transactions, startDate, endDate) {
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = t.date?.toDate?.() || new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Calculate revenues
    const revenueAccounts = accounts.filter(acc => acc.accountType === 'Revenue');
    const totalRevenue = revenueAccounts.reduce((sum, acc) =>
      sum + this.calculateAccountBalance(filteredTransactions, acc.accountId), 0);

    // Calculate expenses
    const expenseAccounts = accounts.filter(acc => acc.accountType === 'Expense');
    const totalExpenses = expenseAccounts.reduce((sum, acc) =>
      sum + Math.abs(this.calculateAccountBalance(filteredTransactions, acc.accountId)), 0);

    // Calculate COGS (subset of expenses)
    const cogsAccounts = expenseAccounts.filter(acc =>
      acc.accountName.toLowerCase().includes('cost of goods'));
    const cogs = cogsAccounts.reduce((sum, acc) =>
      sum + Math.abs(this.calculateAccountBalance(filteredTransactions, acc.accountId)), 0);

    const grossProfit = totalRevenue - cogs;
    const operatingExpenses = totalExpenses - cogs;
    const netProfit = totalRevenue - totalExpenses;

    return {
      revenue: totalRevenue,
      cogs: cogs,
      grossProfit: grossProfit,
      operatingExpenses: operatingExpenses,
      netProfit: netProfit,
      details: {
        revenues: revenueAccounts.map(acc => ({
          accountId: acc.accountId,
          name: acc.accountName,
          amount: this.calculateAccountBalance(filteredTransactions, acc.accountId)
        })),
        expenses: expenseAccounts.map(acc => ({
          accountId: acc.accountId,
          name: acc.accountName,
          amount: Math.abs(this.calculateAccountBalance(filteredTransactions, acc.accountId))
        }))
      }
    };
  }

  /**
   * Calculate Balance Sheet
   * @param {Array} accounts - Array of account objects
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Balance sheet data
   */
  calculateBalanceSheet(accounts, transactions) {
    // Assets
    const assetAccounts = accounts.filter(acc => acc.accountType === 'Asset');
    const totalAssets = assetAccounts.reduce((sum, acc) =>
      sum + this.calculateAccountBalance(transactions, acc.accountId), 0);

    // Current Assets (Cash, AR, Inventory)
    const currentAssetAccounts = assetAccounts.filter(acc =>
      acc.accountName.toLowerCase().includes('cash') ||
      acc.accountName.toLowerCase().includes('receivable') ||
      acc.accountName.toLowerCase().includes('inventory'));
    const currentAssets = currentAssetAccounts.reduce((sum, acc) =>
      sum + this.calculateAccountBalance(transactions, acc.accountId), 0);

    const fixedAssets = totalAssets - currentAssets;

    // Liabilities
    const liabilityAccounts = accounts.filter(acc => acc.accountType === 'Liability');
    const totalLiabilities = liabilityAccounts.reduce((sum, acc) =>
      sum + Math.abs(this.calculateAccountBalance(transactions, acc.accountId)), 0);

    // Current Liabilities (AP, short-term loans)
    const currentLiabilityAccounts = liabilityAccounts.filter(acc =>
      acc.accountName.toLowerCase().includes('payable') ||
      acc.accountName.toLowerCase().includes('accrued'));
    const currentLiabilities = currentLiabilityAccounts.reduce((sum, acc) =>
      sum + Math.abs(this.calculateAccountBalance(transactions, acc.accountId)), 0);

    const longTermLiabilities = totalLiabilities - currentLiabilities;

    // Equity
    const equityAccounts = accounts.filter(acc => acc.accountType === 'Equity');
    const totalEquity = equityAccounts.reduce((sum, acc) =>
      sum + this.calculateAccountBalance(transactions, acc.accountId), 0);

    return {
      assets: {
        current: currentAssets,
        fixed: fixedAssets,
        total: totalAssets
      },
      liabilities: {
        current: currentLiabilities,
        longTerm: longTermLiabilities,
        total: totalLiabilities
      },
      equity: totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };
  }

  /**
   * Calculate financial ratios
   * @param {Object} balanceSheet - Balance sheet data
   * @param {Object} plStatement - P&L statement data
   * @returns {Object} Financial ratios
   */
  calculateRatios(balanceSheet, plStatement) {
    const { assets, liabilities, equity } = balanceSheet;
    const { revenue, grossProfit } = plStatement;

    return {
      currentRatio: liabilities.current > 0 ? assets.current / liabilities.current : 0,
      quickRatio: liabilities.current > 0 ? (assets.current - (assets.total * 0.1)) / liabilities.current : 0, // Simplified
      debtToEquityRatio: equity > 0 ? liabilities.total / equity : 0,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      returnOnAssets: assets.total > 0 ? (plStatement.netProfit / assets.total) * 100 : 0,
      returnOnEquity: equity > 0 ? (plStatement.netProfit / equity) * 100 : 0
    };
  }

  /**
   * Create a double-entry transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Object} Formatted transaction
   */
  createTransaction(transactionData) {
    const {
      debitAccountId,
      creditAccountId,
      amount,
      description,
      referenceType,
      referenceId,
      companyId
    } = transactionData;

    if (!debitAccountId || !creditAccountId || !amount) {
      throw new Error('Debit account, credit account, and amount are required');
    }

    if (amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }

    return {
      transactionId: `TXN-${Date.now()}`,
      companyId: companyId || this.companyId,
      date: new Date(),
      debitAccountId,
      creditAccountId,
      amount,
      description: description || '',
      referenceType: referenceType || 'manual',
      referenceId: referenceId || '',
      createdAt: new Date(),
      createdBy: 'system', // Should come from auth
      _version: "2.0",
      _migrationStatus: "active",
      _v3Ready: true,
      _v4Ready: false,
      _shardKey: `${companyId}_shard1`,
      _partitionKey: companyId,
      _region: "asia-south1"
    };
  }

  /**
   * Validate transaction for double-entry accounting rules
   * @param {Object} transaction - Transaction to validate
   * @returns {boolean} Is valid
   */
  validateTransaction(transaction) {
    // Check if accounts exist
    if (!this.accountHierarchy[transaction.debitAccountId] ||
        !this.accountHierarchy[transaction.creditAccountId]) {
      return false;
    }

    // Check amount is positive
    if (transaction.amount <= 0) {
      return false;
    }

    // Check accounts are different
    if (transaction.debitAccountId === transaction.creditAccountId) {
      return false;
    }

    return true;
  }
}
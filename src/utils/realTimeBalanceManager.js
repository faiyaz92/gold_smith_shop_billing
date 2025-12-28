/**
 * Real-Time Balance Update System
 * Provides real-time synchronization of account balances across the application
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Key Features:
 * - Firebase real-time listeners for balance changes
 * - Automatic balance propagation and recalculation
 * - Real-time UI updates and notifications
 * - Cache management and invalidation
 * - Event-driven balance synchronization
 */

import { db } from '../app/firebase.js';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';

// Utility function to get firestore paths (non-hook version)
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    getAccountsPath: () => `${tenantCompaniesPath}/${companyId}/accounts`,
    getTransactionsPath: () => `${tenantCompaniesPath}/${companyId}/transactions`,
    getInvoicesPath: () => `${tenantCompaniesPath}/${companyId}/invoices`,
    getPaymentsPath: () => `${tenantCompaniesPath}/${companyId}/payments`,
    getCashMemosPath: () => `${tenantCompaniesPath}/${companyId}/cashMemos`
  };
};

import { BalanceCalculationEngine } from './balanceCalculationEngine.js';

export class RealTimeBalanceManager {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
    this.balanceEngine = new BalanceCalculationEngine(companyId);
    this.listeners = new Map();
    this.callbacks = new Map();
    this.isActive = false;
  }

  /**
   * Start real-time balance monitoring
   * Sets up listeners for account balance changes
   */
  startRealTimeUpdates() {
    if (this.isActive) {
      console.log('Real-time balance updates already active');
      return;
    }

    console.log('Starting real-time balance updates...');
    this.isActive = true;

    // Listen for account balance changes
    this.setupAccountBalanceListeners();

    // Listen for new transactions
    this.setupTransactionListeners();

    console.log('✅ Real-time balance updates started');
  }

  /**
   * Stop real-time balance monitoring
   */
  stopRealTimeUpdates() {
    if (!this.isActive) {
      return;
    }

    console.log('Stopping real-time balance updates...');

    // Unsubscribe from all listeners
    this.listeners.forEach((unsubscribe, key) => {
      unsubscribe();
    });
    this.listeners.clear();
    this.callbacks.clear();
    this.isActive = false;

    console.log('✅ Real-time balance updates stopped');
  }

  /**
   * Setup listeners for account balance changes
   */
  setupAccountBalanceListeners() {
    const accountsRef = collection(db, this.paths.getAccountsPath());

    // Listen for changes to all accounts
    const unsubscribe = onSnapshot(accountsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const accountData = change.doc.data();
          const accountCode = change.doc.id;

          // Check if balance changed
          if (change.oldIndex !== -1) {
            const oldData = snapshot.docs[change.oldIndex]?.data();
            const oldBalance = oldData?.balance || 0;
            const newBalance = accountData.balance || 0;

            if (Math.abs(oldBalance - newBalance) > 0.01) {
              this.handleBalanceChange(accountCode, accountData, oldBalance, newBalance);
            }
          }
        }
      });
    });

    this.listeners.set('accounts', unsubscribe);
  }

  /**
   * Setup listeners for new transactions
   */
  setupTransactionListeners() {
    const transactionsRef = collection(db, this.paths.getTransactionsPath());

    // Listen for new transactions (ordered by creation time, limit to recent)
    const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const transactionData = change.doc.data();
          this.handleNewTransaction(change.doc.id, transactionData);
        }
      });
    });

    this.listeners.set('transactions', unsubscribe);
  }

  /**
   * Handle account balance change
   * @param {string} accountCode - Account that changed
   * @param {object} accountData - New account data
   * @param {number} oldBalance - Previous balance
   * @param {number} newBalance - New balance
   */
  async handleBalanceChange(accountCode, accountData, oldBalance, newBalance) {
    try {
      console.log(`Balance changed for ${accountCode}: ${oldBalance} → ${newBalance}`);

      // Notify registered callbacks
      this.notifyCallbacks('balanceChanged', {
        accountCode,
        accountData,
        oldBalance,
        newBalance,
        change: newBalance - oldBalance
      });

      // Trigger dependent calculations
      await this.updateDependentCalculations(accountCode);

    } catch (error) {
      console.error(`Error handling balance change for ${accountCode}:`, error);
    }
  }

  /**
   * Handle new transaction
   * @param {string} transactionId - Transaction ID
   * @param {object} transactionData - Transaction data
   */
  async handleNewTransaction(transactionId, transactionData) {
    try {
      console.log(`New transaction: ${transactionId} - ${transactionData.description}`);

      // Notify registered callbacks
      this.notifyCallbacks('transactionAdded', {
        transactionId,
        transactionData
      });

      // Validate accounting equation after transaction
      await this.validatePostTransactionEquation();

    } catch (error) {
      console.error(`Error handling new transaction ${transactionId}:`, error);
    }
  }

  /**
   * Update calculations that depend on balance changes
   * @param {string} accountCode - Account that changed
   */
  async updateDependentCalculations(accountCode) {
    try {
      // Get account hierarchy to determine what needs recalculation
      const hierarchyPath = await this.balanceEngine.accountManager.getAccountHierarchyPath(accountCode);

      // Update financial ratios and KPIs that depend on these accounts
      const affectedAccounts = hierarchyPath.map(acc => acc.accountCode);

      // Notify callbacks about dependent calculation updates
      this.notifyCallbacks('dependentCalculationsUpdated', {
        affectedAccounts,
        triggerAccount: accountCode
      });

    } catch (error) {
      console.error('Error updating dependent calculations:', error);
    }
  }

  /**
   * Validate accounting equation after transactions
   */
  async validatePostTransactionEquation() {
    try {
      // Quick validation of accounting equation
      const equationValid = await this.quickEquationCheck();

      if (!equationValid) {
        console.warn('⚠️ Accounting equation imbalance detected after transaction');
        this.notifyCallbacks('equationImbalance', {
          timestamp: new Date(),
          message: 'Accounting equation may be imbalanced'
        });
      }

    } catch (error) {
      console.error('Error validating post-transaction equation:', error);
    }
  }

  /**
   * Quick check of accounting equation
   * @returns {boolean} - True if equation is balanced
   */
  async quickEquationCheck() {
    try {
      const assets = await this.balanceEngine.calculateAccountBalance('MAIN-1000') || 0;
      const liabilities = await this.balanceEngine.calculateAccountBalance('MAIN-2000') || 0;
      const equity = await this.balanceEngine.calculateAccountBalance('MAIN-3000') || 0;

      const difference = Math.abs(assets - (liabilities + equity));
      return difference < 0.01;

    } catch (error) {
      console.error('Quick equation check error:', error);
      return false;
    }
  }

  /**
   * Register callback for real-time events
   * @param {string} eventType - Event type to listen for
   * @param {function} callback - Callback function
   * @param {string} callbackId - Unique callback identifier
   */
  on(eventType, callback, callbackId) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, new Map());
    }

    this.callbacks.get(eventType).set(callbackId, callback);
  }

  /**
   * Unregister callback
   * @param {string} eventType - Event type
   * @param {string} callbackId - Callback identifier
   */
  off(eventType, callbackId) {
    if (this.callbacks.has(eventType)) {
      this.callbacks.get(eventType).delete(callbackId);
    }
  }

  /**
   * Notify registered callbacks
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  notifyCallbacks(eventType, data) {
    if (this.callbacks.has(eventType)) {
      this.callbacks.get(eventType).forEach((callback, id) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in callback ${id} for event ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get real-time balance for an account
   * @param {string} accountCode - Account code
   * @returns {Promise<number>} - Current balance
   */
  async getRealTimeBalance(accountCode) {
    return await this.balanceEngine.calculateAccountBalance(accountCode);
  }

  /**
   * Get real-time financial summary
   * @returns {Promise<object>} - Financial summary
   */
  async getRealTimeFinancialSummary() {
    try {
      const [assets, liabilities, equity, revenue, expenses] = await Promise.all([
        this.getRealTimeBalance('MAIN-1000'),
        this.getRealTimeBalance('MAIN-2000'),
        this.getRealTimeBalance('MAIN-3000'),
        this.getRealTimeBalance('MAIN-4000'),
        this.getRealTimeBalance('MAIN-5000')
      ]);

      const netIncome = (revenue || 0) - (expenses || 0);
      const totalEquity = (equity || 0) + netIncome;

      return {
        assets: assets || 0,
        liabilities: liabilities || 0,
        equity: totalEquity,
        revenue: revenue || 0,
        expenses: expenses || 0,
        netIncome,
        equationBalanced: Math.abs((assets || 0) - ((liabilities || 0) + totalEquity)) < 0.01
      };

    } catch (error) {
      console.error('Error getting real-time financial summary:', error);
      throw error;
    }
  }

  /**
   * Force refresh of all balance calculations
   * Useful for manual synchronization
   */
  async forceBalanceRefresh() {
    try {
      console.log('Forcing balance refresh...');
      await this.balanceEngine.recalculateAllBalances();

      this.notifyCallbacks('balanceRefresh', {
        timestamp: new Date(),
        message: 'All balances recalculated'
      });

      console.log('✅ Balance refresh completed');

    } catch (error) {
      console.error('Error forcing balance refresh:', error);
      throw error;
    }
  }
}
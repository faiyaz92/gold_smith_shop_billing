/**
 * Real-Time Balance Update Utilities
 * Helper functions for managing real-time balance synchronization
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Usage: Call functions to setup and manage real-time balance updates
 */

import { RealTimeBalanceManager } from './realTimeBalanceManager.js';

/**
 * Initialize real-time balance updates for a company
 * @param {string} companyId - Company identifier
 * @returns {RealTimeBalanceManager} - Manager instance
 */
export function initializeRealTimeBalances(companyId) {
  const manager = new RealTimeBalanceManager(companyId);
  manager.startRealTimeUpdates();

  console.log(`Real-time balance updates initialized for company: ${companyId}`);
  return manager;
}

/**
 * Setup real-time balance monitoring with callbacks
 * @param {string} companyId - Company identifier
 * @param {object} callbacks - Callback functions
 * @returns {RealTimeBalanceManager} - Manager instance
 */
export function setupRealTimeBalanceMonitoring(companyId, callbacks = {}) {
  const manager = new RealTimeBalanceManager(companyId);

  // Register callbacks
  if (callbacks.onBalanceChanged) {
    manager.on('balanceChanged', callbacks.onBalanceChanged, 'balanceMonitor');
  }

  if (callbacks.onTransactionAdded) {
    manager.on('transactionAdded', callbacks.onTransactionAdded, 'transactionMonitor');
  }

  if (callbacks.onEquationImbalance) {
    manager.on('equationImbalance', callbacks.onEquationImbalance, 'equationMonitor');
  }

  if (callbacks.onCalculationsUpdated) {
    manager.on('dependentCalculationsUpdated', callbacks.onCalculationsUpdated, 'calculationsMonitor');
  }

  if (callbacks.onBalanceRefresh) {
    manager.on('balanceRefresh', callbacks.onBalanceRefresh, 'refreshMonitor');
  }

  manager.startRealTimeUpdates();

  console.log(`Real-time balance monitoring setup for company: ${companyId}`);
  return manager;
}

/**
 * Get real-time account balance
 * @param {string} companyId - Company identifier
 * @param {string} accountCode - Account code
 * @returns {Promise<number>} - Current balance
 */
export async function getRealTimeAccountBalance(companyId, accountCode) {
  const manager = new RealTimeBalanceManager(companyId);
  return await manager.getRealTimeBalance(accountCode);
}

/**
 * Get real-time financial summary
 * @param {string} companyId - Company identifier
 * @returns {Promise<object>} - Financial summary
 */
export async function getRealTimeFinancialSummary(companyId) {
  const manager = new RealTimeBalanceManager(companyId);
  return await manager.getRealTimeFinancialSummary();
}

/**
 * Force balance refresh across all accounts
 * @param {string} companyId - Company identifier
 * @returns {Promise<void>}
 */
export async function forceBalanceRefresh(companyId) {
  const manager = new RealTimeBalanceManager(companyId);
  await manager.forceBalanceRefresh();
}

/**
 * Create balance change listener for UI components
 * @param {string} companyId - Company identifier
 * @param {function} onBalanceChange - Callback for balance changes
 * @param {function} onTransaction - Callback for new transactions
 * @returns {RealTimeBalanceManager} - Manager instance
 */
export function createBalanceChangeListener(companyId, onBalanceChange, onTransaction) {
  return setupRealTimeBalanceMonitoring(companyId, {
    onBalanceChanged: (data) => {
      console.log(`Balance changed: ${data.accountCode} ${data.oldBalance} → ${data.newBalance}`);
      if (onBalanceChange) {
        onBalanceChange(data);
      }
    },
    onTransactionAdded: (data) => {
      console.log(`New transaction: ${data.transactionId}`);
      if (onTransaction) {
        onTransaction(data);
      }
    }
  });
}

/**
 * Monitor accounting equation health
 * @param {string} companyId - Company identifier
 * @param {function} onImbalance - Callback for equation imbalances
 * @returns {RealTimeBalanceManager} - Manager instance
 */
export function monitorAccountingEquation(companyId, onImbalance) {
  return setupRealTimeBalanceMonitoring(companyId, {
    onEquationImbalance: (data) => {
      console.warn('Accounting equation imbalance detected:', data.message);
      if (onImbalance) {
        onImbalance(data);
      }
    }
  });
}

/**
 * Setup dashboard real-time updates
 * @param {string} companyId - Company identifier
 * @param {object} dashboardCallbacks - Dashboard update callbacks
 * @returns {RealTimeBalanceManager} - Manager instance
 */
export function setupDashboardRealTimeUpdates(companyId, dashboardCallbacks = {}) {
  return setupRealTimeBalanceMonitoring(companyId, {
    onBalanceChanged: (data) => {
      // Update dashboard balance displays
      if (dashboardCallbacks.updateBalance) {
        dashboardCallbacks.updateBalance(data.accountCode, data.newBalance);
      }
    },
    onTransactionAdded: (data) => {
      // Update dashboard transaction feeds
      if (dashboardCallbacks.addTransaction) {
        dashboardCallbacks.addTransaction(data.transactionData);
      }
    },
    onCalculationsUpdated: (data) => {
      // Refresh dashboard calculations
      if (dashboardCallbacks.refreshCalculations) {
        dashboardCallbacks.refreshCalculations(data.affectedAccounts);
      }
    }
  });
}

/**
 * Setup real-time balance alerts
 * @param {string} companyId - Company identifier
 * @param {object} alertConfig - Alert configuration
 * @returns {RealTimeBalanceManager} - Manager instance
 */
export function setupBalanceAlerts(companyId, alertConfig = {}) {
  return setupRealTimeBalanceMonitoring(companyId, {
    onBalanceChanged: (data) => {
      const change = data.change;

      // Check for significant balance changes
      if (alertConfig.significantChangeThreshold &&
          Math.abs(change) >= alertConfig.significantChangeThreshold) {
        console.log(`🚨 Significant balance change: ${data.accountCode} changed by ${change}`);
        if (alertConfig.onSignificantChange) {
          alertConfig.onSignificantChange(data);
        }
      }

      // Check for negative balances (if not allowed)
      if (!alertConfig.allowNegativeBalances && data.newBalance < 0) {
        console.warn(`⚠️ Negative balance alert: ${data.accountCode} = ${data.newBalance}`);
        if (alertConfig.onNegativeBalance) {
          alertConfig.onNegativeBalance(data);
        }
      }
    },
    onEquationImbalance: (data) => {
      console.error('🚨 Accounting equation imbalance alert!');
      if (alertConfig.onEquationImbalance) {
        alertConfig.onEquationImbalance(data);
      }
    }
  });
}

/**
 * Cleanup real-time balance manager
 * @param {RealTimeBalanceManager} manager - Manager instance to cleanup
 */
export function cleanupRealTimeBalanceManager(manager) {
  if (manager && typeof manager.stopRealTimeUpdates === 'function') {
    manager.stopRealTimeUpdates();
    console.log('Real-time balance manager cleaned up');
  }
}

/**
 * Test real-time balance functionality
 * @param {string} companyId - Company identifier
 * @returns {Promise<object>} - Test results
 */
export async function testRealTimeBalanceFunctionality(companyId) {
  const results = {
    balanceRetrieval: false,
    financialSummary: false,
    balanceRefresh: false,
    error: null
  };

  try {
    console.log('Testing real-time balance functionality...');

    // Test 1: Balance retrieval
    const balance = await getRealTimeAccountBalance(companyId, 'MAIN-1001');
    results.balanceRetrieval = typeof balance === 'number';

    // Test 2: Financial summary
    const summary = await getRealTimeFinancialSummary(companyId);
    results.financialSummary = typeof summary === 'object' && summary.assets !== undefined;

    // Test 3: Balance refresh
    await forceBalanceRefresh(companyId);
    results.balanceRefresh = true;

    console.log('✅ Real-time balance functionality tests passed');

  } catch (error) {
    console.error('Real-time balance functionality test failed:', error);
    results.error = error.message;
  }

  return results;
}
/**
 * Accounting Engine Utilities with Parent Rollup
 * Helper functions for using the enhanced AccountingEngine
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Usage: Call functions to perform transactions with automatic parent rollup
 */

import { AccountingEngine } from './accountingEngine.js';

/**
 * Record a sale transaction with automatic rollup
 * @param {string} companyId - Company identifier
 * @param {object} orderData - Order data
 * @returns {object} - Transaction result
 */
export async function recordSaleWithRollup(companyId, orderData) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log(`Recording sale transaction for order ${orderData.orderId}`);
    const result = await accountingEngine.recordSaleTransaction(orderData);

    console.log(`✅ Sale transaction recorded: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error('Record sale with rollup error:', error);
    throw error;
  }
}

/**
 * Record COGS transaction with automatic rollup
 * @param {string} companyId - Company identifier
 * @param {object} orderData - Order data with COGS
 * @returns {object} - Transaction result
 */
export async function recordCOGSWithRollup(companyId, orderData) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log(`Recording COGS transaction for order ${orderData.orderId}`);
    const result = await accountingEngine.recordCOGSTransaction(orderData);

    console.log(`✅ COGS transaction recorded: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error('Record COGS with rollup error:', error);
    throw error;
  }
}

/**
 * Record customer payment with automatic rollup
 * @param {string} companyId - Company identifier
 * @param {object} paymentData - Payment data
 * @returns {object} - Transaction result
 */
export async function recordCustomerPaymentWithRollup(companyId, paymentData) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log(`Recording customer payment for ${paymentData.customerId}`);
    const result = await accountingEngine.recordCustomerPayment(paymentData);

    console.log(`✅ Customer payment recorded: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error('Record customer payment with rollup error:', error);
    throw error;
  }
}

/**
 * Record supplier payment with automatic rollup
 * @param {string} companyId - Company identifier
 * @param {object} paymentData - Payment data
 * @returns {object} - Transaction result
 */
export async function recordSupplierPaymentWithRollup(companyId, paymentData) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log(`Recording supplier payment for ${paymentData.supplierId}`);
    const result = await accountingEngine.recordSupplierPayment(paymentData);

    console.log(`✅ Supplier payment recorded: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error('Record supplier payment with rollup error:', error);
    throw error;
  }
}

/**
 * Record cash purchase with automatic rollup
 * @param {string} companyId - Company identifier
 * @param {object} purchaseData - Purchase data
 * @returns {object} - Transaction result
 */
export async function recordCashPurchaseWithRollup(companyId, purchaseData) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log(`Recording cash purchase for supplier ${purchaseData.supplierId}`);
    const result = await accountingEngine.recordCashPurchaseFromSupplier(purchaseData);

    console.log(`✅ Cash purchase recorded: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error('Record cash purchase with rollup error:', error);
    throw error;
  }
}

/**
 * Record credit purchase with automatic rollup
 * @param {string} companyId - Company identifier
 * @param {object} purchaseData - Purchase data
 * @returns {object} - Transaction result
 */
export async function recordCreditPurchaseWithRollup(companyId, purchaseData) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log(`Recording credit purchase for supplier ${purchaseData.supplierId}`);
    const result = await accountingEngine.recordCreditPurchaseFromSupplier(purchaseData);

    console.log(`✅ Credit purchase recorded: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error('Record credit purchase with rollup error:', error);
    throw error;
  }
}

/**
 * Get account balance with rollup calculation
 * @param {string} companyId - Company identifier
 * @param {string} accountCode - Account code
 * @returns {number} - Current balance
 */
export async function getAccountBalanceWithRollup(companyId, accountCode) {
  try {
    const accountingEngine = new AccountingEngine(companyId);
    const balance = await accountingEngine.getAccountBalance(accountCode);

    console.log(`Balance for ${accountCode}: ${balance}`);
    return balance;

  } catch (error) {
    console.error('Get account balance with rollup error:', error);
    throw error;
  }
}

/**
 * Get account balance summary with rollup details
 * @param {string} companyId - Company identifier
 * @param {string} accountCode - Account code
 * @returns {object} - Balance summary
 */
export async function getAccountBalanceSummaryWithRollup(companyId, accountCode) {
  try {
    const accountingEngine = new AccountingEngine(companyId);
    const summary = await accountingEngine.getAccountBalanceSummary(accountCode);

    console.log(`Balance summary for ${accountCode} (${summary.accountName}):`);
    console.log(`  Total Balance: ${summary.totalBalance}`);
    console.log(`  Direct Balance: ${summary.directBalance}`);
    console.log(`  Child Balance: ${summary.childBalance}`);
    console.log(`  Children: ${summary.childCount}`);

    return summary;

  } catch (error) {
    console.error('Get account balance summary with rollup error:', error);
    throw error;
  }
}

/**
 * Validate accounting equation (Assets = Liabilities + Equity)
 * @param {string} companyId - Company identifier
 * @returns {object} - Validation result
 */
export async function validateAccountingEquation(companyId) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log('Validating accounting equation...');
    const result = await accountingEngine.validateAccountingEquation();

    if (result.isBalanced) {
      console.log('✅ Accounting equation is balanced');
      console.log(`  Assets: ${result.assets}`);
      console.log(`  Liabilities: ${result.liabilities}`);
      console.log(`  Equity: ${result.equity}`);
    } else {
      console.log('❌ Accounting equation is not balanced');
      console.log(`  ${result.message}`);
      console.log(`  Difference: ${result.difference}`);
    }

    return result;

  } catch (error) {
    console.error('Validate accounting equation error:', error);
    throw error;
  }
}

/**
 * Record general double-entry transaction with rollup
 * @param {string} companyId - Company identifier
 * @param {object} transactionData - Transaction data
 * @returns {object} - Transaction result
 */
export async function recordTransactionWithRollup(companyId, transactionData) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log(`Recording transaction: ${transactionData.description}`);
    const result = await accountingEngine.recordTransaction(transactionData);

    console.log(`✅ Transaction recorded: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error('Record transaction with rollup error:', error);
    throw error;
  }
}

/**
 * Get financial position summary
 * @param {string} companyId - Company identifier
 * @returns {object} - Financial summary
 */
export async function getFinancialPositionSummary(companyId) {
  try {
    const accountingEngine = new AccountingEngine(companyId);

    console.log('Generating financial position summary...');

    // Get main account category balances
    const assets = await accountingEngine.getAccountBalance('MAIN-1000') || 0;
    const liabilities = await accountingEngine.getAccountBalance('MAIN-2000') || 0;
    const equity = await accountingEngine.getAccountBalance('MAIN-3000') || 0;
    const revenue = await accountingEngine.getAccountBalance('MAIN-4000') || 0;
    const expenses = await accountingEngine.getAccountBalance('MAIN-5000') || 0;

    const netIncome = revenue - expenses;
    const totalEquity = equity + netIncome;

    const summary = {
      assets,
      liabilities,
      equity: totalEquity,
      revenue,
      expenses,
      netIncome,
      equationBalanced: Math.abs(assets - (liabilities + totalEquity)) < 0.01
    };

    console.log('Financial Position Summary:');
    console.log(`  Assets: ${summary.assets}`);
    console.log(`  Liabilities: ${summary.liabilities}`);
    console.log(`  Equity: ${summary.equity}`);
    console.log(`  Revenue: ${summary.revenue}`);
    console.log(`  Expenses: ${summary.expenses}`);
    console.log(`  Net Income: ${summary.netIncome}`);
    console.log(`  Equation Balanced: ${summary.equationBalanced ? '✅' : '❌'}`);

    return summary;

  } catch (error) {
    console.error('Get financial position summary error:', error);
    throw error;
  }
}
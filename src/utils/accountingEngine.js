/**
 * Enhanced Accounting Engine with Parent Account Rollup
 * Extends the basic AccountingEngine with hierarchical balance calculations
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Key Features:
 * - Automatic parent account rollup on all transactions
 * - Hierarchical balance propagation
 * - Maintains accounting equation integrity
 * - Real-time balance updates across entire hierarchy
 */

import { db } from '../app/firebase.js';
import { collection, addDoc, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';

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

export class AccountingEngine {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
    this.balanceEngine = new BalanceCalculationEngine(companyId);
  }

  /**
   * Record double-entry transaction with automatic parent rollup
   * Enhanced version that maintains hierarchical balance integrity
   * @param {object} transactionData - Transaction data
   * @returns {object} - Transaction result
   */
  async recordTransaction(transactionData) {
    const { description, debitAccountId, creditAccountId, amount, referenceType, referenceId } = transactionData;

    try {
      // Validate accounts exist and are active
      await this.validateAccounts([debitAccountId, creditAccountId]);

      // Create transaction record
      const transactionDoc = {
        transactionId: this.generateTransactionId(),
        date: Timestamp.now(),
        description,
        debitAccountId,
        creditAccountId,
        amount: parseFloat(amount),
        referenceType,
        referenceId,
        createdAt: Timestamp.now(),
        createdBy: 'system', // Will be updated with actual user
        companyId: this.companyId
      };

      // Record transaction
      const docRef = await addDoc(collection(db, this.paths.getTransactionsPath()), transactionDoc);

      // Update account balances with hierarchical rollup
      await this.updateAccountBalancesWithRollup(debitAccountId, creditAccountId, amount);

      return {
        id: docRef.id,
        transactionId: transactionDoc.transactionId,
        message: 'Transaction recorded with hierarchical balance updates'
      };

    } catch (error) {
      console.error('Record transaction error:', error);
      throw error;
    }
  }

  /**
   * Update account balances with automatic parent rollup
   * This replaces the simple increment/decrement with hierarchical calculations
   * @param {string} debitAccountId - Debit account code
   * @param {string} creditAccountId - Credit account code
   * @param {number} amount - Transaction amount
   */
  async updateAccountBalancesWithRollup(debitAccountId, creditAccountId, amount) {
    try {
      console.log(`Updating balances with rollup: Debit ${debitAccountId} +${amount}, Credit ${creditAccountId} -${amount}`);

      // Update debit account and its hierarchy
      await this.balanceEngine.updateAccountBalanceRecursive(debitAccountId, amount);

      // Update credit account and its hierarchy
      await this.balanceEngine.updateAccountBalanceRecursive(creditAccountId, -amount);

      console.log('✅ Hierarchical balance updates completed');

    } catch (error) {
      console.error('Update account balances with rollup error:', error);
      throw error;
    }
  }

  /**
   * Automated transaction for sales with parent rollup
   * @param {object} orderData - Order data
   * @returns {object} - Transaction result
   */
  async recordSaleTransaction(orderData) {
    const { orderId, totalAmount, paymentMethod } = orderData;

    try {
      // Determine accounts based on payment method
      const cashAccount = paymentMethod === 'cash' ? 'MAIN-1001' : 'MAIN-1002'; // Cash or Bank
      const salesAccount = 'MAIN-4001'; // Sales Revenue

      return await this.recordTransaction({
        description: `Sale - Order ${orderId}`,
        debitAccountId: cashAccount,
        creditAccountId: salesAccount,
        amount: totalAmount,
        referenceType: 'sale',
        referenceId: orderId
      });

    } catch (error) {
      console.error('Record sale transaction error:', error);
      throw error;
    }
  }

  /**
   * Record cost of goods sold transaction with rollup
   * @param {object} orderData - Order data with COGS details
   * @returns {object} - Transaction result
   */
  async recordCOGSTransaction(orderData) {
    const { orderId, cogsAmount } = orderData;

    try {
      const inventoryAccount = 'MAIN-1004'; // Inventory
      const cogsAccount = 'MAIN-5001'; // Cost of Goods Sold

      return await this.recordTransaction({
        description: `COGS - Order ${orderId}`,
        debitAccountId: cogsAccount,
        creditAccountId: inventoryAccount,
        amount: cogsAmount,
        referenceType: 'cogs',
        referenceId: orderId
      });

    } catch (error) {
      console.error('Record COGS transaction error:', error);
      throw error;
    }
  }

  /**
   * Record cash purchase from supplier with rollup
   * @param {object} purchaseData - Purchase data
   * @returns {object} - Transaction result
   */
  async recordCashPurchaseFromSupplier(purchaseData) {
    const { purchaseId, totalAmount, supplierId } = purchaseData;

    try {
      const inventoryAccount = 'MAIN-1004'; // Inventory
      const cashAccount = 'MAIN-1001'; // Cash

      const result = await this.recordTransaction({
        description: `Cash Purchase - Supplier ${supplierId}`,
        debitAccountId: inventoryAccount,
        creditAccountId: cashAccount,
        amount: totalAmount,
        referenceType: 'purchase',
        referenceId: purchaseId
      });

      return result;

    } catch (error) {
      console.error('Record cash purchase error:', error);
      throw error;
    }
  }

  /**
   * Record credit purchase from supplier with rollup
   * @param {object} purchaseData - Purchase data
   * @returns {object} - Transaction result
   */
  async recordCreditPurchaseFromSupplier(purchaseData) {
    const { purchaseId, totalAmount, supplierId } = purchaseData;

    try {
      const inventoryAccount = 'MAIN-1004'; // Inventory
      const accountsPayable = 'MAIN-2001'; // Accounts Payable

      const result = await this.recordTransaction({
        description: `Credit Purchase - Supplier ${supplierId}`,
        debitAccountId: inventoryAccount,
        creditAccountId: accountsPayable,
        amount: totalAmount,
        referenceType: 'purchase',
        referenceId: purchaseId
      });

      return result;

    } catch (error) {
      console.error('Record credit purchase error:', error);
      throw error;
    }
  }

  /**
   * Record customer payment with rollup
   * @param {object} paymentData - Payment data
   * @returns {object} - Transaction result
   */
  async recordCustomerPayment(paymentData) {
    const { paymentId, amount, customerId, paymentMethod } = paymentData;

    try {
      // Find customer receivable account
      const customerAccountCode = `CUST-${customerId.split('-')[1] || customerId.padStart(4, '0')}`;
      const cashAccount = paymentMethod === 'cash' ? 'MAIN-1001' : 'MAIN-1002';

      return await this.recordTransaction({
        description: `Customer Payment - ${customerId}`,
        debitAccountId: cashAccount,
        creditAccountId: customerAccountCode,
        amount: amount,
        referenceType: 'payment',
        referenceId: paymentId
      });

    } catch (error) {
      console.error('Record customer payment error:', error);
      throw error;
    }
  }

  /**
   * Record supplier payment with rollup
   * @param {object} paymentData - Payment data
   * @returns {object} - Transaction result
   */
  async recordSupplierPayment(paymentData) {
    const { paymentId, amount, supplierId, paymentMethod } = paymentData;

    try {
      const accountsPayable = 'MAIN-2001'; // Accounts Payable
      const cashAccount = paymentMethod === 'cash' ? 'MAIN-1001' : 'MAIN-1002';

      return await this.recordTransaction({
        description: `Supplier Payment - ${supplierId}`,
        debitAccountId: accountsPayable,
        creditAccountId: cashAccount,
        amount: amount,
        referenceType: 'payment',
        referenceId: paymentId
      });

    } catch (error) {
      console.error('Record supplier payment error:', error);
      throw error;
    }
  }

  /**
   * Generate unique transaction ID
   * @returns {string} - Transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-${timestamp}-${random}`;
  }

  /**
   * Validate accounts exist and are active
   * @param {Array} accountIds - Array of account IDs to validate
   */
  async validateAccounts(accountIds) {
    for (const accountId of accountIds) {
      const accountDoc = await getDoc(doc(db, `${this.paths.getAccountsPath()}/${accountId}`));
      if (!accountDoc.exists()) {
        throw new Error(`Account ${accountId} does not exist`);
      }
      const accountData = accountDoc.data();
      if (!accountData.isActive) {
        throw new Error(`Account ${accountId} is not active`);
      }
    }
  }

  /**
   * Get current balance for an account (with rollup calculation)
   * @param {string} accountCode - Account code
   * @returns {number} - Current balance
   */
  async getAccountBalance(accountCode) {
    try {
      return await this.balanceEngine.calculateAccountBalance(accountCode);
    } catch (error) {
      console.error(`Get account balance error for ${accountCode}:`, error);
      throw error;
    }
  }

  /**
   * Get balance summary for an account
   * @param {string} accountCode - Account code
   * @returns {object} - Balance summary
   */
  async getAccountBalanceSummary(accountCode) {
    try {
      return await this.balanceEngine.getBalanceSummary(accountCode);
    } catch (error) {
      console.error(`Get account balance summary error for ${accountCode}:`, error);
      throw error;
    }
  }

  /**
   * Validate accounting equation: Assets = Liabilities + Equity
   * @returns {object} - Validation result
   */
  async validateAccountingEquation() {
    try {
      // Get balances for main account categories
      const assetBalance = await this.getAccountBalance('MAIN-1000') || 0; // Assets
      const liabilityBalance = await this.getAccountBalance('MAIN-2000') || 0; // Liabilities
      const equityBalance = await this.getAccountBalance('MAIN-3000') || 0; // Equity

      const leftSide = assetBalance;
      const rightSide = liabilityBalance + equityBalance;
      const difference = Math.abs(leftSide - rightSide);

      const isBalanced = difference < 0.01; // Allow for floating point precision

      return {
        isBalanced,
        assets: assetBalance,
        liabilities: liabilityBalance,
        equity: equityBalance,
        difference,
        message: isBalanced ?
          'Accounting equation is balanced' :
          `Accounting equation imbalance: Assets (${assetBalance}) ≠ Liabilities (${liabilityBalance}) + Equity (${equityBalance})`
      };

    } catch (error) {
      console.error('Validate accounting equation error:', error);
      throw error;
    }
  }
}
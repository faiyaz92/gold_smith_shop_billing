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
import { collection, addDoc, updateDoc, doc, getDoc, Timestamp, serverTimestamp, query, getDocs } from 'firebase/firestore';

// Utility function to get firestore paths (non-hook version)
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    getAccountsPath: () => `${tenantCompaniesPath}/${companyId}/accounts`,
    getTransactionsPath: () => `${tenantCompaniesPath}/${companyId}/transactions`,
    getInvoicesPath: () => `${tenantCompaniesPath}/${companyId}/invoices`,
    getPaymentsPath: () => `${tenantCompaniesPath}/${companyId}/payments`,
    getCashMemosPath: () => `${tenantCompaniesPath}/${companyId}/cashMemos`,
    getJournalEntriesPath: () => `${tenantCompaniesPath}/${companyId}/journalEntries`
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
      const cashAccount = paymentMethod === 'cash' ? '1201' : '1202'; // Cash or Bank (GoldSmith)
      const salesAccount = '4101'; // Commission Income (GoldSmith)

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
      const inventoryAccount = '1103'; // Finished Goods Inventory (GoldSmith)
      const cogsAccount = '5101'; // Making Charges (GoldSmith)

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
      const inventoryAccount = '1103'; // Finished Goods Inventory (GoldSmith)
      const cashAccount = '1201'; // Cash (GoldSmith)

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
      const inventoryAccount = '1103'; // Finished Goods Inventory (GoldSmith)
      const accountsPayable = '2102'; // Other Payables (GoldSmith)

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
      const cashAccount = paymentMethod === 'cash' ? '1201' : '1202'; // Cash or Bank (GoldSmith)

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
      const accountsPayable = '2101'; // Manufacturer Payables (GoldSmith)
      const cashAccount = paymentMethod === 'cash' ? '1201' : '1202'; // Cash or Bank (GoldSmith)

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
   * @param {Array} accountIds - Array of account IDs (can be document IDs or account codes)
   */
  async validateAccounts(accountIds) {
    for (const accountId of accountIds) {
      try {
        // First try to find by document ID
        let accountDoc = await getDoc(doc(db, `${this.paths.getAccountsPath()}/${accountId}`));

        // If not found by document ID, try to find by accountCode
        if (!accountDoc.exists()) {
          const accountsQuery = query(collection(db, this.paths.getAccountsPath()));
          const accountsSnapshot = await getDocs(accountsQuery);
          const account = accountsSnapshot.docs.find(doc => doc.data().accountCode === accountId);

          if (account) {
            accountDoc = await getDoc(doc(db, `${this.paths.getAccountsPath()}/${account.id}`));
          }
        }

        if (!accountDoc.exists()) {
          throw new Error(`Account ${accountId} does not exist`);
        }

        const accountData = accountDoc.data();
        if (!accountData.isActive) {
          throw new Error(`Account ${accountId} is not active`);
        }
      } catch (error) {
        console.error(`Error validating account ${accountId}:`, error);
        throw error;
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
   * Get current balance directly from account document by account code
   * @param {string} accountCode - Account code to find balance for
   * @returns {object} - Balance object with currentBalance and currentBalanceGold
   */
  async getAccountBalanceByCode(accountCode) {
    try {
      // Get all accounts to find the one with matching account code
      const accountsPath = this.paths.getAccountsPath();
      const allAccountsSnapshot = await getDocs(query(collection(db, accountsPath)));
      const account = allAccountsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .find(acc => acc.accountCode === accountCode);

      if (!account) {
        throw new Error(`Account with code ${accountCode} not found`);
      }

      return {
        accountId: account.id,
        accountCode: account.accountCode,
        accountName: account.accountName,
        currentBalance: account.currentBalance || 0,
        currentBalanceGold: account.currentBalanceGold || 0,
        balanceType: account.balanceType,
        accountType: account.accountType
      };

    } catch (error) {
      console.error(`Get account balance by code error for ${accountCode}:`, error);
      throw error;
    }
  }

  /**
   * Validate accounting equation: Assets = Liabilities + Equity
   * @returns {object} - Validation result
   */
  async validateAccountingEquation() {
    try {
      // For GoldSmith system, validate that key accounts exist and are accessible
      // Since we don't have parent category accounts, check individual key accounts
      const keyAccounts = ['1201', '1202', '1301', '2101', '3101']; // Cash, Bank, Receivables, Payables, Capital

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;

      for (const accountCode of keyAccounts) {
        const balance = await this.getAccountBalance(accountCode) || 0;
        // Classify accounts by their first digit (GoldSmith system)
        if (accountCode.startsWith('1')) totalAssets += balance; // Assets
        else if (accountCode.startsWith('2')) totalLiabilities += balance; // Liabilities
        else if (accountCode.startsWith('3')) totalEquity += balance; // Equity
      }

      const leftSide = totalAssets;
      const rightSide = totalLiabilities + totalEquity;
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

  /**
   * SDK Method: Create a general accounting entry (backwards compatibility)
   * This method handles the legacy createEntry calls from orders and other components
   * @param {object} entryData - Entry data
   * @returns {object} - Entry result
   */
  async createEntry(entryData) {
    const { date, description, transactionType, referenceId, referenceType, entries } = entryData;

    try {
      // Get all accounts to map account codes to account IDs
      const accountsPath = this.paths.getAccountsPath();
      const allAccountsSnapshot = await getDocs(query(collection(db, accountsPath)));
      const allAccounts = allAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Convert the legacy format to journal entry format with proper account IDs
      const journalEntries = entries.map(entry => {
        // Find the account by accountCode
        const account = allAccounts.find(acc => acc.accountCode === entry.accountCode);
        if (!account) {
          throw new Error(`Account with code ${entry.accountCode} not found`);
        }

        return {
          accountId: account.id, // Use the actual document ID
          accountCode: entry.accountCode,
          accountName: entry.accountName || account.accountName,
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          description: entry.description || '',
          balanceType: entry.balanceType || 'usd' // Add balanceType to determine which balance field to update
        };
      });

      // Use the journal entry method
      const result = await this.createJournalEntry({
        entryDate: date ? new Date(date).toISOString().split('T')[0] : undefined,
        description,
        reference: referenceId || `ENTRY-${Date.now()}`,
        entries: journalEntries,
        createdBy: 'system',
        entryType: 'legacy-entry'
      });

      return {
        ...result,
        transactionType,
        referenceId,
        referenceType
      };

    } catch (error) {
      console.error('Create entry error:', error);
      throw error;
    }
  }
  async createJournalEntry(journalEntryData) {
    const { entryDate, description, reference, entries, createdBy, entryType } = journalEntryData;

    try {
      // Validate the journal entry
      const validation = await this.validateJournalEntry(entries);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Use the validated and filtered entries
      const validEntries = validation.entries;
      const accountsPath = this.paths.getAccountsPath();
      const allAccountsSnapshot = await getDocs(query(collection(db, accountsPath)));
      const allAccounts = allAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Create journal entry record
      const journalEntryDoc = {
        date: Timestamp.fromDate(new Date(entryDate || new Date())),
        description,
        reference: reference || `JE-${Date.now()}`,
        createdBy: createdBy || 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lines: validEntries,
        totalDebit: validation.totalDebit,
        totalCredit: validation.totalCredit,
        isBalanced: true,
        status: 'posted', // Set status for automatic journal entries
        entryType: entryType || 'automatic-journal-entry'
      };

      const journalEntriesPath = this.paths.getJournalEntriesPath();
      const entryRef = await addDoc(collection(db, journalEntriesPath), journalEntryDoc);

      // Update account balances for each entry line
      const updatedAccounts = [];
      for (const line of validEntries) {
        const accountRef = doc(db, accountsPath, line.accountId);
        const accountSnap = await getDoc(accountRef);

        if (accountSnap.exists()) {
          const accountData = accountSnap.data();
          const balanceField = line.balanceType === 'gold' ? 'currentBalanceGold' : 'currentBalance';
          const currentBalance = accountData[balanceField] || 0;

          // Calculate new balance based on account type and debit/credit
          let newBalance = currentBalance;
          if (accountData.balanceType === 'debit') {
            // Asset or Expense account: debit increases, credit decreases
            newBalance = currentBalance + (parseFloat(line.debit) || 0) - (parseFloat(line.credit) || 0);
          } else {
            // Liability, Equity, or Income account: debit decreases, credit increases
            newBalance = currentBalance - (parseFloat(line.debit) || 0) + (parseFloat(line.credit) || 0);
          }

          await updateDoc(accountRef, {
            [balanceField]: newBalance,
            updatedAt: serverTimestamp()
          });

          console.log(`✅ Updated ${accountData.accountCode} (${balanceField}): ${currentBalance} → ${newBalance}`);

          // Track updated account with new balance
          updatedAccounts.push({ ...accountData, [balanceField]: newBalance, id: line.accountId });
        }
      }

      // Update parent account balances
      // First, update the allAccounts array with the new balances
      for (const updatedAccount of updatedAccounts) {
        const accountIndex = allAccounts.findIndex(acc => acc.id === updatedAccount.id);
        if (accountIndex !== -1) {
          allAccounts[accountIndex] = { ...allAccounts[accountIndex], ...updatedAccount };
        }
      }

      await this.updateParentBalances(updatedAccounts, allAccounts);

      return {
        id: entryRef.id,
        message: 'Journal entry created and balances updated successfully',
        totalDebit: validation.totalDebit,
        totalCredit: validation.totalCredit
      };

    } catch (error) {
      console.error('Create journal entry error:', error);
      throw error;
    }
  }

  /**
   * SDK Method: Create a quick transfer between two accounts
   * This encapsulates all quick transfer accounting logic in one place
   * @param {object} transferData - Transfer data
   * @returns {object} - Transfer result
   */
  async createAccountTransfer(transferData) {
    const { fromAccountId, toAccountId, amount, description, createdBy } = transferData;

    try {
      // Validate transfer
      const validation = await this.validateAccountTransfer(fromAccountId, toAccountId, amount);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Get account data
      const accountsPath = this.paths.getAccountsPath();
      const allAccountsSnapshot = await getDocs(query(collection(db, accountsPath)));
      const allAccounts = allAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const fromAccount = allAccounts.find(a => a.id === fromAccountId);
      const toAccount = allAccounts.find(a => a.id === toAccountId);

      // Create journal entry for the transfer
      const journalEntryData = {
        entryDate: new Date().toISOString().split('T')[0],
        description: description || `Transfer from ${fromAccount.accountName} to ${toAccount.accountName}`,
        reference: `TRANSFER-${Date.now()}`,
        createdBy: createdBy || 'system',
        entryType: 'account-transfer',
        entries: [
          {
            accountId: toAccountId,
            accountCode: toAccount.accountCode,
            accountName: toAccount.accountName,
            debit: parseFloat(amount),
            credit: 0
          },
          {
            accountId: fromAccountId,
            accountCode: fromAccount.accountCode,
            accountName: fromAccount.accountName,
            debit: 0,
            credit: parseFloat(amount)
          }
        ]
      };

      // Use the journal entry method to handle the transfer
      const result = await this.createJournalEntry(journalEntryData);

      return {
        ...result,
        message: `Transfer successful! Transferred ${amount} from ${fromAccount.accountName} to ${toAccount.accountName}`
      };

    } catch (error) {
      console.error('Create account transfer error:', error);
      throw error;
    }
  }

  /**
   * Validate journal entry data
   * @param {Array} entries - Journal entry lines
   * @returns {object} - Validation result
   */
  async validateJournalEntry(entries) {
    try {
      console.log('🔍 Validating journal entry entries:', entries);

      // Filter out invalid entries
      const validEntries = entries.filter(line => {
        const hasAccountId = line.accountId && line.accountId.trim() !== '';
        const debitAmount = parseFloat(line.debit) || 0;
        const creditAmount = parseFloat(line.credit) || 0;
        const hasDebit = debitAmount > 0;
        const hasCredit = creditAmount > 0;

        const isValid = hasAccountId && (hasDebit || hasCredit) && !(hasDebit && hasCredit);

        if (!isValid) {
          console.log('❌ Filtering out invalid line:', line, {
            hasAccountId,
            debitAmount,
            creditAmount,
            hasDebit,
            hasCredit
          });
        }

        return isValid;
      });

      console.log('🔍 Valid entries after filtering:', validEntries);

      if (validEntries.length === 0) {
        return { isValid: false, message: 'No valid journal entry lines found. Each line must have an account and either debit or credit amount.' };
      }

      let totalDebit = 0;
      let totalCredit = 0;
      const accountIds = [];

      for (const line of validEntries) {
        // Parse debit and credit as numbers
        const debitAmount = parseFloat(line.debit) || 0;
        const creditAmount = parseFloat(line.credit) || 0;

        totalDebit += debitAmount;
        totalCredit += creditAmount;
        accountIds.push(line.accountId);
      }

      console.log('🔍 Totals - Debit:', totalDebit, 'Credit:', totalCredit);

      // Check if debits equal credits
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { isValid: false, message: `Journal entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}` };
      }

      // Validate accounts exist
      await this.validateAccounts(accountIds);

      return {
        isValid: true,
        totalDebit,
        totalCredit,
        entries: validEntries,
        message: 'Journal entry is valid and balanced'
      };

    } catch (error) {
      console.error('Validate journal entry error:', error);
      return { isValid: false, message: error.message };
    }
  }

  /**
   * Validate account transfer
   * @param {string} fromAccountId - Source account ID
   * @param {string} toAccountId - Destination account ID
   * @param {number} amount - Transfer amount
   * @returns {object} - Validation result
   */
  async validateAccountTransfer(fromAccountId, toAccountId, amount) {
    try {
      if (!fromAccountId || !toAccountId) {
        return { isValid: false, message: 'Both source and destination accounts are required' };
      }

      if (fromAccountId === toAccountId) {
        return { isValid: false, message: 'Source and destination accounts must be different' };
      }

      if (!amount || parseFloat(amount) <= 0) {
        return { isValid: false, message: 'Transfer amount must be greater than 0' };
      }

      // Validate accounts exist
      await this.validateAccounts([fromAccountId, toAccountId]);

      // Get account data to check for parent-child relationships
      const accountsPath = this.paths.getAccountsPath();
      const allAccountsSnapshot = await getDocs(query(collection(db, accountsPath)));
      const allAccounts = allAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const fromAccount = allAccounts.find(a => a.id === fromAccountId);
      const toAccount = allAccounts.find(a => a.id === toAccountId);

      // Check if either account has children (parent account)
      const hasChildren = (accountId) => {
        return allAccounts.some(acc =>
          acc.parentAccount === accountId ||
          acc.parentAccount === allAccounts.find(a => a.id === accountId)?.accountCode ||
          acc.parentAccount === allAccounts.find(a => a.id === accountId)?.id
        );
      };

      if (hasChildren(fromAccountId)) {
        return { isValid: false, message: `Cannot transfer from parent account "${fromAccount.accountCode} - ${fromAccount.accountName}". Use sub-accounts instead.` };
      }

      if (hasChildren(toAccountId)) {
        return { isValid: false, message: `Cannot transfer to parent account "${toAccount.accountCode} - ${toAccount.accountName}". Use sub-accounts instead.` };
      }

      // Check for parent-child relationship
      const isParentChild =
        fromAccount.parentAccount === toAccountId ||
        fromAccount.parentAccount === toAccount.accountCode ||
        toAccount.parentAccount === fromAccountId ||
        toAccount.parentAccount === fromAccount.accountCode;

      if (isParentChild) {
        return { isValid: false, message: 'Cannot transfer between parent and sub-accounts (Accounting Standard)' };
      }

      return { isValid: true, message: 'Transfer is valid' };

    } catch (error) {
      return { isValid: false, message: error.message };
    }
  }

  /**
   * Update parent account balances after child account changes
   * @param {Array} updatedAccounts - List of updated child accounts
   * @param {Array} allAccounts - All accounts data
   */
  async updateParentBalances(updatedAccounts, allAccounts) {
    try {
      const parentAccountsToUpdate = new Set();

      // Find all parent accounts that need updating
      for (const updatedAccount of updatedAccounts) {
        if (updatedAccount.parentAccount) {
          parentAccountsToUpdate.add(updatedAccount.parentAccount);
        }
      }

      // Update each parent account
      for (const parentId of parentAccountsToUpdate) {
        const parentAccount = allAccounts.find(acc =>
          acc.id === parentId ||
          acc.accountCode === parentId
        );

        if (!parentAccount) continue;

        // Get all children of this parent
        const children = allAccounts.filter(acc =>
          acc.parentAccount === parentAccount.accountCode ||
          acc.parentAccountId === parentAccount.id ||
          acc.parentAccountId === parentAccount.accountCode
        );

        // Calculate sum of all children balances (both USD and Gold)
        const totalChildrenBalance = children.reduce((sum, child) => {
          return sum + (child.currentBalance || 0);
        }, 0);

        const totalChildrenBalanceGold = children.reduce((sum, child) => {
          return sum + (child.currentBalanceGold || 0);
        }, 0);

        // Update parent account balance (both USD and Gold)
        const accountsPath = this.paths.getAccountsPath();
        const parentRef = doc(db, accountsPath, parentAccount.id);
        await updateDoc(parentRef, {
          currentBalance: totalChildrenBalance,
          currentBalanceGold: totalChildrenBalanceGold,
          updatedAt: serverTimestamp()
        });

        console.log(`✅ Updated parent ${parentAccount.accountCode}:`);
        console.log(`   USD: ${(parentAccount.currentBalance || 0)} → ${totalChildrenBalance}`);
        console.log(`   Gold: ${(parentAccount.currentBalanceGold || 0)} → ${totalChildrenBalanceGold}`);
      }

    } catch (error) {
      console.error('Update parent balances error:', error);
      throw error;
    }
  }
}
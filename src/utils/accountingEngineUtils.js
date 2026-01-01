/**
 * Accounting Engine Utilities with Parent Rollup
 * Helper functions for using the enhanced AccountingEngine
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Usage: Call functions to perform transactions with automatic parent rollup
 */

import { AccountingEngine } from './accountingEngine.js';
import { InventoryService } from './inventoryService.js';
import { db } from '../app/firebase.js';
import { collection, query, orderBy, onSnapshot, getDocs, addDoc, updateDoc, doc, serverTimestamp, deleteDoc, where } from 'firebase/firestore';
import { initializeDefaultAccounts } from './initializeCoreAccounts.js';

/**
 * Get Firestore path for accounts
 * @param {string} companyId - Company identifier
 * @returns {string} - Accounts path
 */
function getAccountsPath(companyId) {
  return `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
}

/**
 * Fetch accounts with real-time updates
 * Centralized account fetching function for all pages
 * @param {string} companyId - Company identifier
 * @param {function} callback - Callback function to receive accounts
 * @param {object} options - Optional filters
 * @returns {function} - Unsubscribe function
 */
export function subscribeToAccounts(companyId, callback, options = {}) {
  if (!companyId) {
    console.error('Company ID is required');
    return () => {};
  }

  const accountsPath = getAccountsPath(companyId);
  const accountsQuery = query(collection(db, accountsPath), orderBy('accountCode'));

  const unsubscribe = onSnapshot(accountsQuery, (snapshot) => {
    let accountsData = snapshot.docs.map(doc => ({
      id: doc.id,
      accountId: doc.id, // For backward compatibility
      ...doc.data()
    }));

    // Apply filters if provided
    if (options.accountType) {
      accountsData = accountsData.filter(acc => acc.accountType === options.accountType);
    }

    if (options.onlyLeafAccounts) {
      // Filter to only accounts without children
      accountsData = accountsData.filter(acc => {
        return !accountsData.some(child => 
          child.parentAccount === acc.id || 
          child.parentAccount === acc.accountCode
        );
      });
    }

    if (options.onlyParentAccounts) {
      // Filter to only accounts with children
      accountsData = accountsData.filter(acc => {
        return accountsData.some(child => 
          child.parentAccount === acc.id || 
          child.parentAccount === acc.accountCode
        );
      });
    }

    if (options.parentAccount) {
      // Filter to children of specific parent
      accountsData = accountsData.filter(acc => 
        acc.parentAccount === options.parentAccount
      );
    }

    if (options.accountCodes && Array.isArray(options.accountCodes)) {
      // Filter to specific account codes
      accountsData = accountsData.filter(acc => 
        options.accountCodes.includes(acc.accountCode)
      );
    }

    if (options.excludeSystem) {
      // Exclude system accounts
      accountsData = accountsData.filter(acc => !acc.isSystem);
    }

    callback(accountsData);
  }, (error) => {
    console.error('Error fetching accounts:', error);
    callback([]);
  });

  return unsubscribe;
}

/**
 * Fetch accounts once (no real-time updates)
 * @param {string} companyId - Company identifier
 * @param {object} options - Optional filters
 * @returns {Promise<Array>} - Accounts array
 */
export async function getAccountsOnce(companyId, options = {}) {
  if (!companyId) {
    console.error('Company ID is required');
    return [];
  }

  try {
    const accountsPath = getAccountsPath(companyId);
    const accountsQuery = query(collection(db, accountsPath), orderBy('accountCode'));
    const snapshot = await getDocs(accountsQuery);

    let accountsData = snapshot.docs.map(doc => ({
      id: doc.id,
      accountId: doc.id,
      ...doc.data()
    }));

    // Apply same filters as subscribeToAccounts
    if (options.accountType) {
      accountsData = accountsData.filter(acc => acc.accountType === options.accountType);
    }

    if (options.onlyLeafAccounts) {
      accountsData = accountsData.filter(acc => {
        return !accountsData.some(child => 
          child.parentAccount === acc.id || 
          child.parentAccount === acc.accountCode
        );
      });
    }

    if (options.onlyParentAccounts) {
      accountsData = accountsData.filter(acc => {
        return accountsData.some(child => 
          child.parentAccount === acc.id || 
          child.parentAccount === acc.accountCode
        );
      });
    }

    if (options.parentAccount) {
      accountsData = accountsData.filter(acc => 
        acc.parentAccount === options.parentAccount
      );
    }

    if (options.accountCodes && Array.isArray(options.accountCodes)) {
      accountsData = accountsData.filter(acc => 
        options.accountCodes.includes(acc.accountCode)
      );
    }

    if (options.excludeSystem) {
      accountsData = accountsData.filter(acc => !acc.isSystem);
    }

    return accountsData;

  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

/**
 * Get gold accounts for challan source selection
 * @param {string} companyId - Company identifier
 * @returns {Promise<Array>} - Gold accounts
 */
export async function getGoldAccounts(companyId) {
  return getAccountsOnce(companyId, {
    accountCodes: ['1101', '1102', '1103']
  });
}

/**
 * Get manufacturer accounts for challan destination
 * @param {string} companyId - Company identifier
 * @returns {Promise<Array>} - Manufacturer accounts
 */
export async function getManufacturerAccounts(companyId) {
  return getAccountsOnce(companyId, {
    parentAccount: '2101'
  });
}

/**
 * Get customer accounts
 * @param {string} companyId - Company identifier
 * @returns {Promise<Array>} - Customer accounts
 */
export async function getCustomerAccounts(companyId) {
  return getAccountsOnce(companyId, {
    parentAccount: '1301'
  });
}

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

/**
 * VALIDATION FUNCTIONS - Engine Level
 * These validations are enforced at the accounting engine level
 * to prevent invalid transactions regardless of where they're created
 */

/**
 * Check if an account is a parent account (has children)
 * @param {string} accountId - Account ID or code to check
 * @param {Array} allAccounts - All accounts in the system
 * @returns {boolean} - True if account has children
 */
/**
 * ============================================================================
 * ACCOUNT HIERARCHY UTILITIES - CENTRALIZED METHODS
 * ============================================================================
 *
 * This section contains ALL account hierarchy-related functions in ONE PLACE.
 * Use these exported functions throughout the application for consistency.
 *
 * AVAILABLE FUNCTIONS:
 * - isParentAccount(accountId, allAccounts) → boolean
 * - isChildAccount(accountId, allAccounts) → boolean
 * - getParentAccount(accountId, allAccounts) → account object | null
 * - getChildAccounts(accountId, allAccounts) → array of accounts
 * - checkParentChildRelation(accountId1, accountId2, allAccounts) → {isRelated, relationship, error}
 * - getAccountLevel(accountId, allAccounts) → number (1=main, 2=sub, etc.)
 * - canHaveDirectTransactions(accountId, allAccounts) → boolean
 *
 * USAGE EXAMPLES:
 *   import { isParentAccount, getChildAccounts } from '@/utils/accountingEngineUtils';
 *
 *   const hasChildren = isParentAccount(accountId, allAccounts);
 *   const children = getChildAccounts(parentId, allAccounts);
 */

/**
 * Check if an account is a parent account (has sub-accounts)
 * @param {string} accountId - Account document ID to check
 * @param {Array} allAccounts - All accounts in the system
 * @returns {boolean} - True if account has children/sub-accounts
 */
export function isParentAccount(accountId, allAccounts) {
  if (!accountId || !allAccounts) return false;

  const account = allAccounts.find(a => a.id === accountId);
  if (!account) return false;

  // Check if any account has this account as parent (by ID or accountCode)
  return allAccounts.some(acc =>
    acc.parentAccount === accountId ||
    acc.parentAccount === account.accountCode
  );
}

/**
 * Check if an account is a child account (has a parent)
 * @param {string} accountId - Account document ID to check
 * @param {Array} allAccounts - All accounts in the system
 * @returns {boolean} - True if account has a parent
 */
export function isChildAccount(accountId, allAccounts) {
  if (!accountId || !allAccounts) return false;

  const account = allAccounts.find(a => a.id === accountId);
  return account && account.parentAccount !== null && account.parentAccount !== undefined;
}

/**
 * Get the parent account of a child account
 * @param {string} accountId - Account document ID
 * @param {Array} allAccounts - All accounts in the system
 * @returns {object|null} - Parent account object or null
 */
export function getParentAccount(accountId, allAccounts) {
  if (!accountId || !allAccounts) return null;

  const account = allAccounts.find(a => a.id === accountId);
  if (!account || !account.parentAccount) return null;

  // Find parent by ID first, then by accountCode
  return allAccounts.find(acc =>
    acc.id === account.parentAccount ||
    acc.accountCode === account.parentAccount
  ) || null;
}

/**
 * Get all child accounts of a parent account
 * @param {string} accountId - Parent account document ID
 * @param {Array} allAccounts - All accounts in the system
 * @returns {Array} - Array of child account objects
 */
export function getChildAccounts(accountId, allAccounts) {
  if (!accountId || !allAccounts) return [];

  const parentAccount = allAccounts.find(a => a.id === accountId);
  if (!parentAccount) return [];

  return allAccounts.filter(acc =>
    acc.parentAccount === accountId ||
    acc.parentAccount === parentAccount.accountCode
  );
}

/**
 * Check if two accounts are parent-child related
 * @param {string} accountId1 - First account ID
 * @param {string} accountId2 - Second account ID
 * @param {Array} allAccounts - All accounts in the system
 * @returns {object} - { isRelated: boolean, relationship: 'parent-child'|'child-parent'|'none', error: string }
 */
export function checkParentChildRelation(accountId1, accountId2, allAccounts) {
  if (!accountId1 || !accountId2 || !allAccounts) {
    return { isRelated: false, relationship: 'none', error: null };
  }

  const account1 = allAccounts.find(a => a.id === accountId1);
  const account2 = allAccounts.find(a => a.id === accountId2);

  if (!account1 || !account2) {
    return { isRelated: false, relationship: 'none', error: null };
  }

  // Check if account1 is parent of account2
  if (account2.parentAccount === account1.id || account2.parentAccount === account1.accountCode) {
    return {
      isRelated: true,
      relationship: 'parent-child',
      error: `❌ Invalid: "${account1.accountCode}" is parent of "${account2.accountCode}". Cannot create entries between parent and child accounts.`
    };
  }

  // Check if account2 is parent of account1
  if (account1.parentAccount === account2.id || account1.parentAccount === account2.accountCode) {
    return {
      isRelated: true,
      relationship: 'child-parent',
      error: `❌ Invalid: "${account2.accountCode}" is parent of "${account1.accountCode}". Cannot create entries between parent and child accounts.`
    };
  }

  return { isRelated: false, relationship: 'none', error: null };
}

/**
 * Get account level in hierarchy (1 = main, 2 = sub-account, etc.)
 * @param {string} accountId - Account document ID
 * @param {Array} allAccounts - All accounts in the system
 * @returns {number} - Account level (0 if not found)
 */
export function getAccountLevel(accountId, allAccounts) {
  if (!accountId || !allAccounts) return 0;

  const account = allAccounts.find(a => a.id === accountId);
  if (!account) return 0;

  // If no parent, it's level 1
  if (!account.parentAccount) return 1;

  // If has parent, it's level 2 (for now - can be extended for deeper hierarchies)
  return 2;
}

/**
 * Check if account can have direct transactions (not blocked as parent)
 * @param {string} accountId - Account document ID
 * @param {Array} allAccounts - All accounts in the system
 * @returns {boolean} - True if account can have direct transactions
 */
export function canHaveDirectTransactions(accountId, allAccounts) {
  // Allow direct transactions if account is NOT a parent (doesn't have children)
  return !isParentAccount(accountId, allAccounts);
}

/**
 * ============================================================================
 * LEGACY FUNCTIONS (kept for backward compatibility)
 * ============================================================================
 */

// Keep old function for backward compatibility (now uses exported function)
function isParentAccountLegacy(accountId, allAccounts) {
  return isParentAccount(accountId, allAccounts);
}

// Keep old function for backward compatibility (now uses exported function)
function checkParentChildRelationLegacy(accountId1, accountId2, allAccounts) {
  const result = checkParentChildRelation(accountId1, accountId2, allAccounts);
  return { isRelated: result.isRelated, error: result.error };
}

/**
 * Validate journal entry before creation (ENGINE LEVEL VALIDATION)
 * @param {object} journalEntryData - Journal entry data to validate
 * @param {Array} allAccounts - All accounts in the system
 * @returns {object} - { isValid: boolean, errors: Array<string> }
 */
function validateJournalEntry(journalEntryData, allAccounts) {
  const errors = [];
  const { entries } = journalEntryData;

  if (!entries || entries.length === 0) {
    errors.push('❌ Journal entry must have at least one transaction line');
    return { isValid: false, errors };
  }

  // Check each entry line
  for (const entry of entries) {
    if (!entry.accountId) continue;

    const account = allAccounts.find(a => a.id === entry.accountId);
    if (!account) {
      errors.push(`❌ Account not found: ${entry.accountId}`);
      continue;
    }

    // ✅ VALIDATION 1: Prevent posting to parent accounts
    if (isParentAccount(entry.accountId, allAccounts)) {
      errors.push(`❌ Invalid: "${account.accountCode} - ${account.accountName}" is a parent account. Cannot post directly to parent accounts. Please select a sub-account.`);
    }
  }

  // ✅ VALIDATION 2: Prevent parent-child transactions
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const entry1 = entries[i];
      const entry2 = entries[j];

      if (entry1.accountId && entry2.accountId) {
        const relation = checkParentChildRelation(entry1.accountId, entry2.accountId, allAccounts);
        if (relation.isRelated) {
          errors.push(relation.error);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create Journal Entry with Engine-Level Validation
 * Centralized function to create journal entries with built-in validation
 * Use this function everywhere instead of direct Firestore writes
 * 
 * @param {string} companyId - Company identifier
 * @param {object} journalEntryData - Journal entry data
 * @returns {Promise<object>} - Created journal entry result
 */
export async function createJournalEntry(companyId, journalEntryData) {
  try {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // ✅ STEP 1: Fetch all accounts for validation
    const allAccounts = await getAccountsOnce(companyId);

    if (allAccounts.length === 0) {
      throw new Error('No accounts found. Please set up accounts first.');
    }

    // ✅ STEP 2: Validate journal entry (ENGINE LEVEL)
    const validation = validateJournalEntry(journalEntryData, allAccounts);

    if (!validation.isValid) {
      const errorMessage = validation.errors.join('\n');
      throw new Error(`Journal Entry Validation Failed:\n${errorMessage}`);
    }

    // ✅ STEP 3: Check if entry is balanced
    const { totalDebit = 0, totalCredit = 0 } = journalEntryData;
    if (Math.abs(totalDebit - totalCredit) >= 0.01) {
      throw new Error(`❌ Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    // ✅ STEP 4: Create journal entry in Firestore
    const journalEntriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;

    const entryRef = await addDoc(collection(db, journalEntriesPath), {
      ...journalEntryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isBalanced: true
    });

    console.log('✅ Journal entry created with validation:', entryRef.id);

    // ✅ STEP 5: Update account balances
    await updateAccountBalances(companyId, journalEntryData.entries, allAccounts);

    return {
      id: entryRef.id,
      message: 'Journal entry created successfully with validation',
      ...journalEntryData
    };

  } catch (error) {
    console.error('❌ Create journal entry error:', error);
    throw error;
  }
}

/**
 * Update account balances after journal entry creation
 * Includes automatic parent balance rollup
 * @param {string} companyId - Company identifier
 * @param {Array} entries - Journal entry lines
 * @param {Array} allAccounts - All accounts
 */
async function updateAccountBalances(companyId, entries, allAccounts) {
  const accountsPath = getAccountsPath(companyId);

  // Helper function to update parent balance
  const updateParentBalance = async (childAccountData) => {
    if (!childAccountData.parentAccount) return;

    const parentAccount = allAccounts.find(acc => 
      acc.id === childAccountData.parentAccount || 
      acc.accountCode === childAccountData.parentAccount
    );

    if (!parentAccount) return;

    // Calculate sum of all children balances
    const children = allAccounts.filter(acc => 
      acc.parentAccount === parentAccount.id || 
      acc.parentAccount === parentAccount.accountCode
    );

    // Fetch fresh balances
    const freshSnapshot = await getDocs(query(collection(db, accountsPath)));
    const freshAccounts = freshSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const freshChildren = freshAccounts.filter(acc => 
      acc.parentAccount === parentAccount.id || 
      acc.parentAccount === parentAccount.accountCode
    );

    const totalChildrenBalance = freshChildren.reduce((sum, child) => 
      sum + (parseFloat(child.currentBalance) || 0), 0
    );

    // Update parent balance
    await updateDoc(doc(db, accountsPath, parentAccount.id), {
      currentBalance: totalChildrenBalance
    });

    console.log(`✅ Parent balance updated: ${parentAccount.accountCode} = ${totalChildrenBalance}`);
  };

  // Update each account in the entry
  for (const entry of entries) {
    if (!entry.accountId) continue;

    const account = allAccounts.find(a => a.id === entry.accountId);
    if (!account) continue;

    const debitAmount = parseFloat(entry.debit) || 0;
    const creditAmount = parseFloat(entry.credit) || 0;
    const netChange = debitAmount - creditAmount;

    const currentBalance = parseFloat(account.currentBalance) || 0;
    const newBalance = currentBalance + netChange;

    // Update account balance
    await updateDoc(doc(db, accountsPath, entry.accountId), {
      currentBalance: newBalance
    });

    console.log(`✅ Account balance updated: ${account.accountCode} = ${newBalance}`);

    // Update parent balance if exists
    await updateParentBalance(account);
  }
}

/**
 * ================================================================================
 * ACCOUNT MANAGEMENT SDK FUNCTIONS
 * Complete CRUD operations for accounts - use these instead of direct Firestore
 * ================================================================================
 */

/**
 * Create a new account
 * @param {string} companyId - Company identifier
 * @param {object} accountData - Account data
 * @param {string} createdBy - User creating the account
 * @returns {Promise<object>} - Created account result
 */
export async function createAccount(companyId, accountData, createdBy = 'system') {
  try {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    const accountsPath = getAccountsPath(companyId);

    // Prepare account data with defaults
    const newAccountData = {
      ...accountData,
      companyId,
      currentBalance: accountData.currentBalance || 0,
      currentBalanceGold: accountData.currentBalanceGold || 0,
      level: accountData.parentAccount ? 2 : 1,
      isSystem: accountData.isSystem || false,
      isActive: accountData.isActive !== undefined ? accountData.isActive : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy
    };

    // Create account
    const newAccountRef = await addDoc(collection(db, accountsPath), newAccountData);
    
    // Update with accountId
    await updateDoc(newAccountRef, { accountId: newAccountRef.id });

    console.log('✅ Account created:', newAccountRef.id);

    return {
      id: newAccountRef.id,
      accountId: newAccountRef.id,
      message: 'Account created successfully',
      ...newAccountData
    };

  } catch (error) {
    console.error('❌ Create account error:', error);
    throw error;
  }
}

/**
 * Update an existing account
 * @param {string} companyId - Company identifier
 * @param {string} accountId - Account ID to update
 * @param {object} accountData - Updated account data
 * @param {string} updatedBy - User updating the account
 * @returns {Promise<object>} - Update result
 */
export async function updateAccount(companyId, accountId, accountData, updatedBy = 'system') {
  try {
    if (!companyId || !accountId) {
      throw new Error('Company ID and Account ID are required');
    }

    const accountsPath = getAccountsPath(companyId);

    // Update account
    await updateDoc(doc(db, accountsPath, accountId), {
      ...accountData,
      updatedAt: serverTimestamp(),
      updatedBy
    });

    console.log('✅ Account updated:', accountId);

    return {
      id: accountId,
      message: 'Account updated successfully',
      ...accountData
    };

  } catch (error) {
    console.error('❌ Update account error:', error);
    throw error;
  }
}

/**
 * Delete a journal entry
 * @param {string} companyId - Company identifier
 * @param {string} entryId - Journal entry ID to delete
 * @returns {Promise<object>} - Delete result
 */
export async function deleteJournalEntry(companyId, entryId) {
  try {
    if (!companyId || !entryId) {
      throw new Error('Company ID and Entry ID are required');
    }

    const journalEntriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;

    // Delete entry
    await deleteDoc(doc(db, journalEntriesPath, entryId));

    console.log('✅ Journal entry deleted:', entryId);

    return {
      id: entryId,
      message: 'Journal entry deleted successfully'
    };

  } catch (error) {
    console.error('❌ Delete journal entry error:', error);
    throw error;
  }
}

/**
 * Subscribe to journal entries with real-time updates
 * @param {string} companyId - Company identifier
 * @param {function} callback - Callback function to receive entries
 * @param {object} options - Optional filters
 * @returns {function} - Unsubscribe function
 */
export function subscribeToJournalEntries(companyId, callback, options = {}) {
  if (!companyId) {
    console.error('Company ID is required');
    return () => {};
  }

  const journalEntriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;
  const entriesQuery = query(
    collection(db, journalEntriesPath), 
    orderBy(options.orderBy || 'date', options.order || 'desc')
  );

  const unsubscribe = onSnapshot(entriesQuery, (snapshot) => {
    const entriesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Loaded ${entriesData.length} journal entries`);
    callback(entriesData);
  }, (error) => {
    console.error('Error fetching journal entries:', error);
    callback([]);
  });

  return unsubscribe;
}

/**
 * Get journal entries once (no real-time updates)
 * @param {string} companyId - Company identifier
 * @param {object} options - Optional filters
 * @returns {Promise<Array>} - Journal entries array
 */
export async function getJournalEntriesOnce(companyId, options = {}) {
  if (!companyId) {
    console.error('Company ID is required');
    return [];
  }

  try {
    const journalEntriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;
    const entriesQuery = query(
      collection(db, journalEntriesPath), 
      orderBy(options.orderBy || 'date', options.order || 'asc')
    );
    const snapshot = await getDocs(entriesQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }
}

/**
 * Delete journal entries by reference (for reversing transactions)
 * @param {string} companyId - Company identifier
 * @param {string} referenceType - Reference type (e.g., 'challan', 'invoice')
 * @param {string} referenceId - Reference ID
 * @returns {Promise<object>} - Delete result with count
 */
export async function deleteJournalEntriesByReference(companyId, referenceType, referenceId) {
  try {
    if (!companyId || !referenceType || !referenceId) {
      throw new Error('Company ID, reference type, and reference ID are required');
    }

    const journalEntriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;
    
    // Find all entries with matching reference
    const entriesQuery = query(
      collection(db, journalEntriesPath),
      where('referenceType', '==', referenceType),
      where('referenceId', '==', referenceId)
    );
    
    const snapshot = await getDocs(entriesQuery);
    
    if (snapshot.empty) {
      console.log(`No journal entries found for ${referenceType} ${referenceId}`);
      return { deletedCount: 0, message: 'No entries found' };
    }

    // Delete all matching entries
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(`✅ Deleted ${snapshot.docs.length} journal entries for ${referenceType} ${referenceId}`);

    return {
      deletedCount: snapshot.docs.length,
      message: `Successfully deleted ${snapshot.docs.length} journal entries`
    };

  } catch (error) {
    console.error('❌ Delete journal entries by reference error:', error);
    throw error;
  }
}

/**
 * Initialize default accounts for a company
 * @param {string} companyId - Company identifier
 * @returns {Promise<object>} - Initialization result
 */
export async function initializeCompanyAccounts(companyId) {
  try {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Use existing initialization function
    const result = await initializeDefaultAccounts(companyId);

    console.log('✅ Company accounts initialized');
    return result;

  } catch (error) {
    console.error('❌ Initialize company accounts error:', error);
    throw error;
  }
}
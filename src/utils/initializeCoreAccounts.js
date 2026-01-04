// ✅ TASK 1.1 COMPLETED: Initialize 15 Chart of Accounts (BRD v2)
// Purpose: Auto-create 15 default accounts on company first login
// Reference: BRD_GoldSmith_v2.md Section 2.3.1, DatabaseInfo_GoldSmith_v2.md Section 2

import { db } from '@/app/firebase';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { HierarchicalAccountManager } from './hierarchicalAccountManager';

/**
 * Initialize 15 default gold smith accounts
 * Called automatically on company admin's first login
 */
export const initializeDefaultAccounts = async (companyId) => {
  try {
    console.log('🔍 Starting Gold Smith account initialization for company:', companyId);

    // 15 Default Accounts per BRD v2 Section 2.3.1
    const defaultAccounts = [
      {
        accountCode: '1101',
        accountName: 'Gold Bank (Sharaf)',
        accountType: 'asset',
        category: 'current_assets',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Gold custody at Sharaf Gold Bank',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '1102',
        accountName: 'Gold in Transit',
        accountType: 'asset',
        category: 'current_assets',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Pure gold with manufacturers for production',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '1103',
        accountName: 'Finished Goods Inventory',
        accountType: 'asset',
        category: 'current_assets',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Finished jewelry inventory in pure gold equivalent',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '1104',
        accountName: 'Gold in Hand',
        accountType: 'asset',
        category: 'current_assets',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Physical gold held in business premises for customer transactions',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '1201',
        accountName: 'Cash',
        accountType: 'asset',
        category: 'current_assets',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Cash on hand (USD)',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '1202',
        accountName: 'Bank Account',
        accountType: 'asset',
        category: 'current_assets',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Bank deposits (USD)',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '1301',
        accountName: 'Customer Receivables',
        accountType: 'asset',
        category: 'current_assets',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Pure gold owed by customers',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '2101',
        accountName: 'Manufacturer Payables',
        accountType: 'liability',
        category: 'current_liabilities',
        balanceType: 'credit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'USD owed to manufacturers for making charges',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '2102',
        accountName: 'Other Payables',
        accountType: 'liability',
        category: 'current_liabilities',
        balanceType: 'credit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Other amounts payable (USD)',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '3101',
        accountName: "Owner's Capital",
        accountType: 'equity',
        category: 'equity',
        balanceType: 'credit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Owner investment and capital',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '3201',
        accountName: 'Retained Earnings',
        accountType: 'equity',
        category: 'equity',
        balanceType: 'credit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Accumulated earnings in pure gold equivalent',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '4101',
        accountName: 'Commission Income',
        accountType: 'income',
        category: 'revenue',
        balanceType: 'credit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Commission earned in pure gold',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '5101',
        accountName: 'Making Charges',
        accountType: 'expense',
        category: 'cost_of_goods_sold',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Making charges paid to manufacturers (USD)',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '5201',
        accountName: 'Salaries',
        accountType: 'expense',
        category: 'operating_expenses',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Staff salaries and wages (USD)',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '5202',
        accountName: 'Rent',
        accountType: 'expense',
        category: 'operating_expenses',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Shop and office rent (USD)',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
      {
        accountCode: '5203',
        accountName: 'Utilities',
        accountType: 'expense',
        category: 'operating_expenses',
        balanceType: 'debit',
        currentBalance: 0,
        currentBalanceGold: 0,
        description: 'Electricity, water, internet, etc. (USD)',
        isSystem: true,
        isActive: true,
        parentAccount: null,
        level: 1,
      },
    ];

    // Create all accounts in correct path
    const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
    console.log('🔍 Creating Gold accounts at path:', accountsPath);

    // Initialize HierarchicalAccountManager for this company
    const accountManager = new HierarchicalAccountManager(companyId);

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    for (const account of defaultAccounts) {
      try {
        // Check if account already exists
        const existingAccount = await accountManager.getAccountByCode(account.accountCode);
        if (existingAccount) {
          results.skipped.push(`${account.accountCode}: ${account.accountName} (already exists)`);
          continue;
        }

        // Call CORE createAccount method with system account additional fields
        const createdAccount = await accountManager.createAccount({
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          category: account.category,
          balanceType: account.balanceType,
          currentBalance: account.currentBalance,
          currentBalanceGold: account.currentBalanceGold,
          description: account.description,
          parentAccount: account.parentAccount,
          level: account.level,
          isSystem: account.isSystem,
          isActive: account.isActive,
          createdBy: 'system'
        }, {
          // System account specific additional fields
          // Migration-ready fields
          _version: "2.0",
          _migrationStatus: "active",
          _v3Ready: true,
          _v4Ready: false
        });

        results.created.push(`${account.accountCode}: ${account.accountName}`);
        console.log('🔍 Created account:', account.accountCode, account.accountName);

      } catch (error) {
        console.error('❌ Error creating account:', account.accountCode, error);
        results.errors.push(`${account.accountCode}: ${error.message}`);
      }
    }

    console.log('✅ Successfully initialized default accounts for company:', companyId);
    return {
      success: results.errors.length === 0,
      message: results.errors.length === 0 ? '15 default accounts created successfully' : 'Some accounts failed to create',
      accountCount: results.created.length,
      createdCount: results.created.length,
      skippedCount: results.skipped.length,
      errorCount: results.errors.length,
      results
    };

  } catch (error) {
    console.error('❌ Error initializing accounts:', error);
    return { 
      success: false, 
      message: 'Failed to initialize accounts',
      error: error.message 
    };
  }
};

/**
 * Get account by code
 */
export const getAccountByCode = async (companyId, accountCode) => {
  try {
    const accountDoc = await getDoc(
      doc(db, 'companies', companyId, 'accounts', accountCode)
    );
    
    if (accountDoc.exists()) {
      return { success: true, account: { id: accountDoc.id, ...accountDoc.data() } };
    } else {
      return { success: false, message: 'Account not found' };
    }
  } catch (error) {
    console.error('Error fetching account:', error);
    return { success: false, message: 'Failed to fetch account', error: error.message };
  }
};

/**
 * Check if company accounts are initialized
 */
export const checkAccountsInitialized = async (companyId) => {
  try {
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    return companyDoc.exists() && companyDoc.data().accountsInitialized === true;
  } catch (error) {
    console.error('Error checking initialization:', error);
    return false;
  }
};

// Example usage (uncomment to run manually):
/*
initializeCoreAccountsForCompany('laundry_q8')
  .then(results => {
    console.log('Initialization successful:', results.success);
  })
  .catch(error => {
    console.error('Initialization failed:', error);
  });
*/
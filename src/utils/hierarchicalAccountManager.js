// src/utils/hierarchicalAccountManager.js
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../app/firebase';

// Utility function to get firestore paths (non-hook version)
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    accountsPath: () => `${tenantCompaniesPath}/${companyId}/accounts`
  };
};

export class HierarchicalAccountManager {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
  }

  /**
   * CORE ACCOUNT CREATION METHOD - THE ONLY METHOD THAT CREATES ACCOUNTS
   * This is the SINGLE source of truth for account creation in GoldSmith
   * All other account creation methods MUST call this method
   *
   * @param {object} coreFields - Core account fields (required)
   * @param {object} additionalFields - Account-type specific fields (optional)
   * @returns {object} - Created account document
   */
  async createAccount(coreFields, additionalFields = {}) {
    try {
      const {
        accountCode,
        accountName,
        accountType,
        category,
        balanceType,
        currentBalance = 0,
        currentBalanceGold = 0,
        description = '',
        isSystem = false,
        isActive = true,
        parentAccount = null,
        level = 1,
        createdBy = 'system'
      } = coreFields;

      // Validate required core fields
      if (!accountCode || !accountName || !accountType) {
        throw new Error('Account code, name, and type are required');
      }

      // Check for duplicate account codes
      const existingAccount = await this.getAccountByCode(accountCode);
      if (existingAccount) {
        throw new Error(`Account code ${accountCode} already exists`);
      }

      // Get default values if not provided
      const finalCategory = category || this.getDefaultCategory(accountType);
      const finalBalanceType = balanceType || this.getDefaultBalanceType(accountType);

      // Create the complete account document
      const accountDocument = {
        // CORE FIELDS - These are ALWAYS present in every account
        accountCode,
        accountName,
        accountType,
        category: finalCategory,
        balanceType: finalBalanceType,
        currentBalance: parseFloat(currentBalance) || 0,
        currentBalanceGold: parseFloat(currentBalanceGold) || 0,
        description,
        isSystem,
        isActive,
        parentAccount,
        level,
        companyId: this.companyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy,

        // ADDITIONAL FIELDS - Account type specific fields
        ...additionalFields
      };

      // Create document in Firestore
      const docRef = doc(db, this.paths.accountsPath(), accountCode);
      await setDoc(docRef, accountDocument);

      console.log(`✅ Account created via core method: ${accountCode} - ${accountName}`);
      return {
        ...accountDocument,
        id: docRef.id
      };

    } catch (error) {
      console.error('❌ Core account creation error:', error);
      throw error;
    }
  }

  /**
   * Get default balance type for account type
   * @param {string} accountType - Account type
   * @returns {string} - Default balance type
   */
  getDefaultBalanceType(accountType) {
    const balanceTypes = {
      'asset': 'debit',
      'expense': 'debit',
      'liability': 'credit',
      'equity': 'credit',
      'income': 'credit'
    };
    return balanceTypes[accountType] || 'debit';
  }

  /**
   * Create a main/parent account (top-level account)
   * Now uses centralized createAccount method for consistency
   * @param {object} accountData - Account data
   * @returns {object} - Created account
   */
  /**
   * Create a main account (top-level account)
   * Calls the CORE createAccount method
   * @param {object} accountData - Account data
   * @returns {object} - Created account
   */
  async createMainAccount(accountData) {
    try {
      const { accountCode, accountName, accountType, category, balance = 0, createdBy = 'system' } = accountData;

      // Call CORE createAccount method with standardized fields
      return await this.createAccount({
        accountCode,
        accountName,
        accountType,
        category,
        currentBalance: balance,
        level: 1, // Main level
        isSystem: false,
        createdBy
      });

    } catch (error) {
      console.error('Create main account error:', error);
      throw error;
    }
  }

  /**
   * Create a child account (under a main account)
   * Calls the CORE createAccount method
   * @param {string} parentAccountId - Parent account code
   * @param {object} accountData - Account data
   * @returns {object} - Created account
   */
  async createChildAccount(parentAccountId, accountData) {
    try {
      const { accountName, balance = 0, createdBy = 'system' } = accountData;

      // Validate parent exists
      const parentAccount = await this.getAccountByCode(parentAccountId);
      if (!parentAccount) {
        throw new Error(`Parent account ${parentAccountId} not found`);
      }

      // Generate child account code
      const childAccountCode = await this.generateChildAccountCode(parentAccountId);

      // Call CORE createAccount method with additional child-specific fields
      return await this.createAccount({
        accountCode: childAccountCode,
        accountName,
        accountType: parentAccount.accountType, // Inherit from parent
        category: parentAccount.category, // Inherit from parent
        currentBalance: balance,
        parentAccount: parentAccountId,
        level: 2, // Child level
        isSystem: false,
        createdBy
      }, {
        // Additional fields specific to child accounts
        parentAccountName: parentAccount.accountName,
        normalBalance: parentAccount.normalBalance || this.getNormalBalance(parentAccount.accountType),
        traditionalClass: parentAccount.traditionalClass || this.getDefaultTraditionalClass(parentAccount.accountType),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      });

    } catch (error) {
      console.error('Create child account error:', error);
      throw error;
    }
  }

  /**
   * Create a sub-account (under a child account)
   * @param {string} parentAccountId - Parent account code (child account)
   * @param {object} accountData - Account data
   * @returns {object} - Created account
   */
  async createSubAccount(parentAccountId, accountData) {
    try {
      const { accountName, balance = 0 } = accountData;

      // Validate parent exists and is a child account
      const parentAccount = await this.getAccountByCode(parentAccountId);
      if (!parentAccount) {
        throw new Error(`Parent account ${parentAccountId} not found`);
      }

      if (parentAccount.hierarchyLevel !== 2) {
        throw new Error('Sub-accounts can only be created under child accounts');
      }

      // Generate sub-account code
      const subAccountCode = await this.generateSubAccountCode(parentAccountId);

      const subAccount = {
        accountCode: subAccountCode,
        accountName,
        accountType: parentAccount.accountType, // Inherit from parent
        parentAccountId,
        parentAccountName: parentAccount.accountName,
        hierarchyLevel: 3, // Sub level
        isActive: true,
        balance: balance,
        normalBalance: parentAccount.normalBalance,
        traditionalClass: parentAccount.traditionalClass,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      };

      // Save to Firebase
      const accountRef = doc(db, this.paths.accountsPath(), subAccountCode);
      await setDoc(accountRef, subAccount);

      return subAccount;
    } catch (error) {
      console.error('Create sub-account error:', error);
      throw error;
    }
  }

  /**
   * Get account hierarchy recursively
   * @param {string} accountCode - Root account code
   * @returns {object} - Hierarchical account structure
   */
  async getAccountHierarchy(accountCode) {
    const account = await this.getAccountByCode(accountCode);
    if (!account) return null;

    // Get child accounts
    const childAccounts = await this.getChildAccounts(accountCode);

    // Recursively get hierarchy for each child
    const children = await Promise.all(
      childAccounts.map(async (child) => await this.getAccountHierarchy(child.accountCode))
    );

    return {
      ...account,
      children: children.filter(child => child !== null)
    };
  }

  /**
   * Generate account code for main account
   * @param {string} accountType - Account type
   * @param {string} accountName - Account name
   * @returns {string} - Generated account code
   */
  generateAccountCode(accountType, accountName) {
    // This is a simplified version - in practice, this would follow specific business rules
    const typePrefix = accountType.toUpperCase().substring(0, 1);
    const nameAbbrev = accountName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    return `MAIN-${typePrefix}${nameAbbrev}`;
  }

  /**
   * Generate child account code (MAIN-XXXX-C001 format)
   * @param {string} parentAccountCode - Parent account code
   * @returns {string} - Generated child account code
   */
  async generateChildAccountCode(parentAccountCode) {
    // Get existing child accounts for this parent
    const childAccounts = await this.getChildAccounts(parentAccountCode);

    // Find the highest sequential number
    let maxNumber = 0;
    childAccounts.forEach(account => {
      const match = account.accountCode.match(/-C(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) maxNumber = num;
      }
    });

    // Generate next sequential number
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `${parentAccountCode}-C${nextNumber}`;
  }

  /**
   * Generate sub-account code (MAIN-XXXX-CXXX-S001 format)
   * @param {string} parentAccountCode - Parent account code (child account)
   * @returns {string} - Generated sub-account code
   */
  async generateSubAccountCode(parentAccountCode) {
    // Get existing sub-accounts for this parent
    const subAccounts = await this.getChildAccounts(parentAccountCode);

    // Find the highest sequential number
    let maxNumber = 0;
    subAccounts.forEach(account => {
      const match = account.accountCode.match(/-S(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNumber) maxNumber = num;
      }
    });

    // Generate next sequential number
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `${parentAccountCode}-S${nextNumber}`;
  }

  /**
   * Get normal balance for account type
   * @param {string} accountType - Account type
   * @returns {string} - Normal balance ('debit' or 'credit')
   */
  getNormalBalance(accountType) {
    const normalBalances = {
      'asset': 'debit',
      'expense': 'debit',
      'liability': 'credit',
      'equity': 'credit',
      'income': 'credit'
    };
    return normalBalances[accountType] || 'debit';
  }

  /**
   * Get default traditional class for account type
   * @param {string} accountType - Account type
   * @returns {string} - Traditional class
   */
  getDefaultTraditionalClass(accountType) {
    const traditionalClasses = {
      'asset': 'Asset',
      'liability': 'Liability',
      'equity': 'Equity',
      'income': 'Revenue',
      'expense': 'Expense'
    };
    return traditionalClasses[accountType] || 'Asset';
  }

  /**
   * Get default category for account type
   * @param {string} accountType - Account type
   * @returns {string} - Default category
   */
  getDefaultCategory(accountType) {
    const defaultCategories = {
      'asset': 'Current Asset',
      'liability': 'Current Liability',
      'equity': 'Equity',
      'income': 'Revenue',
      'expense': 'Expense'
    };
    return defaultCategories[accountType] || 'Current Asset';
  }

  /**
   * Print account hierarchy (for debugging)
   * @param {object} hierarchy - Account hierarchy object
   * @param {number} level - Current level (for indentation)
   */
  printAccountHierarchy(hierarchy, level = 0) {
    const indent = '  '.repeat(level);
    console.log(`${indent}${hierarchy.accountCode}: ${hierarchy.accountName} (${hierarchy.balance})`);

    if (hierarchy.children) {
      hierarchy.children.forEach(child => {
        this.printAccountHierarchy(child, level + 1);
      });
    }
  }

  // Helper methods

  /**
   * Get account by code
   * @param {string} accountCode - Account code
   * @returns {object|null} - Account data or null
   */
  async getAccountByCode(accountCode) {
    try {
      const accountRef = doc(db, this.paths.accountsPath(), accountCode);
      const accountDoc = await getDoc(accountRef);
      return accountDoc.exists() ? accountDoc.data() : null;
    } catch (error) {
      console.error('Get account by code error:', error);
      return null;
    }
  }

  /**
   * Get child accounts for a parent account
   * @param {string} parentAccountCode - Parent account code
   * @returns {array} - Array of child accounts
   */
  async getChildAccounts(parentAccountCode) {
    try {
      const accountsRef = collection(db, this.paths.accountsPath());
      const q = query(
        accountsRef,
        where('parentAccountId', '==', parentAccountCode),
        orderBy('accountCode')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Get child accounts error:', error);
      return [];
    }
  }

  /**
   * Initialize the 39 core MAIN-level accounts as defined in BRD_v2.md Section 7.4
   * @returns {object} - Initialization results
   */
  async initializeCoreAccounts() {
    try {
      const coreAccounts = [
        // ASSETS (1000-1999) - 20 Accounts
        // Current Assets (1000-1099) - 10 Accounts
        { accountCode: 'MAIN-1001', accountName: 'Cash in Hand', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1002', accountName: 'Bank Account - Primary', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1003', accountName: 'Accounts Receivable', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1004', accountName: 'Gold Inventory (24k Gold)', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1005', accountName: 'Silver Inventory (999 Silver)', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1006', accountName: 'Platinum Inventory (999 Platinum)', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1007', accountName: 'Diamond Inventory (by carat)', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1008', accountName: 'Stone Inventory (precious/semi-precious)', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1009', accountName: 'Prepaid Expenses', accountType: 'asset', category: 'Current Asset' },
        { accountCode: 'MAIN-1010', accountName: 'GST Input Tax Credit', accountType: 'asset', category: 'Current Asset' },

        // Fixed Assets (1200-1299) - 6 Accounts
        { accountCode: 'MAIN-1201', accountName: 'Jewelry Display Cases & Fixtures', accountType: 'asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1202', accountName: 'Jewelry Making Equipment', accountType: 'asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1203', accountName: 'Vehicles', accountType: 'asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1204', accountName: 'Buildings', accountType: 'asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1205', accountName: 'Accumulated Depreciation', accountType: 'asset', category: 'Fixed Asset' },
        { accountCode: 'MAIN-1206', accountName: 'Land', accountType: 'asset', category: 'Fixed Asset' },

        // LIABILITIES (2000-2999) - 8 Accounts
        // Current Liabilities (2000-2099) - 5 Accounts
        { accountCode: 'MAIN-2001', accountName: 'Accounts Payable', accountType: 'liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2002', accountName: 'GST Payable', accountType: 'liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2003', accountName: 'Salaries Payable', accountType: 'liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2004', accountName: 'Utilities Payable', accountType: 'liability', category: 'Current Liability' },
        { accountCode: 'MAIN-2005', accountName: 'Loans Payable - Short Term', accountType: 'liability', category: 'Current Liability' },

        // Long-term Liabilities (2100-2199) - 3 Accounts
        { accountCode: 'MAIN-2101', accountName: 'Loans Payable - Long Term', accountType: 'liability', category: 'Long-term Liability' },
        { accountCode: 'MAIN-2102', accountName: "Owner's Loan", accountType: 'liability', category: 'Long-term Liability' },
        { accountCode: 'MAIN-2103', accountName: 'Deferred Tax Liability', accountType: 'liability', category: 'Long-term Liability' },

        // EQUITY (3000-3999) - 5 Accounts
        { accountCode: 'MAIN-3001', accountName: "Owner's Capital", accountType: 'equity', category: 'Equity' },
        { accountCode: 'MAIN-3002', accountName: 'Retained Earnings', accountType: 'equity', category: 'Equity' },
        { accountCode: 'MAIN-3003', accountName: 'Current Year Profit/Loss', accountType: 'equity', category: 'Equity' },
        { accountCode: 'MAIN-3004', accountName: 'Opening Balance Equity', accountType: 'equity', category: 'Equity' },
        { accountCode: 'MAIN-3005', accountName: 'Drawings', accountType: 'equity', category: 'Equity' },

        // INCOME (4000-4999) - 8 Accounts
        { accountCode: 'MAIN-4001', accountName: 'Jewelry Sales Revenue', accountType: 'income', category: 'Revenue' },
        { accountCode: 'MAIN-4002', accountName: 'Making Charges Income', accountType: 'income', category: 'Revenue' },
        { accountCode: 'MAIN-4003', accountName: 'Commission Income', accountType: 'income', category: 'Revenue' },
        { accountCode: 'MAIN-4004', accountName: 'Interest Income', accountType: 'income', category: 'Revenue' },
        { accountCode: 'MAIN-4005', accountName: 'Discount Received', accountType: 'income', category: 'Revenue' },
        { accountCode: 'MAIN-4006', accountName: 'Late Payment Fees', accountType: 'income', category: 'Revenue' },
        { accountCode: 'MAIN-4007', accountName: 'Hallmarking & Certification Fees', accountType: 'income', category: 'Revenue' },
        { accountCode: 'MAIN-4008', accountName: 'Repair Service Income', accountType: 'income', category: 'Revenue' },

        // EXPENSES (5000-5999) - 10 Accounts
        { accountCode: 'MAIN-5001', accountName: 'Cost of Metals Purchased', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5002', accountName: 'Manufacturing Cost Paid', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5101', accountName: 'Salaries & Wages', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5102', accountName: 'Utilities', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5103', accountName: 'Rent', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5104', accountName: 'Insurance', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5105', accountName: 'Repairs & Maintenance', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5106', accountName: 'Advertising & Marketing', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5107', accountName: 'Wastage Loss', accountType: 'expense', category: 'Expense' },
        { accountCode: 'MAIN-5108', accountName: 'Hallmarking & Certification', accountType: 'expense', category: 'Expense' }
      ];

      const results = {
        created: [],
        skipped: [],
        errors: []
      };

      // Create each core account
      for (const accountData of coreAccounts) {
        try {
          // Check if account already exists
          const existingAccount = await this.getAccountByCode(accountData.accountCode);
          if (existingAccount) {
            results.skipped.push(`${accountData.accountCode}: ${accountData.accountName} (already exists)`);
            continue;
          }

          // Create the account
          const createdAccount = await this.createMainAccount({
            accountCode: accountData.accountCode,
            accountName: accountData.accountName,
            accountType: accountData.accountType,
            category: accountData.category,
            balance: 0
          });

          results.created.push(`${accountData.accountCode}: ${accountData.accountName}`);

        } catch (error) {
          results.errors.push(`${accountData.accountCode}: ${error.message}`);
        }
      }

      return {
        success: results.errors.length === 0,
        totalAccounts: coreAccounts.length,
        createdCount: results.created.length,
        skippedCount: results.skipped.length,
        errorCount: results.errors.length,
        results
      };

    } catch (error) {
      console.error('Initialize core accounts error:', error);
      throw error;
    }
  }

  /**
   * Create branch-level accounts when a new branch is added
   * Now uses centralized createAccount method for consistency
   * @param {object} branchData - Branch data (branchId, branchName)
   * @returns {object} - Creation results
   */
  async createBranchAccounts(branchData) {
    try {
      const { branchId, branchName } = branchData;

      // Validate branch data
      if (!branchId || !branchName) {
        throw new Error('Branch ID and name are required');
      }

      // Generate branch account code (BR001, BR002, etc.)
      const branchAccountCode = `BR${branchId.replace('BR', '').padStart(3, '0')}`;

      const branchAccounts = [
        // 1. Branch Cash Account (Child of MAIN-1001)
        {
          accountCode: `${branchAccountCode}-CASH`,
          accountName: `${branchName} - Cash`,
          accountType: 'asset',
          category: 'current_assets', // Standardized category format
          parentAccount: 'MAIN-1001', // Standardized field name
          branchId: branchId,
          currentBalance: 0 // Standardized field name
        },

        // 2. Branch Bank Account (Child of MAIN-1002)
        {
          accountCode: `${branchAccountCode}-BANK`,
          accountName: `${branchName} - Bank`,
          accountType: 'asset',
          category: 'current_assets', // Standardized category format
          parentAccount: 'MAIN-1002', // Standardized field name
          branchId: branchId,
          currentBalance: 0 // Standardized field name
        },

        // 3. Branch Receivables (Child of MAIN-1003)
        {
          accountCode: `${branchAccountCode}-REC`,
          accountName: `${branchName} - Receivables`,
          accountType: 'asset',
          category: 'current_assets', // Standardized category format
          parentAccount: 'MAIN-1003', // Standardized field name
          branchId: branchId,
          currentBalance: 0 // Standardized field name
        },

        // 4. Branch Revenue Account (Child of MAIN-4001)
        {
          accountCode: `${branchAccountCode}-REV`,
          accountName: `${branchName} - Revenue`,
          accountType: 'income',
          category: 'revenue', // Standardized category format
          parentAccount: 'MAIN-4001', // Standardized field name
          branchId: branchId,
          currentBalance: 0 // Standardized field name
        }
      ];

      const results = {
        created: [],
        skipped: [],
        errors: []
      };

      // Create each branch account using centralized method
      for (const accountData of branchAccounts) {
        try {
          // Check if account already exists
          const existingAccount = await this.getAccountByCode(accountData.accountCode);
          if (existingAccount) {
            results.skipped.push(`${accountData.accountCode}: ${accountData.accountName} (already exists)`);
            continue;
          }

          // Get parent account for additional data
          const parentAccount = await this.getAccountByCode(accountData.parentAccount);

          // Call CORE createAccount method with branch-specific additional fields
          const createdAccount = await this.createAccount({
            accountCode: accountData.accountCode,
            accountName: accountData.accountName,
            accountType: accountData.accountType,
            category: accountData.category,
            currentBalance: accountData.currentBalance,
            parentAccount: accountData.parentAccount,
            level: 2, // Child level
            isSystem: false,
            createdBy: 'system'
          }, {
            // Branch-specific additional fields
            branchId: accountData.branchId,
            parentAccountName: parentAccount?.accountName || 'Unknown Parent',
            normalBalance: parentAccount?.normalBalance || this.getNormalBalance(accountData.accountType),
            traditionalClass: parentAccount?.traditionalClass || this.getDefaultTraditionalClass(accountData.accountType),
            // Migration-ready fields
            _version: "2.0",
            _migrationStatus: "active",
            _v3Ready: true,
            _v4Ready: false
          });

          results.created.push(`${accountData.accountCode}: ${accountData.accountName}`);

        } catch (error) {
          results.errors.push(`${accountData.accountCode}: ${error.message}`);
        }
      }

      return {
        success: results.errors.length === 0,
        totalAccounts: branchAccounts.length,
        createdCount: results.created.length,
        skippedCount: results.skipped.length,
        errorCount: results.errors.length,
        branchCode: branchAccountCode,
        results
      };

    } catch (error) {
      console.error('Create branch accounts error:', error);
      throw error;
    }
  }

  /**
   * Create customer-level accounts for receivable tracking
   * Now uses centralized createAccount method for consistency
   * @param {object} customerData - Customer data (customerId, customerName)
   * @returns {object} - Creation results
   */
  async createCustomerAccount(customerData) {
    try {
      const { customerId, customerName } = customerData;

      // Validate customer data
      if (!customerId || !customerName) {
        throw new Error('Customer ID and name are required');
      }

      // Generate customer account code (CUST-XXXX format)
      const customerNumber = customerId.includes('-')
        ? customerId.split('-')[1]
        : customerId.padStart(4, '0');
      const customerAccountCode = `CUST-${customerNumber}`;

      // Check if account already exists
      const existingAccount = await this.getAccountByCode(customerAccountCode);
      if (existingAccount) {
        return {
          success: true,
          created: false,
          account: existingAccount,
          message: `Customer account ${customerAccountCode} already exists`
        };
      }

      // Get parent account (MAIN-1003 - Customer Receivables)
      const parentAccount = await this.getAccountByCode('MAIN-1003') || await this.getAccountByCode('1301');
      if (!parentAccount) {
        throw new Error('Parent account (Customer Receivables) not found');
      }

      // Call CORE createAccount method with customer-specific additional fields
      const createdAccount = await this.createAccount({
        accountCode: customerAccountCode,
        accountName: `${customerName} - Receivable`,
        accountType: 'asset',
        category: 'current_assets',
        currentBalance: 0,
        parentAccount: parentAccount.accountCode || '1301',
        level: 2, // Child level
        isSystem: false,
        createdBy: 'system'
      }, {
        // Customer-specific additional fields
        customerId,
        parentAccountName: parentAccount.accountName || 'Customer Receivables',
        normalBalance: 'debit',
        traditionalClass: 'Asset',
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      });

      return {
        success: true,
        created: true,
        account: createdAccount,
        message: `Customer account ${customerAccountCode} created successfully`
      };

    } catch (error) {
      console.error('Create customer account error:', error);
      throw error;
    }
  }

  /**
   * Create gold bank-level accounts for gold custody tracking
   * Calls the CORE createAccount method
   * @param {object} goldBankData - Gold bank data (goldBankId, bankName, location)
   * @returns {object} - Creation results
   */
  async createGoldBankAccount(goldBankData) {
    try {
      const { goldBankId, bankName, location } = goldBankData;

      // Validate gold bank data
      if (!goldBankId || !bankName) {
        throw new Error('Gold bank ID and name are required');
      }

      // Generate gold bank account code (1101-BANK-XXX format)
      const bankNumber = goldBankId.includes('-')
        ? goldBankId.split('-').pop()
        : goldBankId.slice(-3).padStart(3, '0');
      const goldBankAccountCode = `1101-BANK-${bankNumber}`;

      // Check if account already exists
      const existingAccount = await this.getAccountByCode(goldBankAccountCode);
      if (existingAccount) {
        return {
          success: true,
          created: false,
          account: existingAccount,
          message: `Gold bank account ${goldBankAccountCode} already exists`
        };
      }

      // Get parent account (1101 - Gold Bank)
      const parentAccount = await this.getAccountByCode('1101');
      if (!parentAccount) {
        throw new Error('Parent account (Gold Bank) not found');
      }

      // Call CORE createAccount method with gold bank-specific additional fields
      const createdAccount = await this.createAccount({
        accountCode: goldBankAccountCode,
        accountName: `${bankName} - Gold Custody`,
        accountType: 'asset',
        category: 'current_assets',
        currentBalance: 0,
        parentAccount: '1101',
        level: 2, // Child level
        isSystem: false,
        createdBy: 'system'
      }, {
        // Gold bank-specific additional fields
        goldBankId,
        bankName,
        location,
        parentAccountName: parentAccount.accountName || 'Gold Bank (Sharaf)',
        normalBalance: 'debit',
        traditionalClass: 'Asset',
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      });

      return {
        success: true,
        created: true,
        account: createdAccount,
        message: `Gold bank account ${goldBankAccountCode} created successfully`
      };

    } catch (error) {
      console.error('Create gold bank account error:', error);
      throw error;
    }
  }

  /**
   * Create manufacturer-level accounts for manufacturing payables tracking
   * Calls the CORE createAccount method
   * @param {object} manufacturerData - Manufacturer data (manufacturerId, manufacturerName)
   * @returns {object} - Creation results
   */
  async createManufacturerAccount(manufacturerData) {
    try {
      const { manufacturerId, manufacturerName } = manufacturerData;

      // Validate manufacturer data
      if (!manufacturerId || !manufacturerName) {
        throw new Error('Manufacturer ID and name are required');
      }

      // Generate manufacturer account code (2101-MFG-XXX format)
      const manufacturerNumber = manufacturerId.includes('-')
        ? manufacturerId.split('-').pop()
        : manufacturerId.slice(-3).padStart(3, '0');
      const manufacturerAccountCode = `2101-MFG-${manufacturerNumber}`;

      // Check if account already exists
      const existingAccount = await this.getAccountByCode(manufacturerAccountCode);
      if (existingAccount) {
        return {
          success: true,
          created: false,
          account: existingAccount,
          message: `Manufacturer account ${manufacturerAccountCode} already exists`
        };
      }

      // Get parent account (2101 - Accounts Payable)
      const parentAccount = await this.getAccountByCode('2101');
      if (!parentAccount) {
        throw new Error('Parent account (Accounts Payable) not found');
      }

      // Call CORE createAccount method with manufacturer-specific additional fields
      const createdAccount = await this.createAccount({
        accountCode: manufacturerAccountCode,
        accountName: `${manufacturerName} - Payables`,
        accountType: 'liability',
        category: 'current_liabilities',
        currentBalance: 0,
        parentAccount: '2101',
        level: 2, // Child level
        isSystem: false,
        createdBy: 'system'
      }, {
        // Manufacturer-specific additional fields
        manufacturerId,
        manufacturerName,
        balanceType: 'credit',
        normalBalance: 'credit',
        traditionalClass: 'Liability',
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      });

      return {
        success: true,
        created: true,
        account: createdAccount,
        message: `Manufacturer account ${manufacturerAccountCode} created successfully`
      };

    } catch (error) {
      console.error('Create manufacturer account error:', error);
      throw error;
    }
  }

  /**
   * Create manufacturer gold transit-level accounts for gold custody tracking per manufacturer
   * Calls the CORE createAccount method
   * @param {object} manufacturerData - Manufacturer data (manufacturerId, manufacturerName)
   * @returns {object} - Creation results
   */
  async createManufacturerGoldTransitAccount(manufacturerData) {
    try {
      const { manufacturerId, manufacturerName } = manufacturerData;

      // Validate manufacturer data
      if (!manufacturerId || !manufacturerName) {
        throw new Error('Manufacturer ID and name are required');
      }

      // Generate manufacturer gold transit account code (1102-MFG-XXX format)
      const manufacturerNumber = manufacturerId.includes('-')
        ? manufacturerId.split('-').pop()
        : manufacturerId.slice(-3).padStart(3, '0');
      const goldTransitAccountCode = `1102-MFG-${manufacturerNumber}`;

      // Check if account already exists
      const existingAccount = await this.getAccountByCode(goldTransitAccountCode);
      if (existingAccount) {
        return {
          success: true,
          created: false,
          account: existingAccount,
          message: `Manufacturer gold transit account ${goldTransitAccountCode} already exists`
        };
      }

      // Get parent account (1102 - Gold in Transit)
      const parentAccount = await this.getAccountByCode('1102');
      if (!parentAccount) {
        throw new Error('Parent account (Gold in Transit) not found');
      }

      // Call CORE createAccount method with manufacturer gold transit-specific additional fields
      const createdAccount = await this.createAccount({
        accountCode: goldTransitAccountCode,
        accountName: `${manufacturerName} - Gold in Transit`,
        accountType: 'asset',
        category: 'current_assets',
        currentBalance: 0,
        parentAccount: '1102',
        level: 2, // Child level
        isSystem: false,
        createdBy: 'system'
      }, {
        // Manufacturer gold transit-specific additional fields
        manufacturerId,
        manufacturerName,
        parentAccountName: parentAccount.accountName || 'Gold in Transit',
        normalBalance: 'debit',
        traditionalClass: 'Asset',
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      });

      return {
        success: true,
        created: true,
        account: createdAccount,
        message: `Manufacturer gold transit account ${goldTransitAccountCode} created successfully`
      };

    } catch (error) {
      console.error('Create manufacturer gold transit account error:', error);
      throw error;
    }
  }

  /**
   * Get account hierarchy path from root to specified account
   * Returns array of account objects from root parent down to the target account
   * @param {string} accountCode - Account code to get hierarchy for
   * @returns {Array} - Array of account objects in hierarchy order
   */
  async getAccountHierarchyPath(accountCode) {
    try {
      const hierarchy = [];
      let currentAccount = await this.getAccountByCode(accountCode);

      if (!currentAccount) {
        throw new Error(`Account ${accountCode} not found`);
      }

      // Build hierarchy path from leaf to root
      while (currentAccount) {
        hierarchy.unshift(currentAccount); // Add to beginning for root-to-leaf order

        // If no parent, we've reached the root
        if (!currentAccount.parentAccountId) {
          break;
        }

        // Get parent account
        currentAccount = await this.getAccountByCode(currentAccount.parentAccountId);
      }

      return hierarchy;

    } catch (error) {
      console.error('Get account hierarchy path error:', error);
      throw error;
    }
  }

  /**
   * Get all child accounts of a parent account (recursive)
   * @param {string} parentAccountCode - Parent account code
   * @returns {Array} - Array of all child account objects
   */
  async getChildAccounts(parentAccountCode) {
    try {
      const allAccounts = await this.getAllAccounts();
      const childAccounts = [];

      // Find all accounts that have the specified parent
      for (const account of allAccounts) {
        if (account.parentAccountId === parentAccountCode) {
          childAccounts.push(account);
          // Recursively get children of this child
          const grandchildren = await this.getChildAccounts(account.accountCode);
          childAccounts.push(...grandchildren);
        }
      }

      return childAccounts;

    } catch (error) {
      console.error('Get child accounts error:', error);
      throw error;
    }
  }

  /**
   * Get all accounts in the system
   * @returns {Array} - Array of all account objects
   */
  async getAllAccounts() {
    try {
      const accountsRef = collection(db, this.paths.accountsPath());
      const querySnapshot = await getDocs(accountsRef);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Get all accounts error:', error);
      return [];
    }
  }

  /**
   * Validate account hierarchy structure
   * Checks for circular references, orphaned accounts, and invalid parent relationships
   * @returns {object} - Validation results with issues found
   */
  async validateAccountHierarchy() {
    try {
      const allAccounts = await this.getAllAccounts();
      const issues = {
        circularReferences: [],
        orphanedAccounts: [],
        invalidParents: [],
        duplicateCodes: []
      };

      // Check for duplicate account codes
      const codeMap = new Map();
      for (const account of allAccounts) {
        if (codeMap.has(account.accountCode)) {
          issues.duplicateCodes.push({
            accountCode: account.accountCode,
            accounts: [codeMap.get(account.accountCode), account]
          });
        } else {
          codeMap.set(account.accountCode, account);
        }
      }

      // Check each account
      for (const account of allAccounts) {
        // Check for orphaned accounts (no parent and not a root account)
        if (!account.parentAccountId && !account.accountCode.startsWith('MAIN-')) {
          issues.orphanedAccounts.push(account);
        }

        // Check for invalid parent references
        if (account.parentAccountId) {
          const parentAccount = await this.getAccountByCode(account.parentAccountId);
          if (!parentAccount) {
            issues.invalidParents.push({
              account: account,
              invalidParent: account.parentAccountId
            });
          }
        }

        // Check for circular references (limited depth to prevent infinite loops)
        const visited = new Set();
        let currentAccount = account;
        let depth = 0;
        const maxDepth = 10; // Prevent infinite loops

        while (currentAccount && currentAccount.parentAccountId && depth < maxDepth) {
          if (visited.has(currentAccount.accountCode)) {
            issues.circularReferences.push({
              account: account,
              cycle: Array.from(visited).concat([currentAccount.accountCode])
            });
            break;
          }

          visited.add(currentAccount.accountCode);
          currentAccount = await this.getAccountByCode(currentAccount.parentAccountId);
          depth++;
        }

        if (depth >= maxDepth) {
          issues.circularReferences.push({
            account: account,
            message: 'Hierarchy depth exceeded maximum limit'
          });
        }
      }

      return {
        isValid: issues.circularReferences.length === 0 &&
                 issues.orphanedAccounts.length === 0 &&
                 issues.invalidParents.length === 0 &&
                 issues.duplicateCodes.length === 0,
        totalAccounts: allAccounts.length,
        issues
      };

    } catch (error) {
      console.error('Validate account hierarchy error:', error);
      throw error;
    }
  }

  /**
   * Get account tree structure for a given root account
   * Returns hierarchical tree with children nested under parents
   * @param {string} rootAccountCode - Root account code to build tree from
   * @returns {object} - Tree structure with nested children
   */
  async getAccountTree(rootAccountCode) {
    try {
      const rootAccount = await this.getAccountByCode(rootAccountCode);
      if (!rootAccount) {
        throw new Error(`Root account ${rootAccountCode} not found`);
      }

      // Get all child accounts
      const childAccounts = await this.getChildAccounts(rootAccountCode);

      // Build tree structure
      const buildTree = (parentCode) => {
        const children = childAccounts.filter(account => account.parentAccountId === parentCode);
        return children.map(child => ({
          ...child,
          children: buildTree(child.accountCode)
        }));
      };

      return {
        ...rootAccount,
        children: buildTree(rootAccountCode)
      };

    } catch (error) {
      console.error('Get account tree error:', error);
      throw error;
    }
  }

  /**
   * Get accounts by level in hierarchy
   * @param {string} level - Account level ('MAIN', 'BR', 'CUST', etc.)
   * @returns {Array} - Array of accounts at specified level
   */
  async getAccountsByLevel(level) {
    try {
      const allAccounts = await this.getAllAccounts();
      return allAccounts.filter(account => {
        if (level === 'MAIN') {
          return account.accountCode.startsWith('MAIN-');
        } else if (level === 'BR') {
          return account.accountCode.startsWith('BR') && !account.accountCode.includes('-CASH') &&
                 !account.accountCode.includes('-BANK') && !account.accountCode.includes('-REC') &&
                 !account.accountCode.includes('-REV');
        } else if (level === 'CUST') {
          return account.accountCode.startsWith('CUST-');
        }
        return false;
      });

    } catch (error) {
      console.error('Get accounts by level error:', error);
      throw error;
    }
  }

  /**
   * Create van seller accounts for commission and balance tracking
   * Based on BRD_v2.md Section 6.3 and commission tracking requirements
   * Creates 5-6 accounts automatically when van seller is added
   * @param {object} vanSellerData - Van seller data (vanSellerId, name, branchId)
   * @returns {object} - Creation results
   */
  async createVanSellerAccount(vanSellerData) {
    try {
      const { vanSellerId, name, branchId } = vanSellerData;

      // Validate van seller data
      if (!vanSellerId || !name) {
        throw new Error('Van seller ID and name are required');
      }

      // Generate van seller account code (VS001, VS002, etc.)
      const sellerNumber = vanSellerId.replace('VS', '').padStart(3, '0');
      const sellerAccountCode = `VS${sellerNumber}`;

      const vanSellerAccounts = [
        // 1. Commission Payable (Child of MAIN-2001 - Accounts Payable)
        {
          accountCode: `${sellerAccountCode}-COMM-PAY`,
          accountName: `${name} - Commission Payable`,
          accountType: 'liability',
          category: 'Current Liability',
          parentAccountId: 'MAIN-2001', // Accounts Payable
          vanSellerId: vanSellerId,
          balance: 0
        },

        // 2. Commission Expense (Child of MAIN-5101 - Salaries & Wages)
        {
          accountCode: `${sellerAccountCode}-COMM-EXP`,
          accountName: `${name} - Commission Expense`,
          accountType: 'expense',
          category: 'Operating Expense',
          parentAccountId: 'MAIN-5101', // Salaries & Wages
          vanSellerId: vanSellerId,
          balance: 0
        },

        // 3. Advances Receivable (Child of MAIN-1003 - Accounts Receivable)
        {
          accountCode: `${sellerAccountCode}-ADV-REC`,
          accountName: `${name} - Advances Receivable`,
          accountType: 'asset',
          category: 'Current Asset',
          parentAccountId: 'MAIN-1003', // Accounts Receivable
          vanSellerId: vanSellerId,
          balance: 0
        },

        // 4. Cash Collections (Child of MAIN-1001 - Cash in Hand)
        {
          accountCode: `${sellerAccountCode}-CASH-COLL`,
          accountName: `${name} - Cash Collections`,
          accountType: 'asset',
          category: 'Current Asset',
          parentAccountId: 'MAIN-1001', // Cash in Hand
          vanSellerId: vanSellerId,
          balance: 0
        },

        // 5. Sales Revenue (Child of MAIN-4001 - Sales Revenue)
        {
          accountCode: `${sellerAccountCode}-SALES-REV`,
          accountName: `${name} - Sales Revenue`,
          accountType: 'income',
          category: 'Revenue',
          parentAccountId: 'MAIN-4001', // Sales Revenue
          vanSellerId: vanSellerId,
          balance: 0
        }
      ];

      const results = {
        created: [],
        skipped: [],
        errors: []
      };

      // Create each van seller account
      for (const accountData of vanSellerAccounts) {
        try {
          // Check if account already exists
          const existingAccount = await this.getAccountByCode(accountData.accountCode);
          if (existingAccount) {
            results.skipped.push(`${accountData.accountCode}: ${accountData.accountName} (already exists)`);
            continue;
          }

          // Create the account using createChildAccount method
          const createdAccount = await this.createChildAccount(
            accountData.parentAccountId,
            {
              accountName: accountData.accountName,
              balance: accountData.balance
            }
          );

          // Update with van seller-specific data
          const accountRef = doc(db, this.paths.accountsPath(), createdAccount.accountCode);
          await setDoc(accountRef, {
            vanSellerId: accountData.vanSellerId,
            category: accountData.category,
            branchId: branchId || null // Optional branch association
          }, { merge: true });

          results.created.push(`${accountData.accountCode}: ${accountData.accountName}`);

        } catch (error) {
          results.errors.push(`${accountData.accountCode}: ${error.message}`);
        }
      }

      return {
        success: results.errors.length === 0,
        totalAccounts: vanSellerAccounts.length,
        createdCount: results.created.length,
        skippedCount: results.skipped.length,
        errorCount: results.errors.length,
        sellerCode: sellerAccountCode,
        results
      };

    } catch (error) {
      console.error('Create van seller accounts error:', error);
      throw error;
    }
  }
}
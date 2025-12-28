// src/utils/companyInitializer.js
import { collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../app/firebase';

// Utility function to get firestore paths (non-hook version)
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    accountsPath: () => `${tenantCompaniesPath}/${companyId}/accounts`,
    warehousesPath: () => `${tenantCompaniesPath}/${companyId}/warehouses`,
    categoriesPath: () => `${tenantCompaniesPath}/${companyId}/categories`,
    rolesPath: () => `${tenantCompaniesPath}/${companyId}/roles`,
    settingsPath: () => `${tenantCompaniesPath}/${companyId}/settings`,
    reportTemplatesPath: () => `${tenantCompaniesPath}/${companyId}/reportTemplates`,
    companyDocPath: () => `${tenantCompaniesPath}/${companyId}`
  };
};

export class CompanyInitializer {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
  }

  /**
   * Check if company has been initialized
   */
  async isCompanyInitialized() {
    const companyDocRef = doc(db, this.paths.companyDocPath());
    const companyDoc = await getDoc(companyDocRef);

    if (!companyDoc.exists()) return false;
    return companyDoc.data().isInitialized === true;
  }

  /**
   * Initialize company on first admin login
   * Creates 39 core accounts automatically
   */
  async initializeCompany(adminUserId) {
    try {
      console.log('🚀 Initializing company...');

      // Step 1: Create 39 core firm accounts
      await this.createCoreAccounts();

      // Step 2: Initialize inventory categories
      await this.initializeInventoryStructure();

      // Step 3: Setup default user roles
      await this.setupDefaultRoles();

      // Step 4: Initialize settings
      await this.initializeSettings();

      // Step 5: Create default report templates
      await this.createReportTemplates();

      // Step 6: Mark company as initialized
      await this.markCompanyInitialized(adminUserId);

      console.log('✅ Company initialization complete!');
      return { success: true, message: 'Company setup completed successfully' };
    } catch (error) {
      console.error('❌ Company initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create 39 core company accounts
   * Account Codes: MAIN-1001 to MAIN-5107
   */
  async createCoreAccounts() {
    const accountsPath = this.paths.accountsPath();

    const coreAccounts = [
      // 🏦 ASSETS (1000-1999) - 12 Accounts
      { accountId: 'MAIN-1001', accountName: 'Cash in Hand', accountType: 'Asset', classification: 'Current Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-1002', accountName: 'Bank Account - Primary', accountType: 'Asset', classification: 'Current Asset', parentAccountId: null, normalBalance: 'Debit', isParent: true },
      { accountId: 'MAIN-1003', accountName: 'Accounts Receivable', accountType: 'Asset', classification: 'Current Asset', parentAccountId: null, normalBalance: 'Debit', isParent: true },
      { accountId: 'MAIN-1004', accountName: 'Inventory', accountType: 'Asset', classification: 'Current Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-1005', accountName: 'Prepaid Expenses', accountType: 'Asset', classification: 'Current Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-1006', accountName: 'GST Input Tax Credit', accountType: 'Asset', classification: 'Current Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-1201', accountName: 'Furniture & Fixtures', accountType: 'Asset', classification: 'Fixed Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-1202', accountName: 'Equipment', accountType: 'Asset', classification: 'Fixed Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-1203', accountName: 'Vehicles', accountType: 'Asset', classification: 'Fixed Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-1204', accountName: 'Buildings', accountType: 'Asset', classification: 'Fixed Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-1205', accountName: 'Accumulated Depreciation', accountType: 'Asset', classification: 'Fixed Asset', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-1206', accountName: 'Land', accountType: 'Asset', classification: 'Fixed Asset', parentAccountId: null, normalBalance: 'Debit', isParent: false },

      // 💰 LIABILITIES (2000-2999) - 8 Accounts
      { accountId: 'MAIN-2001', accountName: 'Accounts Payable', accountType: 'Liability', classification: 'Current Liability', parentAccountId: null, normalBalance: 'Credit', isParent: true },
      { accountId: 'MAIN-2002', accountName: 'GST Payable', accountType: 'Liability', classification: 'Current Liability', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-2003', accountName: 'Salaries Payable', accountType: 'Liability', classification: 'Current Liability', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-2004', accountName: 'Utilities Payable', accountType: 'Liability', classification: 'Current Liability', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-2005', accountName: 'Loans Payable - Short Term', accountType: 'Liability', classification: 'Current Liability', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-2101', accountName: 'Loans Payable - Long Term', accountType: 'Liability', classification: 'Long-term Liability', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-2102', accountName: "Owner's Loan", accountType: 'Liability', classification: 'Long-term Liability', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-2103', accountName: 'Deferred Tax Liability', accountType: 'Liability', classification: 'Long-term Liability', parentAccountId: null, normalBalance: 'Credit', isParent: false },

      // 🎯 EQUITY (3000-3999) - 5 Accounts
      { accountId: 'MAIN-3001', accountName: "Owner's Capital", accountType: 'Equity', classification: 'Equity', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-3002', accountName: 'Retained Earnings', accountType: 'Equity', classification: 'Equity', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-3003', accountName: 'Current Year Profit/Loss', accountType: 'Equity', classification: 'Equity', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-3004', accountName: 'Opening Balance Equity', accountType: 'Equity', classification: 'Equity', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-3005', accountName: 'Drawings', accountType: 'Equity', classification: 'Equity', parentAccountId: null, normalBalance: 'Debit', isParent: false },

      // 💵 INCOME (4000-4999) - 6 Accounts
      { accountId: 'MAIN-4001', accountName: 'Sales Revenue', accountType: 'Income', classification: 'Operating Income', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-4002', accountName: 'Service Income', accountType: 'Income', classification: 'Operating Income', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-4003', accountName: 'Other Income', accountType: 'Income', classification: 'Non-operating Income', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-4004', accountName: 'Interest Income', accountType: 'Income', classification: 'Non-operating Income', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-4005', accountName: 'Discount Received', accountType: 'Income', classification: 'Other Income', parentAccountId: null, normalBalance: 'Credit', isParent: false },
      { accountId: 'MAIN-4006', accountName: 'Late Payment Fees', accountType: 'Income', classification: 'Other Income', parentAccountId: null, normalBalance: 'Credit', isParent: false },

      // 💸 EXPENSES (5000-5999) - 8 Accounts
      { accountId: 'MAIN-5001', accountName: 'Cost of Goods Sold', accountType: 'Expense', classification: 'Cost of Sales', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-5101', accountName: 'Salaries & Wages', accountType: 'Expense', classification: 'Operating Expense', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-5102', accountName: 'Utilities', accountType: 'Expense', classification: 'Operating Expense', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-5103', accountName: 'Rent', accountType: 'Expense', classification: 'Operating Expense', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-5104', accountName: 'Insurance', accountType: 'Expense', classification: 'Operating Expense', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-5105', accountName: 'Repairs & Maintenance', accountType: 'Expense', classification: 'Operating Expense', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-5106', accountName: 'Advertising & Marketing', accountType: 'Expense', classification: 'Operating Expense', parentAccountId: null, normalBalance: 'Debit', isParent: false },
      { accountId: 'MAIN-5107', accountName: 'Office Supplies', accountType: 'Expense', classification: 'Operating Expense', parentAccountId: null, normalBalance: 'Debit', isParent: false },
    ];

    // Create all core accounts
    const promises = coreAccounts.map(account => {
      const accountDocRef = doc(db, this.paths.accountsPath(), account.accountId);
      return setDoc(accountDocRef, {
        ...account,
        currentBalance: 0,
        companyId: this.companyId,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      });
    });

    await Promise.all(promises);
    console.log(`✅ Created ${coreAccounts.length} core accounts`);
  }

  /**
   * Initialize inventory structure
   */
  async initializeInventoryStructure() {
    // Create default warehouses
    const mainWarehouse = {
      warehouseId: 'WH-MAIN',
      warehouseName: 'Main Warehouse',
      location: 'Head Office',
      isActive: true,
      companyId: this.companyId,
      createdAt: Timestamp.now(),
      // Migration-ready fields
      _version: "2.0",
      _migrationStatus: "active",
      _v3Ready: true,
      _v4Ready: false
    };
    await setDoc(doc(db, this.paths.warehousesPath(), 'WH-MAIN'), mainWarehouse);

    // Create default product categories
    const defaultCategories = [
      { categoryId: 'CAT-001', categoryName: 'General', isActive: true },
      { categoryId: 'CAT-002', categoryName: 'Laundry Supplies', isActive: true },
    ];

    for (const category of defaultCategories) {
      await setDoc(doc(db, this.paths.categoriesPath(), category.categoryId), {
        ...category,
        companyId: this.companyId,
        createdAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      });
    }

    console.log('✅ Inventory structure initialized');
  }

  /**
   * Setup default user roles
   */
  async setupDefaultRoles() {
    const defaultRoles = [
      {
        roleId: 'company_admin',
        roleName: 'Company Admin',
        isSystem: true,
        permissions: {
          dashboard: { read: true, write: true },
          orders: { read: true, write: true, delete: true },
          products: { read: true, write: true, delete: true },
          inventory: { read: true, write: true, delete: true },
          accounting: { read: true, write: true, delete: true },
          users: { read: true, write: true, delete: true },
          reports: { read: true, write: true, export: true },
          settings: { read: true, write: true, delete: true }
        },
        createdAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      },
      {
        roleId: 'general_manager',
        roleName: 'General Manager',
        isSystem: true,
        permissions: {
          dashboard: { read: true, write: false },
          orders: { read: true, write: true, delete: false },
          products: { read: true, write: true, delete: false },
          inventory: { read: true, write: true, delete: false },
          accounting: { read: true, write: false, delete: false },
          users: { read: true, write: false, delete: false },
          reports: { read: true, write: false, export: true },
          settings: { read: true, write: false, delete: false }
        },
        createdAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      },
      {
        roleId: 'accountant',
        roleName: 'Accountant',
        isSystem: true,
        permissions: {
          dashboard: { read: true, write: false },
          orders: { read: true, write: false, delete: false },
          products: { read: true, write: false, delete: false },
          inventory: { read: false, write: false, delete: false },
          accounting: { read: true, write: true, delete: false },
          users: { read: false, write: false, delete: false },
          reports: { read: true, write: false, export: true },
          settings: { read: true, write: false, delete: false }
        },
        createdAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      }
    ];

    for (const role of defaultRoles) {
      await setDoc(doc(db, this.paths.rolesPath(), role.roleId), role);
    }

    console.log('✅ Default roles created');
  }

  /**
   * Initialize company settings
   */
  async initializeSettings() {
    const defaultSettings = {
      settingId: 'general',
      fiscalYearStart: '01-04', // April 1st
      gstRate: 18,
      currency: 'INR',
      companyId: this.companyId,
      createdAt: Timestamp.now(),
      // Migration-ready fields
      _version: "2.0",
      _migrationStatus: "active",
      _v3Ready: true,
      _v4Ready: false
    };

    await setDoc(doc(db, this.paths.settingsPath(), 'general'), defaultSettings);
    console.log('✅ Settings initialized');
  }

  /**
   * Create default report templates
   */
  async createReportTemplates() {
    // Create basic P&L and Balance Sheet templates
    const templates = [
      {
        templateId: 'PL-DEFAULT',
        templateName: 'Profit & Loss Statement',
        templateType: 'report',
        reportType: 'profit_loss',
        structure: {
          income: ['MAIN-4001', 'MAIN-4002', 'MAIN-4003'],
          expenses: ['MAIN-5001', 'MAIN-5101', 'MAIN-5102', 'MAIN-5103']
        },
        isDefault: true,
        createdAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      },
      {
        templateId: 'BS-DEFAULT',
        templateName: 'Balance Sheet',
        templateType: 'report',
        reportType: 'balance_sheet',
        structure: {
          assets: ['MAIN-1001', 'MAIN-1002', 'MAIN-1003', 'MAIN-1004'],
          liabilities: ['MAIN-2001', 'MAIN-2002'],
          equity: ['MAIN-3001', 'MAIN-3002']
        },
        isDefault: true,
        createdAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      }
    ];

    for (const template of templates) {
      await setDoc(doc(db, this.paths.reportTemplatesPath(), template.templateId), template);
    }

    console.log('✅ Report templates created');
  }

  /**
   * Mark company as initialized
   */
  async markCompanyInitialized(adminUserId) {
    const companyDocRef = doc(db, this.paths.companyDocPath());
    await setDoc(companyDocRef, {
      companyId: this.companyId,
      isInitialized: true,
      initializedAt: Timestamp.now(),
      initializedBy: adminUserId,
      // Migration-ready fields
      _version: "2.0",
      _migrationStatus: "active",
      _v3Ready: true,
      _v4Ready: false
    }, { merge: true });
  }

  /**
   * Detect if this is the first login for an admin user
   * @param {string} userId - The user ID
   * @param {string} userRole - The user's role
   * @returns {boolean} - True if first login
   */
  async isFirstLogin(userId, userRole) {
    // Only admins can trigger company initialization
    if (userRole !== 'admin') return false;

    // Check if company is already initialized
    const initialized = await this.isCompanyInitialized();
    return !initialized;
  }

  /**
   * Handle first login workflow for admin users
   * @param {string} userId - The admin user ID
   * @param {string} userRole - The user's role
   * @param {function} onProgress - Progress callback function
   * @returns {object} - Initialization result
   */
  async handleFirstLogin(userId, userRole, onProgress = null) {
    try {
      // Check if this is first login
      const isFirst = await this.isFirstLogin(userId, userRole);
      if (!isFirst) {
        return { success: true, isFirstLogin: false, message: 'Company already initialized' };
      }

      console.log('🎯 First admin login detected - initializing company...');

      // Call progress callback if provided
      if (onProgress) onProgress('Starting company initialization...', 0);

      // Initialize company
      await this.initializeCompany(userId);

      if (onProgress) onProgress('Company initialization completed!', 100);

      return {
        success: true,
        isFirstLogin: true,
        message: 'Company initialized successfully',
        initializedAt: Timestamp.now()
      };

    } catch (error) {
      console.error('❌ First login initialization failed:', error);
      return {
        success: false,
        isFirstLogin: true,
        error: error.message,
        message: 'Company initialization failed'
      };
    }
  }
}
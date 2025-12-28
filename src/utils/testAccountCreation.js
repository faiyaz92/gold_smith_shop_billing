// src/utils/testAccountCreation.js
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../app/firebase.js';

// Utility function to get firestore paths (non-hook version)
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    accountsPath: () => `${tenantCompaniesPath}/${companyId}/accounts`,
    companyDocPath: () => `${tenantCompaniesPath}/${companyId}`
  };
};

/**
 * Test utility for validating account creation and hierarchy
 * Tests the CompanyInitializationEngine functionality
 */
export class AccountCreationTester {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
  }

  /**
   * Run comprehensive account creation tests
   */
  async runAccountCreationTests() {
    console.log('🧪 Running Account Creation Tests...');

    const results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: []
    };

    try {
      // Test 1: Check if all 39 core accounts exist
      await this.testCoreAccountsExist(results);

      // Test 2: Validate account hierarchy structure
      await this.testAccountHierarchy(results);

      // Test 3: Verify account codes and naming
      await this.testAccountCodesAndNames(results);

      // Test 4: Check account types and classifications
      await this.testAccountTypesAndClassifications(results);

      // Test 5: Validate normal balance settings
      await this.testNormalBalances(results);

      // Test 6: Test initialization status
      await this.testInitializationStatus(results);

      console.log(`✅ Tests completed: ${results.passedTests}/${results.totalTests} passed`);

      if (results.failedTests > 0) {
        console.log('❌ Failed tests:', results.errors);
      }

      return results;

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      results.errors.push(`Test execution error: ${error.message}`);
      results.failedTests++;
      return results;
    }
  }

  /**
   * Test 1: Verify all 39 core accounts exist
   */
  async testCoreAccountsExist(results) {
    results.totalTests++;
    console.log('  📋 Test 1: Checking core accounts existence...');

    try {
      const accountsRef = collection(db, this.paths.accountsPath());
      const accountsSnapshot = await getDocs(accountsRef);

      const expectedAccounts = [
        // Assets (12)
        'MAIN-1001', 'MAIN-1002', 'MAIN-1003', 'MAIN-1004', 'MAIN-1005', 'MAIN-1006',
        'MAIN-1201', 'MAIN-1202', 'MAIN-1203', 'MAIN-1204', 'MAIN-1205', 'MAIN-1206',
        // Liabilities (8)
        'MAIN-2001', 'MAIN-2002', 'MAIN-2003', 'MAIN-2004', 'MAIN-2005',
        'MAIN-2101', 'MAIN-2102', 'MAIN-2103',
        // Equity (5)
        'MAIN-3001', 'MAIN-3002', 'MAIN-3003', 'MAIN-3004', 'MAIN-3005',
        // Income (6)
        'MAIN-4001', 'MAIN-4002', 'MAIN-4003', 'MAIN-4004', 'MAIN-4005', 'MAIN-4006',
        // Expenses (8)
        'MAIN-5001', 'MAIN-5101', 'MAIN-5102', 'MAIN-5103', 'MAIN-5104',
        'MAIN-5105', 'MAIN-5106', 'MAIN-5107'
      ];

      const existingAccountIds = accountsSnapshot.docs.map(doc => doc.id);
      const missingAccounts = expectedAccounts.filter(id => !existingAccountIds.includes(id));

      if (missingAccounts.length === 0) {
        results.passedTests++;
        console.log('    ✅ All 39 core accounts exist');
      } else {
        results.failedTests++;
        results.errors.push(`Missing accounts: ${missingAccounts.join(', ')}`);
        console.log(`    ❌ Missing ${missingAccounts.length} accounts: ${missingAccounts.join(', ')}`);
      }

    } catch (error) {
      results.failedTests++;
      results.errors.push(`Test 1 failed: ${error.message}`);
      console.log(`    ❌ Test 1 failed: ${error.message}`);
    }
  }

  /**
   * Test 2: Validate account hierarchy structure
   */
  async testAccountHierarchy(results) {
    results.totalTests++;
    console.log('  📋 Test 2: Validating account hierarchy...');

    try {
      const accountsRef = collection(db, this.paths.accountsPath());
      const accountsSnapshot = await getDocs(accountsRef);

      const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check that all accounts have proper structure
      const invalidAccounts = accounts.filter(account => {
        return !account.accountId ||
               !account.accountName ||
               !account.accountType ||
               typeof account.currentBalance !== 'number' ||
               !account.companyId;
      });

      if (invalidAccounts.length === 0) {
        results.passedTests++;
        console.log('    ✅ All accounts have valid hierarchy structure');
      } else {
        results.failedTests++;
        results.errors.push(`Invalid account structures: ${invalidAccounts.map(a => a.accountId).join(', ')}`);
        console.log(`    ❌ ${invalidAccounts.length} accounts have invalid structure`);
      }

    } catch (error) {
      results.failedTests++;
      results.errors.push(`Test 2 failed: ${error.message}`);
      console.log(`    ❌ Test 2 failed: ${error.message}`);
    }
  }

  /**
   * Test 3: Verify account codes and naming
   */
  async testAccountCodesAndNames(results) {
    results.totalTests++;
    console.log('  📋 Test 3: Verifying account codes and names...');

    try {
      const accountsRef = collection(db, this.paths.accountsPath());
      const accountsSnapshot = await getDocs(accountsRef);

      const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Expected account mappings
      const expectedMappings = {
        'MAIN-1001': 'Cash in Hand',
        'MAIN-1002': 'Bank Account - Primary',
        'MAIN-4001': 'Sales Revenue',
        'MAIN-5001': 'Cost of Goods Sold',
        'MAIN-3001': "Owner's Capital"
      };

      let namingErrors = [];

      for (const [accountId, expectedName] of Object.entries(expectedMappings)) {
        const account = accounts.find(a => a.accountId === accountId);
        if (!account) {
          namingErrors.push(`Account ${accountId} not found`);
        } else if (account.accountName !== expectedName) {
          namingErrors.push(`Account ${accountId}: expected "${expectedName}", got "${account.accountName}"`);
        }
      }

      if (namingErrors.length === 0) {
        results.passedTests++;
        console.log('    ✅ Account codes and names are correct');
      } else {
        results.failedTests++;
        results.errors.push(`Naming errors: ${namingErrors.join('; ')}`);
        console.log(`    ❌ ${namingErrors.length} naming errors found`);
      }

    } catch (error) {
      results.failedTests++;
      results.errors.push(`Test 3 failed: ${error.message}`);
      console.log(`    ❌ Test 3 failed: ${error.message}`);
    }
  }

  /**
   * Test 4: Check account types and classifications
   */
  async testAccountTypesAndClassifications(results) {
    results.totalTests++;
    console.log('  📋 Test 4: Checking account types and classifications...');

    try {
      const accountsRef = collection(db, this.paths.accountsPath());
      const accountsSnapshot = await getDocs(accountsRef);

      const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check account type distributions
      const typeCounts = accounts.reduce((acc, account) => {
        acc[account.accountType] = (acc[account.accountType] || 0) + 1;
        return acc;
      }, {});

      const expectedTypes = { Asset: 12, Liability: 8, Equity: 5, Income: 6, Expense: 8 };

      let typeErrors = [];

      for (const [type, expectedCount] of Object.entries(expectedTypes)) {
        const actualCount = typeCounts[type] || 0;
        if (actualCount !== expectedCount) {
          typeErrors.push(`${type}: expected ${expectedCount}, got ${actualCount}`);
        }
      }

      if (typeErrors.length === 0) {
        results.passedTests++;
        console.log('    ✅ Account types and classifications are correct');
      } else {
        results.failedTests++;
        results.errors.push(`Type distribution errors: ${typeErrors.join('; ')}`);
        console.log(`    ❌ Type distribution errors: ${typeErrors.join('; ')}`);
      }

    } catch (error) {
      results.failedTests++;
      results.errors.push(`Test 4 failed: ${error.message}`);
      console.log(`    ❌ Test 4 failed: ${error.message}`);
    }
  }

  /**
   * Test 5: Validate normal balance settings
   */
  async testNormalBalances(results) {
    results.totalTests++;
    console.log('  📋 Test 5: Validating normal balance settings...');

    try {
      const accountsRef = collection(db, this.paths.accountsPath());
      const accountsSnapshot = await getDocs(accountsRef);

      const accounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check normal balances for key accounts
      const balanceChecks = [
        { id: 'MAIN-1001', expected: 'Debit' }, // Cash in Hand - Asset
        { id: 'MAIN-2001', expected: 'Credit' }, // Accounts Payable - Liability
        { id: 'MAIN-3001', expected: 'Credit' }, // Owner's Capital - Equity
        { id: 'MAIN-4001', expected: 'Credit' }, // Sales Revenue - Income
        { id: 'MAIN-5001', expected: 'Debit' }   // Cost of Goods Sold - Expense
      ];

      let balanceErrors = [];

      for (const check of balanceChecks) {
        const account = accounts.find(a => a.accountId === check.id);
        if (!account) {
          balanceErrors.push(`Account ${check.id} not found`);
        } else if (account.normalBalance !== check.expected) {
          balanceErrors.push(`Account ${check.id}: expected ${check.expected}, got ${account.normalBalance}`);
        }
      }

      if (balanceErrors.length === 0) {
        results.passedTests++;
        console.log('    ✅ Normal balance settings are correct');
      } else {
        results.failedTests++;
        results.errors.push(`Balance errors: ${balanceErrors.join('; ')}`);
        console.log(`    ❌ ${balanceErrors.length} balance errors found`);
      }

    } catch (error) {
      results.failedTests++;
      results.errors.push(`Test 5 failed: ${error.message}`);
      console.log(`    ❌ Test 5 failed: ${error.message}`);
    }
  }

  /**
   * Test 6: Test initialization status
   */
  async testInitializationStatus(results) {
    results.totalTests++;
    console.log('  📋 Test 6: Testing initialization status...');

    try {
      const companyDocRef = collection(db, 'Easy2Solutions/companyDirectory/tenantCompanies');
      const q = query(companyDocRef, where('companyId', '==', this.companyId));
      const companySnapshot = await getDocs(q);

      if (companySnapshot.empty) {
        results.failedTests++;
        results.errors.push('Company document not found');
        console.log('    ❌ Company document not found');
        return;
      }

      const companyData = companySnapshot.docs[0].data();

      if (companyData.isInitialized === true) {
        results.passedTests++;
        console.log('    ✅ Company is properly marked as initialized');
      } else {
        results.failedTests++;
        results.errors.push(`Company initialization status: expected true, got ${companyData.isInitialized}`);
        console.log(`    ❌ Company not marked as initialized: ${companyData.isInitialized}`);
      }

    } catch (error) {
      results.failedTests++;
      results.errors.push(`Test 6 failed: ${error.message}`);
      console.log(`    ❌ Test 6 failed: ${error.message}`);
    }
  }
}

/**
 * Run account creation tests for a specific company
 * @param {string} companyId - The company ID to test
 * @returns {Promise<Object>} Test results
 */
export async function runAccountCreationTests(companyId) {
  const tester = new AccountCreationTester(companyId);
  return await tester.runAccountCreationTests();
}
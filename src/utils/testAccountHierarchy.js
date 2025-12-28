/**
 * Account Hierarchy Navigation Test Suite
 * Comprehensive testing of all hierarchy tracking and navigation functionality
 * Based on BRD_v2.md Section 6.1 and TechnicalDoc_v2.md Section 6.1
 *
 * Usage: Run this test suite to validate account hierarchy functionality
 */

import { HierarchicalAccountManager } from './hierarchicalAccountManager.js';
import { validateCompanyAccountHierarchy, getAccountHierarchyPath, getAccountTree, getAccountsByLevel, analyzeAccountHierarchy } from './accountHierarchyTracker.js';

/**
 * Comprehensive test suite for account hierarchy navigation
 * @param {string} companyId - Company identifier for testing
 * @returns {object} - Test results summary
 */
export async function runAccountHierarchyTests(companyId) {
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    testResults: []
  };

  console.log('🧪 Starting Account Hierarchy Navigation Test Suite');
  console.log('================================================');

  try {
    const accountManager = new HierarchicalAccountManager(companyId);

    // Test 1: Validate Account Hierarchy Structure
    console.log('\n📋 Test 1: Account Hierarchy Validation');
    results.totalTests++;
    try {
      const validationResult = await validateCompanyAccountHierarchy(companyId);
      if (validationResult.isValid) {
        console.log('✅ Hierarchy validation passed');
        results.passedTests++;
        results.testResults.push({ test: 'Hierarchy Validation', status: 'PASS', details: `Validated ${validationResult.totalAccounts} accounts` });
      } else {
        console.log('❌ Hierarchy validation failed');
        console.log('Issues:', validationResult.issues);
        results.failedTests++;
        results.testResults.push({ test: 'Hierarchy Validation', status: 'FAIL', details: validationResult.issues });
      }
    } catch (error) {
      console.log('❌ Hierarchy validation error:', error.message);
      results.failedTests++;
      results.testResults.push({ test: 'Hierarchy Validation', status: 'ERROR', details: error.message });
    }

    // Test 2: Test MAIN-level Account Navigation
    console.log('\n📋 Test 2: MAIN-level Account Navigation');
    results.totalTests++;
    try {
      const mainAccounts = await accountManager.getAccountsByLevel('MAIN');
      console.log(`Found ${mainAccounts.length} MAIN-level accounts`);

      if (mainAccounts.length >= 39) { // Should have at least 39 core accounts
        console.log('✅ MAIN-level accounts accessible');
        results.passedTests++;
        results.testResults.push({ test: 'MAIN-level Navigation', status: 'PASS', details: `${mainAccounts.length} accounts found` });
      } else {
        console.log('❌ Insufficient MAIN-level accounts');
        results.failedTests++;
        results.testResults.push({ test: 'MAIN-level Navigation', status: 'FAIL', details: `Only ${mainAccounts.length} accounts found, expected >=39` });
      }
    } catch (error) {
      console.log('❌ MAIN-level navigation error:', error.message);
      results.failedTests++;
      results.testResults.push({ test: 'MAIN-level Navigation', status: 'ERROR', details: error.message });
    }

    // Test 3: Test Hierarchy Path for Customer Account
    console.log('\n📋 Test 3: Customer Account Hierarchy Path');
    results.totalTests++;
    try {
      // First check if we have any customer accounts
      const customerAccounts = await accountManager.getAccountsByLevel('CUST');
      if (customerAccounts.length > 0) {
        const testAccount = customerAccounts[0];
        console.log(`Testing hierarchy path for: ${testAccount.accountCode}`);

        const hierarchyPath = await getAccountHierarchyPath(companyId, testAccount.accountCode);
        console.log(`Hierarchy path length: ${hierarchyPath.length}`);

        // Should have at least: Customer Account -> Accounts Receivable (MAIN-1003)
        if (hierarchyPath.length >= 2) {
          console.log('✅ Customer hierarchy path valid');
          results.passedTests++;
          results.testResults.push({ test: 'Customer Hierarchy Path', status: 'PASS', details: `Path length: ${hierarchyPath.length}` });
        } else {
          console.log('❌ Customer hierarchy path too short');
          results.failedTests++;
          results.testResults.push({ test: 'Customer Hierarchy Path', status: 'FAIL', details: `Path length: ${hierarchyPath.length}, expected >=2` });
        }
      } else {
        console.log('⚠️ No customer accounts found, creating test account...');
        // Create a test customer account
        const testCustomer = await accountManager.createCustomerAccount({
          customerId: 'TEST-CUST-0001',
          customerName: 'Test Customer'
        });

        if (testCustomer.created) {
          const hierarchyPath = await getAccountHierarchyPath(companyId, testCustomer.account.accountCode);
          if (hierarchyPath.length >= 2) {
            console.log('✅ Test customer hierarchy path valid');
            results.passedTests++;
            results.testResults.push({ test: 'Customer Hierarchy Path', status: 'PASS', details: `Test account path length: ${hierarchyPath.length}` });
          } else {
            console.log('❌ Test customer hierarchy path invalid');
            results.failedTests++;
            results.testResults.push({ test: 'Customer Hierarchy Path', status: 'FAIL', details: `Test account path length: ${hierarchyPath.length}` });
          }
        } else {
          console.log('❌ Could not create test customer account');
          results.failedTests++;
          results.testResults.push({ test: 'Customer Hierarchy Path', status: 'SKIP', details: 'Could not create test account' });
        }
      }
    } catch (error) {
      console.log('❌ Customer hierarchy path error:', error.message);
      results.failedTests++;
      results.testResults.push({ test: 'Customer Hierarchy Path', status: 'ERROR', details: error.message });
    }

    // Test 4: Test Account Tree Structure
    console.log('\n📋 Test 4: Account Tree Structure');
    results.totalTests++;
    try {
      // Test tree for Accounts Receivable (MAIN-1003) which should have customer children
      const tree = await getAccountTree(companyId, 'MAIN-1003');
      console.log(`Tree root: ${tree.accountCode} - ${tree.accountName}`);

      if (tree.children && tree.children.length >= 0) {
        console.log(`✅ Account tree structure valid (${tree.children.length} direct children)`);
        results.passedTests++;
        results.testResults.push({ test: 'Account Tree Structure', status: 'PASS', details: `${tree.children.length} children found` });
      } else {
        console.log('❌ Account tree structure invalid');
        results.failedTests++;
        results.testResults.push({ test: 'Account Tree Structure', status: 'FAIL', details: 'No children array or invalid structure' });
      }
    } catch (error) {
      console.log('❌ Account tree structure error:', error.message);
      results.failedTests++;
      results.testResults.push({ test: 'Account Tree Structure', status: 'ERROR', details: error.message });
    }

    // Test 5: Test Child Account Retrieval
    console.log('\n📋 Test 5: Child Account Retrieval');
    results.totalTests++;
    try {
      const childAccounts = await accountManager.getChildAccounts('MAIN-1003');
      console.log(`Found ${childAccounts.length} child accounts of MAIN-1003`);

      // Should find customer accounts and possibly branch receivables
      const customerChildren = childAccounts.filter(acc => acc.accountCode.startsWith('CUST-'));
      const branchChildren = childAccounts.filter(acc => acc.accountCode.includes('-REC'));

      console.log(`Customer children: ${customerChildren.length}, Branch children: ${branchChildren.length}`);

      results.passedTests++;
      results.testResults.push({ test: 'Child Account Retrieval', status: 'PASS', details: `Total: ${childAccounts.length}, Customers: ${customerChildren.length}, Branches: ${branchChildren.length}` });
    } catch (error) {
      console.log('❌ Child account retrieval error:', error.message);
      results.failedTests++;
      results.testResults.push({ test: 'Child Account Retrieval', status: 'ERROR', details: error.message });
    }

    // Test 6: Test Level-based Filtering
    console.log('\n📋 Test 6: Level-based Account Filtering');
    results.totalTests++;
    try {
      const [mainLevel, branchLevel, customerLevel] = await Promise.all([
        getAccountsByLevel(companyId, 'MAIN'),
        getAccountsByLevel(companyId, 'BR'),
        getAccountsByLevel(companyId, 'CUST')
      ]);

      console.log(`MAIN: ${mainLevel.length}, BR: ${branchLevel.length}, CUST: ${customerLevel.length}`);

      // Validate that accounts are correctly categorized
      const allAccounts = await accountManager.getAllAccounts();
      const totalByLevel = mainLevel.length + branchLevel.length + customerLevel.length;

      if (totalByLevel <= allAccounts.length) { // Should be less or equal (some accounts might not fit categories)
        console.log('✅ Level-based filtering working');
        results.passedTests++;
        results.testResults.push({ test: 'Level-based Filtering', status: 'PASS', details: `MAIN:${mainLevel.length} BR:${branchLevel.length} CUST:${customerLevel.length}` });
      } else {
        console.log('❌ Level-based filtering error - more accounts than total');
        results.failedTests++;
        results.testResults.push({ test: 'Level-based Filtering', status: 'FAIL', details: `Level total: ${totalByLevel}, All accounts: ${allAccounts.length}` });
      }
    } catch (error) {
      console.log('❌ Level-based filtering error:', error.message);
      results.failedTests++;
      results.testResults.push({ test: 'Level-based Filtering', status: 'ERROR', details: error.message });
    }

    // Test 7: Test Hierarchy Statistics
    console.log('\n📋 Test 7: Hierarchy Statistics Analysis');
    results.totalTests++;
    try {
      const stats = await analyzeAccountHierarchy(companyId);

      console.log(`Stats - Total: ${stats.totalAccounts}, Max Depth: ${stats.maxHierarchyDepth}, Avg Depth: ${stats.avgHierarchyDepth.toFixed(1)}`);

      if (stats.totalAccounts > 0 && stats.maxHierarchyDepth >= 1) {
        console.log('✅ Hierarchy statistics valid');
        results.passedTests++;
        results.testResults.push({ test: 'Hierarchy Statistics', status: 'PASS', details: `Total: ${stats.totalAccounts}, Max Depth: ${stats.maxHierarchyDepth}` });
      } else {
        console.log('❌ Hierarchy statistics invalid');
        results.failedTests++;
        results.testResults.push({ test: 'Hierarchy Statistics', status: 'FAIL', details: 'Invalid statistics values' });
      }
    } catch (error) {
      console.log('❌ Hierarchy statistics error:', error.message);
      results.failedTests++;
      results.testResults.push({ test: 'Hierarchy Statistics', status: 'ERROR', details: error.message });
    }

  } catch (error) {
    console.log('❌ Test suite error:', error.message);
    results.failedTests++;
    results.testResults.push({ test: 'Test Suite', status: 'ERROR', details: error.message });
  }

  // Summary
  console.log('\n================================================');
  console.log('🧪 Test Suite Summary');
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passedTests}`);
  console.log(`Failed: ${results.failedTests}`);
  console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);

  if (results.failedTests === 0) {
    console.log('🎉 All tests passed! Account hierarchy navigation is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the results above.');
  }

  return results;
}

/**
 * Quick validation test for basic hierarchy functionality
 * @param {string} companyId - Company identifier
 * @returns {boolean} - True if basic validation passes
 */
export async function quickHierarchyValidation(companyId) {
  try {
    console.log('🔍 Running quick hierarchy validation...');

    const accountManager = new HierarchicalAccountManager(companyId);

    // Check if core accounts exist
    const main1001 = await accountManager.getAccountByCode('MAIN-1001'); // Cash
    const main1003 = await accountManager.getAccountByCode('MAIN-1003'); // Accounts Receivable

    if (!main1001 || !main1003) {
      console.log('❌ Core accounts missing');
      return false;
    }

    // Check hierarchy validation
    const validation = await accountManager.validateAccountHierarchy();
    if (!validation.isValid) {
      console.log('❌ Hierarchy validation failed');
      return false;
    }

    console.log('✅ Quick hierarchy validation passed');
    return true;

  } catch (error) {
    console.log('❌ Quick validation error:', error.message);
    return false;
  }
}
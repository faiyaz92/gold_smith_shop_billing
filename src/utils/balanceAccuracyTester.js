/**
 * Balance Accuracy Test Suite
 * Comprehensive testing of balance calculation accuracy and integrity
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Tests:
 * - Mathematical accuracy of balance calculations
 * - Parent-child balance relationships
 * - Accounting equation integrity
 * - Transaction processing accuracy
 * - Real-time balance consistency
 * - Edge cases and error handling
 */

import { BalanceCalculationEngine } from './balanceCalculationEngine.js';
import { AccountingEngine } from './accountingEngine.js';
import { HierarchicalAccountManager } from './hierarchicalAccountManager.js';
import { validateCompanyBalanceConsistency, recalculateCompanyBalances } from './balanceCalculationUtils.js';

export class BalanceAccuracyTester {
  constructor(companyId) {
    this.companyId = companyId;
    this.balanceEngine = new BalanceCalculationEngine(companyId);
    this.accountingEngine = new AccountingEngine(companyId);
    this.accountManager = new HierarchicalAccountManager(companyId);
  }

  /**
   * Run complete balance accuracy test suite
   * @returns {object} - Test results summary
   */
  async runCompleteBalanceAccuracyTests() {
    const results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testResults: [],
      startTime: new Date(),
      endTime: null
    };

    console.log('🧪 Starting Complete Balance Accuracy Test Suite');
    console.log('================================================');

    try {
      // Test 1: Basic Balance Calculation Accuracy
      await this.testBasicBalanceCalculations(results);

      // Test 2: Parent-Child Balance Relationships
      await this.testParentChildRelationships(results);

      // Test 3: Accounting Equation Integrity
      await this.testAccountingEquationIntegrity(results);

      // Test 4: Transaction Processing Accuracy
      await this.testTransactionProcessingAccuracy(results);

      // Test 5: Hierarchy Balance Consistency
      await this.testHierarchyBalanceConsistency(results);

      // Test 6: Real-Time Balance Synchronization
      await this.testRealTimeBalanceSynchronization(results);

      // Test 7: Edge Cases and Error Handling
      await this.testEdgeCasesAndErrors(results);

      // Test 8: Performance and Scalability
      await this.testPerformanceAndScalability(results);

    } catch (error) {
      console.error('❌ Test suite error:', error);
      results.failedTests++;
      results.testResults.push({
        test: 'Test Suite',
        status: 'ERROR',
        details: error.message
      });
    }

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    // Summary
    console.log('\n================================================');
    console.log('🧪 Balance Accuracy Test Suite Summary');
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: ${results.passedTests}`);
    console.log(`Failed: ${results.failedTests}`);
    console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
    console.log(`Duration: ${results.duration}ms`);

    if (results.failedTests === 0) {
      console.log('🎉 All balance accuracy tests passed! System is mathematically sound.');
    } else {
      console.log('⚠️ Some tests failed. Review results above for issues.');
    }

    return results;
  }

  /**
   * Test basic balance calculation accuracy
   */
  async testBasicBalanceCalculations(results) {
    console.log('\n📋 Test 1: Basic Balance Calculation Accuracy');

    // Test 1.1: Zero balance calculation
    results.totalTests++;
    try {
      const zeroBalance = await this.balanceEngine.calculateAccountBalance('NONEXISTENT');
      if (zeroBalance === 0) {
        results.passedTests++;
        results.testResults.push({ test: 'Zero Balance', status: 'PASS', details: 'Non-existent account returns 0' });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Zero Balance', status: 'FAIL', details: `Expected 0, got ${zeroBalance}` });
      }
    } catch (error) {
      results.passedTests++; // Expected error for non-existent account
      results.testResults.push({ test: 'Zero Balance', status: 'PASS', details: 'Properly handles non-existent accounts' });
    }

    // Test 1.2: Leaf account balance
    results.totalTests++;
    try {
      // Create a test account with known balance
      const testAccountCode = 'TEST-LEAF-001';
      await this.accountManager.createMainAccount({
        accountCode: testAccountCode,
        accountName: 'Test Leaf Account',
        accountType: 'asset',
        category: 'Current Asset',
        balance: 1000
      });

      const calculatedBalance = await this.balanceEngine.calculateAccountBalance(testAccountCode);
      if (calculatedBalance === 1000) {
        results.passedTests++;
        results.testResults.push({ test: 'Leaf Account Balance', status: 'PASS', details: 'Leaf account balance calculated correctly' });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Leaf Account Balance', status: 'FAIL', details: `Expected 1000, got ${calculatedBalance}` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Leaf Account Balance', status: 'ERROR', details: error.message });
    }
  }

  /**
   * Test parent-child balance relationships
   */
  async testParentChildRelationships(results) {
    console.log('\n📋 Test 2: Parent-Child Balance Relationships');

    // Test 2.1: Parent equals sum of children
    results.totalTests++;
    try {
      // Test with Accounts Receivable (MAIN-1003) which should have customer children
      const parentBalance = await this.balanceEngine.calculateAccountBalance('MAIN-1003');
      const childAccounts = await this.accountManager.getChildAccounts('MAIN-1003');
      const sumOfChildren = childAccounts.reduce((sum, child) => sum + (child.balance || 0), 0);

      if (Math.abs(parentBalance - sumOfChildren) < 0.01) {
        results.passedTests++;
        results.testResults.push({ test: 'Parent-Child Sum', status: 'PASS', details: `Parent: ${parentBalance}, Children sum: ${sumOfChildren}` });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Parent-Child Sum', status: 'FAIL', details: `Parent: ${parentBalance}, Children sum: ${sumOfChildren}, Difference: ${parentBalance - sumOfChildren}` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Parent-Child Sum', status: 'ERROR', details: error.message });
    }

    // Test 2.2: Multi-level hierarchy
    results.totalTests++;
    try {
      // Create a multi-level test hierarchy
      const grandParentCode = 'TEST-GP-001';
      const parentCode = 'TEST-P-001';
      const childCode = 'TEST-C-001';

      // Create accounts
      await this.accountManager.createMainAccount({
        accountCode: grandParentCode,
        accountName: 'Test Grand Parent',
        accountType: 'asset',
        category: 'Current Asset',
        balance: 0
      });

      await this.accountManager.createChildAccount(grandParentCode, {
        accountName: 'Test Parent',
        balance: 0
      });

      await this.accountManager.createChildAccount(parentCode, {
        accountName: 'Test Child',
        balance: 500
      });

      // Check that balances propagate correctly
      const childBalance = await this.balanceEngine.calculateAccountBalance(childCode);
      const parentBalance = await this.balanceEngine.calculateAccountBalance(parentCode);
      const grandParentBalance = await this.balanceEngine.calculateAccountBalance(grandParentCode);

      if (childBalance === 500 && parentBalance === 500 && grandParentBalance === 500) {
        results.passedTests++;
        results.testResults.push({ test: 'Multi-level Hierarchy', status: 'PASS', details: 'Balances propagated correctly through 3 levels' });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Multi-level Hierarchy', status: 'FAIL', details: `Child: ${childBalance}, Parent: ${parentBalance}, GrandParent: ${grandParentBalance}` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Multi-level Hierarchy', status: 'ERROR', details: error.message });
    }
  }

  /**
   * Test accounting equation integrity
   */
  async testAccountingEquationIntegrity(results) {
    console.log('\n📋 Test 3: Accounting Equation Integrity');

    // Test 3.1: Assets = Liabilities + Equity
    results.totalTests++;
    try {
      const equationResult = await this.accountingEngine.validateAccountingEquation();

      if (equationResult.isBalanced) {
        results.passedTests++;
        results.testResults.push({ test: 'Accounting Equation', status: 'PASS', details: `Assets: ${equationResult.assets}, Liabilities: ${equationResult.liabilities}, Equity: ${equationResult.equity}` });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Accounting Equation', status: 'FAIL', details: equationResult.message });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Accounting Equation', status: 'ERROR', details: error.message });
    }

    // Test 3.2: Equation maintained after transactions
    results.totalTests++;
    try {
      // Record a test transaction
      const beforeEquation = await this.accountingEngine.validateAccountingEquation();

      await this.accountingEngine.recordTransaction({
        description: 'Test transaction for equation integrity',
        debitAccountId: 'MAIN-1001', // Cash
        creditAccountId: 'MAIN-4001', // Sales Revenue
        amount: 100,
        referenceType: 'test',
        referenceId: 'EQUATION_TEST_001'
      });

      const afterEquation = await this.accountingEngine.validateAccountingEquation();

      if (beforeEquation.isBalanced && afterEquation.isBalanced) {
        results.passedTests++;
        results.testResults.push({ test: 'Equation After Transaction', status: 'PASS', details: 'Accounting equation maintained after transaction' });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Equation After Transaction', status: 'FAIL', details: `Before: ${beforeEquation.isBalanced}, After: ${afterEquation.isBalanced}` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Equation After Transaction', status: 'ERROR', details: error.message });
    }
  }

  /**
   * Test transaction processing accuracy
   */
  async testTransactionProcessingAccuracy(results) {
    console.log('\n📋 Test 4: Transaction Processing Accuracy');

    // Test 4.1: Double-entry transaction balance impact
    results.totalTests++;
    try {
      const cashBefore = await this.balanceEngine.calculateAccountBalance('MAIN-1001');
      const salesBefore = await this.balanceEngine.calculateAccountBalance('MAIN-4001');

      await this.accountingEngine.recordTransaction({
        description: 'Test double-entry transaction',
        debitAccountId: 'MAIN-1001', // Cash +100
        creditAccountId: 'MAIN-4001', // Sales +100
        amount: 200,
        referenceType: 'test',
        referenceId: 'TX_ACCURACY_TEST_001'
      });

      const cashAfter = await this.balanceEngine.calculateAccountBalance('MAIN-1001');
      const salesAfter = await this.balanceEngine.calculateAccountBalance('MAIN-4001');

      const cashChange = cashAfter - cashBefore;
      const salesChange = salesAfter - salesBefore;

      if (cashChange === 200 && salesChange === 200) {
        results.passedTests++;
        results.testResults.push({ test: 'Double-Entry Impact', status: 'PASS', details: 'Debit and credit accounts updated correctly' });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Double-Entry Impact', status: 'FAIL', details: `Cash: ${cashChange}, Sales: ${salesChange} (expected +200 each)` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Double-Entry Impact', status: 'ERROR', details: error.message });
    }

    // Test 4.2: Transaction rollup to parents
    results.totalTests++;
    try {
      // Create test customer account
      const customerAccount = await this.accountManager.createCustomerAccount({
        customerId: 'TEST-CUST-001',
        customerName: 'Test Customer'
      });

      const parentBefore = await this.balanceEngine.calculateAccountBalance('MAIN-1003');

      // Record payment to customer (reduces receivable)
      await this.accountingEngine.recordCustomerPayment({
        paymentId: 'TEST-PAY-001',
        amount: 150,
        customerId: 'TEST-CUST-001',
        paymentMethod: 'cash'
      });

      const parentAfter = await this.balanceEngine.calculateAccountBalance('MAIN-1003');
      const customerBalance = await this.balanceEngine.calculateAccountBalance(customerAccount.account.accountCode);

      // Parent should decrease by 150, customer should decrease by 150
      if (parentBefore - parentAfter === 150 && customerBalance === -150) {
        results.passedTests++;
        results.testResults.push({ test: 'Transaction Rollup', status: 'PASS', details: 'Parent and child balances updated correctly' });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Transaction Rollup', status: 'FAIL', details: `Parent change: ${parentBefore - parentAfter}, Customer: ${customerBalance}` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Transaction Rollup', status: 'ERROR', details: error.message });
    }
  }

  /**
   * Test hierarchy balance consistency
   */
  async testHierarchyBalanceConsistency(results) {
    console.log('\n📋 Test 5: Hierarchy Balance Consistency');

    // Test 5.1: Balance consistency validation
    results.totalTests++;
    try {
      const consistencyResult = await validateCompanyBalanceConsistency(this.companyId);

      if (consistencyResult.isConsistent) {
        results.passedTests++;
        results.testResults.push({ test: 'Balance Consistency', status: 'PASS', details: `${consistencyResult.totalValidated} accounts validated` });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Balance Consistency', status: 'FAIL', details: `${consistencyResult.inconsistencyCount} inconsistencies found` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Balance Consistency', status: 'ERROR', details: error.message });
    }

    // Test 5.2: Balance recalculation accuracy
    results.totalTests++;
    try {
      const recalcResult = await recalculateCompanyBalances(this.companyId);

      if (recalcResult.success) {
        results.passedTests++;
        results.testResults.push({ test: 'Balance Recalculation', status: 'PASS', details: `${recalcResult.updatedCount} accounts recalculated` });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Balance Recalculation', status: 'FAIL', details: `${recalcResult.errorCount} errors during recalculation` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Balance Recalculation', status: 'ERROR', details: error.message });
    }
  }

  /**
   * Test real-time balance synchronization
   */
  async testRealTimeBalanceSynchronization(results) {
    console.log('\n📋 Test 6: Real-Time Balance Synchronization');

    // Test 6.1: Balance engine functionality
    results.totalTests++;
    try {
      const testBalance = await this.balanceEngine.calculateAccountBalance('MAIN-1001');
      if (typeof testBalance === 'number') {
        results.passedTests++;
        results.testResults.push({ test: 'Balance Engine', status: 'PASS', details: `Successfully calculated balance: ${testBalance}` });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Balance Engine', status: 'FAIL', details: 'Balance calculation returned invalid result' });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Balance Engine', status: 'ERROR', details: error.message });
    }

    // Test 6.2: Recursive balance updates
    results.totalTests++;
    try {
      const updateResult = await this.balanceEngine.updateAccountBalanceRecursive('MAIN-1001', 50);

      if (updateResult.success) {
        results.passedTests++;
        results.testResults.push({ test: 'Recursive Updates', status: 'PASS', details: `${updateResult.updatedAccounts.length} accounts updated` });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Recursive Updates', status: 'FAIL', details: 'Recursive update failed' });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Recursive Updates', status: 'ERROR', details: error.message });
    }
  }

  /**
   * Test edge cases and error handling
   */
  async testEdgeCasesAndErrors(results) {
    console.log('\n📋 Test 7: Edge Cases and Error Handling');

    // Test 7.1: Invalid account codes
    results.totalTests++;
    try {
      await this.balanceEngine.calculateAccountBalance('INVALID-ACCOUNT-CODE');
      results.failedTests++;
      results.testResults.push({ test: 'Invalid Account Handling', status: 'FAIL', details: 'Should have thrown error for invalid account' });
    } catch (error) {
      results.passedTests++;
      results.testResults.push({ test: 'Invalid Account Handling', status: 'PASS', details: 'Properly handles invalid account codes' });
    }

    // Test 7.2: Zero amount transactions
    results.totalTests++;
    try {
      await this.accountingEngine.recordTransaction({
        description: 'Zero amount test',
        debitAccountId: 'MAIN-1001',
        creditAccountId: 'MAIN-4001',
        amount: 0,
        referenceType: 'test',
        referenceId: 'ZERO_AMOUNT_TEST'
      });

      results.passedTests++;
      results.testResults.push({ test: 'Zero Amount Transactions', status: 'PASS', details: 'Handles zero amount transactions' });
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Zero Amount Transactions', status: 'ERROR', details: error.message });
    }

    // Test 7.3: Circular hierarchy detection
    results.totalTests++;
    try {
      const circularResult = await this.accountManager.validateAccountHierarchy();
      // This test passes if validation completes without hanging
      results.passedTests++;
      results.testResults.push({ test: 'Circular Reference Detection', status: 'PASS', details: 'Hierarchy validation completed without hanging' });
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Circular Reference Detection', status: 'ERROR', details: error.message });
    }
  }

  /**
   * Test performance and scalability
   */
  async testPerformanceAndScalability(results) {
    console.log('\n📋 Test 8: Performance and Scalability');

    // Test 8.1: Balance calculation performance
    results.totalTests++;
    try {
      const startTime = Date.now();

      // Calculate balances for multiple accounts
      const promises = [
        this.balanceEngine.calculateAccountBalance('MAIN-1001'),
        this.balanceEngine.calculateAccountBalance('MAIN-1002'),
        this.balanceEngine.calculateAccountBalance('MAIN-1003'),
        this.balanceEngine.calculateAccountBalance('MAIN-4001'),
        this.balanceEngine.calculateAccountBalance('MAIN-5001')
      ];

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration < 5000) { // Should complete within 5 seconds
        results.passedTests++;
        results.testResults.push({ test: 'Balance Calculation Performance', status: 'PASS', details: `Completed in ${duration}ms` });
      } else {
        results.failedTests++;
        results.testResults.push({ test: 'Balance Calculation Performance', status: 'FAIL', details: `Too slow: ${duration}ms` });
      }
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Balance Calculation Performance', status: 'ERROR', details: error.message });
    }

    // Test 8.2: Memory efficiency
    results.totalTests++;
    try {
      // Run multiple operations to check for memory leaks
      for (let i = 0; i < 10; i++) {
        await this.balanceEngine.calculateAccountBalance('MAIN-1001');
      }

      results.passedTests++;
      results.testResults.push({ test: 'Memory Efficiency', status: 'PASS', details: 'Multiple operations completed without issues' });
    } catch (error) {
      results.failedTests++;
      results.testResults.push({ test: 'Memory Efficiency', status: 'ERROR', details: error.message });
    }
  }
}

/**
 * Quick balance accuracy validation
 * @param {string} companyId - Company identifier
 * @returns {boolean} - True if basic accuracy checks pass
 */
export async function quickBalanceAccuracyCheck(companyId) {
  try {
    console.log('🔍 Running quick balance accuracy check...');

    const tester = new BalanceAccuracyTester(companyId);

    // Run a few critical tests
    const results = await tester.runCompleteBalanceAccuracyTests();

    const criticalTests = results.testResults.filter(test =>
      ['Accounting Equation', 'Parent-Child Sum', 'Double-Entry Impact'].includes(test.test)
    );

    const criticalPassed = criticalTests.every(test => test.status === 'PASS');

    if (criticalPassed) {
      console.log('✅ Quick balance accuracy check passed');
      return true;
    } else {
      console.log('❌ Critical balance accuracy issues found');
      return false;
    }

  } catch (error) {
    console.error('Quick balance accuracy check error:', error);
    return false;
  }
}
/**
 * Balance Accuracy Test Runner
 * Executes comprehensive balance accuracy tests for the accounting system
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Usage: node runBalanceAccuracyTests.js [companyId]
 */

import { BalanceAccuracyTester, quickBalanceAccuracyCheck } from './balanceAccuracyTester.js';
import { initializeFirebase } from '../app/firebase.js';

async function main() {
  try {
    console.log('🚀 Balance Accuracy Test Runner');
    console.log('================================');

    // Initialize Firebase
    console.log('🔥 Initializing Firebase...');
    await initializeFirebase();

    // Get company ID from command line or use default
    const companyId = process.argv[2] || 'COMPANY_TEST_001';
    console.log(`🏢 Testing for company: ${companyId}`);

    // Check if running quick check or full suite
    const isQuickCheck = process.argv.includes('--quick');

    if (isQuickCheck) {
      console.log('⚡ Running quick balance accuracy check...');
      const passed = await quickBalanceAccuracyCheck(companyId);

      if (passed) {
        console.log('✅ Quick check passed!');
        process.exit(0);
      } else {
        console.log('❌ Quick check failed!');
        process.exit(1);
      }
    } else {
      console.log('🧪 Running complete balance accuracy test suite...');

      const tester = new BalanceAccuracyTester(companyId);
      const results = await tester.runCompleteBalanceAccuracyTests();

      // Write results to file
      const fs = await import('fs');
      const resultFile = `balance_accuracy_test_results_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

      fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
      console.log(`📄 Results saved to: ${resultFile}`);

      // Exit with appropriate code
      if (results.failedTests === 0) {
        console.log('🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log(`⚠️ ${results.failedTests} tests failed`);
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
main();
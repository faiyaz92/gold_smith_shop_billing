/**
 * Account Creation Test Runner
 * Executes comprehensive account creation and hierarchy tests
 * Based on BRD_v2.md Section 6.1 and TechnicalDoc_v2.md Section 7
 *
 * Usage: node testAccountCreationRunner.js [companyId]
 */

import { runAccountCreationTests } from './testAccountCreation.js';

async function main() {
  try {
    console.log('🚀 Account Creation Test Runner');
    console.log('===============================');

    // Get company ID from command line or use default
    const companyId = process.argv[2] || 'COMPANY_TEST_001';
    console.log(`🏢 Testing for company: ${companyId}`);

    console.log('🧪 Running account creation test suite...');

    const results = await runAccountCreationTests(companyId);

    // Display results
    console.log('\n📊 Test Results Summary:');
    console.log(`   Total Tests: ${results.totalTests}`);
    console.log(`   Passed: ${results.passedTests}`);
    console.log(`   Failed: ${results.failedTests}`);

    if (results.failedTests > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
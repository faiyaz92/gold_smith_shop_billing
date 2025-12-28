// src/utils/createBranchAccounts.js
// Utility script to create branch-level accounts
// Used when adding a new branch to the system

import { HierarchicalAccountManager } from './hierarchicalAccountManager.js';

/**
 * Create branch accounts for a new branch
 * @param {string} companyId - Company ID (e.g., 'laundry_q8')
 * @param {object} branchData - Branch data { branchId: 'BR001', branchName: 'Main Branch' }
 * @returns {Promise<object>} - Creation results
 */
export async function createBranchAccountsForCompany(companyId, branchData) {
  try {
    const { branchId, branchName } = branchData;

    console.log(`Creating branch accounts for company: ${companyId}, branch: ${branchName} (${branchId})`);

    const accountManager = new HierarchicalAccountManager(companyId);
    const results = await accountManager.createBranchAccounts(branchData);

    console.log('Branch accounts creation completed:');
    console.log(`- Total accounts: ${results.totalAccounts}`);
    console.log(`- Created: ${results.createdCount}`);
    console.log(`- Skipped: ${results.skippedCount}`);
    console.log(`- Errors: ${results.errorCount}`);
    console.log(`- Branch code: ${results.branchCode}`);

    if (results.results.created.length > 0) {
      console.log('\nCreated accounts:');
      results.results.created.forEach(account => console.log(`  ✓ ${account}`));
    }

    if (results.results.skipped.length > 0) {
      console.log('\nSkipped accounts (already exist):');
      results.results.skipped.forEach(account => console.log(`  - ${account}`));
    }

    if (results.results.errors.length > 0) {
      console.log('\nErrors:');
      results.results.errors.forEach(error => console.log(`  ✗ ${error}`));
    }

    return results;

  } catch (error) {
    console.error('Failed to create branch accounts:', error);
    throw error;
  }
}

// Example usage (uncomment to test):
/*
// For testing purposes - run this in browser console or Node.js
createBranchAccountsForCompany('laundry_q8', {
  branchId: 'BR001',
  branchName: 'Main Branch'
})
  .then(results => {
    console.log('Branch account creation successful:', results.success);
  })
  .catch(error => {
    console.error('Branch account creation failed:', error);
  });
*/
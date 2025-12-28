// src/utils/initializeCoreAccounts.js
// Script to initialize the 39 core MAIN-level accounts
// Run this once per company to set up the basic chart of accounts

import { HierarchicalAccountManager } from './hierarchicalAccountManager.js';

/**
 * Initialize core accounts for a company
 * @param {string} companyId - Company ID (e.g., 'laundry_q8')
 * @returns {Promise<object>} - Initialization results
 */
export async function initializeCoreAccountsForCompany(companyId) {
  try {
    console.log(`Initializing core accounts for company: ${companyId}`);

    const accountManager = new HierarchicalAccountManager(companyId);
    const results = await accountManager.initializeCoreAccounts();

    console.log('Core accounts initialization completed:');
    console.log(`- Total accounts: ${results.totalAccounts}`);
    console.log(`- Created: ${results.createdCount}`);
    console.log(`- Skipped: ${results.skippedCount}`);
    console.log(`- Errors: ${results.errorCount}`);

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
    console.error('Failed to initialize core accounts:', error);
    throw error;
  }
}

// Example usage (uncomment to test):
/*
// For testing purposes - run this in browser console or Node.js
initializeCoreAccountsForCompany('laundry_q8')
  .then(results => {
    console.log('Initialization successful:', results.success);
  })
  .catch(error => {
    console.error('Initialization failed:', error);
  });
*/
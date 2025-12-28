/**
 * Account Hierarchy Tracking Utility
 * Provides methods to navigate, validate, and analyze account hierarchy
 * Based on BRD_v2.md Section 6.1 and TechnicalDoc_v2.md Section 6.1
 *
 * Usage: Call functions to track and validate account hierarchy structure
 */

import { HierarchicalAccountManager } from './hierarchicalAccountManager.js';

/**
 * Validate complete account hierarchy for a company
 * @param {string} companyId - Company identifier
 * @returns {object} - Validation results
 */
export async function validateCompanyAccountHierarchy(companyId) {
  try {
    const accountManager = new HierarchicalAccountManager(companyId);

    console.log(`Validating account hierarchy for company: ${companyId}`);
    const validationResult = await accountManager.validateAccountHierarchy();

    if (validationResult.isValid) {
      console.log('✅ Account hierarchy validation passed');
    } else {
      console.log('❌ Account hierarchy validation failed');
      console.log('Issues found:', validationResult.issues);
    }

    return validationResult;

  } catch (error) {
    console.error('Validate company account hierarchy error:', error);
    throw error;
  }
}

/**
 * Get account hierarchy path for navigation
 * @param {string} companyId - Company identifier
 * @param {string} accountCode - Account code to get path for
 * @returns {Array} - Hierarchy path from root to account
 */
export async function getAccountHierarchyPath(companyId, accountCode) {
  try {
    const accountManager = new HierarchicalAccountManager(companyId);
    const hierarchyPath = await accountManager.getAccountHierarchyPath(accountCode);

    console.log(`Hierarchy path for ${accountCode}:`);
    hierarchyPath.forEach((account, index) => {
      const indent = '  '.repeat(index);
      console.log(`${indent}${account.accountCode}: ${account.accountName}`);
    });

    return hierarchyPath;

  } catch (error) {
    console.error('Get account hierarchy path error:', error);
    throw error;
  }
}

/**
 * Get account tree structure for visualization
 * @param {string} companyId - Company identifier
 * @param {string} rootAccountCode - Root account code (e.g., 'MAIN-1003' for receivables)
 * @returns {object} - Tree structure
 */
export async function getAccountTree(companyId, rootAccountCode) {
  try {
    const accountManager = new HierarchicalAccountManager(companyId);
    const tree = await accountManager.getAccountTree(rootAccountCode);

    console.log(`Account tree for ${rootAccountCode}:`);
    printAccountTree(tree, 0);

    return tree;

  } catch (error) {
    console.error('Get account tree error:', error);
    throw error;
  }
}

/**
 * Get accounts by hierarchy level
 * @param {string} companyId - Company identifier
 * @param {string} level - Level to filter ('MAIN', 'BR', 'CUST')
 * @returns {Array} - Accounts at specified level
 */
export async function getAccountsByLevel(companyId, level) {
  try {
    const accountManager = new HierarchicalAccountManager(companyId);
    const accounts = await accountManager.getAccountsByLevel(level);

    console.log(`Accounts at ${level} level (${accounts.length} found):`);
    accounts.forEach(account => {
      console.log(`  ${account.accountCode}: ${account.accountName}`);
    });

    return accounts;

  } catch (error) {
    console.error('Get accounts by level error:', error);
    throw error;
  }
}

/**
 * Analyze account hierarchy statistics
 * @param {string} companyId - Company identifier
 * @returns {object} - Hierarchy statistics
 */
export async function analyzeAccountHierarchy(companyId) {
  try {
    const accountManager = new HierarchicalAccountManager(companyId);

    const [mainAccounts, branchAccounts, customerAccounts, allAccounts] = await Promise.all([
      accountManager.getAccountsByLevel('MAIN'),
      accountManager.getAccountsByLevel('BR'),
      accountManager.getAccountsByLevel('CUST'),
      accountManager.getAllAccounts()
    ]);

    const stats = {
      totalAccounts: allAccounts.length,
      mainAccounts: mainAccounts.length,
      branchAccounts: branchAccounts.length,
      customerAccounts: customerAccounts.length,
      otherAccounts: allAccounts.length - mainAccounts.length - branchAccounts.length - customerAccounts.length
    };

    // Analyze hierarchy depth
    const hierarchyDepths = [];
    for (const account of allAccounts) {
      try {
        const path = await accountManager.getAccountHierarchyPath(account.accountCode);
        hierarchyDepths.push(path.length);
      } catch (error) {
        // Skip accounts with hierarchy issues
        continue;
      }
    }

    stats.maxHierarchyDepth = Math.max(...hierarchyDepths);
    stats.avgHierarchyDepth = hierarchyDepths.reduce((a, b) => a + b, 0) / hierarchyDepths.length;

    console.log('Account Hierarchy Analysis:');
    console.log(`  Total Accounts: ${stats.totalAccounts}`);
    console.log(`  Main Level: ${stats.mainAccounts}`);
    console.log(`  Branch Level: ${stats.branchAccounts}`);
    console.log(`  Customer Level: ${stats.customerAccounts}`);
    console.log(`  Other: ${stats.otherAccounts}`);
    console.log(`  Max Hierarchy Depth: ${stats.maxHierarchyDepth}`);
    console.log(`  Avg Hierarchy Depth: ${stats.avgHierarchyDepth.toFixed(1)}`);

    return stats;

  } catch (error) {
    console.error('Analyze account hierarchy error:', error);
    throw error;
  }
}

/**
 * Helper function to print account tree
 * @param {object} account - Account object with children
 * @param {number} depth - Current depth for indentation
 */
function printAccountTree(account, depth) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${account.accountCode}: ${account.accountName} (${account.balance || 0})`);

  if (account.children && account.children.length > 0) {
    account.children.forEach(child => printAccountTree(child, depth + 1));
  }
}
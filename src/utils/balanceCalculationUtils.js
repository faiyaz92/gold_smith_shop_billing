/**
 * Balance Calculation Utilities
 * Helper functions for using the BalanceCalculationEngine
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Usage: Call functions to perform balance calculations and validations
 */

import { BalanceCalculationEngine } from './balanceCalculationEngine.js';

/**
 * Recalculate all balances for a company
 * @param {string} companyId - Company identifier
 * @returns {object} - Recalculation results
 */
export async function recalculateCompanyBalances(companyId) {
  try {
    const balanceEngine = new BalanceCalculationEngine(companyId);

    console.log(`Starting balance recalculation for company: ${companyId}`);
    const result = await balanceEngine.recalculateAllBalances();

    if (result.success) {
      console.log(`✅ Balance recalculation completed: ${result.updatedCount} accounts updated`);
    } else {
      console.log(`❌ Balance recalculation failed: ${result.errorCount} errors`);
      console.log('Errors:', result.errors);
    }

    return result;

  } catch (error) {
    console.error('Recalculate company balances error:', error);
    throw error;
  }
}

/**
 * Validate balance consistency for a company
 * @param {string} companyId - Company identifier
 * @returns {object} - Validation results
 */
export async function validateCompanyBalanceConsistency(companyId) {
  try {
    const balanceEngine = new BalanceCalculationEngine(companyId);

    console.log(`Validating balance consistency for company: ${companyId}`);
    const result = await balanceEngine.validateBalanceConsistency();

    if (result.isConsistent) {
      console.log(`✅ Balance consistency validated: ${result.totalValidated} accounts checked`);
    } else {
      console.log(`❌ Balance inconsistencies found: ${result.inconsistencyCount} issues`);
      console.log('Inconsistencies:', result.inconsistencies);
    }

    return result;

  } catch (error) {
    console.error('Validate company balance consistency error:', error);
    throw error;
  }
}

/**
 * Get balance summary for an account
 * @param {string} companyId - Company identifier
 * @param {string} accountCode - Account code to get summary for
 * @returns {object} - Balance summary
 */
export async function getAccountBalanceSummary(companyId, accountCode) {
  try {
    const balanceEngine = new BalanceCalculationEngine(companyId);
    const summary = await balanceEngine.getBalanceSummary(accountCode);

    console.log(`Balance summary for ${accountCode} (${summary.accountName}):`);
    console.log(`  Direct Balance: ${summary.directBalance}`);
    console.log(`  Child Balance: ${summary.childBalance}`);
    console.log(`  Total Balance: ${summary.totalBalance}`);
    console.log(`  Children: ${summary.childCount}`);

    if (summary.children.length > 0) {
      console.log('  Child breakdown:');
      summary.children.forEach(child => {
        console.log(`    ${child.accountCode}: ${child.accountName} = ${child.balance}`);
      });
    }

    return summary;

  } catch (error) {
    console.error('Get account balance summary error:', error);
    throw error;
  }
}

/**
 * Update account balance with recursive hierarchy propagation
 * @param {string} companyId - Company identifier
 * @param {string} accountCode - Account code to update
 * @param {number} balanceChange - Amount to add/subtract
 * @returns {object} - Update results
 */
export async function updateAccountBalanceRecursive(companyId, accountCode, balanceChange) {
  try {
    const balanceEngine = new BalanceCalculationEngine(companyId);

    console.log(`Updating balance for ${accountCode} by ${balanceChange}`);
    const result = await balanceEngine.updateAccountBalanceRecursive(accountCode, balanceChange);

    console.log(`✅ Balance update completed: ${result.updatedAccounts.length} accounts updated`);
    console.log('Updated accounts:', result.updatedAccounts.join(', '));

    return result;

  } catch (error) {
    console.error('Update account balance recursive error:', error);
    throw error;
  }
}

/**
 * Calculate balance for a specific account
 * @param {string} companyId - Company identifier
 * @param {string} accountCode - Account code to calculate
 * @returns {number} - Calculated balance
 */
export async function calculateAccountBalance(companyId, accountCode) {
  try {
    const balanceEngine = new BalanceCalculationEngine(companyId);
    const balance = await balanceEngine.calculateAccountBalance(accountCode);

    console.log(`Calculated balance for ${accountCode}: ${balance}`);
    return balance;

  } catch (error) {
    console.error('Calculate account balance error:', error);
    throw error;
  }
}

/**
 * Get balance report for multiple accounts
 * @param {string} companyId - Company identifier
 * @param {Array} accountCodes - Array of account codes to report on
 * @returns {Array} - Array of balance summaries
 */
export async function getBalanceReport(companyId, accountCodes) {
  try {
    const balanceEngine = new BalanceCalculationEngine(companyId);
    const reports = [];

    console.log(`Generating balance report for ${accountCodes.length} accounts...`);

    for (const accountCode of accountCodes) {
      try {
        const summary = await balanceEngine.getBalanceSummary(accountCode);
        reports.push(summary);
        console.log(`${accountCode}: ${summary.totalBalance}`);
      } catch (error) {
        console.error(`Error getting summary for ${accountCode}:`, error.message);
        reports.push({
          accountCode,
          error: error.message
        });
      }
    }

    return reports;

  } catch (error) {
    console.error('Get balance report error:', error);
    throw error;
  }
}

/**
 * Quick balance integrity check
 * @param {string} companyId - Company identifier
 * @returns {boolean} - True if balances are consistent
 */
export async function quickBalanceIntegrityCheck(companyId) {
  try {
    console.log('🔍 Running quick balance integrity check...');

    const balanceEngine = new BalanceCalculationEngine(companyId);

    // Check a few key accounts
    const keyAccounts = ['MAIN-1001', 'MAIN-1002', 'MAIN-1003', 'MAIN-4001']; // Cash, Bank, Receivables, Sales
    let allConsistent = true;

    for (const accountCode of keyAccounts) {
      try {
        const summary = await balanceEngine.getBalanceSummary(accountCode);
        const calculatedBalance = await balanceEngine.calculateAccountBalance(accountCode);

        if (Math.abs(summary.totalBalance - calculatedBalance) > 0.01) {
          console.log(`❌ Balance inconsistency in ${accountCode}`);
          allConsistent = false;
        }
      } catch (error) {
        console.log(`❌ Error checking ${accountCode}:`, error.message);
        allConsistent = false;
      }
    }

    if (allConsistent) {
      console.log('✅ Quick balance integrity check passed');
    } else {
      console.log('❌ Balance integrity issues found');
    }

    return allConsistent;

  } catch (error) {
    console.error('Quick balance integrity check error:', error);
    return false;
  }
}
/**
 * Balance Validation and Maintenance Utilities
 * Tools for validating and maintaining balance calculation accuracy
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 */

import { BalanceCalculationEngine } from './balanceCalculationEngine.js';
import { HierarchicalAccountManager } from './hierarchicalAccountManager.js';
import { AccountingEngine } from './accountingEngine.js';

/**
 * Validate balance consistency across the entire company
 * @param {string} companyId - Company identifier
 * @returns {object} - Validation results
 */
export async function validateCompanyBalanceConsistency(companyId) {
  const results = {
    isConsistent: true,
    totalValidated: 0,
    inconsistencyCount: 0,
    inconsistencies: [],
    startTime: new Date(),
    endTime: null
  };

  try {
    console.log(`🔍 Validating balance consistency for company: ${companyId}`);

    const accountManager = new HierarchicalAccountManager(companyId);
    const balanceEngine = new BalanceCalculationEngine(companyId);

    // Get all accounts
    const allAccounts = await accountManager.getAccountsByLevel('ALL');
    results.totalValidated = allAccounts.length;

    console.log(`📊 Validating ${allAccounts.length} accounts...`);

    // Group accounts by parent for validation
    const accountsByParent = {};
    for (const account of allAccounts) {
      if (account.parentAccountCode) {
        if (!accountsByParent[account.parentAccountCode]) {
          accountsByParent[account.parentAccountCode] = [];
        }
        accountsByParent[account.parentAccountCode].push(account);
      }
    }

    // Validate each parent-child relationship
    for (const [parentCode, children] of Object.entries(accountsByParent)) {
      try {
        const parentBalance = await balanceEngine.calculateAccountBalance(parentCode);
        const childrenSum = children.reduce((sum, child) => sum + (child.balance || 0), 0);

        const difference = Math.abs(parentBalance - childrenSum);

        if (difference > 0.01) { // Allow for small floating point differences
          results.isConsistent = false;
          results.inconsistencyCount++;
          results.inconsistencies.push({
            parentCode,
            parentBalance,
            childrenSum,
            difference,
            children: children.map(c => ({ code: c.accountCode, balance: c.balance }))
          });
        }
      } catch (error) {
        results.isConsistent = false;
        results.inconsistencyCount++;
        results.inconsistencies.push({
          parentCode,
          error: error.message,
          children: children.map(c => c.accountCode)
        });
      }
    }

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    console.log(`✅ Validation complete in ${results.duration}ms`);
    console.log(`📈 Accounts validated: ${results.totalValidated}`);
    console.log(`⚠️ Inconsistencies found: ${results.inconsistencyCount}`);

    if (!results.isConsistent) {
      console.log('❌ Balance inconsistencies detected:');
      results.inconsistencies.forEach((inc, index) => {
        console.log(`  ${index + 1}. ${inc.parentCode}: Parent=${inc.parentBalance}, Children=${inc.childrenSum}, Diff=${inc.difference}`);
      });
    }

  } catch (error) {
    console.error('❌ Balance validation error:', error);
    results.error = error.message;
    results.isConsistent = false;
  }

  return results;
}

/**
 * Recalculate all balances for a company
 * @param {string} companyId - Company identifier
 * @returns {object} - Recalculation results
 */
export async function recalculateCompanyBalances(companyId) {
  const results = {
    success: true,
    updatedCount: 0,
    errorCount: 0,
    errors: [],
    startTime: new Date(),
    endTime: null
  };

  try {
    console.log(`🔄 Recalculating balances for company: ${companyId}`);

    const balanceEngine = new BalanceCalculationEngine(companyId);
    const accountManager = new HierarchicalAccountManager(companyId);

    // Get all accounts sorted by hierarchy depth (deepest first)
    const allAccounts = await accountManager.getAccountsByLevel('ALL');
    const sortedAccounts = await balanceEngine.sortAccountsByHierarchyDepth(allAccounts);

    console.log(`📊 Recalculating ${sortedAccounts.length} accounts...`);

    // Recalculate balances from bottom up
    for (const account of sortedAccounts) {
      try {
        await balanceEngine.updateAccountBalanceRecursive(account.accountCode, 0, true);
        results.updatedCount++;
      } catch (error) {
        results.errorCount++;
        results.errors.push({
          accountCode: account.accountCode,
          error: error.message
        });
      }
    }

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

    console.log(`✅ Recalculation complete in ${results.duration}ms`);
    console.log(`📈 Accounts updated: ${results.updatedCount}`);
    console.log(`❌ Errors: ${results.errorCount}`);

    if (results.errorCount > 0) {
      results.success = false;
      console.log('❌ Recalculation errors:');
      results.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.accountCode}: ${err.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Balance recalculation error:', error);
    results.success = false;
    results.error = error.message;
  }

  return results;
}

/**
 * Fix balance inconsistencies by recalculating affected accounts
 * @param {string} companyId - Company identifier
 * @returns {object} - Fix results
 */
export async function fixBalanceInconsistencies(companyId) {
  const results = {
    success: true,
    inconsistenciesFound: 0,
    inconsistenciesFixed: 0,
    unfixableCount: 0,
    startTime: new Date(),
    endTime: null
  };

  try {
    console.log(`🔧 Fixing balance inconsistencies for company: ${companyId}`);

    // First validate to find inconsistencies
    const validation = await validateCompanyBalanceConsistency(companyId);
    results.inconsistenciesFound = validation.inconsistencyCount;

    if (validation.isConsistent) {
      console.log('✅ No balance inconsistencies found');
      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;
      return results;
    }

    console.log(`🔄 Fixing ${validation.inconsistencyCount} inconsistencies...`);

    const balanceEngine = new BalanceCalculationEngine(companyId);

    // Fix each inconsistency by recalculating the parent
    for (const inconsistency of validation.inconsistencies) {
      try {
        await balanceEngine.updateAccountBalanceRecursive(inconsistency.parentCode, 0, true);
        results.inconsistenciesFixed++;
        console.log(`  ✅ Fixed: ${inconsistency.parentCode}`);
      } catch (error) {
        results.unfixableCount++;
        console.log(`  ❌ Could not fix: ${inconsistency.parentCode} - ${error.message}`);
      }
    }

    // Re-validate to confirm fixes
    const revalidation = await validateCompanyBalanceConsistency(companyId);

    if (revalidation.isConsistent) {
      console.log('✅ All inconsistencies fixed');
    } else {
      console.log(`⚠️ ${revalidation.inconsistencyCount} inconsistencies remain`);
      results.success = false;
    }

    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;

  } catch (error) {
    console.error('❌ Balance fix error:', error);
    results.success = false;
    results.error = error.message;
  }

  return results;
}

/**
 * Generate balance summary report
 * @param {string} companyId - Company identifier
 * @returns {object} - Balance summary
 */
export async function generateBalanceSummaryReport(companyId) {
  const report = {
    companyId,
    generatedAt: new Date(),
    summary: {},
    details: {},
    alerts: []
  };

  try {
    console.log(`📊 Generating balance summary for company: ${companyId}`);

    const balanceEngine = new BalanceCalculationEngine(companyId);
    const accountingEngine = new AccountingEngine(companyId);

    // Get balance summary
    report.summary = await balanceEngine.getBalanceSummary();

    // Validate accounting equation
    const equationResult = await accountingEngine.validateAccountingEquation();
    report.details.accountingEquation = equationResult;

    // Check for negative balances in asset accounts
    const assetAccounts = report.summary.byType?.asset || [];
    const negativeAssets = assetAccounts.filter(account => account.balance < 0);
    if (negativeAssets.length > 0) {
      report.alerts.push({
        type: 'WARNING',
        message: `${negativeAssets.length} asset accounts have negative balances`,
        accounts: negativeAssets.map(a => a.accountCode)
      });
    }

    // Check for unusual balance patterns
    const totalAssets = report.summary.totals?.assets || 0;
    const totalLiabilities = report.summary.totals?.liabilities || 0;
    const totalEquity = report.summary.totals?.equity || 0;

    if (totalAssets === 0 && (totalLiabilities > 0 || totalEquity > 0)) {
      report.alerts.push({
        type: 'ERROR',
        message: 'Assets are zero but liabilities or equity are not'
      });
    }

    // Check balance consistency
    const consistency = await validateCompanyBalanceConsistency(companyId);
    report.details.consistency = consistency;

    if (!consistency.isConsistent) {
      report.alerts.push({
        type: 'ERROR',
        message: `${consistency.inconsistencyCount} balance inconsistencies detected`,
        details: consistency.inconsistencies
      });
    }

    console.log('✅ Balance summary generated');

  } catch (error) {
    console.error('❌ Balance summary error:', error);
    report.error = error.message;
  }

  return report;
}

/**
 * Monitor balance changes in real-time (for debugging)
 * @param {string} companyId - Company identifier
 * @param {number} duration - Monitoring duration in milliseconds
 * @returns {object} - Monitoring results
 */
export async function monitorBalanceChanges(companyId, duration = 30000) {
  const results = {
    startTime: new Date(),
    endTime: null,
    changes: [],
    summary: {}
  };

  try {
    console.log(`👀 Monitoring balance changes for ${duration}ms...`);

    const { RealTimeBalanceManager } = await import('./realTimeBalanceManager.js');
    const balanceManager = new RealTimeBalanceManager(companyId);

    // Set up monitoring callback
    const changeCallback = (change) => {
      results.changes.push({
        timestamp: new Date(),
        ...change
      });
      console.log(`📈 Balance change: ${change.accountCode} ${change.oldBalance} → ${change.newBalance}`);
    };

    balanceManager.registerCallback(changeCallback);

    // Wait for monitoring period
    await new Promise(resolve => setTimeout(resolve, duration));

    balanceManager.unregisterCallback(changeCallback);

    // Generate summary
    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;
    results.summary.totalChanges = results.changes.length;
    results.summary.uniqueAccounts = [...new Set(results.changes.map(c => c.accountCode))].length;

    console.log(`✅ Monitoring complete. ${results.summary.totalChanges} changes detected.`);

  } catch (error) {
    console.error('❌ Balance monitoring error:', error);
    results.error = error.message;
  }

  return results;
}
/**
 * Balance Calculation Engine
 * Handles recursive balance calculations for hierarchical account structures
 * Based on BRD_v2.md Section 6.4 and TechnicalDoc_v2.md Section 7
 *
 * Key Features:
 * - Recursive balance calculation from leaf to root
 * - Parent account rollup (sum of all children)
 * - Real-time balance updates with hierarchy propagation
 * - Balance validation and consistency checks
 */

import { HierarchicalAccountManager } from './hierarchicalAccountManager.js';
import { db } from '../app/firebase.js';
import { doc, updateDoc, getDoc, Timestamp, increment } from 'firebase/firestore';

export class BalanceCalculationEngine {
  constructor(companyId) {
    this.companyId = companyId;
    this.accountManager = new HierarchicalAccountManager(companyId);
  }

  /**
   * Calculate balance for a specific account by summing all its child balances
   * This is the recursive rollup calculation
   * @param {string} accountCode - Account code to calculate balance for
   * @returns {number} - Calculated balance
   */
  async calculateAccountBalance(accountCode) {
    try {
      // Get all child accounts (recursive)
      const childAccounts = await this.accountManager.getChildAccounts(accountCode);

      // Sum all child balances
      let totalBalance = 0;
      for (const childAccount of childAccounts) {
        totalBalance += childAccount.balance || 0;
      }

      // Add the account's own direct balance (for leaf accounts or accounts with direct transactions)
      const account = await this.accountManager.getAccountByCode(accountCode);
      if (account) {
        // For parent accounts, the balance should be the sum of children
        // For leaf accounts, it should be the direct balance
        const isParent = childAccounts.length > 0;
        if (!isParent) {
          totalBalance += account.balance || 0;
        }
      }

      return totalBalance;

    } catch (error) {
      console.error(`Error calculating balance for account ${accountCode}:`, error);
      throw error;
    }
  }

  /**
   * Update balance for an account and recursively update all parent accounts
   * This propagates balance changes up the hierarchy
   * @param {string} accountCode - Account code that had balance change
   * @param {number} balanceChange - Amount to add/subtract from balance
   * @returns {object} - Update results
   */
  async updateAccountBalanceRecursive(accountCode, balanceChange) {
    try {
      const updatedAccounts = [];
      let currentAccountCode = accountCode;

      // Update the account itself first
      const accountRef = doc(db, this.accountManager.paths.accountsPath(), currentAccountCode);
      await updateDoc(accountRef, {
        balance: increment(balanceChange),
        updatedAt: Timestamp.now()
      });
      updatedAccounts.push(currentAccountCode);

      // Recursively update all parent accounts
      while (true) {
        const currentAccount = await this.accountManager.getAccountByCode(currentAccountCode);

        if (!currentAccount || !currentAccount.parentAccountId) {
          break; // Reached root account
        }

        currentAccountCode = currentAccount.parentAccountId;

        // Recalculate parent balance as sum of all children
        const newParentBalance = await this.calculateAccountBalance(currentAccountCode);

        // Update parent account with recalculated balance
        const parentRef = doc(db, this.accountManager.paths.accountsPath(), currentAccountCode);
        await updateDoc(parentRef, {
          balance: newParentBalance,
          updatedAt: Timestamp.now()
        });

        updatedAccounts.push(currentAccountCode);
      }

      return {
        success: true,
        updatedAccounts,
        message: `Updated ${updatedAccounts.length} accounts in hierarchy`
      };

    } catch (error) {
      console.error('Error updating account balance recursively:', error);
      throw error;
    }
  }

  /**
   * Recalculate balances for entire account hierarchy
   * Useful for data integrity checks or after bulk operations
   * @returns {object} - Recalculation results
   */
  async recalculateAllBalances() {
    try {
      const allAccounts = await this.accountManager.getAllAccounts();
      const updatedAccounts = [];
      const errors = [];

      console.log(`Starting balance recalculation for ${allAccounts.length} accounts...`);

      // Process accounts in hierarchical order (leaves first, then parents)
      // Sort by hierarchy depth (deepest first)
      const accountsByDepth = await this.sortAccountsByHierarchyDepth(allAccounts);

      for (const account of accountsByDepth) {
        try {
          const calculatedBalance = await this.calculateAccountBalance(account.accountCode);

          // Only update if balance is different
          if (Math.abs((account.balance || 0) - calculatedBalance) > 0.01) { // Allow for floating point precision
            const accountRef = doc(db, this.accountManager.paths.accountsPath(), account.accountCode);
            await updateDoc(accountRef, {
              balance: calculatedBalance,
              updatedAt: Timestamp.now()
            });
            updatedAccounts.push({
              accountCode: account.accountCode,
              oldBalance: account.balance || 0,
              newBalance: calculatedBalance
            });
          }
        } catch (error) {
          errors.push({
            accountCode: account.accountCode,
            error: error.message
          });
        }
      }

      return {
        success: errors.length === 0,
        totalAccounts: allAccounts.length,
        updatedCount: updatedAccounts.length,
        errorCount: errors.length,
        updatedAccounts,
        errors
      };

    } catch (error) {
      console.error('Error recalculating all balances:', error);
      throw error;
    }
  }

  /**
   * Sort accounts by hierarchy depth (deepest first)
   * This ensures leaf accounts are processed before their parents
   * @param {Array} accounts - Array of account objects
   * @returns {Array} - Sorted accounts
   */
  async sortAccountsByHierarchyDepth(accounts) {
    try {
      const accountsWithDepth = [];

      for (const account of accounts) {
        try {
          const hierarchyPath = await this.accountManager.getAccountHierarchyPath(account.accountCode);
          accountsWithDepth.push({
            ...account,
            hierarchyDepth: hierarchyPath.length
          });
        } catch (error) {
          // If hierarchy path fails, assume depth 1
          accountsWithDepth.push({
            ...account,
            hierarchyDepth: 1
          });
        }
      }

      // Sort by depth descending (deepest first)
      return accountsWithDepth.sort((a, b) => b.hierarchyDepth - a.hierarchyDepth);

    } catch (error) {
      console.error('Error sorting accounts by hierarchy depth:', error);
      return accounts; // Return unsorted if error
    }
  }

  /**
   * Validate balance consistency across the hierarchy
   * Checks that parent balances equal sum of child balances
   * @returns {object} - Validation results
   */
  async validateBalanceConsistency() {
    try {
      const allAccounts = await this.accountManager.getAllAccounts();
      const inconsistencies = [];
      const validatedAccounts = [];

      console.log('Validating balance consistency...');

      for (const account of allAccounts) {
        try {
          const childAccounts = await this.accountManager.getChildAccounts(account.accountCode);

          if (childAccounts.length > 0) {
            // This is a parent account, check if balance equals sum of children
            const calculatedBalance = await this.calculateAccountBalance(account.accountCode);
            const actualBalance = account.balance || 0;

            if (Math.abs(actualBalance - calculatedBalance) > 0.01) {
              inconsistencies.push({
                accountCode: account.accountCode,
                accountName: account.accountName,
                actualBalance,
                calculatedBalance,
                difference: actualBalance - calculatedBalance
              });
            }
          }

          validatedAccounts.push(account.accountCode);

        } catch (error) {
          inconsistencies.push({
            accountCode: account.accountCode,
            error: error.message
          });
        }
      }

      return {
        isConsistent: inconsistencies.length === 0,
        totalValidated: validatedAccounts.length,
        inconsistencyCount: inconsistencies.length,
        inconsistencies
      };

    } catch (error) {
      console.error('Error validating balance consistency:', error);
      throw error;
    }
  }

  /**
   * Get balance summary for an account including breakdown by children
   * @param {string} accountCode - Account code to get summary for
   * @returns {object} - Balance summary with child breakdown
   */
  async getBalanceSummary(accountCode) {
    try {
      const account = await this.accountManager.getAccountByCode(accountCode);
      if (!account) {
        throw new Error(`Account ${accountCode} not found`);
      }

      const childAccounts = await this.accountManager.getChildAccounts(accountCode);
      const childBalances = childAccounts.map(child => ({
        accountCode: child.accountCode,
        accountName: child.accountName,
        balance: child.balance || 0
      }));

      const totalChildBalance = childBalances.reduce((sum, child) => sum + child.balance, 0);
      const directBalance = account.balance || 0;
      const isParent = childAccounts.length > 0;

      return {
        accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        directBalance,
        childBalance: totalChildBalance,
        totalBalance: isParent ? totalChildBalance : directBalance,
        isParent,
        childCount: childAccounts.length,
        children: childBalances
      };

    } catch (error) {
      console.error(`Error getting balance summary for ${accountCode}:`, error);
      throw error;
    }
  }
}
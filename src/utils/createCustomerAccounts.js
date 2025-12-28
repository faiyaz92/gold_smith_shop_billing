/**
 * Customer Account Creation Utility
 * Creates customer-level accounts for receivable tracking
 * Based on BRD_v2.md Section 4.3.2 and TechnicalDoc_v2.md Section 6.4
 *
 * Usage: Call createCustomerAccountsForCompany() when:
 * - A new customer registers (auto-creation)
 * - First credit sale > $100 to existing customer (transaction trigger)
 * - Manual account creation for existing customers
 */

import { HierarchicalAccountManager } from './hierarchicalAccountManager.js';

/**
 * Create customer accounts for a company
 * @param {string} companyId - Company identifier
 * @param {Array} customers - Array of customer objects with {customerId, customerName}
 * @returns {object} - Creation results summary
 */
export async function createCustomerAccountsForCompany(companyId, customers) {
  try {
    const accountManager = new HierarchicalAccountManager(companyId);

    const results = {
      created: [],
      skipped: [],
      errors: []
    };

    console.log(`Starting customer account creation for ${customers.length} customers...`);

    // Process each customer
    for (const customer of customers) {
      try {
        const result = await accountManager.createCustomerAccount({
          customerId: customer.customerId,
          customerName: customer.customerName
        });

        if (result.created) {
          results.created.push({
            customerId: customer.customerId,
            accountCode: result.account.accountCode,
            accountName: result.account.accountName
          });
          console.log(`✓ Created account for customer: ${customer.customerName} (${result.account.accountCode})`);
        } else {
          results.skipped.push({
            customerId: customer.customerId,
            reason: result.message
          });
          console.log(`⚠ Skipped customer: ${customer.customerName} (${result.message})`);
        }

      } catch (error) {
        results.errors.push({
          customerId: customer.customerId,
          customerName: customer.customerName,
          error: error.message
        });
        console.error(`✗ Error creating account for customer ${customer.customerId}:`, error.message);
      }
    }

    const summary = {
      success: results.errors.length === 0,
      totalCustomers: customers.length,
      createdCount: results.created.length,
      skippedCount: results.skipped.length,
      errorCount: results.errors.length,
      results
    };

    console.log(`Customer account creation completed:`, {
      total: summary.totalCustomers,
      created: summary.createdCount,
      skipped: summary.skippedCount,
      errors: summary.errorCount
    });

    return summary;

  } catch (error) {
    console.error('Create customer accounts error:', error);
    throw error;
  }
}

/**
 * Create a single customer account
 * @param {string} companyId - Company identifier
 * @param {string} customerId - Customer ID
 * @param {string} customerName - Customer name
 * @returns {object} - Creation result
 */
export async function createSingleCustomerAccount(companyId, customerId, customerName) {
  try {
    const accountManager = new HierarchicalAccountManager(companyId);

    const result = await accountManager.createCustomerAccount({
      customerId: customerId,
      customerName: customerName
    });

    return result;

  } catch (error) {
    console.error('Create single customer account error:', error);
    throw error;
  }
}

/**
 * Check if customer account exists
 * @param {string} companyId - Company identifier
 * @param {string} customerId - Customer ID
 * @returns {boolean} - True if account exists
 */
export async function customerAccountExists(companyId, customerId) {
  try {
    const accountManager = new HierarchicalAccountManager(companyId);

    // Generate expected account code
    const customerNumber = customerId.includes('-')
      ? customerId.split('-')[1]
      : customerId.padStart(4, '0');
    const expectedAccountCode = `CUST-${customerNumber}`;

    const account = await accountManager.getAccountByCode(expectedAccountCode);
    return account !== null;

  } catch (error) {
    console.error('Check customer account exists error:', error);
    return false;
  }
}
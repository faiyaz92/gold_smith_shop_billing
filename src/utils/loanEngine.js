// src/utils/loanEngine.js
// Gold Loan Engine for Ahmad Gold Business
// Handles cash loans converted to gold grams and gold repayments

import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../app/firebase.js';
import { AccountingEngine } from './accountingEngine.js';

// Utility function to get firestore paths
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    getLoansPath: () => `${tenantCompaniesPath}/${companyId}/loans`,
    getAccountsPath: () => `${tenantCompaniesPath}/${companyId}/accounts`,
    getTransactionsPath: () => `${tenantCompaniesPath}/${companyId}/transactions`,
    getCustomersPath: () => `${tenantCompaniesPath}/${companyId}/customers`
  };
};

export class LoanEngine {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
    this.accountingEngine = new AccountingEngine(companyId);
  }

  /**
   * Record a cash loan to customer (converted to gold grams)
   * @param {Object} loanData - Loan information
   * @returns {Object} - Loan record result
   */
  async recordCashLoan(loanData) {
    const {
      customerId,
      usdAmount,
      goldPricePerGram,
      interestRate = 0,
      loanTermDays = 30,
      purpose = 'Cash Loan',
      notes = ''
    } = loanData;

    try {
      // Validate customer exists
      const customer = await this.getCustomer(customerId);
      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      // Calculate equivalent gold grams
      const goldGramsEquivalent = usdAmount / goldPricePerGram;

      // Generate loan ID
      const loanId = await this.generateLoanId();

      // Calculate due date
      const loanDate = new Date();
      const dueDate = new Date(loanDate);
      dueDate.setDate(dueDate.getDate() + loanTermDays);

      // Create loan record
      const loanDoc = {
        loanId,
        companyId: this.companyId,
        customerId,
        customerName: customer.name,
        customerPhone: customer.phone,

        // Loan amounts
        usdAmount: parseFloat(usdAmount.toFixed(2)),
        goldGramsEquivalent: parseFloat(goldGramsEquivalent.toFixed(3)),
        goldPricePerGram: parseFloat(goldPricePerGram.toFixed(2)),

        // Loan terms
        interestRate: parseFloat(interestRate.toFixed(2)),
        loanTermDays,
        loanDate: Timestamp.fromDate(loanDate),
        dueDate: Timestamp.fromDate(dueDate),

        // Status and tracking
        status: 'active', // active, repaid, overdue, defaulted
        purpose,
        notes,

        // Accounting flags
        accountingRecorded: false,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        // Migration fields
        _version: "2.0",
        _migrationStatus: "active"
      };

      // Save loan record
      const docRef = await addDoc(collection(db, this.paths.getLoansPath()), loanDoc);

      // Record accounting entry using customer's receivable account
      await this.recordLoanAccounting(loanDoc);

      // Update loan with accounting flag
      await updateDoc(docRef, {
        accountingRecorded: true,
        updatedAt: serverTimestamp()
      });
        updatedAt: serverTimestamp()
      });

      // Record accounting entry: Customer owes gold grams
      // Debit: Loan Receivable (gold grams) - what customer owes
      // Credit: Cash (USD amount given)
      await this.recordLoanAccounting({
        ...loanDoc,
        loanAccountId: loanAccountResult.account.accountCode
      });

      return {
        id: docRef.id,
        loanId,
        ...loanDoc
      };

    } catch (error) {
      console.error('Error recording cash loan:', error);
      throw error;
    }
  }

  /**
   * Record loan repayment (customer returns gold)
   * @param {Object} repaymentData - Repayment information
   * @returns {Object} - Repayment record result
   */
  async recordLoanRepayment(repaymentData) {
    const {
      loanId,
      goldGramsReturned,
      goldPricePerGram,
      repaymentDate = new Date(),
      notes = ''
    } = repaymentData;

    try {
      // Get loan details
      const loan = await this.getLoan(loanId);
      if (!loan) {
        throw new Error(`Loan ${loanId} not found`);
      }

      if (loan.status !== 'active') {
        throw new Error(`Loan ${loanId} is not active`);
      }

      // Calculate USD value of gold returned
      const usdValueReturned = goldGramsReturned * goldPricePerGram;

      // Calculate remaining balance
      const remainingGoldOwed = loan.goldGramsEquivalent - goldGramsReturned;
      const remainingUsdValue = remainingGoldOwed * goldPricePerGram;

      // Determine new status
      let newStatus = 'active';
      if (remainingGoldOwed <= 0.001) { // Allow small rounding differences
        newStatus = 'repaid';
      } else if (new Date() > loan.dueDate.toDate()) {
        newStatus = 'overdue';
      }

      // Update loan record
      const loanRef = doc(db, this.paths.getLoansPath(), loan.id);
      await updateDoc(loanRef, {
        status: newStatus,
        goldGramsReturned: (loan.goldGramsReturned || 0) + goldGramsReturned,
        usdValueReturned: (loan.usdValueReturned || 0) + usdValueReturned,
        lastRepaymentDate: Timestamp.fromDate(repaymentDate),
        updatedAt: serverTimestamp()
      });

      // Record accounting entry: Customer repays gold
      // Debit: Cash/Gold Inventory (gold received)
      // Credit: Loan Receivable (gold grams repaid)
      await this.recordRepaymentAccounting({
        ...repayment,
        loanAccountId: loan.loanAccountId
      });

      return {
        loanId,
        goldGramsReturned,
        usdValueReturned,
        remainingGoldOwed: Math.max(0, remainingGoldOwed),
        newStatus
      };

    } catch (error) {
      console.error('Error recording loan repayment:', error);
      throw error;
    }
  }

  /**
   * Record accounting entries for loan
   */
  async recordLoanAccounting(loan) {
    // When giving cash loan:
    // Customer receives USD cash but owes equivalent gold grams
    // We use the customer's receivable account (not separate loan accounts)
    // This keeps it simple - one account per customer tracks all receivables

    const customerAccountCode = `CUST-${loan.customerId.split('-')[1] || loan.customerId.padStart(4, '0')}`;

    await this.accountingEngine.recordTransaction({
      description: `Cash loan to ${loan.customerName} - ${loan.goldGramsEquivalent.toFixed(3)}g gold equivalent of $${loan.usdAmount.toFixed(2)} (Loan ID: ${loan.loanId})`,
      debitAccountId: customerAccountCode, // Customer receivable account (includes loans)
      creditAccountId: '1201', // Cash account
      amount: loan.goldGramsEquivalent, // Amount in gold grams
      referenceType: 'loan',
      referenceId: loan.loanId
    });
  }

  /**
   * Record accounting entries for repayment
   */
  async recordRepaymentAccounting(repayment) {
    // When customer repays with gold:
    // Debit: Gold Inventory (gold received)
    // Credit: Customer Receivable (gold grams repaid)

    const customerAccountCode = `CUST-${repayment.customerId.split('-')[1] || repayment.customerId.padStart(4, '0')}`;

    await this.accountingEngine.recordTransaction({
      description: `Loan repayment from ${repayment.customerName} - ${repayment.goldGramsReturned.toFixed(3)}g gold returned (Loan ID: ${repayment.loanId})`,
      debitAccountId: '1101', // Gold Inventory (gold received)
      creditAccountId: customerAccountCode, // Customer receivable account
      amount: repayment.goldGramsReturned,
      referenceType: 'loan_repayment',
      referenceId: repayment.loanId
    });
  }

  /**
   * Generate unique loan ID
   */
  async generateLoanId() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `LOAN-${dateStr}-`;

    const q = query(
      collection(db, this.paths.getLoansPath()),
      where('companyId', '==', this.companyId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    let nextNumber = 1;

    if (!snapshot.empty) {
      const lastLoan = snapshot.docs[0].data();
      const lastLoanId = lastLoan.loanId;
      if (lastLoanId && lastLoanId.startsWith(prefix)) {
        const lastNumber = parseInt(lastLoanId.split('-').pop());
        nextNumber = lastNumber + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId) {
    const customerRef = doc(db, this.paths.getCustomersPath(), customerId);
    const customerSnap = await getDoc(customerRef);

    if (customerSnap.exists()) {
      return {
        id: customerSnap.id,
        ...customerSnap.data()
      };
    }
    return null;
  }

  /**
   * Get loan details
   */
  async getLoan(loanId) {
    const q = query(
      collection(db, this.paths.getLoansPath()),
      where('loanId', '==', loanId),
      where('companyId', '==', this.companyId)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const loanDoc = snapshot.docs[0];
      return {
        id: loanDoc.id,
        ...loanDoc.data()
      };
    }
    return null;
  }

  /**
   * Get all loans for a customer
   */
  async getCustomerLoans(customerId) {
    const q = query(
      collection(db, this.paths.getLoansPath()),
      where('customerId', '==', customerId),
      where('companyId', '==', this.companyId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Get loan summary for dashboard
   */
  async getLoanSummary() {
    const q = query(
      collection(db, this.paths.getLoansPath()),
      where('companyId', '==', this.companyId)
    );

    const snapshot = await getDocs(q);
    const loans = snapshot.docs.map(doc => doc.data());

    const summary = {
      totalLoans: loans.length,
      activeLoans: loans.filter(l => l.status === 'active').length,
      repaidLoans: loans.filter(l => l.status === 'repaid').length,
      overdueLoans: loans.filter(l => l.status === 'overdue').length,
      totalGoldOwed: loans
        .filter(l => l.status === 'active')
        .reduce((sum, l) => sum + (l.goldGramsEquivalent - (l.goldGramsReturned || 0)), 0),
      totalUsdValue: loans
        .filter(l => l.status === 'active')
        .reduce((sum, l) => sum + (l.usdAmount - (l.usdValueReturned || 0)), 0)
    };

    return summary;
  }
}
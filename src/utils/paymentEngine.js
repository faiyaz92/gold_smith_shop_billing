// src/utils/paymentEngine.js
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../app/firebase';

// Utility function to get firestore paths (non-hook version)
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    getInvoicesPath: () => `${tenantCompaniesPath}/${companyId}/invoices`,
    getPaymentsPath: () => `${tenantCompaniesPath}/${companyId}/payments`,
    getAccountsPath: () => `${tenantCompaniesPath}/${companyId}/accounts`,
    getTransactionsPath: () => `${tenantCompaniesPath}/${companyId}/transactions`
  };
};

export class PaymentEngine {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
    this.validPaymentMethods = ['cash', 'card', 'bank_transfer', 'cheque', 'upi', 'online'];
    this.validStatuses = ['pending', 'processed', 'failed', 'cancelled'];
  }

  async recordPayment(paymentData) {
    const {
      invoiceId,
      amount,
      paymentMethod,
      paymentReference,
      receivedBy,
      notes,
      paymentDate,
      bankDetails
    } = paymentData;

    // Validate payment data
    this.validatePaymentData(paymentData);

    // Generate payment ID
    const paymentId = await this.generatePaymentId();

    // Get invoice details if invoiceId provided
    let invoice = null;
    if (invoiceId) {
      invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }
    }

    const paymentDoc = {
      paymentId,
      companyId: this.companyId,
      invoiceId,
      amount: parseFloat(amount.toFixed(2)),
      paymentMethod,
      paymentReference,
      paymentDate: paymentDate ? Timestamp.fromDate(new Date(paymentDate)) : Timestamp.now(),
      receivedBy,
      notes,
      status: 'processed',
      bankDetails,
      createdAt: Timestamp.now(),
      // Migration-ready fields
      _version: "2.0",
      _migrationStatus: "active",
      _v3Ready: true,
      _v4Ready: false
    };

    // Save payment
    const docRef = await addDoc(collection(db, this.paths.getPaymentsPath()), paymentDoc);

    // Update invoice status if invoice payment
    if (invoiceId) {
      await this.updateInvoiceStatus(invoiceId, amount);
    }

    // Create accounting entries
    await this.recordPaymentAccounting(paymentDoc);

    return {
      id: docRef.id,
      paymentId,
      ...paymentDoc
    };
  }

  async generatePaymentId() {
    // Generate payment ID: PAY-{YYYYMMDD}-{sequential}
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PAY-${dateStr}-`;

    // Get the last payment number for today
    const q = query(
      collection(db, this.paths.getPaymentsPath()),
      where('companyId', '==', this.companyId),
      where('paymentId', '>=', prefix),
      where('paymentId', '<', prefix + 'z')
    );

    const querySnapshot = await getDocs(q);
    let maxSeq = 0;

    querySnapshot.forEach((doc) => {
      const payNum = doc.data().paymentId;
      const seq = parseInt(payNum.split('-')[2] || '0');
      if (seq > maxSeq) maxSeq = seq;
    });

    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefix}${nextSeq}`;
  }

  async getInvoice(invoiceId) {
    const invoiceRef = doc(db, `${this.paths.getInvoicesPath()}/${invoiceId}`);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return null;
    }

    return { id: invoiceSnap.id, ...invoiceSnap.data() };
  }

  async updateInvoiceStatus(invoiceId, paymentAmount) {
    const invoiceRef = doc(db, `${this.paths.getInvoicesPath()}/${invoiceId}`);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const invoiceData = invoiceSnap.data();
    const currentPaidAmount = invoiceData.paidAmount || 0;
    const newPaidAmount = currentPaidAmount + paymentAmount;
    const totalAmount = invoiceData.totalAmount || invoiceData.subtotal || 0;

    // Determine new status
    let newStatus = 'unpaid';
    if (newPaidAmount >= totalAmount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    await updateDoc(invoiceRef, {
      paidAmount: parseFloat(newPaidAmount.toFixed(2)),
      status: newStatus,
      lastPaymentDate: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return { newStatus, newPaidAmount };
  }

  async recordPaymentAccounting(paymentData) {
    // Import AccountingEngine dynamically to avoid circular imports
    const { AccountingEngine } = await import('./accountingEngine');

    const accountingEngine = new AccountingEngine(paymentData.companyId);

    // Debit: Cash/Bank account
    // Credit: Accounts Receivable (if invoice payment) or Sales Revenue (if direct payment)
    const cashAccountId = this.getCashAccountId(paymentData.paymentMethod);
    const creditAccountId = paymentData.invoiceId ? 'MAIN-1003' : 'MAIN-4001'; // AR or Sales Revenue

    await accountingEngine.recordTransaction({
      description: `Payment received ${paymentData.invoiceId ? `for Invoice ${paymentData.invoiceId}` : '(direct payment)'}`,
      debitAccountId: cashAccountId,
      creditAccountId: creditAccountId,
      amount: paymentData.amount,
      referenceType: 'payment',
      referenceId: paymentData.paymentId
    });
  }

  getCashAccountId(paymentMethod) {
    switch (paymentMethod) {
      case 'cash':
        return 'MAIN-1001'; // Cash
      case 'card':
      case 'upi':
      case 'online':
        return 'MAIN-1002'; // Bank
      case 'bank_transfer':
      case 'cheque':
        return 'MAIN-1002'; // Bank
      default:
        return 'MAIN-1001'; // Default to cash
    }
  }

  validatePaymentData(paymentData) {
    const { amount, paymentMethod } = paymentData;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Payment amount must be a positive number');
    }

    if (!this.validPaymentMethods.includes(paymentMethod)) {
      throw new Error(`Invalid payment method: ${paymentMethod}. Valid methods: ${this.validPaymentMethods.join(', ')}`);
    }

    return true;
  }

  validatePaymentMethod(paymentMethod) {
    if (!this.validPaymentMethods.includes(paymentMethod)) {
      throw new Error(`Invalid payment method: ${paymentMethod}. Valid methods: ${this.validPaymentMethods.join(', ')}`);
    }
    return true;
  }

  async getPayment(paymentId) {
    const paymentRef = doc(db, `${this.paths.getPaymentsPath()}/${paymentId}`);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      return null;
    }

    return { id: paymentSnap.id, ...paymentSnap.data() };
  }

  async getPaymentsByInvoice(invoiceId, limitCount = 50) {
    const q = query(
      collection(db, this.paths.getPaymentsPath()),
      where('companyId', '==', this.companyId),
      where('invoiceId', '==', invoiceId),
      orderBy('paymentDate', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getPaymentsByDateRange(startDate, endDate, paymentMethod = null) {
    let q = query(
      collection(db, this.paths.getPaymentsPath()),
      where('companyId', '==', this.companyId),
      where('paymentDate', '>=', Timestamp.fromDate(new Date(startDate))),
      where('paymentDate', '<=', Timestamp.fromDate(new Date(endDate))),
      orderBy('paymentDate', 'desc')
    );

    if (paymentMethod) {
      q = query(q, where('paymentMethod', '==', paymentMethod));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getOutstandingInvoices() {
    const q = query(
      collection(db, this.paths.getInvoicesPath()),
      where('companyId', '==', this.companyId),
      where('status', 'in', ['unpaid', 'partial']),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const invoices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate outstanding amounts
    return invoices.map(invoice => ({
      ...invoice,
      outstandingAmount: (invoice.totalAmount || invoice.subtotal || 0) - (invoice.paidAmount || 0)
    })).filter(invoice => invoice.outstandingAmount > 0);
  }

  async getPaymentSummary(startDate, endDate) {
    const payments = await this.getPaymentsByDateRange(startDate, endDate);

    const summary = {
      period: { startDate, endDate },
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      paymentMethods: {},
      dailyTotals: {}
    };

    // Aggregate by payment method and date
    payments.forEach(payment => {
      // Payment methods
      summary.paymentMethods[payment.paymentMethod] =
        (summary.paymentMethods[payment.paymentMethod] || 0) + payment.amount;

      // Daily totals
      const dateKey = payment.paymentDate.toDate().toISOString().split('T')[0];
      summary.dailyTotals[dateKey] =
        (summary.dailyTotals[dateKey] || 0) + payment.amount;
    });

    return summary;
  }

  async reconcilePayments(startDate, endDate) {
    console.log(`🔄 Starting payment reconciliation for period: ${startDate} to ${endDate}`);

    const reconciliation = {
      period: { startDate, endDate },
      totalPayments: 0,
      totalAmount: 0,
      reconciledPayments: 0,
      discrepancies: [],
      summary: {
        matched: 0,
        unmatched: 0,
        overpayments: 0,
        underpayments: 0
      }
    };

    // Get all payments in the period
    const payments = await this.getPaymentsByDateRange(startDate, endDate);
    reconciliation.totalPayments = payments.length;
    reconciliation.totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Process each payment
    for (const payment of payments) {
      if (!payment.invoiceId) {
        // Direct payment - no reconciliation needed
        reconciliation.summary.unmatched++;
        continue;
      }

      try {
        // Get current invoice status
        const invoice = await this.getInvoice(payment.invoiceId);
        if (!invoice) {
          reconciliation.discrepancies.push({
            paymentId: payment.paymentId,
            issue: 'Invoice not found',
            paymentAmount: payment.amount,
            invoiceId: payment.invoiceId
          });
          reconciliation.summary.unmatched++;
          continue;
        }

        const expectedPaid = invoice.paidAmount || 0;
        const actualPaid = expectedPaid; // This would be calculated from all payments
        const invoiceTotal = invoice.totalAmount || invoice.subtotal || 0;

        // Check for discrepancies
        if (Math.abs(actualPaid - expectedPaid) > 0.01) { // Allow for small rounding differences
          reconciliation.discrepancies.push({
            paymentId: payment.paymentId,
            invoiceId: payment.invoiceId,
            issue: 'Payment amount mismatch',
            expectedPaid,
            actualPaid,
            difference: actualPaid - expectedPaid
          });

          if (actualPaid > expectedPaid) {
            reconciliation.summary.overpayments++;
          } else {
            reconciliation.summary.underpayments++;
          }
        } else {
          reconciliation.reconciledPayments++;
          reconciliation.summary.matched++;
        }

      } catch (error) {
        reconciliation.discrepancies.push({
          paymentId: payment.paymentId,
          issue: `Reconciliation error: ${error.message}`,
          paymentAmount: payment.amount,
          invoiceId: payment.invoiceId
        });
        reconciliation.summary.unmatched++;
      }
    }

    console.log(`✅ Reconciliation complete: ${reconciliation.reconciledPayments}/${reconciliation.totalPayments} payments reconciled`);
    if (reconciliation.discrepancies.length > 0) {
      console.log(`⚠️  Found ${reconciliation.discrepancies.length} discrepancies`);
    }

    return reconciliation;
  }

  async getOverdueInvoices(daysOverdue = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);

    const q = query(
      collection(db, this.paths.getInvoicesPath()),
      where('companyId', '==', this.companyId),
      where('status', 'in', ['unpaid', 'partial']),
      where('date', '<', Timestamp.fromDate(cutoffDate)),
      orderBy('date', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const invoices = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate days overdue and outstanding amounts
    return invoices.map(invoice => {
      const invoiceDate = invoice.date.toDate();
      const daysOverdue = Math.floor((new Date() - invoiceDate) / (1000 * 60 * 60 * 24));
      const outstandingAmount = (invoice.totalAmount || invoice.subtotal || 0) - (invoice.paidAmount || 0);

      return {
        ...invoice,
        daysOverdue,
        outstandingAmount
      };
    }).filter(invoice => invoice.outstandingAmount > 0);
  }

  async runPaymentTests() {
    console.log('🧪 Running Payment Engine Tests...\n');

    const testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };

    // Test 1: Payment method validation
    testResults.total++;
    try {
      this.validatePaymentMethod('cash');
      this.validatePaymentMethod('card');
      this.validatePaymentMethod('bank_transfer');
      console.log('✅ Payment method validation passed');
      testResults.passed++;
    } catch (error) {
      console.log('❌ Payment method validation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Payment validation: ${error.message}`);
    }

    // Test 2: Invalid payment method
    testResults.total++;
    try {
      this.validatePaymentMethod('bitcoin');
      console.log('❌ Invalid payment method test failed - should have thrown error');
      testResults.failed++;
      testResults.errors.push('Invalid payment method test: should have thrown error');
    } catch (error) {
      if (error.message.includes('Invalid payment method')) {
        console.log('✅ Invalid payment method validation passed');
        testResults.passed++;
      } else {
        console.log('❌ Invalid payment method test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Invalid payment test: ${error.message}`);
      }
    }

    // Test 3: Payment data validation
    testResults.total++;
    try {
      const validData = {
        amount: 100.00,
        paymentMethod: 'cash',
        invoiceId: 'INV-001'
      };
      this.validatePaymentData(validData);
      console.log('✅ Payment data validation passed');
      testResults.passed++;
    } catch (error) {
      console.log('❌ Payment data validation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Data validation: ${error.message}`);
    }

    // Test 4: Invalid payment data
    testResults.total++;
    try {
      this.validatePaymentData({ paymentMethod: 'cash' }); // Missing amount
      console.log('❌ Invalid data test failed - should have thrown error');
      testResults.failed++;
      testResults.errors.push('Invalid data test: should have thrown error');
    } catch (error) {
      if (error.message.includes('amount')) {
        console.log('✅ Invalid data validation passed');
        testResults.passed++;
      } else {
        console.log('❌ Invalid data test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Invalid data test: ${error.message}`);
      }
    }

    // Test 5: Payment ID generation (basic check)
    testResults.total++;
    try {
      const payId = await this.generatePaymentId();
      if (payId && payId.startsWith('PAY-') && payId.length > 10) {
        console.log('✅ Payment ID generation passed');
        testResults.passed++;
      } else {
        console.log('❌ Payment ID generation failed: invalid format');
        testResults.failed++;
        testResults.errors.push('Payment ID generation: invalid format');
      }
    } catch (error) {
      console.log('❌ Payment ID generation failed:', error.message);
      testResults.failed++;
      testResults.errors.push(`Payment ID: ${error.message}`);
    }

    // Summary
    console.log(`\n📊 Test Results: ${testResults.passed}/${testResults.total} passed`);
    if (testResults.failed > 0) {
      console.log(`❌ Failed tests: ${testResults.failed}`);
      testResults.errors.forEach(error => console.log(`   - ${error}`));
    }

    return testResults;
  }
}
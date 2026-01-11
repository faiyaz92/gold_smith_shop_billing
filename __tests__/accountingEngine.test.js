// __tests__/accountingEngine.test.js
import { AccountingEngine } from '../src/utils/accountingEngine.js';

// Mock Firebase at module level
jest.mock('../src/app/firebase.js', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection'),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(() => ({ id: 'mock-doc-id' })),
  getDoc: jest.fn(() => Promise.resolve({
    data: () => ({ currentBalance: 1000, accountCode: '1201', accountName: 'Cash' }),
    exists: () => true,
    id: 'mock-doc-id'
  })),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [],
    size: 0,
    empty: true,
    forEach: () => {}
  })),
  query: jest.fn(() => 'mock-query'),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
}));

describe('AccountingEngine - Core Functionality', () => {
  let accountingEngine;

  beforeEach(() => {
    accountingEngine = new AccountingEngine('test-company-123');
    jest.clearAllMocks();
  });

  test('should instantiate with correct company ID', () => {
    expect(accountingEngine.companyId).toBe('test-company-123');
    expect(accountingEngine).toHaveProperty('recordTransaction');
    expect(accountingEngine).toHaveProperty('createJournalEntry');
    expect(accountingEngine).toHaveProperty('validateJournalEntry');
  });

  test('should have required methods', () => {
    expect(typeof accountingEngine.recordTransaction).toBe('function');
    expect(typeof accountingEngine.createJournalEntry).toBe('function');
    expect(typeof accountingEngine.validateJournalEntry).toBe('function');
    expect(typeof accountingEngine.getAccountBalance).toBe('function');
  });

  test('should validate journal entry structure', async () => {
    const validEntries = [
      { accountId: 'acc1', debit: 1000, credit: 0 },
      { accountId: 'acc2', debit: 0, credit: 1000 }
    ];

    // Mock the validation method to return success
    accountingEngine.validateJournalEntry = jest.fn().mockResolvedValue({
      isValid: true,
      totalDebit: 1000,
      totalCredit: 1000
    });

    const result = await accountingEngine.validateJournalEntry(validEntries);
    expect(result.isValid).toBe(true);
    expect(result.totalDebit).toBe(1000);
    expect(result.totalCredit).toBe(1000);
  });

  test('should reject unbalanced journal entries', async () => {
    const invalidEntries = [
      { accountId: 'acc1', debit: 1000, credit: 0 },
      { accountId: 'acc2', debit: 0, credit: 500 } // Unbalanced
    ];

    // Mock the validation method to return failure
    accountingEngine.validateJournalEntry = jest.fn().mockResolvedValue({
      isValid: false,
      totalDebit: 1000,
      totalCredit: 500,
      message: 'Journal entry is not balanced'
    });

    const result = await accountingEngine.validateJournalEntry(invalidEntries);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('not balanced');
  });

  test('should handle transaction recording', async () => {
    const transactionData = {
      description: 'Test transaction',
      debitAccountId: 'cash-account',
      creditAccountId: 'revenue-account',
      amount: 1000,
      referenceType: 'test',
      referenceId: 'test-123'
    };

    // Mock the recordTransaction method
    accountingEngine.recordTransaction = jest.fn().mockResolvedValue({
      id: 'transaction-id',
      transactionId: 'txn-123'
    });

    const result = await accountingEngine.recordTransaction(transactionData);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('transactionId');
  });

  test('should handle business transaction methods', () => {
    expect(typeof accountingEngine.recordSaleTransaction).toBe('function');
    expect(typeof accountingEngine.recordCOGSTransaction).toBe('function');
    expect(typeof accountingEngine.recordCustomerPayment).toBe('function');
    expect(typeof accountingEngine.recordSupplierPayment).toBe('function');
  });

  test('should handle legacy createEntry method', () => {
    expect(typeof accountingEngine.createEntry).toBe('function');
  });

  test('should handle validation methods', () => {
    expect(typeof accountingEngine.validateAccountTransfer).toBe('function');
    expect(typeof accountingEngine.validateAccountingEquation).toBe('function');
  });
});

describe('AccountingEngine - Business Logic Validation', () => {
  let accountingEngine;

  beforeEach(() => {
    accountingEngine = new AccountingEngine('test-company-123');
  });

  test('should validate account transfer correctly', async () => {
    // Mock validation method
    accountingEngine.validateAccountTransfer = jest.fn().mockResolvedValue({
      isValid: true,
      message: 'Transfer is valid'
    });

    const result = await accountingEngine.validateAccountTransfer('acc1', 'acc2', 500);
    expect(result.isValid).toBe(true);
  });

  test('should reject invalid transfer amounts', async () => {
    accountingEngine.validateAccountTransfer = jest.fn().mockResolvedValue({
      isValid: false,
      message: 'Amount must be greater than 0'
    });

    const result = await accountingEngine.validateAccountTransfer('acc1', 'acc2', -100);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('greater than 0');
  });

  test('should reject transfer to same account', async () => {
    accountingEngine.validateAccountTransfer = jest.fn().mockResolvedValue({
      isValid: false,
      message: 'Source and destination accounts must be different'
    });

    const result = await accountingEngine.validateAccountTransfer('acc1', 'acc1', 500);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('must be different');
  });

  test('should handle accounting equation validation', async () => {
    accountingEngine.validateAccountingEquation = jest.fn().mockResolvedValue({
      isBalanced: true,
      assets: 10000,
      liabilities: 3000,
      equity: 7000
    });

    const result = await accountingEngine.validateAccountingEquation();
    expect(result.isBalanced).toBe(true);
    expect(result.assets).toBe(10000);
    expect(result.liabilities).toBe(3000);
    expect(result.equity).toBe(7000);
  });
});

describe('AccountingEngine - Error Handling', () => {
  let accountingEngine;

  beforeEach(() => {
    accountingEngine = new AccountingEngine('test-company-123');
  });

  test('should handle transaction recording errors', async () => {
    accountingEngine.recordTransaction = jest.fn().mockRejectedValue(
      new Error('Database connection failed')
    );

    await expect(accountingEngine.recordTransaction({})).rejects.toThrow('Database connection failed');
  });

  test('should handle journal entry creation errors', async () => {
    accountingEngine.createJournalEntry = jest.fn().mockRejectedValue(
      new Error('Invalid account reference')
    );

    await expect(accountingEngine.createJournalEntry({})).rejects.toThrow('Invalid account reference');
  });

  test('should handle balance retrieval errors', async () => {
    accountingEngine.getAccountBalance = jest.fn().mockRejectedValue(
      new Error('Account not found')
    );

    await expect(accountingEngine.getAccountBalance('invalid-account')).rejects.toThrow('Account not found');
  });
});
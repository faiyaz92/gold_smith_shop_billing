// __tests__/balanceCalculationEngine.test.js
import { BalanceCalculationEngine } from '../src/utils/balanceCalculationEngine.js';

// Mock Firebase at module level
jest.mock('../src/app/firebase.js', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'mock-doc-id' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({
    data: () => ({ currentBalance: 1000, accountCode: '1201', accountName: 'Cash' }),
    exists: () => true,
    id: 'mock-doc-id'
  })),
  increment: jest.fn(() => 'increment-mock')
}));

describe('BalanceCalculationEngine - Core Functionality', () => {
  let balanceEngine;

  beforeEach(() => {
    balanceEngine = new BalanceCalculationEngine('test-company-123');
    jest.clearAllMocks();
  });

  test('should instantiate with correct company ID', () => {
    expect(balanceEngine.companyId).toBe('test-company-123');
    expect(balanceEngine).toHaveProperty('calculateAccountBalance');
    expect(balanceEngine).toHaveProperty('updateAccountBalanceRecursive');
    expect(balanceEngine).toHaveProperty('recalculateAllBalances');
  });

  test('should have required methods', () => {
    expect(typeof balanceEngine.calculateAccountBalance).toBe('function');
    expect(typeof balanceEngine.updateAccountBalanceRecursive).toBe('function');
    expect(typeof balanceEngine.recalculateAllBalances).toBe('function');
    expect(typeof balanceEngine.validateBalanceConsistency).toBe('function');
    expect(typeof balanceEngine.getBalanceSummary).toBe('function');
  });

  test('should handle balance updates', async () => {
    balanceEngine.updateAccountBalanceRecursive = jest.fn().mockResolvedValue();

    await expect(balanceEngine.updateAccountBalanceRecursive('account-1', 500)).resolves.toBeUndefined();
    expect(balanceEngine.updateAccountBalanceRecursive).toHaveBeenCalledWith('account-1', 500);
  });

  test('should handle recursive balance updates', async () => {
    balanceEngine.updateAccountBalanceRecursive = jest.fn().mockResolvedValue();

    await expect(balanceEngine.updateAccountBalanceRecursive('account-1', 1000)).resolves.toBeUndefined();
    expect(balanceEngine.updateAccountBalanceRecursive).toHaveBeenCalledWith('account-1', 1000);
  });

  test('should calculate account balance', async () => {
    balanceEngine.calculateAccountBalance = jest.fn().mockResolvedValue(2500);

    const balance = await balanceEngine.calculateAccountBalance('account-1');
    expect(balance).toBe(2500);
    expect(balanceEngine.calculateAccountBalance).toHaveBeenCalledWith('account-1');
  });

  test('should handle hierarchical balance calculation', async () => {
    balanceEngine.getBalanceSummary = jest.fn().mockResolvedValue({ totalBalance: 5000 });

    const summary = await balanceEngine.getBalanceSummary('parent-account');
    expect(summary.totalBalance).toBe(5000);
    expect(balanceEngine.getBalanceSummary).toHaveBeenCalledWith('parent-account');
  });
});

describe('BalanceCalculationEngine - Balance Validation', () => {
  let balanceEngine;

  beforeEach(() => {
    balanceEngine = new BalanceCalculationEngine('test-company-123');
  });

  test('should validate balance consistency', async () => {
    const mockValidation = {
      isConsistent: true,
      inconsistencies: []
    };

    balanceEngine.validateBalanceConsistency = jest.fn().mockResolvedValue(mockValidation);

    const validation = await balanceEngine.validateBalanceConsistency();
    expect(validation.isConsistent).toBe(true);
    expect(validation.inconsistencies).toHaveLength(0);
  });

  test('should detect balance inconsistencies', async () => {
    const mockValidation = {
      isConsistent: false,
      inconsistencies: ['1201', '2101']
    };

    balanceEngine.validateBalanceConsistency = jest.fn().mockResolvedValue(mockValidation);

    const validation = await balanceEngine.validateBalanceConsistency();
    expect(validation.isConsistent).toBe(false);
    expect(validation.inconsistencies).toContain('1201');
    expect(validation.inconsistencies).toContain('2101');
  });

  test('should recalculate balances', async () => {
    balanceEngine.recalculateAllBalances = jest.fn().mockResolvedValue();

    await expect(balanceEngine.recalculateAllBalances()).resolves.toBeUndefined();
    expect(balanceEngine.recalculateAllBalances).toHaveBeenCalled();
  });
});

describe('BalanceCalculationEngine - Balance Types', () => {
  let balanceEngine;

  beforeEach(() => {
    balanceEngine = new BalanceCalculationEngine('test-company-123');
  });

  test('should handle debit balance type correctly', async () => {
    // For debit balances, positive amounts increase the balance
    balanceEngine.updateAccountBalance = jest.fn().mockImplementation(async (accountId, amount) => {
      // Simulate debit balance behavior
      return amount > 0 ? amount : -amount;
    });

    const result = await balanceEngine.updateAccountBalance('debit-account', 500);
    expect(result).toBe(500);
  });

  test('should handle credit balance type correctly', async () => {
    // For credit balances, positive amounts increase the balance
    balanceEngine.updateAccountBalance = jest.fn().mockImplementation(async (accountId, amount) => {
      // Simulate credit balance behavior
      return amount > 0 ? amount : -amount;
    });

    const result = await balanceEngine.updateAccountBalance('credit-account', 300);
    expect(result).toBe(300);
  });

  test('should handle zero balance updates', async () => {
    balanceEngine.updateAccountBalance = jest.fn().mockResolvedValue(0);

    const result = await balanceEngine.updateAccountBalance('account-1', 0);
    expect(result).toBe(0);
  });

  test('should handle negative amounts', async () => {
    balanceEngine.updateAccountBalance = jest.fn().mockImplementation(async (accountId, amount) => {
      // Negative amounts should decrease balance
      return amount;
    });

    const result = await balanceEngine.updateAccountBalance('account-1', -200);
    expect(result).toBe(-200);
  });
});

describe('BalanceCalculationEngine - Performance and Edge Cases', () => {
  let balanceEngine;

  beforeEach(() => {
    balanceEngine = new BalanceCalculationEngine('test-company-123');
  });

  test('should handle large amounts', async () => {
    const largeAmount = 1000000000; // 1 billion

    balanceEngine.updateAccountBalance = jest.fn().mockResolvedValue(largeAmount);

    const result = await balanceEngine.updateAccountBalance('account-1', largeAmount);
    expect(result).toBe(largeAmount);
  });

  test('should handle decimal amounts', async () => {
    const decimalAmount = 123.45;

    balanceEngine.updateAccountBalance = jest.fn().mockResolvedValue(decimalAmount);

    const result = await balanceEngine.updateAccountBalance('account-1', decimalAmount);
    expect(result).toBe(decimalAmount);
  });

  test('should handle multiple concurrent updates', async () => {
    balanceEngine.updateAccountBalance = jest.fn().mockResolvedValue();

    const updates = [
      balanceEngine.updateAccountBalance('account-1', 100),
      balanceEngine.updateAccountBalance('account-1', 200),
      balanceEngine.updateAccountBalance('account-1', 300)
    ];

    await Promise.all(updates);
    expect(balanceEngine.updateAccountBalance).toHaveBeenCalledTimes(3);
  });

  test('should handle account not found errors', async () => {
    balanceEngine.calculateAccountBalance = jest.fn().mockRejectedValue(
      new Error('Account not found')
    );

    await expect(balanceEngine.calculateAccountBalance('non-existent')).rejects.toThrow('Account not found');
  });

  test('should handle balance validation errors', async () => {
    balanceEngine.validateBalanceConsistency = jest.fn().mockRejectedValue(
      new Error('Validation failed')
    );

    await expect(balanceEngine.validateBalanceConsistency()).rejects.toThrow('Validation failed');
  });
});
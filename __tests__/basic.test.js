// __tests__/basic.test.js
import { AccountingEngine } from '../src/utils/accountingEngine.js';
import { BalanceCalculationEngine } from '../src/utils/balanceCalculationEngine.js';

describe('Basic Import and Instantiation Tests', () => {
  test('should import AccountingEngine class', () => {
    expect(AccountingEngine).toBeDefined();
    expect(typeof AccountingEngine).toBe('function');
  });

  test('should import BalanceCalculationEngine class', () => {
    expect(BalanceCalculationEngine).toBeDefined();
    expect(typeof BalanceCalculationEngine).toBe('function');
  });

  test('should instantiate AccountingEngine', () => {
    const engine = new AccountingEngine('test-company');
    expect(engine).toBeDefined();
    expect(engine.companyId).toBe('test-company');
  });

  test('should instantiate BalanceCalculationEngine', () => {
    const engine = new BalanceCalculationEngine('test-company');
    expect(engine).toBeDefined();
    expect(engine.companyId).toBe('test-company');
  });
});
// __tests__/hierarchicalAccountManager.test.js
import { HierarchicalAccountManager } from '../src/utils/hierarchicalAccountManager.js';

// Mock Firebase at module level
jest.mock('../src/app/firebase.js', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection'),
  doc: jest.fn().mockReturnValue({
    id: 'mock-doc-id',
    path: 'mock-path'
  }),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({
    data: () => ({
      accountCode: 'TEST-001',
      accountName: 'Test Account',
      accountType: 'asset',
      level: 1
    }),
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
  where: jest.fn(() => 'mock-where'),
  orderBy: jest.fn(() => 'mock-orderby'),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
    fromDate: jest.fn((date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }))
  },
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
}));

describe('HierarchicalAccountManager', () => {
  let manager;
  const companyId = 'test-company-123';

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new HierarchicalAccountManager(companyId);
  });

  describe('createAccount (core method)', () => {
    test('should validate required fields', async () => {
      await expect(manager.createAccount({})).rejects.toThrow('Account code, name, and type are required');
    });

    test('should throw error for duplicate account code', async () => {
      const coreFields = {
        accountCode: 'TEST-001',
        accountName: 'Test Account',
        accountType: 'asset'
      };

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ accountCode: 'TEST-001' })
      });

      await expect(manager.createAccount(coreFields)).rejects.toThrow('Account code TEST-001 already exists');
    });
  });

  describe('getAccountByCode', () => {
    test('should return null for non-existent account', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const result = await manager.getAccountByCode('INVALID-CODE');

      expect(result).toBeNull();
    });
  });

  describe('getAllAccounts', () => {
    test('should return all accounts', async () => {
      const mockAccounts = [
        {
          data: () => ({
            accountCode: 'MAIN-ASSETS',
            accountName: 'Assets',
            accountType: 'asset'
          })
        }
      ];

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: mockAccounts
      });

      const result = await manager.getAllAccounts();

      expect(result).toHaveLength(1);
      expect(result[0].accountCode).toBe('MAIN-ASSETS');
    });
  });

  describe('validateAccountHierarchy', () => {
    test('should validate correct hierarchy', async () => {
      const mockAccounts = [
        {
          data: () => ({
            accountCode: 'MAIN-ASSETS',
            accountName: 'Assets',
            accountType: 'asset',
            level: 1,
            parentAccount: null
          })
        }
      ];

      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValue({
        docs: mockAccounts
      });

      const result = await manager.validateAccountHierarchy();

      expect(result.isValid).toBe(true);
      expect(result.issues.orphanedAccounts).toEqual([]);
    });
  });
});
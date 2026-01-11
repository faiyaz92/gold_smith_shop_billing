// jest.setup.js

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({}))
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(() => ({ id: 'mock-doc-id' })),
  getDoc: jest.fn(() => Promise.resolve({
    data: () => ({ currentBalance: 1000 }),
    exists: () => true,
    id: 'mock-doc-id'
  })),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [],
    size: 0,
    empty: true,
    forEach: (callback) => []
  })),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  deleteDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    fromDate: jest.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
  }
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

// Mock Firebase app
jest.mock('./src/app/firebase.js', () => ({
  db: {},
  auth: {}
}), { virtual: true });

// Global test utilities
global.testUtils = {
  // Helper to create mock Firestore document
  createMockDoc: (id, data) => ({
    id,
    data: () => data,
    exists: () => true,
    ref: { id }
  }),

  // Helper to create mock query snapshot
  createMockQuerySnapshot: (docs) => ({
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (callback) => docs.forEach(callback)
  }),

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Set up console spy to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
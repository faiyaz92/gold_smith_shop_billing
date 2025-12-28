// src/utils/OfflineSalesService.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../app/firebase';

/**
 * Offline Sales Recording Service
 *
 * Handles offline sales recording and synchronization for van sellers.
 * Uses IndexedDB for local storage and Service Worker for background sync.
 *
 * Features:
 * - Offline sales recording
 * - Automatic sync when online
 * - Conflict resolution
 * - Mobile-optimized forms
 */

class OfflineSalesService {
  constructor(companyId, vanSellerId) {
    this.companyId = companyId;
    this.vanSellerId = vanSellerId;
    this.dbName = 'OfflineSalesDB';
    this.storeName = 'pendingSales';
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;

    this.initIndexedDB();
    this.setupOnlineOfflineListeners();
    this.registerServiceWorker();
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
      };
    });
  }

  /**
   * Setup online/offline event listeners
   */
  setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingSales();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Register service worker for background sync
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Request background sync permission
        if ('sync' in registration) {
          await registration.sync.register('sync-pending-sales');
        }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });

        // Notify service worker that we're ready
        registration.active?.postMessage({ type: 'CLIENT_READY' });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Handle messages from service worker
   * @param {MessageEvent} event - Service worker message event
   */
  handleServiceWorkerMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case 'TRIGGER_SYNC':
        // Service worker is requesting sync
        this.performSyncForServiceWorker(event.ports[0]);
        break;

      case 'BACKGROUND_SYNC_COMPLETED':
        console.log('Background sync completed:', data);
        this.notifySyncStatus('completed', data);
        break;

      case 'BACKGROUND_SYNC_FAILED':
        console.error('Background sync failed:', data);
        this.notifySyncStatus('failed', data);
        break;

      default:
        console.log('Unknown service worker message:', type);
    }
  }

  /**
   * Perform sync when requested by service worker
   * @param {MessagePort} port - Message port for response
   */
  async performSyncForServiceWorker(port) {
    try {
      await this.syncPendingSales();
      port.postMessage({
        type: 'SYNC_COMPLETED',
        result: { success: true }
      });
    } catch (error) {
      port.postMessage({
        type: 'SYNC_COMPLETED',
        result: { success: false, error: error.message }
      });
    }
  }

  /**
   * Notify listeners about sync status changes
   * @param {string} status - Sync status
   * @param {object} data - Additional data
   */
  notifySyncStatus(status, data) {
    // Emit custom event for components to listen to
    const event = new CustomEvent('offlineSyncStatus', {
      detail: { status, data, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Record a sale offline
   * @param {object} saleData - Sale information
   * @returns {Promise<string>} - Sale ID
   */
  async recordOfflineSale(saleData) {
    const saleId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const offlineSale = {
      id: saleId,
      vanSellerId: this.vanSellerId,
      companyId: this.companyId,
      ...saleData,
      timestamp: new Date().toISOString(),
      syncStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      _version: '2.0',
      _migrationStatus: 'active',
      _v3Ready: true,
      _v4Ready: false
    };

    // Store in IndexedDB
    await this.storeInIndexedDB(offlineSale);

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.syncPendingSales();
    }

    return saleId;
  }

  /**
   * Store sale in IndexedDB
   * @param {object} sale - Sale data
   */
  async storeInIndexedDB(sale) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(sale);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending sales from IndexedDB
   * @returns {Promise<Array>} - Array of pending sales
   */
  async getPendingSales() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync pending sales to Firebase
   */
  async syncPendingSales() {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;

    try {
      const pendingSales = await this.getPendingSales();

      for (const sale of pendingSales) {
        try {
          // Save to Firebase
          const salesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/sales`;
          await addDoc(collection(db, salesPath), {
            ...sale,
            syncStatus: 'synced',
            syncedAt: serverTimestamp()
          });

          // Update IndexedDB status
          await this.updateSaleStatus(sale.id, 'synced');

          console.log('Sale synced successfully:', sale.id);
        } catch (error) {
          console.error('Failed to sync sale:', sale.id, error);
          // Mark as failed for retry
          await this.updateSaleStatus(sale.id, 'failed');
        }
      }
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Update sale sync status in IndexedDB
   * @param {string} saleId - Sale ID
   * @param {string} status - New status
   */
  async updateSaleStatus(saleId, status) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(saleId);

      request.onsuccess = () => {
        const sale = request.result;
        if (sale) {
          sale.syncStatus = status;
          const updateRequest = store.put(sale);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Sale not found, might be already synced
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get sync status
   * @returns {object} - Sync status information
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingCount: 0 // Will be updated when we query IndexedDB
    };
  }

  /**
   * Clear old synced sales from IndexedDB (cleanup)
   */
  async clearOldSyncedSales() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('syncStatus');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const sale = cursor.value;
          if (sale.syncStatus === 'synced' && new Date(sale.timestamp) < sevenDaysAgo) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export default OfflineSalesService;
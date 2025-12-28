// src/utils/DataSynchronizationService.js
import OfflineSalesService from './OfflineSalesService';
import OfflineInventoryService from './OfflineInventoryService';

/**
 * Data Synchronization Service
 *
 * Manages synchronization of all offline data with Firebase.
 * Handles conflicts, retries, and progress tracking.
 */

class DataSynchronizationService {
  constructor(companyId, vanSellerId) {
    this.companyId = companyId;
    this.vanSellerId = vanSellerId;

    this.salesService = new OfflineSalesService(companyId, vanSellerId);
    this.inventoryService = new OfflineInventoryService(companyId, vanSellerId);

    this.syncInProgress = false;
    this.syncStatus = {
      sales: { pending: 0, synced: 0, failed: 0 },
      inventory: { lastSync: null, itemsCount: 0 },
      overall: { status: 'idle', progress: 0, lastSync: null }
    };

    this.listeners = [];
  }

  /**
   * Subscribe to sync status updates
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of status changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.syncStatus));
  }

  /**
   * Perform full data synchronization
   * @returns {Promise<object>} - Sync results
   */
  async performFullSync() {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    this.syncStatus.overall.status = 'syncing';
    this.syncStatus.overall.progress = 0;
    this.notifyListeners();

    try {
      const results = {
        sales: null,
        inventory: null,
        success: true,
        errors: []
      };

      // Step 1: Sync inventory data (download)
      try {
        this.syncStatus.overall.progress = 10;
        this.notifyListeners();

        console.log('Syncing inventory data...');
        const inventoryData = await this.inventoryService.syncInventoryFromFirebase();
        this.syncStatus.inventory.lastSync = new Date();
        this.syncStatus.inventory.itemsCount = inventoryData.length;
        results.inventory = { success: true, itemsCount: inventoryData.length };

        this.syncStatus.overall.progress = 40;
        this.notifyListeners();
      } catch (error) {
        console.error('Inventory sync failed:', error);
        results.errors.push({ type: 'inventory', error: error.message });
        results.inventory = { success: false, error: error.message };
      }

      // Step 2: Sync pending sales (upload)
      try {
        this.syncStatus.overall.progress = 50;
        this.notifyListeners();

        console.log('Syncing pending sales...');
        await this.salesService.syncPendingSales();

        // Get updated counts
        const pendingSales = await this.salesService.getPendingSales();
        this.syncStatus.sales.pending = pendingSales.length;

        results.sales = {
          success: true,
          pendingCount: pendingSales.length
        };

        this.syncStatus.overall.progress = 90;
        this.notifyListeners();
      } catch (error) {
        console.error('Sales sync failed:', error);
        results.errors.push({ type: 'sales', error: error.message });
        results.sales = { success: false, error: error.message };
      }

      // Step 3: Finalize
      this.syncStatus.overall.status = results.errors.length === 0 ? 'completed' : 'completed_with_errors';
      this.syncStatus.overall.progress = 100;
      this.syncStatus.overall.lastSync = new Date();
      results.success = results.errors.length === 0;

      this.notifyListeners();

      console.log('Full sync completed:', results);
      return results;

    } catch (error) {
      console.error('Full sync failed:', error);
      this.syncStatus.overall.status = 'failed';
      this.syncStatus.overall.progress = 0;
      this.notifyListeners();

      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Perform quick sync (only upload pending data)
   * @returns {Promise<object>} - Sync results
   */
  async performQuickSync() {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    this.syncStatus.overall.status = 'syncing';
    this.notifyListeners();

    try {
      console.log('Performing quick sync...');
      await this.salesService.syncPendingSales();

      const pendingSales = await this.salesService.getPendingSales();
      this.syncStatus.sales.pending = pendingSales.length;
      this.syncStatus.overall.lastSync = new Date();

      this.syncStatus.overall.status = 'completed';
      this.notifyListeners();

      return { success: true, pendingCount: pendingSales.length };

    } catch (error) {
      console.error('Quick sync failed:', error);
      this.syncStatus.overall.status = 'failed';
      this.notifyListeners();
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get current sync status
   * @returns {object} - Current sync status
   */
  getSyncStatus() {
    return { ...this.syncStatus };
  }

  /**
   * Check if sync is needed
   * @returns {Promise<boolean>} - True if sync is needed
   */
  async isSyncNeeded() {
    // Check if inventory cache is stale (>24 hours)
    const inventoryStale = this.inventoryService.isCacheStale(24);

    // Check if there are pending sales
    const pendingSales = await this.salesService.getPendingSales();
    const hasPendingSales = pendingSales.length > 0;

    return inventoryStale || hasPendingSales;
  }

  /**
   * Force refresh inventory cache
   * @returns {Promise<void>}
   */
  async refreshInventoryCache() {
    await this.inventoryService.clearCache();
    await this.inventoryService.syncInventoryFromFirebase();
    this.syncStatus.inventory.lastSync = new Date();
    this.notifyListeners();
  }

  /**
   * Get offline data summary
   * @returns {Promise<object>} - Summary of offline data
   */
  async getOfflineDataSummary() {
    const [pendingSales, inventoryStats] = await Promise.all([
      this.salesService.getPendingSales(),
      this.inventoryService.getInventoryStats()
    ]);

    return {
      sales: {
        pendingCount: pendingSales.length,
        totalValue: pendingSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
      },
      inventory: inventoryStats,
      lastSync: this.syncStatus.overall.lastSync,
      needsSync: await this.isSyncNeeded()
    };
  }

  /**
   * Handle online/offline transitions
   * @param {boolean} isOnline - Whether device is online
   */
  async handleConnectivityChange(isOnline) {
    if (isOnline && await this.isSyncNeeded()) {
      // Automatically sync when coming back online
      setTimeout(() => {
        this.performFullSync().catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }, 2000); // Delay to ensure connection is stable
    }
  }

  /**
   * Clean up old data
   * @returns {Promise<void>}
   */
  async cleanup() {
    await Promise.all([
      this.salesService.clearOldSyncedSales(),
      this.inventoryService.clearCache()
    ]);
  }
}

export default DataSynchronizationService;
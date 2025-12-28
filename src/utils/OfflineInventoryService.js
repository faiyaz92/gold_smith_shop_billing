// src/utils/OfflineInventoryService.js
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../app/firebase';

/**
 * Offline Inventory Tracking Service
 *
 * Caches inventory data locally for offline access by van sellers.
 * Syncs with Firebase when online.
 */

class OfflineInventoryService {
  constructor(companyId, vanSellerId) {
    this.companyId = companyId;
    this.vanSellerId = vanSellerId;
    this.dbName = 'OfflineInventoryDB';
    this.storeName = 'cachedInventory';
    this.lastSync = null;

    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for inventory caching
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
          const store = db.createObjectStore(this.storeName, { keyPath: 'productId' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
      };
    });
  }

  /**
   * Sync inventory data from Firebase to local cache
   */
  async syncInventoryFromFirebase() {
    try {
      console.log('Syncing inventory from Firebase...');

      // Get all products and their inventory
      const productsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/products`;
      const inventoryPath = `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/inventory`;

      // Fetch products
      const productsQuery = query(collection(db, productsPath));
      const productsSnapshot = await getDocs(productsQuery);

      // Fetch inventory
      const inventoryQuery = query(collection(db, inventoryPath));
      const inventorySnapshot = await getDocs(inventoryQuery);

      // Create inventory map for quick lookup
      const inventoryMap = {};
      inventorySnapshot.docs.forEach(doc => {
        const data = doc.data();
        inventoryMap[data.productId] = data;
      });

      // Combine product and inventory data
      const inventoryData = productsSnapshot.docs.map(doc => {
        const productData = doc.data();
        const inventoryData = inventoryMap[doc.id] || {};

        return {
          productId: doc.id,
          productName: productData.name || '',
          category: productData.category || '',
          subcategory: productData.subcategory || '',
          sellingPrice: productData.sellingPrice || 0,
          purchasePrice: productData.purchasePrice || 0,
          discountPercentage: productData.discountPercentage || 0,
          stockQuantity: inventoryData.stockQuantity || 0,
          reorderPoint: inventoryData.reorderPoint || 0,
          location: inventoryData.location || 'Main Warehouse',
          lastUpdated: new Date().toISOString(),
          cachedAt: new Date().toISOString()
        };
      });

      // Store in IndexedDB
      await this.storeInventoryInCache(inventoryData);

      this.lastSync = new Date();
      console.log(`Synced ${inventoryData.length} inventory items`);

      return inventoryData;

    } catch (error) {
      console.error('Failed to sync inventory:', error);
      throw error;
    }
  }

  /**
   * Store inventory data in IndexedDB
   * @param {Array} inventoryData - Array of inventory items
   */
  async storeInventoryInCache(inventoryData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Clear existing data
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Add new data
        let completed = 0;
        const total = inventoryData.length;

        if (total === 0) {
          resolve();
          return;
        }

        inventoryData.forEach(item => {
          const request = store.add(item);
          request.onsuccess = () => {
            completed++;
            if (completed === total) {
              resolve();
            }
          };
          request.onerror = () => {
            console.error('Failed to store inventory item:', item.productId);
            completed++;
            if (completed === total) {
              resolve(); // Continue even if some items fail
            }
          };
        });
      };

      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  /**
   * Get cached inventory data
   * @param {object} filters - Optional filters
   * @returns {Promise<Array>} - Array of inventory items
   */
  async getCachedInventory(filters = {}) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result;

        // Apply filters
        if (filters.category) {
          results = results.filter(item =>
            item.category.toLowerCase().includes(filters.category.toLowerCase())
          );
        }

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          results = results.filter(item =>
            item.productName.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
          );
        }

        if (filters.inStock !== undefined) {
          results = results.filter(item =>
            filters.inStock ? item.stockQuantity > 0 : item.stockQuantity <= 0
          );
        }

        // Sort by product name
        results.sort((a, b) => a.productName.localeCompare(b.productName));

        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get inventory item by product ID
   * @param {string} productId - Product ID
   * @returns {Promise<object|null>} - Inventory item or null
   */
  async getCachedInventoryItem(productId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(productId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update stock quantity (for offline sales)
   * @param {string} productId - Product ID
   * @param {number} quantitySold - Quantity sold
   */
  async updateStockLocally(productId, quantitySold) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(productId);

      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.stockQuantity = Math.max(0, item.stockQuantity - quantitySold);
          item.lastUpdated = new Date().toISOString();

          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve(item);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get inventory statistics
   * @returns {Promise<object>} - Statistics object
   */
  async getInventoryStats() {
    const inventory = await this.getCachedInventory();

    const stats = {
      totalItems: inventory.length,
      inStock: inventory.filter(item => item.stockQuantity > 0).length,
      outOfStock: inventory.filter(item => item.stockQuantity <= 0).length,
      lowStock: inventory.filter(item => item.stockQuantity > 0 && item.stockQuantity <= item.reorderPoint).length,
      totalValue: inventory.reduce((sum, item) => sum + (item.stockQuantity * item.purchasePrice), 0),
      lastSync: this.lastSync
    };

    return stats;
  }

  /**
   * Check if cache is stale (older than specified hours)
   * @param {number} maxAgeHours - Maximum age in hours
   * @returns {boolean} - True if cache is stale
   */
  isCacheStale(maxAgeHours = 24) {
    if (!this.lastSync) return true;

    const hoursSinceSync = (new Date() - this.lastSync) / (1000 * 60 * 60);
    return hoursSinceSync > maxAgeHours;
  }

  /**
   * Clear all cached inventory data
   */
  async clearCache() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        this.lastSync = null;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export default OfflineInventoryService;
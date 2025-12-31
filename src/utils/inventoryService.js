// src/utils/inventoryService.js
import { db } from '@/app/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

/**
 * Inventory Management Service for Gold Smith
 * Handles inventory tracking for precious metals and jewelry
 */
export class InventoryService {
  constructor(companyId) {
    this.companyId = companyId;
  }

  /**
   * Get inventory path for a product
   * @param {string} productId - Product ID
   * @returns {string} - Firestore path
   */
  getInventoryItemPath(productId) {
    return `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/inventory/${productId}`;
  }

  /**
   * Get inventory collection path
   * @returns {string} - Firestore path
   */
  getInventoryPath() {
    return `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/inventory`;
  }

  /**
   * Add inventory for a specific product/metal
   * @param {object} inventoryData - Inventory data to add
   * @param {string} inventoryData.productId - Product ID
   * @param {number} inventoryData.quantity - Quantity to add (weight in grams)
   * @param {number} inventoryData.unitCost - Cost per unit
   * @param {string} inventoryData.metalType - Type of metal (gold, silver, platinum)
   * @param {number} inventoryData.purity - Purity percentage (24k = 100, 22k = 91.67, etc.)
   * @param {string} inventoryData.location - Storage location
   * @param {string} inventoryData.referenceType - Type of transaction (purchase, order_pickup, etc.)
   * @param {string} inventoryData.referenceId - Reference transaction ID
   * @param {string} inventoryData.supplierId - Supplier/manufacturer ID
   * @returns {object} - Update result
   */
  async addInventory(inventoryData) {
    const {
      productId,
      quantity,
      unitCost = 0,
      metalType = 'gold',
      purity = 100,
      location = 'Main Warehouse',
      referenceType = 'purchase',
      referenceId,
      supplierId
    } = inventoryData;

    try {
      const inventoryPath = this.getInventoryItemPath(productId);
      const inventoryRef = doc(db, inventoryPath);

      // Check if inventory record exists
      const inventoryDoc = await getDoc(inventoryRef);
      const currentData = inventoryDoc.exists() ? inventoryDoc.data() : {};

      const updateData = {
        productId,
        metalType,
        purity,
        location,
        lastUpdated: serverTimestamp(),
        updatedBy: 'system'
      };

      if (inventoryDoc.exists()) {
        // Update existing inventory
        updateData.stockQuantity = (currentData.stockQuantity || 0) + quantity;
        updateData.totalValue = ((currentData.stockQuantity || 0) * (currentData.averageCost || 0)) +
                               (quantity * unitCost);
        updateData.averageCost = updateData.totalValue / updateData.stockQuantity;

        await updateDoc(inventoryRef, updateData);
      } else {
        // Create new inventory record
        updateData.stockQuantity = quantity;
        updateData.totalValue = quantity * unitCost;
        updateData.averageCost = unitCost;
        updateData.reorderPoint = 100; // Default reorder point
        updateData.createdAt = serverTimestamp();

        await setDoc(inventoryRef, updateData);
      }

      // Record inventory movement for audit trail
      await this.recordInventoryMovement({
        productId,
        movementType: 'in',
        quantity,
        unitCost,
        referenceType,
        referenceId,
        supplierId,
        location,
        metalType,
        purity
      });

      console.log(`✅ Added ${quantity}g of ${metalType} to inventory for product ${productId}`);
      return { success: true, productId, addedQuantity: quantity };

    } catch (error) {
      console.error('❌ Error adding inventory:', error);
      throw error;
    }
  }

  /**
   * Record inventory movement for audit trail
   * @param {object} movementData - Movement data
   */
  async recordInventoryMovement(movementData) {
    try {
      const movementsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/inventoryMovements`;
      const movementRef = collection(db, movementsPath);

      const movementDoc = {
        ...movementData,
        timestamp: serverTimestamp(),
        recordedBy: 'system'
      };

      await addDoc(movementRef, movementDoc);
    } catch (error) {
      console.error('Error recording inventory movement:', error);
      // Don't throw - movement recording failure shouldn't stop inventory update
    }
  }

  /**
   * Add inventory when order is picked up from manufacturer
   * @param {string} orderId - Order ID
   * @returns {object} - Update result
   */
  async addInventoryFromOrderPickup(orderId) {
    try {
      const ordersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/orders`;
      const orderDoc = await getDoc(doc(db, ordersPath, orderId));

      if (!orderDoc.exists()) {
        throw new Error(`Order ${orderId} not found`);
      }

      const order = orderDoc.data();

      // Calculate pure metal weight based on karat/purity
      const weight = parseFloat(order.weight) || 0;
      const karat = parseInt(order.karat) || 24;
      const purityPercentage = karat === 24 ? 100 : karat === 22 ? 91.67 : karat === 18 ? 75 : 100;

      // Calculate pure metal weight
      const pureMetalWeight = weight * (purityPercentage / 100);

      // Calculate unit cost (metal cost per gram of pure metal)
      const metalCost = parseFloat(order.metalCost) || 0;
      const unitCost = pureMetalWeight > 0 ? metalCost / pureMetalWeight : 0;

      // Determine metal type from category or product
      const metalType = this.determineMetalType(order.categoryId, order.productName);

      const inventoryData = {
        productId: orderId, // Use order ID as product ID for now
        quantity: pureMetalWeight,
        unitCost,
        metalType,
        purity: purityPercentage,
        location: 'Main Warehouse',
        referenceType: 'order_pickup',
        referenceId: orderId,
        supplierId: order.manufacturerId
      };

      return await this.addInventory(inventoryData);

    } catch (error) {
      console.error('Error adding inventory from order pickup:', error);
      throw error;
    }
  }

  /**
   * Add inventory from direct purchase (without customer order)
   * @param {object} purchaseData - Purchase data
   * @returns {object} - Update result
   */
  async addInventoryFromDirectPurchase(purchaseData) {
    const {
      purchaseId,
      metalType,
      weight,
      purity = 100,
      unitCost,
      supplierId,
      location = 'Main Warehouse'
    } = purchaseData;

    const inventoryData = {
      productId: purchaseId, // Use purchase ID as product ID
      quantity: weight,
      unitCost,
      metalType,
      purity,
      location,
      referenceType: 'direct_purchase',
      referenceId: purchaseId,
      supplierId
    };

    return await this.addInventory(inventoryData);
  }

  /**
   * Determine metal type from category or product name
   * @param {string} categoryId - Category ID
   * @param {string} productName - Product name
   * @returns {string} - Metal type
   */
  determineMetalType(categoryId, productName) {
    const name = (productName || '').toLowerCase();

    if (name.includes('gold') || categoryId?.includes('gold')) return 'gold';
    if (name.includes('silver') || categoryId?.includes('silver')) return 'silver';
    if (name.includes('platinum') || categoryId?.includes('platinum')) return 'platinum';
    if (name.includes('diamond') || categoryId?.includes('diamond')) return 'diamond';

    return 'gold'; // Default to gold for jewelry
  }

  /**
   * Get current inventory levels
   * @param {string} productId - Optional product ID filter
   * @returns {Array} - Inventory data
   */
  async getInventory(productId = null) {
    try {
      const inventoryPath = `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/inventory`;
      let inventoryQuery = collection(db, inventoryPath);

      if (productId) {
        inventoryQuery = query(inventoryQuery, where('productId', '==', productId));
      }

      const snapshot = await getDocs(inventoryQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Error getting inventory:', error);
      throw error;
    }
  }

  /**
   * Get inventory value summary
   * @returns {object} - Value summary
   */
  async getInventoryValueSummary() {
    try {
      const inventory = await this.getInventory();

      const summary = {
        totalItems: inventory.length,
        totalValue: 0,
        byMetalType: {}
      };

      inventory.forEach(item => {
        const value = (item.stockQuantity || 0) * (item.averageCost || 0);
        summary.totalValue += value;

        const metalType = item.metalType || 'unknown';
        if (!summary.byMetalType[metalType]) {
          summary.byMetalType[metalType] = { quantity: 0, value: 0 };
        }

        summary.byMetalType[metalType].quantity += item.stockQuantity || 0;
        summary.byMetalType[metalType].value += value;
      });

      return summary;

    } catch (error) {
      console.error('Error getting inventory value summary:', error);
      throw error;
    }
  }
}
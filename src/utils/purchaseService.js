// src/utils/purchaseService.js
import { db } from '@/app/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { AccountingEngine } from '@/utils/accountingEngine';
import { InventoryService } from '@/utils/inventoryService';
import { recordCashPurchaseWithRollup, recordCreditPurchaseWithRollup } from '@/utils/accountingEngineUtils';

/**
 * Purchase Service for Gold Smith
 * Handles direct purchases from manufacturers/suppliers
 */
export class PurchaseService {
  constructor(companyId) {
    this.companyId = companyId;
    this.accountingEngine = new AccountingEngine(companyId);
    this.inventoryService = new InventoryService(companyId);
  }

  /**
   * Create a direct purchase (without customer order)
   * @param {object} purchaseData - Purchase data
   * @param {string} purchaseData.supplierId - Supplier ID
   * @param {string} purchaseData.metalType - Metal type (gold, silver, platinum)
   * @param {number} purchaseData.weight - Weight in grams
   * @param {number} purchaseData.purity - Purity percentage
   * @param {number} purchaseData.ratePerGram - Rate per gram
   * @param {string} purchaseData.paymentTerms - 'cash' or 'credit'
   * @param {string} purchaseData.location - Storage location
   * @param {string} purchaseData.notes - Additional notes
   * @returns {object} - Purchase result
   */
  async createDirectPurchase(purchaseData) {
    const {
      supplierId,
      metalType,
      weight,
      purity = 100,
      ratePerGram,
      paymentTerms = 'cash',
      location = 'Main Warehouse',
      notes = ''
    } = purchaseData;

    try {
      // Calculate amounts
      const subtotal = weight * ratePerGram;
      const gst = subtotal * 0.03; // 3% GST on metal purchases
      const totalAmount = subtotal + gst;

      // Create purchase record
      const purchaseDoc = {
        supplierId,
        metalType,
        weight,
        purity,
        ratePerGram,
        subtotal,
        gst,
        totalAmount,
        paymentTerms,
        location,
        notes,
        status: 'completed',
        purchaseType: 'direct_purchase',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save purchase record
      const purchasesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/purchases`;
      const purchaseRef = await addDoc(collection(db, purchasesPath), purchaseDoc);
      const purchaseId = purchaseRef.id;

      // Update purchase with ID
      await updateDoc(purchaseRef, { id: purchaseId });

      // Record accounting transaction
      if (paymentTerms === 'cash') {
        await recordCashPurchaseWithRollup(this.companyId, {
          purchaseId,
          totalAmount,
          supplierId
        });
      } else {
        await recordCreditPurchaseWithRollup(this.companyId, {
          purchaseId,
          totalAmount,
          supplierId
        });
      }

      // Add to inventory
      await this.inventoryService.addInventoryFromDirectPurchase({
        purchaseId,
        metalType,
        weight,
        purity,
        unitCost: ratePerGram,
        supplierId,
        location
      });

      console.log(`✅ Direct purchase created: ${purchaseId} - ${weight}g ${metalType} @ ₹${ratePerGram}/g`);

      return {
        success: true,
        purchaseId,
        totalAmount,
        inventoryAdded: weight
      };

    } catch (error) {
      console.error('❌ Error creating direct purchase:', error);
      throw error;
    }
  }

  /**
   * Get purchase history
   * @param {object} filters - Optional filters
   * @returns {Array} - Purchase records
   */
  async getPurchases(filters = {}) {
    try {
      const purchasesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${this.companyId}/purchases`;
      let purchasesQuery = collection(db, purchasesPath);

      // Apply filters if needed
      // For now, return all purchases

      const snapshot = await getDocs(purchasesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('Error getting purchases:', error);
      throw error;
    }
  }

  /**
   * Get purchase summary
   * @returns {object} - Summary data
   */
  async getPurchaseSummary() {
    try {
      const purchases = await this.getPurchases();

      const summary = {
        totalPurchases: purchases.length,
        totalValue: 0,
        totalWeight: 0,
        byMetalType: {},
        bySupplier: {}
      };

      purchases.forEach(purchase => {
        summary.totalValue += purchase.totalAmount || 0;
        summary.totalWeight += purchase.weight || 0;

        // Group by metal type
        const metalType = purchase.metalType || 'unknown';
        if (!summary.byMetalType[metalType]) {
          summary.byMetalType[metalType] = { count: 0, value: 0, weight: 0 };
        }
        summary.byMetalType[metalType].count++;
        summary.byMetalType[metalType].value += purchase.totalAmount || 0;
        summary.byMetalType[metalType].weight += purchase.weight || 0;

        // Group by supplier
        const supplierId = purchase.supplierId || 'unknown';
        if (!summary.bySupplier[supplierId]) {
          summary.bySupplier[supplierId] = { count: 0, value: 0 };
        }
        summary.bySupplier[supplierId].count++;
        summary.bySupplier[supplierId].value += purchase.totalAmount || 0;
      });

      return summary;

    } catch (error) {
      console.error('Error getting purchase summary:', error);
      throw error;
    }
  }
}
// src/utils/invoiceEngine.js
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, Timestamp, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../app/firebase';
import jsPDF from 'jspdf';

// Utility function to get firestore paths (non-hook version)
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    getInvoicesPath: () => `${tenantCompaniesPath}/${companyId}/invoices`,
    getInvoiceItemsPath: () => `${tenantCompaniesPath}/${companyId}/invoiceItems`,
    getCashMemosPath: () => `${tenantCompaniesPath}/${companyId}/cashMemos`,
    getCustomersPath: () => `${tenantCompaniesPath}/${companyId}/customers`,
    getAccountsPath: () => `${tenantCompaniesPath}/${companyId}/accounts`,
    getTransactionsPath: () => `${tenantCompaniesPath}/${companyId}/transactions`,
    getCompanyPath: () => `${tenantCompaniesPath}/${companyId}`
  };
};

export class InvoiceEngine {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
  }

  async generateInvoice(invoiceData) {
    try {
      console.log('🧾 Generating GST-compliant invoice...');

      const {
        customerId,
        customerName,
        customerAddress,
        customerPhone,
        customerEmail,
        items,
        paymentTerms = 'Due on Receipt',
        dueDate,
        notes,
        templateId = 'default'
      } = invoiceData;

      // Validate required fields
      if (!customerName || !items || items.length === 0) {
        throw new Error('Customer name and items are required');
      }

      // Calculate totals with GST
      const calculations = await this.calculateInvoiceTotals(items, invoiceData.customerState);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice document
      const invoiceDoc = {
        companyId: this.companyId,
        invoiceId: `INV-${Date.now()}`,
        invoiceNumber,
        customerId,
        customerName,
        customerAddress,
        customerPhone,
        customerEmail,
        invoiceDate: Timestamp.now(),
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        paymentTerms,
        ...calculations,
        paidAmount: 0,
        status: 'draft',
        notes,
        templateId,
        createdBy: 'system', // TODO: Get from auth context
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Migration-ready fields
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: false
      };

      // Save invoice
      const docRef = await addDoc(collection(db, this.paths.getInvoicesPath()), invoiceDoc);

      // Save invoice items
      await this.saveInvoiceItems(docRef.id, invoiceDoc.invoiceId, items);

      // Create accounting entries
      await this.recordInvoiceAccounting(invoiceDoc);

      // Generate PDF
      const pdfUrl = await this.generateInvoicePDF(invoiceDoc);

      // Update invoice with PDF URL
      await updateDoc(doc(db, this.paths.getInvoicesPath(), docRef.id), {
        pdfUrl,
        status: 'sent', // Mark as sent after PDF generation
        emailSent: false,
        updatedAt: Timestamp.now()
      });

      console.log(`✅ Invoice generated: ${invoiceNumber}`);

      return {
        success: true,
        invoiceId: docRef.id,
        invoiceNumber,
        pdfUrl,
        totalAmount: calculations.totalAmount
      };

    } catch (error) {
      console.error('❌ Invoice generation error:', error);
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  async generateInvoiceNumber(customPrefix = null) {
    try {
      // Get company settings for invoice numbering
      const companyDoc = await getDoc(doc(db, this.paths.getCompanyPath()));
      const settings = companyDoc.data()?.invoiceSettings || {};
      
      // Determine numbering format
      const format = settings.numberingFormat || 'YYYY-MM-DD-SEQ'; // Options: YYYY-MM-DD-SEQ, FYSEQ, MONTHSEQ
      const prefix = customPrefix || settings.invoicePrefix || 'INV';
      const startNumber = settings.startNumber || 1;
      
      let invoiceNumber;
      
      switch (format) {
        case 'FYSEQ': // Financial Year Sequential: INV-FY25-001
          invoiceNumber = await this.generateFiscalYearNumber(prefix, startNumber);
          break;
        case 'MONTHSEQ': // Monthly Sequential: INV-202412-001
          invoiceNumber = await this.generateMonthlyNumber(prefix, startNumber);
          break;
        case 'SIMPLE': // Simple Sequential: INV-001
          invoiceNumber = await this.generateSimpleNumber(prefix, startNumber);
          break;
        default: // Date-based: INV-20241222-001
          invoiceNumber = await this.generateDateBasedNumber(prefix);
      }
      
      console.log(`📧 Generated invoice number: ${invoiceNumber}`);
      return invoiceNumber;
      
    } catch (error) {
      console.error('❌ Invoice number generation failed:', error);
      // Fallback to simple timestamp-based number
      return `INV-${Date.now()}`;
    }
  }
  
  async generateDateBasedNumber(prefix) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const searchPrefix = `${prefix}-${dateStr}-`;

    const q = query(
      collection(db, this.paths.getInvoicesPath()),
      where('companyId', '==', this.companyId),
      where('invoiceNumber', '>=', searchPrefix),
      where('invoiceNumber', '<', searchPrefix + 'z'),
      orderBy('invoiceNumber', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    let maxSeq = 0;

    if (!querySnapshot.empty) {
      const lastInvoice = querySnapshot.docs[0].data().invoiceNumber;
      const seqPart = lastInvoice.split('-').pop();
      maxSeq = parseInt(seqPart) || 0;
    }

    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefix}-${dateStr}-${nextSeq}`;
  }
  
  async generateFiscalYearNumber(prefix, startNumber) {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const year = today.getFullYear();
    
    // Fiscal year starts April 1st
    const fiscalYear = month >= 4 ? year : year - 1;
    const fyShort = fiscalYear.toString().slice(-2);
    const fyPrefix = `${prefix}-FY${fyShort}-`;
    
    const q = query(
      collection(db, this.paths.getInvoicesPath()),
      where('companyId', '==', this.companyId),
      where('invoiceNumber', '>=', fyPrefix),
      where('invoiceNumber', '<', fyPrefix + 'z'),
      orderBy('invoiceNumber', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    let maxSeq = startNumber - 1;

    if (!querySnapshot.empty) {
      const lastInvoice = querySnapshot.docs[0].data().invoiceNumber;
      const seqPart = lastInvoice.split('-').pop();
      maxSeq = parseInt(seqPart) || startNumber - 1;
    }

    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${fyPrefix}${nextSeq}`;
  }
  
  async generateMonthlyNumber(prefix, startNumber) {
    const today = new Date();
    const yearMonth = today.toISOString().slice(0, 7).replace('-', '');
    const monthPrefix = `${prefix}-${yearMonth}-`;
    
    const q = query(
      collection(db, this.paths.getInvoicesPath()),
      where('companyId', '==', this.companyId),
      where('invoiceNumber', '>=', monthPrefix),
      where('invoiceNumber', '<', monthPrefix + 'z'),
      orderBy('invoiceNumber', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    let maxSeq = startNumber - 1;

    if (!querySnapshot.empty) {
      const lastInvoice = querySnapshot.docs[0].data().invoiceNumber;
      const seqPart = lastInvoice.split('-').pop();
      maxSeq = parseInt(seqPart) || startNumber - 1;
    }

    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${monthPrefix}${nextSeq}`;
  }
  
  async generateSimpleNumber(prefix, startNumber) {
    const q = query(
      collection(db, this.paths.getInvoicesPath()),
      where('companyId', '==', this.companyId),
      where('invoiceNumber', '>=', `${prefix}-`),
      where('invoiceNumber', '<', `${prefix}.`),
      orderBy('invoiceNumber', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    let maxSeq = startNumber - 1;

    if (!querySnapshot.empty) {
      const lastInvoice = querySnapshot.docs[0].data().invoiceNumber;
      const seqPart = lastInvoice.split('-').pop();
      maxSeq = parseInt(seqPart) || startNumber - 1;
    }

    const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
    return `${prefix}-${nextSeq}`;
  }

  /**
   * Calculate invoice totals with GST breakdown
   * @param {array} items - Invoice items
   * @param {string} customerState - Customer state (optional)
   * @returns {object} - Calculation results with GST breakdown
   */
  async calculateInvoiceTotals(items, customerState = null) {
    try {
      let subtotal = 0;
      let totalGstAmount = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      // Get GST configuration from company settings
      const gstConfig = await this.getGSTConfiguration();

      // Determine GST type based on states
      const companyState = gstConfig.state || 'Default';
      const isIntraState = customerState && companyState === customerState;

      // GST rates
      const gstRate = gstConfig.rate || 18;
      const halfRate = gstRate / 2; // For CGST/SGST split

      for (const item of items) {
        const itemTotal = item.quantity * item.unitPrice;
        const discountAmount = itemTotal * (item.discountPercentage || 0) / 100;
        const taxableAmount = itemTotal - discountAmount;

        let itemGstAmount = 0;
        let itemCgstAmount = 0;
        let itemSgstAmount = 0;
        let itemIgstAmount = 0;

        if (isIntraState) {
          // Intra-state: CGST + SGST
          itemCgstAmount = taxableAmount * (halfRate / 100);
          itemSgstAmount = taxableAmount * (halfRate / 100);
          itemGstAmount = itemCgstAmount + itemSgstAmount;
          cgstAmount += itemCgstAmount;
          sgstAmount += itemSgstAmount;
        } else {
          // Inter-state: IGST
          itemIgstAmount = taxableAmount * (gstRate / 100);
          itemGstAmount = itemIgstAmount;
          igstAmount += itemIgstAmount;
        }

        item.discountAmount = discountAmount;
        item.gstRate = gstRate;
        item.gstAmount = itemGstAmount;
        item.cgstAmount = itemCgstAmount;
        item.sgstAmount = itemSgstAmount;
        item.igstAmount = itemIgstAmount;
        item.lineTotal = taxableAmount + itemGstAmount;

        subtotal += taxableAmount;
        totalGstAmount += itemGstAmount;
      }

      const totalAmount = subtotal + totalGstAmount;

      return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        gstRate,
        gstAmount: parseFloat(totalGstAmount.toFixed(2)),
        cgstAmount: parseFloat(cgstAmount.toFixed(2)),
        sgstAmount: parseFloat(sgstAmount.toFixed(2)),
        igstAmount: parseFloat(igstAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        gstType: isIntraState ? 'intra-state' : 'inter-state'
      };

    } catch (error) {
      console.error('❌ GST calculation error:', error);
      throw new Error(`GST calculation failed: ${error.message}`);
    }
  }

  /**
   * Get GST configuration from company settings
   * @returns {object} - GST configuration {rate, state, gstNumber}
   */
  async getGSTConfiguration() {
    try {
      const companyDoc = await getDoc(doc(db, this.paths.getCompanyPath()));
      const data = companyDoc.data() || {};

      return {
        rate: data.gstRate || 18,
        state: data.state || 'Default',
        gstNumber: data.gstNumber || 'GST123456789'
      };
    } catch (error) {
      console.warn('Could not get GST configuration from settings, using defaults');
      return {
        rate: 18,
        state: 'Default',
        gstNumber: 'GST123456789'
      };
    }
  }

  /**
   * Get GST rate from company settings (legacy method for backward compatibility)
   * @returns {number} - GST rate percentage
   */
  async getGSTRate() {
    const config = await this.getGSTConfiguration();
    return config.rate;
  }

  /**
   * Save invoice items to separate collection
   * @param {string} docId - Invoice document ID
   * @param {string} invoiceId - Invoice ID
   * @param {array} items - Invoice items
   */
  async saveInvoiceItems(docId, invoiceId, items) {
    try {
      const batch = [];

      for (const item of items) {
        const itemDoc = {
          invoiceId,
          companyId: this.companyId,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercentage: item.discountPercentage || 0,
          discountAmount: item.discountAmount || 0,
          gstRate: item.gstRate,
          gstAmount: item.gstAmount,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,
          igstAmount: item.igstAmount || 0,
          lineTotal: item.lineTotal,
          // Migration-ready fields
          _version: "2.0",
          _migrationStatus: "active",
          _v3Ready: true,
          _v4Ready: false,
          _shardKey: `${this.companyId}_shard1`,
          _partitionKey: this.companyId,
          _region: "asia-south1",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        batch.push(addDoc(collection(db, this.paths.getInvoiceItemsPath()), itemDoc));
      }

      await Promise.all(batch);
      console.log(`✅ Saved ${items.length} invoice items`);

    } catch (error) {
      console.error('❌ Failed to save invoice items:', error);
      throw error;
    }
  }

  /**
   * Add a new item to an existing invoice
   * @param {string} invoiceId - Invoice ID
   * @param {object} item - Item to add
   * @param {string} customerState - Customer state for GST calculation
   * @returns {object} - Updated invoice totals
   */
  async addInvoiceItem(invoiceId, item, customerState = null) {
    try {
      console.log('📝 Adding item to invoice:', invoiceId);

      // Validate item
      this.validateInvoiceItem(item);

      // Get current invoice
      const invoiceRef = doc(db, this.paths.getInvoicesPath(), invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);
      
      if (!invoiceDoc.exists()) {
        throw new Error('Invoice not found');
      }

      // Get current items
      const currentItems = await this.getInvoiceItems(invoiceId);
      
      // Add new item to items array
      currentItems.push(item);

      // Recalculate totals
      const newTotals = await this.calculateInvoiceTotals(currentItems, customerState);

      // Save new item
      await this.saveInvoiceItems(invoiceId, invoiceId, [item]);

      // Update invoice totals
      await updateDoc(invoiceRef, {
        ...newTotals,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Item added successfully');
      return newTotals;

    } catch (error) {
      console.error('❌ Failed to add invoice item:', error);
      throw error;
    }
  }

  /**
   * Update an existing invoice item
   * @param {string} invoiceId - Invoice ID
   * @param {string} itemId - Item ID to update
   * @param {object} updates - Updates to apply
   * @param {string} customerState - Customer state for GST calculation
   * @returns {object} - Updated invoice totals
   */
  async updateInvoiceItem(invoiceId, itemId, updates, customerState = null) {
    try {
      console.log('✏️ Updating invoice item:', itemId);

      // Get item document
      const itemRef = doc(db, this.paths.getInvoiceItemsPath(), itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error('Invoice item not found');
      }

      // Validate updates
      if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
        this.validateInvoiceItem({...itemDoc.data(), ...updates});
      }

      // Update item
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      // Recalculate invoice totals
      const items = await this.getInvoiceItems(invoiceId);
      const newTotals = await this.calculateInvoiceTotals(items, customerState);

      // Update invoice totals
      const invoiceRef = doc(db, this.paths.getInvoicesPath(), invoiceId);
      await updateDoc(invoiceRef, {
        ...newTotals,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Item updated successfully');
      return newTotals;

    } catch (error) {
      console.error('❌ Failed to update invoice item:', error);
      throw error;
    }
  }

  /**
   * Remove an item from an invoice
   * @param {string} invoiceId - Invoice ID
   * @param {string} itemId - Item ID to remove
   * @param {string} customerState - Customer state for GST calculation
   * @returns {object} - Updated invoice totals
   */
  async removeInvoiceItem(invoiceId, itemId, customerState = null) {
    try {
      console.log('🗑️ Removing invoice item:', itemId);

      // Delete item document
      const itemRef = doc(db, this.paths.getInvoiceItemsPath(), itemId);
      await deleteDoc(itemRef);

      // Recalculate invoice totals
      const items = await this.getInvoiceItems(invoiceId);
      const newTotals = await this.calculateInvoiceTotals(items, customerState);

      // Update invoice totals
      const invoiceRef = doc(db, this.paths.getInvoicesPath(), invoiceId);
      await updateDoc(invoiceRef, {
        ...newTotals,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Item removed successfully');
      return newTotals;

    } catch (error) {
      console.error('❌ Failed to remove invoice item:', error);
      throw error;
    }
  }

  /**
   * Get all items for an invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Array} - Array of invoice items
   */
  async getInvoiceItems(invoiceId) {
    try {
      const q = query(
        collection(db, this.paths.getInvoiceItemsPath()),
        where('invoiceId', '==', invoiceId),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));

    } catch (error) {
      console.error('❌ Failed to get invoice items:', error);
      throw error;
    }
  }

  /**
   * Bulk update invoice items
   * @param {string} invoiceId - Invoice ID
   * @param {Array} items - Array of items with updates
   * @param {string} customerState - Customer state for GST calculation
   * @returns {object} - Updated invoice totals
   */
  async bulkUpdateInvoiceItems(invoiceId, items, customerState = null) {
    try {
      console.log('📦 Bulk updating invoice items');

      // Validate all items
      items.forEach(item => this.validateInvoiceItem(item));

      // Delete existing items
      const existingItems = await this.getInvoiceItems(invoiceId);
      const deletePromises = existingItems.map(item => 
        deleteDoc(doc(db, this.paths.getInvoiceItemsPath(), item.id))
      );
      await Promise.all(deletePromises);

      // Save new items
      await this.saveInvoiceItems(invoiceId, invoiceId, items);

      // Recalculate totals
      const newTotals = await this.calculateInvoiceTotals(items, customerState);

      // Update invoice totals
      const invoiceRef = doc(db, this.paths.getInvoicesPath(), invoiceId);
      await updateDoc(invoiceRef, {
        ...newTotals,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Bulk update completed');
      return newTotals;

    } catch (error) {
      console.error('❌ Failed to bulk update invoice items:', error);
      throw error;
    }
  }

  /**
   * Validate invoice item data
   * @param {object} item - Item to validate
   */
  validateInvoiceItem(item) {
    if (!item.description || item.description.trim() === '') {
      throw new Error('Item description is required');
    }

    if (!item.quantity || item.quantity <= 0) {
      throw new Error('Item quantity must be greater than 0');
    }

    if (!item.unitPrice || item.unitPrice < 0) {
      throw new Error('Item unit price must be 0 or greater');
    }

    if (item.discountPercentage && (item.discountPercentage < 0 || item.discountPercentage > 100)) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    return true;
  }

  /**
   * Calculate item totals with GST breakdown
   * @param {object} item - Invoice item
   * @param {object} gstConfig - GST configuration
   * @param {boolean} isIntraState - Is intra-state transaction
   * @returns {object} - Item with calculated totals
   */
  calculateItemTotals(item, gstConfig, isIntraState) {
    const itemTotal = item.quantity * item.unitPrice;
    const discountAmount = itemTotal * (item.discountPercentage || 0) / 100;
    const taxableAmount = itemTotal - discountAmount;

    const gstRate = gstConfig.rate || 18;
    const halfRate = gstRate / 2;

    let gstAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isIntraState) {
      cgstAmount = taxableAmount * (halfRate / 100);
      sgstAmount = taxableAmount * (halfRate / 100);
      gstAmount = cgstAmount + sgstAmount;
    } else {
      igstAmount = taxableAmount * (gstRate / 100);
      gstAmount = igstAmount;
    }

    return {
      ...item,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      gstRate,
      gstAmount: parseFloat(gstAmount.toFixed(2)),
      cgstAmount: parseFloat(cgstAmount.toFixed(2)),
      sgstAmount: parseFloat(sgstAmount.toFixed(2)),
      igstAmount: parseFloat(igstAmount.toFixed(2)),
      lineTotal: parseFloat((taxableAmount + gstAmount).toFixed(2))
    };
  }

  async recordInvoiceAccounting(invoiceData) {
    // Import AccountingEngine dynamically to avoid circular imports
    const { AccountingEngine } = await import('./accountingEngine');

    const accountingEngine = new AccountingEngine(invoiceData.companyId);

    // Debit: Accounts Receivable
    // Credit: Sales Revenue
    // Credit: GST Payable
    await accountingEngine.recordTransaction({
      description: `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.customerName}`,
      debitAccountId: 'MAIN-1003', // Accounts Receivable
      creditAccountId: 'MAIN-4001', // Sales Revenue
      amount: invoiceData.subtotal,
      referenceType: 'invoice',
      referenceId: invoiceData.invoiceId
    });

    if (invoiceData.gstAmount > 0) {
      await accountingEngine.recordTransaction({
        description: `GST on Invoice ${invoiceData.invoiceNumber}`,
        debitAccountId: 'MAIN-1003', // Accounts Receivable
        creditAccountId: 'MAIN-2002', // GST Payable
        amount: invoiceData.gstAmount,
        referenceType: 'invoice_gst',
        referenceId: invoiceData.invoiceId
      });
    }
  }

  /**
   * Generate PDF for invoice using jsPDF
   * @param {object} invoiceData - Invoice data
   * @returns {string} - PDF URL
   */
  async generateInvoicePDF(invoiceData) {
    try {
      console.log('📄 Generating invoice PDF...');

      // Create PDF document
      const pdf = new jsPDF();

      // Set font
      pdf.setFont('helvetica');

      // Company header
      pdf.setFontSize(20);
      pdf.text('INVOICE', 105, 20, { align: 'center' });

      // Company details
      pdf.setFontSize(12);
      pdf.text(await this.getCompanyName(), 20, 35);
      pdf.setFontSize(10);
      pdf.text('GST Number: ' + (await this.getGSTNumber()), 20, 42);

      // Invoice details
      pdf.setFontSize(12);
      pdf.text(`Invoice Number: ${invoiceData.invoiceNumber}`, 140, 35);
      pdf.text(`Date: ${invoiceData.invoiceDate.toDate().toLocaleDateString()}`, 140, 42);
      pdf.text(`Due Date: ${invoiceData.dueDate.toDate().toLocaleDateString()}`, 140, 49);

      // Customer details
      pdf.setFontSize(12);
      pdf.text('Bill To:', 20, 65);
      pdf.setFontSize(10);
      pdf.text(invoiceData.customerName, 20, 72);
      if (invoiceData.customerAddress) {
        pdf.text(invoiceData.customerAddress, 20, 79);
      }
      if (invoiceData.customerPhone) {
        pdf.text(`Phone: ${invoiceData.customerPhone}`, 20, 86);
      }

      // Items table header
      let yPos = 100;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description', 20, yPos);
      pdf.text('Qty', 120, yPos);
      pdf.text('Rate', 140, yPos);
      pdf.text('Amount', 170, yPos);

      // Items table content
      pdf.setFont('helvetica', 'normal');
      yPos += 10;

      for (const item of invoiceData.items || []) {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.text(item.description || '', 20, yPos);
        pdf.text(item.quantity?.toString() || '0', 120, yPos);
        pdf.text(`₹${item.unitPrice?.toFixed(2) || '0.00'}`, 140, yPos);
        pdf.text(`₹${item.lineTotal?.toFixed(2) || '0.00'}`, 170, yPos);
        yPos += 10;
      }

      // Totals
      yPos += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Subtotal: ₹${invoiceData.subtotal?.toFixed(2) || '0.00'}`, 140, yPos);
      yPos += 8;

      // GST breakdown based on type
      if (invoiceData.gstType === 'intra-state') {
        pdf.text(`CGST (${invoiceData.gstRate/2}%): ₹${invoiceData.cgstAmount?.toFixed(2) || '0.00'}`, 140, yPos);
        yPos += 8;
        pdf.text(`SGST (${invoiceData.gstRate/2}%): ₹${invoiceData.sgstAmount?.toFixed(2) || '0.00'}`, 140, yPos);
        yPos += 8;
      } else {
        pdf.text(`IGST (${invoiceData.gstRate}%): ₹${invoiceData.igstAmount?.toFixed(2) || '0.00'}`, 140, yPos);
        yPos += 8;
      }

      pdf.setFontSize(12);
      pdf.text(`Total: ₹${invoiceData.totalAmount?.toFixed(2) || '0.00'}`, 140, yPos);

      // Payment terms
      yPos += 20;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Payment Terms: ${invoiceData.paymentTerms}`, 20, yPos);

      // Footer
      yPos = 270;
      pdf.setFontSize(8);
      pdf.text('Thank you for your business!', 105, yPos, { align: 'center' });

      // Convert to blob and upload
      const pdfBlob = pdf.output('blob');
      const fileName = `invoice-${invoiceData.invoiceId}.pdf`;

      // Upload to Cloudinary and return URL
      const pdfUrl = await this.uploadToCloudinary(pdfBlob, fileName);

      console.log('✅ Invoice PDF generated');
      return pdfUrl;

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Get company name from settings
   * @returns {string} - Company name
   */
  async getCompanyName() {
    try {
      const companyDoc = await getDoc(doc(db, this.paths.getCompanyPath()));
      return companyDoc.data()?.name || 'Company Name';
    } catch (error) {
      return 'Company Name';
    }
  }

  /**
   * Get GST number from company settings
   * @returns {string} - GST number
   */
  async getGSTNumber() {
    try {
      const config = await this.getGSTConfiguration();
      return config.gstNumber;
    } catch (error) {
      return 'GST123456789';
    }
  }

  /**
   * Upload PDF to Cloudinary
   * @param {Blob} pdfBlob - PDF blob
   * @param {string} fileName - File name
   * @returns {string} - PDF URL
   */
  async uploadToCloudinary(pdfBlob, fileName) {
    try {
      // Import Cloudinary upload utility
      const { uploadToCloudinary } = await import('../app/cloudinary.js');

      const result = await uploadToCloudinary(pdfBlob, {
        folder: `invoices/${this.companyId}`,
        public_id: fileName.replace('.pdf', ''),
        resource_type: 'raw'
      });

      return result.secure_url;
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      // Return placeholder URL if upload fails
      return `https://placeholder.com/${fileName}`;
    }
  }

  async updateInvoiceStatus(invoiceId, paymentAmount) {
    const invoiceRef = doc(db, `${this.paths.getInvoicesPath()}/${invoiceId}`);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      throw new Error('Invoice not found');
    }

    const invoiceData = invoiceSnap.data();
    const newPaidAmount = invoiceData.paidAmount + paymentAmount;
    const newStatus = newPaidAmount >= invoiceData.totalAmount ? 'paid' :
                     newPaidAmount > 0 ? 'partial' : 'unpaid';

    await updateDoc(invoiceRef, {
      paidAmount: parseFloat(newPaidAmount.toFixed(2)),
      status: newStatus,
      updatedAt: Timestamp.now()
    });

    return { newStatus, newPaidAmount };
  }

  async getInvoice(invoiceId) {
    const invoiceRef = doc(db, `${this.paths.getInvoicesPath()}/${invoiceId}`);
    const invoiceSnap = await getDoc(invoiceRef);

    if (!invoiceSnap.exists()) {
      return null;
    }

    return { id: invoiceSnap.id, ...invoiceSnap.data() };
  }

  async getInvoicesByCustomer(customerId, limit = 50) {
    const q = query(
      collection(db, this.paths.getInvoicesPath()),
      where('companyId', '==', this.companyId),
      where('customerId', '==', customerId),
      orderBy('date', 'desc'),
      limit(limit)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getOutstandingInvoices() {
    const q = query(
      collection(db, this.paths.getInvoicesPath()),
      where('companyId', '==', this.companyId),
      where('status', 'in', ['unpaid', 'partial'])
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
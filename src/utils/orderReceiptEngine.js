// src/utils/orderReceiptEngine.js
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, Timestamp, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../app/firebase';
import jsPDF from 'jspdf';

// Utility function to get firestore paths (non-hook version)
const getFirestorePaths = (companyId) => {
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;

  return {
    getOrdersPath: () => `${tenantCompaniesPath}/${companyId}/orders`,
    getCustomersPath: () => `${tenantCompaniesPath}/${companyId}/customers`,
    getManufacturersPath: () => `${tenantCompaniesPath}/${companyId}/manufacturers`,
    getCategoriesPath: () => `${tenantCompaniesPath}/${companyId}/categories`,
    getCompanyPath: () => `${tenantCompaniesPath}/${companyId}`
  };
};

export class OrderReceiptEngine {
  constructor(companyId) {
    this.companyId = companyId;
    this.paths = getFirestorePaths(companyId);
  }

  /**
   * Generate PDF receipt for order confirmation
   * @param {Object} orderData - Order data
   * @returns {string} - PDF URL
   */
  async generateOrderReceiptPDF(orderData) {
    try {
      console.log('📄 Generating order confirmation receipt...');

      const pdf = new jsPDF();

      // Set font
      pdf.setFont('helvetica');

      // Header
      pdf.setFontSize(20);
      pdf.text('ORDER CONFIRMATION RECEIPT', 105, 20, { align: 'center' });

      // Company info (placeholder - should be fetched from company settings)
      pdf.setFontSize(12);
      pdf.text('Gold Smith Wholesaler', 20, 35);
      pdf.setFontSize(10);
      pdf.text('Address: [Company Address]', 20, 42);
      pdf.text('Phone: [Company Phone]', 20, 48);
      pdf.text('Email: [Company Email]', 20, 54);

      // Receipt details
      pdf.setFontSize(12);
      pdf.text(`Receipt No: ${orderData.id || 'Pending'}`, 140, 35);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 140, 42);
      pdf.text(`Time: ${new Date().toLocaleTimeString()}`, 140, 48);

      // Customer details
      pdf.setFontSize(14);
      pdf.text('Customer Details:', 20, 70);
      pdf.setFontSize(10);
      pdf.text(`Name: ${orderData.customerName || 'N/A'}`, 20, 80);
      pdf.text(`Phone: ${orderData.customerPhone || 'N/A'}`, 20, 86);
      pdf.text(`Email: ${orderData.customerEmail || 'N/A'}`, 20, 92);

      // Order details
      pdf.setFontSize(14);
      pdf.text('Order Details:', 20, 110);
      pdf.setFontSize(10);

      let yPos = 120;
      pdf.text(`Product: ${orderData.productName || 'Custom Jewelry'}`, 20, yPos);
      yPos += 6;
      pdf.text(`Category: ${orderData.categoryName || 'N/A'}`, 20, yPos);
      yPos += 6;
      pdf.text(`Karat: ${orderData.karat || '22k'}`, 20, yPos);
      yPos += 6;
      pdf.text(`Weight: ${orderData.weight || 0} grams`, 20, yPos);
      yPos += 6;
      pdf.text(`Making Charge: ₹${orderData.makingChargePerGram || 0}/gram`, 20, yPos);
      yPos += 6;

      // Pricing breakdown
      yPos += 10;
      pdf.setFontSize(12);
      pdf.text('Pricing Breakdown:', 20, yPos);
      pdf.setFontSize(10);
      yPos += 8;

      pdf.text(`Metal Cost: ₹${(orderData.metalCost || 0).toFixed(2)}`, 20, yPos);
      yPos += 6;
      pdf.text(`Making Charge: ₹${(orderData.makingChargeTotal || 0).toFixed(2)}`, 20, yPos);
      yPos += 6;
      pdf.text(`Subtotal: ₹${(orderData.subtotal || 0).toFixed(2)}`, 20, yPos);
      yPos += 6;
      pdf.text(`GST (3%): ₹${(orderData.gst || 0).toFixed(2)}`, 20, yPos);
      yPos += 6;
      pdf.setFontSize(12);
      pdf.text(`Total Amount: ₹${(orderData.total || 0).toFixed(2)}`, 20, yPos);
      yPos += 10;

      // Manufacturer assignment
      pdf.setFontSize(10);
      pdf.text(`Assigned Manufacturer: ${orderData.manufacturerName || 'Not Assigned'}`, 20, yPos);
      yPos += 6;
      if (orderData.expectedDeliveryDate) {
        pdf.text(`Expected Delivery: ${new Date(orderData.expectedDeliveryDate).toLocaleDateString()}`, 20, yPos);
        yPos += 6;
      }

      // Notes
      if (orderData.notes) {
        yPos += 10;
        pdf.setFontSize(12);
        pdf.text('Notes:', 20, yPos);
        pdf.setFontSize(10);
        yPos += 8;
        const notesLines = pdf.splitTextToSize(orderData.notes, 170);
        pdf.text(notesLines, 20, yPos);
        yPos += notesLines.length * 5;
      }

      // Footer
      yPos += 20;
      pdf.setFontSize(10);
      pdf.text('This is an order confirmation receipt, not an invoice.', 20, yPos);
      yPos += 6;
      pdf.text('Payment will be collected upon delivery.', 20, yPos);
      yPos += 6;
      pdf.text('Thank you for your business!', 20, yPos);

      // Generate PDF blob and create URL
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      console.log('✅ Order confirmation receipt generated successfully');
      return pdfUrl;

    } catch (error) {
      console.error('❌ Error generating order receipt PDF:', error);
      throw error;
    }
  }

  /**
   * Generate and download order confirmation receipt
   * @param {Object} orderData - Order data
   */
  async downloadOrderReceipt(orderData) {
    try {
      const pdfUrl = await this.generateOrderReceiptPDF(orderData);

      // Create download link
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Order_Receipt_${orderData.id || 'New'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL object
      URL.revokeObjectURL(pdfUrl);

      console.log('📥 Order receipt downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading order receipt:', error);
      throw error;
    }
  }

  /**
   * Print order confirmation receipt
   * @param {Object} orderData - Order data
   */
  async printOrderReceipt(orderData) {
    try {
      const pdfUrl = await this.generateOrderReceiptPDF(orderData);

      // Open in new window for printing
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      console.log('🖨️ Order receipt sent to printer');
    } catch (error) {
      console.error('❌ Error printing order receipt:', error);
      throw error;
    }
  }
}
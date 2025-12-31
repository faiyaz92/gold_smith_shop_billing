// ✅ TASK 9.1: Invoice/Bill Generator (Pure Gold Based - BRD v2 Section 6.2)
// Pure gold billing system with bilingual support (English/Dari)

import jsPDF from 'jspdf';
import 'jspdf-autotable';

class InvoiceGenerator {
  constructor() {
    // Company Info - can be fetched from database in production
    this.companyInfo = {
      name: 'AHMAD GOLD',
      nameDari: 'احمد طلا',
      phone: '+93 123 456 789',
      address: 'Kabul, Afghanistan',
      addressDari: 'کابل، افغانستان'
    };
  }

  /**
   * Generate Invoice PDF
   * @param {Object} invoiceData - Invoice document data
   * @param {Object} orderData - Order details
   * @param {Object} customerData - Customer information
   * @param {number} goldPrice - Current gold price (USD/gram)
   * @returns {jsPDF} PDF document
   */
  generateInvoice(invoiceData, orderData, customerData, goldPrice) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Header Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 7;
    doc.setFontSize(16);
    doc.text(this.companyInfo.nameDari, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.companyInfo.address, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    doc.text(`Phone: ${this.companyInfo.phone}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    
    yPosition += 10;

    // Invoice Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE / BILL', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 7;
    doc.setFontSize(14);
    doc.text('فاکتوره / بل', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;

    // Invoice Number and Date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, 20, yPosition);
    const invoiceDate = invoiceData.invoiceDate?.toDate ? 
      invoiceData.invoiceDate.toDate().toLocaleDateString() : 
      new Date().toLocaleDateString();
    doc.text(`Date: ${invoiceDate}`, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Customer Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS:', 20, yPosition);
    doc.text('معلومات مشتری:', pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${customerData.customerName || customerData.name || 'N/A'}`, 25, yPosition);
    
    yPosition += 5;
    doc.text(`Code: ${customerData.accountCode || 'N/A'}`, 25, yPosition);
    
    yPosition += 5;
    doc.text(`Phone: ${customerData.phone || customerData.customerPhone || 'N/A'}`, 25, yPosition);
    
    yPosition += 5;
    if (customerData.address) {
      const addressLines = doc.splitTextToSize(`Address: ${customerData.address}`, pageWidth - 50);
      doc.text(addressLines, 25, yPosition);
      yPosition += (addressLines.length * 5);
    }
    
    yPosition += 5;
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Order Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER DETAILS:', 20, yPosition);
    doc.text('معلومات سفارش:', pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order No: ${orderData.id?.slice(-8) || 'N/A'}`, 25, yPosition);
    
    yPosition += 5;
    doc.text(`Product: ${orderData.productName || 'N/A'}`, 25, yPosition);
    
    yPosition += 5;
    doc.text(`Weight: ${orderData.weight}g (${orderData.karat})`, 25, yPosition);
    
    yPosition += 5;
    const orderDate = orderData.createdAt?.toDate ? 
      orderData.createdAt.toDate().toLocaleDateString() : 
      'N/A';
    doc.text(`Date Ordered: ${orderDate}`, 25, yPosition);
    
    yPosition += 8;
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Pure Gold Calculation Section (HIGHLIGHTED)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PURE GOLD CALCULATION (حساب تیزابی):', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Product Pure Gold
    doc.text(`Product Pure Gold (تیزابی جنس):`, 25, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoiceData.productPureGold.toFixed(3)}g`, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const purityPercentage = orderData.karat === '24k' ? 100 : 
      orderData.karat === '22k' ? 91.66 : 
      orderData.karat === '21k' ? 87.5 : 75;
    doc.text(`  (${orderData.weight}g × ${purityPercentage}% purity)`, 25, yPosition);
    
    yPosition += 8;
    doc.setFontSize(10);

    // Commission
    doc.text(`Commission (تیزابی اجره):`, 25, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoiceData.commissionGold.toFixed(3)}g`, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const commissionUSD = invoiceData.commissionGold * goldPrice;
    doc.text(`  (Making charge: $${commissionUSD.toFixed(2)} ÷ $${goldPrice.toFixed(2)}/g)`, 25, yPosition);
    
    yPosition += 8;
    doc.setFontSize(10);

    // Prior Balance
    const priorBalanceLabel = invoiceData.priorBalance >= 0 ? 
      'Prior Balance Owed (تیزابی گذشته):' : 
      'Prior Credit Balance (تیزابی کردیت):';
    doc.text(priorBalanceLabel, 25, yPosition);
    doc.setFont('helvetica', 'bold');
    const priorBalanceColor = invoiceData.priorBalance >= 0 ? [220, 38, 38] : [34, 197, 94];
    doc.setTextColor(...priorBalanceColor);
    const priorBalanceSign = invoiceData.priorBalance >= 0 ? '+' : '';
    doc.text(`${priorBalanceSign}${invoiceData.priorBalance.toFixed(3)}g`, pageWidth - 20, yPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const balanceNote = invoiceData.priorBalance >= 0 ? 
      '  (Customer owes from previous orders)' : 
      '  (Customer credit from previous payments)';
    doc.text(balanceNote, 25, yPosition);
    
    yPosition += 10;

    // Total Section (HIGHLIGHTED BOX)
    doc.setLineWidth(1);
    doc.setDrawColor(234, 179, 8); // Yellow border
    doc.setFillColor(255, 243, 205); // Light yellow background
    doc.rect(20, yPosition - 5, pageWidth - 40, 15, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PURE GOLD OWED (مجموعه تیزابی):', 25, yPosition);
    
    doc.setFontSize(14);
    doc.setTextColor(202, 138, 4); // Golden color
    doc.text(`${invoiceData.totalPureGold.toFixed(3)}g`, pageWidth - 25, yPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    yPosition += 12;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Reference Amount Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('REFERENCE AMOUNT (For Display Only):', 20, yPosition);
    
    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gold Price Today: $${goldPrice.toFixed(2)} per gram`, 25, yPosition);
    
    yPosition += 5;
    const equivalentUSD = invoiceData.totalPureGold * goldPrice;
    doc.text(`Equivalent Value: $${equivalentUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`, 25, yPosition);
    
    yPosition += 8;
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Payment Terms Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT TERMS:', 20, yPosition);
    
    yPosition += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Due: Pure Gold (24k equivalent)', 25, yPosition);
    
    yPosition += 5;
    doc.text(`Credit Period: ${invoiceData.creditDays || 15} days`, 25, yPosition);
    
    yPosition += 5;
    const dueDate = invoiceData.dueDate?.toDate ? 
      invoiceData.dueDate.toDate().toLocaleDateString() : 
      'N/A';
    doc.text(`Due Date: ${dueDate}`, 25, yPosition);
    
    yPosition += 10;
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Signature Section
    doc.text('Customer Signature: _______________', 25, yPosition);
    doc.text('Date: _________', pageWidth - 60, yPosition);
    
    yPosition += 10;
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Footer Notes
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('** All transactions in pure gold (24k equivalent) **', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 4;
    doc.text('** USD amount for reference only **', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    doc.setFontSize(7);
    doc.text(`Invoice ID: ${invoiceData.invoiceId || 'N/A'} | Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });

    return doc;
  }

  /**
   * Download Invoice as PDF
   */
  downloadInvoice(invoiceData, orderData, customerData, goldPrice) {
    const doc = this.generateInvoice(invoiceData, orderData, customerData, goldPrice);
    doc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
  }

  /**
   * Generate Invoice Blob (for preview or email)
   */
  generateInvoiceBlob(invoiceData, orderData, customerData, goldPrice) {
    const doc = this.generateInvoice(invoiceData, orderData, customerData, goldPrice);
    return doc.output('blob');
  }

  /**
   * Print Invoice
   */
  printInvoice(invoiceData, orderData, customerData, goldPrice) {
    const doc = this.generateInvoice(invoiceData, orderData, customerData, goldPrice);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
}

// Export singleton instance
const invoiceGenerator = new InvoiceGenerator();
export default invoiceGenerator;

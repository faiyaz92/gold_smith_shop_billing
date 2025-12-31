// ✅ TASK 10.2: Payment Receipt Generator (BRD v2 Section 6.3, 6.4)
// Bilingual payment receipt with pure gold tracking

import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PaymentReceiptGenerator {
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
   * Generate Payment Receipt PDF
   * @param {Object} paymentData - Payment document data
   * @param {Object} invoiceData - Invoice details
   * @param {Object} customerData - Customer information
   * @param {boolean} isFullPayment - True if invoice fully paid
   * @returns {jsPDF} PDF document
   */
  generateReceipt(paymentData, invoiceData, customerData, isFullPayment = false) {
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

    // Receipt Title (Full or Partial)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const receiptTitle = isFullPayment ? 'PAYMENT RECEIPT' : 'PARTIAL PAYMENT RECEIPT';
    const receiptTitleDari = isFullPayment ? 'رسید پرداخت' : 'رسید پرداخت جزئی';
    doc.text(receiptTitle, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 7;
    doc.setFontSize(14);
    doc.text(receiptTitleDari, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;

    // Receipt Number
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: ${paymentData.paymentNumber}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Date and Invoice Reference
    const paymentDate = paymentData.paymentDate?.toDate ? 
      paymentData.paymentDate.toDate().toLocaleDateString() : 
      new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Date: ${paymentDate}`, 20, yPosition);
    doc.text(`Invoice Reference: ${invoiceData.invoiceNumber}`, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 7;
    doc.text(`Customer: ${customerData.customerName || customerData.name}`, 20, yPosition);
    const customerCode = customerData.accountCode || 'N/A';
    doc.text(`Code: ${customerCode}`, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Payment Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS:', 20, yPosition);
    doc.text('جزئیات پرداخت:', pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Payment Information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Invoice Amount
    const totalInvoiceAmount = invoiceData.totalPureGold || 0;
    doc.text('Total Invoice Amount:', 25, yPosition);
    doc.text(`${totalInvoiceAmount.toFixed(3)}g pure gold`, pageWidth - 25, yPosition, { align: 'right' });
    
    yPosition += 6;
    
    // Amount Paid Today
    const amountPaidToday = paymentData.pureGoldPaid || 0;
    doc.setFont('helvetica', 'bold');
    doc.text('Amount Paid Today:', 25, yPosition);
    doc.setTextColor(0, 128, 0); // Green for payment
    doc.text(`${amountPaidToday.toFixed(3)}g pure gold`, pageWidth - 25, yPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.setFont('helvetica', 'normal');
    
    yPosition += 6;
    
    // Previous Payments (if partial payment)
    if (!isFullPayment) {
      const previousPayments = (invoiceData.paidPureGold || 0) - amountPaidToday;
      doc.text('Previous Payments:', 25, yPosition);
      doc.text(`${previousPayments.toFixed(3)}g`, pageWidth - 25, yPosition, { align: 'right' });
      yPosition += 6;
      
      const totalPaidToDate = invoiceData.paidPureGold || 0;
      doc.text('Total Paid to Date:', 25, yPosition);
      doc.text(`${totalPaidToDate.toFixed(3)}g`, pageWidth - 25, yPosition, { align: 'right' });
      yPosition += 6;
    }
    
    // Previous Balance
    const previousBalance = paymentData.previousBalance || 0;
    doc.text('Previous Balance:', 25, yPosition);
    doc.text(`${previousBalance.toFixed(3)}g`, pageWidth - 25, yPosition, { align: 'right' });
    
    yPosition += 6;
    
    // Remaining Balance
    const remainingBalance = invoiceData.remainingPureGold || 0;
    doc.setFont('helvetica', 'bold');
    doc.text('REMAINING BALANCE:', 25, yPosition);
    
    if (remainingBalance > 0) {
      doc.setTextColor(220, 38, 38); // Red for remaining
    } else {
      doc.setTextColor(0, 128, 0); // Green for fully paid
    }
    doc.text(`${remainingBalance.toFixed(3)}g pure gold`, pageWidth - 25, yPosition, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.setFont('helvetica', 'normal');
    
    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Reference Amount Section (USD)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REFERENCE AMOUNT:', 20, yPosition);
    doc.text('مبلغ مرجع:', pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const goldPrice = paymentData.goldPriceAtPayment || 145.43;
    doc.text(`Gold Price: $${goldPrice.toFixed(2)}/gram`, 25, yPosition);
    
    yPosition += 6;
    const paymentValueUSD = amountPaidToday * goldPrice;
    doc.text(`Payment Value: $${paymentValueUSD.toFixed(2)} USD`, 25, yPosition);
    
    if (!isFullPayment && remainingBalance > 0) {
      yPosition += 6;
      const remainingValueUSD = remainingBalance * goldPrice;
      doc.text(`Remaining Value: $${remainingValueUSD.toFixed(2)} USD`, 25, yPosition);
    }
    
    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Payment Status Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT STATUS:', 20, yPosition);
    
    if (isFullPayment) {
      doc.setTextColor(0, 128, 0); // Green
      doc.text('✅ PAID IN FULL', pageWidth - 20, yPosition, { align: 'right' });
    } else {
      doc.setTextColor(220, 38, 38); // Red
      doc.text('⚠️ PARTIALLY PAID', pageWidth - 20, yPosition, { align: 'right' });
    }
    doc.setTextColor(0, 0, 0); // Reset to black
    
    yPosition += 8;
    doc.setFont('helvetica', 'normal');
    
    // Due date for remaining balance (if partial)
    if (!isFullPayment && remainingBalance > 0) {
      const dueDate = invoiceData.dueDate?.toDate ? 
        invoiceData.dueDate.toDate().toLocaleDateString() : 
        'N/A';
      doc.setFontSize(10);
      doc.text(`Next Payment Due: ${remainingBalance.toFixed(3)}g by ${dueDate}`, 20, yPosition);
      yPosition += 8;
    }
    
    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Payment Method Details (if available)
    if (paymentData.paymentMode) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Method:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      
      let paymentMethodText = '';
      if (paymentData.paymentMode === 'pure_gold') {
        paymentMethodText = 'Pure Gold Payment';
      } else if (paymentData.paymentMode === 'usd_cash') {
        paymentMethodText = `USD Cash ($${(paymentData.usdPortion || 0).toFixed(2)}) converted to ${amountPaidToday.toFixed(3)}g`;
      } else if (paymentData.paymentMode === 'mixed') {
        paymentMethodText = `Mixed: ${(paymentData.goldPortion || 0).toFixed(3)}g + $${(paymentData.usdPortion || 0).toFixed(2)} USD`;
      }
      
      doc.text(paymentMethodText, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 8;
    }

    // Notes (if available)
    if (paymentData.notes && paymentData.notes.trim()) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 5;
      
      const notesLines = doc.splitTextToSize(paymentData.notes, pageWidth - 50);
      doc.text(notesLines, 25, yPosition);
      yPosition += notesLines.length * 5 + 5;
    }

    // Signature Section
    yPosition += 5;
    doc.setFontSize(10);
    doc.text('Received By: _______________', 20, yPosition);
    doc.text('Customer Signature: _______________', pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 15;
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Sharaf Deposit Notice
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('** Gold deposited to Sharaf Gold Bank **', pageWidth / 2, yPosition, { align: 'center' });
    
    if (paymentData.depositedToSharaf) {
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      if (paymentData.sharafReceiptNumber) {
        doc.text(`Sharaf Receipt No: ${paymentData.sharafReceiptNumber}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
      }
      
      if (paymentData.sharafDepositDate) {
        const depositDate = paymentData.sharafDepositDate.toDate ? 
          paymentData.sharafDepositDate.toDate().toLocaleDateString() : 
          '';
        if (depositDate) {
          doc.text(`Deposit Date: ${depositDate}`, pageWidth / 2, yPosition, { align: 'center' });
        }
      }
    }

    // Footer
    yPosition = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('All amounts in pure gold (24k equivalent)', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    doc.text('This is a computer-generated receipt', pageWidth / 2, yPosition, { align: 'center' });

    return doc;
  }

  /**
   * Download receipt as PDF
   * @param {Object} paymentData - Payment document data
   * @param {Object} invoiceData - Invoice details
   * @param {Object} customerData - Customer information
   * @param {boolean} isFullPayment - True if invoice fully paid
   */
  downloadReceipt(paymentData, invoiceData, customerData, isFullPayment = false) {
    const doc = this.generateReceipt(paymentData, invoiceData, customerData, isFullPayment);
    const filename = `Receipt_${paymentData.paymentNumber || 'PAY'}.pdf`;
    doc.save(filename);
  }
}

export default PaymentReceiptGenerator;

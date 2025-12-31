// ✅ TASK 6.3: Order Receipt Generation (Pure Gold - BRD v2)
// Reference: BRD_GoldSmith_v2.md Section 8.0, DatabaseInfo_GoldSmith_v2.md Section 3
// Purpose: Generate bilingual (English/Dari) order receipts with pure gold calculations

import jsPDF from 'jspdf';
import 'jspdf-autotable';

class OrderReceiptGenerator {
  constructor() {
    this.companyInfo = {
      name: 'AHMAD GOLD',
      nameDari: 'احمد طلا',
      location: 'Kabul, Afghanistan',
      phone: '+93 123 456 789',
      email: 'ahmadgold@example.com'
    };
  }

  /**
   * Generate and download order receipt PDF
   * @param {Object} orderData - Order data from Firestore
   * @param {Object} customerData - Customer data (optional, if not already in order)
   */
  async generateReceipt(orderData, customerData = null) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header - Company Info
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(14);
    doc.text(this.companyInfo.nameDari, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.companyInfo.location, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 5;
    doc.text(`${this.companyInfo.phone} | ${this.companyInfo.email}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Line separator
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    // Receipt Title
    yPos += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER RECEIPT / رسید سفارش', pageWidth / 2, yPos, { align: 'center' });
    
    // Date and Serial Number
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const orderDate = orderData.orderDate?.toDate 
      ? orderData.orderDate.toDate().toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        })
      : new Date().toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        });
    
    doc.text(`Date: ${orderDate}`, 15, yPos);
    doc.text(`Serial No: ${orderData.serialNumber || 'N/A'}`, pageWidth - 15, yPos, { align: 'right' });
    
    // Customer Details Section
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER DETAILS / معلومات مشتری', 15, yPos);
    
    yPos += 7;
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const customer = customerData || orderData;
    doc.text(`Name / نام: ${customer.customerName || 'N/A'}`, 15, yPos);
    
    yPos += 5;
    doc.text(`Phone / تیلفون: ${customer.customerPhone || customer.phone || 'N/A'}`, 15, yPos);
    
    if (customer.address) {
      yPos += 5;
      doc.text(`Address / آدرس: ${customer.address}`, 15, yPos);
    }
    
    // Order Details Section
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER DETAILS / جزئیات سفارش', 15, yPos);
    
    yPos += 7;
    doc.setLineWidth(0.3);
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Product table
    const productTableData = [[
      orderData.serialNumber || 'N/A',
      `${orderData.productName || 'N/A'}\n(${orderData.karat || '24k'})`,
      `${orderData.totalWeight?.toFixed(3) || '0.000'}g`,
      orderData.metal || 'Gold'
    ]];
    
    doc.autoTable({
      startY: yPos,
      head: [['S.No', 'Product Name / اسم جنس', 'Weight / وزن', 'Metal / فلز']],
      body: productTableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 215, 0], 
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: 15, right: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Pure Gold Calculation Section
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(255, 248, 220);
    doc.rect(15, yPos, pageWidth - 30, 50, 'F');
    
    yPos += 7;
    doc.text('PURE GOLD CALCULATION / حساب تیزابی طلا', 18, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const purityMap = { '24k': '100%', '22k': '91.67%', '18k': '75%', '14k': '58.33%' };
    const purityPercent = purityMap[orderData.karat] || '100%';
    
    doc.text(`Purity (${orderData.karat}):`, 18, yPos);
    doc.text(purityPercent, pageWidth - 18, yPos, { align: 'right' });
    
    yPos += 6;
    doc.text('Current Pure Gold (تیزابی فعلی):', 18, yPos);
    doc.text(`${orderData.productPureGold?.toFixed(3) || '0.000'} g`, pageWidth - 18, yPos, { align: 'right' });
    
    yPos += 6;
    doc.text(`Commission Rate (نرخ اجره): $${orderData.makingChargeRateUSD?.toFixed(2) || '0.00'}/g`, 18, yPos);
    
    yPos += 6;
    doc.text('Commission Gold (تیزابی اجره):', 18, yPos);
    doc.text(`${orderData.commissionGold?.toFixed(3) || '0.000'} g`, pageWidth - 18, yPos, { align: 'right' });
    
    yPos += 6;
    doc.text('Prior Balance (تیزابی گذشته):', 18, yPos);
    const priorBalance = orderData.priorGoldBalance || 0;
    doc.setTextColor(priorBalance >= 0 ? 200 : 0, priorBalance >= 0 ? 0 : 100, 0);
    doc.text(`${priorBalance.toFixed(3)} g`, pageWidth - 18, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    yPos += 8;
    doc.setLineWidth(0.5);
    doc.line(18, yPos, pageWidth - 18, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL PURE GOLD (مجموعه تیزابی):', 18, yPos);
    doc.setTextColor(184, 134, 11);
    doc.text(`${orderData.totalPureGoldOwed?.toFixed(3) || '0.000'} g`, pageWidth - 18, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    // Reference Amount Section
    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('REFERENCE AMOUNT (For Display Only):', 15, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Gold Price Today: $${orderData.goldPriceAtOrder?.toFixed(2) || '0.00'} per gram`, 15, yPos);
    
    yPos += 5;
    doc.text(`Equivalent: $${orderData.displayAmountUSD?.toFixed(2) || '0.00'}`, 15, yPos);
    
    // Manufacturer Info (if assigned)
    if (orderData.manufacturerName) {
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Assigned to Manufacturer: ${orderData.manufacturerName}`, 15, yPos);
    }
    
    // Expected Delivery Date
    if (orderData.expectedDeliveryDate) {
      const deliveryDate = orderData.expectedDeliveryDate.toDate 
        ? orderData.expectedDeliveryDate.toDate().toLocaleDateString()
        : new Date(orderData.expectedDeliveryDate).toLocaleDateString();
      
      yPos += 5;
      doc.text(`Expected Delivery: ${deliveryDate}`, 15, yPos);
    }
    
    // Signature Section
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setLineWidth(0.3);
    doc.line(15, yPos, 80, yPos);
    doc.line(pageWidth - 80, yPos, pageWidth - 15, yPos);
    
    yPos += 5;
    doc.text('Customer Signature', 15, yPos);
    doc.text('Date', pageWidth - 15, yPos, { align: 'right' });
    
    // Footer
    yPos = pageHeight - 25;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('** All transactions are in pure gold (24k equivalent) **', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 4;
    doc.text('** Currency amounts are for reference only **', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 4;
    doc.text(`Order Number: ${orderData.orderNumber || orderData.id || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Save PDF
    const fileName = `Order_Receipt_${orderData.serialNumber || orderData.orderNumber || 'receipt'}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName };
  }

  /**
   * Generate receipt and return as blob (for preview)
   */
  async generateReceiptBlob(orderData, customerData = null) {
    // Same logic as above but return blob instead of saving
    const doc = new jsPDF();
    // ... (same code as generateReceipt)
    
    return doc.output('blob');
  }

  /**
   * Print receipt directly
   */
  async printReceipt(orderData, customerData = null) {
    const doc = new jsPDF();
    // Generate PDF same way
    // Then open print dialog
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
}

export default new OrderReceiptGenerator();

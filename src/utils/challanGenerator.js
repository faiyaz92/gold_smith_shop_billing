// ✅ TASK 7.1: Gold Withdrawal Challan Generator (BRD v2)
// Reference: BRD_GoldSmith_v2.md Section 3.2, DatabaseInfo_GoldSmith_v2.md Section 6
// Generates bilingual PDF challans authorizing manufacturers to withdraw gold from Sharaf

import jsPDF from 'jspdf';
import 'jspdf-autotable';

class ChallanGenerator {
  constructor() {
    this.companyInfo = {
      name: 'AHMAD GOLD',
      nameDari: 'احمد طلا',
      phone: '+93-XXX-XXXXXX',
      address: 'Kabul, Afghanistan'
    };
  }

  /**
   * Generate gold withdrawal challan PDF
   * @param {Object} challanData - Challan information
   * @param {Object} orderData - Order information
   * @param {Object} manufacturerData - Manufacturer information
   * @param {Object} customerData - Customer information (optional)
   * @returns {jsPDF} PDF document
   */
  generateChallan(challanData, orderData, manufacturerData, customerData = null) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 15;

    // ═══════════════════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════════════════
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(this.companyInfo.name, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 7;
    doc.setFontSize(16);
    doc.text(this.companyInfo.nameDari, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.companyInfo.phone} | ${this.companyInfo.address}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    
    // Border line
    doc.setLineWidth(1.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;

    // ═══════════════════════════════════════════════════════
    // TITLE
    // ═══════════════════════════════════════════════════════
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('GOLD WITHDRAWAL CHALLAN / VOUCHER', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setFontSize(14);
    doc.text('استخراج طلا چلان', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // ═══════════════════════════════════════════════════════
    // CHALLAN INFO
    // ═══════════════════════════════════════════════════════
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Challan Number (Left) and Date (Right)
    doc.text(`Challan No: ${challanData.challanNumber}`, 15, yPos);
    const dateStr = challanData.issuedDate?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString();
    doc.text(`Date: ${dateStr}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 7;

    // Order Reference
    doc.text(`Order Reference: ${orderData.orderNumber || orderData.serialNumber}`, 15, yPos);
    yPos += 10;

    // ═══════════════════════════════════════════════════════
    // TO: GOLD BANK (SHARAF)
    // ═══════════════════════════════════════════════════════
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TO: Gold Bank (Sharaf)', 15, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Please release the following gold to the bearer:', 15, yPos);
    yPos += 10;

    // ═══════════════════════════════════════════════════════
    // MANUFACTURER DETAILS
    // ═══════════════════════════════════════════════════════
    doc.setFont('helvetica', 'bold');
    doc.text('MANUFACTURER DETAILS:', 15, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${manufacturerData.manufacturerName || manufacturerData.name}`, 20, yPos);
    yPos += 6;
    doc.text(`Code: ${manufacturerData.manufacturerCode}`, 20, yPos);
    yPos += 6;
    if (manufacturerData.phone) {
      doc.text(`Phone: ${manufacturerData.phone}`, 20, yPos);
      yPos += 6;
    }
    yPos += 4;

    // ═══════════════════════════════════════════════════════
    // GOLD DETAILS (HIGHLIGHTED BOX)
    // ═══════════════════════════════════════════════════════
    const goldBoxY = yPos;
    doc.setFillColor(255, 243, 205); // Light yellow background
    doc.rect(15, goldBoxY, pageWidth - 30, 30, 'F');
    doc.setDrawColor(234, 179, 8); // Yellow border
    doc.setLineWidth(1);
    doc.rect(15, goldBoxY, pageWidth - 30, 30);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('GOLD DETAILS:', 20, yPos);
    yPos += 8;

    doc.setFontSize(14);
    doc.setTextColor(202, 138, 4); // Golden text color
    doc.text(`Pure Gold (24k): ${challanData.pureGoldAmount.toFixed(3)} grams`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Reset to black
    doc.text(`تیزابی طلا: ${challanData.pureGoldAmount.toFixed(3)} گرام`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 12;

    // ═══════════════════════════════════════════════════════
    // PURPOSE
    // ═══════════════════════════════════════════════════════
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Purpose:', 15, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    const purposeText = challanData.purpose || 
      `Production of ${orderData.weightGrams}g ${orderData.karat} ${orderData.productName}`;
    
    // Wrap long purpose text
    const splitPurpose = doc.splitTextToSize(purposeText, pageWidth - 40);
    doc.text(splitPurpose, 20, yPos);
    yPos += splitPurpose.length * 6 + 5;

    // ═══════════════════════════════════════════════════════
    // CUSTOMER INFO (if provided)
    // ═══════════════════════════════════════════════════════
    if (customerData) {
      doc.setFont('helvetica', 'bold');
      doc.text('Customer:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(customerData.customerName || customerData.name, 45, yPos);
      yPos += 10;
    }

    // ═══════════════════════════════════════════════════════
    // AUTHORIZATION SECTION
    // ═══════════════════════════════════════════════════════
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('AUTHORIZATION:', 15, yPos);
    yPos += 10;

    // Signature lines
    const sigY = yPos;
    
    // Authorized By
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized By:', 20, sigY);
    doc.line(55, sigY, 95, sigY);
    doc.setFontSize(9);
    doc.text('(Company Seal & Signature)', 55, sigY + 5);

    // Gold Bank Signature
    doc.setFontSize(11);
    doc.text('Gold Bank (Sharaf):', pageWidth - 95, sigY);
    doc.line(pageWidth - 65, sigY, pageWidth - 20, sigY);
    doc.setFontSize(9);
    doc.text('(Release Confirmation)', pageWidth - 65, sigY + 5);

    yPos = sigY + 15;

    // ═══════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This challan authorizes the release of gold to the specified manufacturer.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text('Gold Bank must verify manufacturer identity before releasing gold.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    doc.text(`Challan ID: ${challanData.challanId || 'N/A'} | Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });

    return doc;
  }

  /**
   * Generate and download challan PDF
   * @param {Object} challanData - Challan information
   * @param {Object} orderData - Order information
   * @param {Object} manufacturerData - Manufacturer information
   * @param {Object} customerData - Customer information (optional)
   */
  async downloadChallan(challanData, orderData, manufacturerData, customerData = null) {
    const doc = this.generateChallan(challanData, orderData, manufacturerData, customerData);
    const fileName = `Challan_${challanData.challanNumber}.pdf`;
    doc.save(fileName);
  }

  /**
   * Generate challan as blob for preview
   * @param {Object} challanData - Challan information
   * @param {Object} orderData - Order information
   * @param {Object} manufacturerData - Manufacturer information
   * @param {Object} customerData - Customer information (optional)
   * @returns {Blob} PDF blob
   */
  async generateChallanBlob(challanData, orderData, manufacturerData, customerData = null) {
    const doc = this.generateChallan(challanData, orderData, manufacturerData, customerData);
    return doc.output('blob');
  }

  /**
   * Print challan directly
   * @param {Object} challanData - Challan information
   * @param {Object} orderData - Order information
   * @param {Object} manufacturerData - Manufacturer information
   * @param {Object} customerData - Customer information (optional)
   */
  async printChallan(challanData, orderData, manufacturerData, customerData = null) {
    const doc = this.generateChallan(challanData, orderData, manufacturerData, customerData);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
}

// Export singleton instance
const challanGenerator = new ChallanGenerator();
export default challanGenerator;

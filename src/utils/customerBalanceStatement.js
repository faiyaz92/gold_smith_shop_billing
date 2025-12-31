// ✅ TASK 3.3 COMPLETE: Customer Balance Statement Generator
// Reference: BRD_GoldSmith_v2.md Section 6.5
// Generates monthly balance statement for customers with transaction history

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateCustomerBalanceStatement = (customerData, transactions, goldPrice, period = 'monthly') => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER BALANCE STATEMENT', 105, 20, { align: 'center' });
  
  // Company info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gold Smith - Pure Gold Accounting System', 105, 28, { align: 'center' });
  
  // Statement period
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const periodText = period === 'monthly' ? `Statement Period: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : period;
  doc.text(periodText, 14, 40);
  
  // Customer details box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 45, 180, 30, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information:', 18, 52);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customerData.customerName || customerData.name}`, 18, 58);
  doc.text(`Customer Code: ${customerData.customerCode}`, 18, 64);
  doc.text(`Phone: ${customerData.phone || 'N/A'}`, 18, 70);
  
  doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 120, 58);
  doc.text(`Current Gold Price: $${goldPrice.toFixed(2)}/g`, 120, 64);
  
  // Opening balance
  const openingBalance = customerData.openingBalance || 0;
  const currentBalance = customerData.currentPureGoldBalance || 0;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Summary:', 14, 85);
  
  // Summary box
  doc.setFillColor(240, 248, 255);
  doc.rect(14, 88, 180, 25, 'FD');
  
  doc.setFontSize(10);
  doc.text('Opening Balance:', 18, 95);
  doc.text(`${openingBalance.toFixed(3)}g`, 80, 95);
  doc.text(`($${(openingBalance * goldPrice).toFixed(2)})`, 110, 95);
  
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0);
  
  doc.text('Total Charges (Debit):', 18, 101);
  doc.setTextColor(220, 38, 38);
  doc.text(`+${totalDebits.toFixed(3)}g`, 80, 101);
  doc.setTextColor(0, 0, 0);
  doc.text(`($${(totalDebits * goldPrice).toFixed(2)})`, 110, 101);
  
  doc.text('Total Payments (Credit):', 18, 107);
  doc.setTextColor(34, 197, 94);
  doc.text(`-${totalCredits.toFixed(3)}g`, 80, 107);
  doc.setTextColor(0, 0, 0);
  doc.text(`($${(totalCredits * goldPrice).toFixed(2)})`, 110, 107);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Closing Balance:', 18, 113);
  const balanceColor = currentBalance > 0 ? [220, 38, 38] : [34, 197, 94];
  doc.setTextColor(...balanceColor);
  doc.text(`${currentBalance.toFixed(3)}g`, 80, 113);
  doc.setTextColor(0, 0, 0);
  doc.text(`($${(currentBalance * goldPrice).toFixed(2)})`, 110, 113);
  
  // Transaction history
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction History:', 14, 125);
  
  // Prepare transaction data
  const txnData = transactions.map(txn => {
    const date = txn.date?.toDate?.() || new Date(txn.date);
    const amount = txn.amount || 0;
    const balance = txn.balance || 0;
    
    return [
      date.toLocaleDateString(),
      txn.description || txn.type,
      txn.reference || '-',
      txn.type === 'debit' ? `${amount.toFixed(3)}g` : '-',
      txn.type === 'credit' ? `${amount.toFixed(3)}g` : '-',
      `${balance.toFixed(3)}g`
    ];
  });
  
  doc.autoTable({
    startY: 130,
    head: [['Date', 'Description', 'Reference', 'Debit (+)', 'Credit (-)', 'Balance']],
    body: txnData.length > 0 ? txnData : [['No transactions for this period', '', '', '', '', '']],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [59, 130, 246],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25, halign: 'right', textColor: [220, 38, 38] },
      4: { cellWidth: 25, halign: 'right', textColor: [34, 197, 94] },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    }
  });
  
  // Aging analysis
  const finalY = doc.previousAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Aging Analysis:', 14, finalY);
  
  // Calculate aging
  const now = new Date();
  const aging = {
    '0-30': 0,
    '31-60': 0,
    '61+': 0
  };
  
  transactions.forEach(txn => {
    if (txn.type === 'debit' && txn.date) {
      const txnDate = txn.date?.toDate?.() || new Date(txn.date);
      const daysOld = Math.floor((now - txnDate) / (1000 * 60 * 60 * 24));
      
      if (daysOld <= 30) aging['0-30'] += txn.amount || 0;
      else if (daysOld <= 60) aging['31-60'] += txn.amount || 0;
      else aging['61+'] += txn.amount || 0;
    }
  });
  
  doc.autoTable({
    startY: finalY + 5,
    head: [['Period', 'Amount (Gold)', 'USD Equivalent', 'Status']],
    body: [
      ['0-30 days', `${aging['0-30'].toFixed(3)}g`, `$${(aging['0-30'] * goldPrice).toFixed(2)}`, 'Current'],
      ['31-60 days', `${aging['31-60'].toFixed(3)}g`, `$${(aging['31-60'] * goldPrice).toFixed(2)}`, 'Overdue'],
      ['61+ days', `${aging['61+'].toFixed(3)}g`, `$${(aging['61+'] * goldPrice).toFixed(2)}`, 'Critical']
    ],
    theme: 'grid',
    styles: {
      fontSize: 9
    },
    headStyles: {
      fillColor: [59, 130, 246]
    },
    columnStyles: {
      3: { 
        fontStyle: 'bold',
        textColor: function(rowIndex) {
          if (rowIndex === 0) return [34, 197, 94]; // Green
          if (rowIndex === 1) return [234, 179, 8]; // Yellow
          return [220, 38, 38]; // Red
        }
      }
    }
  });
  
  // Footer
  const footerY = doc.internal.pageSize.height - 30;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Note: All amounts are in pure gold grams. USD amounts are reference only, calculated at current gold price.', 14, footerY);
  doc.text('Please remit payment in pure gold or USD equivalent. Contact us for any discrepancies.', 14, footerY + 5);
  
  doc.setFont('helvetica', 'bold');
  doc.text('For inquiries: Gold Smith - Pure Gold Accounting System', 14, footerY + 15);
  
  // Bilingual section (Dari)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('بیانیه موجودی مشتری', 200, 20, { align: 'right' });
  
  return doc;
};

// Export to PDF file
export const downloadCustomerBalanceStatement = (customerData, transactions, goldPrice, period = 'monthly') => {
  const doc = generateCustomerBalanceStatement(customerData, transactions, goldPrice, period);
  const filename = `Balance_Statement_${customerData.customerCode}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

// Email customer balance statement
export const emailCustomerBalanceStatement = async (customerData, transactions, goldPrice, recipientEmail) => {
  const doc = generateCustomerBalanceStatement(customerData, transactions, goldPrice);
  const pdfBlob = doc.output('blob');
  
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  console.log('Email balance statement to:', recipientEmail);
  console.log('PDF size:', pdfBlob.size, 'bytes');
  
  // Return blob for further processing
  return pdfBlob;
};

// Get customer transactions for statement period
export const getCustomerTransactionsForStatement = (allTransactions, customerId, period = 'monthly') => {
  const now = new Date();
  let startDate;
  
  if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'quarterly') {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1);
  } else if (period === 'yearly') {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate = new Date(0); // All time
  }
  
  return allTransactions
    .filter(txn => {
      const txnDate = txn.date?.toDate?.() || new Date(txn.date);
      return txn.customerId === customerId && txnDate >= startDate;
    })
    .sort((a, b) => {
      const dateA = a.date?.toDate?.() || new Date(a.date);
      const dateB = b.date?.toDate?.() || new Date(b.date);
      return dateA - dateB;
    });
};

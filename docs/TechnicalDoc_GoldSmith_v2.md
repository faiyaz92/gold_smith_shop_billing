# Technical Documentation v2.0
## GOLD SMITH PURE GOLD ACCOUNTING SYSTEM

**Document Version:** 2.0  
**Date:** December 30, 2025  
**Project:** Gold Smith Pure Gold-Based Billing & Management System  
**Technology Stack:** Next.js 14 + Firebase/Firestore + Cloudinary + Gold Price API  
**Architecture:** Multi-tenant SaaS with Company-based Path Structure  

---

## 📋 DOCUMENT NAVIGATION

**📋 Related Documents:**
- **[BRD_GoldSmith_v2.md](BRD_GoldSmith_v2.md)** - Business requirements and workflows
- **[DatabaseInfo_GoldSmith_v2.md](DatabaseInfo_GoldSmith_v2.md)** - Complete database schema (SINGLE SOURCE OF TRUTH)
- **[TaskList_GoldSmith_v2.md](TaskList_GoldSmith_v2.md)** - Implementation tasks with AI notes

**🔗 Bidirectional Cross-References:**
| TechnicalDoc v2.0 Section | BRD v2.0 Section | DatabaseInfo v2.0 Section | TaskList v2.0 Section |
|---------------------------|------------------|---------------------------|----------------------|
| [1. System Overview](#1-system-overview) | [BRD: Executive Summary](BRD_GoldSmith_v2.md#-executive-summary) | [DB: 1. Overview](DatabaseInfo_GoldSmith_v2.md#1-overview) | [Task: 1. Foundation](TaskList_GoldSmith_v2.md#1-foundation-phase) |
| [2. Menu Structure](#2-application-menu-structure) | [BRD: Menu Structure](BRD_GoldSmith_v2.md#-application-menu-structure-simplified) | [DB: Collections Overview](DatabaseInfo_GoldSmith_v2.md#1-overview) | [Task: UI/UX](TaskList_GoldSmith_v2.md#ui-ux) |
| [3. Accounting Engine](#3-accounting-engine-invisible-automation) | [BRD: Section 2 - Accounting System](BRD_GoldSmith_v2.md#2-accounting-system-completely-invisible-to-client) | [DB: 9. Transactions](DatabaseInfo_GoldSmith_v2.md#9-accounting-transactions-collection) | [Task: 2. Accounting](TaskList_GoldSmith_v2.md#2-accounting-setup) |
| [4. Gold Price Management](#4-gold-price-management-system) | [BRD: Section 1 - Gold Price](BRD_GoldSmith_v2.md#1-gold-price-management-system) | [DB: 10. Gold Price](DatabaseInfo_GoldSmith_v2.md#10-gold-price-history-collection) | [Task: 10. Gold Price](TaskList_GoldSmith_v2.md#10-gold-price-integration) |
| [5. Multiple Sharaf Support](#5-multiple-gold-bank-sharaf-support) | [BRD: Section 2.3 - Gold Banks](BRD_GoldSmith_v2.md#-gold-bank-account-creation---business-entity-trigger) | [DB: 5. Gold Banks](DatabaseInfo_GoldSmith_v2.md#5-gold-banks-collection) | [Task: Entity Management](TaskList_GoldSmith_v2.md#entity-management) |
| [6. Order Management](#6-order-management-gold-based) | [BRD: Section 4 - Order Management](BRD_GoldSmith_v2.md#4-order-management-pure-gold-based) | [DB: 3. Orders](DatabaseInfo_GoldSmith_v2.md#3-orders-collection) | [Task: 3. Order Module](TaskList_GoldSmith_v2.md#3-order-module) |
| [7. Challan System](#7-challan-system-gold-withdrawal) | [BRD: Section 5 - Challan Management](BRD_GoldSmith_v2.md#5-challanvoucher-management) | [DB: 6. Challans](DatabaseInfo_GoldSmith_v2.md#6-challans-collection) | [Task: 6. Challan](TaskList_GoldSmith_v2.md#6-challan-implementation) |
| [8. Billing Engine](#8-billing-engine-pure-gold-invoices) | [BRD: Section 3.6 - Customer Billing](BRD_GoldSmith_v2.md#36-customer-delivery--billing) | [DB: 7. Invoices](DatabaseInfo_GoldSmith_v2.md#7-invoices-collection) | [Task: 7. Billing](TaskList_GoldSmith_v2.md#7-billing-module) |
| [9. Payment Processing](#9-payment-processing-flexible-gold--usd) | [BRD: Section 1.3 - USD Payment Conversion](BRD_GoldSmith_v2.md#13-usd-payment-conversion-to-pure-gold-flexible-customer-payments) | [DB: 8. Payments](DatabaseInfo_GoldSmith_v2.md#8-payments-collection) | [Task: 8. Payment](TaskList_GoldSmith_v2.md#8-payment-module) |
| [10. Dashboard & Reports](#10-dashboard--reports-client-view) | [BRD: Section 2.8 - Financial Reports](BRD_GoldSmith_v2.md#28-financial-reports--analytics-client-sees-business-summaries-only) | [DB: Aggregated Views](DatabaseInfo_GoldSmith_v2.md#aggregated-views) | [Task: Dashboard](TaskList_GoldSmith_v2.md#dashboard) |
| [11. Expert Backdoor Access](#11-expert-backdoor-access-accounting-tools) | [BRD: Section 2.5 - Expert Transfer](BRD_GoldSmith_v2.md#25-expert-account-transfer-backdoor-only---client-never-sees) | [DB: Manual Entries](DatabaseInfo_GoldSmith_v2.md#manual-entries) | [Task: Expert Tools](TaskList_GoldSmith_v2.md#expert-tools) |

---

## 🚨 CRITICAL: ZERO ASSUMPTIONS POLICY

**Before writing ANY code:**
1. ✅ Check [DatabaseInfo_GoldSmith_v2.md](DatabaseInfo_GoldSmith_v2.md) for exact field names
2. ✅ Check [DatabaseInfo_GoldSmith_v2.md](DatabaseInfo_GoldSmith_v2.md) for data types
3. ✅ Check [DatabaseInfo_GoldSmith_v2.md](DatabaseInfo_GoldSmith_v2.md) for validation rules
4. ❌ NEVER create new collections without updating DatabaseInfo_v2.md first
5. ❌ NEVER add new fields without updating DatabaseInfo_v2.md first
6. ❌ NEVER assume field names - always look them up

**DatabaseInfo_GoldSmith_v2.md is the SINGLE SOURCE OF TRUTH!**

---

## 1. SYSTEM OVERVIEW

**BRD Reference:** [BRD Section: Executive Summary](BRD_GoldSmith_v2.md#-executive-summary)

### 1.1 Core Business Model

**Pure Gold Accounting with Gold Bank Custody:**
- **Unit of Account:** Pure gold grams (24k equivalent) for customers, USD for manufacturers
- **Customer Transactions:** All in pure gold grams (payments, receivables, commission)
- **Manufacturer Transactions:** Making charges ONLY in USD cash
- **Gold Custody:** All gold held by external Gold Bank (Sharaf) - client never holds physical gold
- **Gold Movement:** Challan/voucher system for authorization
- **Balance Sheet:** Gold grams receivable, USD cash payable

### 1.2 Technology Stack

```javascript
// Frontend
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Cloudinary (Image management)

// Backend
- Firebase Authentication
- Firestore Database
- Firebase Cloud Functions (optional)

// APIs
- Gold Price API (goldprice.org or kitco.com)

// Deployment
- Vercel (Frontend)
- Firebase (Backend)
```

### 1.3 Application Structure

**BRD Reference:** [BRD: Menu Structure](BRD_GoldSmith_v2.md#-application-menu-structure-simplified)

```
goldSmith/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── dashboard/          # Main dashboard (KPIs, gold price)
│   │   │   ├── orders/             # Order management
│   │   │   ├── billing/            # Billing & payment
│   │   │   ├── customers/          # Customer management
│   │   │   ├── suppliers/          # Supplier management
│   │   │   ├── goldbanks/          # Multiple Sharaf banks management
│   │   │   └── accounting/         # 🔒 HIDDEN - Expert backdoor only
│   │   ├── auth/                   # Login page
│   │   ├── context/                # React contexts
│   │   └── utils/                  # Utility functions
│   │       ├── accountingEngine.js        # Core accounting automation
│   │       ├── purityConversion.js        # Gold purity calculations
│   │       ├── goldPriceAPI.js            # Gold price integration
│   │       └── balanceCalculation.js      # Account balance tracking
│   └── components/                 # Shared components
├── docs/
│   ├── BRD_GoldSmith_v2.md
│   ├── DatabaseInfo_GoldSmith_v2.md
│   ├── TechnicalDoc_GoldSmith_v2.md
│   └── TaskList_GoldSmith_v2.md
└── public/
```

### 1.4 Multi-Tenant Architecture

**Base Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}`

**Environment Variable:**
```javascript
// .env.local
NEXT_PUBLIC_COMPANY_ID=goldsmith_001
```

**All Firestore queries MUST include:**
```javascript
const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;
const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;
```

---

## 2. APPLICATION MENU STRUCTURE

**BRD Reference:** [BRD: Menu Structure](BRD_GoldSmith_v2.md#-application-menu-structure-simplified)

### 2.1 Client-Visible Menu (100% Simple)

**File:** `src/app/admin/AdminLayout.js`

```javascript
/**
 * Simplified menu - Client sees ONLY 6 business modules
 * Reference: BRD Section - Application Menu Structure
 * NO ACCOUNTING VISIBLE TO CLIENT
 */
const clientMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/admin/dashboard',
    description: 'KPIs, gold price, financial summaries'
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: '📦',
    path: '/admin/orders',
    description: 'Order creation, challan issuance, product delivery'
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: '💰',
    path: '/admin/billing',
    description: 'Invoice generation, payment collection, outstanding tracking'
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: '👥',
    path: '/admin/customers',
    description: 'Customer profiles (auto-creates receivable accounts)'
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: '🏭',
    path: '/admin/suppliers',
    description: 'Supplier profiles (auto-creates payable accounts)'
  },
  {
    id: 'goldbanks',
    label: 'Gold Banks',
    icon: '🏦',
    path: '/admin/goldbanks',
    description: 'Multiple Sharaf bank management (auto-creates custody accounts)'
  }
];
```

### 2.2 Expert Backdoor Menu (Hidden)

**Access Control:** Only visible when `user.role === 'expert'` or special permission

```javascript
/**
 * Expert-only modules - COMPLETELY HIDDEN from client
 * Reference: BRD Section 2.5 & 2.6
 */
const expertMenuItems = [
  {
    id: 'accounting',
    label: '🔒 Accounting',
    icon: '📒',
    path: '/admin/accounting',
    description: 'Full double-entry accounting system',
    expertOnly: true
  },
  {
    id: 'expert-tools',
    label: '🔒 Expert Tools',
    icon: '🛠️',
    path: '/admin/expert-tools',
    description: 'Manual corrections, transfers, journal entries',
    expertOnly: true
  }
];
```

---

## 3. ACCOUNTING ENGINE (INVISIBLE AUTOMATION)

**BRD Reference:** [BRD Section 2: Accounting System](BRD_GoldSmith_v2.md#2-accounting-system-completely-invisible-to-client)

**Reference:** [DatabaseInfo_GoldSmith_v2.md - Section 9](DatabaseInfo_GoldSmith_v2.md#9-accounting-transactions-collection)

### 2.1 Core Accounting Principles

**Double-Entry Bookkeeping:**
- Every transaction has equal debits and credits
- Separate balancing for gold (grams) and USD
- Pure gold transactions: Total debitGold = Total creditGold
- USD transactions: Total debitUSD = Total creditUSD

**Account Types & Normal Balances:**
```javascript
const ACCOUNT_TYPES = {
  Asset: { normalBalance: 'debit', increases: 'debit', decreases: 'credit' },
  Liability: { normalBalance: 'credit', increases: 'credit', decreases: 'debit' },
  Equity: { normalBalance: 'credit', increases: 'credit', decreases: 'debit' },
  Revenue: { normalBalance: 'credit', increases: 'credit', decreases: 'debit' },
  Expense: { normalBalance: 'debit', increases: 'debit', decreases: 'credit' }
};
```

### 2.2 Accounting Engine Implementation

**File:** `src/utils/accountingEngine.js`

```javascript
import { db } from '@/app/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;
const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

/**
 * CRITICAL: All field names from DatabaseInfo_GoldSmith_v2.md Section 9
 * DO NOT assume any field names - check DatabaseInfo_v2.md first!
 */

class AccountingEngine {
  
  /**
   * Record a double-entry journal transaction
   * @param {Object} transactionData - Transaction details
   * @param {string} transactionData.description - Transaction description
   * @param {Array} transactionData.lines - Array of journal lines
   * @param {string} transactionData.referenceType - One of: "challan", "invoice", "payment", "making_charges", "manual_entry"
   * @param {string} transactionData.referenceId - Reference document ID
   * @param {string} transactionData.createdBy - User ID
   * 
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordTransaction(transactionData) {
    try {
      const { description, lines, referenceType, referenceId, createdBy } = transactionData;
      
      // Validate transaction balances (gold and USD separately)
      this.validateTransactionBalance(lines);
      
      // Generate transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create transaction document
      // FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
      const transaction = {
        transactionId,
        transactionType: 'journal_entry',
        date: Timestamp.now(),
        description,
        lines,
        referenceType,
        referenceId: referenceId || null,
        createdAt: Timestamp.now(),
        createdBy,
        companyId
      };
      
      // Save to Firestore
      const transactionsRef = collection(db, `${basePath}/transactions`);
      const docRef = await addDoc(transactionsRef, transaction);
      
      // Update account balances
      await this.updateAccountBalances(lines);
      
      return { success: true, transactionId, docId: docRef.id };
      
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }
  
  /**
   * Validate that debits equal credits (separately for gold and USD)
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  validateTransactionBalance(lines) {
    let totalDebitGold = 0;
    let totalCreditGold = 0;
    let totalDebitUSD = 0;
    let totalCreditUSD = 0;
    
    lines.forEach(line => {
      totalDebitGold += line.debitGold || 0;
      totalCreditGold += line.creditGold || 0;
      totalDebitUSD += line.debitUSD || 0;
      totalCreditUSD += line.creditUSD || 0;
    });
    
    // Allow small rounding differences (0.001)
    const goldDiff = Math.abs(totalDebitGold - totalCreditGold);
    const usdDiff = Math.abs(totalDebitUSD - totalCreditUSD);
    
    if (goldDiff > 0.001) {
      throw new Error(`Transaction out of balance (Gold): Debits ${totalDebitGold}g ≠ Credits ${totalCreditGold}g`);
    }
    
    if (usdDiff > 0.01) {
      throw new Error(`Transaction out of balance (USD): Debits $${totalDebitUSD} ≠ Credits $${totalCreditUSD}`);
    }
  }
  
  /**
   * Update account balances after transaction
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 2.1
   */
  async updateAccountBalances(lines) {
    for (const line of lines) {
      const accountRef = collection(db, `${basePath}/accounts`);
      const q = query(accountRef, where('accountCode', '==', line.accountCode));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error(`Account not found: ${line.accountCode}`);
      }
      
      const accountDoc = snapshot.docs[0];
      const account = accountDoc.data();
      
      // Calculate balance change
      let balanceChange = 0;
      
      // For gold accounts
      if (account.unit === 'grams') {
        const debitAmount = line.debitGold || 0;
        const creditAmount = line.creditGold || 0;
        
        if (account.normalBalance === 'debit') {
          balanceChange = debitAmount - creditAmount;
        } else {
          balanceChange = creditAmount - debitAmount;
        }
      }
      
      // For USD accounts
      if (account.unit === 'USD') {
        const debitAmount = line.debitUSD || 0;
        const creditAmount = line.creditUSD || 0;
        
        if (account.normalBalance === 'debit') {
          balanceChange = debitAmount - creditAmount;
        } else {
          balanceChange = creditAmount - debitAmount;
        }
      }
      
      // Update account balance
      // FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 2.1
      await updateDoc(doc(db, `${basePath}/accounts`, accountDoc.id), {
        balance: account.balance + balanceChange,
        updatedAt: Timestamp.now()
      });
    }
  }
  
  /**
   * 1. Record Challan Issuance (Gold to Manufacturer)
   * Business Flow: BRD_GoldSmith_v2.md Section 3.1
   * Accounting Entry: BRD_GoldSmith_v2.md Section 3.1
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordChallanIssue(challanData) {
    const { challanId, pureGoldAmount, manufacturerName, createdBy } = challanData;
    
    return await this.recordTransaction({
      description: `Gold withdrawal challan issued to ${manufacturerName}`,
      lines: [
        {
          accountCode: '1102',
          accountName: 'Gold in Transit to Manufacturers',
          debitGold: pureGoldAmount,
          creditGold: 0,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: challanData.goldPriceRef || 0
        },
        {
          accountCode: '1101',
          accountName: 'Gold Bank (Sharaf)',
          debitGold: 0,
          creditGold: pureGoldAmount,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: challanData.goldPriceRef || 0
        }
      ],
      referenceType: 'challan',
      referenceId: challanId,
      createdBy
    });
  }
  
  /**
   * 2. Record Product Receipt (Finished Goods from Manufacturer)
   * Business Flow: BRD_GoldSmith_v2.md Section 3.3
   * Accounting Entry: BRD_GoldSmith_v2.md Section 3.3
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordProductReceipt(receiptData) {
    const { orderId, pureGoldAmount, manufacturerName, createdBy } = receiptData;
    
    return await this.recordTransaction({
      description: `Finished product received from ${manufacturerName}`,
      lines: [
        {
          accountCode: '1103',
          accountName: 'Finished Goods Inventory',
          debitGold: pureGoldAmount,
          creditGold: 0,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: receiptData.goldPriceRef || 0
        },
        {
          accountCode: '1102',
          accountName: 'Gold in Transit to Manufacturers',
          debitGold: 0,
          creditGold: pureGoldAmount,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: receiptData.goldPriceRef || 0
        }
      ],
      referenceType: 'challan',
      referenceId: orderId,
      createdBy
    });
  }
  
  /**
   * 3. Record Making Charges Liability (USD Owed to Manufacturer)
   * Business Flow: BRD_GoldSmith_v2.md Section 3.3
   * Accounting Entry: BRD_GoldSmith_v2.md Section 3.3
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordMakingCharges(chargesData) {
    const { orderId, makingChargesUSD, manufacturerName, createdBy } = chargesData;
    
    return await this.recordTransaction({
      description: `Making charges for order ${orderId} - ${manufacturerName}`,
      lines: [
        {
          accountCode: '5101',
          accountName: 'Making Charges Expense',
          debitGold: 0,
          creditGold: 0,
          debitUSD: makingChargesUSD,
          creditUSD: 0,
          goldPriceRef: 0
        },
        {
          accountCode: '2101',
          accountName: 'Manufacturer Payables - Making Charges',
          debitGold: 0,
          creditGold: 0,
          debitUSD: 0,
          creditUSD: makingChargesUSD,
          goldPriceRef: 0
        }
      ],
      referenceType: 'making_charges',
      referenceId: orderId,
      createdBy
    });
  }
  
  /**
   * 4. Record Customer Billing (Customer Owes Pure Gold)
   * Business Flow: BRD_GoldSmith_v2.md Section 3.5
   * Accounting Entry: BRD_GoldSmith_v2.md Section 3.5
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordCustomerBilling(billingData) {
    const { invoiceId, productPureGold, commissionGold, customerName, createdBy } = billingData;
    const totalGold = productPureGold + commissionGold;
    
    const lines = [
      {
        accountCode: '1301',
        accountName: 'Customer Receivables',
        debitGold: totalGold,
        creditGold: 0,
        debitUSD: 0,
        creditUSD: 0,
        goldPriceRef: billingData.goldPriceRef || 0
      },
      {
        accountCode: '1103',
        accountName: 'Finished Goods Inventory',
        debitGold: 0,
        creditGold: productPureGold,
        debitUSD: 0,
        creditUSD: 0,
        goldPriceRef: billingData.goldPriceRef || 0
      },
      {
        accountCode: '4101',
        accountName: 'Commission Income',
        debitGold: 0,
        creditGold: commissionGold,
        debitUSD: 0,
        creditUSD: 0,
        goldPriceRef: billingData.goldPriceRef || 0
      }
    ];
    
    return await this.recordTransaction({
      description: `Customer billing - ${customerName}`,
      lines,
      referenceType: 'invoice',
      referenceId: invoiceId,
      createdBy
    });
  }
  
  /**
   * 5. Record Customer Payment (Customer Pays in Pure Gold)
   * Business Flow: BRD_GoldSmith_v2.md Section 3.7
   * Accounting Entry: BRD_GoldSmith_v2.md Section 3.7
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordCustomerPayment(paymentData) {
    const { paymentId, pureGoldPaid, customerName, createdBy } = paymentData;
    
    return await this.recordTransaction({
      description: `Payment received from ${customerName} in pure gold`,
      lines: [
        {
          accountCode: '1101',
          accountName: 'Gold Bank (Sharaf)',
          debitGold: pureGoldPaid,
          creditGold: 0,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: paymentData.goldPriceRef || 0
        },
        {
          accountCode: '1301',
          accountName: 'Customer Receivables',
          debitGold: 0,
          creditGold: pureGoldPaid,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: paymentData.goldPriceRef || 0
        }
      ],
      referenceType: 'payment',
      referenceId: paymentId,
      createdBy
    });
  }
  
  /**
   * 6. Record Gold Return (Manufacturer Returns Excess Gold)
   * Business Flow: BRD_GoldSmith_v2.md Section 3.10
   * Accounting Entry: BRD_GoldSmith_v2.md Section 3.10
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordGoldReturn(returnData) {
    const { challanId, goldReturnedAmount, manufacturerName, createdBy } = returnData;
    
    return await this.recordTransaction({
      description: `Excess gold returned by ${manufacturerName}`,
      lines: [
        {
          accountCode: '1101',
          accountName: 'Gold Bank (Sharaf)',
          debitGold: goldReturnedAmount,
          creditGold: 0,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: returnData.goldPriceRef || 0
        },
        {
          accountCode: '1102',
          accountName: 'Gold in Transit to Manufacturers',
          debitGold: 0,
          creditGold: goldReturnedAmount,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: returnData.goldPriceRef || 0
        }
      ],
      referenceType: 'challan',
      referenceId: challanId,
      createdBy
    });
  }
  
  /**
   * 7. Record Additional Gold Issue (More Gold Needed)
   * Business Flow: BRD_GoldSmith_v2.md Section 3.11
   * Accounting Entry: BRD_GoldSmith_v2.md Section 3.11
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordAdditionalGoldIssue(issueData) {
    const { challanId, additionalGoldAmount, manufacturerName, createdBy } = issueData;
    
    return await this.recordTransaction({
      description: `Additional gold issued to ${manufacturerName}`,
      lines: [
        {
          accountCode: '1102',
          accountName: 'Gold in Transit to Manufacturers',
          debitGold: additionalGoldAmount,
          creditGold: 0,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: issueData.goldPriceRef || 0
        },
        {
          accountCode: '1101',
          accountName: 'Gold Bank (Sharaf)',
          debitGold: 0,
          creditGold: additionalGoldAmount,
          debitUSD: 0,
          creditUSD: 0,
          goldPriceRef: issueData.goldPriceRef || 0
        }
      ],
      referenceType: 'challan',
      referenceId: challanId,
      createdBy
    });
  }
  
  /**
   * 8. Record Manufacturer Payment (Pay Making Charges in USD)
   * Business Flow: BRD_GoldSmith_v2.md Section 3.12
   * Accounting Entry: BRD_GoldSmith_v2.md Section 3.12
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 9.1
   */
  async recordManufacturerPayment(paymentData) {
    const { paymentId, amountUSD, manufacturerName, manufacturerAccountCode, createdBy } = paymentData;
    
    return await this.recordTransaction({
      description: `Payment to ${manufacturerName} for making charges`,
      lines: [
        {
          accountCode: manufacturerAccountCode || '2101', // Manufacturer-specific payable account
          accountName: `${manufacturerName} - Payables`,
          debitGold: 0,
          creditGold: 0,
          debitUSD: amountUSD,
          creditUSD: 0,
          goldPriceRef: 0
        },
        {
          accountCode: '1201',
          accountName: 'Cash/Bank',
          debitGold: 0,
          creditGold: 0,
          debitUSD: 0,
          creditUSD: amountUSD,
          goldPriceRef: 0
        }
      ],
      referenceType: 'payment',
      referenceId: paymentId,
      createdBy
    });
  }
  
  /**
   * Get account balance by account code
   * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 2.1
   */
  async getAccountBalance(accountCode) {
    const accountRef = collection(db, `${basePath}/accounts`);
    const q = query(accountRef, where('accountCode', '==', accountCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error(`Account not found: ${accountCode}`);
    }
    
    const account = snapshot.docs[0].data();
    return {
      accountCode: account.accountCode,
      accountName: account.accountName,
      balance: account.balance,
      unit: account.unit,
      normalBalance: account.normalBalance
    };
  }
}

export default new AccountingEngine();
```

### 2.3 Chart of Accounts Initialization

**File:** `src/utils/initializeChartOfAccounts.js`

```javascript
import { db } from '@/app/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;
const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

/**
 * Initialize default chart of accounts (15 system accounts)
 * ACCOUNTS from DatabaseInfo_GoldSmith_v2.md Section 2.2
 * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 2.1
 */
export async function initializeChartOfAccounts() {
  const accountsRef = collection(db, `${basePath}/accounts`);
  
  // Check if accounts already exist
  const snapshot = await getDocs(accountsRef);
  if (!snapshot.empty) {
    console.log('Chart of accounts already initialized');
    return { success: true, message: 'Already initialized' };
  }
  
  // Default accounts from DatabaseInfo_GoldSmith_v2.md Section 2.2
  const defaultAccounts = [
    // Assets (1000-1999)
    { accountCode: "1000", accountName: "ASSETS", accountType: "Asset", parentCode: null, level: 0, unit: "mixed", normalBalance: "debit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "1101", accountName: "Gold Bank (Sharaf)", accountType: "Asset", parentCode: "1000", level: 1, unit: "grams", normalBalance: "debit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "1102", accountName: "Gold in Transit to Manufacturers", accountType: "Asset", parentCode: "1000", level: 1, unit: "grams", normalBalance: "debit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "1103", accountName: "Finished Goods Inventory", accountType: "Asset", parentCode: "1000", level: 1, unit: "grams", normalBalance: "debit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "1201", accountName: "Cash/Bank", accountType: "Asset", parentCode: "1000", level: 1, unit: "USD", normalBalance: "debit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "1301", accountName: "Customer Receivables", accountType: "Asset", parentCode: "1000", level: 1, unit: "grams", normalBalance: "debit", balance: 0, isSystem: true, isActive: true },
    
    // Liabilities (2000-2999)
    { accountCode: "2000", accountName: "LIABILITIES", accountType: "Liability", parentCode: null, level: 0, unit: "mixed", normalBalance: "credit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "2101", accountName: "Manufacturer Payables - Making Charges", accountType: "Liability", parentCode: "2000", level: 1, unit: "USD", normalBalance: "credit", balance: 0, isSystem: true, isActive: true },
    
    // Equity (3000-3999)
    { accountCode: "3000", accountName: "EQUITY", accountType: "Equity", parentCode: null, level: 0, unit: "mixed", normalBalance: "credit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "3101", accountName: "Owner's Capital", accountType: "Equity", parentCode: "3000", level: 1, unit: "mixed", normalBalance: "credit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "3201", accountName: "Current Year Profit/Loss", accountType: "Equity", parentCode: "3000", level: 1, unit: "mixed", normalBalance: "credit", balance: 0, isSystem: true, isActive: true },
    
    // Revenue (4000-4999)
    { accountCode: "4000", accountName: "REVENUE", accountType: "Revenue", parentCode: null, level: 0, unit: "mixed", normalBalance: "credit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "4101", accountName: "Commission Income", accountType: "Revenue", parentCode: "4000", level: 1, unit: "grams", normalBalance: "credit", balance: 0, isSystem: true, isActive: true },
    
    // Expenses (5000-5999)
    { accountCode: "5000", accountName: "EXPENSES", accountType: "Expense", parentCode: null, level: 0, unit: "mixed", normalBalance: "debit", balance: 0, isSystem: true, isActive: true },
    { accountCode: "5101", accountName: "Making Charges Expense", accountType: "Expense", parentCode: "5000", level: 1, unit: "USD", normalBalance: "debit", balance: 0, isSystem: true, isActive: true }
  ];
  
  // Insert accounts
  for (const account of defaultAccounts) {
    await addDoc(accountsRef, {
      ...account,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      companyId
    });
  }
  
  console.log('Chart of accounts initialized successfully');
  return { success: true, message: 'Chart of accounts created', count: defaultAccounts.length };
}
```

---

## 3. ORDER MANAGEMENT (GOLD-BASED)

**Reference:** [DatabaseInfo_GoldSmith_v2.md - Section 3](DatabaseInfo_GoldSmith_v2.md#3-orders-collection)

### 3.1 Order Creation

**File:** `src/app/admin/orders/page.js` (existing file - update needed)

```javascript
/**
 * Create new order
 * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 3.1
 */
async function createNewOrder(orderData) {
  const ordersRef = collection(db, `${basePath}/orders`);
  
  // Calculate purity coefficient
  const purityCoefficients = {
    '24k': 1.0,
    '22k': 0.9167,
    '18k': 0.75,
    '14k': 0.5833
  };
  
  const purityCoefficient = purityCoefficients[orderData.karat];
  
  // Calculate pure gold amounts
  const productPureGold = orderData.totalWeight * purityCoefficient;
  const makingChargeTotalUSD = orderData.totalWeight * orderData.makingChargeRateUSD;
  const commissionGold = makingChargeTotalUSD / orderData.goldPriceAtOrder;
  
  // Get customer's prior balance
  const customerDoc = await getDoc(doc(db, `${basePath}/customers`, orderData.customerId));
  const priorGoldBalance = customerDoc.exists() ? customerDoc.data().currentPureGoldBalance : 0;
  
  const totalPureGoldOwed = productPureGold + commissionGold + priorGoldBalance;
  
  // Generate order number
  const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;
  
  // FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 3.1
  const order = {
    orderNumber,
    customerId: orderData.customerId,
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    productName: orderData.productName,
    productType: orderData.productType,
    totalWeight: orderData.totalWeight,
    karat: orderData.karat,
    purityCoefficient,
    productPureGold,
    makingChargeRateUSD: orderData.makingChargeRateUSD,
    makingChargeTotalUSD,
    goldPriceAtOrder: orderData.goldPriceAtOrder,
    commissionGold,
    priorGoldBalance,
    totalPureGoldOwed,
    displayAmountUSD: totalPureGoldOwed * orderData.goldPriceAtOrder,
    manufacturerId: orderData.manufacturerId || null,
    manufacturerName: orderData.manufacturerName || null,
    challanIssued: false,
    challanNumber: null,
    challanDate: null,
    goldIssuedToManufacturer: 0,
    additionalGoldIssued: 0,
    goldReturnedByManufacturer: 0,
    status: 'New Order',
    paymentStatus: 'Not Billed',
    challanAccountingRecorded: false,
    inventoryAccountingRecorded: false,
    billingAccountingRecorded: false,
    paymentAccountingRecorded: false,
    orderDate: Timestamp.now(),
    expectedDeliveryDate: orderData.expectedDeliveryDate || null,
    productReceivedDate: null,
    customerBilledDate: null,
    paymentReceivedDate: null,
    completedDate: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    companyId
  };
  
  const docRef = await addDoc(ordersRef, order);
  
  return { success: true, orderId: docRef.id, orderNumber };
}
```

### 3.2 Order Status Flow

**Status transitions:**
```javascript
const ORDER_STATUS_FLOW = {
  'New Order': ['Challan Issued', 'Cancelled'],
  'Challan Issued': ['In Production'],
  'In Production': ['Product Received'],
  'Product Received': ['Customer Billed'],
  'Customer Billed': ['Payment Received'],
  'Payment Received': ['Completed'],
  'Completed': [],
  'Cancelled': []
};

function canTransitionTo(currentStatus, newStatus) {
  return ORDER_STATUS_FLOW[currentStatus]?.includes(newStatus) || false;
}
```

---

## 4. CHALLAN SYSTEM (GOLD WITHDRAWAL)

**Reference:** [DatabaseInfo_GoldSmith_v2.md - Section 6](DatabaseInfo_GoldSmith_v2.md#6-challans-collection)

### 4.1 Issue Challan

**Function to issue challan for gold withdrawal:**

```javascript
import accountingEngine from '@/utils/accountingEngine';

/**
 * Issue challan for gold withdrawal
 * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 6.1
 */
async function issueChallan(challanData) {
  const challansRef = collection(db, `${basePath}/challans`);
  
  // Generate challan number
  const challanNumber = `CH-${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`;
  
  // FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 6.1
  const challan = {
    challanNumber,
    challanType: 'gold_withdrawal',
    orderId: challanData.orderId,
    customerId: challanData.customerId,
    manufacturerId: challanData.manufacturerId,
    manufacturerName: challanData.manufacturerName,
    pureGoldAmount: challanData.pureGoldAmount,
    purpose: challanData.purpose || `Gold for order ${challanData.orderId}`,
    status: 'issued',
    issuedDate: Timestamp.now(),
    releasedBySharafDate: null,
    accountingRecorded: false,
    accountingEntryId: null,
    sharafReleaseConfirmation: false,
    sharafSignature: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    companyId
  };
  
  const docRef = await addDoc(challansRef, challan);
  
  // Record accounting entry
  const accountingResult = await accountingEngine.recordChallanIssue({
    challanId: docRef.id,
    pureGoldAmount: challanData.pureGoldAmount,
    manufacturerName: challanData.manufacturerName,
    goldPriceRef: challanData.goldPriceRef,
    createdBy: challanData.createdBy
  });
  
  // Update challan with accounting entry ID
  await updateDoc(doc(db, `${basePath}/challans`, docRef.id), {
    accountingRecorded: true,
    accountingEntryId: accountingResult.transactionId
  });
  
  // Update order status
  await updateDoc(doc(db, `${basePath}/orders`, challanData.orderId), {
    status: 'Challan Issued',
    challanIssued: true,
    challanNumber,
    challanDate: Timestamp.now(),
    goldIssuedToManufacturer: challanData.pureGoldAmount,
    challanAccountingRecorded: true,
    updatedAt: Timestamp.now()
  });
  
  return { success: true, challanId: docRef.id, challanNumber };
}
```

---

## 5. BILLING ENGINE (PURE GOLD INVOICES)

**Reference:** [DatabaseInfo_GoldSmith_v2.md - Section 7](DatabaseInfo_GoldSmith_v2.md#7-invoices-collection)

### 5.1 Generate Customer Invoice

```javascript
import accountingEngine from '@/utils/accountingEngine';

/**
 * Generate customer invoice (gold-based)
 * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 7.1
 */
async function generateCustomerInvoice(invoiceData) {
  const invoicesRef = collection(db, `${basePath}/invoices`);
  
  // Generate invoice number
  const invoiceNumber = `INV-${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`;
  
  // Calculate totals
  const totalPureGold = invoiceData.productPureGold + invoiceData.commissionGold + invoiceData.priorBalance;
  
  // FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 7.1
  const invoice = {
    invoiceNumber,
    invoiceType: 'customer_bill',
    orderId: invoiceData.orderId,
    customerId: invoiceData.customerId,
    customerName: invoiceData.customerName,
    productPureGold: invoiceData.productPureGold,
    commissionGold: invoiceData.commissionGold,
    priorBalance: invoiceData.priorBalance,
    totalPureGold,
    goldPriceAtInvoice: invoiceData.goldPriceAtInvoice,
    displayAmountUSD: totalPureGold * invoiceData.goldPriceAtInvoice,
    paidPureGold: 0,
    remainingPureGold: totalPureGold,
    paymentStatus: 'not_paid',
    invoiceDate: Timestamp.now(),
    dueDate: invoiceData.dueDate,
    creditDays: invoiceData.creditDays || 0,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    companyId
  };
  
  const docRef = await addDoc(invoicesRef, invoice);
  
  // Record accounting entry
  await accountingEngine.recordCustomerBilling({
    invoiceId: docRef.id,
    productPureGold: invoiceData.productPureGold,
    commissionGold: invoiceData.commissionGold,
    customerName: invoiceData.customerName,
    goldPriceRef: invoiceData.goldPriceAtInvoice,
    createdBy: invoiceData.createdBy
  });
  
  // Update order status
  await updateDoc(doc(db, `${basePath}/orders`, invoiceData.orderId), {
    status: 'Customer Billed',
    paymentStatus: 'Billed',
    customerBilledDate: Timestamp.now(),
    billingAccountingRecorded: true,
    updatedAt: Timestamp.now()
  });
  
  // Update customer balance
  const customerRef = doc(db, `${basePath}/customers`, invoiceData.customerId);
  const customerDoc = await getDoc(customerRef);
  const customer = customerDoc.data();
  
  await updateDoc(customerRef, {
    currentPureGoldBalance: customer.currentPureGoldBalance + totalPureGold,
    totalPureGoldOrdered: customer.totalPureGoldOrdered + totalPureGold,
    updatedAt: Timestamp.now()
  });
  
  return { success: true, invoiceId: docRef.id, invoiceNumber };
}
```

---

## 6. PAYMENT PROCESSING (GOLD RECEIPTS)

**Reference:** [DatabaseInfo_GoldSmith_v2.md - Section 8](DatabaseInfo_GoldSmith_v2.md#8-payments-collection)

### 6.1 Record Customer Payment (Pure Gold)

```javascript
import accountingEngine from '@/utils/accountingEngine';

/**
 * Record customer payment in pure gold
 * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 8.1
 */
async function recordCustomerPayment(paymentData) {
  const paymentsRef = collection(db, `${basePath}/payments`);
  
  // Generate payment number
  const paymentNumber = `PAY-${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`;
  
  // Get customer's current balance
  const customerRef = doc(db, `${basePath}/customers`, paymentData.customerId);
  const customerDoc = await getDoc(customerRef);
  const customer = customerDoc.data();
  const previousBalance = customer.currentPureGoldBalance;
  const newBalance = previousBalance - paymentData.pureGoldPaid;
  
  // FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 8.1
  const payment = {
    paymentNumber,
    paymentType: 'customer_payment',
    invoiceId: paymentData.invoiceId || null,
    customerId: paymentData.customerId,
    customerName: paymentData.customerName,
    pureGoldPaid: paymentData.pureGoldPaid,
    goldPriceAtPayment: paymentData.goldPriceAtPayment,
    displayAmountUSD: paymentData.pureGoldPaid * paymentData.goldPriceAtPayment,
    paymentMethod: 'gold',
    previousBalance,
    amountPaid: paymentData.pureGoldPaid,
    newBalance,
    depositedToSharaf: false,
    sharafDepositDate: null,
    sharafReceiptNumber: null,
    accountingRecorded: false,
    accountingEntryId: null,
    status: 'pending',
    paymentDate: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    companyId
  };
  
  const docRef = await addDoc(paymentsRef, payment);
  
  // Record accounting entry
  const accountingResult = await accountingEngine.recordCustomerPayment({
    paymentId: docRef.id,
    pureGoldPaid: paymentData.pureGoldPaid,
    customerName: paymentData.customerName,
    goldPriceRef: paymentData.goldPriceAtPayment,
    createdBy: paymentData.createdBy
  });
  
  // Update payment with accounting entry
  await updateDoc(doc(db, `${basePath}/payments`, docRef.id), {
    accountingRecorded: true,
    accountingEntryId: accountingResult.transactionId,
    depositedToSharaf: true,
    sharafDepositDate: Timestamp.now(),
    status: 'completed'
  });
  
  // Update customer balance
  await updateDoc(customerRef, {
    currentPureGoldBalance: newBalance,
    totalPureGoldPaid: customer.totalPureGoldPaid + paymentData.pureGoldPaid,
    updatedAt: Timestamp.now()
  });
  
  // Update invoice if provided
  if (paymentData.invoiceId) {
    const invoiceRef = doc(db, `${basePath}/invoices`, paymentData.invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);
    const invoice = invoiceDoc.data();
    
    const paidPureGold = invoice.paidPureGold + paymentData.pureGoldPaid;
    const remainingPureGold = invoice.totalPureGold - paidPureGold;
    const paymentStatus = remainingPureGold <= 0.001 ? 'paid' : 'partially_paid';
    const status = paymentStatus === 'paid' ? 'paid' : 'active';
    
    await updateDoc(invoiceRef, {
      paidPureGold,
      remainingPureGold,
      paymentStatus,
      status,
      updatedAt: Timestamp.now()
    });
    
    // Update order status if fully paid
    if (paymentStatus === 'paid') {
      await updateDoc(doc(db, `${basePath}/orders`, invoice.orderId), {
        status: 'Payment Received',
        paymentStatus: 'Paid',
        paymentReceivedDate: Timestamp.now(),
        paymentAccountingRecorded: true,
        updatedAt: Timestamp.now()
      });
    }
  }
  
  return { success: true, paymentId: docRef.id, paymentNumber };
}
```

---

## 7. GOLD PRICE API INTEGRATION

**Reference:** [DatabaseInfo_GoldSmith_v2.md - Section 10](DatabaseInfo_GoldSmith_v2.md#10-gold-price-history-collection)

### 7.1 Fetch Gold Price

**File:** `src/utils/goldPriceAPI.js`

```javascript
import { db } from '@/app/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;
const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

/**
 * Fetch current gold price from API
 * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md Section 10.1
 */
export async function fetchCurrentGoldPrice() {
  try {
    // Try goldprice.org first
    const response = await fetch('https://www.goldprice.org/json/gold_price.php');
    const data = await response.json();
    
    const pricePerOunce = parseFloat(data.usd_price_per_oz);
    const pricePerGram = pricePerOunce / 31.15;
    
    // Save to history
    const priceHistoryRef = collection(db, `${basePath}/goldPriceHistory`);
    await addDoc(priceHistoryRef, {
      pricePerOunce,
      pricePerGram,
      currency: 'USD',
      source: 'goldprice.org',
      isManual: false,
      enteredBy: null,
      timestamp: Timestamp.now(),
      companyId
    });
    
    // Update settings
    const settingsRef = collection(db, `${basePath}/settings`);
    const settingsSnapshot = await getDocs(settingsRef);
    
    if (!settingsSnapshot.empty) {
      const settingsDoc = settingsSnapshot.docs[0];
      await updateDoc(doc(db, `${basePath}/settings`, settingsDoc.id), {
        currentGoldPricePerGram: pricePerGram,
        currentGoldPricePerOunce: pricePerOunce,
        lastPriceUpdate: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    
    return { success: true, pricePerGram, pricePerOunce };
    
  } catch (error) {
    console.error('Error fetching gold price:', error);
    throw error;
  }
}

/**
 * Get latest gold price from database
 */
export async function getLatestGoldPrice() {
  const priceHistoryRef = collection(db, `${basePath}/goldPriceHistory`);
  const q = query(priceHistoryRef, orderBy('timestamp', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error('No gold price history found');
  }
  
  const priceDoc = snapshot.docs[0].data();
  return {
    pricePerGram: priceDoc.pricePerGram,
    pricePerOunce: priceDoc.pricePerOunce,
    timestamp: priceDoc.timestamp.toDate()
  };
}

/**
 * Manually update gold price
 */
export async function manuallyUpdateGoldPrice(priceData) {
  const pricePerGram = priceData.pricePerOunce / 31.15;
  
  const priceHistoryRef = collection(db, `${basePath}/goldPriceHistory`);
  await addDoc(priceHistoryRef, {
    pricePerOunce: priceData.pricePerOunce,
    pricePerGram,
    currency: 'USD',
    source: 'manual',
    isManual: true,
    enteredBy: priceData.enteredBy,
    timestamp: Timestamp.now(),
    companyId
  });
  
  return { success: true, pricePerGram, pricePerOunce: priceData.pricePerOunce };
}
```

---

## 8. PURITY CONVERSION UTILITIES

**File:** `src/utils/purityConversion.js`

```javascript
/**
 * Purity conversion coefficients
 * Reference: BRD_GoldSmith_v2.md Section 2.3
 */
export const PURITY_COEFFICIENTS = {
  '24k': 1.0,
  '22k': 0.9167,
  '18k': 0.75,
  '14k': 0.5833
};

/**
 * Convert karat gold to pure gold (24k equivalent)
 */
export function convertToPureGold(weight, karat) {
  const coefficient = PURITY_COEFFICIENTS[karat];
  if (!coefficient) {
    throw new Error(`Invalid karat: ${karat}`);
  }
  return weight * coefficient;
}

/**
 * Convert pure gold to karat gold
 */
export function convertFromPureGold(pureGoldWeight, karat) {
  const coefficient = PURITY_COEFFICIENTS[karat];
  if (!coefficient) {
    throw new Error(`Invalid karat: ${karat}`);
  }
  return pureGoldWeight / coefficient;
}

/**
 * Calculate commission in gold from USD amount
 */
export function calculateCommissionGold(commissionUSD, goldPricePerGram) {
  return commissionUSD / goldPricePerGram;
}

/**
 * Display gold amount with USD reference
 */
export function formatGoldWithUSD(goldGrams, goldPricePerGram) {
  const usdValue = goldGrams * goldPricePerGram;
  return {
    gold: `${goldGrams.toFixed(3)}g`,
    usd: `$${usdValue.toFixed(2)}`,
    formatted: `${goldGrams.toFixed(3)}g (≈ $${usdValue.toFixed(2)})`
  };
}
```

---

## 9. DASHBOARD KPIs

**File:** `src/app/admin/dashboard/page.js` (update needed)

```javascript
/**
 * Calculate dashboard KPIs (gold-based)
 * FIELD NAMES from DatabaseInfo_GoldSmith_v2.md
 */
async function calculateDashboardKPIs() {
  // Get account balances
  const goldBankBalance = await accountingEngine.getAccountBalance('1101');
  const goldInTransit = await accountingEngine.getAccountBalance('1102');
  const finishedGoods = await accountingEngine.getAccountBalance('1103');
  const customerReceivables = await accountingEngine.getAccountBalance('1301');
  const manufacturerPayables = await accountingEngine.getAccountBalance('2101');
  const commissionIncome = await accountingEngine.getAccountBalance('4101');
  
  // Get current gold price
  const goldPrice = await getLatestGoldPrice();
  
  // Calculate totals
  const totalGoldAssets = goldBankBalance.balance + goldInTransit.balance + finishedGoods.balance;
  const totalGoldReceivables = customerReceivables.balance;
  
  return {
    goldBank: {
      grams: goldBankBalance.balance,
      usd: goldBankBalance.balance * goldPrice.pricePerGram
    },
    goldInTransit: {
      grams: goldInTransit.balance,
      usd: goldInTransit.balance * goldPrice.pricePerGram
    },
    finishedGoods: {
      grams: finishedGoods.balance,
      usd: finishedGoods.balance * goldPrice.pricePerGram
    },
    customerReceivables: {
      grams: customerReceivables.balance,
      usd: customerReceivables.balance * goldPrice.pricePerGram
    },
    manufacturerPayables: {
      usd: manufacturerPayables.balance
    },
    commissionIncome: {
      grams: Math.abs(commissionIncome.balance),
      usd: Math.abs(commissionIncome.balance) * goldPrice.pricePerGram
    },
    totalGoldAssets: {
      grams: totalGoldAssets,
      usd: totalGoldAssets * goldPrice.pricePerGram
    },
    currentGoldPrice: goldPrice
  };
}
```

---

## 10. SIMPLIFIED ADMIN MENU

**File:** `src/app/admin/AdminLayout.js` (update needed)

```javascript
/**
 * Simplified admin menu - ONLY 3 items
 * Reference: BRD_GoldSmith_v2.md Application Menu Structure
 */
export default function AdminLayout({ children }) {
  const menuItems = [
    {
      name: 'Dashboard',
      icon: '📊',
      path: '/admin/dashboard',
      description: 'KPIs, gold price, quick stats'
    },
    {
      name: 'Orders',
      icon: '📦',
      path: '/admin/orders',
      description: 'Complete order lifecycle management'
    },
    {
      name: 'Billing',
      icon: '💰',
      path: '/admin/billing',
      description: 'Invoice generation, payment receipts'
    }
  ];
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white">
        <nav className="p-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="block p-3 mb-2 rounded hover:bg-gray-700"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="ml-2">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
```

---

## 4. GOLD PRICE MANAGEMENT SYSTEM

**BRD Reference:** [BRD Section 1: Gold Price Management](BRD_GoldSmith_v2.md#1-gold-price-management-system)  
**Database Reference:** [DB Section 10: Gold Price History](DatabaseInfo_GoldSmith_v2.md#10-gold-price-history-collection)

### 4.1 Dual-Entry Price System (Ounce ↔ Gram)

**File:** `src/components/GoldPriceManager.js`

```javascript
/**
 * Gold Price Manager with reversible entry
 * BRD Reference: Section 1.1 - Gold Price Entry Interface
 */
export default function GoldPriceManager() {
  const [pricePerOunce, setPricePerOunce] = useState(4530.00);
  const [pricePerGram, setPricePerGram] = useState(145.43);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [source, setSource] = useState('manual');

  // Auto-calculate gram price when ounce price changes
  const handleOunceChange = (value) => {
    setPricePerOunce(value);
    setPricePerGram((value / 31.15).toFixed(2));
  };

  // Auto-calculate ounce price when gram price changes
  const handleGramChange = (value) => {
    setPricePerGram(value);
    setPricePerOunce((value * 31.15).toFixed(2));
  };

  // Fetch from API
  const refreshFromAPI = async () => {
    const result = await fetchCurrentGoldPrice();
    if (result.success) {
      setPricePerOunce(result.pricePerOunce);
      setPricePerGram(result.pricePerGram);
      setSource(result.source);
      setLastUpdated(new Date());
    }
  };

  // Save to database
  const savePrice = async () => {
    await manuallyUpdateGoldPrice({
      pricePerOunce: parseFloat(pricePerOunce),
      updatedBy: currentUser.uid
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Gold Price Update</h2>
      
      {/* Reversible Entry */}
      <div className="space-y-4">
        <div>
          <label>Price per Ounce:</label>
          <input
            type="number"
            value={pricePerOunce}
            onChange={(e) => handleOunceChange(e.target.value)}
            className="border p-2 rounded"
          />
          <span className="ml-2">↕ Auto-calculate</span>
        </div>

        <div>
          <label>Price per Gram:</label>
          <input
            type="number"
            value={pricePerGram}
            onChange={(e) => handleGramChange(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div className="text-sm text-gray-600">
          Last Updated: {lastUpdated?.toLocaleString() || 'Not set'}
          <br />
          Source: {source}
        </div>

        <div className="flex gap-4">
          <button onClick={refreshFromAPI} className="bg-blue-500 text-white px-4 py-2 rounded">
            Refresh from API
          </button>
          <button onClick={savePrice} className="bg-green-500 text-white px-4 py-2 rounded">
            Save Price
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4.2 USD Payment Conversion to Pure Gold

**BRD Reference:** [BRD Section 1.3: USD Payment Conversion](BRD_GoldSmith_v2.md#13-usd-payment-conversion-to-pure-gold-flexible-customer-payments)

**File:** `src/utils/paymentConversion.js`

```javascript
/**
 * Convert USD payment to equivalent pure gold grams
 * Supports price adjustment for negotiation
 */
export function convertUSDToGold(usdAmount, goldPricePerGram, adjustedPrice = null) {
  const priceToUse = adjustedPrice || goldPricePerGram;
  const equivalentGold = usdAmount / priceToUse;
  
  return {
    usdAmount,
    goldPriceUsed: priceToUse,
    equivalentGoldGrams: parseFloat(equivalentGold.toFixed(3)),
    isAdjusted: adjustedPrice !== null,
    adjustment: adjustedPrice ? {
      marketPrice: goldPricePerGram,
      negotiatedPrice: adjustedPrice,
      difference: adjustedPrice - goldPricePerGram
    } : null
  };
}

/**
 * Calculate mixed payment (gold + USD)
 */
export function calculateMixedPayment(goldReceived, usdReceived, currentGoldPrice, adjustedPrice = null) {
  const usdConversion = convertUSDToGold(usdReceived, currentGoldPrice, adjustedPrice);
  const totalEquivalentGold = goldReceived + usdConversion.equivalentGoldGrams;
  
  return {
    goldReceived,
    usdReceived,
    usdEquivalentGold: usdConversion.equivalentGoldGrams,
    totalPaymentGold: parseFloat(totalEquivalentGold.toFixed(3)),
    goldPriceUsed: usdConversion.goldPriceUsed,
    isAdjusted: usdConversion.isAdjusted,
    breakdown: {
      physicalGold: goldReceived,
      convertedFromUSD: usdConversion.equivalentGoldGrams
    }
  };
}
```

**Payment Entry Component:**

```javascript
/**
 * Flexible payment entry supporting gold, USD, or mixed
 * BRD Reference: Section 1.3 - USD Payment Conversion Interface
 */
export default function PaymentEntryForm({ customerBalance, onSubmit }) {
  const [paymentMethod, setPaymentMethod] = useState('gold'); // 'gold', 'usd', 'mixed'
  const [goldReceived, setGoldReceived] = useState(0);
  const [usdReceived, setUsdReceived] = useState(0);
  const [currentGoldPrice, setCurrentGoldPrice] = useState(145.43);
  const [adjustedPrice, setAdjustedPrice] = useState(null);
  const [showPriceAdjustment, setShowPriceAdjustment] = useState(false);

  // Calculate equivalent gold from USD
  const usdEquivalentGold = usdReceived / (adjustedPrice || currentGoldPrice);
  const totalPaymentGold = paymentMethod === 'mixed' 
    ? goldReceived + usdEquivalentGold 
    : paymentMethod === 'gold' ? goldReceived : usdEquivalentGold;

  const handleSubmit = () => {
    const paymentData = {
      paymentMethod,
      goldReceived: paymentMethod !== 'usd' ? goldReceived : 0,
      usdReceived: paymentMethod !== 'gold' ? usdReceived : 0,
      totalPaymentGold,
      goldPriceUsed: adjustedPrice || currentGoldPrice,
      priceAdjustment: adjustedPrice ? {
        marketPrice: currentGoldPrice,
        negotiatedPrice: adjustedPrice,
        reason: 'Customer negotiation'
      } : null
    };
    onSubmit(paymentData);
  };

  return (
    <div className="p-6 bg-white rounded-lg">
      <h3 className="text-lg font-bold mb-4">Customer Payment Entry</h3>
      <p>Outstanding: {customerBalance.toFixed(3)}g pure gold</p>

      {/* Payment Method Selection */}
      <div className="mt-4">
        <label className="block mb-2">Payment Method:</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border p-2 rounded">
          <option value="gold">Pure Gold Only</option>
          <option value="usd">USD Cash Only</option>
          <option value="mixed">Mixed (Gold + USD)</option>
        </select>
      </div>

      {/* Gold Entry */}
      {paymentMethod !== 'usd' && (
        <div className="mt-4">
          <label>Gold Received (grams):</label>
          <input
            type="number"
            step="0.001"
            value={goldReceived}
            onChange={(e) => setGoldReceived(parseFloat(e.target.value) || 0)}
            className="border p-2 rounded w-full"
          />
        </div>
      )}

      {/* USD Entry */}
      {paymentMethod !== 'gold' && (
        <div className="mt-4">
          <label>USD Received:</label>
          <input
            type="number"
            step="0.01"
            value={usdReceived}
            onChange={(e) => setUsdReceived(parseFloat(e.target.value) || 0)}
            className="border p-2 rounded w-full"
          />
          <div className="mt-2 text-sm text-gray-600">
            Current Gold Price: ${currentGoldPrice}/g
            <br />
            Equivalent Gold: {usdEquivalentGold.toFixed(3)}g grams
          </div>

          {/* Price Adjustment Option */}
          <button
            onClick={() => setShowPriceAdjustment(!showPriceAdjustment)}
            className="mt-2 text-blue-500 underline"
          >
            Adjust Price for Negotiation
          </button>

          {showPriceAdjustment && (
            <div className="mt-2 p-4 bg-gray-100 rounded">
              <label>Negotiated Price ($/g):</label>
              <input
                type="number"
                step="0.01"
                value={adjustedPrice || currentGoldPrice}
                onChange={(e) => setAdjustedPrice(parseFloat(e.target.value))}
                className="border p-2 rounded w-full"
              />
              <p className="text-sm mt-2">
                Market: ${currentGoldPrice}/g → Negotiated: ${adjustedPrice || currentGoldPrice}/g
                <br />
                New Equivalent: {(usdReceived / (adjustedPrice || currentGoldPrice)).toFixed(3)}g
              </p>
            </div>
          )}
        </div>
      )}

      {/* Total Payment Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h4 className="font-bold">Total Payment:</h4>
        <p className="text-2xl">{totalPaymentGold.toFixed(3)}g pure gold</p>
        {paymentMethod === 'mixed' && (
          <p className="text-sm text-gray-600">
            ({goldReceived.toFixed(3)}g physical + {usdEquivalentGold.toFixed(3)}g from USD)
          </p>
        )}
      </div>

      <button onClick={handleSubmit} className="mt-4 bg-green-500 text-white px-6 py-2 rounded">
        Record Payment
      </button>
    </div>
  );
}
```

---

## 5. MULTIPLE GOLD BANK (SHARAF) SUPPORT

**BRD Reference:** [BRD Section 2.3: Gold Bank Account Creation](BRD_GoldSmith_v2.md#-gold-bank-account-creation---business-entity-trigger)  
**Database Reference:** [DB Section 5: Gold Banks](DatabaseInfo_GoldSmith_v2.md#5-gold-banks-collection)

### 5.1 Gold Bank Management

**File:** `src/app/admin/goldbanks/page.js`

```javascript
/**
 * Manage multiple Sharaf Gold Banks
 * Each bank has separate custody account for tracking
 */
export default function GoldBanksPage() {
  const [goldBanks, setGoldBanks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Create new gold bank
  const createGoldBank = async (bankData) => {
    const goldBanksRef = collection(db, `${basePath}/goldBanks`);
    
    const goldBank = {
      bankName: bankData.bankName,
      branchName: bankData.branchName,
      contactPerson: bankData.contactPerson,
      phoneNumber: bankData.phoneNumber,
      address: bankData.address,
      currentGoldBalance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      companyId
    };

    const docRef = await addDoc(goldBanksRef, goldBank);

    // Auto-create accounting custody account
    await createGoldBankAccount(docRef.id, bankData.bankName);

    return { success: true, goldBankId: docRef.id };
  };

  // Auto-create gold custody account
  const createGoldBankAccount = async (goldBankId, bankName) => {
    const accountsRef = collection(db, `${basePath}/accounts`);
    
    await addDoc(accountsRef, {
      accountCode: `BANK-${goldBankId.slice(0, 6)}`,
      accountName: `Gold Bank - ${bankName}`,
      accountType: 'Asset',
      parentCode: '1101',
      level: 2,
      unit: 'grams',
      normalBalance: 'debit',
      balance: 0,
      isSystem: false,
      isActive: true,
      linkedEntityType: 'goldBank',
      linkedEntityId: goldBankId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      companyId
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gold Banks Management</h1>
      <p className="mb-4">Manage multiple Sharaf Gold Bank locations for gold custody</p>

      <button
        onClick={() => setShowAddForm(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        + Add Gold Bank
      </button>

      {/* Gold Banks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goldBanks.map((bank) => (
          <div key={bank.id} className="border rounded-lg p-4">
            <h3 className="font-bold">{bank.bankName}</h3>
            <p className="text-sm text-gray-600">{bank.branchName}</p>
            <div className="mt-2">
              <p>Current Balance: <span className="font-bold">{bank.currentGoldBalance.toFixed(3)}g</span></p>
              <p className="text-sm">Total Deposited: {bank.totalDeposited.toFixed(3)}g</p>
              <p className="text-sm">Total Withdrawn: {bank.totalWithdrawn.toFixed(3)}g</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.2 Challan with Specific Sharaf Bank

**File:** `src/app/admin/orders/IssueChallanModal.js`

```javascript
/**
 * Issue challan with specific Sharaf bank selection
 * BRD Reference: Multiple Sharaf support
 */
export default function IssueChallanModal({ orderId, pureGoldRequired, onClose }) {
  const [goldBanks, setGoldBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState('');

  useEffect(() => {
    // Load available gold banks
    loadGoldBanks();
  }, []);

  const issueChallan = async () => {
    const selectedBank = goldBanks.find(b => b.id === selectedBankId);
    
    // Check if bank has sufficient gold
    if (selectedBank.currentGoldBalance < pureGoldRequired) {
      alert('Insufficient gold balance in selected bank');
      return;
    }

    const challanData = {
      orderId,
      goldBankId: selectedBankId,
      goldBankName: selectedBank.bankName,
      pureGoldAmount: pureGoldRequired,
      manufacturerId: order.manufacturerId,
      manufacturerName: order.manufacturerName,
      createdBy: currentUser.uid
    };

    await issueChallan(challanData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Issue Gold Challan</h2>

        <div className="mb-4">
          <label className="block mb-2">Select Sharaf Gold Bank:</label>
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Select Bank --</option>
            {goldBanks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.bankName} - {bank.branchName} (Balance: {bank.currentGoldBalance.toFixed(3)}g)
              </option>
            ))}
          </select>
        </div>

        <p className="mb-4">
          Gold Required: <span className="font-bold">{pureGoldRequired.toFixed(3)}g</span>
        </p>

        <div className="flex gap-4">
          <button onClick={issueChallan} className="bg-green-500 text-white px-4 py-2 rounded">
            Issue Challan
          </button>
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. ORDER MANAGEMENT (GOLD-BASED)

**BRD Reference:** [BRD Section 4: Order Management](BRD_GoldSmith_v2.md#4-order-management-pure-gold-based)  
**Database Reference:** [DB Section 3: Orders](DatabaseInfo_GoldSmith_v2.md#3-orders-collection)

### 6.1 Order Creation Interface

**File:** `src/app/admin/orders/OrderForm.js`

```javascript
/**
 * Order creation with automatic pure gold calculation
 * BRD Reference: Section 4.2 - Order Entry Interface
 */
export default function OrderForm() {
  const [formData, setFormData] = useState({
    customerId: '',
    productName: '',
    karat: '18k',
    totalWeight: 0,
    makingChargeRateUSD: 0
  });
  const [goldPrice, setGoldPrice] = useState(145.43);
  const [priorBalance, setPriorBalance] = useState(0);

  // Automatic calculations
  const purityCoefficient = { '24k': 1.0, '22k': 0.9167, '18k': 0.75, '14k': 0.5833 }[formData.karat];
  const productPureGold = formData.totalWeight * purityCoefficient;
  const makingChargeTotalUSD = formData.totalWeight * formData.makingChargeRateUSD;
  const commissionGold = makingChargeTotalUSD / goldPrice;
  const totalPureGoldOwed = productPureGold + commissionGold + priorBalance;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">New Order - Pure Gold Accounting</h2>

      {/* Customer Selection */}
      <div className="mb-4">
        <label>Customer:</label>
        <select
          value={formData.customerId}
          onChange={(e) => {
            setFormData({ ...formData, customerId: e.target.value });
            loadCustomerBalance(e.target.value);
          }}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Select Customer --</option>
          {/* Customer options */}
        </select>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Product Name:</label>
          <input
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Gold Karat:</label>
          <select
            value={formData.karat}
            onChange={(e) => setFormData({ ...formData, karat: e.target.value })}
            className="border p-2 rounded w-full"
          >
            <option value="24k">24k (100%)</option>
            <option value="22k">22k (91.67%)</option>
            <option value="18k">18k (75%)</option>
            <option value="14k">14k (58.33%)</option>
          </select>
        </div>

        <div>
          <label>Weight (گرام):</label>
          <input
            type="number"
            step="0.001"
            value={formData.totalWeight}
            onChange={(e) => setFormData({ ...formData, totalWeight: parseFloat(e.target.value) || 0 })}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label>Making Charge Rate ($/g):</label>
          <input
            type="number"
            step="0.01"
            value={formData.makingChargeRateUSD}
            onChange={(e) => setFormData({ ...formData, makingChargeRateUSD: parseFloat(e.target.value) || 0 })}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* Pure Gold Calculation (تیزابی) */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">Pure Gold Calculation (تیزابی)</h3>
        <div className="space-y-1">
          <p>Product Pure Gold: {productPureGold.toFixed(3)}g (تیزابی جنس)</p>
          <p>Commission (in Gold): {commissionGold.toFixed(3)}g (تیزابی اجره)</p>
          <p>Prior Balance: {priorBalance.toFixed(3)}g (تیزابی گذشته)</p>
          <hr className="my-2" />
          <p className="text-lg font-bold">
            Total Pure Gold: {totalPureGoldOwed.toFixed(3)}g (مجموعه تیزابی)
          </p>
        </div>
      </div>

      {/* Reference Display */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Reference Display (For Reference Only)</h3>
        <p>Gold Price: ${goldPrice}/gram</p>
        <p>Equivalent: ${(totalPureGoldOwed * goldPrice).toFixed(2)} USD</p>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 bg-green-500 text-white px-6 py-3 rounded"
      >
        Generate Order Receipt
      </button>
    </div>
  );
}
```

---

## 7. CHALLAN SYSTEM (GOLD WITHDRAWAL)

**BRD Reference:** [BRD Section 5: Challan/Voucher Management](BRD_GoldSmith_v2.md#5-challanvoucher-management)  
**Database Reference:** [DB Section 6: Challans](DatabaseInfo_GoldSmith_v2.md#6-challans-collection)

### 7.1 Challan Issuance with Per-Manufacturer Tracking

**File:** `src/utils/challanEngine.js`

```javascript
/**
 * Issue gold withdrawal challan with per-manufacturer tracking
 * BRD Reference: Section 5.1 - Gold Withdrawal Challan
 */
export async function issueChallan(challanData) {
  const { orderId, goldBankId, pureGoldAmount, manufacturerId, manufacturerName, createdBy } = challanData;

  // Generate challan number
  const challanNumber = `CH-${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`;

  // Create challan record
  const challansRef = collection(db, `${basePath}/challans`);
  const challan = {
    challanNumber,
    orderId,
    goldBankId,
    goldBankName: challanData.goldBankName,
    manufacturerId,
    manufacturerName,
    pureGoldAmount,
    status: 'issued',
    issuedAt: Timestamp.now(),
    releasedAt: null,
    returnedAt: null,
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    companyId
  };

  const docRef = await addDoc(challansRef, challan);

  // Record accounting entry with per-manufacturer sub-account
  await accountingEngine.recordChallanIssue({
    challanId: docRef.id,
    pureGoldAmount,
    manufacturerId,
    manufacturerName,
    goldBankId,
    createdBy
  });

  // Update order status
  await updateDoc(doc(db, `${basePath}/orders`, orderId), {
    status: 'Challan Issued',
    challanId: docRef.id,
    challanNumber,
    challanIssuedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  // Update gold bank balance
  await updateGoldBankBalance(goldBankId, -pureGoldAmount);

  return { success: true, challanId: docRef.id, challanNumber };
}

/**
 * Accounting entry with per-manufacturer gold in transit tracking
 */
async function recordChallanIssueAccounting(challanData) {
  const { manufacturerId, manufacturerName, pureGoldAmount, goldBankId } = challanData;

  // Get or create manufacturer-specific gold in transit account
  const manufacturerAccountCode = await getOrCreateManufacturerAccount(manufacturerId, manufacturerName);

  return await accountingEngine.recordTransaction({
    description: `Gold challan issued to ${manufacturerName}`,
    lines: [
      {
        accountCode: manufacturerAccountCode, // e.g., "1102-MFG001"
        accountName: `Gold in Transit - ${manufacturerName}`,
        debitGold: pureGoldAmount,
        creditGold: 0,
        debitUSD: 0,
        creditUSD: 0,
        goldPriceRef: 0
      },
      {
        accountCode: `BANK-${goldBankId.slice(0, 6)}`,
        accountName: 'Gold Bank (Sharaf)',
        debitGold: 0,
        creditGold: pureGoldAmount,
        debitUSD: 0,
        creditUSD: 0,
        goldPriceRef: 0
      }
    ],
    referenceType: 'challan',
    referenceId: challanData.challanId,
    createdBy: challanData.createdBy
  });
}

/**
 * Get or create manufacturer-specific sub-account under Gold in Transit
 */
async function getOrCreateManufacturerAccount(manufacturerId, manufacturerName) {
  const accountsRef = collection(db, `${basePath}/accounts`);
  const accountCode = `1102-${manufacturerId.slice(0, 6).toUpperCase()}`;

  // Check if account exists
  const q = query(accountsRef, where('accountCode', '==', accountCode));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return accountCode;
  }

  // Create new manufacturer sub-account
  await addDoc(accountsRef, {
    accountCode,
    accountName: `Gold in Transit - ${manufacturerName}`,
    accountType: 'Asset',
    parentCode: '1102',
    level: 2,
    unit: 'grams',
    normalBalance: 'debit',
    balance: 0,
    isSystem: false,
    isActive: true,
    linkedEntityType: 'manufacturer',
    linkedEntityId: manufacturerId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    companyId
  });

  return accountCode;
}
```

### 7.2 Dynamic Gold Bank Accounting for Challan Issuance

**Updated Implementation:** The challan system now supports dynamic gold bank selection with proper accounting entries.

**Key Features:**
- **Dynamic Gold Bank Selection**: Uses selected gold bank from order (supports multiple Sharaf branches)
- **Manufacturer-Specific Transit Accounts**: Tracks gold transit per manufacturer
- **Real-Time Balance Updates**: Updates both gold bank and manufacturer transit balances

**Implementation in Order Page (`src/app/admin/orders/page.js`):**

```javascript
// Fetch gold bank data dynamically based on order.goldBankId
let goldBankData = null;
let goldBankAccountCode = '1101'; // Default fallback
if (order.goldBankId) {
  const goldBankRef = doc(db, `${basePath}/goldbanks`, order.goldBankId);
  const goldBankSnap = await getDoc(goldBankRef);
  if (goldBankSnap.exists()) {
    goldBankData = { id: goldBankSnap.id, ...goldBankSnap.data() };
    goldBankAccountCode = goldBankData.accountCode || '1101'; // e.g., '1101-BANK-001'
  }
}

// Create accounting entry with dynamic account codes
await accountingEngine.createEntry({
  date: new Date(),
  description: `Gold withdrawal challan ${challanNumber} for Order ${order.id.slice(-8)}`,
  transactionType: 'gold_challan_issued',
  referenceId: challanRef.id,
  referenceType: 'challan',
  entries: [
    {
      accountCode: manufacturerData.goldTransitAccountCode || '1102', // Manufacturer's Gold Transit
      accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
      debit: pureGoldAmount,
      credit: 0,
      balanceType: 'gold'
    },
    {
      accountCode: goldBankAccountCode, // Selected Gold Bank (e.g., '1101-BANK-001')
      accountName: goldBankData ? `${goldBankData.bankName} - Gold Custody` : 'Gold Bank (Sharaf)',
      debit: 0,
      credit: pureGoldAmount,
      balanceType: 'gold'
    }
  ]
});
```

**Account Code Examples:**
- **Gold Bank Accounts**: `1101-BANK-001`, `1101-BANK-002` (different Sharaf branches)
- **Manufacturer Transit**: `1102-MFG-001`, `1102-MFG-002` (per manufacturer)
- **Fallback**: `1101` (default Sharaf), `1102` (global transit)

**Business Impact:**
- Selected Gold Bank balance: -10.500g (gold leaves bank custody)
- Manufacturer Gold Transit balance: +10.500g (gold enters manufacturer transit)
- Manufacturer `goldInTransit` field: +10.500g (tracking field updated)

### 7.2 Additional Gold Challan (Final Weight Adjustments)

**File:** `src/app/admin/orders/page.js` - `createAdditionalGoldChallan` function  
**Trigger:** Plus button (+) in order management interface  
**Purpose:** Issue additional gold challans when manufacturers require extra gold beyond the original order amount for final weight adjustments and manufacturing precision.

**Business Logic:**
- Manufacturers may need additional gold during production for final weight calibration
- System allows issuing supplementary challans without creating new orders
- Tracks additional gold separately from original order amount
- Updates manufacturer's gold in transit balance
- Maintains accounting consistency with dynamic gold bank selection

**Implementation Details:**

```javascript
const createAdditionalGoldChallan = async (order, manufacturerData, additionalGoldAmount) => {
  // 1. Generate sequential challan number (CH-XXX-YYYY)
  // 2. Create challan record with type: 'additional_gold'
  // 3. Update order's additionalChallans array and additionalGoldIssued total
  // 4. Increment manufacturer's goldInTransit field
  // 5. Record accounting entry with dynamic account codes
  
  // Accounting Entry Structure:
  await accountingEngine.createEntry({
    description: `Additional gold challan ${challanNumber} for Order ${order.id.slice(-8)}`,
    transactionType: 'additional_challan',
    entries: [
      {
        accountCode: manufacturerData.goldTransitAccountCode || '1102', // Debit
        accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
        debit: additionalGoldAmount,
        credit: 0,
        balanceType: 'gold'
      },
      {
        accountCode: selectedGoldBankAccountCode, // Credit (dynamic)
        accountName: `${selectedGoldBankName} - Gold Custody`,
        debit: 0,
        credit: additionalGoldAmount,
        balanceType: 'gold'
      }
    ]
  });
};
```

**Database Updates:**
- **Challans Collection:** New document with `challanType: 'additional_gold'`
- **Orders Collection:** Adds challan ID to `additionalChallans[]`, increments `additionalGoldIssued`
- **Manufacturers Collection:** Increments `goldInTransit` field
- **Transactions Collection:** Accounting entry with proper debits/credits

**Accounting Impact:**
- **Debit:** Manufacturer-specific Gold in Transit account (+balance)
- **Credit:** Selected Gold Bank account (-balance)
- Maintains balance sheet accuracy for additional gold withdrawals
- Tracks gold movement separately from original order challans

**User Interface Integration:**
- Accessible via plus (+) button next to manufacturer in order details
- Requires additional gold amount input
- Confirms accounting entry creation
- Updates order status and tracking fields

### 7.3 Remaining Gold Payment Challan (Extra Gold Usage Billing)

**File:** `src/app/admin/orders/page.js` - `createRemainingGoldPaymentChallan` function  
**Trigger:** When manufacturers use extra gold from their stock beyond allocated amounts  
**Purpose:** Bill manufacturers for additional gold consumed during production that exceeds the original challan allocation.

**Business Logic:**
- Manufacturers may consume more gold than originally allocated for production
- System tracks extra gold usage and creates payment challans
- Manufacturers must pay for the additional gold used from their inventory
- Maintains accurate gold inventory tracking and manufacturer billing
- Records as separate transaction from original order challans

**Implementation Details:**

```javascript
const createRemainingGoldPaymentChallan = async (order, manufacturerData, paymentGoldAmount, selectedGoldBankId) => {
  // 1. Generate sequential challan number (CH-XXX-YYYY)
  // 2. Create challan record with type: 'remaining_gold_payment'
  // 3. Update order's remainingGoldPayments array and remainingGoldPaid total
  // 4. Increment manufacturer's goldInTransit field (they owe more gold)
  // 5. Record accounting entry debiting manufacturer's transit account
  
  // Accounting Entry Structure:
  await accountingEngine.createEntry({
    description: `Remaining gold payment challan ${challanNumber} for Order ${order.id.slice(-8)}`,
    transactionType: 'remaining_gold_payment',
    entries: [
      {
        accountCode: manufacturerData.goldTransitAccountCode || '1102', // Debit
        accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
        debit: paymentGoldAmount,
        credit: 0,
        balanceType: 'gold'
      },
      {
        accountCode: '1101', // Credit (Gold Bank)
        accountName: 'Gold Bank (Sharaf)',
        debit: 0,
        credit: paymentGoldAmount,
        balanceType: 'gold'
      }
    ]
  });
};
```

**Database Updates:**
- **Challans Collection:** New document with `challanType: 'remaining_gold_payment'`
- **Orders Collection:** Adds challan ID to `remainingGoldPayments[]`, increments `remainingGoldPaid`
- **Manufacturers Collection:** Increments `goldInTransit` field (increases debt)
- **Transactions Collection:** Accounting entry recording additional gold liability

**Accounting Impact:**
- **Debit:** Manufacturer's Gold in Transit account (+balance, increases liability)
- **Credit:** Gold Bank account (-balance, gold effectively paid)
- Tracks manufacturer debt for extra gold consumption
- Maintains accurate gold inventory and payment tracking

**Business Impact:**
- Manufacturer's gold liability increases by payment amount
- Gold bank balance decreases (gold effectively transferred)
- Order tracks remaining payments separately from original amounts
- Enables proper billing for extra gold usage during manufacturing

### 7.4 Gold Return Processing (Manufacturer Returns)

**File:** `src/app/admin/orders/page.js` - `processGoldReturnFromManufacturer` function  
**Trigger:** When manufacturers return unused gold after production completion  
**Purpose:** Process gold returns from manufacturers, updating inventory and accounting records.

**Business Logic:**
- Manufacturers may return unused gold after completing production
- System records gold return transactions
- Reduces manufacturer's gold in transit balance
- Updates accounting with proper debit/credit entries
- Maintains accurate gold inventory tracking

**Implementation Details:**

```javascript
const processGoldReturnFromManufacturer = async (order, manufacturerData, returnGoldAmount) => {
  // 1. Create gold return record in goldReturns collection
  // 2. Decrease manufacturer's goldInTransit field
  // 3. Record accounting entry: Debit Gold Bank, Credit Gold in Transit
  
  // Accounting Entry Structure:
  await accountingEngine.createEntry({
    description: `Gold return from manufacturer for Order ${order.id.slice(-8)}`,
    transactionType: 'gold_return',
    entries: [
      {
        accountCode: '1101', // Debit (Gold Bank receives gold back)
        accountName: 'Gold Bank (Sharaf)',
        debit: returnGoldAmount,
        credit: 0,
        balanceType: 'gold'
      },
      {
        accountCode: manufacturerData.goldTransitAccountCode || '1102', // Credit
        accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
        debit: 0,
        credit: returnGoldAmount,
        balanceType: 'gold'
      }
    ]
  });
};
```

**Database Updates:**
- **GoldReturns Collection:** New return record with return details
- **Manufacturers Collection:** Decrements `goldInTransit` field
- **Transactions Collection:** Accounting entry for gold return

**Accounting Impact:**
- **Debit:** Gold Bank account (+balance, gold returns to custody)
- **Credit:** Manufacturer's Gold in Transit account (-balance, reduces liability)
- Reverses gold withdrawal transaction
- Maintains accurate gold inventory balances

**Business Impact:**
- Manufacturer's gold liability decreases by return amount
- Gold bank balance increases (gold returns to custody)
- Order production cycle completes with accurate gold tracking
- Enables proper inventory management for returned materials

### 7.5 Pickup Accounting (Order Completion & Commission Payment)

**File:** `src/app/admin/orders/page.js` - `handleConfirmPickup` and `processManufacturerPayment` functions  
**Trigger:** Status change to "Picked Up" in order management  
**Purpose:** Complete order processing with manufacturer commission payment and finished goods inventory accounting.

**Commission Payment Accounting (Two Scenarios):**

**Cash Payment (Immediate):**
- **Debit:** `5101` (Making Charges Expense)
- **Credit:** `1201` (Cash) or `1202` (Bank Account)

**Credit Payment (Pay Later):**
- **Debit:** `5101` (Making Charges Expense)  
- **Credit:** `2101-MFG-XXX` (Manufacturer-Specific Payables Account)

**Finished Goods Receipt Accounting:**
- **Debit:** `1103` (Finished Goods Inventory)
- **Credit:** `1102-MFG-XXX` (Manufacturer's Gold in Transit Account)

**Implementation Details:**

```javascript
// Commission Payment (Credit Scenario)
if (paymentMethod === 'credit') {
  await accountingEngine.createEntry({
    description: `Manufacturer making charges credit for Order ${order.id}`,
    entries: [
      {
        accountCode: '5101', // Making Charges Expense
        accountName: 'Making Charges',
        debit: commissionAmount,
        credit: 0
      },
      {
        accountCode: manufacturerData.accountCode || '2101', // Manufacturer-Specific Account
        accountName: `${manufacturerData.manufacturerName} - Payables`,
        debit: 0,
        credit: commissionAmount
      }
    ]
  });
}

// Finished Goods Receipt
await accountingEngine.createEntry({
  description: `Finished goods receipt from manufacturer for Order ${order.id}`,
  entries: [
    {
      accountCode: '1103', // Finished Goods Inventory
      accountName: 'Finished Goods Inventory',
      debit: finalPureGold,
      credit: 0,
      balanceType: 'gold'
    },
    {
      accountCode: manufacturerData.goldTransitAccountCode || '1102', // Gold in Transit
      accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
      debit: 0,
      credit: finalPureGold,
      balanceType: 'gold'
    }
  ]
});
```

**Database Updates:**
- **Orders Collection:** Status changed to "Picked Up", final weights and commission recorded
- **Manufacturers Collection:** `goldInTransit` reduced by final pure gold used
- **Payments Collection:** Commission payment record created
- **Receipts Collection:** Payment receipt generated
- **Transactions Collection:** Accounting entries for commission and finished goods

**Business Impact:**
- **Cash Payment:** Immediate expense recognition, cash/bank balance reduced
- **Credit Payment:** Expense recognized now, liability created for future payment
- **Finished Goods:** Inventory increased by final product weight
- **Gold Transit:** Manufacturer's gold custody reduced by amount used in production

---

## 8. BILLING ENGINE (PURE GOLD INVOICES)

**BRD Reference:** [BRD Section 3.6: Customer Delivery & Billing](BRD_GoldSmith_v2.md#36-customer-delivery--billing)  
**Database Reference:** [DB Section 7: Invoices](DatabaseInfo_GoldSmith_v2.md#7-invoices-collection)

### 8.1 Generate Customer Invoice

**File:** `src/utils/billingEngine.js`

```javascript
/**
 * Generate customer invoice in pure gold
 * BRD Reference: Section 3.6 - Customer Delivery & Billing
 */
export async function generateCustomerInvoice(invoiceData) {
  const {
    orderId,
    customerId,
    customerName,
    productPureGold,
    commissionGold,
    priorBalance,
    goldPriceAtInvoice,
    createdBy
  } = invoiceData;

  const totalPureGold = productPureGold + commissionGold + priorBalance;
  const invoiceNumber = `INV-${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`;

  // Create invoice
  const invoicesRef = collection(db, `${basePath}/invoices`);
  const invoice = {
    invoiceNumber,
    orderId,
    customerId,
    customerName,
    productPureGold,
    commissionGold,
    priorBalance,
    totalPureGold,
    goldPriceAtInvoice,
    referenceAmountUSD: totalPureGold * goldPriceAtInvoice,
    paidGold: 0,
    remainingGold: totalPureGold,
    status: 'unpaid',
    dueDate: Timestamp.fromDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)), // Net 15 days
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    companyId
  };

  const docRef = await addDoc(invoicesRef, invoice);

  // Record accounting entry
  await accountingEngine.recordCustomerBilling({
    invoiceId: docRef.id,
    productPureGold,
    commissionGold,
    customerName,
    customerId,
    createdBy
  });

  // Update order status
  await updateDoc(doc(db, `${basePath}/orders`, orderId), {
    status: 'Customer Billed',
    invoiceId: docRef.id,
    invoiceNumber,
    billedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  // Update customer balance
  await updateCustomerBalance(customerId, totalPureGold);

  return { success: true, invoiceId: docRef.id, invoiceNumber };
}
```

---

## 9. PAYMENT PROCESSING (FLEXIBLE GOLD + USD)

**BRD Reference:** [BRD Section 1.3: USD Payment Conversion](BRD_GoldSmith_v2.md#13-usd-payment-conversion-to-pure-gold-flexible-customer-payments)  
**Database Reference:** [DB Section 8: Payments](DatabaseInfo_GoldSmith_v2.md#8-payments-collection)

### 9.1 Flexible Payment Recording

**File:** `src/utils/paymentEngine.js`

```javascript
/**
 * Record customer payment with flexible gold/USD options
 * BRD Reference: Section 1.3 - USD Payment Conversion
 */
export async function recordCustomerPayment(paymentData) {
  const {
    customerId,
    invoiceId,
    paymentMethod, // 'gold', 'usd', 'mixed'
    goldReceived,
    usdReceived,
    goldPriceUsed,
    priceAdjustment,
    createdBy
  } = paymentData;

  // Calculate total payment in pure gold equivalent
  let totalPaymentGold = 0;
  let usdEquivalentGold = 0;

  if (paymentMethod === 'gold' || paymentMethod === 'mixed') {
    totalPaymentGold += goldReceived;
  }

  if (paymentMethod === 'usd' || paymentMethod === 'mixed') {
    usdEquivalentGold = usdReceived / goldPriceUsed;
    totalPaymentGold += usdEquivalentGold;
  }

  const paymentNumber = `PAY-${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`;

  // Create payment record
  const paymentsRef = collection(db, `${basePath}/payments`);
  const payment = {
    paymentNumber,
    customerId,
    invoiceId,
    paymentMethod,
    goldReceived,
    usdReceived,
    usdEquivalentGold,
    totalPaymentGold,
    goldPriceUsed,
    priceAdjustment,
    status: 'completed',
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    companyId
  };

  const docRef = await addDoc(paymentsRef, payment);

  // Record accounting entries (dual entry for mixed payments)
  if (goldReceived > 0) {
    await recordGoldPaymentAccounting(docRef.id, goldReceived, customerId, createdBy);
  }

  if (usdReceived > 0) {
    await recordUSDPaymentAccounting(docRef.id, usdReceived, usdEquivalentGold, goldPriceUsed, customerId, createdBy);
  }

  // Update customer balance
  await updateCustomerBalance(customerId, -totalPaymentGold);

  // Update invoice
  if (invoiceId) {
    await updateInvoicePayment(invoiceId, totalPaymentGold);
  }

  return { success: true, paymentId: docRef.id, paymentNumber, totalPaymentGold };
}

/**
 * Record gold portion of payment
 */
async function recordGoldPaymentAccounting(paymentId, goldAmount, customerId, createdBy) {
  return await accountingEngine.recordTransaction({
    description: `Customer payment - Physical gold received`,
    lines: [
      {
        accountCode: '1101',
        accountName: 'Gold Bank (Sharaf)',
        debitGold: goldAmount,
        creditGold: 0,
        debitUSD: 0,
        creditUSD: 0,
        goldPriceRef: 0
      },
      {
        accountCode: `CUST-${customerId.slice(0, 6)}`,
        accountName: 'Customer Receivables',
        debitGold: 0,
        creditGold: goldAmount,
        debitUSD: 0,
        creditUSD: 0,
        goldPriceRef: 0
      }
    ],
    referenceType: 'payment',
    referenceId: paymentId,
    createdBy
  });
}

/**
 * Record USD portion of payment (dual entry)
 */
async function recordUSDPaymentAccounting(paymentId, usdAmount, equivalentGold, goldPrice, customerId, createdBy) {
  return await accountingEngine.recordTransaction({
    description: `Customer payment - USD cash converted to gold equivalent @ $${goldPrice}/g`,
    lines: [
      {
        accountCode: '1201',
        accountName: 'Cash in Hand',
        debitGold: 0,
        creditGold: 0,
        debitUSD: usdAmount,
        creditUSD: 0,
        goldPriceRef: goldPrice
      },
      {
        accountCode: `CUST-${customerId.slice(0, 6)}`,
        accountName: 'Customer Receivables',
        debitGold: 0,
        creditGold: equivalentGold, // Track as gold equivalent
        debitUSD: 0,
        creditUSD: 0,
        goldPriceRef: goldPrice
      }
    ],
    referenceType: 'payment',
    referenceId: paymentId,
    createdBy
  });
}
```

---

## 10. DASHBOARD & REPORTS (CLIENT VIEW)

**BRD Reference:** [BRD Section 2.8: Financial Reports & Analytics](BRD_GoldSmith_v2.md#28-financial-reports--analytics-client-sees-business-summaries-only)

### 10.1 Client Dashboard KPIs

**File:** `src/app/admin/dashboard/page.js`

```javascript
/**
 * Client dashboard - Business summaries only (no accounting terminology)
 * BRD Reference: Section 2.8 - Client Dashboard
 */
export default function Dashboard() {
  const [kpis, setKPIs] = useState(null);

  useEffect(() => {
    loadDashboardKPIs();
  }, []);

  async function loadDashboardKPIs() {
    // Get account balances
    const goldBank = await accountingEngine.getAccountBalance('1101');
    const goldInTransit = await accountingEngine.getAccountBalance('1102');
    const customerReceivables = await accountingEngine.getAccountBalance('1301');
    const manufacturerPayables = await accountingEngine.getAccountBalance('2101');
    const commissionIncome = await accountingEngine.getAccountBalance('4101');
    
    // Get current gold price
    const goldPrice = await getLatestGoldPrice();
    
    // Calculate totals
    const totalGoldAssets = goldBank.balance + goldInTransit.balance;
    
    setKPIs({
      goldPosition: {
        goldInBank: goldBank.balance,
        goldWithSuppliers: goldInTransit.balance,
        totalGold: totalGoldAssets
      },
      customerOutstanding: {
        totalDue: customerReceivables.balance,
        usdEquivalent: customerReceivables.balance * goldPrice.pricePerGram
      },
      supplierOutstanding: {
        totalOwed: manufacturerPayables.balance
      },
      todayCommission: {
        earned: Math.abs(commissionIncome.balance),
        usdEquivalent: Math.abs(commissionIncome.balance) * goldPrice.pricePerGram
      },
      goldPrice
    });
  }

  if (!kpis) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Gold Position */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-2">🏦 Gold Position</h3>
          <p className="text-2xl font-bold">{kpis.goldPosition.totalGold.toFixed(3)}g</p>
          <p className="text-sm mt-2">Gold in Bank: {kpis.goldPosition.goldInBank.toFixed(3)}g</p>
          <p className="text-sm">Gold with Suppliers: {kpis.goldPosition.goldWithSuppliers.toFixed(3)}g</p>
        </div>

        <div className="bg-green-100 p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-2">👥 Customer Outstanding</h3>
          <p className="text-2xl font-bold">{kpis.customerOutstanding.totalDue.toFixed(3)}g</p>
          <p className="text-sm mt-2">Total Due: {kpis.customerOutstanding.totalDue.toFixed(3)}g pure gold</p>
          <p className="text-sm text-gray-600">≈ ${kpis.customerOutstanding.usdEquivalent.toFixed(2)}</p>
        </div>

        <div className="bg-yellow-100 p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-2">🏭 Supplier Outstanding</h3>
          <p className="text-2xl font-bold">${kpis.supplierOutstanding.totalOwed.toFixed(2)}</p>
          <p className="text-sm mt-2">Total Owed: ${kpis.supplierOutstanding.totalOwed.toFixed(2)} USD</p>
        </div>
      </div>

      {/* Gold Price */}
      <div className="bg-purple-100 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-2">💰 Current Gold Price</h3>
        <div className="flex gap-8">
          <div>
            <p className="text-sm text-gray-600">Per Gram</p>
            <p className="text-3xl font-bold">${kpis.goldPrice.pricePerGram}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Per Ounce</p>
            <p className="text-3xl font-bold">${kpis.goldPrice.pricePerOunce}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Updated</p>
            <p className="text-sm">{kpis.goldPrice.timestamp.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Today's Commission */}
      <div className="bg-pink-100 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-2">📈 Today's Commission</h3>
        <p className="text-2xl font-bold">{kpis.todayCommission.earned.toFixed(3)}g</p>
        <p className="text-sm text-gray-600">≈ ${kpis.todayCommission.usdEquivalent.toFixed(2)}</p>
      </div>

      {/* Payment Flexibility Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">💡 Payment Flexibility</h3>
        <p className="text-sm">Accept gold, USD, or mixed payments - all converted to gold value automatically</p>
      </div>
    </div>
  );
}
```

---

## 11. EXPERT BACKDOOR ACCESS (ACCOUNTING TOOLS)

**BRD Reference:** [BRD Section 2.5: Expert Account Transfer](BRD_GoldSmith_v2.md#25-expert-account-transfer-backdoor-only---client-never-sees) & [BRD Section 2.6: Manual Journal Entries](BRD_GoldSmith_v2.md#26-manual-journal-entries-backdoor-only---client-never-sees)

### 11.1 Expert-Only Accounting Module

**File:** `src/app/admin/accounting/page.js`

```javascript
/**
 * Expert-only accounting module - COMPLETELY HIDDEN from client
 * BRD Reference: Section 2.5 & 2.6 - Expert Backdoor Access
 */
export default function ExpertAccountingModule() {
  const { user } = useAuth();

  // Check expert access
  if (user.role !== 'expert' && !user.permissions?.includes('accounting_access')) {
    return <div>Access Denied</div>;
  }

  const [activeTab, setActiveTab] = useState('balance-sheet');

  return (
    <div className="p-6">
      <div className="bg-red-100 border border-red-400 p-4 rounded mb-4">
        <h2 className="text-xl font-bold">🔒 Expert Accounting Module</h2>
        <p className="text-sm">This module is completely hidden from clients. Use for corrections and reports only.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('balance-sheet')}
          className={`px-4 py-2 ${activeTab === 'balance-sheet' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Balance Sheet
        </button>
        <button
          onClick={() => setActiveTab('profit-loss')}
          className={`px-4 py-2 ${activeTab === 'profit-loss' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Profit & Loss
        </button>
        <button
          onClick={() => setActiveTab('journal-entries')}
          className={`px-4 py-2 ${activeTab === 'journal-entries' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Journal Entries
        </button>
        <button
          onClick={() => setActiveTab('manual-entry')}
          className={`px-4 py-2 ${activeTab === 'manual-entry' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Manual Entry
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'balance-sheet' && <BalanceSheetView />}
      {activeTab === 'profit-loss' && <ProfitLossView />}
      {activeTab === 'journal-entries' && <JournalEntriesView />}
      {activeTab === 'manual-entry' && <ManualJournalEntryForm />}
    </div>
  );
}
```

### 11.2 Manual Journal Entry Form

**File:** `src/app/admin/accounting/ManualJournalEntryForm.js`

```javascript
/**
 * Manual journal entry form - Expert only
 * BRD Reference: Section 2.6 - Manual Journal Entries
 */
export default function ManualJournalEntryForm() {
  const [lines, setLines] = useState([
    { accountCode: '', debitGold: 0, creditGold: 0, debitUSD: 0, creditUSD: 0 },
    { accountCode: '', debitGold: 0, creditGold: 0, debitUSD: 0, creditUSD: 0 }
  ]);
  const [description, setDescription] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(true);

  const addLine = () => {
    setLines([...lines, { accountCode: '', debitGold: 0, creditGold: 0, debitUSD: 0, creditUSD: 0 }]);
  };

  const validateBalance = () => {
    let totalDebitGold = 0, totalCreditGold = 0, totalDebitUSD = 0, totalCreditUSD = 0;
    
    lines.forEach(line => {
      totalDebitGold += parseFloat(line.debitGold) || 0;
      totalCreditGold += parseFloat(line.creditGold) || 0;
      totalDebitUSD += parseFloat(line.debitUSD) || 0;
      totalCreditUSD += parseFloat(line.creditUSD) || 0;
    });

    const goldBalanced = Math.abs(totalDebitGold - totalCreditGold) < 0.001;
    const usdBalanced = Math.abs(totalDebitUSD - totalCreditUSD) < 0.01;

    return { goldBalanced, usdBalanced, totalDebitGold, totalCreditGold, totalDebitUSD, totalCreditUSD };
  };

  const submitEntry = async () => {
    const validation = validateBalance();
    
    if (!validation.goldBalanced || !validation.usdBalanced) {
      alert('Transaction not balanced!');
      return;
    }

    await accountingEngine.recordTransaction({
      description,
      lines: lines.filter(line => line.accountCode),
      referenceType: 'manual_entry',
      referenceId: null,
      createdBy: user.uid,
      requiresApproval
    });

    alert('Manual journal entry recorded successfully');
  };

  const validation = validateBalance();

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Manual Journal Entry</h3>
      
      <div className="mb-4">
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded w-full"
          rows="3"
        />
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">Account</th>
            <th className="border p-2">Debit Gold</th>
            <th className="border p-2">Credit Gold</th>
            <th className="border p-2">Debit USD</th>
            <th className="border p-2">Credit USD</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={index}>
              <td className="border p-2">
                <input
                  type="text"
                  value={line.accountCode}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].accountCode = e.target.value;
                    setLines(newLines);
                  }}
                  className="border p-1 w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  step="0.001"
                  value={line.debitGold}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].debitGold = e.target.value;
                    setLines(newLines);
                  }}
                  className="border p-1 w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  step="0.001"
                  value={line.creditGold}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].creditGold = e.target.value;
                    setLines(newLines);
                  }}
                  className="border p-1 w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  step="0.01"
                  value={line.debitUSD}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].debitUSD = e.target.value;
                    setLines(newLines);
                  }}
                  className="border p-1 w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  type="number"
                  step="0.01"
                  value={line.creditUSD}
                  onChange={(e) => {
                    const newLines = [...lines];
                    newLines[index].creditUSD = e.target.value;
                    setLines(newLines);
                  }}
                  className="border p-1 w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="border p-2 font-bold">Totals:</td>
            <td className="border p-2 font-bold">{validation.totalDebitGold.toFixed(3)}g</td>
            <td className="border p-2 font-bold">{validation.totalCreditGold.toFixed(3)}g</td>
            <td className="border p-2 font-bold">${validation.totalDebitUSD.toFixed(2)}</td>
            <td className="border p-2 font-bold">${validation.totalCreditUSD.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 flex gap-4">
        <button onClick={addLine} className="bg-blue-500 text-white px-4 py-2 rounded">
          + Add Line
        </button>
        
        <div className={`p-2 rounded ${validation.goldBalanced && validation.usdBalanced ? 'bg-green-100' : 'bg-red-100'}`}>
          {validation.goldBalanced ? '✅ Gold Balanced' : '❌ Gold Not Balanced'}
          <br />
          {validation.usdBalanced ? '✅ USD Balanced' : '❌ USD Not Balanced'}
        </div>

        <button
          onClick={submitEntry}
          disabled={!validation.goldBalanced || !validation.usdBalanced}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Submit Journal Entry
        </button>
      </div>
    </div>
  );
}
```

---

## END OF TECHNICAL DOCUMENTATION v2.0

**Next Steps:**
1. Review [TaskList_GoldSmith_v2.md](TaskList_GoldSmith_v2.md) for implementation tasks
2. All field names MUST match [DatabaseInfo_GoldSmith_v2.md](DatabaseInfo_GoldSmith_v2.md)
3. No assumptions - check DatabaseInfo_v2.md before writing ANY code

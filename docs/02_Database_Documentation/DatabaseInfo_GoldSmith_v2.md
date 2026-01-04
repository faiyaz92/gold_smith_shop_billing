# Database Information v2.0
## GOLD SMITH PURE GOLD ACCOUNTING SYSTEM

**Document Version:** 2.0  
**Date:** December 30, 2025  
**Project:** Gold Smith Pure Gold-Based Billing & Management System  
**Database:** Firebase/Firestore (Pure Gold & USD Dual Currency)  
**Business Model:** Gold Bank (Sharaf) Custody + Challan System  

---

## 📋 DOCUMENT NAVIGATION

**📋 Related Documents:**
- **[BRD_GoldSmith_v2.md](BRD_GoldSmith_v2.md)** - Business requirements and workflows
- **[TechnicalDoc_GoldSmith_v2.md](TechnicalDoc_GoldSmith_v2.md)** - Implementation patterns and code
- **[TaskList_GoldSmith_v2.md](TaskList_GoldSmith_v2.md)** - Implementation tasks with AI notes

**🔗 Bidirectional Cross-References:**
| DatabaseInfo v2.0 Section | BRD v2.0 Section | TechnicalDoc v2.0 Section | TaskList v2.0 Section |
|---------------------------|------------------|---------------------------|----------------------|
| [1. Overview](#1-overview) | [Executive Summary](BRD_GoldSmith_v2.md#-executive-summary) | [1. System Overview](TechnicalDoc_GoldSmith_v2.md#1-system-overview) | [1. Foundation](TaskList_GoldSmith_v2.md#1-foundation-phase) |
| [2. Chart of Accounts](#2-chart-of-accounts-collection) | [Section 2](BRD_GoldSmith_v2.md#2-chart-of-accounts-pure-gold--usd-dual-system) | [2. Accounting Engine](TechnicalDoc_GoldSmith_v2.md#2-accounting-engine) | [2. Accounting Setup](TaskList_GoldSmith_v2.md#2-accounting-setup) |
| [3. Orders Collection](#3-orders-collection) | [Section 4](BRD_GoldSmith_v2.md#4-order-management-pure-gold-based) | [3. Order Management](TechnicalDoc_GoldSmith_v2.md#3-order-management) | [3. Order Module](TaskList_GoldSmith_v2.md#3-order-module) |
| [4. Customers Collection](#4-customers-collection) | [Section 6.6](BRD_GoldSmith_v2.md#66-customer-delivery--billing) | [4. Customer Management](TechnicalDoc_GoldSmith_v2.md#4-customer-management) | [4. Customer Module](TaskList_GoldSmith_v2.md#4-customer-module) |
| [5A. Gold Banks](#5a-gold-banks-collection) | [Section 2.3](BRD_GoldSmith_v2.md#-gold-bank-account-creation---business-entity-trigger) | [5. Gold Banks](TechnicalDoc_GoldSmith_v2.md#5-multiple-gold-bank-sharaf-support) | [5A. Gold Banks](TaskList_GoldSmith_v2.md#5a-gold-banks) |
| [5B. Manufacturers](#5b-manufacturers-collection-updated) | [Section 3.3](BRD_GoldSmith_v2.md#33-manufacturer-returns-with-finished-product) | [5. Manufacturer Management](TechnicalDoc_GoldSmith_v2.md#5-manufacturer-management) | [5. Manufacturer Module](TaskList_GoldSmith_v2.md#5-manufacturer-module) |
| [6. Challans Collection](#6-challans-collection) | [Section 5](BRD_GoldSmith_v2.md#5-challanvoucher-management) | [6. Challan System](TechnicalDoc_GoldSmith_v2.md#6-challan-system) | [6. Challan Implementation](TaskList_GoldSmith_v2.md#6-challan-implementation) |
| [7. Invoices Collection](#7-invoices-collection) | [Section 6](BRD_GoldSmith_v2.md#6-billing--payment-management) | [7. Billing Engine](TechnicalDoc_GoldSmith_v2.md#7-billing-engine) | [7. Billing Module](TaskList_GoldSmith_v2.md#7-billing-module) |
| [8. Payments Collection](#8-payments-collection) | [Section 3.7-3.8](BRD_GoldSmith_v2.md#37-customer-pays-in-pure-gold-full-payment) | [8. Payment Processing](TechnicalDoc_GoldSmith_v2.md#8-payment-processing) | [8. Payment Module](TaskList_GoldSmith_v2.md#8-payment-module) |
| [9. Transactions Collection](#9-accounting-transactions-collection) | [Section 3](BRD_GoldSmith_v2.md#3-transaction-types--accounting-entries) | [9. Transaction Engine](TechnicalDoc_GoldSmith_v2.md#9-transaction-engine) | [9. Accounting Implementation](TaskList_GoldSmith_v2.md#9-accounting-implementation) |
| [10. Gold Price History](#10-gold-price-history-collection) | [Section 1](BRD_GoldSmith_v2.md#1-gold-price-management-system) | [4. Gold Price](TechnicalDoc_GoldSmith_v2.md#4-gold-price-management-system) | [10. Gold Price](TaskList_GoldSmith_v2.md#10-gold-price-integration) |
| [11. Users Collection](#11-users-collection) | [Section 2.5-2.6](BRD_GoldSmith_v2.md#25-expert-account-transfer-backdoor-only---client-never-sees) | [11. Expert Backdoor](TechnicalDoc_GoldSmith_v2.md#11-expert-backdoor-access-accounting-tools) | [11. User Management](TaskList_GoldSmith_v2.md#11-user-management) |
| [12. Settings Collection](#12-settings-collection) | [Settings](BRD_GoldSmith_v2.md) | [Settings](TechnicalDoc_GoldSmith_v2.md) | [Settings](TaskList_GoldSmith_v2.md) |

---

## 🚨 CRITICAL: ZERO ASSUMPTIONS POLICY

**This document is the SINGLE SOURCE OF TRUTH for all database structures.**

### TL;DR - Quick Reference Card

**👉 BEFORE WRITING ANY CODE, ANSWER THESE 3 QUESTIONS:**

1. **"What collection am I using?"** → Check [Section 1.3](#13--critical-where-to-fetch-data-ui-reference-table)
2. **"What's the EXACT collection name?"** → Check [Section 1.4](#14-firestore-path-examples-copy-paste-ready)
3. **"What's the EXACT field name?"** → Check collection document structure (Sections 2-12)

**❌ IF YOU CAN'T ANSWER ALL 3, YOU'RE GUESSING. STOP AND CHECK THIS DOCUMENT!**

### Full Rules for Developers/AI:

1. ✅ **ALL collections are defined here** - If not listed, it doesn't exist
2. ✅ **ALL fields are defined here** - Exact field names, data types, validation rules
3. ❌ **NEVER create new collections** without updating this document first
4. ❌ **NEVER add new fields** without updating this document first
5. ❌ **NEVER assume field names** - Always look up exact names here
6. ❌ **NEVER guess data types** - All types explicitly defined
7. ❌ **NEVER fetch unnecessarily** - Check [Section 14](#14--denormalized-data-reference-prevent-unnecessary-fetches) for denormalized data

**DatabaseInfo_GoldSmith_v2.md is the SINGLE SOURCE OF TRUTH!**

---

## 1. OVERVIEW

### 1.1 Database Architecture

**Platform:** Firebase/Firestore  
**Structure:** Multi-tenant with company-based path  
**Base Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}`

**Environment Variable:**
```javascript
NEXT_PUBLIC_COMPANY_ID=goldsmith_001
```

### 1.2 Collection Structure

```
tenantCompanies/{companyId}/
├── accounts/              # Chart of accounts (gold + USD)
├── transactions/          # Accounting journal entries
├── orders/                # Customer orders
├── customers/             # Customer records with gold balances
├── manufacturers/         # Manufacturer records with USD balances
├── goldBanks/             # Gold Bank (Sharaf) custody accounts
├── challans/              # Gold withdrawal challans/vouchers
├── invoices/              # Customer invoices (gold-based)
├── payments/              # Payment receipts (gold-based)
├── goldPriceHistory/      # Gold price tracking
├── settings/              # Company settings
└── users/                 # User authentication and permissions
```

**Total Collections: 12**

### 1.3 🚨 CRITICAL: WHERE TO FETCH DATA (UI REFERENCE TABLE)

**This table prevents AI from guessing collection names!**

| UI Component | Fetch From Collection | Query Example | Reference Section |
|--------------|----------------------|---------------|-------------------|
| **Customer Dropdown (Order Form)** | `customers` | `where('isActive', '==', true)` | [Section 4](#4-customers-collection) |
| **Customer List Page** | `customers` | `orderBy('customerName')` | [Section 4](#4-customers-collection) |
| **Manufacturer Dropdown** | `manufacturers` | `where('isActive', '==', true)` | [Section 5](#5-manufacturers-collection) |
| **Manufacturer List Page** | `manufacturers` | `orderBy('manufacturerName')` | [Section 5](#5-manufacturers-collection) |
| **Gold Bank Dropdown (Challan)** | `goldBanks` | `where('isActive', '==', true)` | [Section 5A](#5a-gold-banks-collection) |
| **Gold Bank List Page** | `goldBanks` | `orderBy('bankName')` | [Section 5A](#5a-gold-banks-collection) |
| **Order List** | `orders` | `orderBy('createdAt', 'desc')` | [Section 3](#3-orders-collection) |
| **Order Details** | `orders` | `doc(orderId)` | [Section 3](#3-orders-collection) |
| **Invoice List** | `invoices` | `orderBy('invoiceDate', 'desc')` | [Section 7](#7-invoices-collection) |
| **Payment History** | `payments` | `where('customerId', '==', customerId)` | [Section 8](#8-payments-collection) |
| **Challan List** | `challans` | `orderBy('issuedDate', 'desc')` | [Section 6](#6-challans-collection) |
| **Gold Price Display** | `goldPriceHistory` | `orderBy('timestamp', 'desc').limit(1)` | [Section 10](#10-gold-price-history-collection) |
| **Dashboard KPIs** | `accounts` | `where('accountCode', 'in', ['1101', '1102', '1301'])` | [Section 2](#2-chart-of-accounts-collection) |
| **User Profile** | `users` | `doc(userId)` | [Section 11](#11-users-collection) |

**❌ NEVER create new collections for these UI components!**  
**❌ NEVER assume collection names - ALWAYS check this table!**  
**❌ NEVER fetch from multiple collections for the same UI component!**

### 1.4 Firestore Path Examples (Copy-Paste Ready)

**Use these EXACT paths in your code:**

```javascript
// Base path - ALWAYS use this
const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;
const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

// Collection references - EXACT names
const customersRef = collection(db, `${basePath}/customers`);           // ✅ CORRECT
const manufacturersRef = collection(db, `${basePath}/manufacturers`);   // ✅ CORRECT
const goldBanksRef = collection(db, `${basePath}/goldBanks`);           // ✅ CORRECT
const ordersRef = collection(db, `${basePath}/orders`);                 // ✅ CORRECT
const challansRef = collection(db, `${basePath}/challans`);             // ✅ CORRECT
const invoicesRef = collection(db, `${basePath}/invoices`);             // ✅ CORRECT
const paymentsRef = collection(db, `${basePath}/payments`);             // ✅ CORRECT
const accountsRef = collection(db, `${basePath}/accounts`);             // ✅ CORRECT
const transactionsRef = collection(db, `${basePath}/transactions`);     // ✅ CORRECT
const goldPriceRef = collection(db, `${basePath}/goldPriceHistory`);    // ✅ CORRECT
const settingsRef = collection(db, `${basePath}/settings`);             // ✅ CORRECT
const usersRef = collection(db, `${basePath}/users`);                   // ✅ CORRECT

// ❌ WRONG - Never use these:
// collection(db, 'customers')                    // Missing basePath!
// collection(db, `${basePath}/customer`)         // Wrong name (singular)!
// collection(db, `${basePath}/Customers`)        // Wrong case!
// collection(db, `${basePath}/customerList`)     // Made-up name!
```

---

## 2. CHART OF ACCOUNTS COLLECTION

**Collection Name:** `accounts`  
**Path:** `tenantCompanies/{companyId}/accounts`  
**Purpose:** Store hierarchical chart of accounts for double-entry accounting

### 2.1 Account Document Structure

```javascript
{
  // Primary Keys
  accountCode: string,              // REQUIRED - Unique code (e.g., "1101", "MAIN-1001")
  accountId: string,                // AUTO - Firestore document ID
  
  // Account Details
  accountName: string,              // REQUIRED - Account name (e.g., "Gold Bank (Sharaf)")
  accountType: string,              // REQUIRED - One of: "Asset", "Liability", "Equity", "Revenue", "Expense"
  parentCode: string,               // OPTIONAL - Parent account code (null for root accounts)
  level: number,                    // REQUIRED - Hierarchy level (0=root, 1=main, 2=sub, etc.)
  
  // Balance Information
  balance: number,                  // REQUIRED - Current balance (can be positive/negative)
  unit: string,                     // REQUIRED - One of: "grams", "USD", "mixed"
  normalBalance: string,            // REQUIRED - One of: "debit", "credit"
  
  // Metadata
  isActive: boolean,                // REQUIRED - Default: true
  isSystem: boolean,                // REQUIRED - true for system accounts (cannot be deleted)
  description: string,              // OPTIONAL - Account description
  
  // Timestamps
  createdAt: Timestamp,             // AUTO
  updatedAt: Timestamp,             // AUTO
  companyId: string                 // REQUIRED - From environment
}
```

### 2.2 Default System Accounts

**MUST be created on company initialization:**

```javascript
// Assets (1000-1999)
[
  { accountCode: "1000", accountName: "ASSETS", accountType: "Asset", parentCode: null, level: 0, unit: "mixed", normalBalance: "debit", isSystem: true },
  { accountCode: "1101", accountName: "Gold Bank (Sharaf)", accountType: "Asset", parentCode: "1000", level: 1, unit: "grams", normalBalance: "debit", isSystem: true },
  { accountCode: "1102", accountName: "Gold in Transit to Manufacturers", accountType: "Asset", parentCode: "1000", level: 1, unit: "grams", normalBalance: "debit", isSystem: true },
  { accountCode: "1103", accountName: "Finished Goods Inventory", accountType: "Asset", parentCode: "1000", level: 1, unit: "grams", normalBalance: "debit", isSystem: true },
  { accountCode: "1201", accountName: "Cash/Bank", accountType: "Asset", parentCode: "1000", level: 1, unit: "USD", normalBalance: "debit", isSystem: true },
  { accountCode: "1301", accountName: "Customer Receivables", accountType: "Asset", parentCode: "1000", level: 1, unit: "grams", normalBalance: "debit", isSystem: true },
]

// Liabilities (2000-2999)
[
  { accountCode: "2000", accountName: "LIABILITIES", accountType: "Liability", parentCode: null, level: 0, unit: "mixed", normalBalance: "credit", isSystem: true },
  { accountCode: "2101", accountName: "Manufacturer Payables - Making Charges", accountType: "Liability", parentCode: "2000", level: 1, unit: "USD", normalBalance: "credit", isSystem: true },
]

// Equity (3000-3999)
[
  { accountCode: "3000", accountName: "EQUITY", accountType: "Equity", parentCode: null, level: 0, unit: "mixed", normalBalance: "credit", isSystem: true },
  { accountCode: "3101", accountName: "Owner's Capital", accountType: "Equity", parentCode: "3000", level: 1, unit: "mixed", normalBalance: "credit", isSystem: true },
  { accountCode: "3201", accountName: "Current Year Profit/Loss", accountType: "Equity", parentCode: "3000", level: 1, unit: "mixed", normalBalance: "credit", isSystem: true },
]

// Revenue (4000-4999)
[
  { accountCode: "4000", accountName: "REVENUE", accountType: "Revenue", parentCode: null, level: 0, unit: "mixed", normalBalance: "credit", isSystem: true },
  { accountCode: "4101", accountName: "Commission Income", accountType: "Revenue", parentCode: "4000", level: 1, unit: "grams", normalBalance: "credit", isSystem: true },
]

// Expenses (5000-5999)
[
  { accountCode: "5000", accountName: "EXPENSES", accountType: "Expense", parentCode: null, level: 0, unit: "mixed", normalBalance: "debit", isSystem: true },
  { accountCode: "5101", accountName: "Making Charges Expense", accountType: "Expense", parentCode: "5000", level: 1, unit: "USD", normalBalance: "debit", isSystem: true },
]
```

**Total System Accounts: 15**

### 2.3 Validation Rules

- `accountCode`: Must be unique, alphanumeric with hyphens
- `accountType`: Must be one of the 5 types
- `unit`: Must be "grams", "USD", or "mixed"
- `normalBalance`: Must be "debit" or "credit"
- `balance`: Can be negative (indicates opposite of normal balance)
- `isSystem`: true accounts cannot be deleted

---

## 3. ORDERS COLLECTION

**Collection Name:** `orders`  
**Path:** `tenantCompanies/{companyId}/orders`  
**Purpose:** Track customer orders from creation to completion

**🚨 CRITICAL:** This is where Orders are stored. NEVER fetch from `order` or `orderList` or `customerOrders` or any other collection name!

### 3.1 Order Document Structure

```javascript
{
  // Primary Keys
  orderId: string,                      // AUTO - Firestore document ID
  orderNumber: string,                  // AUTO - Format: "ORD-YYYYMMDD-XXX"
  
  // Customer Information
  customerId: string,                   // REQUIRED - Reference to customers collection
  customerName: string,                 // REQUIRED - Customer name (denormalized)
  customerPhone: string,                // REQUIRED - Customer phone
  
  // Product Details
  metal: string,                        // REQUIRED - Always "gold" (no other metals for now)
  productName: string,                  // REQUIRED - Product name (e.g., "Bracelet", "Ring", "Necklace")
  productType: string,                  // REQUIRED - Product category (same as productName for now)
  totalWeight: number,                  // REQUIRED - Finished product weight in grams
  karat: string,                        // REQUIRED - One of: "24k", "22k", "18k", "14k"
  purityCoefficient: number,            // REQUIRED - Purity multiplier (24k=1.0, 22k=0.9167, 18k=0.75, 14k=0.5833)
  
  // Pure Gold Calculations
  productPureGold: number,              // REQUIRED - Total weight × purity coefficient (in grams)
  makingChargeRateUSD: number,          // REQUIRED - Making charge per gram in USD
  makingChargeTotalUSD: number,         // REQUIRED - Total weight × making charge rate
  goldPriceAtOrder: number,             // REQUIRED - Gold price per gram at order time (USD)
  commissionGold: number,               // REQUIRED - Making charge total ÷ gold price (in grams)
  priorGoldBalance: number,             // REQUIRED - Customer's prior balance (positive=owed, negative=credit)
  totalPureGoldOwed: number,            // REQUIRED - Product pure gold + commission + prior balance
  
  // Display Reference (Calculated on-demand)
  displayAmountUSD: number,             // OPTIONAL - Total pure gold × gold price (for display only)
  
  // Manufacturer Details
  manufacturerId: string,               // OPTIONAL - Reference to manufacturers collection
  manufacturerName: string,             // OPTIONAL - Manufacturer name (denormalized)
  
  // Gold Movement Tracking
  challanIssued: boolean,               // REQUIRED - Default: false
  challanNumber: string,                // OPTIONAL - Reference to challans collection
  challanDate: Timestamp,               // OPTIONAL - When challan was issued
  goldIssuedToManufacturer: number,     // OPTIONAL - Gold grams sent to manufacturer
  additionalGoldIssued: number,         // OPTIONAL - Extra gold sent (if needed)
  goldReturnedByManufacturer: number,   // OPTIONAL - Excess gold returned
  
  // Status Tracking
  status: string,                       // REQUIRED - One of: "New Order", "Challan Issued", "In Production", "Product Received", "Customer Billed", "Payment Received", "Completed", "Cancelled"
  paymentStatus: string,                // REQUIRED - One of: "Not Billed", "Billed", "Partially Paid", "Paid"
  
  // Accounting Flags
  challanAccountingRecorded: boolean,   // REQUIRED - Default: false
  inventoryAccountingRecorded: boolean, // REQUIRED - Default: false
  billingAccountingRecorded: boolean,   // REQUIRED - Default: false
  paymentAccountingRecorded: boolean,   // REQUIRED - Default: false
  
  // Timestamps
  orderDate: Timestamp,                 // REQUIRED - When order was created
  expectedDeliveryDate: Timestamp,      // OPTIONAL - Expected completion date
  productReceivedDate: Timestamp,       // OPTIONAL - When product received from manufacturer
  customerBilledDate: Timestamp,        // OPTIONAL - When invoice generated
  paymentReceivedDate: Timestamp,       // OPTIONAL - When payment received
  completedDate: Timestamp,             // OPTIONAL - When order fully completed
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  companyId: string                     // REQUIRED - From environment
}
```

### 3.2 Order Status Flow

```
New Order → Challan Issued → In Production → Product Received → Customer Billed → Payment Received → Completed
```

### 3.3 Validation Rules

- `metal`: Must always be "gold" (system is gold-only, no dropdown needed)
- `productName`: Freeform text with auto-suggestions from previous orders (see Section 3.5)
- `karat`: Must be one of "24k", "22k", "18k", "14k"
- `purityCoefficient`: Auto-calculated based on karat
- `status`: Must follow status flow (cannot skip steps)
- `totalPureGoldOwed`: Must equal productPureGold + commissionGold + priorGoldBalance
- `challanNumber`: Required when status = "Challan Issued"

### 3.4 🚨 WHERE TO USE Orders Collection

**✅ CORRECT Usage:**
```javascript
// Order List Page
const ordersQuery = query(
  collection(db, `${basePath}/orders`),
  orderBy('createdAt', 'desc')
);

// Filter by status
const pendingOrdersQuery = query(
  collection(db, `${basePath}/orders`),
  where('status', '==', 'New Order'),
  orderBy('createdAt', 'desc')
);

// Get specific order
const orderDoc = await getDoc(doc(db, `${basePath}/orders`, orderId));

// Order details with customer name (already denormalized in order)
// ✅ Use order.customerName directly - NO NEED to fetch from customers collection
```

**❌ WRONG - Never use these:**
```javascript
// ❌ collection(db, 'order')              // Wrong name (singular)
// ❌ collection(db, 'orderList')          // Made-up name
// ❌ collection(db, 'customerOrders')     // Made-up name
// ❌ collection(db, 'pendingOrders')      // Made-up name
```

### 3.5 🎯 PRODUCT NAME AUTO-SUGGESTION (LOCAL CACHE STRATEGY)

**Purpose:** Provide product name suggestions without querying Firestore on every keystroke.

**Implementation Strategy:**

**Step 1: Initial Load (When Order Window Opens)**
```javascript
// Fetch all distinct product names ONCE
async function loadProductNameCache() {
  const ordersRef = collection(db, `${basePath}/orders`);
  const ordersSnapshot = await getDocs(ordersRef);
  
  // Extract unique product names
  const uniqueNames = [...new Set(
    ordersSnapshot.docs
      .map(doc => doc.data().productName)
      .filter(name => name && name.trim() !== '')
  )].sort();
  
  // Store in React state/context (NOT Firestore query on each type)
  setProductNameCache(uniqueNames);
  // Example result: ["Bangle", "Bracelet", "Earrings", "Necklace", "Ring"]
}
```

**Step 2: User Typing (No Firestore Queries)**
```javascript
// As user types "Br..."
function handleProductNameInput(userInput) {
  // Filter from LOCAL cache only (zero Firestore cost!)
  const suggestions = productNameCache.filter(name =>
    name.toLowerCase().includes(userInput.toLowerCase())
  );
  
  // Show suggestions dropdown
  setSuggestions(suggestions);
  // Result: ["Bracelet", "Bangle"]
}
```

**Step 3: On Save (Update Cache)**
```javascript
// When user saves order with new product name
async function saveOrder(orderData) {
  // Save to Firestore
  await addDoc(collection(db, `${basePath}/orders`), orderData);
  
  // Update local cache (no re-fetch needed)
  if (!productNameCache.includes(orderData.productName)) {
    setProductNameCache([...productNameCache, orderData.productName].sort());
  }
}
```

**Benefits:**
- ✅ **Zero Firestore reads during typing** (massive cost savings)
- ✅ **Instant suggestions** from local memory
- ✅ **One-time fetch per session** (when order window opens)
- ✅ **User can type any custom name** (not restricted)
- ✅ **Auto-updates cache** when new names are saved

**UI Behavior:**
```
User types: "Br"
Autocomplete dropdown:
┌─────────────────────┐
│ Bracelet            │ ← From cache
│ Bangle              │ ← From cache
│ "Br" (type to add)  │ ← Allow custom input
└─────────────────────┘
```

**🚨 IMPORTANT:** Do NOT query Firestore on each keystroke. Use local cache ONLY!

---

## 4. CUSTOMERS COLLECTION

**Collection Name:** `customers`  
**Path:** `tenantCompanies/{companyId}/customers`  
**Purpose:** Track customer information and gold balances

**🚨 CRITICAL:** This is where Customers are stored. NEVER fetch from `customer` or `customerList` or `clients` or any other collection name!

### 4.1 Customer Document Structure

```javascript
{
  // Primary Keys
  customerId: string,                   // AUTO - Firestore document ID
  customerCode: string,                 // REQUIRED - Unique code (e.g., "CUST-001")
  
  // Basic Information
  customerName: string,                 // REQUIRED - Customer name
  phone: string,                        // REQUIRED - Primary phone number (unique)
  address: string,                      // OPTIONAL - Full address
  email: string,                        // OPTIONAL - Email address
  
  // Pure Gold Balance (in grams)
  currentPureGoldBalance: number,       // REQUIRED - Current balance in grams (positive=owed, negative=credit)
  totalPureGoldOrdered: number,         // REQUIRED - Lifetime total ordered (in grams)
  totalPureGoldPaid: number,            // REQUIRED - Lifetime total paid (in grams)
  
  // Credit Management
  creditLimitGold: number,              // OPTIONAL - Max outstanding allowed (in grams)
  creditLimitUSD: number,               // OPTIONAL - USD equivalent (display only)
  availableCreditGold: number,          // CALCULATED - Credit limit - current balance
  
  // Display Reference (Calculated on-demand)
  displayBalanceUSD: number,            // OPTIONAL - Current balance in USD (reference)
  
  // Transaction History
  transactions: [                       // OPTIONAL - Array of transaction objects
    {
      date: Timestamp,                  // Transaction date
      type: string,                     // One of: "invoice", "payment", "credit_note", "adjustment"
      referenceId: string,              // Order/Invoice/Payment ID
      pureGoldAmount: number,           // Amount in grams (positive=customer owes, negative=customer paid)
      goldPriceRef: number,             // Gold price at transaction time (USD/gram)
      currencyRef: number,              // USD equivalent (for reference)
      balance: number,                  // Balance after transaction
      description: string               // Transaction description
    }
  ],
  
  // Status
  isActive: boolean,                    // REQUIRED - Default: true
  
  // Timestamps
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  companyId: string                     // REQUIRED - From environment
}
```

### 4.2 Validation Rules

- `phone`: Must be unique per company
- `customerCode`: Must be unique, format "CUST-XXX"
- `currentPureGoldBalance`: Can be negative (indicates credit)
- `transactions`: Optional array, maximum 1000 transactions (for performance)

### 4.3 🚨 WHERE TO USE Customers Collection

**✅ CORRECT Usage:**
```javascript
// Customer Dropdown in Order Form - THIS IS THE CRITICAL ONE!
const customersQuery = query(
  collection(db, `${basePath}/customers`),
  where('isActive', '==', true),
  orderBy('customerName')
);

// Customer List Page
const customersQuery = query(
  collection(db, `${basePath}/customers`),
  orderBy('customerName')
);

// Get specific customer
const customerDoc = await getDoc(doc(db, `${basePath}/customers`, customerId));

// Get customer balance
const customerData = (await getDoc(doc(db, `${basePath}/customers`, customerId))).data();
const balance = customerData.currentPureGoldBalance;
```

**❌ WRONG - Never use these:**
```javascript
// ❌ collection(db, 'customer')           // Wrong name (singular)
// ❌ collection(db, 'customerList')       // Made-up name
// ❌ collection(db, 'clients')            // Wrong name
// ❌ collection(db, 'customerProfiles')   // Made-up name
```

**🚨 COMMON MISTAKE:** If customer dropdown in order form is empty, AI is probably fetching from wrong collection!  
**✅ SOLUTION:** ALWAYS use `collection(db, \`\${basePath}/customers\`)`

---

## 5A. GOLD BANKS COLLECTION

**Collection Name:** `goldBanks`  
**Path:** `tenantCompanies/{companyId}/goldBanks`  
**Purpose:** Track multiple Sharaf Gold Bank locations for gold custody

**🚨 CRITICAL:** This is where Gold Banks (Sharaf) are stored. NEVER fetch from `goldBank` or `banks` or `sharaf` or any other collection name!

### 5A.1 Gold Bank Document Structure

```javascript
{
  // Primary Keys
  goldBankId: string,                   // AUTO - Firestore document ID
  goldBankCode: string,                 // REQUIRED - Unique code (e.g., "BANK-001")
  
  // Basic Information
  bankName: string,                     // REQUIRED - Bank name (e.g., "Sharaf Gold Bank")
  branchName: string,                   // REQUIRED - Branch name (e.g., "Main Branch Kabul")
  contactPerson: string,                // OPTIONAL - Contact person name
  phone: string,                        // REQUIRED - Primary phone number
  address: string,                      // OPTIONAL - Full address
  email: string,                        // OPTIONAL - Email address
  
  // Gold Custody Balance (in grams)
  currentGoldBalance: number,           // REQUIRED - Current gold in custody (in grams)
  totalDeposited: number,               // REQUIRED - Lifetime total deposited (in grams)
  totalWithdrawn: number,               // REQUIRED - Lifetime total withdrawn (in grams)
  
  // Account Linking
  linkedAccountCode: string,            // REQUIRED - Linked accounting account code (e.g., "BANK-001")
  
  // Transaction History
  transactions: [                       // OPTIONAL - Array of transaction objects
    {
      date: Timestamp,                  // Transaction date
      type: string,                     // One of: "deposit", "withdrawal", "adjustment"
      referenceId: string,              // Challan/Payment ID
      goldAmount: number,               // Amount in grams (positive=deposit, negative=withdrawal)
      balance: number,                  // Balance after transaction
      description: string               // Transaction description
    }
  ],
  
  // Status
  isActive: boolean,                    // REQUIRED - Default: true
  
  // Timestamps
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  companyId: string                     // REQUIRED - From environment
}
```

### 5A.2 Validation Rules

- `goldBankCode`: Must be unique, format "BANK-XXX"
- `currentGoldBalance`: Must equal totalDeposited - totalWithdrawn
- `linkedAccountCode`: Must exist in accounts collection
- `transactions`: Optional array, maximum 1000 transactions

### 5A.3 🚨 WHERE TO USE Gold Banks Collection

**✅ CORRECT Usage:**
```javascript
// Challan Form - Gold Bank Dropdown
const goldBanksQuery = query(
  collection(db, `${basePath}/goldBanks`),
  where('isActive', '==', true),
  orderBy('bankName')
);

// Gold Banks List Page
const goldBanksQuery = query(
  collection(db, `${basePath}/goldBanks`),
  orderBy('bankName')
);

// Get specific gold bank
const goldBankDoc = await getDoc(doc(db, `${basePath}/goldBanks`, goldBankId));
```

**❌ WRONG - Never use these:**
```javascript
// ❌ collection(db, 'goldBank')           // Wrong name (singular)
// ❌ collection(db, 'banks')              // Wrong name
// ❌ collection(db, 'sharaf')             // Wrong name
// ❌ collection(db, 'goldBankList')       // Made-up name
```

---

## 5B. MANUFACTURERS COLLECTION (UPDATED)

## 5B. MANUFACTURERS COLLECTION (UPDATED)

**Collection Name:** `manufacturers`  
**Path:** `tenantCompanies/{companyId}/manufacturers`  
**Purpose:** Track manufacturer information and USD balances for making charges

**🚨 CRITICAL:** This is where Manufacturers/Suppliers are stored. NEVER fetch from `suppliers` or `manufacturer` or `vendor` or any other collection name!

### 5B.1 Manufacturer Document Structure

```javascript
{
  // Primary Keys
  manufacturerId: string,               // AUTO - Firestore document ID
  manufacturerCode: string,             // REQUIRED - Unique code (e.g., "MFG-001")
  
  // Basic Information
  manufacturerName: string,             // REQUIRED - Manufacturer name
  contactPerson: string,                // OPTIONAL - Contact person name
  phone: string,                        // REQUIRED - Primary phone number
  address: string,                      // OPTIONAL - Full address
  email: string,                        // OPTIONAL - Email address
  specialization: string,               // OPTIONAL - Specialization (e.g., "18k Gold Jewelry")
  
  // USD Balance (making charges only)
  currentBalanceUSD: number,            // REQUIRED - Amount owed to manufacturer (positive=we owe, negative=overpaid)
  totalMakingChargesUSD: number,        // REQUIRED - Lifetime total making charges
  totalPaidUSD: number,                 // REQUIRED - Lifetime total paid
  
  // Gold in Transit (for tracking)
  goldInTransit: number,                // REQUIRED - Gold grams currently with manufacturer
  
  // Transaction History
  transactions: [                       // OPTIONAL - Array of transaction objects
    {
      date: Timestamp,                  // Transaction date
      type: string,                     // One of: "making_charges", "payment"
      referenceId: string,              // Order/Payment ID
      amountUSD: number,                // Amount in USD (positive=we owe, negative=we paid)
      balance: number,                  // Balance after transaction
      description: string               // Transaction description
    }
  ],
  
  // Performance Metrics
  avgDeliveryDays: number,              // OPTIONAL - Average delivery time
  completedOrders: number,              // OPTIONAL - Total completed orders
  qualityRating: number,                // OPTIONAL - Rating out of 5.0
  
  // Status
  isActive: boolean,                    // REQUIRED - Default: true
  
  // Timestamps
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  companyId: string                     // REQUIRED - From environment
}
```

### 5B.2 Validation Rules

- `manufacturerCode`: Must be unique, format "MFG-XXX"
- `currentBalanceUSD`: Positive means we owe, negative means overpaid
- `goldInTransit`: Must match sum of all issued challans minus returned gold

### 5B.3 🚨 WHERE TO USE Manufacturers Collection

**✅ CORRECT Usage:**
```javascript
// Order Form - Manufacturer Dropdown
const manufacturersQuery = query(
  collection(db, `${basePath}/manufacturers`),
  where('isActive', '==', true),
  orderBy('manufacturerName')
);

// Manufacturers List Page
const manufacturersQuery = query(
  collection(db, `${basePath}/manufacturers`),
  orderBy('manufacturerName')
);

// Get specific manufacturer
const mfgDoc = await getDoc(doc(db, `${basePath}/manufacturers`, manufacturerId));
```

**❌ WRONG - Never use these:**
```javascript
// ❌ collection(db, 'suppliers')          // Wrong name
// ❌ collection(db, 'manufacturer')       // Wrong name (singular)
// ❌ collection(db, 'vendors')            // Wrong name
// ❌ collection(db, 'supplierList')       // Made-up name
```

---

## 6. CHALLANS COLLECTION

**Collection Name:** `challans`  
**Path:** `tenantCompanies/{companyId}/challans`  
**Purpose:** Track gold withdrawal authorizations for manufacturers

### 6.1 Challan Document Structure

```javascript
{
  // Primary Keys
  challanId: string,                    // AUTO - Firestore document ID
  challanNumber: string,                // AUTO - Format: "CH-XXX-YYYY"
  
  // Challan Type
  challanType: string,                  // REQUIRED - One of: "gold_withdrawal", "gold_return", "additional_gold"
  
  // Order Reference
  orderId: string,                      // REQUIRED - Reference to orders collection
  customerId: string,                   // REQUIRED - Reference to customers collection
  
  // Manufacturer Details
  manufacturerId: string,               // REQUIRED - Reference to manufacturers collection
  manufacturerName: string,             // REQUIRED - Manufacturer name (denormalized)
  
  // Gold Details
  pureGoldAmount: number,               // REQUIRED - Pure gold amount in grams (24k)
  purpose: string,                      // REQUIRED - Purpose description
  
  // Status
  status: string,                       // REQUIRED - One of: "issued", "released_by_sharaf", "returned", "cancelled"
  
  // Dates
  issuedDate: Timestamp,                // REQUIRED - When challan was issued
  releasedBySharafDate: Timestamp,      // OPTIONAL - When Sharaf released gold
  
  // Accounting
  accountingRecorded: boolean,          // REQUIRED - Default: false
  accountingEntryId: string,            // OPTIONAL - Reference to transactions collection
  
  // Sharaf Confirmation
  sharafReleaseConfirmation: boolean,   // REQUIRED - Default: false
  sharafSignature: string,              // OPTIONAL - Sharaf staff ID/signature
  
  // Timestamps
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  companyId: string                     // REQUIRED - From environment
}
```

### 6.2 Challan Status Flow

```
issued → released_by_sharaf → (returned/completed)
```

### 6.3 Validation Rules

- `challanNumber`: Must be unique per company
- `challanType`: Must be one of the 3 types
- `status`: Must follow status flow
- `pureGoldAmount`: Must be positive number
- `accountingRecorded`: Set to true after accounting entry created

---

## 7. INVOICES COLLECTION

**Collection Name:** `invoices`  
**Path:** `tenantCompanies/{companyId}/invoices`  
**Purpose:** Track customer invoices/bills (gold-based)

### 7.1 Invoice Document Structure

```javascript
{
  // Primary Keys
  invoiceId: string,                    // AUTO - Firestore document ID
  invoiceNumber: string,                // AUTO - Format: "INV-XXX-YYYY"
  
  // Invoice Type
  invoiceType: string,                  // REQUIRED - One of: "customer_bill", "credit_invoice"
  
  // Order Reference
  orderId: string,                      // REQUIRED - Reference to orders collection
  customerId: string,                   // REQUIRED - Reference to customers collection
  customerName: string,                 // REQUIRED - Customer name (denormalized)
  
  // Invoice Amounts (Pure Gold)
  productPureGold: number,              // REQUIRED - Product gold in grams
  commissionGold: number,               // REQUIRED - Commission in grams
  priorBalance: number,                 // REQUIRED - Prior balance (positive/negative)
  totalPureGold: number,                // REQUIRED - Total gold owed
  
  // Display Reference
  goldPriceAtInvoice: number,           // REQUIRED - Gold price at invoice time (USD/gram)
  displayAmountUSD: number,             // OPTIONAL - USD equivalent (reference only)
  
  // Payment Tracking
  paidPureGold: number,                 // REQUIRED - Gold paid so far
  remainingPureGold: number,            // REQUIRED - Gold still owed
  paymentStatus: string,                // REQUIRED - One of: "not_paid", "partially_paid", "paid"
  
  // Payment Terms
  invoiceDate: Timestamp,               // REQUIRED - Invoice date
  dueDate: Timestamp,                   // REQUIRED - Payment due date
  creditDays: number,                   // REQUIRED - Credit period (days)
  
  // Status
  status: string,                       // REQUIRED - One of: "active", "paid", "cancelled", "overdue"
  
  // Timestamps
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  companyId: string                     // REQUIRED - From environment
}
```

### 7.2 Invoice Status Flow

```
active → partially_paid → paid
       ↘ overdue (if past due date)
```

### 7.3 Validation Rules

- `invoiceNumber`: Must be unique per company
- `invoiceType`: Must be one of the 2 types
- `totalPureGold`: Must equal productPureGold + commissionGold + priorBalance
- `remainingPureGold`: Must equal totalPureGold - paidPureGold
- `paymentStatus`: Auto-updated based on payments
- `status`: "overdue" if current date > dueDate and not paid

### 7.4 🚨 WHERE TO USE Invoices Collection

**✅ CORRECT Usage:**
```javascript
// Invoice List Page
const invoicesQuery = query(
  collection(db, `${basePath}/invoices`),
  orderBy('invoiceDate', 'desc')
);

// Customer invoices
const customerInvoicesQuery = query(
  collection(db, `${basePath}/invoices`),
  where('customerId', '==', customerId),
  orderBy('invoiceDate', 'desc')
);

// Outstanding invoices
const outstandingQuery = query(
  collection(db, `${basePath}/invoices`),
  where('paymentStatus', '==', 'not_paid'),
  orderBy('dueDate')
);

// Get specific invoice
const invoiceDoc = await getDoc(doc(db, `${basePath}/invoices`, invoiceId));
```

**❌ WRONG - Never use these:**
```javascript
// ❌ collection(db, 'invoice')            // Wrong name (singular)
// ❌ collection(db, 'bills')              // Wrong name
// ❌ collection(db, 'customerBills')      // Made-up name
// ❌ collection(db, 'invoiceList')        // Made-up name
```

---

## 8. PAYMENTS COLLECTION

**Collection Name:** `payments`  
**Path:** `tenantCompanies/{companyId}/payments`  
**Purpose:** Track payment receipts when customers pay in pure gold

**🚨 CRITICAL:** This is where Payments are stored. NEVER fetch from `payment` or `paymentList` or `receipts` or any other collection name!

### 8.1 Payment Document Structure

```javascript
{
  // Primary Keys
  paymentId: string,                    // AUTO - Firestore document ID
  paymentNumber: string,                // AUTO - Format: "PAY-XXX-YYYY"
  
  // Payment Type
  paymentType: string,                  // REQUIRED - One of: "customer_payment", "manufacturer_payment"
  
  // Invoice Reference
  invoiceId: string,                    // OPTIONAL - Reference to invoices collection (for customer payments)
  customerId: string,                   // OPTIONAL - Reference to customers collection
  customerName: string,                 // OPTIONAL - Customer name (denormalized)
  
  // Payment Details (Pure Gold)
  pureGoldPaid: number,                 // REQUIRED - Gold amount paid in grams
  goldPriceAtPayment: number,           // REQUIRED - Gold price at payment time (USD/gram)
  displayAmountUSD: number,             // OPTIONAL - USD equivalent (reference)
  
  // Payment Method
  paymentMethod: string,                // REQUIRED - Always "gold" for customer payments
  
  // Balances
  previousBalance: number,              // REQUIRED - Balance before payment
  amountPaid: number,                   // REQUIRED - Amount paid in this transaction
  newBalance: number,                   // REQUIRED - Balance after payment
  
  // Sharaf Deposit
  depositedToSharaf: boolean,           // REQUIRED - Default: false
  sharafDepositDate: Timestamp,         // OPTIONAL - When deposited to Sharaf
  sharafReceiptNumber: string,          // OPTIONAL - Sharaf receipt reference
  
  // Accounting
  accountingRecorded: boolean,          // REQUIRED - Default: false
  accountingEntryId: string,            // OPTIONAL - Reference to transactions collection
  
  // Status
  status: string,                       // REQUIRED - One of: "pending", "completed", "cancelled"
  
  // Timestamps
  paymentDate: Timestamp,               // REQUIRED - Payment date
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  companyId: string                     // REQUIRED - From environment
}
```

### 8.2 Payment Status Flow

```
pending → completed
        ↘ cancelled
```

### 8.3 Validation Rules

- `paymentNumber`: Must be unique per company
- `paymentType`: Must be one of the 2 types
- `paymentMethod`: Always "gold" for customer payments
- `newBalance`: Must equal previousBalance - amountPaid
- `depositedToSharaf`: Must be true when status = "completed"
- `accountingRecorded`: Set to true after accounting entry created

### 8.4 🚨 WHERE TO USE Payments Collection

**✅ CORRECT Usage:**
```javascript
// Payment List Page
const paymentsQuery = query(
  collection(db, `${basePath}/payments`),
  orderBy('paymentDate', 'desc')
);

// Customer payment history
const customerPaymentsQuery = query(
  collection(db, `${basePath}/payments`),
  where('customerId', '==', customerId),
  orderBy('paymentDate', 'desc')
);

// Get specific payment
const paymentDoc = await getDoc(doc(db, `${basePath}/payments`, paymentId));
```

**❌ WRONG - Never use these:**
```javascript
// ❌ collection(db, 'payment')            // Wrong name (singular)
// ❌ collection(db, 'paymentList')        // Made-up name
// ❌ collection(db, 'receipts')           // Wrong name
// ❌ collection(db, 'customerPayments')   // Made-up name
```

---

## 9. ACCOUNTING TRANSACTIONS COLLECTION

**Collection Name:** `transactions`  
**Path:** `tenantCompanies/{companyId}/transactions`  
**Purpose:** Store all double-entry accounting journal entries

### 9.1 Transaction Document Structure

```javascript
{
  // Primary Keys
  transactionId: string,                // AUTO - Format: "TXN-TIMESTAMP-XXX"
  
  // Transaction Type
  transactionType: string,              // REQUIRED - Always "journal_entry"
  
  // Transaction Details
  date: Timestamp,                      // REQUIRED - Transaction date
  description: string,                  // REQUIRED - Transaction description
  
  // Journal Entry Lines (Always 2 for simple entries)
  lines: [                              // REQUIRED - Array of journal lines
    {
      accountCode: string,              // REQUIRED - Account code
      accountName: string,              // REQUIRED - Account name
      debitGold: number,                // OPTIONAL - Debit amount in grams (0 if credit)
      creditGold: number,               // OPTIONAL - Credit amount in grams (0 if debit)
      debitUSD: number,                 // OPTIONAL - Debit amount in USD (0 if credit)
      creditUSD: number,                // OPTIONAL - Credit amount in USD (0 if debit)
      goldPriceRef: number              // OPTIONAL - Gold price reference (USD/gram)
    }
  ],
  
  // Reference
  referenceType: string,                // REQUIRED - One of: "challan", "invoice", "payment", "making_charges", "manual_entry"
  referenceId: string,                  // OPTIONAL - Reference document ID
  
  // Timestamps
  createdAt: Timestamp,                 // AUTO
  createdBy: string,                    // REQUIRED - User ID who created
  companyId: string                     // REQUIRED - From environment
}
```

### 9.2 Transaction Lines Validation

- **Every transaction MUST balance:**
  - Sum of all debitGold = Sum of all creditGold
  - Sum of all debitUSD = Sum of all creditUSD
- Minimum 2 lines (debit + credit)
- Maximum 10 lines (for complex transactions)

### 9.3 Validation Rules

- `transactionId`: Must be unique, auto-generated
- `lines`: Must have at least 2 lines
- Balance validation: Total debits = Total credits (separately for gold and USD)
- `referenceType`: Must be one of the 5 types
- `accountCode`: Must exist in accounts collection

---

## 10. GOLD PRICE HISTORY COLLECTION

**Collection Name:** `goldPriceHistory`  
**Path:** `tenantCompanies/{companyId}/goldPriceHistory`  
**Purpose:** Track gold price changes over time

### 10.1 Gold Price Document Structure

```javascript
{
  // Primary Keys
  priceId: string,                      // AUTO - Firestore document ID
  
  // Price Information
  pricePerOunce: number,                // REQUIRED - Price per troy ounce (USD)
  pricePerGram: number,                 // REQUIRED - Price per gram (USD) = ounce ÷ 31.15
  currency: string,                     // REQUIRED - Always "USD"
  
  // Source Information
  source: string,                       // REQUIRED - One of: "goldprice.org", "kitco.com", "manual"
  isManual: boolean,                    // REQUIRED - true if manually entered
  enteredBy: string,                    // OPTIONAL - User ID (if manual)
  
  // Timestamp
  timestamp: Timestamp,                 // REQUIRED - Price date/time
  companyId: string                     // REQUIRED - From environment
}
```

### 10.2 Validation Rules

- `pricePerGram`: Must equal pricePerOunce ÷ 31.15
- `currency`: Always "USD"
- `source`: Must be one of the 3 sources
- One price entry per day maximum (latest price overwrites)

---

## 11. USERS COLLECTION

**Collection Name:** `users`  
**Path:** `tenantCompanies/{companyId}/users`  
**Purpose:** Store user authentication and permission data

**🚨 CRITICAL:** This is where Users are stored. NEVER fetch from `user` or `accounts` or `profiles` or any other collection name!

### 11.1 User Document Structure

```javascript
{
  // Primary Keys
  userId: string,                       // REQUIRED - Firebase Auth UID (same as auth user)
  userCode: string,                     // REQUIRED - Unique code (e.g., "USER-001")
  
  // Basic Information
  fullName: string,                     // REQUIRED - User full name
  email: string,                        // REQUIRED - Email address (unique)
  phone: string,                        // OPTIONAL - Phone number
  
  // Role & Permissions
  role: string,                         // REQUIRED - One of: "admin", "manager", "staff", "expert"
  permissions: [                        // REQUIRED - Array of permission strings
    string                              // e.g., "orders.create", "customers.view", "accounting.access"
  ],
  
  // Access Control
  isActive: boolean,                    // REQUIRED - Default: true
  canAccessAccounting: boolean,         // REQUIRED - Default: false (expert only)
  canManualJournalEntry: boolean,       // REQUIRED - Default: false (expert only)
  
  // Profile
  profileImageURL: string,              // OPTIONAL - Cloudinary image URL
  
  // Timestamps
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  lastLoginAt: Timestamp,               // AUTO - Updated on login
  companyId: string                     // REQUIRED - From environment
}
```

### 11.2 Role Definitions

**Permission Structure:**
```javascript
const ROLES = {
  admin: {
    permissions: ['*'],                 // All permissions
    canAccessAccounting: false,         // No accounting access by default
    description: 'Full business operations access (no accounting)'
  },
  manager: {
    permissions: [
      'orders.*', 'customers.*', 'manufacturers.*', 
      'goldBanks.*', 'billing.*', 'payments.*'
    ],
    canAccessAccounting: false,
    description: 'Manage all business operations'
  },
  staff: {
    permissions: [
      'orders.view', 'orders.create', 
      'customers.view', 'manufacturers.view'
    ],
    canAccessAccounting: false,
    description: 'View and create orders only'
  },
  expert: {
    permissions: ['*'],                 // All permissions
    canAccessAccounting: true,          // Full accounting access
    canManualJournalEntry: true,
    description: 'Backend technical support with accounting access'
  }
};
```

### 11.3 Validation Rules

- `userId`: Must match Firebase Auth UID
- `email`: Must be unique per company
- `role`: Must be one of the 4 roles
- `permissions`: Array of permission strings (wildcard * supported)
- `canAccessAccounting`: Only true for "expert" role

### 11.4 🚨 WHERE TO USE Users Collection

**✅ CORRECT Usage:**
```javascript
// Get current user profile
const userDoc = await getDoc(doc(db, `${basePath}/users`, currentUser.uid));

// List all users
const usersQuery = query(
  collection(db, `${basePath}/users`),
  where('isActive', '==', true),
  orderBy('fullName')
);

// Check permission
const checkPermission = (userPermissions, requiredPermission) => {
  return userPermissions.includes('*') || 
         userPermissions.includes(requiredPermission) ||
         userPermissions.some(p => p.endsWith('.*') && requiredPermission.startsWith(p.replace('.*', '')));
};
```

**❌ WRONG - Never use these:**
```javascript
// ❌ collection(db, 'user')               // Wrong name (singular)
// ❌ collection(db, 'accounts')           // Wrong name (conflicts with chart of accounts)
// ❌ collection(db, 'profiles')           // Wrong name
// ❌ collection(db, 'userList')           // Made-up name
```

---

## 12. SETTINGS COLLECTION

**Collection Name:** `settings`  
**Path:** `tenantCompanies/{companyId}/settings`  
**Purpose:** Store company settings and configuration

### 11.1 Settings Document Structure

```javascript
{
  // Company Information
  companyName: string,                  // REQUIRED - Company name
  companyAddress: string,               // OPTIONAL - Full address
  companyPhone: string,                 // OPTIONAL - Phone number
  companyEmail: string,                 // OPTIONAL - Email address
  
  // Gold Price Settings
  currentGoldPricePerGram: number,      // REQUIRED - Current gold price (USD/gram)
  currentGoldPricePerOunce: number,     // REQUIRED - Current gold price (USD/ounce)
  lastPriceUpdate: Timestamp,           // REQUIRED - Last price update time
  autoUpdatePrice: boolean,             // REQUIRED - Auto-fetch from API
  priceUpdateInterval: number,          // REQUIRED - Update interval (minutes)
  
  // Default Values
  defaultCreditDays: number,            // REQUIRED - Default credit period (days)
  defaultMakingChargeRate: number,      // REQUIRED - Default making charge (USD/gram)
  
  // Business Settings
  enableSharafIntegration: boolean,     // REQUIRED - Enable Sharaf Gold Bank integration
  sharafAccountNumber: string,          // OPTIONAL - Account number at Sharaf
  
  // Timestamps
  createdAt: Timestamp,                 // AUTO
  updatedAt: Timestamp,                 // AUTO
  companyId: string                     // REQUIRED - From environment
}
```

### 11.2 Validation Rules

- Only ONE settings document per company
- `currentGoldPricePerGram`: Must equal currentGoldPricePerOunce ÷ 31.15
- `priceUpdateInterval`: Minimum 5 minutes, maximum 1440 (24 hours)
- `defaultCreditDays`: Minimum 0, maximum 90

---

## 12. FIRESTORE SECURITY RULES

**File:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Base path for multi-tenant
    match /Easy2Solutions/companyDirectory/tenantCompanies/{companyId} {
      
      // Helper functions
      function isAuthenticated() {
        return request.auth != null;
      }
      
      function belongsToCompany() {
        return request.auth.token.companyId == companyId;
      }
      
      function isAdmin() {
        return isAuthenticated() && 
               belongsToCompany() && 
               request.auth.token.role == 'admin';
      }
      
      // Accounts collection - Read only for all, Write for admin
      match /accounts/{accountId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow write: if isAdmin();
      }
      
      // Transactions collection - Read only for all, Write for system
      match /transactions/{transactionId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow create: if isAuthenticated() && belongsToCompany();
        allow update, delete: if false; // Transactions are immutable
      }
      
      // Orders collection
      match /orders/{orderId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow create, update: if isAuthenticated() && belongsToCompany();
        allow delete: if isAdmin();
      }
      
      // Customers collection
      match /customers/{customerId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow write: if isAuthenticated() && belongsToCompany();
      }
      
      // Manufacturers collection
      match /manufacturers/{manufacturerId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow write: if isAuthenticated() && belongsToCompany();
      }
      
      // Challans collection
      match /challans/{challanId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow create, update: if isAuthenticated() && belongsToCompany();
        allow delete: if isAdmin();
      }
      
      // Invoices collection
      match /invoices/{invoiceId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow write: if isAuthenticated() && belongsToCompany();
      }
      
      // Payments collection
      match /payments/{paymentId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow write: if isAuthenticated() && belongsToCompany();
      }
      
      // Gold Price History - Read for all, Write for admin
      match /goldPriceHistory/{priceId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow write: if isAdmin();
      }
      
      // Settings - Read for all, Write for admin
      match /settings/{settingId} {
        allow read: if isAuthenticated() && belongsToCompany();
        allow write: if isAdmin();
      }
    }
  }
}
```

---

## 13. FIRESTORE INDEXES

**Required Composite Indexes:**

```javascript
// Orders - Filter by status and sort by date
{
  collectionGroup: "orders",
  fields: [
    { fieldPath: "companyId", order: "ASCENDING" },
    { fieldPath: "status", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// Orders - Filter by payment status and sort by date
{
  collectionGroup: "orders",
  fields: [
    { fieldPath: "companyId", order: "ASCENDING" },
    { fieldPath: "paymentStatus", order: "ASCENDING" },
    { fieldPath: "createdAt", order: "DESCENDING" }
  ]
}

// Customers - Filter by active and sort by name
{
  collectionGroup: "customers",
  fields: [
    { fieldPath: "companyId", order: "ASCENDING" },
    { fieldPath: "isActive", order: "ASCENDING" },
    { fieldPath: "customerName", order: "ASCENDING" }
  ]
}

// Transactions - Sort by date
{
  collectionGroup: "transactions",
  fields: [
    { fieldPath: "companyId", order: "ASCENDING" },
    { fieldPath: "date", order: "DESCENDING" }
  ]
}

// Gold Price History - Sort by timestamp
{
  collectionGroup: "goldPriceHistory",
  fields: [
    { fieldPath: "companyId", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
}
```

---

## 14. 🚨 DENORMALIZED DATA REFERENCE (PREVENT UNNECESSARY FETCHES)

**Many documents contain denormalized data to avoid multiple fetches. ALWAYS check this table before fetching from another collection!**

### 14.1 Orders Collection - Denormalized Fields

| Field in Orders | Original Source | DO NOT Fetch From |
|----------------|----------------|-------------------|
| `customerName` | customers.customerName | ❌ Don't fetch from customers |
| `customerPhone` | customers.phone | ❌ Don't fetch from customers |
| `manufacturerName` | manufacturers.manufacturerName | ❌ Don't fetch from manufacturers |

**✅ Example - CORRECT:**
```javascript
// Get order
const orderDoc = await getDoc(doc(db, `${basePath}/orders`, orderId));
const orderData = orderDoc.data();

// ✅ Use denormalized field directly
const customerName = orderData.customerName;
const manufacturerName = orderData.manufacturerName;
```

**❌ Example - WRONG (Unnecessary fetch):**
```javascript
// Get order
const orderDoc = await getDoc(doc(db, `${basePath}/orders`, orderId));
const orderData = orderDoc.data();

// ❌ DON'T DO THIS - Unnecessary fetch!
const customerDoc = await getDoc(doc(db, `${basePath}/customers`, orderData.customerId));
const customerName = customerDoc.data().customerName; // Already in order!
```

### 14.2 Invoices Collection - Denormalized Fields

| Field in Invoices | Original Source | DO NOT Fetch From |
|------------------|----------------|-------------------|
| `customerName` | customers.customerName | ❌ Don't fetch from customers |

### 14.3 Payments Collection - Denormalized Fields

| Field in Payments | Original Source | DO NOT Fetch From |
|------------------|----------------|-------------------|
| `customerName` | customers.customerName | ❌ Don't fetch from customers |

### 14.4 Challans Collection - Denormalized Fields

| Field in Challans | Original Source | DO NOT Fetch From |
|------------------|----------------|-------------------|
| `manufacturerName` | manufacturers.manufacturerName | ❌ Don't fetch from manufacturers |

### 14.5 When to Fetch vs When to Use Denormalized Data

**✅ Use Denormalized Data When:**
- Displaying data in lists (order list, invoice list)
- Showing references in detail views
- Generating reports
- Performance is critical

**✅ Fetch Fresh Data When:**
- Editing customer/manufacturer information
- Checking current balance (not historical)
- Validating business rules
- Data accuracy is critical

---

## 15. 🚨 ANTI-ASSUMPTION CHECKLIST FOR AI AGENTS

**Before writing ANY code that interacts with database, check ALL these items:**

### 15.1 Collection Name Verification

```javascript
// ✅ STEP 1: Find the correct collection name from Section 1.3
// Example: "I need to fetch customers"
// ✅ Check Section 1.3 → customers collection
// ✅ Path: tenantCompanies/{companyId}/customers

// ❌ DON'T assume names like:
// - customer (singular)
// - customerList
// - clients
// - customerProfiles
```

### 15.2 UI Component → Collection Mapping

**Use this checklist before coding any UI component:**

| Need to... | Collection | Section | Query Pattern |
|------------|-----------|---------|---------------|
| Show customer dropdown in order form | `customers` | [4](#4-customers-collection) | `where('isActive', '==', true)` |
| Show manufacturer dropdown | `manufacturers` | [5B](#5b-manufacturers-collection-updated) | `where('isActive', '==', true)` |
| Show gold bank dropdown | `goldBanks` | [5A](#5a-gold-banks-collection) | `where('isActive', '==', true)` |
| List orders | `orders` | [3](#3-orders-collection) | `orderBy('createdAt', 'desc')` |
| List invoices | `invoices` | [7](#7-invoices-collection) | `orderBy('invoiceDate', 'desc')` |
| List payments | `payments` | [8](#8-payments-collection) | `orderBy('paymentDate', 'desc')` |
| List challans | `challans` | [6](#6-challans-collection) | `orderBy('issuedDate', 'desc')` |
| Get gold price | `goldPriceHistory` | [10](#10-gold-price-history-collection) | `orderBy('timestamp', 'desc').limit(1)` |
| Get user profile | `users` | [11](#11-users-collection) | `doc(userId)` |

### 15.3 Field Name Verification

```javascript
// ✅ STEP 2: Check exact field names from collection document structure
// Example: "Get customer balance"
// ✅ Check Section 4.1 → currentPureGoldBalance (NOT balance, NOT goldBalance)

// ❌ DON'T assume field names like:
// - balance (vague)
// - goldBalance (doesn't exist)
// - customerBalance (doesn't exist)
// - outstandingAmount (doesn't exist)
```

### 15.4 Common Mistakes & Solutions

**❌ MISTAKE 1: Customer Dropdown Empty**
```javascript
// ❌ WRONG: Fetching from wrong collection
const customers = await getDocs(collection(db, 'customers')); // Missing basePath!

// ✅ CORRECT: Use exact path
const customersRef = collection(db, `${basePath}/customers`);
const customersQuery = query(customersRef, where('isActive', '==', true));
const customers = await getDocs(customersQuery);
```

**❌ MISTAKE 2: Denormalized Data Not Used**
```javascript
// ❌ WRONG: Fetching customer name from customers collection for every order
const order = orderData;
const customerDoc = await getDoc(doc(db, `${basePath}/customers`, order.customerId));
const customerName = customerDoc.data().customerName; // Unnecessary fetch!

// ✅ CORRECT: Use denormalized field
const customerName = order.customerName; // Already in order document!
```

**❌ MISTAKE 3: Incorrect Field Name**
```javascript
// ❌ WRONG: Assuming field name
const balance = customerData.balance; // Field doesn't exist!

// ✅ CORRECT: Check Section 4.1 for exact field name
const balance = customerData.currentPureGoldBalance; // Correct field name
```

**❌ MISTAKE 4: Creating New Collections**
```javascript
// ❌ WRONG: Creating new collection without updating DatabaseInfo
await addDoc(collection(db, `${basePath}/customerDetails`), data); // Unauthorized collection!

// ✅ CORRECT: Only use defined collections (Section 1.2)
await addDoc(collection(db, `${basePath}/customers`), data); // Authorized collection
```

### 15.5 Pre-Code Verification Questions

**Ask yourself these BEFORE writing code:**

1. **"What collection am I fetching from?"**
   - ✅ Check Section 1.3 UI Reference Table
   - ❌ Don't guess or assume

2. **"What is the EXACT collection name?"**
   - ✅ Check Section 1.4 Firestore Path Examples
   - ❌ Don't use singular/plural variations

3. **"What is the EXACT field name?"**
   - ✅ Check collection document structure (Section X.1)
   - ❌ Don't use shortened/assumed names

4. **"Is this data denormalized in the document?"**
   - ✅ Check document structure for denormalized fields
   - ❌ Don't fetch from multiple collections unnecessarily

5. **"Am I using the correct basePath?"**
   - ✅ Always use `${basePath}/collectionName`
   - ❌ Never use direct collection names

### 15.6 Code Review Checklist

**Before committing code, verify:**

- [ ] All collection references use `${basePath}/collectionName` format
- [ ] Collection names match EXACTLY (case-sensitive, plural/singular)
- [ ] Field names match EXACTLY from document structure
- [ ] No new collections created without updating DatabaseInfo
- [ ] No assumed field names (all verified from document structure)
- [ ] Denormalized data used where available
- [ ] Query patterns match Section 1.3 UI Reference Table

### 15.7 Emergency Reference Card

**Print this and keep it visible while coding:**

```
COLLECTION NAMES (EXACT - CASE SENSITIVE):
✅ customers       ❌ customer, customerList, clients
✅ orders          ❌ order, orderList, customerOrders
✅ manufacturers   ❌ manufacturer, suppliers, vendors
✅ goldBanks       ❌ goldBank, banks, sharaf
✅ challans        ❌ challan, vouchers, challanList
✅ invoices        ❌ invoice, bills, customerBills
✅ payments        ❌ payment, receipts, paymentList
✅ accounts        ❌ account, chartOfAccounts
✅ transactions    ❌ transaction, journalEntries
✅ goldPriceHistory ❌ goldPrice, prices, priceHistory
✅ settings        ❌ setting, config, configuration
✅ users           ❌ user, accounts, profiles

BASE PATH (ALWAYS USE):
✅ const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;
✅ collection(db, `${basePath}/customers`)
❌ collection(db, 'customers')

CUSTOMER BALANCE FIELD:
✅ currentPureGoldBalance
❌ balance, goldBalance, customerBalance

ORDER STATUS FIELD:
✅ status
❌ orderStatus, currentStatus

MANUFACTURER CODE FIELD:
✅ manufacturerCode
❌ code, mfgCode, supplierCode
```

---

## 16. DATA MIGRATION FROM V1.0

**IF migrating from v1.0, follow this order:**

1. **Create new collections** (don't delete old ones yet)
2. **Initialize Chart of Accounts** (15 system accounts)
3. **Migrate Customers** (convert balances to pure gold)
4. **Migrate Manufacturers** (keep USD balances)
5. **Migrate Orders** (recalculate pure gold amounts)
6. **Create opening balance transactions** (initial gold bank balance)
7. **Test dual-write period** (write to both v1 and v2)
8. **Cutover** (switch to v2 only)
9. **Archive v1 data** (keep for historical reference)

---

## END OF DATABASE INFORMATION v2.0

**🎯 KEY TAKEAWAYS:**

1. **12 Collections Total** - No more, no less (unless DatabaseInfo updated first)
2. **Always use basePath** - Never direct collection references
3. **Check Section 1.3** - UI Reference Table before coding
4. **Verify field names** - Check document structure sections
5. **No assumptions** - When in doubt, check this document

**📌 QUICK NAVIGATION:**
- Missing collection names? → [Section 1.2](#12-collection-structure)
- Empty dropdowns? → [Section 1.3](#13--critical-where-to-fetch-data-ui-reference-table)
- Field name errors? → Check collection document structure (Sections 2-12)
- Wrong collection? → [Section 15](#15--anti-assumption-checklist-for-ai-agents)

**This document defines ALL data structures. No assumptions allowed beyond this specification.**

---

**Last Updated:** December 30, 2025  
**Document Version:** 2.0 (Anti-Assumption Update)  
**Total Collections:** 12  
**Total Sections:** 16

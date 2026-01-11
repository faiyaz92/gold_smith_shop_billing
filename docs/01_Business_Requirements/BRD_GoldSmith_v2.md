# Business Requirements Document (BRD) v2.0
## GOLD SMITH PURE GOLD ACCOUNTING SYSTEM

**Document Version:** 2.0  
**Date:** December 30, 2025  
**Project:** Gold Smith Pure Gold-Based Billing & Management System  
**Industry:** Jewelry Retail & Manufacturing (Afghan/Persian Gold Shop Model)  
**Business Model:** Pure Gold Accounting - All transactions in gold grams (24k equivalent)  
**Technology Stack:** Next.js + Firebase/Firestore + Gold Price API Integration  
**Target Users:** Traditional gold shops using gold-based accounting (Ahmad Gold style)  

---

## 📋 CRITICAL BUSINESS MODEL CHANGE FROM v1.0

### **v1.0 (Currency-Based) → v2.0 (Gold-Based with Gold Bank Custody)**

| Aspect | v1.0 (Old) | v2.0 (New - ACTUAL) |
|--------|------------|------------|
| **Unit of Account** | Currency (₹/$) | Pure Gold Grams (24k) for customers, USD for manufacturers |
| **Customer Pays** | Money | **Pure gold grams** |
| **Customer Owes** | Money outstanding | **Pure gold grams** outstanding |
| **Manufacturer Paid** | Money for manufacturing | **USD cash for making charges ONLY** |
| **Commission** | Money (Price difference) | **Pure gold grams** |
| **Inventory** | Weight + Value | **Pure gold grams** |
| **Gold Storage** | Shop inventory | **Gold Bank (Sharaf) - External Custody** |
| **Client Holding** | Holds gold | **NEVER holds gold - deposits to Sharaf EOD** |
| **Gold Movement** | Direct | **Challan/Voucher system via Sharaf** |
| **Balance Sheet** | Money owed/paid | **Gold grams receivable, USD payable** |

### **Core Principle:**
**"Gold IS the currency for customers. Manufacturers are paid USD cash for making charges. Client never holds gold - all gold deposited to Gold Bank (Sharaf) immediately."**

---

## 🎯 APPLICATION MENU STRUCTURE (SIMPLIFIED)

### Primary Menu (Client-Facing - NO ACCOUNTING VISIBLE)

```
┌─────────────────────────────────────┐
│  📊 Dashboard                       │
│  📦 Orders                          │
│  💰 Billing                         │
│  👥 Customers                       │
│  🏭 Suppliers                       │
│  🏦 Gold Banks                      │
└─────────────────────────────────────┘
```

**Client-Visible Modules:**
- ✅ **Dashboard:** KPIs, gold price, quick stats (shows financial summaries automatically)
- ✅ **Orders:** Complete order lifecycle management
- ✅ **Billing:** Invoice generation, payment receipts, outstanding tracking
- ✅ **Customers:** Customer management (auto-creates receivable accounts)
- ✅ **Suppliers:** Supplier management (auto-creates payable accounts)
- ✅ **Gold Banks:** Multiple Sharaf bank management (auto-creates gold custody accounts)

**Hidden/Backdoor Modules (Expert Access Only):**
- 🔒 **Accounting:** Complete double-entry accounting system (invisible to client)
- 🔒 **Expert Tools:** Manual corrections, transfers, journal entries (for technical support)

**Client Philosophy:**
**"Client sees business operations only. Accounting runs automatically in background. Client never touches accounting - it's a backdoor solution for experts."**

**Removed Modules (Accounting-Related - Client Never Sees):**
- ❌ Analytics (integrated into dashboard)
- ❌ Areas, Branches, Commission Tracking (auto-calculated)
- ❌ Coupons, GPS Tracking, Inquiries (not needed)
- ❌ Products (integrated into orders)
- ❌ Roles, Settings (auto-managed)
- ❌ Stock Allocation, Users (simplified)
- ❌ Van Sellers (not applicable)

**Simplified Structure:**
1. **Dashboard:** Business KPIs, gold price, auto-calculated financial summaries
2. **Orders:** Order creation, challan issuance, product delivery
3. **Billing:** Auto-generated bills, payment collection, outstanding tracking
4. **Customers:** Customer profiles (accounting auto-handled)
5. **Suppliers:** Supplier profiles (accounting auto-handled)
6. **Gold Banks:** Multiple Sharaf banks (accounting auto-handled)

---

## 📊 EXECUTIVE SUMMARY

### Core Business Flow (Gold-Based with Gold Bank Custody)
```
Customer Order → Issue Challan to Manufacturer → Manufacturer Gets Gold from Sharaf → Production → Return Product + Pay Making Charges → Customer Delivery & Billing → Customer Pays in Pure Gold → Deposit to Sharaf
```

### Complete Transaction Flow

**1. Customer Order (No Accounting Entry):**
- Customer orders 500g 18k jewelry by phone/visit
- Calculate pure gold needed: 500g × 0.75 (18k) = **375g pure gold**
- Calculate commission in gold: e.g., $1/g × 500g ÷ $145.43/g = **3.438g pure gold**
- Generate **Order Receipt** (not bill yet)
- **No accounting entry** - just order record

**2. Issue Gold Challan to Manufacturer:**
- Issue **Challan/Voucher** for 375g pure gold
- Manufacturer takes challan to **Gold Bank (Sharaf)**
- Sharaf releases 375g pure gold to manufacturer
- **Accounting Entry:**
  ```
  Debit: Gold in Transit - Manufacturer [Asset]      375.000g
  Credit: Gold Bank (Sharaf) [Asset]                 375.000g
  ```

**3. Manufacturer Returns with Finished Product:**
- Manufacturer brings 500g 18k finished jewelry
- Making charge due: $1/g × 500g = **$500 USD** (paid in cash, not gold)
- **Accounting Entry:**
  ```
  Debit: Finished Goods Inventory [Asset]            375.000g pure gold equivalent
  Credit: Gold in Transit - Manufacturer [Asset]     375.000g
  
  Debit: Making Charges Expense [Expense]            $500 USD
  Credit: Cash/Manufacturer Payable [Liability]      $500 USD
  ```

**4. Customer Collects & Billing:**
- Calculate actual pure gold: 500g × 0.75 = 375g pure gold
- Add commission in gold: 3.438g
- Total owed: **378.438g pure gold**
- Generate **Bill/Invoice** in pure gold
- **Accounting Entry:**
  ```
  Debit: Customer Receivable [Asset]                 378.438g
  Credit: Finished Goods Inventory [Asset]           375.000g
  Credit: Commission Income [Revenue]                3.438g
  ```

**5. Customer Pays in Pure Gold OR USD (Flexible Payment):**
- Customer can pay in pure gold grams OR USD cash (or both)
- USD payments auto-converted to equivalent pure gold grams using current market price
- Can adjust gold price per payment for negotiation flexibility
- **Accounting Entry:**
  ```
  Debit: Gold Bank (Sharaf) [Asset]                  XXX.XXXg pure gold
  Credit: Customer Receivable [Asset]                XXX.XXXg pure gold
  ```
- All payments stored as pure gold grams (maintains pure gold accounting)

### Gold-Based Transaction Logic

**Example Transaction:**
1. **Order:** Customer orders 500g 18k jewelry
2. **Pure Gold Required:** 500g × 75% (18k purity) = **375g pure gold**
3. **Commission in Gold:** $500 commission ÷ $145.43/gram = **3.438g pure gold**
4. **Prior Balance:** Customer has **-50g** credit (from database)
5. **Total Pure Gold Owed:** 375 + 3.438 - 50 = **328.438g pure gold**
6. **Currency Display:** 328.438g × $145.43/g = **$47,760** (for reference only)

### Key Business Rules

1. **Gold Bank (Sharaf) Custody Model:**
   - **Gold Bank (Sharaf):** External gold custodian/storage
   - **Client never holds gold** - all gold deposited to Sharaf immediately at EOD
   - **Challan/Voucher System:** Authorization for manufacturer to withdraw gold from Sharaf
   - **All gold transactions** go through Sharaf (gold custody account)

2. **Dual Currency System:**
   - **Customer transactions:** PURE GOLD grams (24k equivalent) - customer pays/owes in gold
   - **Manufacturer payments:** USD CASH - making charges paid in cash
   - **Commission:** Calculated and recorded in pure gold grams
   - **Display:** USD amounts shown for reference only

3. **Everything Stored as Pure Gold (24k equivalent):**
   - 22k products → converted to 24k pure gold (× 0.9167)
   - 18k products → converted to 24k pure gold (× 0.75)
   - Commission → expressed as pure gold grams
   - Customer balance → pure gold grams
   - Manufacturer balance → USD cash for making charges only
   - Inventory → pure gold grams equivalent

4. **Gold Price Management:**
   - **Live price per ounce** (e.g., $4,530) - from API or manual entry
   - **Auto-calculated per gram** = Ounce ÷ 31.15
   - **Reversible entry:** Enter ounce → calculates gram, OR enter gram → calculates ounce
   - **Updated daily** from online gold price source
   - **Used for:** Converting making charges (USD) to gold grams for commission display

5. **Purity Conversion to Pure Gold:**
   - **24k (100%):** 1 gram = 1 gram pure gold
   - **22k (91.67%):** 1 gram = 0.9167 gram pure gold
   - **18k (75%):** 1 gram = 0.75 gram pure gold
   - **14k (58.33%):** 1 gram = 0.5833 gram pure gold

6. **Balance Tracking:**
   - **Customer owes:** X grams pure gold (receivable in gold)
   - **Manufacturer is owed:** Y USD cash (payable in cash for making charges)
   - **Gold Bank (Sharaf):** Z grams pure gold (asset - gold in custody)
   - **Gold in Transit:** W grams pure gold (asset - gold with manufacturers)

---

## 2. ACCOUNTING SYSTEM (COMPLETELY INVISIBLE TO CLIENT)

### 2.1 Client Accounting Philosophy

**"Accounting is a backdoor solution. Client never sees it, never touches it, never cares about it."**

**Client Perspective:**
- Client creates customers, suppliers, gold banks
- Client manages orders, billing, payments
- Client sees financial summaries on dashboard
- **Accounting happens automatically in background**
- **Client never sees journal entries, accounts, or accounting menus**

**Expert Perspective:**
- Accounting system runs 100% automatically
- Experts can access backdoor for corrections/reports
- Manual interventions only when auto-system fails
- Accounting ensures compliance and accurate reporting

### 2.2 Zero-Client Accounting Interface

**What Client NEVER Sees:**
- ❌ Accounting menu or module
- ❌ Journal entry screens
- ❌ Account creation forms
- ❌ Manual transaction entry
- ❌ Balance sheet/profit & loss screens
- ❌ Any accounting terminology or concepts

**What Client DOES See:**
- ✅ Customer creation → Auto-creates receivable account
- ✅ Supplier creation → Auto-creates payable account
- ✅ Gold Bank creation → Auto-creates custody account
- ✅ Order creation → Auto-records transactions
- ✅ Payment collection → Auto-updates balances
- ✅ Dashboard summaries → Auto-calculated financial KPIs

### 2.2 Hierarchical Account Structure (Parent-Child)

**Account Creation Levels:**

**1. 🏠 Main Accounts (Parents/Top-Level)**
- Asset, Liability, Income, Expense, Equity categories
- Can have children or be standalone
- Examples: Assets, Liabilities, Bank Accounts, Accounts Receivable

**2. 👶 Child Accounts (Sub-Accounts)**
- Accounts under main accounts
- Examples: HDFC Current (under Bank Accounts), Customer A (under Accounts Receivable)

**3. 👶👶 Sub-Accounts (Children of Children)**
- Multi-level hierarchy support
- Examples: HDFC Interest Account (under HDFC Current)

**Gold Smith Account Hierarchy Examples:**

#### **Banking Hierarchy:**
```
MAIN-1002: Bank Accounts (Parent)
├── 1002-001: HDFC Current Account
│   └── 1002-001-001: HDFC Interest Income
├── 1002-002: SBI Savings Account
│   └── 1002-002-001: SBI Interest Income
└── 1002-003: BOB Credit Card
    └── 1002-003-001: BOB CC Interest Expense
```

#### **Customer Receivables Hierarchy:**
```
MAIN-1003: Accounts Receivable (Parent)
├── 1003-001: Customer A
│   ├── 1003-001-001: Customer A - Branch 1
│   └── 1003-001-002: Customer A - Branch 2
├── 1003-002: Customer B
└── 1003-003: Customer C
```

#### **Supplier Payables Hierarchy:**
```
MAIN-2001: Accounts Payable (Parent)
├── 2001-001: Supplier X
│   ├── 2001-001-001: Supplier X - Materials
│   └── 2001-001-002: Supplier X - Services
├── 2001-002: Supplier Y
└── 2001-003: Supplier Z
```

### 2.3 Account Creation Triggers (100% AUTOMATIC)

**Client Action → Automatic Accounting Creation**

#### **🏢 FIRM ACCOUNTS - SYSTEM AUTO-SETUP**
```
WHEN: Company Admin logs in for the first time
CLIENT ACTION: Just logs in, sees "Setting up company..." loading screen
AUTO PROCESS:
├── System creates 15 core gold smith accounts (invisible to client)
├── Initializes gold price, settings (invisible to client)
├── Client sees dashboard - accounting ready in background
└── Client never knows accounting exists
```

#### **👤 CUSTOMER ACCOUNT CREATION - BUSINESS ENTITY TRIGGER**
```
CLIENT ACTION: Creates customer profile in Customers menu
AUTO PROCESS:
├── Client enters: Name, Phone, Address (business details only)
├── System auto-creates receivable account: CUST-[CustomerID]
├── Links to customer profile (invisible to client)
├── Ready for transactions (invisible to client)
└── Client sees customer list, never sees accounts
```

#### **🏭 SUPPLIER ACCOUNT CREATION - BUSINESS ENTITY TRIGGER**
```
CLIENT ACTION: Creates supplier profile in Suppliers menu
AUTO PROCESS:
├── Client enters: Name, Contact, Making Charge Rate (business details only)
├── System auto-creates payable account: SUPP-[SupplierID]
├── Links to supplier profile (invisible to client)
├── Ready for payables tracking (invisible to client)
└── Client sees supplier list, never sees accounts
```

#### **🏦 GOLD BANK ACCOUNT CREATION - BUSINESS ENTITY TRIGGER**
```
CLIENT ACTION: Creates Gold Bank profile in Gold Banks menu
AUTO PROCESS:
├── Client enters: Bank Name, Branch, Contact (business details only)
├── System auto-creates custody sub-account: 1101-BANK-[SequentialID] under MAIN-1101
├── Links to gold bank profile (invisible to client)
├── Ready for gold custody tracking (invisible to client)
└── Client sees gold bank list, never sees accounts
```

**Current Implementation Notes:**
- **Account Structure:** Creates sub-accounts under MAIN-1101 (Gold Bank parent)
- **Naming Pattern:** 1101-BANK-001, 1101-BANK-002, etc.
- **Parent Account:** All gold bank sub-accounts roll up to MAIN-1101
- **Balance Tracking:** Individual bank balances + consolidated parent balance

**Client NEVER Sees:**
- Account creation forms
- Account codes (1101-BANK-XXX)
- Account balances
- Any accounting terminology

### 2.3.1 15 Default Accounts for Gold Smith Firm

**Auto-created during company initialization with MAIN-XXXX codes:**

#### **ASSETS (MAIN-1000 to MAIN-1099)**
1. **MAIN-1001: Cash** - Petty cash, USD currency
2. **MAIN-1002: Bank Accounts** - Parent for individual bank accounts
3. **MAIN-1003: Accounts Receivable** - Parent for customer receivables (gold grams)
4. **MAIN-1101: Gold Bank (Sharaf)** - Gold custody account (gold grams)
5. **MAIN-1102: Gold in Transit** - Gold with manufacturers (gold grams)
6. **MAIN-1103: Finished Goods Inventory** - Completed jewelry (gold grams equivalent)

#### **LIABILITIES (MAIN-2000 to MAIN-2099)**
7. **MAIN-2001: Accounts Payable** - Parent for manufacturer payables (USD)
8. **MAIN-2101: Manufacturer Payables** - Making charges owed (USD)

#### **EQUITY (MAIN-3000 to MAIN-3099)**
9. **MAIN-3001: Owner's Capital** - Initial investment (gold grams/USD)

#### **INCOME (MAIN-4000 to MAIN-4099)**
10. **MAIN-4001: Commission Income** - Commission earned (gold grams)

#### **EXPENSES (MAIN-5000 to MAIN-5099)**
11. **MAIN-5001: Making Charges Expense** - Manufacturing costs (USD)
12. **MAIN-5002: Administrative Expenses** - Office/admin costs (USD)
13. **MAIN-5003: Marketing Expenses** - Advertising/promotion (USD)
14. **MAIN-5004: Transportation Expenses** - Delivery/shipping (USD)
15. **MAIN-5005: Miscellaneous Expenses** - Other operating costs (USD)

**Account Code Structure:**
- **MAIN-XXXX:** Parent accounts (can have children)
- **XXXX-XXX:** Child accounts under parents (e.g., 1101-BANK-001 for gold banks)
- **XXXX-XXX-YYY:** Sub-accounts under children

**Gold Bank Hierarchy Example:**
```
MAIN-1101: Gold Bank (Sharaf) - Parent
├── 1101-BANK-001: Sharaf Main Branch
├── 1101-BANK-002: Sharaf Kabul Branch  
└── 1101-BANK-003: Sharaf Kandahar Branch
```

**Balance Types:**
- **Gold Accounts:** Track pure gold grams (1101*, 1102, 1103, 1301, 4101)
- **USD Accounts:** Track USD currency (1001, 1002, 2101, 5001-5005)
- **Mixed Accounts:** Can hold both (3001 for owner contributions)

*Note: 1101 includes all gold bank sub-accounts (1101-BANK-XXX)

### 2.4 Automated Transactions (100% INVISIBLE TO CLIENT)

**Client Business Actions → Automatic Accounting Entries**

**Client Perspective:** "I just manage my gold shop business. Numbers update automatically."

**1. Client Creates Order:**
```
Client Action: Enters order details (weight, purity, making charge)
Auto Accounting: NO ENTRY (just order record)
Client Sees: Order confirmation, nothing about accounting
```

**2. Client Issues Gold Challan:**
```
Client Action: Clicks "Issue Challan" for order
Auto Accounting:
Debit: Gold in Transit - Manufacturer (invisible)
Credit: Selected Gold Bank Sub-Account (e.g., 1101-BANK-001) (invisible)
Client Sees: Challan printed, ready for supplier

Current Implementation Note: Currently uses main account 1101, should be updated to use specific gold bank sub-accounts
```

**3. Supplier Returns Product:**
```
Client Action: Receives finished jewelry, enters making charge paid
Auto Accounting:
Debit: Finished Goods Inventory (invisible)
Credit: Gold in Transit (invisible)
Debit: Making Charges Expense (invisible)
Credit: Supplier Payables (invisible)
Client Sees: Product received, making charge recorded
```

**4. Client Creates Bill:**
```
Client Action: Clicks "Generate Bill" for customer
Auto Accounting:
Debit: Customer Receivables (invisible)
Credit: Finished Goods Inventory (invisible)
Credit: Commission Income (invisible)
Client Sees: Bill printed with amounts
```

**5. Customer Makes Payment (Gold + USD Mixed):**
```
Client Action: Records payment (gold grams + USD cash)
System auto-converts USD to equivalent gold grams using current price
Auto Accounting:
Debit: Gold Bank (Sharaf) (invisible) - Total equivalent gold grams
Credit: Customer Receivables (invisible) - Total equivalent gold grams
Client Sees: Payment recorded, balance updated (all in gold grams)

Current Implementation Note: Currently debits Gold in Transit (1102) instead of Gold Bank (1101) - needs correction
```

**6. Client Pays Supplier:**
```
Client Action: Pays cash to supplier for making charges
Auto Accounting:
Debit: Supplier Payables (invisible)
Credit: Cash/Bank (invisible)
Client Sees: Payment recorded, supplier balance cleared
```

**Client NEVER Sees:**
- Debit/Credit entries
- Account names
- Journal vouchers
- Any accounting screens
- Balance calculations

**Client ONLY Sees:**
- Business operations (orders, bills, payments)
- Financial summaries on dashboard
- Customer/supplier balances in business context

### 2.5 Expert Account Transfer (BACKDOOR ONLY - CLIENT NEVER SEES)

**Purpose:** For accounting experts to fix auto-system glitches. Client never accesses this.

**Access Control:** 
- 🔒 **Hidden from client** - No menu item visible
- 🔒 **Expert-only access** - Requires special login/permissions
- 🔒 **Audit logged** - All expert actions tracked

**When Used:**
- Auto-system calculation errors
- Gold price fluctuation adjustments
- Manual corrections needed
- System migration fixes

**Client Impact:** Zero. Client continues normal business operations.

### 2.6 Manual Journal Entries (BACKDOOR ONLY - CLIENT NEVER SEES)

**Purpose:** Complex transactions that auto-system can't handle. Client never sees this interface.

**Access Control:**
- 🔒 **Completely hidden** from client interface
- 🔒 **Expert access only** - Accounting professionals
- 🔒 **Approval required** for major entries

**When Manual Entries Needed:**
- Asset purchases/sales
- Loan transactions
- Complex adjustments
- Period-end corrections
- Reversals of auto-entries

**Client Experience:** Unaffected. Business continues normally while experts fix in background.

### 2.7 Account Creation & Management (100% INVISIBLE TO CLIENT)

**Client Creates Business Entities → System Auto-Creates Accounts**

**Client Business Actions:**

**1. Client Creates Customer:**
```javascript
// Client sees simple form:
Customer Name: Ahmad Gul
Phone: +93-700-123456
Address: Kabul, Afghanistan

// System auto-creates (invisible):
Account Code: CUST-001
Account Type: Receivable
Balance: 0.000g pure gold
```

**2. Client Creates Supplier:**
```javascript
// Client sees simple form:
Supplier Name: Kabul Jewellers
Contact: +93-701-654321
Making Charge Rate: $1 per gram

// System auto-creates (invisible):
Account Code: SUPP-001
Account Type: Payable
Balance: $0.00 USD
```

**3. Client Creates Gold Bank:**
```javascript
// Client sees simple form:
Bank Name: Sharaf Gold Bank
Branch: Main Branch
Contact: +93-702-987654

// System auto-creates (invisible):
Account Code: BANK-001
Account Type: Gold Custody
Balance: 0.000g pure gold
```

**Client NEVER Sees:**
- Account creation forms
- Account code generation
- Account type selection
- Balance tracking screens
- Any accounting terminology

**Client ONLY Sees:**
- Business entity forms (customers, suppliers, gold banks)
- Business operation results
- Financial summaries in business context

### 2.8 Financial Reports & Analytics (CLIENT SEES BUSINESS SUMMARIES ONLY)

**Client Dashboard - Auto-Calculated Business KPIs:**

**What Client Sees on Dashboard:**
- ✅ **Gold Position:** "Gold in Bank: 1,250.5g | Gold with Suppliers: 380.2g"
- ✅ **Customer Outstanding:** "Total Due: 2,145.8g pure gold"
- ✅ **Supplier Outstanding:** "Total Owed: $12,450 USD"
- ✅ **Today's Commission:** "Earned Today: 25.6g pure gold"
- ✅ **Cash Position:** "Cash in Hand: $5,200 | Bank Balance: $18,750"
- ✅ **Payment Flexibility:** "Accept gold, USD, or mixed payments - all converted to gold value"

**What Client NEVER Sees:**
- ❌ Balance Sheet reports
- ❌ Profit & Loss statements
- ❌ Journal entry listings
- ❌ Account balances
- ❌ Accounting terminology

**Expert Backdoor Reports (Hidden):**
- 🔒 **Full Balance Sheet:** Assets = Liabilities + Equity
- 🔒 **Detailed P&L:** Income vs Expenses breakdown
- 🔒 **Customer Statements:** Individual account details
- 🔒 **Supplier Statements:** Individual payable details
- 🔒 **Gold Movement Report:** Challan and return tracking
- 🔒 **Audit Trail:** All transaction history

**Client Philosophy:** "Show me my business numbers in simple terms. Hide all the accounting complexity."

### 2.9 Accounting Controls & Security (100% AUTOMATIC & INVISIBLE)

**Client Experience:** "System just works. No accounting errors, no manual fixes needed."

**Automatic Controls (Invisible to Client):**
- ✅ **Balance Validation:** All entries auto-balance (gold/USD separately)
- ✅ **Account Validation:** Only valid combinations allowed (auto-handled)
- ✅ **Audit Trail:** Complete transaction history (for experts)
- ✅ **User Tracking:** Who did what (invisible logging)
- ✅ **Period Controls:** Historical entries tracked (auto-managed)

**Client NEVER Sees:**
- ❌ Balance validation errors
- ❌ Account selection prompts
- ❌ Security warnings
- ❌ Audit messages
- ❌ Any accounting controls

**Expert Backdoor Security:**
- 🔒 **Role-Based Access:** Experts have special permissions
- 🔒 **Expert Transfers:** Only experts can do manual corrections
- 🔒 **Approval Workflow:** Major changes require approval
- 🔒 **Data Integrity:** No unauthorized accounting modifications

**System Reliability Goal:** 99.9% automatic accuracy. Experts intervene only for rare edge cases.

## 📋 FLEXIBLE PAYMENT SYSTEM SUMMARY (EASY FOR NON-ACCOUNTING CLIENT)

### **"Customer pays in USD? No problem - system handles it automatically!"**

**Client's Simple Experience:**
1. **Customer owes 328.438g pure gold**
2. **Customer pays 321.557g gold + $1,000 USD**
3. **System shows: "$1,000 USD = 6.881g gold equivalent"**
4. **Client accepts payment - done!**
5. **Dashboard updates: Customer balance reduced by 328.438g total**

**What Client Sees:**
- ✅ **Payment entry form** with gold + USD fields
- ✅ **Auto-conversion** of USD to gold grams
- ✅ **Price adjustment option** for negotiation
- ✅ **Total in gold grams** for easy understanding
- ✅ **Balance updates** in gold terms

**What System Does (Invisible):**
- 🔒 **Converts USD to gold** using current/negotiated price
- 🔒 **Records gold portion** to Gold Bank account
- 🔒 **Records USD portion** to Cash in Hand account
- 🔒 **Updates customer receivable** in gold equivalent
- 🔒 **Maintains perfect accounting balance**

**Business Benefits:**
- ✅ **Accept any payment type** - gold, USD, or mixed
- ✅ **No rejected payments** due to currency issues
- ✅ **Flexible pricing** per customer negotiation
- ✅ **Maintains gold-based accounting** for business logic
- ✅ **Simple for client** - no accounting complexity

**Technical Excellence:**
- ✅ **Real-time price updates** from gold APIs
- ✅ **Audit trail** of all conversions and adjustments
- ✅ **Dual accounting** - gold and USD properly tracked
- ✅ **Balance validation** ensures accounting integrity
- ✅ **Expert backdoor** for any manual corrections

**Result:** Client runs gold shop easily, accepts any payment form, system handles all accounting automatically in background.

---

## 📋 ACCOUNTING SYSTEM SUMMARY (FOR NON-ACCOUNTING CLIENT)

### **Invisible Accounting Philosophy**

**"Client runs gold shop business. Accounting handles itself in background."**

**Client Benefits:**
- ✅ **Zero Accounting Knowledge Required** - Client is not accountant
- ✅ **Zero Manual Accounting Work** - No journal entries, no account creation
- ✅ **Automatic Financial Tracking** - All transactions recorded invisibly
- ✅ **Business-Focused Interface** - Only sees customers, suppliers, orders, bills
- ✅ **Real-Time Financial Visibility** - Dashboard shows key business numbers
- ✅ **Compliance & Reporting Ready** - Accounting maintains proper books

**Expert Benefits:**
- 🔒 **Backdoor Access** - Accounting system available for corrections
- 🔒 **Professional Standards** - Double-entry accounting maintained
- 🔒 **Audit Trail** - Complete transaction history
- 🔒 **Manual Override** - Expert can fix any auto-system issues
- 🔒 **Financial Reports** - Balance sheet, P&L for business management

**Implementation Goal:** Client uses system for 5+ years without ever seeing accounting menu or knowing accounting exists.

---

## 1. GOLD PRICE MANAGEMENT SYSTEM

### 1.1 Gold Price Entry Interface

**Dual Entry System (Reversible):**

```
┌─────────────────────────────────────────┐
│  Gold Price Update                      │
├─────────────────────────────────────────┤
│                                         │
│  Price per Ounce:  [$4,530.00] 🔗      │
│                    ↕ Auto-calculate     │
│  Price per Gram:   [$145.43]   🔗      │
│                                         │
│  Last Updated: Dec 30, 2025 10:30 AM   │
│  Source: [goldprice.org] [Refresh]     │
│                                         │
│  [Save Price] [View History]           │
└─────────────────────────────────────────┘
```

**Features:**
- **Enter Either Value:**
  - Type ounce price → gram price auto-calculates (÷ 31.15)
  - Type gram price → ounce price auto-calculates (× 31.15)
- **Live API Integration:** Fetch from gold price websites (goldprice.org, kitco.com)
- **Manual Override:** Can manually enter if API unavailable
- **Price History:** Track all price updates with timestamps
- **Multiple Display:** Show both ounce and gram prices always

**Calculation Formula:**
```javascript
pricePerGram = pricePerOunce / 31.15
pricePerOunce = pricePerGram * 31.15
```

### 1.2 Gold Price API Integration

**Supported APIs:**
1. **Primary:** goldprice.org API
2. **Secondary:** kitco.com API
3. **Fallback:** Manual entry

**API Data Structure:**
```json
{
  "metal": "gold",
  "currency": "USD",
  "pricePerOunce": 4530.00,
  "pricePerGram": 145.43,
  "timestamp": "2025-12-30T10:30:00Z",
  "source": "goldprice.org"
}
```

**Update Frequency:**
- **Real-time:** On-demand refresh button
- **Scheduled:** Auto-update every 1 hour
- **Dashboard:** Show last update time
- **Alert:** Notify if price changes > 2%

### 1.3 USD Payment Conversion to Pure Gold (Flexible Customer Payments)

**Business Need:** Customers may pay in USD cash instead of pure gold. System converts USD to equivalent pure gold grams using current market price.

**Conversion Interface (Payment Entry):**

```
┌─────────────────────────────────────────┐
│  Customer Payment Entry                 │
├─────────────────────────────────────────┤
│  Customer: Ahmad Gul                    │
│  Outstanding: 328.438g pure gold        │
│                                         │
│  Payment Method:                        │
│  ⃝ Pure Gold Only                      │
│  ⃝ USD Cash Only                       │
│  ⃝ Mixed (Gold + USD)                  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Gold Received: [_______] grams         │
│                                         │
│  USD Received:  [$1,000.00] 🔄         │
│  Current Gold Price: $145.43/g         │
│  Equivalent Gold: [6.881g] grams       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Total Payment: 328.438g pure gold      │
│  (Gold + USD converted)                 │
│                                         │
│  [Adjust Price] [Record Payment]        │
└─────────────────────────────────────────┘
```

**Price Adjustment Feature:**
```
┌─────────────────────────────────────────┐
│  Adjust Gold Price for This Payment    │
├─────────────────────────────────────────┤
│  Current Market Price: $145.43/g       │
│                                         │
│  Adjusted Price: [$142.50] /g          │
│  Reason: Customer negotiated rate      │
│                                         │
│  USD Amount: $1,000.00                 │
│  Equivalent Gold: [7.018g] grams       │
│                                         │
│  [Use Market Price] [Apply Adjustment] │
└─────────────────────────────────────────┘
```

**Conversion Logic:**

**1. Standard Conversion (Market Price):**
```javascript
usdAmount = 1000.00
currentPricePerGram = 145.43
equivalentGoldGrams = usdAmount / currentPricePerGram
equivalentGoldGrams = 1000.00 / 145.43 = 6.881 grams
```

**2. Adjusted Price Conversion:**
```javascript
usdAmount = 1000.00
adjustedPricePerGram = 142.50  // Customer negotiated rate
equivalentGoldGrams = usdAmount / adjustedPricePerGram
equivalentGoldGrams = 1000.00 / 142.50 = 7.018 grams
```

**3. Mixed Payment Calculation:**
```javascript
goldReceived = 321.557 grams  // Physical gold
usdReceived = 1000.00
usdConvertedToGold = 1000.00 / 145.43 = 6.881 grams
totalPaymentGrams = 321.557 + 6.881 = 328.438 grams
```

**Accounting Treatment (Dual Entry - Gold + USD):**

**Customer Pays Mixed (Gold + USD):**
```
User Action: Customer pays 321.557g gold + $1,000 USD
System converts $1,000 to 6.881g equivalent gold (for display only)
Total payment value: 328.438g pure gold equivalent

Auto Accounting Entries:
1. Gold portion:
   Debit: Gold Bank (Sharaf) (1101) - 321.557g pure gold
   Credit: Customer Receivables (1301) - 321.557g pure gold

2. USD portion:
   Debit: Cash in Hand (1201) - $1,000 USD
   Credit: Customer Receivables (1301) - $1,000 USD equivalent (converted to gold for tracking)

Narration: Payment received - 321.557g gold + $1,000 USD (converted @ $145.43/g = 6.881g equivalent)
```

*Note: Current implementation incorrectly debits Gold in Transit (1102) for gold portion instead of Gold Bank (1101)*

**"Gold in Hand" Concept:**
- **Physical Gold:** Gold received from customers goes to Gold Bank (Sharaf)
- **USD Cash:** USD received is "cash in hand" until deposited to bank
- **Display:** Everything shown in pure gold equivalent for client simplicity
- **Accounting:** Maintains separate tracking of gold vs USD assets

**Client Benefits:**
- ✅ **Flexible Payments:** Accept gold, USD, or mixed payments
- ✅ **Real-Time Conversion:** Uses current market price with adjustment option
- ✅ **Price Negotiation:** Can adjust gold price per customer/payment
- ✅ **Pure Gold Accounting:** Everything stored and tracked in gold grams
- ✅ **No Currency Complexity:** Client sees everything in gold terms
- ✅ **Cash Management:** USD cash tracked as "cash in hand" until banked

**System Stores:**
- ✅ **Payment Amount:** Always in pure gold grams (for receivables tracking)
- ✅ **Conversion Details:** USD amount, price used, equivalent grams
- ✅ **Asset Tracking:** Gold to Gold Bank, USD to Cash in Hand
- ✅ **Audit Trail:** Price adjustments logged for compliance

**Client Experience:**
**"Customer pays $1,000 USD? System shows me it's worth 6.881g gold. I accept it, record it, done."**

**Expert Accounting View:**
- Gold portion: Increases Gold Bank balance
- USD portion: Increases Cash in Hand balance  
- Customer receivable: Reduced by total equivalent gold value
- All properly balanced in double-entry accounting

---

## 2. CHART OF ACCOUNTS (PURE GOLD & USD DUAL SYSTEM)

### 2.1 Account Structure

**Assets (1000-1999):**
```
1000 - ASSETS (Parent)
  1100 - Gold Assets
    1101 - Gold Bank (Sharaf) - Pure Gold Custody [in grams]
    1102 - Gold in Transit to Manufacturers [in grams]
    1103 - Finished Goods Inventory [in pure gold equivalent grams]
  1200 - Cash & Bank
    1201 - Cash [in USD]
    1202 - Bank Account [in USD]
  1300 - Receivables
    1301 - Customer Receivables [in pure gold grams]
```

**Liabilities (2000-2999):**
```
2000 - LIABILITIES (Parent)
  2100 - Payables
    2101 - Manufacturer Payables - Making Charges [in USD]
    2102 - Other Payables [in USD]
```

**Equity (3000-3999):**
```
3000 - EQUITY (Parent)
  3100 - Capital
    3101 - Owner's Capital [mixed - gold + USD]
  3200 - Retained Earnings
    3201 - Current Year Profit/Loss [mixed]
```

**Revenue (4000-4999):**
```
4000 - REVENUE (Parent)
  4100 - Sales Revenue
    4101 - Commission Income [in pure gold grams]
```

**Expenses (5000-5999):**
```
5000 - EXPENSES (Parent)
  5100 - Cost of Services
    5101 - Making Charges Paid to Manufacturers [in USD]
  5200 - Operating Expenses
    5201 - Salaries [in USD]
    5202 - Rent [in USD]
    5203 - Utilities [in USD]
```

### 2.2 Account Characteristics

**Gold-Based Accounts (Measured in Pure Gold Grams):**
- 1101 - Gold Bank (Sharaf)
- 1102 - Gold in Transit to Manufacturers
- 1103 - Finished Goods Inventory
- 1301 - Customer Receivables
- 4101 - Commission Income

**USD-Based Accounts:**
- 1201 - Cash
- 1202 - Bank Account
- 2101 - Manufacturer Payables
- 5101 - Making Charges Paid

**Important:** Each transaction records both the unit (grams or USD) and the conversion rate at transaction time for reference.

---

## 3. TRANSACTION TYPES & ACCOUNTING ENTRIES

---

## 3. TRANSACTION TYPES & ACCOUNTING ENTRIES

### 3.1 Customer Order Entry (No Accounting Entry)

**Business Flow:**
- Customer calls/visits: "I need 500g 18k bracelet"
- Calculate pure gold: 500g × 0.75 = 375g
- Calculate commission: $1/g × 500g ÷ $145.43/g = 3.438g pure gold
- Total: 375 + 3.438 = 378.438g pure gold owed
- Generate **Order Receipt** (not bill)

**Accounting Entry:** NONE - Just order record

**Order Document:**
```
ORDER RECEIPT #ORD-001
Date: Dec 30, 2025
Customer: Ahmad Shop

Product: Bracelet
Weight: 500g (18k)
Pure Gold Required: 375.000g
Commission (in gold): 3.438g
Prior Balance: -50.000g (credit)
TOTAL PURE GOLD: 328.438g

Reference Amount: $47,760 (at $145.43/gram)
```

---

### 3.2 Issue Gold Challan to Manufacturer

**Business Flow:**
- Issue **Challan/Voucher** authorizing manufacturer to withdraw gold from Sharaf
- Manufacturer takes challan to Gold Bank (Sharaf)
- Sharaf releases pure gold to manufacturer

**Accounting Entry:**
```
Date: Dec 30, 2025
Description: Gold Challan #CH-001 issued to Karimi Manufacturing

Debit:  Gold in Transit - Manufacturer (1102)    375.000g
Credit: Gold Bank Sub-Account (e.g., 1101-BANK-001)    375.000g
```

*Note: Current implementation uses main account 1101, should be updated to use specific gold bank sub-accounts*

**Challan Document:**
```
═══════════════════════════════════════════════════════
        GOLD WITHDRAWAL CHALLAN / VOUCHER
        Challan No: CH-001
═══════════════════════════════════════════════════════
Date: December 30, 2025
Order Reference: ORD-001

TO: Gold Bank (Sharaf)
Please release the following gold to the bearer:

Manufacturer: Karimi Manufacturing
Manufacturer Code: MFG-001

GOLD DETAILS:
Pure Gold (24k): 375.000 grams

Purpose: Production of 500g 18k Bracelet for Order ORD-001

Authorized By: _______________
Gold Bank Signature: _______________

═══════════════════════════════════════════════════════
```

---

### 3.3 Manufacturer Returns with Finished Product

**Business Flow:**
- Manufacturer brings finished jewelry (500g 18k)
- Making charge: $1/g × 500g = $500 USD
- Payment: Cash or Credit

**Accounting Entries:**

**A. Record Finished Goods Inventory:**
```
Date: Jan 5, 2026
Description: Received finished product from Karimi Manufacturing

Debit:  Finished Goods Inventory (1103)          375.000g
Credit: Gold in Transit - Manufacturer (1102)    375.000g
```

**B. Record Making Charge Liability:**
```
Date: Jan 5, 2026
Description: Making charges due to Karimi Manufacturing

Debit:  Making Charges Expense (5101)            $500 USD
Credit: Manufacturer Payables (2101)             $500 USD
        OR
Credit: Cash (1201)                              $500 USD (if paid immediately)
```

---

### 3.4 Case: Manufacturer Needs Additional Gold

**Business Flow:**
- Manufacturer needs 100g more material (60g pure gold for 18k)
- Issue **Additional Challan** for 60g pure gold

**Accounting Entry:**
```
Date: Jan 3, 2026
Description: Additional gold challan #CH-002 for Order ORD-001

Debit:  Gold in Transit - Manufacturer (1102)    60.000g
Credit: Gold Bank (Sharaf) (1101)                60.000g
```

**When Product Received:**
- Total gold used: 375 + 60 = 435g
- Finished product: 600g 18k (instead of 500g)
- Adjust inventory and making charges accordingly

---

### 3.5 Case: Manufacturer Returns Excess Gold

**Business Flow:**
- Manufacturer used less gold (only 300g instead of 375g)
- Returns 75g pure gold
- Manufacturer returns gold to client
- Client deposits to Sharaf immediately

**Accounting Entry:**
```
Date: Jan 5, 2026
Description: Excess gold returned by Karimi Manufacturing

Debit:  Gold Bank (Sharaf) (1101)                75.000g
Credit: Gold in Transit - Manufacturer (1102)    75.000g
```

---

### 3.6 Customer Delivery & Billing

**Business Flow:**
- Customer collects finished product
- Calculate actual pure gold based on finished weight
- Add commission in gold
- Subtract prior balance
- Generate Bill/Invoice in pure gold

**Accounting Entry:**
```
Date: Jan 10, 2026
Description: Bill #INV-001 for Order ORD-001 - Ahmad Shop

Debit:  Customer Receivables (1301)              328.438g
Credit: Finished Goods Inventory (1103)          375.000g
Credit: Commission Income (4101)                 3.438g
Debit:  Customer Receivables (1301)              50.000g (adjust prior credit)
```

**Bill Document:**
```
═══════════════════════════════════════════════════════
        INVOICE / BILL
        Invoice No: INV-001
═══════════════════════════════════════════════════════
Date: January 10, 2026
Order Reference: ORD-001
Customer: Ahmad Shop

PRODUCT DETAILS:
Bracelet - 500g (18k)

PURE GOLD CALCULATION:
Product Pure Gold:           375.000g
Commission (in gold):          3.438g
Prior Balance (credit):      -50.000g
─────────────────────────────────────
TOTAL PURE GOLD OWED:        328.438g

REFERENCE AMOUNT (Display Only):
Gold Price: $145.43/gram
Equivalent: $47,760.41

Payment Terms: Net 15 days
Due Date: January 25, 2026

═══════════════════════════════════════════════════════
** All amounts in pure gold (24k equivalent) **
** USD amount for reference only **
═══════════════════════════════════════════════════════
```

---

### 3.7 Customer Pays in Pure Gold (Full Payment)

**Business Flow:**
- Customer brings 328.438g pure gold
- Client receives gold
- Client deposits to Sharaf at EOD
- Generate **Payment Receipt**

**Accounting Entry:**
```
Date: Jan 12, 2026
Description: Payment Receipt #PAY-001 from Ahmad Shop

Debit:  Gold Bank (Sharaf) (1101)                328.438g
Credit: Customer Receivables (1301)              328.438g
```

*Note: Current implementation incorrectly debits Gold in Transit (1102) instead of Gold Bank (1101)*

**Payment Receipt:**
```
═══════════════════════════════════════════════════════
        PAYMENT RECEIPT
        Receipt No: PAY-001
═══════════════════════════════════════════════════════
Date: January 12, 2026
Invoice Reference: INV-001
Customer: Ahmad Shop

PAYMENT DETAILS:
Amount Paid (Pure Gold): 328.438 grams
Previous Balance: 328.438g
Amount Paid: 328.438g
Remaining Balance: 0.000g

Reference Amount: $47,760.41
(Based on gold price: $145.43/gram)

Payment Status: PAID IN FULL

═══════════════════════════════════════════════════════
```

---

### 3.8 Customer Pays in Pure Gold (Partial Payment)

**Business Flow:**
- Customer brings 150g pure gold (partial)
- Remaining: 328.438 - 150 = 178.438g still owed
- Generate **Partial Payment Receipt**

**Accounting Entry:**
```
Date: Jan 12, 2026
Description: Partial Payment Receipt #PAY-001 from Ahmad Shop

Debit:  Gold Bank (Sharaf) (1101)                150.000g
Credit: Customer Receivables (1301)              150.000g
```

**Partial Payment Receipt:**
```
═══════════════════════════════════════════════════════
        PARTIAL PAYMENT RECEIPT
        Receipt No: PAY-001
═══════════════════════════════════════════════════════
Date: January 12, 2026
Invoice Reference: INV-001
Customer: Ahmad Shop

PAYMENT DETAILS:
Amount Paid (Pure Gold): 150.000 grams
Previous Balance: 328.438g
Amount Paid: 150.000g
Remaining Balance: 178.438g

Reference Amount: $21,814.50 paid
(Based on gold price: $145.43/gram)

Payment Status: PARTIALLY PAID
Next Payment Due: 178.438g by January 25, 2026

═══════════════════════════════════════════════════════
```

---

### 3.9 Customer with Prior Credit Balance

**Business Flow:**
- Customer already has 500g credit balance (overpaid previously)
- New order: 328.438g owed
- Net result: Customer still has 500 - 328.438 = 171.562g credit

**Accounting Entry:**
```
Date: Jan 10, 2026
Description: Invoice #INV-002 with prior credit adjustment

Debit:  Customer Receivables (1301)              -171.562g (credit balance)
Credit: Finished Goods Inventory (1103)          375.000g
Credit: Commission Income (4101)                 3.438g
Credit: Customer Receivables (1301)              500.000g (adjust prior credit)
```

**Net Effect:** Customer Receivables shows -171.562g (credit balance remains)

---

### 3.10 Customer with Prior Debit Balance (Outstanding)

**Business Flow:**
- Customer already owes 200g (prior outstanding)
- New order: 328.438g owed
- Total owed: 200 + 328.438 = 528.438g

**Accounting Entry:**
```
Date: Jan 10, 2026
Description: Invoice #INV-002 with prior outstanding

Debit:  Customer Receivables (1301)              328.438g
Credit: Finished Goods Inventory (1103)          375.000g
Credit: Commission Income (4101)                 3.438g
Debit:  Customer Receivables (1301)              50.000g (adjust)
```

**Net Effect:** Customer Receivables balance = 200 + 328.438 = 528.438g owed

---

### 3.11 Pay Manufacturer Making Charges (Cash)

**Business Flow:**
- Pay $500 USD to manufacturer for making charges
- Payment made in cash

**Accounting Entry:**
```
Date: Jan 15, 2026
Description: Payment to Karimi Manufacturing for making charges

Debit:  Manufacturer Payables (2101)             $500 USD
Credit: Cash (1201)                              $500 USD
```

---

### 3.12 Pay Manufacturer Making Charges (Credit)

**Business Flow:**
- Record making charges as payable
- Pay later

**Accounting Entry (Already recorded in 3.3):**
```
Date: Jan 5, 2026
Description: Making charges liability

Debit:  Making Charges Expense (5101)            $500 USD
Credit: Manufacturer Payables (2101)             $500 USD
```

**Later Payment:**
```
Date: Jan 20, 2026
Description: Payment to Karimi Manufacturing

Debit:  Manufacturer Payables (2101)             $500 USD
Credit: Cash (1201)                              $500 USD
```

---

### 3.13 End of Day Gold Deposit to Sharaf

**Business Flow:**
- All gold received during the day deposited to Gold Bank (Sharaf)
- This is automatically handled when recording customer payments
- No separate entry needed - already recorded in payment entries

**Note:** The "Debit: Gold Bank (Sharaf)" entry in payment transactions represents the deposit to Sharaf.

---

## 4. ORDER MANAGEMENT (PURE GOLD BASED)

---

## 4. ORDER MANAGEMENT (PURE GOLD BASED)

### 4.1 Order Status Workflow

**Order Lifecycle:**
```
New Order → Challan Issued → In Production → Product Received → Customer Billed → Payment Received → Completed
```

**Status Definitions:**

| Status | Description | Accounting Impact |
|--------|-------------|-------------------|
| **New Order** | Customer order received | None - just order record |
| **Challan Issued** | Gold challan issued to manufacturer | Debit: Gold in Transit, Credit: Gold Bank (Sharaf) - *Currently uses main account 1101, should use specific sub-account* |
| **In Production** | Manufacturer working on product | None |
| **Product Received** | Finished product received from manufacturer | Debit: Inventory, Credit: Gold in Transit + Record Making Charges Payable |
| **Customer Billed** | Invoice/bill generated for customer | Debit: Customer Receivable, Credit: Inventory + Commission Income |
| **Payment Received** | Customer paid in pure gold | Debit: Gold Bank (Sharaf), Credit: Customer Receivable - *Currently debits Gold in Transit (1102) instead of Gold Bank (1101)* |
| **Completed** | Transaction fully closed | None |

### 4.2 Order Entry Interface

**Order Form Fields:**

```
┌─────────────────────────────────────────────────────────┐
│  New Order - Pure Gold Accounting                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Serial No: [AUTO] (Auto-generated)                    │
│  Customer: [Search Customer] (Autocomplete)            │
│  Phone: [Display/Edit]                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Product Details                                  │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Metal: Gold (Fixed - Not Dropdown)              │  │
│  │ Product Name: [Ring/Bracelet...] (Auto-suggest) │  │
│  │ Gold Karat: [18k ▼]                             │  │
│  │ Weight (گرام): [500.000] grams                  │  │
│  │ Making Charge Rate: [$1.00] per gram (USD)     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Pure Gold Calculation (تیزابی)                  │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Product Pure Gold:    375.000 g (تیزابی جنس)   │  │
│  │ Commission (in Gold):   3.438 g (تیزابی اجره)  │  │
│  │ Prior Balance:        -50.000 g (تیزابی گذشته)  │  │
│  │ ─────────────────────────────────────────────── │  │
│  │ Total Pure Gold:      328.438 g (مجموعه تیزابی) │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Reference Display (For Reference Only)          │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Gold Price: $145.43/gram                        │  │
│  │ Equivalent: $47,760.41 USD                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Manufacturer: [Select Manufacturer ▼]                 │
│  Expected Date: [2026-01-15]                           │
│                                                         │
│  [Generate Order Receipt] [Cancel]                     │
└─────────────────────────────────────────────────────────┘
```

**🔑 KEY FIELD SPECIFICATIONS:**

#### **1. Metal Field - FIXED (No Dropdown)**
- **Display:** "Metal: Gold" (read-only text, not dropdown)
- **Value:** Always "gold" in database
- **Rationale:** System is designed exclusively for gold transactions. All balances, accounting, and pricing are gold-based.
- **Future:** If silver/platinum needed, add dropdown then. For now: **Gold only.**

#### **2. Product Name Field - AUTO-SUGGESTION WITH LOCAL CACHE**

**Purpose:** Allow user to type product names manually while providing smart suggestions without hammering Firestore on every keystroke.

**Implementation Strategy:**

**A. Initial Load (On Order Window Open):**
```javascript
// Fetch ALL distinct product names from Firestore ONCE
const productNamesQuery = query(
  collection(db, `${basePath}/orders`),
  where('companyId', '==', companyId)
);

// Get all orders and extract unique product names
const orders = await getDocs(productNamesQuery);
const uniqueProductNames = [...new Set(
  orders.docs.map(doc => doc.data().productName).filter(name => name)
)];

// Store in LOCAL STATE (React state/context)
setProductNameCache(uniqueProductNames);
// Example: ["Ring", "Bracelet", "Necklace", "Earrings", "Bangle"]
```

**B. User Typing (No Firestore Queries):**
```javascript
// As user types "Bra..."
const userInput = "Bra";

// Filter from LOCAL cache only (no Firestore query!)
const suggestions = productNameCache.filter(name => 
  name.toLowerCase().startsWith(userInput.toLowerCase())
);
// Result: ["Bracelet", "Bangle"]

// Show suggestions in dropdown below input
```

**C. On Order Save:**
```javascript
// When user saves order with new product name
const newProductName = "Talacha"; // User typed new name

// Save order to Firestore
await addDoc(ordersRef, {
  productName: newProductName,
  // ... other fields
});

// Update LOCAL cache (no need to re-fetch all orders)
if (!productNameCache.includes(newProductName)) {
  setProductNameCache([...productNameCache, newProductName]);
}
```

**Benefits:**
- ✅ **Zero Firestore queries** during typing (saves costs)
- ✅ **Instant suggestions** from local cache
- ✅ **Persistent across order window sessions** (fetched once)
- ✅ **Auto-updates** when new product names are saved
- ✅ **User can still type any custom name** (not restricted to suggestions)

**UI Behavior:**
```
User types: "Br"
Dropdown shows:
  ┌─────────────────┐
  │ Bracelet        │ ← From cache
  │ Bangle          │ ← From cache
  │ "Br" (custom)   │ ← Allow typing anything
  └─────────────────┘
```

### 4.3 Order Actions & Transitions

**Available Actions per Status:**

**New Order:**
- ✅ Issue Gold Challan to Manufacturer
- ✅ Edit Order Details
- ✅ Cancel Order

**Challan Issued:**
- ✅ Record Product Received (when manufacturer returns)
- ✅ Issue Additional Challan (if more gold needed)
- ✅ Cancel Order

**Product Received:**
- ✅ Generate Customer Bill/Invoice
- ✅ Record Making Charge Payment to Manufacturer

**Customer Billed:**
- ✅ Record Customer Payment (full or partial)
- ✅ Send Payment Reminder

**Payment Received:**
- ✅ Mark as Completed (when fully paid)
- ✅ Record Additional Payment (if partial)

---

## 5. CHALLAN/VOUCHER MANAGEMENT

### 5.1 Gold Withdrawal Challan

**Purpose:** Authorization for manufacturer to withdraw pure gold from Gold Bank (Sharaf)

**Challan Generation Trigger:** When order status changes from "New Order" to "Challan Issued"

**Challan Document Format:**

```
═══════════════════════════════════════════════════════
        GOLD WITHDRAWAL CHALLAN
        Challan No: CH-001-2025
═══════════════════════════════════════════════════════
Date: December 30, 2025
Order Reference: ORD-001
Customer Order: 500g 18k Bracelet

───────────────────────────────────────────────────────
TO: Gold Bank (Sharaf)
Please release the following pure gold to the bearer:

Manufacturer: Karimi Manufacturing
Manufacturer Code: MFG-001
Phone: +93 700 123456

───────────────────────────────────────────────────────
GOLD DETAILS:
Pure Gold (24k): 375.000 grams

Purpose: Production of 500g 18k Bracelet

───────────────────────────────────────────────────────
Authorized Signature: _______________
                      Ahmad Gold Shop

Gold Bank Signature: _______________
                     Sharaf Gold Bank

Date Released: _______________
═══════════════════════════════════════════════════════
```

**Accounting Entry on Challan Issue:**
```
Debit:  Gold in Transit - Karimi Manufacturing (1102)   375.000g
Credit: Gold Bank (Sharaf) (1101)                        375.000g
```

### 5.2 Additional Gold Challan

**Scenario:** Manufacturer needs extra gold mid-production

**Trigger:** Manufacturer request for additional gold

**Challan Document:**
```
═══════════════════════════════════════════════════════
        ADDITIONAL GOLD CHALLAN
        Challan No: CH-002-2025 (Additional)
═══════════════════════════════════════════════════════
Date: January 3, 2026
Original Challan: CH-001-2025
Order Reference: ORD-001

───────────────────────────────────────────────────────
TO: Gold Bank (Sharaf)
Additional gold release required:

Manufacturer: Karimi Manufacturing
Original Gold Issued: 375.000g
Additional Gold Required: 60.000g
Total Gold Issued: 435.000g

───────────────────────────────────────────────────────
Reason: Design modification requires 600g finished weight

Authorized Signature: _______________
Gold Bank Signature: _______________
═══════════════════════════════════════════════════════
```

**Accounting Entry:**
```
Debit:  Gold in Transit - Karimi Manufacturing (1102)   60.000g
Credit: Gold Bank (Sharaf) (1101)                        60.000g
```

### 5.3 Gold Return Receipt

**Scenario:** Manufacturer returns excess gold

**Trigger:** Finished product uses less gold than issued

**Receipt Document:**
```
═══════════════════════════════════════════════════════
        GOLD RETURN RECEIPT
        Receipt No: RET-001-2025
═══════════════════════════════════════════════════════
Date: January 5, 2026
Original Challan: CH-001-2025
Order Reference: ORD-001

───────────────────────────────────────────────────────
FROM: Karimi Manufacturing
Gold Issued: 375.000g
Gold Used: 300.000g
Gold Returned: 75.000g

───────────────────────────────────────────────────────
Returned By: _______________
Received By: Ahmad Gold Shop
Deposited to Sharaf: _______________
═══════════════════════════════════════════════════════
```

**Accounting Entry:**
```
Debit:  Gold Bank (Sharaf) (1101)                        75.000g
Credit: Gold in Transit - Karimi Manufacturing (1102)    75.000g
```

---

## 6. BILLING & PAYMENT MANAGEMENT

```
┌─────────────────────────────────────────────────────────┐
│  New Order - Pure Gold Accounting                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Serial No: [12] (Manual Entry)                        │
│  Customer: [Ahmad Shop] (From Database)                │
│  Address: [Kabul, Afghanistan]                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Product Details                                  │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Product Name: [Talacha - طلاچه]                │  │
│  │ Gold Karat: [18k ▼]                             │  │
│  │ Weight (گرام): [200.000] grams                  │  │
│  │ Commission Rate: [$1.20] per gram               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Pure Gold Calculation (تیزابی)                  │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Current Pure Gold:    150.000 g  (تیزابی فعلی) │  │
│  │ Commission Gold:        1.650 g  (تیزابی اجره) │  │
│  │ Prior Balance:          0.000 g  (تیزابی گذشته)│  │
│  │ ─────────────────────────────────────────────── │  │
│  │ Total Pure Gold:      151.650 g  (مجموعه تیزابی)│  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Currency Display (For Reference Only)           │  │
│  ├─────────────────────────────────────────────────┤  │
│  │ Gold Price: $145.43/gram (from goldprice.org)  │  │
│  │ Equivalent: $22,053.45                          │  │
│  │ (This is display only - NOT stored)             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [Save Order] [Print Receipt] [Cancel]                 │
└─────────────────────────────────────────────────────────┘
---

## 6. BILLING & PAYMENT MANAGEMENT

### 6.1 Customer Billing Process

**Billing Trigger:** When customer collects finished product (status: "Product Received" → "Customer Billed")

**Bill Types:**
1. **Cash Bill:** Customer pays immediately in pure gold
2. **Credit Invoice:** Customer pays later (credit terms)

**Billing Calculation:**
```javascript
// Calculate actual finished product pure gold
const finishedWeight = 500; // grams
const karat = "18k";
const purityCoefficient = 0.75;
const productPureGold = finishedWeight * purityCoefficient; // 375g

// Calculate commission in gold
const makingChargeRate = 1.00; // USD per gram
const goldPricePerGram = 145.43; // USD
const commissionUSD = finishedWeight * makingChargeRate; // $500
const commissionGold = commissionUSD / goldPricePerGram; // 3.438g

// Get prior balance from customer record
const priorBalance = -50.000; // negative = credit

// Total pure gold owed
const totalPureGold = productPureGold + commissionGold + priorBalance;
// = 375 + 3.438 + (-50) = 328.438g
```

### 6.2 Invoice/Bill Document

**Bill Format (Pure Gold):**

```
═══════════════════════════════════════════════════════
        AHMAD GOLD SHOP
        Kabul, Afghanistan
        Phone: +93 123 456 789
═══════════════════════════════════════════════════════

        INVOICE / BILL
        Invoice No: INV-001-2025
        Date: January 10, 2026

───────────────────────────────────────────────────────
CUSTOMER DETAILS:
Name: Ahmad Shop
Code: CUST-001
Phone: +93 700 123456
Address: Kabul District 10

───────────────────────────────────────────────────────
ORDER DETAILS:
Order No: ORD-001
Product: Bracelet
Weight: 500g (18k)
Date Ordered: December 30, 2025

───────────────────────────────────────────────────────
PURE GOLD CALCULATION (حساب تیزابی):

Product Pure Gold (تیزابی جنس):           375.000g
  (500g × 75% purity)

Commission (تیزابی اجره):                   3.438g
  (Making charge: $1/g × 500g = $500)
  ($500 ÷ $145.43/g gold price)

Prior Balance (تیزابی گذشته):             -50.000g
  (Customer credit from previous orders)

─────────────────────────────────────────────────────
TOTAL PURE GOLD OWED (مجموعه تیزابی):     328.438g
═════════════════════════════════════════════════════

REFERENCE AMOUNT (For Display Only):
Gold Price Today: $145.43 per gram
Equivalent Value: $47,760.41 USD

───────────────────────────────────────────────────────
PAYMENT TERMS:
Payment Due: Pure Gold (24k equivalent)
Credit Period: Net 15 days
Due Date: January 25, 2026

───────────────────────────────────────────────────────
Customer Signature: _______________    Date: _________

───────────────────────────────────────────────────────
** All transactions in pure gold (24k equivalent) **
** USD amount for reference only **
═══════════════════════════════════════════════════════
```

### 6.3 Payment Receipt (Full Payment)

**Payment Receipt Format:**

```
═══════════════════════════════════════════════════════
        PAYMENT RECEIPT
        Receipt No: PAY-001-2025
═══════════════════════════════════════════════════════
Date: January 12, 2026
Invoice Reference: INV-001-2025
Customer: Ahmad Shop (CUST-001)

───────────────────────────────────────────────────────
PAYMENT DETAILS:

Invoice Amount:              328.438g pure gold
Amount Paid:                 328.438g pure gold
Previous Balance:            0.000g
Remaining Balance:           0.000g

───────────────────────────────────────────────────────
REFERENCE AMOUNT:
Gold Price: $145.43/gram
Payment Value: $47,760.41 USD

───────────────────────────────────────────────────────
PAYMENT STATUS: ✅ PAID IN FULL

Received By: _______________
Customer Signature: _______________

───────────────────────────────────────────────────────
** Gold deposited to Sharaf Gold Bank **
═══════════════════════════════════════════════════════
```

### 6.4 Payment Receipt (Partial Payment)

**Partial Payment Format:**

```
═══════════════════════════════════════════════════════
        PARTIAL PAYMENT RECEIPT
        Receipt No: PAY-001-2025
═══════════════════════════════════════════════════════
Date: January 12, 2026
Invoice Reference: INV-001-2025
Customer: Ahmad Shop (CUST-001)

───────────────────────────────────────────────────────
PAYMENT DETAILS:

Total Invoice Amount:        328.438g pure gold
Amount Paid Today:           150.000g pure gold
Previous Payments:           0.000g
Total Paid to Date:          150.000g
REMAINING BALANCE:           178.438g pure gold

───────────────────────────────────────────────────────
REFERENCE AMOUNT:
Gold Price: $145.43/gram
Payment Value: $21,814.50 USD
Remaining Value: $25,945.91 USD

───────────────────────────────────────────────────────
PAYMENT STATUS: ⚠️ PARTIALLY PAID

Next Payment Due: 178.438g by January 25, 2026

Received By: _______________
Customer Signature: _______________

───────────────────────────────────────────────────────
** Gold deposited to Sharaf Gold Bank **
═══════════════════════════════════════════════════════
```

### 6.5 Customer Balance Statement

**Monthly Statement Format:**

```
═══════════════════════════════════════════════════════
        CUSTOMER ACCOUNT STATEMENT
        Month: January 2026
═══════════════════════════════════════════════════════
Customer: Ahmad Shop (CUST-001)
Statement Period: January 1-31, 2026

───────────────────────────────────────────────────────
OPENING BALANCE:
Pure Gold Balance: -50.000g (Credit)
Reference Value: -$7,271.50 USD

───────────────────────────────────────────────────────
TRANSACTIONS:

Date        Type      Description      Debit(g)   Credit(g)  Balance(g)
───────────────────────────────────────────────────────────────────────
Jan 01     Opening   Prior balance       -          -        -50.000
Jan 10     Invoice   INV-001-2025     328.438       -        278.438
Jan 12     Payment   PAY-001-2025        -       150.000     128.438
Jan 15     Invoice   INV-002-2025     200.000       -        328.438
Jan 20     Payment   PAY-002-2025        -       200.000     128.438

───────────────────────────────────────────────────────
CLOSING BALANCE:
Pure Gold Owed: 128.438g
Reference Value: $18,682.35 USD (at $145.43/gram)

Payment Due Date: February 5, 2026

───────────────────────────────────────────────────────
** All balances in pure gold (24k equivalent) **
═══════════════════════════════════════════════════════
```

---

## 7. DATABASE SCHEMA (PURE GOLD & USD DUAL SYSTEM)

### 7.1 Orders Collection

```javascript
{
  orderId: "ORD-001",
  orderNumber: "AUTO-GENERATED",
  customerId: "CUST-001",
  customerName: "Ahmad Shop",
  customerPhone: "+93 700 123456",
  
  // Product Details
  productName: "Bracelet",
  productType: "Bracelet",
  totalWeight: 500.000,           // grams (finished product weight)
  karat: "18k",
  purityCoefficient: 0.75,
  
  // Pure Gold Calculations
  productPureGold: 375.000,       // grams (24k equivalent)
  makingChargeRateUSD: 1.00,      // USD per gram
  makingChargeTotalUSD: 500.00,   // USD (weight × rate)
  goldPriceAtOrder: 145.43,       // USD per gram (snapshot)
  commissionGold: 3.438,          // grams pure gold (commission in gold)
  priorGoldBalance: -50.000,      // grams (from customer record)
  totalPureGoldOwed: 328.438,     // grams (product + commission + prior)
  
  // Display Reference (Calculated on-demand)
  displayAmountUSD: 47760.41,     // For reference only
  
  // Manufacturer Details
  manufacturerId: "MFG-001",
  manufacturerName: "Karimi Manufacturing",
  
  // Gold Movement Tracking
  challanIssued: true,
  challanNumber: "CH-001-2025",
  challanDate: "2025-12-30T10:00:00Z",
  goldIssuedToManufacturer: 375.000,  // grams
  additionalGoldIssued: 0.000,        // grams (if extra needed)
  goldReturnedByManufacturer: 0.000,  // grams (if excess)
  
  // Status Tracking
  status: "Challan Issued",  // New Order, Challan Issued, In Production, Product Received, Customer Billed, Payment Received, Completed
  paymentStatus: "Not Billed",  // Not Billed, Billed, Partially Paid, Paid
  
  // Accounting Flags
  challanAccountingRecorded: true,
  inventoryAccountingRecorded: false,
  billingAccountingRecorded: false,
  paymentAccountingRecorded: false,
  
  // Timestamps
  orderDate: "2025-12-30T10:00:00Z",
  expectedDeliveryDate: "2026-01-15T00:00:00Z",
  productReceivedDate: null,
  customerBilledDate: null,
  paymentReceivedDate: null,
  completedDate: null,
  createdAt: "2025-12-30T10:00:00Z",
  updatedAt: "2025-12-30T10:00:00Z"
}
```

### 7.2 Customers Collection

```javascript
{
  customerId: "CUST-001",
  customerCode: "CUST-001",
  customerName: "Ahmad Shop",
  phone: "+93 700 123456",
  address: "Kabul District 10, Afghanistan",
  email: "ahmad@example.com",
  
  // Pure Gold Balance (in grams)
  currentPureGoldBalance: 128.438,    // grams owed by customer (positive = owed, negative = credit)
  totalPureGoldOrdered: 1500.000,     // grams (lifetime total ordered)
  totalPureGoldPaid: 1371.562,        // grams (lifetime total paid)
  
  // Credit Management
  creditLimitGold: 500.000,           // grams (max allowed outstanding)
  creditLimitUSD: 72715.00,           // USD equivalent (display only)
  availableCreditGold: 371.562,       // grams (credit limit - current balance)
  
  // Display Reference (Calculated on-demand)
  displayBalanceUSD: 18682.35,        // Current balance in USD (reference)
  
  // Transaction History
  transactions: [
    {
      date: "2026-01-10",
      type: "invoice",              // invoice, payment, credit_note
      referenceId: "INV-001",
      pureGoldAmount: 328.438,      // grams (positive = customer owes)
      goldPriceRef: 145.43,         // USD per gram
      currencyRef: 47760.41,        // USD equivalent
      balance: 278.438,             // grams after transaction
      description: "Invoice for Order ORD-001"
    },
    {
      date: "2026-01-12",
      type: "payment",
      referenceId: "PAY-001",
      pureGoldAmount: -150.000,     // grams (negative = customer paid)
      goldPriceRef: 145.43,
      currencyRef: -21814.50,
      balance: 128.438,
      description: "Partial payment for INV-001"
    }
  ],
  
  // Status
  isActive: true,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2026-01-12T15:30:00Z"
}
```

### 7.3 Manufacturers Collection

```javascript
{
  manufacturerId: "MFG-001",
  manufacturerCode: "MFG-001",
  manufacturerName: "Karimi Manufacturing",
  contactPerson: "Abdul Karimi",
  phone: "+93 700 123456",
  address: "Kabul Industrial Area",
  email: "karimi@example.com",
  specialization: "18k Gold Jewelry",
  
  // USD Balance (making charges only)
  currentBalanceUSD: 500.00,          // USD owed to manufacturer (positive = we owe)
  totalMakingChargesUSD: 15000.00,    // USD (lifetime total)
  totalPaidUSD: 14500.00,             // USD (lifetime paid)
  
  // Gold in Transit (for tracking)
  goldInTransit: 375.000,             // grams currently with manufacturer
  
  // Transaction History
  transactions: [
    {
      date: "2026-01-05",
      type: "making_charges",         // making_charges, payment
      referenceId: "ORD-001",
      amountUSD: 500.00,              // USD (positive = we owe)
      balance: 500.00,
      description: "Making charges for Order ORD-001"
    }
  ],
  
  // Performance Metrics
  avgDeliveryDays: 15,
  completedOrders: 120,
  qualityRating: 4.5,
  
  // Status
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2026-01-05T10:00:00Z"
}
```

### 7.4 Challans Collection

```javascript
{
  challanId: "CH-001-2025",
  challanNumber: "CH-001-2025",
  challanType: "gold_withdrawal",     // gold_withdrawal, gold_return, additional_gold
  orderId: "ORD-001",
  customerId: "CUST-001",
  
  // Manufacturer Details
  manufacturerId: "MFG-001",
  manufacturerName: "Karimi Manufacturing",
  
  // Gold Details
  pureGoldAmount: 375.000,            // grams (24k)
  purpose: "Production of 500g 18k Bracelet",
  
  // Status
  status: "issued",                   // issued, released_by_sharaf, returned, cancelled
  issuedDate: "2025-12-30T10:00:00Z",
  releasedBySharafDate: "2025-12-30T14:00:00Z",
  
  // Accounting
  accountingRecorded: true,
  accountingEntryId: "TXN-12345",
  
  // Sharaf Confirmation
  sharafReleaseConfirmation: true,
  sharafSignature: "Sharaf-Staff-001",
  
  createdAt: "2025-12-30T10:00:00Z",
  updatedAt: "2025-12-30T14:00:00Z"
}
```

### 7.5 Invoices Collection

```javascript
{
  invoiceId: "INV-001-2025",
  invoiceNumber: "INV-001-2025",
  invoiceType: "customer_bill",       // customer_bill, credit_invoice
  orderId: "ORD-001",
  customerId: "CUST-001",
  customerName: "Ahmad Shop",
  
  // Invoice Amounts (Pure Gold)
  productPureGold: 375.000,           // grams
  commissionGold: 3.438,              // grams
  priorBalance: -50.000,              // grams
  totalPureGold: 328.438,             // grams
  
  // Display Reference
  goldPriceAtInvoice: 145.43,         // USD per gram
  displayAmountUSD: 47760.41,         // USD (reference only)
  
  // Payment Tracking
  paidPureGold: 150.000,              // grams paid so far
  remainingPureGold: 178.438,         // grams still owed
  paymentStatus: "partially_paid",    // not_paid, partially_paid, paid
  
  // Payment Terms
  invoiceDate: "2026-01-10T00:00:00Z",
  dueDate: "2026-01-25T00:00:00Z",
  creditDays: 15,
  
  // Status
  status: "active",                   // active, paid, cancelled, overdue
  
  createdAt: "2026-01-10T10:00:00Z",
  updatedAt: "2026-01-12T15:00:00Z"
}
```

### 7.6 Payments Collection

```javascript
{
  paymentId: "PAY-001-2025",
  paymentNumber: "PAY-001-2025",
  paymentType: "customer_payment",    // customer_payment, manufacturer_payment
  invoiceId: "INV-001-2025",
  customerId: "CUST-001",
  customerName: "Ahmad Shop",
  
  // Payment Details (Pure Gold)
  pureGoldPaid: 150.000,              // grams
  goldPriceAtPayment: 145.43,         // USD per gram
  displayAmountUSD: 21814.50,         // USD (reference)
  
  // Payment Method
  paymentMethod: "gold",              // gold (always for customers)
  
  // Balances
  previousBalance: 328.438,           // grams
  amountPaid: 150.000,                // grams
  newBalance: 178.438,                // grams
  
  // Sharaf Deposit
  depositedToSharaf: true,
  sharafDepositDate: "2026-01-12T18:00:00Z",
  sharafReceiptNumber: "SHAR-REC-12345",
  
  // Accounting
  accountingRecorded: true,
  accountingEntryId: "TXN-67890",
  
  // Status
  status: "completed",                // pending, completed, cancelled
  
  paymentDate: "2026-01-12T15:00:00Z",
  createdAt: "2026-01-12T15:00:00Z",
  updatedAt: "2026-01-12T18:00:00Z"
}
```

### 7.7 Gold Price History Collection

```javascript
{
  priceId: "PRICE-001",
  pricePerOunce: 4530.00,             // USD
  pricePerGram: 145.43,               // USD (ounce ÷ 31.15)
  currency: "USD",
  source: "goldprice.org",            // goldprice.org, kitco.com, manual
  isManual: false,
  enteredBy: "admin-user-id",
  timestamp: "2025-12-30T10:30:00Z"
}
```

### 7.8 Accounting Transactions Collection

```javascript
{
  transactionId: "TXN-12345",
  transactionType: "journal_entry",
  date: "2025-12-30T10:00:00Z",
  description: "Gold Challan CH-001 issued to Karimi Manufacturing",
  
  // Journal Entry Lines
  lines: [
    {
      accountCode: "1102",            // Gold in Transit
      accountName: "Gold in Transit - Manufacturer",
      debitGold: 375.000,             // grams
      creditGold: 0,
      debitUSD: 0,
      creditUSD: 0,
      goldPriceRef: 145.43
    },
    {
      accountCode: "1101",            // Gold Bank (Sharaf)
      accountName: "Gold Bank (Sharaf)",
      debitGold: 0,
      creditGold: 375.000,            // grams
      debitUSD: 0,
      creditUSD: 0,
      goldPriceRef: 145.43
    }
  ],
  
  // Reference
  referenceType: "challan",           // challan, invoice, payment, making_charges
  referenceId: "CH-001-2025",
  
  createdAt: "2025-12-30T10:00:00Z",
  createdBy: "admin-user-id"
}
```

---

## 8. DASHBOARD (SIMPLIFIED)

```
═══════════════════════════════════════════════════════
        AHMAD GOLD - احمد طلا
        Kabul, Afghanistan
        +93 123 456 789
        ahmadgold@example.com
═══════════════════════════════════════════════════════

ORDER RECEIPT / رسید سفارش
Date: December 30, 2025          Serial No: 12

───────────────────────────────────────────────────────
CUSTOMER DETAILS / معلومات مشتری
───────────────────────────────────────────────────────
Name / نام:        Ahmad Shop
Address / آدرس:    Kabul District 10

───────────────────────────────────────────────────────
ORDER DETAILS / جزئیات سفارش
───────────────────────────────────────────────────────
S.No  Product Name         Karat  Weight
      اسم جنس              عیار   وزن
───────────────────────────────────────────────────────
12    Talacha             18k    200.000g
      طلاچه

───────────────────────────────────────────────────────
PURE GOLD CALCULATION / حساب تیزابی طلا
───────────────────────────────────────────────────────
Current Pure Gold (تیزابی فعلی):        150.000 g
Commission Rate (نرخ اجره):             $1.20/g
Commission Gold (تیزابی اجره):            1.650 g
Prior Balance (تیزابی گذشته):             0.000 g
                                      ─────────────
TOTAL PURE GOLD (مجموعه تیزابی):        151.650 g
═══════════════════════════════════════════════════════

REFERENCE AMOUNT (For Display Only):
Gold Price Today: $145.43 per gram
Equivalent: $22,053.45

───────────────────────────────────────────────────────
Customer Signature: _______________    Date: _________

───────────────────────────────────────────────────────
** All transactions are in pure gold (24k equivalent) **
** Currency amounts are for reference only **
═══════════════════════════════════════════════════════
```

### 3.3 Product Selection Dropdown

**Available Product Types:**

| S.No | Product Name (English) | Product Name (Dari) | Typical Karat |
|------|----------------------|-------------------|-------------|
| 1 | Ring | انگشتر | 18k, 22k |
| 2 | Bracelet Chain | چله | 18k, 22k |
| 3 | Earrings | گوشواره | 18k, 22k |
| 4 | Locket | لاکت | 18k, 22k |
| 5 | Talacha | طلاچه | 18k |
| 6 | Necklace | هار | 22k |
| 7 | Bangle | النگو | 22k |
| 8 | Custom | دلخواه | Any |

---

## 4. PAYMENT & BILLING (PURE GOLD BASED)

### 4.1 Payment Receipt (Gold Payment)

**When Customer Pays:**

```
═══════════════════════════════════════════════════════
        PAYMENT RECEIPT / رسید پرداخت
═══════════════════════════════════════════════════════
Receipt No: PAY-001
Date: December 31, 2025
Order Reference: ORD-001 (Serial No: 12)

Customer: Ahmad Shop

───────────────────────────────────────────────────────
PAYMENT DETAILS / جزئیات پرداخت
───────────────────────────────────────────────────────
Amount Paid (Pure Gold): 151.650 grams
مقدار پرداخت شده (تیزابی): ۱۵۱.۶۵۰ گرام

Reference Amount: $22,053.45
(Based on gold price: $145.43/gram)

Payment Method: Gold Grams
Previous Balance: 0.000 g
Amount Paid: 151.650 g
Remaining Balance: 0.000 g

───────────────────────────────────────────────────────
Payment Status: PAID IN FULL
وضعیت پرداخت: پرداخت شده
═══════════════════════════════════════════════════════
```

### 4.2 Credit Invoice (Pure Gold Outstanding)

**For Credit Sales:**

```
═══════════════════════════════════════════════════════
        INVOICE / فاکتور
═══════════════════════════════════════════════════════
Invoice No: INV-001
Date: December 30, 2025
Due Date: January 15, 2026 (15 days credit)
Order Reference: ORD-001

Customer: Ahmad Shop
Credit Limit: 100.000 grams pure gold

───────────────────────────────────────────────────────
AMOUNT DUE / مقدار قابل پرداخت
───────────────────────────────────────────────────────
PURE GOLD OWED: 151.650 grams
تیزابی قابل پرداخت: ۱۵۱.۶۵۰ گرام

Reference Amount: $22,053.45
(If paid in cash based on today's gold price)

───────────────────────────────────────────────────────
PAYMENT TERMS:
- Payment due in pure gold grams (24k equivalent)
- Or equivalent cash at gold price on payment date
- Late payment: 15 days from invoice date
───────────────────────────────────────────────────────
Payment Status: OUTSTANDING
وضعیت پرداخت: باقیمانده
═══════════════════════════════════════════════════════
```

### 4.3 Partial Payment Tracking

**Pure Gold Balance Ledger:**

```javascript
// Customer ledger entry
{
  customerId: "CUST-001",
  ledger: [
    {
      date: "2025-12-30",
      type: "invoice",
      orderId: "ORD-001",
      pureGoldAmount: +151.650,    // Customer owes
      balance: 151.650,
      description: "Order ORD-001",
      goldPriceRef: 145.43,
      currencyRef: 22053.45
    },
    {
      date: "2026-01-05",
      type: "payment",
      receiptNo: "PAY-001",
      pureGoldAmount: -50.000,     // Customer paid
      balance: 101.650,
      description: "Partial payment",
      goldPriceRef: 148.20,
      currencyRef: 7410.00
    },
    {
      date: "2026-01-15",
      type: "payment",
      receiptNo: "PAY-002",
      pureGoldAmount: -101.650,    // Customer paid remaining
      balance: 0.000,
      description: "Final payment",
      goldPriceRef: 147.85,
      currencyRef: 15024.70
    }
  ]
}
```

**Important:** Gold price at payment time may differ from order time - customer still pays the SAME pure gold amount regardless of price changes.

---

## 5. CUSTOMER BALANCE SHEET (PURE GOLD)

### 5.1 Customer Profile with Pure Gold Balance

**Customer Detail View:**

```
┌─────────────────────────────────────────────────────┐
│  Customer Profile - Ahmad Shop                      │
├─────────────────────────────────────────────────────┤
│  Code: CUST-001                                     │
│  Phone: +93 123 456 789                             │
│  Address: Kabul, Afghanistan                        │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ PURE GOLD BALANCE (تیزابی باقیمانده)         │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Outstanding: 101.650 grams pure gold          │ │
│  │ Today's Value: $15,024.70                     │ │
│  │ (at $147.85/gram - reference only)            │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Credit Limit: 100.000 g                       │ │
│  │ Available Credit: -1.650 g ⚠️ OVER LIMIT     │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ LIFETIME STATISTICS                            │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Total Ordered: 500.000 g pure gold            │ │
│  │ Total Paid: 398.350 g pure gold               │ │
│  │ Outstanding: 101.650 g pure gold              │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ TRANSACTION HISTORY                            │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Date       Type     Pure Gold    Balance      │ │
│  ├───────────────────────────────────────────────┤ │
│  │ 12/30/25  Invoice   +151.650g    151.650g    │ │
│  │ 01/05/26  Payment    -50.000g    101.650g    │ │
│  │ 01/15/26  Payment   -101.650g      0.000g    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Record Payment] [New Order] [View All Orders]    │
└─────────────────────────────────────────────────────┘
```

### 5.2 Aging Analysis (Pure Gold)

**Customer Outstanding by Age:**

```
┌─────────────────────────────────────────────────────┐
│  Outstanding Receivables - Pure Gold                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  0-30 Days:    250.500 g  ($36,875.00)             │
│  31-60 Days:   120.000 g  ($17,700.00)             │
│  61-90 Days:    45.000 g  ($ 6,637.50)             │
│  90+ Days:      15.000 g  ($ 2,212.50) ⚠️         │
│  ────────────────────────────────────────────────  │
│  TOTAL:        430.500 g  ($63,425.00)             │
│                                                     │
│  (Currency amounts at current gold price $147.50/g) │
└─────────────────────────────────────────────────────┘
```

---

## 6. INVENTORY MANAGEMENT (PURE GOLD)

### 6.1 Inventory Tracking Principle

**All Inventory as Pure Gold Equivalent:**

```javascript
// Inventory is ONLY tracked as pure gold grams
inventory: {
  totalPureGold: 5000.000,  // grams (24k)
  
  // Breakdown by purity (for reference)
  breakdown: [
    { karat: "24k", weight: 1000.000, pureGold: 1000.000 },
    { karat: "22k", weight: 3000.000, pureGold: 2750.100 },
    { karat: "18k", weight: 1666.667, pureGold: 1250.000 }
  ],
  
  // Display value (calculated on-demand)
  displayValue: 735000.00  // 5000g × $147/g
}
```

### 6.2 Inventory Movement (Pure Gold)

**Every Transaction Updates Pure Gold Inventory:**

| Transaction | Pure Gold Change | Calculation |
|-------------|------------------|-------------|
| **Customer Order Delivered** | -150.000g | Product contains 150g pure (removed from stock) |
| **Manufacturer Delivery** | +150.000g | Received 200g 18k = 150g pure (added to stock) |
| **Direct Purchase** | +100.000g | Bought 100g 24k pure gold (added to stock) |
| **Wastage/Loss** | -2.500g | 2.5g pure gold lost (removed from stock) |

**Inventory Movement Log:**
```javascript
{
  movementId: "INV-MOVE-001",
  date: "2025-12-30",
  type: "customer_order",
  orderId: "ORD-001",
  pureGoldChange: -150.000,  // grams
  balanceAfter: 4850.000,    // grams
  description: "Order ORD-001 delivered to Ahmad Shop",
  goldPriceRef: 145.43,
  currencyValueRef: -21814.50
}
```

### 6.3 Inventory Valuation Report

**Current Inventory Value:**

```
═══════════════════════════════════════════════════════
        INVENTORY VALUATION REPORT
        As of: December 30, 2025
═══════════════════════════════════════════════════════

PURE GOLD INVENTORY:
────────────────────────────────────────────────────
Total Pure Gold (24k): 5,000.000 grams

BREAKDOWN BY PURITY:
────────────────────────────────────────────────────
24k (100%):  1,000.000g actual  =  1,000.000g pure
22k (91.67%): 3,000.000g actual  =  2,750.100g pure
18k (75%):    1,666.667g actual  =  1,250.000g pure
                                   ─────────────────
TOTAL PURE GOLD:                    5,000.000g pure

CURRENT MARKET VALUE:
────────────────────────────────────────────────────
Gold Price: $147.50 per gram
Total Value: $737,500.00

(Currency value for reference only - inventory tracked in grams)
═══════════════════════════════════════════════════════
```

---

## 7. MANUFACTURER/SUPPLIER MANAGEMENT (PURE GOLD)

### 7.1 Manufacturer Balance (Pure Gold Payable)

**Manufacturer Ledger:**

```javascript
{
  manufacturerId: "MANU-001",
  manufacturerName: "Karimi Manufacturing",
  
  // Pure Gold Balance
  pureGoldPayable: 350.000,  // grams (we owe manufacturer)
  
  // Transactions
  transactions: [
    {
      date: "2025-12-28",
      type: "purchase",
      orderId: "ORD-001",
      pureGoldAmount: +150.000,  // We owe for 150g pure
      balance: 150.000,
      description: "Received 200g 18k product",
      goldPriceRef: 145.43,
      currencyRef: 21814.50
    },
    {
      date: "2025-12-29",
      type: "purchase",
      orderId: "ORD-002",
      pureGoldAmount: +200.000,  // We owe for 200g pure
      balance: 350.000,
      description: "Received 200g 24k bars",
      goldPriceRef: 146.20,
      currencyRef: 29240.00
    },
    {
      date: "2026-01-05",
      type: "payment",
      paymentNo: "MFG-PAY-001",
      pureGoldAmount: -150.000,  // We paid 150g pure
      balance: 200.000,
      description: "Payment for ORD-001",
      goldPriceRef: 148.50,
      currencyRef: -22275.00
    }
  ]
}
```

### 7.2 Manufacturer Payment

**Payment Options:**

1. **Gold Payment:** Give back pure gold grams
2. **Cash Payment:** Pay equivalent in currency (at current gold price)

**Payment Form:**
```
┌─────────────────────────────────────────────────┐
│  Payment to Manufacturer                        │
├─────────────────────────────────────────────────┤
│  Manufacturer: Karimi Manufacturing             │
│  Outstanding: 200.000 grams pure gold           │
│                                                 │
│  Payment Amount: [200.000] grams                │
│                                                 │
│  Payment Method:                                │
│  ○ Gold Grams (Give back gold)                 │
│  ○ Cash Equivalent                             │
│                                                 │
│  If Cash Selected:                              │
│  Gold Price Today: $148.50/gram                 │
│  Cash Amount: $29,700.00                        │
│                                                 │
│  [Process Payment] [Cancel]                     │
└─────────────────────────────────────────────────┘
```

---

## 8. DASHBOARD (PURE GOLD METRICS)

### 8.1 Key Metrics Display

**Dashboard Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  AHMAD GOLD DASHBOARD                 December 30, 2025         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ GOLD PRICE     │  │ INVENTORY      │  │ TODAY'S ORDERS │   │
│  ├────────────────┤  ├────────────────┤  ├────────────────┤   │
│  │ $147.50/gram   │  │ 5,000.000g     │  │ 12 Orders      │   │
│  │ $4,590/ounce   │  │ Pure Gold      │  │ 1,850.500g     │   │
│  │ ↑ $2.50 (1.7%) │  │ $737,500 value │  │ $273,000 equiv │   │
│  │ Updated: 10:30 │  │                │  │                │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ CUSTOMER OUTSTANDING (Pure Gold)                       │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ 0-30 Days:   250.500g  ($36,875.00)                   │   │
│  │ 31-60 Days:  120.000g  ($17,700.00)                   │   │
│  │ 61+ Days:     60.000g  ($ 8,850.00) ⚠️               │   │
│  │ ──────────────────────────────────────────────────    │   │
│  │ TOTAL:       430.500g  ($63,425.00)                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ MANUFACTURER PAYABLE (Pure Gold)                       │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ Karimi Manufacturing:    200.000g  ($29,500.00)       │   │
│  │ Hashimi Gold Works:      150.000g  ($22,125.00)       │   │
│  │ Ahmad Jewelry:           100.000g  ($14,750.00)       │   │
│  │ ──────────────────────────────────────────────────    │   │
│  │ TOTAL:                   450.000g  ($66,375.00)       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ TODAY'S COMMISSION EARNED (Pure Gold)                  │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ Total Commission: 25.500 grams pure gold              │   │
│  │ Equivalent: $3,761.25 (at $147.50/gram)               │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Refresh Prices] [New Order] [Record Payment] [Reports]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. REPORTS & ANALYTICS (PURE GOLD)

### 9.1 Available Reports

**1. Customer Balance Report (Pure Gold):**
- All customers with outstanding pure gold balances
- Aging analysis (0-30, 31-60, 61+ days)
- Total pure gold owed
- Currency equivalent at current gold price

**2. Manufacturer Payable Report (Pure Gold):**
- All manufacturers we owe pure gold to
- Payment due dates
- Total pure gold payable
- Currency equivalent at current gold price

**3. Pure Gold Inventory Report:**
- Total pure gold in stock
- Breakdown by purity (24k, 22k, 18k)
- Low stock alerts
- Current market value

**4. Commission Report (Pure Gold):**
- Daily/weekly/monthly commission earned in pure gold
- Commission by product type
- Commission by customer
- Currency equivalent

**5. Profit & Loss (Pure Gold Based):**
- Pure gold received from customers
- Pure gold paid to manufacturers
- Pure gold commission earned
- Pure gold inventory change
- Net pure gold position

### 9.2 Example P&L Statement (Pure Gold)

```
═══════════════════════════════════════════════════════
        PROFIT & LOSS STATEMENT (Pure Gold)
        Month: December 2025
═══════════════════════════════════════════════════════

REVENUE (Pure Gold Received from Customers):
────────────────────────────────────────────────────
Orders Completed:           2,500.000 g pure gold
Commission Earned:            125.000 g pure gold
                           ─────────────────────
TOTAL REVENUE:              2,625.000 g pure gold

COST OF GOODS SOLD (Pure Gold Paid to Manufacturers):
────────────────────────────────────────────────────
Manufacturing Cost:         2,300.000 g pure gold
                           ─────────────────────
GROSS PROFIT:                 325.000 g pure gold

OPERATING EXPENSES (Pure Gold Equivalent):
────────────────────────────────────────────────────
Salaries:                      50.000 g pure gold
Rent:                          20.000 g pure gold
Utilities:                      5.000 g pure gold
Other:                         10.000 g pure gold
                           ─────────────────────
TOTAL EXPENSES:                85.000 g pure gold

NET PROFIT:                   240.000 g pure gold
═══════════════════════════════════════════════════════

CURRENCY EQUIVALENT (Reference Only):
────────────────────────────────────────────────────
Average Gold Price: $146.00/gram
Net Profit: $35,040.00

═══════════════════════════════════════════════════════
** All figures in pure gold (24k equivalent) **
** Currency amounts for reference only **
═══════════════════════════════════════════════════════
```

---

## 10. TECHNICAL IMPLEMENTATION

### 10.1 Gold Price Service

**Gold Price API Integration:**

```javascript
// services/goldPriceService.js

class GoldPriceService {
  constructor() {
    this.primaryAPI = 'goldprice.org';
    this.fallbackAPI = 'kitco.com';
    this.currentPrice = {
      pricePerOunce: 0,
      pricePerGram: 0,
      lastUpdated: null
    };
  }
  
  async fetchLivePrice() {
    try {
      // Try primary API
      const response = await fetch('https://api.goldprice.org/...');
      const data = await response.json();
      
      this.currentPrice = {
        pricePerOunce: data.price,
        pricePerGram: data.price / 31.15,
        lastUpdated: new Date()
      };
      
      await this.savePriceHistory();
      return this.currentPrice;
    } catch (error) {
      // Try fallback API
      return await this.fetchFallbackPrice();
    }
  }
  
  calculateGramFromOunce(ouncePrice) {
    return ouncePrice / 31.15;
  }
  
  calculateOunceFromGram(gramPrice) {
    return gramPrice * 31.15;
  }
  
  async savePriceHistory() {
    // Save to Firestore
    await addDoc(collection(db, 'goldPriceHistory'), {
      pricePerOunce: this.currentPrice.pricePerOunce,
      pricePerGram: this.currentPrice.pricePerGram,
      timestamp: serverTimestamp(),
      source: this.primaryAPI
    });
  }
}
```

### 10.2 Pure Gold Calculation Engine

```javascript
// utils/pureGoldCalculator.js

const PURITY_COEFFICIENTS = {
  '24k': 1.0000,
  '22k': 0.9167,
  '18k': 0.7500,
  '14k': 0.5833
};

class PureGoldCalculator {
  
  // Convert product weight to pure gold
  calculatePureGold(weight, karat) {
    const coefficient = PURITY_COEFFICIENTS[karat] || 1.0;
    return weight * coefficient;
  }
  
  // Calculate commission in pure gold
  calculateCommissionGold(weight, commissionRateUSD, goldPricePerGram) {
    const commissionUSD = weight * commissionRateUSD;
    return commissionUSD / goldPricePerGram;
  }
  
  // Calculate total pure gold for order
  calculateOrderTotal(orderData) {
    const { weight, karat, commissionRateUSD, goldPricePerGram, priorBalance } = orderData;
    
    // 1. Current pure gold in product
    const currentPureGold = this.calculatePureGold(weight, karat);
    
    // 2. Commission in pure gold
    const commissionGold = this.calculateCommissionGold(
      weight, 
      commissionRateUSD, 
      goldPricePerGram
    );
    
    // 3. Prior balance (from customer record)
    const priorGold = priorBalance || 0;
    
    // 4. Total pure gold
    const totalPureGold = currentPureGold + commissionGold + priorGold;
    
    return {
      currentPureGold: parseFloat(currentPureGold.toFixed(3)),
      commissionGold: parseFloat(commissionGold.toFixed(3)),
      priorGold: parseFloat(priorGold.toFixed(3)),
      totalPureGold: parseFloat(totalPureGold.toFixed(3))
    };
  }
  
  // Convert pure gold to currency for display
  toCurrency(pureGoldGrams, goldPricePerGram) {
    return parseFloat((pureGoldGrams * goldPricePerGram).toFixed(2));
  }
}

export default new PureGoldCalculator();
```

### 10.3 Customer Balance Manager

```javascript
// utils/customerBalanceManager.js

class CustomerBalanceManager {
  
  async getCustomerBalance(customerId) {
    const customerRef = doc(db, 'customers', customerId);
    const customerSnap = await getDoc(customerRef);
    
    if (!customerSnap.exists()) {
      return null;
    }
    
    const data = customerSnap.data();
    return {
      pureGoldBalance: data.currentPureGoldBalance || 0,
      creditLimit: data.creditLimit || 0,
      availableCredit: (data.creditLimit || 0) - (data.currentPureGoldBalance || 0)
    };
  }
  
  async addOrderToBalance(customerId, pureGoldAmount) {
    const customerRef = doc(db, 'customers', customerId);
    
    await updateDoc(customerRef, {
      currentPureGoldBalance: increment(pureGoldAmount),
      totalPureGoldOrdered: increment(pureGoldAmount)
    });
    
    // Add transaction record
    await this.addTransaction(customerId, {
      type: 'order',
      pureGoldAmount: pureGoldAmount,
      timestamp: serverTimestamp()
    });
  }
  
  async recordPayment(customerId, pureGoldAmount, goldPricePerGram) {
    const customerRef = doc(db, 'customers', customerId);
    
    await updateDoc(customerRef, {
      currentPureGoldBalance: increment(-pureGoldAmount),
      totalPureGoldPaid: increment(pureGoldAmount)
    });
    
    // Add transaction record
    await this.addTransaction(customerId, {
      type: 'payment',
      pureGoldAmount: -pureGoldAmount,
      goldPriceRef: goldPricePerGram,
      currencyRef: pureGoldAmount * goldPricePerGram,
      timestamp: serverTimestamp()
    });
  }
  
  async addTransaction(customerId, transaction) {
    await addDoc(collection(db, `customers/${customerId}/transactions`), transaction);
  }
}

export default new CustomerBalanceManager();
```

---

## 11. KEY DIFFERENCES FROM v1.0

| Feature | v1.0 (Currency) | v2.0 (Pure Gold) |
|---------|----------------|------------------|
| **Primary Storage** | Money amounts | Pure gold grams |
| **Customer Owes** | ₹10,000 | 151.650g pure gold |
| **Payments** | Cash/Bank transfer | Gold grams or cash equivalent |
| **Balance Sheet** | Money receivable/payable | Gold grams receivable/payable |
| **Inventory** | Weight + Value | Pure gold grams only |
| **Commission** | Money difference | Pure gold grams |
| **Price Calculation** | For invoicing | For display only |
| **Reports** | Money amounts | Pure gold with currency reference |
| **Accounting** | Debit/Credit in money | Debit/Credit in gold grams |

---

## 12. IMPLEMENTATION PHASES

### Phase 1: Core Pure Gold System
✅ Gold price management (ounce ↔ gram conversion)
✅ Pure gold calculation engine
✅ Order entry with pure gold accounting
✅ Customer balance in pure gold
✅ Payment recording in pure gold
✅ Basic reports (pure gold based)

### Phase 2: Advanced Features
🔄 Gold price API integration (live updates)
🔄 Multi-currency display (USD, AFN, EUR)
🔄 Advanced analytics (pure gold trends)
🔄 Manufacturer pure gold payables
🔄 Inventory pure gold tracking
🔄 Commission analysis in pure gold

### Phase 3: Enhancements
⏳ Mobile app (pure gold transactions)
⏳ SMS/WhatsApp notifications
⏳ Gold price alerts
⏳ Multi-location inventory (pure gold)
⏳ Advanced financial reports

---

## 13. SUCCESS METRICS

### Business Metrics
- **Pure Gold Accuracy:** 99.99% precision (3 decimal places)
- **Price Update:** < 5 minutes from global gold market
- **Order Processing:** < 2 minutes per order
- **Balance Calculation:** Real-time pure gold updates

### User Experience
- **Gold Price Display:** Always visible (ounce + gram)
- **Calculation Transparency:** Show all pure gold conversions
- **Dual Language:** English/Dari throughout
- **Receipt Clarity:** Both pure gold and currency reference

---

## APPENDIX A: GLOSSARY (ENGLISH/DARI)

| English | Dari | Meaning |
|---------|------|---------|
| Pure Gold | تیزابی | 24k equivalent gold |
| Current Pure Gold | تیزابی فعلی | Pure gold in current product |
| Commission Gold | تیزابی اجره | Commission expressed as pure gold |
| Prior Gold | تیزابی گذشته | Previous gold balance |
| Total Pure Gold | مجموعه تیزابی | Sum of all pure gold |
| Gold Karat | عیار طلا | Purity level (24k, 22k, 18k) |
| Weight | وزن جنس | Product weight in grams |
| Commission Rate | نرخ اجره | Commission per gram |
| Product Name | اسم جنس | Name of jewelry item |
| Talacha | طلاچه | Traditional gold jewelry piece |
| Ring | انگشتر | Gold ring |
| Bracelet | چله | Gold bracelet chain |
| Earrings | گوشواره | Gold earrings |
| Locket | لاکت | Gold locket/pendant |

---

**Document Prepared By:** Development Team  
**Approved By:** Ahmad Gold Management  
**Next Review Date:** March 30, 2026  

═══════════════════════════════════════════════════════
** ALL TRANSACTIONS IN PURE GOLD (24K EQUIVALENT) **
** CURRENCY AMOUNTS FOR DISPLAY ONLY **
═══════════════════════════════════════════════════════

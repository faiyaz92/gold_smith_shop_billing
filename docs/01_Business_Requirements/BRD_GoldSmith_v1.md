# Business Requirements Document (BRD) v1.0
## GOLD SMITH WHOLESALER MANAGEMENT SYSTEM

**Document Version:** 1.0  
**Date:** December 28, 2025  
**Project:** Gold Smith Wholesaler Billing & Management System  
**Industry:** Jewelry Wholesale & Manufacturing  
**Business Model:** Commission-based wholesaler (Customer Orders → Manufacturer Orders)  
**Technology Stack:** Next.js + Firebase/Firestore  
**Target Users:** Gold wholesalers dealing with shopkeepers and manufacturers  

---

## � DOCUMENT NAVIGATION

**📋 Related Documents:**
- **[TechnicalDoc_GoldSmith.md](TechnicalDoc_GoldSmith.md)** - Implementation guide with code examples
- **[DatabaseDoc_GoldSmith.md](DatabaseDoc_GoldSmith.md)** - Database schemas and data structures
- **[TaskList_GoldSmith.md](TaskList_GoldSmith.md)** - Implementation tasks with status tracking

**🔗 Bidirectional Cross-References:**
| BRD v1.0 Section | TechnicalDoc_GoldSmith.md Section | DatabaseDoc_GoldSmith.md Section | TaskList_GoldSmith.md Section |
|------------------|-----------------------------------|----------------------------------|-------------------------------|
| [1. Business Objectives](#1-business-objectives) | [1. System Overview](TechnicalDoc_GoldSmith.md#1-system-overview) | [1. System Overview](DatabaseDoc_GoldSmith.md#1-system-overview) | [Phase 1: Core Gold Smith Shop Features](TaskList_GoldSmith.md#phase-1-core-gold-smith-shop-features) |
| [2.1 Order Management System](#21-order-management-system-oms) | [4. Data Flow Architecture](TechnicalDoc_GoldSmith.md#4-data-flow-architecture) | [4. Data Flow Architecture](DatabaseDoc_GoldSmith.md#4-data-flow-architecture) | [1.8 Order Management Module](TaskList_GoldSmith.md#18-order-management-module) |
| [2.2 Billing & Payment Management](#22-billing--payment-management) | [4. Data Flow Architecture](TechnicalDoc_GoldSmith.md#4-data-flow-architecture) | [4. Data Flow Architecture](DatabaseDoc_GoldSmith.md#4-data-flow-architecture) | [1.9 Payment & Billing System](TaskList_GoldSmith.md#19-payment--billing-system) |
| [2.3 Purchase Management](#23-purchase-management-from-manufacturers) | [4. Data Flow Architecture](TechnicalDoc_GoldSmith.md#4-data-flow-architecture) | [4. Data Flow Architecture](DatabaseDoc_GoldSmith.md#4-data-flow-architecture) | [1.8 Order Management Module](TaskList_GoldSmith.md#18-order-management-module) |
| [2.4 Inventory Management](#24-inventory-management) | [3. Application Structure](TechnicalDoc_GoldSmith.md#3-application-structure) | [3. Application Structure](DatabaseDoc_GoldSmith.md#3-application-structure) | [1.11 Inventory Management](TaskList_GoldSmith.md#111-inventory-management) |
| [2.5 Accounting System](#25-accounting-system) | [2. Architecture Overview](TechnicalDoc_GoldSmith.md#2-architecture-overview) | [2. Architecture Overview](DatabaseDoc_GoldSmith.md#2-architecture-overview) | [1.10 Accounting System](TaskList_GoldSmith.md#110-accounting-system-basic) |
| [2.6 Customer Management](#26-customer-management) | [3. Application Structure](TechnicalDoc_GoldSmith.md#3-application-structure) | [3. Application Structure](DatabaseDoc_GoldSmith.md#3-application-structure) | [1.5 Customer Management Module](TaskList_GoldSmith.md#15-customer-management-module) |
| [2.7 Manufacturer Management](#27-manufacturer-management) | [3. Application Structure](TechnicalDoc_GoldSmith.md#3-application-structure) | [3. Application Structure](DatabaseDoc_GoldSmith.md#3-application-structure) | [1.6 Manufacturer Management Module](TaskList_GoldSmith.md#16-manufacturer-management-module) |
| [2.8 Product Management](#28-product-management) | [3. Application Structure](TechnicalDoc_GoldSmith.md#3-application-structure) | [3. Application Structure](DatabaseDoc_GoldSmith.md#3-application-structure) | [1.7 Product Management Module](TaskList_GoldSmith.md#17-product-management-module) |
| [2.9 Reporting & Analytics](#29-reporting--analytics) | [11. Development Guidelines](TechnicalDoc_GoldSmith.md#11-development-guidelines) | [11. Development Guidelines](DatabaseDoc_GoldSmith.md#11-development-guidelines) | [2.3 Reporting & Analytics](TaskList_GoldSmith.md#23-reporting--analytics) |
| [3. Technical Requirements](#3-technical-requirements) | [2. Architecture Overview](TechnicalDoc_GoldSmith.md#2-architecture-overview) | [2. Architecture Overview](DatabaseDoc_GoldSmith.md#2-architecture-overview) | [1.1 Project Setup & Infrastructure](TaskList_GoldSmith.md#11-project-setup--infrastructure) |
| [4. Security Requirements](#4-security-requirements) | [5. Security & Authentication](TechnicalDoc_GoldSmith.md#5-security--authentication) | [5. Security & Authentication](DatabaseDoc_GoldSmith.md#5-security--authentication) | [1.2 Database Schema Implementation](TaskList_GoldSmith.md#12-database-schema-implementation) |
| [5. Non-Functional Requirements](#5-non-functional-requirements) | [6. Performance Considerations](TechnicalDoc_GoldSmith.md#6-performance-considerations) | [6. Performance Considerations](DatabaseDoc_GoldSmith.md#6-performance-considerations) | [Testing & Quality Assurance](TaskList_GoldSmith.md#testing--quality-assurance) |

---

## �📋 EXECUTIVE SUMMARY

### Core Business Flow
```
Shopkeeper Call → Order Entry → Manufacturer Call → Production → Pickup (Purchase Entry) → Delivery → Billing → Payment Collection
```

**Order Flow:**
1. **Customer Order:** Phone order from shopkeeper (pre-order, no immediate payment)
2. **Manufacturer Order:** Call manufacturer to place order (no payment yet)
3. **Production:** Manufacturer creates jewelry
4. **Pickup & Purchase:** Collect finished product, create purchase entry (cash/credit)
5. **Delivery:** Deliver to customer
6. **Billing:** Generate bill/invoice based on payment terms
7. **Payment:** Collect from customer (cash or credit with tracking)

### Key Requirements
- **Phone-Based Orders:** All orders via phone calls (no online ordering)
- **Dual Order Tracking:** Customer orders + Manufacturer orders
- **Purchase on Pickup:** Finished product pickup = purchase transaction
- **Flexible Billing:** Cash immediate or credit with invoice tracking
- **Payment Status:** Full payment tracking with partial payments
- **Commission Tracking:** Profit between customer price and manufacturer cost

### Key Requirements
- **Simple Order Management:** Phone-based orders from shopkeepers
- **Metal Price Management:** Real-time gold rates with manual overrides
- **Commission Tracking:** Profit margins between customer and manufacturer pricing
- **Inventory Tracking:** Pure gold inventory with purity-based valuation
- **Dual Accounting:** Customer receivables + Manufacturer payables
- **Extensible Metals:** Gold (primary) + Silver, Platinum, Diamonds

---

## 1. BUSINESS OBJECTIVES

### 1.1 Primary Goals
1. **Order Simplification:** Streamlined order taking from shopkeepers via phone
2. **Price Transparency:** Clear breakdown of gold cost, making charges, taxes
3. **Commission Management:** Track profit margins between buying and selling
4. **Inventory Accuracy:** Real-time gold inventory with purity tracking
5. **Financial Clarity:** Separate balance sheets for customers vs manufacturers

### 1.2 Success Metrics
- **Order Processing:** < 2 minutes per order
- **Inventory Accuracy:** 99.9% gold weight tracking
- **Payment Collection:** 95% within 7 days
- **Profit Margin:** Clear visibility on commission earnings

---

## 2. CORE MODULES

### 2.1 Order Management System (OMS)

#### Simplified Order Tracking

**We track only customer orders for simplicity:**

**Customer Orders (From Shopkeepers):**
- When shopkeeper calls: "50gms 22k gold bracelet"
- Status tracking: New → Confirmed → In Production → Ready for Pickup → Picked Up → Delivered → Completed
- Price: Customer selling price (includes commission)

**Commission Entry on Pickup:**
- When picking up finished product (status: "Picked Up"), enter:
  - Manufacturing cost paid to manufacturer
  - Calculate commission (Customer price - Manufacturing cost)
  - Record as purchase + commission income

**Benefits of Simplified Approach:**
- Faster order entry
- Less data entry
- Simpler workflow
- Focus on customer side only

#### Customer Order Creation Process

**Step-by-Step Order Entry:**
1. **Customer Search/Entry:** Find existing customer or add new
2. **Order Details:** Metal, purity, weight, product type
3. **Price Calculation:** Metal rate + making charges + GST
4. **Manufacturer Assignment:** Select preferred manufacturer
5. **Delivery Timeline:** Set expected delivery date
6. **Order Confirmation:** Generate order receipt (not bill yet)

**Important:** No billing at order creation - only order confirmation receipt

#### Pickup & Purchase Entry

**When Status Changes to "Picked Up":**
- **Create Purchase Transaction:** Finished product = purchase from manufacturer
- **Commission Calculation:** Enter manufacturing cost, calculate commission (Customer price - Manufacturing cost)
- **Payment Options:**
  - **Cash Purchase:** Pay immediately in cash
  - **Credit Purchase:** Get invoice from manufacturer, pay later
- **Inventory Update:** Add received gold/metal to inventory
- **Accounting Entry:** Purchase journal entry + commission income entry created

**Purchase Entry Fields:**
- Manufacturer name
- Product details (same as order)
- Weight received (may differ slightly due to wastage)
- Purchase price (cash amount or credit amount)
- Commission amount (calculated automatically)
- Payment terms (immediate or credit)
- GST input credit

#### Delivery & Billing Process

**When Status Changes to "Delivered":**
- Product handed over to customer
- **Now Create Bill/Invoice** based on payment method

**Billing Logic:**

**Cash Sales (Immediate Payment):**
- **Trigger:** Customer pays immediately on delivery
- **Document:** Generate Bill/Receipt
- **Payment Status:** Changes to "Paid"
- **Accounting:** Revenue + cash entries

**Credit Sales (Deferred Payment):**
- **Trigger:** Customer requests credit terms
- **Document:** Generate Invoice with due date
- **Payment Status:** Changes to "Billed"
- **Accounting:** Revenue + receivable entries
- **Follow-up:** Track payment collection

#### Invoice Generation Rules

**When to Generate Invoice:**
- **Cash Sale:** On delivery when payment received
- **Credit Sale:** On delivery (payment due later)

**Invoice Components:**
- Order details (metal, weight, making charges)
- Price breakdown (metal cost, making charges, GST)
- Total amount
- Due date (for credit sales)
- Payment terms
- Customer details

#### Payment Collection Process

**For Credit Invoices:**
- **Partial Payments:** Allow multiple payments against single invoice
- **Payment Recording:** Update payment status (Partially Paid → Paid)
- **Outstanding Tracking:** Show remaining balance
- **Overdue Alerts:** Automatic notifications for past due amounts

**Payment Methods:**
- Cash
- Bank Transfer
- Cheque
- UPI/Card (future integration)

#### Accounting Integration

**Cash Sale Transaction:**
```
On Delivery + Payment:
Debit: Cash/Bank - ₹10,000
Credit: Sales Revenue - ₹9,700
Credit: GST Payable - ₹300
```

**Credit Sale Transaction:**
```
On Delivery (Invoice Generation):
Debit: Accounts Receivable - Customer - ₹10,000
Credit: Sales Revenue - ₹9,700  
Credit: GST Payable - ₹300

On Payment Collection:
Debit: Cash/Bank - ₹10,000
Credit: Accounts Receivable - Customer - ₹10,000
```

**Purchase from Manufacturer:**
```
Cash Purchase (On Pickup):
Debit: Gold Inventory - ₹8,000
Credit: Cash/Bank - ₹8,000

Credit Purchase (On Pickup):
Debit: Gold Inventory - ₹8,000
Credit: Accounts Payable - Manufacturer - ₹8,000

Later Payment:
Debit: Accounts Payable - Manufacturer - ₹8,000
Credit: Cash/Bank - ₹8,000
```

### 2.2 Billing & Payment Management

#### Bill vs Invoice Decision Matrix

**When to Create What:**

| Scenario | Document Type | When Created | Payment Expected | Accounting Impact |
|----------|---------------|--------------|------------------|-------------------|
| **Cash on Delivery** | Bill/Receipt | On delivery when payment received | Immediate | Revenue + Cash |
| **Credit Terms** | Invoice | On delivery | Later (7-30 days) | Revenue + Receivable |
| **Advance Payment** | Receipt | On advance receipt | Already received | Cash advance |
| **Partial Payments** | Invoice + Receipts | Invoice on delivery, receipts on payments | Multiple payments | Receivable reduction |

#### Cash Sales Workflow

**Process:**
1. **Order Status:** "Delivered"
2. **Payment Method:** Customer selects "Cash"
3. **Payment Received:** Enter cash amount received
4. **Bill Generation:** Automatic bill/receipt creation
5. **Status Update:** Order status → "Completed", Payment status → "Paid"

**Bill Contents:**
- Order details and pricing breakdown
- "Paid" stamp with payment method
- Receipt number for records
- No due dates (already paid)

#### Credit Sales Workflow

**Process:**
1. **Order Status:** "Delivered"
2. **Payment Method:** Customer requests "Credit" terms
3. **Credit Approval:** Check customer credit limit
4. **Invoice Generation:** Create invoice with due date
5. **Status Update:** Order status → "Delivered", Payment status → "Billed"

**Invoice Contents:**
- Order details and pricing breakdown
- Due date (e.g., 15 days from invoice date)
- Payment terms and conditions
- Invoice number for tracking
- Outstanding balance tracking

#### Partial Payment Handling

**For Credit Invoices:**
- **Multiple Payments Allowed:** Customer can pay in installments
- **Payment Recording:** Each payment creates a receipt
- **Balance Tracking:** Invoice shows remaining balance
- **Status Progression:** Billed → Partially Paid → Paid

**Example:**
```
Invoice #INV-001: ₹10,000 (Due: Jan 15, 2026)
Payment #1: ₹4,000 on Jan 5, 2026 → Balance: ₹6,000
Payment #2: ₹6,000 on Jan 10, 2026 → Balance: ₹0 (Paid)
```

#### Advance Payment Handling

**Pre-Delivery Advances:**
- **Advance Receipt:** Customer pays portion before delivery
- **Advance Receipt Generation:** Document partial payment
- **Balance Invoice:** On delivery, invoice for remaining amount
- **Accounting:** Advance treated as liability until delivery

#### Overdue Payment Management

**Tracking & Alerts:**
- **Due Date Monitoring:** Automatic overdue detection
- **Alert System:** Notifications for approaching due dates
- **Follow-up Actions:** Phone reminders, email notifications
- **Credit Impact:** Overdue affects future credit approvals

#### Payment Method Tracking

**Supported Methods:**
- Cash (most common for wholesalers)
- Bank Transfer
- Cheque
- UPI/Card (future integration)

**Payment Recording:**
- Date, amount, method
- Reference number (cheque, UTR)
- Received by (staff member)
- Notes/remarks

### 2.3 Purchase Management (From Manufacturers)

#### Purchase Entry Timing

**Trigger:** When picking up finished product from manufacturer
**Considered As:** Purchase transaction (not just collection)

**Purchase Types:**
1. **Cash Purchase:** Pay immediately on pickup
2. **Credit Purchase:** Get invoice, pay later (7-30 days)

#### Direct Purchase Option (Without Customer Order)

**Purpose:** Buy gold, silver, or other materials directly from manufacturers/suppliers for inventory stocking, without any customer order.

**When to Use:**
- Stocking up on raw materials
- Bulk purchases for future orders
- Opportunistic buying at good rates
- Maintaining minimum inventory levels

**Direct Purchase Process:**
1. **Category Selection:** Choose metal category (Gold, Silver, Platinum, etc.)
2. **Purchase Details:** Enter pure metal weight and rate per gram (overrideable)
3. **Supplier Selection:** Choose manufacturer/supplier
4. **Purchase Note Generation:** Create purchase note/invoice
5. **Payment:** Cash or credit terms
6. **Inventory Update:** Add purchased pure metal to inventory
7. **Accounting Entries:** Automatic journal entries for purchase

**Purchase Note Fields:**
- Supplier details (manufacturer)
- Category (Metal type: Gold, Silver, etc.)
- Purity: Pure (24k Gold, 999 Silver, etc. - fixed)
- Weight purchased (grams)
- Rate per gram (pure metal price - editable/overrideable)
- Total amount (Weight × Rate per gram)
- GST amount
- Payment terms (cash or credit)
- Purchase date and reference number

**Accounting Entries for Direct Purchase:**

**Cash Purchase:**
```
Debit: Gold/Silver Inventory - ₹50,000
Credit: Cash/Bank - ₹50,000
Credit: GST Input Credit - ₹900
```

**Credit Purchase:**
```
Debit: Gold/Silver Inventory - ₹50,000
Credit: Accounts Payable - Supplier - ₹50,000
Credit: GST Input Credit - ₹900
```

**Later Payment for Credit Purchase:**
```
Debit: Accounts Payable - Supplier - ₹50,000
Credit: Cash/Bank - ₹50,000
```

**Inventory Impact:**
- **Weight Addition:** Add purchased weight to inventory
- **Value Tracking:** Record cost basis for inventory valuation
- **Purity Tracking:** Maintain purity levels for accurate pricing

**Benefits:**
- **Inventory Management:** Maintain optimal stock levels
- **Cost Control:** Buy at favorable rates
- **Flexibility:** Purchase without customer order dependency
- **Accounting Integration:** Proper purchase tracking and tax credits

#### Purchase Entry Process

**Fields Required:**
- Manufacturer details
- Order reference (link to customer order)
- Product description (gold weight, purity, design)
- Actual weight received (may differ from ordered due to wastage)
- Purchase price (agreed manufacturing cost)
- GST amount (input credit)
- Payment terms (cash or credit)

**Accounting Entries:**

**Cash Purchase:**
```
Debit: Gold Inventory - ₹8,500
Credit: Cash/Bank - ₹8,500
Credit: GST Input Credit - ₹153 (if applicable)
```

**Credit Purchase:**
```
Debit: Gold Inventory - ₹8,500
Credit: Accounts Payable - Manufacturer - ₹8,500
Credit: GST Input Credit - ₹153
```

**Later Payment for Credit Purchase:**
```
Debit: Accounts Payable - Manufacturer - ₹8,500
Credit: Cash/Bank - ₹8,500
```

#### Manufacturer Balance Sheet

**Tracking:**
- Total purchases outstanding
- Payment due dates
- Quality ratings
- Delivery performance
- Preferred manufacturer status

### 2.3 Pricing Management

#### Metal Rate Administration
**Category-Based Rate Setting:**
- **Base Rate Storage:** Each metal category stores 24k pure metal rate per gram
- **Daily Updates:** Admin can update rates in category settings
- **Automatic Conversions:** 
  - 22k = 24k × 0.9167
  - 18k = 24k × 0.75
- **Manual Override:** During order entry for spot pricing

#### Making Charges Management
**Product Catalog-Based Pricing:**
- **Categories Collection Structure (Metals):**
  ```
  {
    categoriesname: "Gold",
    categoriesimage: "url",
    metalRatePerGram: 6000,  // ₹6,000 per gram for 24k pure gold
    active: true
  }
  ```

- **Products Collection Structure:**
  ```
  {
    categoryId: "category-doc-id",
    subcategoryId: "subcategory-doc-id" (optional),
    productName: "Gold Necklace - Design A" (optional),
    makingChargePerGram: 200,
    karat: "22k",
    active: true
  }
  ```

**Order Entry Flow:**
- Select Category (Metal) → compulsory, locks metal type + shows base metal rate
- Select Subcategory → optional, filters products
- Select/Enter Product Name → shows making charge per gram
- If no product selected → enter custom making charge per gram
- **Per Order Override:** Making charge per gram is editable for special pricing
- Making Charge Total = Weight × Per Gram Rate (editable)

**Metal Rate Calculation:**
- Base Rate: From selected category (24k pure metal)
- Purity Conversion: Automatic (22k = 24k × 0.9167, 18k = 24k × 0.75)
- Manual Override: Available for spot pricing

**Benefits:**
- Product-specific pricing flexibility
- Category drives metal rate selection
- Subcategory optional for grouping
- Custom entries allowed for one-off orders

#### Tax Management
**GST Calculation:**
- **Gold Jewelry:** 3% GST
- **Making Charges:** Included in GST calculation
- **Tax Collection:** Automatic calculation and recording

### 2.4 Customer Management

#### Customer Profiles
- **Basic Info:** Name, Phone, Shop Name, Address
- **Customer Code:** Auto-generated unique serial number (CUST-001, CUST-002, etc.)
- **Credit Terms:** Payment terms (immediate, 7 days, 15 days)
- **Order History:** Past orders and payment track record
- **Outstanding Balance:** Amount due from customer

#### Customer CRUD Operations
- **Create:** Add new customer with auto-generated code
- **Read:** View customer details and history
- **Update:** Edit customer information
- **Delete:** Deactivate customer (preserve history)

#### Customer Search & Filtering
- **Search By:** Name, Mobile Number, Customer Code
- **Filters:** Active/Inactive, Credit Status, Outstanding Balance Range
- **Quick Search:** Global search across all customer fields

#### Customer Balance Sheet
- **Total Orders:** Sum of all order values
- **Payments Received:** Amount collected
- **Outstanding Amount:** Orders - Payments
- **Credit Limit:** Maximum allowed outstanding balance

### 2.5 Manufacturer/Supplier Management

#### Manufacturer Profiles
- **Basic Info:** Name, Contact, Specialization (gold, silver, etc.)
- **Manufacturer Code:** Auto-generated unique serial number (MANU-001, MANU-002, etc.)
- **Pricing Terms:** Commission structure, payment terms
- **Quality Rating:** Delivery timeliness, product quality
- **Order History:** Past orders and payment track record

#### Manufacturer CRUD Operations
- **Create:** Add new manufacturer with auto-generated code
- **Read:** View manufacturer details and history
- **Update:** Edit manufacturer information
- **Delete:** Deactivate manufacturer (preserve history)

#### Manufacturer Search & Filtering
- **Search By:** Name, Mobile Number, Manufacturer Code
- **Filters:** Active/Inactive, Specialization, Outstanding Balance Range
- **Quick Search:** Global search across all manufacturer fields

#### Manufacturer Balance Sheet
- **Total Orders Placed:** Sum of all manufacturing costs
- **Payments Made:** Amount paid to manufacturer
- **Outstanding Amount:** Orders - Payments
- **Payment Terms:** Due dates and penalty tracking

### 2.6 Accounting System (Adapted from Laundry BRD)

#### Manual Journal Entries (For Accounting Experts)
**Double-Entry Journal System:**
- **Manual Entry Capability:** Accounting experts can create custom journal entries
- **Debit/Credit Validation:** System ensures debits = credits for each entry
- **Entry Fields:**
  - Date
  - Description
  - Debit Account + Amount
  - Credit Account + Amount
  - Reference (order/invoice number)
- **Audit Trail:** All manual entries logged with user and timestamp
- **Reversal Capability:** Can reverse incorrect manual entries

**Automated + Manual Integration:**
- System creates automated entries for orders/payments
- Manual entries for adjustments, corrections, special transactions
- All entries feed into general ledger and financial reports

#### Core Accounting Accounts (Jewelry-Specific)

**Assets (1000-1999):**
```
MAIN-1001: Cash in Hand
MAIN-1002: Bank Account - Primary
MAIN-1003: Accounts Receivable (Customer Outstanding)
MAIN-1004: Gold Inventory (24k Gold)
MAIN-1005: Silver Inventory (999 Silver)
MAIN-1006: Platinum Inventory (999 Platinum)
MAIN-1007: Diamond Inventory (by carat)
MAIN-1008: GST Input Tax Credit
MAIN-1201: Vault Security Equipment
MAIN-1202: Weighing Machines
MAIN-1203: Display Cases
```

**Liabilities (2000-2999):**
```
MAIN-2001: Accounts Payable (Manufacturer Outstanding)
MAIN-2002: GST Payable
MAIN-2003: Salaries Payable
MAIN-2004: Rent Payable
MAIN-2101: Gold Loan Payable
MAIN-2102: Working Capital Loan
```

**Equity (3000-3999):**
```
MAIN-3001: Owner's Capital
MAIN-3002: Retained Earnings
MAIN-3003: Current Year Profit/Loss
```

**Income (4000-4999):**
```
MAIN-4001: Sales Revenue (Customer Orders)
MAIN-4002: Making Charges Income
MAIN-4003: Commission Income
MAIN-4004: Interest Income
```

**Expenses (5000-5999):**
```
MAIN-5001: Cost of Gold/Silver Purchased
MAIN-5002: Manufacturing Cost Paid
MAIN-5101: Salaries & Wages
MAIN-5102: Rent & Utilities
MAIN-5103: Insurance
MAIN-5104: Transportation
MAIN-5105: Office Supplies
MAIN-5106: Marketing
MAIN-5107: Wastage Loss
MAIN-5108: Hallmarking & Certification
```

#### Automated Transactions (Jewelry-Specific)

**1. Customer Order Creation (Pre-Order - No Billing):**
```
No accounting entry yet - just order tracking
```

**2. Cash Sale (On Delivery + Payment):**
```
Debit: Cash/Bank - ₹10,000
Credit: Sales Revenue - ₹9,700
Credit: GST Payable - ₹300
```

**3. Credit Sale Invoice (On Delivery):**
```
Debit: Accounts Receivable - Customer X - ₹10,000
Credit: Sales Revenue - ₹9,700
Credit: GST Payable - ₹300
```

**4. Payment Collection (Against Invoice):**
```
Debit: Cash/Bank - ₹10,000
Credit: Accounts Receivable - Customer X - ₹10,000
```

**5. Partial Payment (Against Invoice):**
```
Debit: Cash/Bank - ₹4,000
Credit: Accounts Receivable - Customer X - ₹4,000
(Note: Receivable still shows ₹6,000 balance)
```

**6. Manufacturer Order Placement:**
```
No immediate accounting - just order tracking
```

**7. Cash Purchase from Manufacturer (On Pickup):**
```
Debit: Gold Inventory - ₹8,500
Credit: Cash/Bank - ₹8,500
Credit: GST Input Credit - ₹153
```

**8. Credit Purchase from Manufacturer (On Pickup):**
```
Debit: Gold Inventory - ₹8,500
Credit: Accounts Payable - Manufacturer Y - ₹8,500
Credit: GST Input Credit - ₹153
```

**9. Payment to Manufacturer (Credit Purchase Settlement):**
```
Debit: Accounts Payable - Manufacturer Y - ₹8,500
Credit: Cash/Bank - ₹8,500
```

**10. Commission Recognition (On Sale Completion):**
```
Debit: Commission Expense - ₹1,500
Credit: Commission Income - ₹1,500
(Or directly to Retained Earnings)
```

#### Financial Reports

**Customer Balance Sheet:**
- Outstanding receivables by customer
- Aging analysis (0-30, 31-60, 61+ days)
- Payment history and trends

**Manufacturer Balance Sheet:**
- Outstanding payables by manufacturer
- Payment due dates
- Quality and delivery performance

**Profit & Loss:**
- Sales revenue vs manufacturing costs
- Commission income tracking
- Wastage and loss analysis

**Inventory Valuation:**
- Current gold value at market rates
- Purity-wise breakdown
- Holding cost analysis

### 2.7 User Interface & Workflow

#### Order Entry Screen (Phone-Based)

**Step 1: Customer Selection**
- Search existing customer by phone/name
- Add new customer (name, phone, shop name)
- Quick customer history view

**Step 2: Product Selection**
- **Category (Metal):** Dropdown - compulsory, non-editable once selected
  - Options: Gold, Silver, Platinum, Diamond
  - Shows base metal rate per gram (24k pure)
- **Subcategory (Product Type):** Dropdown - optional, editable
  - Options: Necklace, Bracelet, Ring, Chain, Earrings, etc.
- **Product Name:** Text field - optional, editable
  - Shows making charge per gram if selected from catalog
  - Can enter custom product name with custom making charge

**Step 3: Specifications**
- **Karat/Purity:** Dropdown based on selected metal
  - Gold: 24k, 22k, 18k
  - Silver: 999, 925
  - etc.
- **Total Weight (Grams):** Number input - compulsory

**Step 4: Price Calculation**
- Metal cost: Weight × metal rate (based on karat)
- Making charge: Weight × per gram rate (from product or custom entry)
- **Making Charge Override:** Editable per order - can modify the per gram rate for special pricing
- GST: 3% on (metal cost + making charge)
- Total display with breakdown
- Manual override options for metal rate and making charge

**Step 5: Manufacturer Assignment**
- Select preferred manufacturer (optional reference)
- Set expected delivery date

**Step 6: Order Confirmation**
- Generate order receipt (not invoice)
- Status: "Confirmed"

#### Status Update Workflow

**Order Status Buttons:**
- **In Production:** When manufacturer starts work
- **Ready for Pickup:** When manufacturer says product ready
- **Picked Up:** **Requires completing purchase entry form** - Enter manufacturing cost, calculate commission, create purchase entry, select cash/credit. Status cannot change without payment details.
- **Delivered:** Hand over to customer
- **Create Bill/Invoice:** Based on payment method

#### Billing Decision Screen

**After Delivery - Payment Method Selection:**
```
How will the customer pay?

[ ] Cash Payment (Immediate)
    → Generate Bill + Mark as Paid

[ ] Credit Payment (Later)
    → Generate Invoice + Set Due Date
```

**Cash Payment Flow:**
- Enter amount received
- Select payment method (cash/bank)
- Generate bill/receipt
- Order status → "Completed"

**Credit Payment Flow:**
- Set credit terms (7, 15, 30 days)
- Generate invoice
- Set due date
- Order status remains "Delivered", Payment status "Billed"

#### Payment Collection Screen

**For Credit Invoices:**
- Show outstanding balance
- Enter payment amount
- Generate payment receipt
- Update payment status (Partially Paid → Paid)
- Send payment reminder if overdue

#### Direct Purchase Screen

**For Inventory Stocking (No Customer Order):**
```
Category: [Dropdown - Gold, Silver, Platinum, Diamond]
Supplier: [Dropdown - Manufacturers/Suppliers]
Purity: [Auto-filled - Pure (24k Gold, 999 Silver, etc.)]
Weight: [Grams/Carats]
Rate per Gram (Pure): [₹] (shows category base rate, but editable for override)
Total Amount: [Calculated - Weight × Rate]
GST: [Calculated - 3% or 5% based on material]
Payment Type: [Cash] [Credit]

For Credit:
Due Date: [Date picker]
```

**Actions:**
- Generate Purchase Note
- Update Inventory (pure metal weight)
- Create Accounting Entries
- Schedule Payment (if credit)

#### Dashboard Overview

**Key Metrics Display:**
- **Recent Activities:** Last 10 order status changes, payments received, new orders
- **New Orders Today:** Count and total value of orders created today
- **Total Orders:** Active orders by status (Confirmed, In Production, Ready for Pickup, etc.)
- **Due Orders:** Orders with delivery dates today/tomorrow
- **Today Dues:** Customer payments due today + manufacturer payments due today
- **Today Delivered:** Orders delivered today with payment status
- **Outstanding Receivables:** Total customer dues by aging (0-30, 31-60, 61+ days)
- **Outstanding Payables:** Total manufacturer dues by aging
- **Gold Inventory Value:** Current market value of inventory
- **Today's Commission:** Total commission earned today

**Quick Actions:**
- New Order
- Update Metal Rates
- Record Customer Payment
- Record Manufacturer Payment
- View Reports

#### Left Menu Navigation Structure

**Main Menu Items (Simplified for Gold Smith Shop):**
- **Dashboard:** Overview with key metrics and recent activities
- **Orders:** 
  - New Order
  - Order List (with status filters)
  - Status Updates
  - Purchase Entries (on pickup)
  - Direct Purchases (inventory stocking)
  - Delivery & Billing
- **Products:** 
  - Categories (Metal types with rates)
  - Products (Making charges catalog)
- **Customers:** Customer CRUD and balance sheet
- **Manufacturers:** Manufacturer CRUD and balance sheet
- **Accounting:** Journal entries and basic reports
- **Settings:** Metal rates and basic settings

**Hidden for Now:**
- Advanced subcategories management
- Detailed financial reports (P&L, Balance Sheet)
- User management
- Advanced analytics

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Technology Stack
- **Frontend:** Next.js with React
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Hosting:** Vercel
- **Real-time Updates:** Firestore listeners

### 3.2 Database Collections

**Core Collections:**
- `customers` - Customer profiles with auto-generated codes, balances, search fields
- `manufacturers` - Manufacturer profiles with auto-generated codes, balances, search fields
- `orders` - Customer orders (from shopkeepers)
- `categories` - Metal categories with base rates per gram (24k pure)
- `subcategories` - Product type subcategories
- `products` - Product catalog (making charge per gram)
- `inventory` - Metal inventory tracking
- `making_charges` - Service-based pricing (legacy, may be replaced by products)
- `accounts` - Accounting chart of accounts
- `transactions` - Journal entries (automated + manual)
- `payments` - Payment tracking for invoices

### 3.3 Integration Points

**External APIs (Future):**
- Gold rate APIs for automatic updates
- SMS/WhatsApp for order confirmations
- Payment gateway for online payments
- Hallmarking system integration

---

## 4. IMPLEMENTATION PHASES

### Phase 1: Core Gold Smith Shop Features
- Simplified left menu with essential modules
- Customer order creation with status tracking
- Basic inventory tracking (gold received on pickup and direct purchases)
- Simple accounting entries (sales + purchases)
- Customer/manufacturer management with codes and search
- Cash/credit billing system
- Dashboard with key metrics
- Product catalog with metal rates and making charges

### Phase 2: Advanced Features (Hidden for Now)
- Manual double-entry journal system for accounting experts
- Commission tracking and analysis
- Advanced reporting and analytics
- Multi-metal support (silver, platinum, diamonds)
- Payment reminders and overdue management
- Detailed financial reports (P&L, Balance Sheet)
- User management and permissions

---

## 5. SUCCESS CRITERIA

### User Experience
- **Order Entry:** < 2 minutes per order
- **Price Calculation:** Instant with clear breakdown
- **Payment Tracking:** Real-time balance updates
- **Report Generation:** < 30 seconds

### Business Impact
- **Inventory Accuracy:** 99.9% weight tracking
- **Payment Collection:** 95% within agreed terms
- **Profit Visibility:** Clear commission tracking
- **Operational Efficiency:** 50% reduction in manual calculations

---

## 6. RISK MITIGATION

### Business Risks
- **Gold Price Volatility:** Manual override capability
- **Payment Delays:** Credit limit management
- **Inventory Loss:** Strict access controls
- **Competition:** Superior customer service

### Technical Risks
- **Data Accuracy:** Double-entry validation
- **System Downtime:** Offline capability
- **Security:** Encrypted gold inventory data
- **Scalability:** Cloud-based architecture

---

## 7. COMPLETE BUSINESS FLOW SUMMARY

### Phone-to-Payment Process

**1. Customer Order (Phone Call):**
- Shopkeeper calls: "50gms 22k gold bracelet"
- Enter order in system (status: New → Confirmed)
- Generate order receipt (no bill yet)

**2. Manufacturing Process:**
- Status: In Production → Ready for Pickup
- No accounting entries during production

**3. Pickup & Purchase:**
- Collect finished product from manufacturer
- Enter manufacturing cost and calculate commission
- Create purchase entry (cash or credit)
- Update inventory with received gold
- Status: Picked Up

**4. Delivery & Billing:**
- Deliver to customer
- Ask: "Cash or Credit?"
- **Cash:** Generate bill + receive payment + status "Completed"
- **Credit:** Generate invoice + set due date + status "Delivered"

**5. Payment Collection (For Credit):**
- Track outstanding balance
- Record partial payments with receipts
- Update status: Billed → Partially Paid → Paid → Completed

### BA Decision Rationale

**Why Pre-Order ≠ Billing:**
- **Customer Experience:** No pressure during ordering phase
- **Cash Flow:** Customer pays only when satisfied with product
- **Business Reality:** Wholesalers often deliver first, bill later
- **Flexibility:** Same order can be cash or credit based on relationship

**When to Create Purchase Entry:**
- **Pickup Time:** When product physically received
- **Accounting Accuracy:** Matches actual gold received (may differ due to wastage)
- **Payment Reality:** Pay manufacturer when collecting (cash) or get invoice (credit)

**Cash vs Credit Logic:**
- **Cash Sales:** Immediate revenue recognition, no receivables tracking
- **Credit Sales:** Revenue on delivery, receivables management, payment follow-up
- **Partial Payments:** Common in wholesale, need flexible tracking

**Order Status Design:**
- **Tracks Progress:** From order to completion
- **Triggers Actions:** Each status enables specific functions
- **Payment Integration:** Status + payment status give complete picture

This design handles your commission-based wholesaling perfectly - tracking both sides of the business with proper accounting while keeping the interface simple for phone-based operations.</content>
<parameter name="filePath">d:\Easy2SolutionsProjects\ClientProjects\GoldSmith\goldSmith\docs\BRD_GoldSmith_v1.md
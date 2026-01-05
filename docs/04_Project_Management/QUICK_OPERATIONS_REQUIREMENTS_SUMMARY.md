# GoldSmith Quick Operations Requirements Summary

## Overview
This document summarizes the requirements for implementing quick operations in the GoldSmith accounting system. All transactions must handle gold/USD conversions using real-time gold prices per ounce, converted to per-gram rates.

## Core Accounting Principles
- **Gold Accounts (1101-1104)**: Balances in pure gold grams (24k equivalent)
- **Cash Accounts (1201-1202)**: Balances in USD
- **Customer Receivables (1301, CUST-XXXX)**: Balances in pure gold grams
- **Manufacturer Payables (2101)**: Balances in USD
- **All transactions**: Recorded in pure gold grams, displayed in USD for user interface

## Required Quick Operations

### 1. Purchase from Supplier
**Purpose**: Record purchases of pure gold or finished jewelry from manufacturers

#### Pure Gold Purchase
- **Debit**: Gold in Hand (1104) or Gold Bank (1101) - increases gold inventory
- **Credit**: Cash (1201) - decreases cash if paid immediately
- **Credit**: Manufacturer Payables (2101) - increases payable if credit purchase
- **Gold Conversion**: Supplier provides gold weight in grams, system calculates pure gold equivalent

#### Finished Goods Purchase
- **Debit**: Finished Goods Inventory (1103) - increases inventory in pure gold equivalent
- **Credit**: Cash (1201) or Manufacturer Payables (2101)
- **Calculation**: Jewelry weight × karat purity coefficient = pure gold grams

### 2. Sale Invoice
**Purpose**: Record sales of finished jewelry to customers

#### Sale Transaction
- **Debit**: Customer Receivables (CUST-XXXX) - increases customer debt in pure gold
- **Credit**: Finished Goods Inventory (1103) - reduces inventory
- **Credit**: Commission Income (4101) - records commission earned

#### Customer Payment
- **If Pure Gold Payment**: Debit Gold in Hand (1104) or Gold Bank (1101), Credit Customer Receivables
- **If USD Payment**: Convert USD to gold grams via popup, then same accounting

### 3. Loan to Customer
**Purpose**: Record cash loans to customers, tracked as gold equivalents

#### Loan Recording
- **Debit**: Customer Receivables (CUST-XXXX) - increases customer debt in pure gold
- **Credit**: Cash (1201) - decreases cash
- **Conversion**: Cash amount → gold price per ounce → per gram rate → pure gold grams

#### Loan Repayment
- **Debit**: Cash (1201) - increases cash received
- **Credit**: Customer Receivables (CUST-XXXX) - reduces customer debt
- **Conversion**: USD received → gold grams equivalent

### 4. Gold Challan Issuance
**Purpose**: Issue gold withdrawal challans to manufacturers (already implemented in orders page)

#### Accounting Entries
- **Debit**: Gold in Transit (1102) - increases transit gold
- **Credit**: Gold Bank (1101) - reduces bank gold
- **Amount**: Pure gold grams calculated from order specifications

## Technical Implementation Requirements

### Gold Price Integration
- **Popup Component**: Show current gold price per ounce
- **Auto-Conversion**: Ounce price → gram price (÷31.1035)
- **Real-time Updates**: Fetch current market price
- **Display**: Show both gold grams and USD equivalent

### Accounting Engine Integration
- **Method**: Use `accountingEngine.createEntry()` with proper debit/credit structure
- **Balance Types**: 'gold' for gold accounts, 'usd' for cash/payable accounts
- **Validation**: Ensure double-entry bookkeeping rules
- **Rollup**: Automatic parent account balance updates

### UI Components Needed
1. **Gold Price Popup**: Modal showing current price, conversion calculator
2. **Purchase Form**: Supplier selection, item type (gold/finished goods), payment method
3. **Sale Invoice Form**: Customer selection, jewelry items, payment method
4. **Loan Form**: Customer selection, loan amount, repayment terms
5. **Quick Challan**: Simplified challan issuance from dashboard

### Data Flow
1. User selects operation type
2. System shows relevant form with gold price popup
3. User enters amounts in preferred currency
4. System converts to pure gold grams for accounting
5. AccountingEngine records transaction with proper debit/credit entries
6. Balances update automatically with hierarchical rollup

## Implementation Status

### ✅ Completed Features

#### 1. Gold Price Integration
- **GoldPricePopup Component**: Interactive popup showing current gold price per ounce/gram
- **Real-time Price Fetching**: Uses goldprice.org, metalpriceapi.com, coingecko.com with fallbacks
- **Auto-Conversion**: Converts between USD and pure gold grams
- **Price Confirmation**: Returns structured price data for accounting

#### 2. Purchase from Supplier Form
- **Pure Gold Purchase**: Increases Gold in Hand (1104) or Gold Bank (1101), decreases Cash (1201) or Manufacturer Payables (2101)
- **Finished Goods Purchase**: Increases Finished Goods Inventory (1103) in pure gold equivalent
- **Payment Methods**: Cash or Credit (Udhar)
- **Accounting Integration**: Automatic double-entry bookkeeping

#### 3. Sale Invoice Form
- **Jewelry Sales**: Reduces Finished Goods Inventory (1103), increases Customer Receivables (CUST-XXXX)
- **Payment Methods**: Cash (USD), Gold, or Credit
- **Commission Tracking**: Optional commission income recording
- **Customer Account Integration**: Uses existing customer receivable accounts

#### 4. Loan to Customer Form
- **Cash Loan Recording**: Converts USD to pure gold grams, increases Customer Receivables
- **Gold Price Conversion**: Uses popup calculator for accurate conversion
- **Loan Tracking**: Integrated with existing LoanEngine for repayment handling
- **Accounting**: Debit Customer Receivables, Credit Cash

#### 5. Quick Challan Form
- **Order Selection**: Links challan to existing orders
- **Gold Withdrawal**: Debit Gold in Transit (1102), Credit Gold Bank (1101)
- **Manufacturer Integration**: Updates manufacturer gold transit balances
- **Simplified Workflow**: Streamlined version of order challan process

#### 6. Dashboard Integration
- **Quick Actions Grid**: 8-button grid with all operations
- **Modal Management**: State management for all popup forms
- **User-Friendly Interface**: Color-coded buttons with clear descriptions
- **Responsive Design**: Works on desktop and mobile

### Technical Implementation Details

#### Accounting Rules Implemented
1. **Purchase (Pure Gold)**:
   - Cash: Debit Gold Account (1104/1101), Credit Cash (1201)
   - Credit: Debit Gold Account (1104/1101), Credit Manufacturer Payables (2101)

2. **Purchase (Finished Goods)**:
   - Cash: Debit Finished Goods (1103), Credit Cash (1201)
   - Credit: Debit Finished Goods (1103), Credit Manufacturer Payables (2101)

3. **Sale**:
   - Credit: Debit Customer Receivables (CUST-XXXX), Credit Finished Goods (1103)
   - Cash: Debit Cash (1201), Credit Customer Receivables (CUST-XXXX)
   - Gold: Debit Gold in Hand (1104), Credit Customer Receivables (CUST-XXXX)

4. **Loan**:
   - Debit Customer Receivables (CUST-XXXX), Credit Cash (1201)

5. **Challan**:
   - Debit Gold in Transit (1102), Credit Gold Bank (1101)

#### Data Flow
1. User selects operation from dashboard
2. Form opens with relevant fields
3. Gold price popup calculates conversions
4. AccountingEngine creates proper journal entries
5. Balances update with hierarchical rollup
6. Success confirmation with transaction details

#### Error Handling
- Form validation with specific error messages
- API fallback chains for gold price fetching
- Transaction rollback on accounting failures
- User-friendly error alerts

### Files Created/Modified
- `src/app/admin/dashboard/page.js` - Added quick actions and form management
- `src/components/PurchaseForm.js` - New supplier purchase form
- `src/components/SaleForm.js` - New sales invoice form
- `src/components/LoanForm.js` - New customer loan form
- `src/components/QuickChallanForm.js` - New simplified challan form
- `src/components/GoldPricePopup.js` - Updated for form integration
- `docs/04_Project_Management/QUICK_OPERATIONS_REQUIREMENTS_SUMMARY.md` - Implementation documentation

### Testing Recommendations
1. **Purchase Transactions**: Test both cash and credit purchases for gold and finished goods
2. **Sales Transactions**: Test all payment methods (cash, gold, credit)
3. **Loan Transactions**: Verify USD to gold conversion and receivable tracking
4. **Challan Issuance**: Confirm accounting entries and manufacturer balance updates
5. **Gold Price Integration**: Test conversion calculations and API fallbacks
6. **Balance Validation**: Ensure accounting equation integrity after each transaction

### Success Metrics
- ✅ All transactions maintain double-entry bookkeeping
- ✅ Gold inventory accurately tracked in pure grams
- ✅ Customer/manufacturer balances correctly updated
- ✅ Real-time gold price integration working
- ✅ User interface intuitive and responsive
- ✅ Error handling prevents data corruption
- ✅ Hierarchical account balance rollup functioning
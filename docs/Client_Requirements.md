# Client Requirements - Pure Gold Accounting System

## Overview
This document outlines the specific requirements for the GoldSmith jewelry management system's pure gold accounting calculations, as provided by the client. This system follows traditional Afghan/Persian gold trading practices where gold itself serves as the currency of trade.

## Gold Price Source
- **Live Gold Price**: $4,530.00 per ounce (retrieved from online gold price API)
- **Price per Gram**: $145.43 = $4,530.00 ÷ 31.15 grams per ounce
- **Conversion Factor**: 31.15 grams = 1 troy ounce

## Product Calculation Example (200g 18k Talacha)

### 1. Pure Gold in Product (تیزابی فعلی)
- **Total Weight**: 200 grams (finished product weight)
- **Karat**: 18k = 75% purity (18 ÷ 24 = 0.75)
- **Pure Gold Required**: 200 × 0.75 = **150.000 grams**
- **Formula**: `productPureGold = totalWeight × purityPercentage`

### 2. Commission in Pure Gold (تیزابی اجرت)
- **Commission Rate**: $1.20 per gram (making charge rate)
- **Total Commission (USD)**: 200 × $1.20 = **$240.00**
- **Commission as Pure Gold**: $240.00 ÷ $145.43 per gram = **1.650 grams**
- **Formula**: `makingChargeGold = (totalWeight × makingRateUSD) ÷ goldPricePerGram`

### 3. Prior Pure Gold Balance (تیزابی گذشته)
- **Source**: Retrieved from database for existing customers
- **Purpose**: Represents customer's previous pure gold credit/balance
- **Example**: 0.000 grams (new customer or zero balance)
- **Formula**: `priorBalance = customer.currentPureGoldBalance`

### 4. Total Pure Gold Required (مجموعه تیزابی)
- **Total Calculation**: 150.000g + 1.650g + 0.000g = **151.650 grams**
- **Formula**: `totalPureGold = productPureGold + makingChargeGold + priorBalance`
- **Customer Payment**: Customer must pay this amount in pure gold

## Key System Logic

### Pure Gold Equivalent System
This is a **pure gold equivalent accounting system** where:

1. **Everything converts to 24k pure gold** for internal tracking
2. **Commissions are expressed as pure gold weight**, not just monetary value
3. **Customer balances are maintained in pure gold grams**
4. **Final settlement is always in pure gold terms**

### Karat Purity Conversions
- **24k**: 100% purity (24 ÷ 24 = 1.0)
- **22k**: 91.67% purity (22 ÷ 24 = 0.9167)
- **18k**: 75% purity (18 ÷ 24 = 0.75)
- **14k**: 58.33% purity (14 ÷ 24 = 0.5833)

### Business Rules
- **Gold as Currency**: In Afghan/Persian gold shops, gold itself is the primary currency of trade
- **Pure Gold Tracking**: All transactions are tracked in pure gold equivalents (تیزابی)
- **Commission Conversion**: Making charges are converted from USD to pure gold weight
- **Balance Management**: Customer balances represent pure gold credits/debits
- **Settlement**: All payments and settlements are made in pure gold

## System Requirements

### Input Fields Required
1. **Product Details**:
   - Product name (manual entry allowed)
   - Total weight (grams)
   - Karat purity (14k, 18k, 22k, 24k)

2. **Pricing Information**:
   - Gold price per gram (auto-calculated from ounce price)
   - Making charge rate (USD per gram)

3. **Customer Information**:
   - Customer selection
   - Prior pure gold balance retrieval

### Calculation Display Requirements
1. **Separate Product Gold Section** (تیزابی محصول)
2. **Separate Commission Gold Section** (تیزابی اجرت)
3. **Customer Payment Summary** showing total pure gold required
4. **Challan Preview** for gold withdrawal documentation

### Output Requirements
- **Primary Display**: Pure gold grams (تیزابی)
- **Secondary Display**: Equivalent USD value (for reference only)
- **All Accounting**: Must be in pure gold terms

## Implementation Notes
- All calculations must use precise decimal arithmetic (3 decimal places minimum)
- Gold price should be updated regularly from live API
- Customer balances must be accurately maintained in database
- System must handle both new customers (zero balance) and existing customers
- Display should clearly separate product gold from commission gold

## Traditional Gold Trading Context
This system reflects the traditional practices of Afghan and Persian gold jewelry shops where:
- Gold is both the product and the currency
- Transactions are tracked in pure gold weight
- Commissions are calculated as gold weight equivalents
- Customer relationships are maintained through gold balance tracking</content>
<parameter name="filePath">d:\Easy2SolutionsProjects\ClientProjects\GoldSmith\goldSmith\docs\Client_Requirements.md
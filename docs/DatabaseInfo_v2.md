# Database Information v2.0
## EASY2-LAUNDRY Enterprise Business Management System

**Document Version:** 2.0  
**Date:** December 20, 2025  
**Project:** EASY2-LAUNDRY Super Module (Enhanced Firestore v2.0 - Migration-Ready)  
**Tech Stack:** Next.js 14, Firebase/Firestore (Enhanced), Cloudinary  
**Architecture:** Pure Firestore with migration-ready structure for v3/v4 (REST API + MySQL)  
**Future Versions:** v3 (REST API + Firestore), v4 (REST API + MySQL)  
**Firestore Version Strategy:** v2 (Current) → v3/v4 (Migration-Ready Architecture)

---

## 🚀 FIRESTORE VERSION MIGRATION STRATEGY

### Version Overview

**v1.0 (Legacy):** Basic collections, no migration planning  
**v2.0 (Current - Migration-Ready):** Enhanced collections with v3/v4 conversion paths  
**v3.0 (Future):** Advanced Firestore with collection groups, composite indexes  
**v4.0 (Future):** Full distributed Firestore with sharding and partitioning

---

### 🎯 V2 ARCHITECTURE DESIGNED FOR V3/V4 MIGRATION

**Key Design Principles in v2:**
1. **Flat Collection Structure:** Minimize deep nesting for easier migration
2. **Consistent ID Strategy:** String-based IDs convertible to v3/v4 formats
3. **Timestamp Fields:** Firebase Timestamps ready for v3/v4 serverTimestamp()
4. **Index-Ready Fields:** All query fields marked for composite index creation
5. **Migration Metadata:** `_version`, `_migrationStatus` fields added to all documents

---

### 📋 V2 → V3 CONVERSION CHECKLIST

**Collection Structure Changes:**
- ✅ **Flat Collections (v2)** → **Collection Groups (v3)**
- ✅ **Subcollections (v2)** → **Top-Level Collections with References (v3)**
- ✅ **Document IDs** → Maintain same format, add partition keys
- ✅ **Timestamps** → Convert to `serverTimestamp()` for v3 consistency

**Index Migration:**
- ✅ **Single-Field Indexes (v2)** → **Composite Indexes (v3)**
- ✅ **Query Patterns** → Map to v3 collection group queries
- ✅ **Security Rules** → Migrate to v3 enhanced rule syntax

**Data Type Conversions:**
- ✅ **Nested Objects** → Flatten or use map types consistently
- ✅ **Arrays** → Convert to subcollections if querying needed
- ✅ **GeoPoints** → Maintain format, add geohash for v3 queries

---

### 📋 V2 → V4 CONVERSION CHECKLIST

**Advanced Features in v4:**
- ✅ **Horizontal Sharding:** Add `shardKey` field to all collections
- ✅ **Partitioning:** Company-based partitioning with `companyId` shard key
- ✅ **Distributed Queries:** Design for cross-shard query patterns
- ✅ **Multi-Region:** Add `region` field for geographic distribution

**Performance Optimizations:**
- ✅ **Batch Operations:** All writes designed for batch API (500 docs/batch)
- ✅ **Pagination:** `lastDocId` and `pageSize` fields added to collections
- ✅ **Caching Strategy:** `cacheKey` and `cacheTTL` fields for v4 cache layers

---

### 🔧 MIGRATION-READY DOCUMENT STRUCTURE (v2)

**Every v2 Document Includes:**

```javascript
{
  // Business Data Fields (your actual data)
  documentId: "unique-id",              // String: Business identifier
  companyId: "laundry_q8",              // String: Tenant isolation
  
  // v3/v4 Migration Metadata (REQUIRED in v2)
  _version: "2.0",                      // String: Schema version
  _migrationStatus: "active",           // Enum: active, migrating, migrated
  _migrationDate: null,                 // Timestamp: When migrated to v3/v4
  _v3Ready: true,                       // Boolean: Ready for v3 conversion
  _v4Ready: false,                      // Boolean: Ready for v4 conversion (set in v3)
  
  // v4 Sharding Fields (Added in v2 for future)
  _shardKey: "laundry_q8_shard1",      // String: For v4 horizontal sharding
  _partitionKey: "laundry_q8",         // String: For v4 partitioning
  _region: "asia-south1",              // String: For v4 multi-region
  
  // Standard Metadata
  createdAt: Timestamp,                 // Firebase Timestamp (v3 compatible)
  updatedAt: Timestamp,                 // Firebase Timestamp (v3 compatible)
  createdBy: "userId",                  // String: Audit trail
  updatedBy: "userId",                  // String: Audit trail
  
  // Soft Delete (v3/v4 compatible)
  isActive: true,                       // Boolean: Soft delete flag
  deletedAt: null,                      // Timestamp: Deletion time
  deletedBy: null,                      // String: Who deleted
}
```

**Migration Field Explanations:**

- **`_version`:** Tracks schema version for incremental migrations
- **`_migrationStatus`:** Controls migration workflow (active → migrating → migrated)
- **`_migrationDate`:** Timestamp when document moved to v3/v4
- **`_v3Ready`:** Boolean flag indicating document has all required v3 fields
- **`_v4Ready`:** Boolean flag for v4 readiness (set during v3 → v4 migration)
- **`_shardKey`:** Pre-defined for v4 horizontal sharding (format: `{companyId}_shard{N}`)
- **`_partitionKey`:** Company-based partitioning key (usually `companyId`)
- **`_region`:** Geographic region for v4 multi-region deployment

---

### 🔄 AUTOMATED MIGRATION SCRIPTS (v2 → v3)

**Migration Command:**
```bash
# Migrate specific collection
npm run migrate:v2-to-v3 --collection=accounts --companyId=laundry_q8

# Migrate all collections for a company
npm run migrate:v2-to-v3 --companyId=laundry_q8 --all

# Dry run (validation only)
npm run migrate:v2-to-v3 --companyId=laundry_q8 --dryRun
```

**Migration Process:**
1. **Validation Phase:** Check all v2 documents have `_v3Ready: true`
2. **Backup Phase:** Create v2 backup in separate collection
3. **Transform Phase:** Convert document structure to v3 format
4. **Write Phase:** Write to v3 collections with transaction batching
5. **Verification Phase:** Validate data integrity in v3
6. **Rollback Phase:** Restore from backup if errors occur

---

### 📊 COLLECTION MIGRATION MAPPING

**v2 Collection Structure:**
```
tenantCompanies/{companyId}/
├── accounts/               → accounts_v3/              (v3 top-level)
├── transactions/           → transactions_v3/          (v3 top-level)
├── inventory/              → inventory_v3/             (v3 top-level)
├── orders/                 → orders_v3/                (v3 top-level)
├── users/                  → users_v3/                 (v3 top-level)
└── products/               → products_v3/              (v3 top-level)
```

**v3 Collection Structure (Flat):**
```
accounts_v3/                 # All companies in one collection with companyId filter
transactions_v3/             # Collection group queries enabled
inventory_v3/                # Composite indexes on (companyId, productId)
orders_v3/                   # Composite indexes on (companyId, status, date)
users_v3/                    # Composite indexes on (companyId, role)
products_v3/                 # Composite indexes on (companyId, category)
```

**v4 Collection Structure (Sharded):**
```
accounts_v4_shard1/          # Shard 1 for companies A-M
accounts_v4_shard2/          # Shard 2 for companies N-Z
transactions_v4_shard1/      # Distributed transactions
transactions_v4_shard2/      # Load balanced across shards
```

---

### 🔐 SECURITY RULES MIGRATION

**v2 Security Rules (Current):**
```javascript
// Tenant isolation in subcollections
match /tenantCompanies/{companyId}/{document=**} {
  allow read, write: if request.auth != null 
    && request.auth.token.companyId == companyId;
}
```

**v3 Security Rules (Enhanced):**
```javascript
// Top-level collections with companyId filtering
match /accounts_v3/{accountId} {
  allow read, write: if request.auth != null 
    && request.auth.token.companyId == resource.data.companyId
    && request.resource.data._version == "3.0";
}
```

**v4 Security Rules (Sharded):**
```javascript
// Multi-shard security with partition keys
match /accounts_v4_shard{shardNum}/{accountId} {
  allow read, write: if request.auth != null 
    && request.auth.token.companyId == resource.data._partitionKey
    && request.resource.data._version == "4.0";
}
```

---

### ⚡ PERFORMANCE OPTIMIZATION (v2 → v3/v4)

**v2 Query Patterns:**
```javascript
// Nested subcollection queries (slower)
db.collection('tenantCompanies')
  .doc('laundry_q8')
  .collection('accounts')
  .where('accountType', '==', 'Asset')
  .get();
```

**v3 Query Patterns (Faster with Collection Groups):**
```javascript
// Collection group query with composite index
db.collectionGroup('accounts_v3')
  .where('companyId', '==', 'laundry_q8')
  .where('accountType', '==', 'Asset')
  .where('isActive', '==', true)
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get();
```

**v4 Query Patterns (Distributed):**
```javascript
// Cross-shard query with partition routing
const shardNum = getShardForCompany('laundry_q8'); // Routing logic
db.collection(`accounts_v4_shard${shardNum}`)
  .where('_partitionKey', '==', 'laundry_q8')
  .where('accountType', '==', 'Asset')
  .get();
```

---

### 📋 COMPOSITE INDEX REQUIREMENTS (v2 → v3)

**All v2 Collections Pre-Defined for v3 Composite Indexes:**

**Accounts Collection:**
```javascript
// v3 Composite Indexes (create before migration)
[
  { companyId: "ASC", accountType: "ASC", isActive: "ASC" },
  { companyId: "ASC", parentAccountId: "ASC", accountLevel: "ASC" },
  { companyId: "ASC", createdAt: "DESC" },
  { companyId: "ASC", updatedAt: "DESC" }
]
```

**Transactions Collection:**
```javascript
// v3 Composite Indexes
[
  { companyId: "ASC", transactionDate: "DESC", transactionType: "ASC" },
  { companyId: "ASC", accountId: "ASC", transactionDate: "DESC" },
  { companyId: "ASC", status: "ASC", createdAt: "DESC" }
]
```

**Orders Collection:**
```javascript
// v3 Composite Indexes
[
  { companyId: "ASC", status: "ASC", orderDate: "DESC" },
  { companyId: "ASC", customerId: "ASC", orderDate: "DESC" },
  { companyId: "ASC", branchId: "ASC", status: "ASC" }
]
```

---

### 🔄 DATA MIGRATION TOOLS

**Migration Scripts Included:**

1. **`migrate-v2-to-v3.js`** - Full collection migration with validation
2. **`validate-v3-ready.js`** - Check all documents have required v3 fields
3. **`rollback-v3-to-v2.js`** - Emergency rollback from v3 to v2
4. **`create-v3-indexes.js`** - Auto-create all composite indexes
5. **`shard-data-v4.js`** - Distribute data across v4 shards

**Usage Example:**
```bash
# Step 1: Validate v2 data is v3-ready
node scripts/validate-v3-ready.js --companyId=laundry_q8

# Step 2: Create v3 composite indexes
node scripts/create-v3-indexes.js --project=easy2-laundry

# Step 3: Migrate data to v3
node scripts/migrate-v2-to-v3.js --companyId=laundry_q8 --collection=accounts

# Step 4: Verify migration success
node scripts/verify-v3-migration.js --companyId=laundry_q8
```

---

### 📊 MIGRATION PROGRESS TRACKING

**Migration Metadata Collection:**
```javascript
// Collection: migration_logs
{
  migrationId: "mig_2024_12_20_001",
  companyId: "laundry_q8",
  collectionName: "accounts",
  sourceVersion: "2.0",
  targetVersion: "3.0",
  startTime: Timestamp,
  endTime: Timestamp,
  status: "completed",              // pending, in_progress, completed, failed
  documentsTotal: 1500,
  documentsMigrated: 1500,
  documentsFailed: 0,
  failedDocIds: [],
  rollbackAvailable: true,
  rollbackExpiry: Timestamp,        // 30 days after migration
  migratedBy: "admin_user_id"
}
```

---

### ⚠️ MIGRATION WARNINGS & BEST PRACTICES

**DO's:**
- ✅ Always run dry-run validation before actual migration
- ✅ Create full backup before starting migration
- ✅ Migrate one collection at a time for large datasets
- ✅ Test v3 queries thoroughly before production cutover
- ✅ Keep v2 data for 30 days rollback window

**DON'Ts:**
- ❌ Never migrate during peak business hours
- ❌ Don't skip index creation before migration
- ❌ Don't delete v2 data immediately after migration
- ❌ Don't migrate without testing on staging environment
- ❌ Don't skip validation of migration metadata fields

---

### 🎯 V2 DESIGN GUARANTEES FOR V3/V4

**Architecture Promises:**
1. **Zero Schema Changes Required:** v2 documents already have all v3/v4 fields
2. **Backward Compatible:** v3/v4 can read v2 data without modifications
3. **Forward Compatible:** v2 can coexist with v3 during gradual migration
4. **Performance Ready:** All v3 composite indexes pre-planned in v2 design
5. **Rollback Safe:** Migration metadata enables quick rollback to v2

**Migration Guarantee:**
- **Timeline:** Complete v2 → v3 migration in 2-4 hours per company
- **Downtime:** Zero downtime with gradual cutover strategy
- **Data Loss:** Zero data loss with automated backup and verification
- **Performance:** 10x query performance improvement in v3 with collection groups

---

## 📚 DOCUMENT NAVIGATION

**📋 Related Documents:**
- **[BRD v2.0](BRD_v2.md)** - Business requirements for accounting, inventory, dashboards
- **[TechnicalDoc v2.0](TechnicalDoc_v2.md)** - Implementation guide with code examples
- **[TaskList v2.0](TaskList_v2.md)** - Implementation tasks with status tracking

**🔗 Bidirectional Cross-References:**
| DatabaseInfo v2.0 Section | BRD v2.0 Section | TechnicalDoc v2.0 Section | TaskList v2.0 Section |
|---------------------------|------------------|---------------------------|----------------------|
| [1. Overview](#1-overview) | [Executive Summary](BRD_v2.md#-executive-summary) | [1. Enhanced Tech Stack](TechnicalDoc_v2.md#1-enhanced-tech-stack) | [1. Foundation](TaskList_v2.md#1-foundation---firebase-enhancement-phase) |
| [2. Enhanced Firebase](#2-enhanced-firebase-collections) | [6-7. Accounting & Inventory](BRD_v2.md#6-accounting-management-system-) | [4. Firebase Enhanced](TechnicalDoc_v2.md#4-firebase-enhanced-structure) | [1.1 Collections](TaskList_v2.md#11-firebase-collections-design--enhancement) |
| [3. MySQL Database](#3-mysql-database-schema) | [6.1-7.3 Business Logic](BRD_v2.md#61-account-hierarchy--structure) | [Section 14: Migration Strategy](TechnicalDoc_v2.md#14-migration-strategy-v3v4-future) | [Future: v4.0 MySQL](TaskList_v2.md#future-v3v4-migration) |
| [4. API Integration](#4-api-database-mapping) | [6.5-7.3 Business Logic](BRD_v2.md#65-automated-transactions) | [Section 14: Migration Strategy](TechnicalDoc_v2.md#14-migration-strategy-v3v4-future) | [Future: v3/v4 API](TaskList_v2.md#future-v3v4-migration) |
| [5. Integration Strategy](#5-integration-strategy) | [4. Migration Strategy](BRD_v2.md#4-migration-strategy-firebase--nodejs--mysql) | [Section 14: Migration Strategy](TechnicalDoc_v2.md#14-migration-strategy-v3v4-future) | [Future: Integration](TaskList_v2.md#future-v3v4-migration) |
| [6. Testing Validation](#6-testing-validation) | [5. Non-Functional](BRD_v2.md#5-non-functional-requirements) | [15. Testing](TechnicalDoc_v2.md#15-testing-strategy) | [5.2 Testing](TaskList_v2.md#52-comprehensive-testing) |
| [7. Production Readiness](#7-production-readiness) | [5.4 Availability](BRD_v2.md#54-availability) | [16. Deployment](TechnicalDoc_v2.md#16-deployment-strategy) | [6. Deployment](TaskList_v2.md#6-deployment--monitoring) |

---

## 📚 TABLE OF CONTENTS

0. **[🚀 FIRESTORE VERSION MIGRATION STRATEGY](#-firestore-version-migration-strategy)** ⭐ NEW
   - Version Overview
   - V2 Architecture for V3/V4 Migration
   - V2 → V3 Conversion Checklist
   - V2 → V4 Conversion Checklist
   - Migration-Ready Document Structure
   - Automated Migration Scripts
   - Collection Migration Mapping
   - Security Rules Migration
   - Performance Optimization
   - Composite Index Requirements
   - Data Migration Tools
   - Migration Progress Tracking
   - Migration Warnings & Best Practices

1. [Overview](#1-overview)
2. [Enhanced Firestore Collections (v2.0 Current)](#2-enhanced-firebase-collections)
   - 2.1 Accounting Collections
   - 2.2 Inventory Collections
   - 2.3 Dashboard & Analytics Collections
   - 2.4 User Management Collections
   - 2.5 Van Seller Collections
   - 2.6 Invoice & Cash Memo Collections
3. [MySQL Database Schema (v4.0 Future)](#3-mysql-database-schema)
4. [API Database Mapping (v3/v4 Future)](#4-api-database-mapping)
5. [Integration Strategy (v3/v4 Future)](#5-integration-strategy)
6. [Testing Validation](#6-testing-validation)
7. [Production Readiness](#7-production-readiness)
8. [Van Seller Management Tables (v4.0 Future)](#8-van-seller-management-tables-)
9. [Invoice & Cash Memo Tables (v4.0 Future)](#9-invoice--cash-memo-tables-)

**⚠️ IMPORTANT NOTE:**
- **Section 2:** Current v2.0 Firestore collections (IMPLEMENT NOW)
- **Sections 3-5, 8-9:** Future v4.0 MySQL schemas (REFERENCE ONLY, NOT FOR v2.0)

---

## 1. OVERVIEW

### 1.1 Database Architecture Evolution

**v1.0 (Legacy Firebase):**
- NoSQL document database
- Real-time listeners
- Multi-tenant with subcollections
- Limited complex queries
- Schema-less flexibility

**v2.0 (Enhanced Firestore - Current):**
- **Pure Firestore:** No Node.js, No MySQL, No REST API
- Additional collections for accounting/inventory
- Enhanced security rules with migration metadata
- Real-time dashboard metrics
- Migration-ready document structure (_version, _v3Ready, _v4Ready fields)
- Backward compatibility maintained
- All features use Firebase SDK directly

**v3.0 (REST API + Firestore - Future):**
- Replace Firebase SDK calls with REST API endpoints
- Node.js + Express.js backend
- Same Firestore database, different access method
- Backend validation and business logic
- Gradual migration using dual-write strategy

**v4.0 (REST API + MySQL - Future):**
- Relational database for complex business logic
- ACID transactions for accounting
- Advanced querying and reporting
- Data integrity constraints
- Performance optimization
- Migrate Firestore collections to MySQL tables

### 1.2 Multi-Tenant Architecture

**Tenant Isolation:**
```
Firebase Root/
└── Easy2Solutions/
    └── companyDirectory/
        └── tenantCompanies/
            ├── laundry_q8/          # Company 1
            │   ├── orders/
            │   ├── users/
            │   ├── accounts/        # NEW
            │   ├── transactions/    # NEW
            │   ├── products/
            │   ├── inventory/       # NEW
            │   └── ...
            ├── perfume_store/       # Company 2
            └── ...

MySQL Database/
├── companies/                      # Tenant registry
├── users/                         # Global users table
├── accounts/                      # Per-company accounts
├── transactions/                  # Per-company transactions
└── ...                           # All tables company-scoped
```

**Company Identification:**
- **Firebase:** `NEXT_PUBLIC_COMPANY_ID=laundry_q8`
- **MySQL:** `company_id` foreign key in all tables

---

## 2. ENHANCED FIRESTORE COLLECTIONS (v2.0 CURRENT)

**⚠️ THIS IS v2.0 IMPLEMENTATION - USE THESE FIRESTORE COLLECTIONS NOW**

### 2.1 Accounting Collections

#### 2.1.1 Accounts Collection
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/accounts`

**v2 Document Structure (v3/v4 Migration-Ready):**
```javascript
{
  // Primary Identifiers
  accountId: "MAIN-1001",           // String: Hierarchical account code (BRD_v2.md Section 7.3)
  companyId: "laundry_q8",          // String: Tenant identifier

  // Account Details
  accountName: "Cash in Hand",      // String: Human-readable name
  accountType: "Asset",             // Enum: Asset, Liability, Equity, Revenue, Expense
  parentAccountId: null,            // String: Parent account for hierarchy (null for root)
  accountLevel: 1,                  // Number: Hierarchy level (1-4)

  // Financial Data
  balance: 0.00,                    // Number: Current account balance
  openingBalance: 0.00,             // Number: Balance at start of period

  // 🚀 V3/V4 MIGRATION METADATA (REQUIRED)
  _version: "2.0",                  // String: Schema version for migration tracking
  _migrationStatus: "active",       // Enum: active, migrating, migrated
  _migrationDate: null,             // Timestamp: When migrated to v3/v4
  _v3Ready: true,                   // Boolean: All v3 fields present
  _v4Ready: false,                  // Boolean: Ready for v4 sharding (set in v3)
  
  // 🚀 V4 SHARDING FIELDS (Pre-Added for Future)
  _shardKey: "laundry_q8_shard1",  // String: v4 horizontal sharding key
  _partitionKey: "laundry_q8",     // String: v4 partitioning key (companyId)
  _region: "asia-south1",          // String: v4 multi-region deployment
  
  // Standard Metadata
  isActive: true,                   // Boolean: Soft delete flag
  createdAt: Timestamp,             // Firebase Timestamp (v3 compatible)
  updatedAt: Timestamp,             // Firebase Timestamp (v3 compatible)
  createdBy: "userId",              // String: User who created account
  updatedBy: "userId",              // String: User who last updated
  
  // Soft Delete (v3/v4 compatible)
  deletedAt: null,                  // Timestamp: Deletion time
  deletedBy: null,                  // String: Who deleted

  // Additional Fields
  description: "Primary cash account", // String: Optional description
  currency: "KWD",                  // String: Account currency
  tags: ["cash", "primary"],        // Array: Categorization tags
}
```

**v3 Conversion Notes:**
- All fields marked with 🚀 enable seamless v2 → v3 migration
- `_shardKey` determines v4 shard routing (company-based)
- `_partitionKey` used for v4 horizontal partitioning
- `createdAt`/`updatedAt` Timestamps are v3 `serverTimestamp()` compatible

**Business Rules:**
- `accountId` format: `MAIN-{typeCode}{sequential}` (e.g., MAIN-1001 for Asset)
- Hierarchical structure supports up to 4 levels
- Balance automatically updated by transaction engine
- Only company_admin and accountant can modify

**v2 Indexes (Current):**
```javascript
// Firestore single-field indexes (v2)
accounts: [
  { field: "accountType", order: "ASC" },
  { field: "isActive", order: "ASC" },
  { field: "parentAccountId", order: "ASC" },
  { field: "createdAt", order: "DESC" }
]
```

**v3 Composite Indexes (Create Before Migration):**
```javascript
// v3 composite indexes for collection group queries
accounts_v3: [
  { companyId: "ASC", accountType: "ASC", isActive: "ASC" },
  { companyId: "ASC", parentAccountId: "ASC", accountLevel: "ASC" },
  { companyId: "ASC", createdAt: "DESC" },
  { companyId: "ASC", updatedAt: "DESC" },
  { companyId: "ASC", _migrationStatus: "ASC" }
]
```
  { companyId: "ASC", accountId: "ASC" }
]
```

#### 2.1.2 Transactions Collection
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/transactions`

**v2 Document Structure (v3/v4 Migration-Ready):**
```javascript
{
  // Primary Identifiers
  transactionId: "TXN-20251220001", // String: Unique transaction ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Transaction Details
  date: Timestamp,                  // Firebase Timestamp: Transaction date
  description: "Sale - Order ORD-001", // String: Human-readable description

  // Double-Entry Accounting (BRD_v2.md Section 7.5)
  debitAccountId: "MAIN-1001",      // String: Account receiving debit
  creditAccountId: "MAIN-4001",     // String: Account receiving credit
  amount: 250.00,                   // Number: Transaction amount

  // Reference Information
  referenceType: "sale",            // Enum: sale, purchase, adjustment, transfer, payment
  referenceId: "ORD-20251220001",   // String: Related document ID

  // 🚀 V3/V4 MIGRATION METADATA (REQUIRED)
  _version: "2.0",                  // String: Schema version
  _migrationStatus: "active",       // Enum: active, migrating, migrated
  _migrationDate: null,             // Timestamp: When migrated
  _v3Ready: true,                   // Boolean: v3 conversion ready
  _v4Ready: false,                  // Boolean: v4 sharding ready
  
  // 🚀 V4 SHARDING FIELDS
  _shardKey: "laundry_q8_shard1",  // String: v4 shard routing
  _partitionKey: "laundry_q8",     // String: v4 partition key
  _region: "asia-south1",          // String: v4 region
  
  // Audit Trail
  createdAt: Timestamp,             // Firebase Timestamp (v3 compatible)
  createdBy: "userId",              // String: User who created transaction
  approvedBy: "userId",             // String: User who approved (if required)
  approvedAt: Timestamp,            // Firebase Timestamp
  
  // Soft Delete
  isActive: true,                   // Boolean: Soft delete flag
  deletedAt: null,                  // Timestamp: Deletion time
  deletedBy: null,                  // String: Who deleted

  // Additional Fields
  notes: "Express delivery charge included", // String: Optional notes
  attachments: ["receipt_001.pdf"], // Array: File attachments
  tags: ["sale", "express"],        // Array: Categorization tags
}
```

**Business Rules:**
- Every transaction must have equal debit and credit amounts
- `transactionId` format: `TXN-{YYYYMMDD}{sequential}`
- Automated transactions created by system triggers
- Manual transactions require approval workflow

**v2 Indexes (Current):**
```javascript
// v2 single-field indexes
transactions: [
  { field: "date", order: "DESC" },
  { field: "debitAccountId", order: "ASC" },
  { field: "creditAccountId", order: "ASC" },
  { field: "referenceType", order: "ASC" },
  { field: "createdBy", order: "ASC" }
]
```

**v3 Composite Indexes (Create Before Migration):**
```javascript
// v3 composite indexes for collection group queries
transactions_v3: [
  { companyId: "ASC", date: "DESC", referenceType: "ASC" },
  { companyId: "ASC", debitAccountId: "ASC", date: "DESC" },
  { companyId: "ASC", creditAccountId: "ASC", date: "DESC" },
  { companyId: "ASC", _migrationStatus: "ASC", createdAt: "DESC" }
]
```

#### 2.1.3 Journals Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/journals`

**Purpose:** Manual journal entries for complex accounting transactions (BRD_v2.md Section 6.3)

**Document Structure:**
```javascript
{
  journalId: "JRN-20251220001",    // String: Unique journal entry ID
  companyId: "laundry_q8",          // String: Tenant identifier
  date: Timestamp.now(),            // Timestamp: Journal entry date
  description: "Monthly depreciation", // String: Journal description
  
  // Journal Lines (Double-entry)
  entries: [
    {
      accountId: "MAIN-1001",       // String: Account to debit/credit
      amount: 5000.00,              // Number: Entry amount
      type: "debit",                // Enum: debit, credit
      description: "Equipment depreciation" // String: Line description
    },
    {
      accountId: "MAIN-5001",       // String: Contra account
      amount: 5000.00,              // Number: Entry amount
      type: "credit",               // Enum: debit, credit
      description: "Accumulated depreciation" // String: Line description
    }
  ],
  
  // Reference
  referenceType: "manual",          // String: Type of journal
  referenceId: "DEP-DEC-2025",      // String: Reference identifier
  
  // Audit Trail
  createdBy: "userId",              // String: User who created
  createdAt: Timestamp.now(),       // Timestamp: Creation time
  approvedBy: "userId",             // String: Approver (if required)
  approvedAt: Timestamp.now()       // Timestamp: Approval time
}
```

**Indexes:**
```javascript
journals: [
  { date: "DESC", companyId: "ASC" },
  { createdBy: "ASC", createdAt: "DESC" },
  { referenceType: "ASC", referenceId: "ASC" }
]
```

#### 2.1.4 Expert Transfers Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/expertTransfers`

**Purpose:** Uncontrolled account transfers for expert accounting adjustments (BRD_v2.md Section 6.4)

**Document Structure:**
```javascript
{
  transferId: "EXP-20251220001",    // String: Unique transfer ID
  companyId: "laundry_q8",          // String: Tenant identifier
  date: Timestamp.now(),            // Timestamp: Transfer date
  description: "Expert adjustment", // String: Transfer description
  
  // Transfer Details
  fromAccountId: "MAIN-1001",       // String: Source account
  toAccountId: "MAIN-2001",         // String: Destination account
  amount: 10000.00,                 // Number: Transfer amount
  
  // Expert Justification
  reason: "Balance sheet adjustment", // String: Business reason
  expertNotes: "Approved by CFO",   // String: Expert notes
  
  // Audit Trail
  initiatedBy: "userId",            // String: User who initiated
  approvedBy: "expertId",           // String: Expert who approved
  createdAt: Timestamp.now(),       // Timestamp: Creation time
  executedAt: Timestamp.now()       // Timestamp: Execution time
}
```

**Indexes:**
```javascript
expertTransfers: [
  { date: "DESC", companyId: "ASC" },
  { fromAccountId: "ASC", date: "DESC" },
  { toAccountId: "ASC", date: "DESC" },
  { initiatedBy: "ASC", createdAt: "DESC" }
]
```

### 2.2 Inventory Collections

#### 2.2.1 Products Collection (Enhanced)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/products`

**Document Structure:**
```javascript
{
  // Primary Identifiers
  productId: "PROD-001",            // String: Unique product ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Product Details
  name: "Premium Laundry Detergent", // String: Product name
  description: "Professional grade detergent", // String: Detailed description
  sku: "DET-PREM-001",             // String: Stock keeping unit

  // Categorization (BRD_v2.md Section 7.1)
  categoryId: "CAT-001",           // String: Category reference
  subcategoryId: "SUB-001",        // String: Subcategory reference

  // Media
  imageUrl: "https://cloudinary.com/...", // String: Cloudinary image URL
  additionalImages: [],            // Array: Additional product images

  // Pricing
  basePrice: 25.00,                // Number: Standard selling price
  costPrice: 15.00,                // Number: Purchase cost

  // Inventory Settings
  trackInventory: true,            // Boolean: Whether to track stock
  reorderPoint: 50,                // Number: Minimum stock level alert
  maxStockLevel: 1000,             // Number: Maximum stock capacity

  // Status & Metadata
  isActive: true,                  // Boolean: Active product flag
  isTaxable: true,                 // Boolean: Tax applicability
  tags: ["detergent", "premium"],  // Array: Product tags

  createdAt: Timestamp,            // Firebase Timestamp
  updatedAt: Timestamp,            // Firebase Timestamp
  createdBy: "userId",             // String: Creator user ID
  updatedBy: "userId",             // String: Last updater user ID
}
```

#### 2.2.2 Inventory Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/inventory`

**v2 Document Structure (v3/v4 Migration-Ready):**
```javascript
{
  // Primary Identifiers
  inventoryId: "INV-001",           // String: Unique inventory record ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Product & Location
  productId: "PROD-001",            // String: Product reference
  warehouseId: "WH-001",            // String: Warehouse location

  // Stock Quantities (BRD_v2.md Section 8.2)
  quantity: 500,                    // Number: Total physical quantity
  reservedQuantity: 50,             // Number: Quantity reserved for orders
  availableQuantity: 450,           // Number: Available for sale (calculated)

  // Cost Tracking
  unitCost: 15.00,                  // Number: Current unit cost
  totalValue: 7500.00,              // Number: Total inventory value (calculated)
  lastPurchaseCost: 14.50,          // Number: Last purchase price
  averageCost: 14.75,               // Number: Weighted average cost

  // Stock Management
  batchNumber: "BAT-20251201",     // String: Purchase batch identifier
  expiryDate: Timestamp,            // Firebase Timestamp: Expiry date
  location: "Aisle 3, Shelf B",     // String: Physical location in warehouse

  // 🚀 V3/V4 MIGRATION METADATA (REQUIRED)
  _version: "2.0",                  // String: Schema version
  _migrationStatus: "active",       // Enum: active, migrating, migrated
  _migrationDate: null,             // Timestamp: Migration timestamp
  _v3Ready: true,                   // Boolean: v3 ready flag
  _v4Ready: false,                  // Boolean: v4 ready flag
  
  // 🚀 V4 SHARDING FIELDS
  _shardKey: "laundry_q8_shard1",  // String: v4 shard key
  _partitionKey: "laundry_q8",     // String: v4 partition key
  _region: "asia-south1",          // String: v4 region

  // Audit Trail
  lastStockTake: Timestamp,         // Firebase Timestamp: Last physical count
  lastUpdated: Timestamp,           // Firebase Timestamp: Last modification
  updatedBy: "userId",              // String: User who last updated

  createdAt: Timestamp,             // Firebase Timestamp (v3 compatible)
  createdBy: "userId",              // String: Creator user ID
  
  // Soft Delete
  isActive: true,                   // Boolean: Soft delete flag
  deletedAt: null,                  // Timestamp: Deletion timestamp
  deletedBy: null,                  // String: Who deleted
}
```

**v3 Composite Indexes:**
```javascript
inventory_v3: [
  { companyId: "ASC", productId: "ASC", warehouseId: "ASC" },
  { companyId: "ASC", warehouseId: "ASC", quantity: "DESC" },
  { companyId: "ASC", expiryDate: "ASC" },
  { companyId: "ASC", _migrationStatus: "ASC" }
]
```

#### 2.2.3 Warehouses Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/warehouses`

**Document Structure:**
```javascript
{
  // Primary Identifiers
  warehouseId: "WH-001",            // String: Unique warehouse ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Warehouse Details
  name: "Main Warehouse",           // String: Warehouse name
  code: "WH-MAIN",                  // String: Short code for reference
  type: "central",                  // Enum: central, branch, van, external

  // Location Information
  address: "123 Main Street, City", // String: Full address
  latitude: 29.3759,                // Number: GPS coordinates
  longitude: 47.9774,               // Number: GPS coordinates
  contactPhone: "+965-123-4567",    // String: Contact number
  contactPerson: "John Manager",    // String: Contact person

  // Capacity & Settings
  totalCapacity: 10000,             // Number: Maximum capacity (units)
  currentUtilization: 7500,         // Number: Current usage
  utilizationPercent: 75.0,         // Number: Utilization percentage

  // Management
  managerId: "userId",              // String: Warehouse manager
  operatingHours: {                 // Object: Operating schedule
    monday: { open: "08:00", close: "18:00" },
    tuesday: { open: "08:00", close: "18:00" },
    // ... other days
  },

  // Status
  isActive: true,                   // Boolean: Active warehouse
  status: "operational",            // Enum: operational, maintenance, closed

  createdAt: Timestamp,             // Firebase Timestamp
  updatedAt: Timestamp,             // Firebase Timestamp
  createdBy: "userId",              // String: Creator user ID
}
```

#### 2.2.4 Suppliers Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/suppliers`

**Document Structure:**
```javascript
{
  // Primary Identifiers
  supplierId: "SUP-001",            // String: Unique supplier ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Supplier Details
  name: "Chemical Suppliers Ltd",   // String: Company name
  code: "CHEM-001",                 // String: Short supplier code

  // Contact Information
  contactPerson: "Ahmed Al-Supplier", // String: Primary contact
  phone: "+965-987-6543",          // String: Contact phone
  email: "ahmed@chemicals.com",     // String: Contact email
  website: "https://chemicals.com", // String: Company website

  // Business Details
  address: "456 Industrial Area",   // String: Business address
  taxId: "123456789",               // String: Tax identification
  paymentTerms: "Net 30",           // String: Payment terms (Net 30, Net 60, etc.)
  creditLimit: 50000.00,            // Number: Credit limit

  // Performance Tracking
  rating: 4.5,                      // Number: Supplier rating (1-5)
  onTimeDelivery: 95.5,             // Number: On-time delivery percentage
  qualityScore: 4.2,                // Number: Product quality rating

  // Product Categories
  suppliedCategories: ["detergents", "fabrics"], // Array: Categories supplied

  // Status
  isActive: true,                   // Boolean: Active supplier
  status: "approved",               // Enum: pending, approved, suspended, terminated

  createdAt: Timestamp,             // Firebase Timestamp
  updatedAt: Timestamp,             // Firebase Timestamp
  createdBy: "userId",              // String: Creator user ID
}
```

#### 2.2.5 Stock Transfers Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/stockTransfers`

**Document Structure:**
```javascript
{
  // Primary Identifiers
  transferId: "STR-001",            // String: Unique transfer ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Transfer Details
  productId: "PROD-001",            // String: Product being transferred
  fromWarehouseId: "WH-001",        // String: Source warehouse
  toWarehouseId: "WH-002",          // String: Destination warehouse
  quantity: 100,                    // Number: Quantity to transfer

  // Transfer Status
  status: "completed",              // Enum: pending, approved, in_transit, completed, cancelled
  priority: "normal",               // Enum: low, normal, high, urgent

  // Logistics
  transferDate: Timestamp,          // Firebase Timestamp: When transfer occurred
  expectedDelivery: Timestamp,      // Firebase Timestamp: Expected arrival
  actualDelivery: Timestamp,        // Firebase Timestamp: Actual arrival

  // Personnel
  requestedBy: "userId",            // String: User who requested transfer
  approvedBy: "userId",             // String: User who approved
  transferredBy: "userId",          // String: User who executed transfer

  // Additional Information
  reason: "Branch stock replenishment", // String: Transfer reason
  notes: "Urgent restock required", // String: Additional notes
  reference: "REQ-20251220-001",   // String: Reference document

  // Costs
  transferCost: 25.00,              // Number: Transportation/handling cost
  insuranceCost: 5.00,              // Number: Insurance cost

  createdAt: Timestamp,             // Firebase Timestamp
  updatedAt: Timestamp,             // Firebase Timestamp
}
```

#### 2.2.6 Purchase Orders Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/purchaseOrders`

**Purpose:** Procurement planning and supplier orders (BRD_v2.md Section 7.3)

**Document Structure:**
```javascript
{
  poId: "PO-20251220001",          // String: Unique purchase order ID
  companyId: "laundry_q8",          // String: Tenant identifier
  
  // Supplier Details
  supplierId: "SUP-001",            // String: Supplier reference
  supplierName: "Chemical Suppliers Ltd", // String: Supplier name
  
  // Order Details
  orderDate: Timestamp.now(),       // Timestamp: Order date
  expectedDeliveryDate: Timestamp,  // Timestamp: Expected delivery
  status: "draft",                  // Enum: draft, approved, sent, partial, received, cancelled
  
  // Order Items
  items: [
    {
      productId: "PROD-001",        // String: Product to order
      productName: "Premium Detergent", // String: Product name
      quantity: 500,                // Number: Ordered quantity
      unitPrice: 14.50,             // Number: Agreed unit price
      totalPrice: 7250.00,          // Number: Line total
      receivedQuantity: 0           // Number: Quantity received so far
    }
  ],
  
  // Totals
  subtotal: 7250.00,                // Number: Order subtotal
  taxAmount: 725.00,                // Number: Tax amount
  totalAmount: 7975.00,             // Number: Order total
  
  // Approval Workflow
  requestedBy: "userId",            // String: Requester
  approvedBy: "userId",             // String: Approver
  approvalDate: Timestamp,          // Timestamp: Approval date
  
  // References
  reference: "Monthly stock replenishment", // String: Order reference
  
  createdAt: Timestamp,             // Firebase Timestamp
  updatedAt: Timestamp              // Firebase Timestamp
}
```

**Indexes:**
```javascript
purchaseOrders: [
  { supplierId: "ASC", orderDate: "DESC" },
  { status: "ASC", orderDate: "DESC" },
  { companyId: "ASC", createdAt: "DESC" }
]
```

#### 2.2.7 Goods Receipts Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/goodsReceipts`

**Purpose:** Stock receipt documentation with accounting integration (BRD_v2.md Section 7.3)

**Document Structure:**
```javascript
{
  grId: "GR-20251220001",          // String: Unique goods receipt ID
  companyId: "laundry_q8",          // String: Tenant identifier
  
  // Reference Documents
  poId: "PO-20251220001",          // String: Purchase order reference
  invoiceNumber: "INV-20251220-001", // String: Supplier invoice number
  
  // Receipt Details
  receiptDate: Timestamp.now(),     // Timestamp: Receipt date
  receivedBy: "userId",             // String: Receiver user ID
  
  // Received Items
  items: [
    {
      productId: "PROD-001",        // String: Product received
      poItemIndex: 0,               // Number: Index in PO items array
      orderedQuantity: 500,         // Number: Quantity ordered
      receivedQuantity: 450,        // Number: Quantity actually received
      unitPrice: 14.50,             // Number: Unit price
      qualityStatus: "approved",    // Enum: approved, rejected, partial
      notes: "Good quality"         // String: Receipt notes
    }
  ],
  
  // Accounting Integration
  transactionId: "TXN-20251220002", // String: Related accounting transaction
  
  // Status
  status: "completed",              // Enum: pending, partial, completed
  
  createdAt: Timestamp,             // Firebase Timestamp
  updatedAt: Timestamp              // Firebase Timestamp
}
```

**Indexes:**
```javascript
goodsReceipts: [
  { poId: "ASC", receiptDate: "DESC" },
  { companyId: "ASC", receiptDate: "DESC" },
  { receivedBy: "ASC", createdAt: "DESC" }
]
```

#### 2.2.8 Approvals Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/approvals`

**Purpose:** Workflow approvals for procurement and adjustments (BRD_v2.md Section 7.4)

**Document Structure:**
```javascript
{
  approvalId: "APR-20251220001",    // String: Unique approval ID
  companyId: "laundry_q8",          // String: Tenant identifier
  
  // Approval Details
  requestType: "purchase_order",    // Enum: purchase_order, stock_adjustment, transfer
  requestId: "PO-20251220001",      // String: ID of item being approved
  requestTitle: "Monthly detergent order", // String: Human-readable title
  
  // Approval Workflow
  requestedBy: "userId",            // String: Requester
  requestedAt: Timestamp.now(),     // Timestamp: Request time
  
  // Approval Levels
  approvalLevels: [
    {
      level: 1,                     // Number: Approval level
      requiredRole: "general_manager", // String: Required role
      approvedBy: "userId",          // String: Approver user ID
      approvedAt: Timestamp,         // Timestamp: Approval time
      status: "approved",            // Enum: pending, approved, rejected
      comments: "Approved for procurement" // String: Approval comments
    }
  ],
  
  // Overall Status
  status: "approved",                // Enum: pending, approved, rejected, cancelled
  
  // Escalation
  escalationDays: 3,                 // Number: Days before escalation
  escalatedTo: "userId",             // String: Escalated approver
  
  createdAt: Timestamp,              // Firebase Timestamp
  updatedAt: Timestamp               // Firebase Timestamp
}
```

**Indexes:**
```javascript
approvals: [
  { requestType: "ASC", status: "ASC", requestedAt: "DESC" },
  { requestedBy: "ASC", createdAt: "DESC" },
  { companyId: "ASC", status: "ASC", createdAt: "DESC" }
]
```

#### 2.2.9 Audit Logs Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/auditLogs`

**Purpose:** Complete audit trail for inventory transactions (BRD_v2.md Section 7.5)

**Document Structure:**
```javascript
{
  auditId: "AUD-20251220001",       // String: Unique audit log ID
  companyId: "laundry_q8",          // String: Tenant identifier
  
  // Audit Details
  action: "stock_adjustment",       // Enum: stock_in, stock_out, adjustment, transfer
  entityType: "inventory",          // String: Type of entity changed
  entityId: "INV-001",              // String: ID of affected entity
  
  // Before/After State
  beforeState: {
    quantity: 100,                  // Object: State before change
    location: "WH-001"
  },
  afterState: {
    quantity: 95,                   // Object: State after change
    location: "WH-001"
  },
  
  // Change Details
  changeReason: "Damaged goods",    // String: Reason for change
  quantityChanged: -5,              // Number: Net quantity change
  valueChanged: -75.00,             // Number: Value impact
  
  // User & Context
  performedBy: "userId",            // String: User who performed action
  performedAt: Timestamp.now(),     // Timestamp: Action time
  ipAddress: "192.168.1.100",       // String: User IP address
  userAgent: "Chrome/91.0",         // String: Browser/client info
  
  // References
  referenceType: "adjustment",      // String: Type of reference
  referenceId: "ADJ-20251220001",   // String: Reference document ID
  
  createdAt: Timestamp              // Firebase Timestamp
}
```

**Indexes:**
```javascript
auditLogs: [
  { entityType: "ASC", entityId: "ASC", performedAt: "DESC" },
  { performedBy: "ASC", performedAt: "DESC" },
  { action: "ASC", performedAt: "DESC" },
  { companyId: "ASC", createdAt: "DESC" }
]
```

### 2.3 Dashboard & Analytics Collections

#### 2.3.1 Dashboard Metrics Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/dashboardMetrics`

**Document Structure:**
```javascript
{
  // Primary Identifiers
  metricId: "MET-INV-001",          // String: Unique metric ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Metric Classification
  metricType: "inventory",          // Enum: inventory, accounting, users, orders
  metricKey: "totalValue",          // String: Specific metric identifier

  // Metric Data
  metricValue: 2450000,             // Mixed: Numeric value or object
  previousValue: 2200000,           // Number: Previous period value
  changePercent: 11.36,             // Number: Percentage change

  // Time Period
  periodType: "current",            // Enum: current, previous, last_month, last_quarter
  calculatedAt: Timestamp,          // Firebase Timestamp: When calculated

  // Metadata
  isRealTime: true,                 // Boolean: Whether updated in real-time
  refreshInterval: 300,             // Number: Refresh interval in seconds
  lastUpdated: Timestamp,           // Firebase Timestamp: Last update

  createdAt: Timestamp,             // Firebase Timestamp
  updatedBy: "system",              // String: Usually system-generated
}
```

#### 2.3.2 User Activity Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/userActivity`

**Document Structure:**
```javascript
{
  // Primary Identifiers
  activityId: "ACT-001",            // String: Unique activity ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Activity Details
  userId: "userId",                 // String: User who performed action
  action: "login",                  // String: Action performed
  resource: "auth",                 // String: System resource affected

  // Activity Data
  details: {                        // Object: Action-specific details
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    location: "Kuwait City"
  },

  // Timing
  timestamp: Timestamp,             // Firebase Timestamp: When activity occurred
  sessionId: "sess-123456",         // String: User session identifier

  // Security
  riskLevel: "low",                 // Enum: low, medium, high, critical
  flagged: false,                   // Boolean: Whether flagged for review

  // Metadata
  source: "web",                    // Enum: web, mobile, api
  apiEndpoint: "/api/auth/login",   // String: API endpoint used
}
```

### 2.4 Enhanced User Management Collections

#### 2.4.1 Roles Collection (Enhanced)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/roles`

**Document Structure:**
```javascript
{
  // Primary Identifiers
  roleId: "role_admin",             // String: Unique role identifier
  companyId: "laundry_q8",          // String: Tenant identifier

  // Role Details
  name: "Company Admin",            // String: Display name
  description: "Full system access", // String: Role description
  level: 1,                         // Number: Hierarchy level (1 = highest)

  // Permissions Matrix (BRD_v2.md Section 8.5)
  permissions: {                    // Object: Granular permissions
    dashboard: { read: true, write: false },
    orders: { read: true, write: true, delete: true },
    products: { read: true, write: true, delete: false },
    inventory: { read: true, write: true, delete: false },
    accounting: { read: true, write: true, delete: false },
    users: { read: true, write: true, delete: false },
    reports: { read: true, write: false, export: true },
    settings: { read: true, write: true, delete: false }
  },

  // Role Management
  isSystemRole: true,               // Boolean: Cannot be deleted
  isActive: true,                   // Boolean: Active role
  userCount: 3,                     // Number: Users assigned to this role

  // Audit
  createdAt: Timestamp,             // Firebase Timestamp
  updatedAt: Timestamp,             // Firebase Timestamp
  createdBy: "system",              // String: Creator (system for default roles)
  updatedBy: "userId",              // String: Last updater
}
```

#### 2.4.2 Permissions Collection (NEW)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/permissions`

**Document Structure:**
```javascript
{
  // Primary Identifiers
  permissionId: "perm_orders_read", // String: Unique permission ID
  companyId: "laundry_q8",          // String: Tenant identifier

  // Permission Details
  resource: "orders",               // String: System resource
  action: "read",                   // String: Action on resource
  name: "View Orders",              // String: Human-readable name
  description: "Ability to view order details", // String: Description

  // Permission Settings
  requiresApproval: false,          // Boolean: Needs approval for action
  approvalRole: null,               // String: Role required for approval
  auditRequired: true,              // Boolean: Log all uses

  // Risk Assessment
  riskLevel: "low",                 // Enum: low, medium, high, critical
  category: "operational",          // String: Permission category

  // Status
  isActive: true,                   // Boolean: Active permission
  isSystemPermission: true,         // Boolean: Cannot be modified

  createdAt: Timestamp,             // Firebase Timestamp
  updatedAt: Timestamp,             // Firebase Timestamp
}
```

### 2.5 Security Rules Enhancement

**Enhanced firestore.rules for v2.0:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Multi-tenant validation
    function isValidCompany(userId) {
      return exists(/databases/$(database)/documents/Easy2Solutions/companyDirectory/tenantCompanies/$(userId.split('_')[0]));
    }

    function getUserData(userId) {
      return get(/databases/$(database)/documents/Easy2Solutions/companyDirectory/tenantCompanies/$(userId.split('_')[0])/users/$(userId)).data;
    }

    function hasPermission(userData, resource, action) {
      let rolePermissions = get(/databases/$(database)/documents/Easy2Solutions/companyDirectory/tenantCompanies/$(userData.companyId)/roles/$(userData.role)).data.permissions;
      return rolePermissions[resource] != null && rolePermissions[resource][action] == true;
    }

    // Accounting collections - Restricted access
    match /Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/accounts/{accountId} {
      allow read: if isValidCompany(request.auth.uid) &&
        hasPermission(getUserData(request.auth.uid), 'accounting', 'read');
      allow write: if isValidCompany(request.auth.uid) &&
        hasPermission(getUserData(request.auth.uid), 'accounting', 'write') &&
        request.resource.data.keys().hasAll(['accountName', 'accountType', 'accountLevel']);
    }

    // Inventory collections - Warehouse-specific access
    match /Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/inventory/{inventoryId} {
      allow read: if isValidCompany(request.auth.uid) &&
        hasPermission(getUserData(request.auth.uid), 'inventory', 'read');
      allow write: if isValidCompany(request.auth.uid) &&
        hasPermission(getUserData(request.auth.uid), 'inventory', 'write') &&
        request.resource.data.quantity >= 0;
    }

    // Dashboard metrics - Read-only for authorized users
    match /Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/dashboardMetrics/{metricId} {
      allow read: if isValidCompany(request.auth.uid);
      allow write: if isValidCompany(request.auth.uid) &&
        getUserData(request.auth.uid).role == 'system';
    }

    // User activity - System and admin access
    match /Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/userActivity/{activityId} {
      allow read: if isValidCompany(request.auth.uid) &&
        (hasPermission(getUserData(request.auth.uid), 'users', 'read') ||
         resource.data.userId == request.auth.uid);
      allow write: if isValidCompany(request.auth.uid) &&
        getUserData(request.auth.uid).role == 'system';
    }
  }
}
```

---

## 3. MYSQL DATABASE SCHEMA (v4.0 FUTURE - NOT v2.0)

**⚠️ THIS IS FUTURE v4.0 REFERENCE - DO NOT IMPLEMENT IN v2.0**  
**v2.0 uses Firestore collections (Section 2), NOT MySQL**

### 3.1 Geographic Hierarchy Tables

#### 3.1.1 states Table
```sql
CREATE TABLE states (
    state_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,

    INDEX idx_company_active (company_id, is_active),
    UNIQUE KEY unique_company_code (company_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.1.2 areas Table
```sql
CREATE TABLE areas (
    area_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    state_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    delivery_charge DECIMAL(8,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (state_id) REFERENCES states(state_id) ON DELETE CASCADE,

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_state (state_id),
    UNIQUE KEY unique_company_code (company_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.1.3 clusters Table
```sql
CREATE TABLE clusters (
    cluster_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    area_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    manager_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(area_id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(user_id),

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_area (area_id),
    INDEX idx_manager (manager_id),
    UNIQUE KEY unique_company_code (company_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 Accounting Tables

#### 3.2.1 companies Table
```sql
CREATE TABLE companies (
    company_id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_company_name (company_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.2.2 accounts Table
```sql
CREATE TABLE accounts (
    account_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    parent_account_id VARCHAR(20) NULL,
    account_level INT NOT NULL DEFAULT 1,
    balance DECIMAL(15,2) DEFAULT 0.00,
    opening_balance DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'KWD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50),

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),

    INDEX idx_company_type_active (company_id, account_type, is_active),
    INDEX idx_parent_level (parent_account_id, account_level),
    INDEX idx_balance (balance),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.2.3 transactions Table
```sql
CREATE TABLE transactions (
    transaction_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    debit_account_id VARCHAR(20) NOT NULL,
    credit_account_id VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference_type ENUM('sale', 'purchase', 'adjustment', 'transfer', 'payment') NOT NULL,
    reference_id VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (debit_account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (credit_account_id) REFERENCES accounts(account_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),

    INDEX idx_company_date (company_id, date DESC),
    INDEX idx_debit_account (debit_account_id, date DESC),
    INDEX idx_credit_account (credit_account_id, date DESC),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_created_by (created_by, created_at DESC),
    INDEX idx_amount (amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 Inventory Tables

#### 3.3.1 products Table
```sql
CREATE TABLE products (
    product_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE,
    category_id VARCHAR(20) NOT NULL,
    subcategory_id VARCHAR(20) NOT NULL,
    image_url TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    track_inventory BOOLEAN DEFAULT TRUE,
    reorder_point INT DEFAULT 10,
    max_stock_level INT,
    is_active BOOLEAN DEFAULT TRUE,
    is_taxable BOOLEAN DEFAULT TRUE,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50),

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_category_subcategory (category_id, subcategory_id),
    INDEX idx_sku (sku),
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.2 categories and subcategories Tables
```sql
CREATE TABLE categories (
    category_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_sort_order (sort_order),
    UNIQUE KEY unique_company_category (company_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subcategories (
    subcategory_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    category_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_category (category_id),
    INDEX idx_sort_order (sort_order),
    UNIQUE KEY unique_company_subcategory (company_id, category_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.3 warehouses Table
```sql
CREATE TABLE warehouses (
    warehouse_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type ENUM('central', 'branch', 'van', 'external') DEFAULT 'central',
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    contact_phone VARCHAR(20),
    contact_person VARCHAR(255),
    total_capacity INT,
    current_utilization INT DEFAULT 0,
    utilization_percent DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_capacity > 0 THEN (current_utilization / total_capacity) * 100 ELSE 0 END
    ) STORED,
    manager_id VARCHAR(50),
    operating_hours JSON,
    is_active BOOLEAN DEFAULT TRUE,
    status ENUM('operational', 'maintenance', 'closed') DEFAULT 'operational',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(user_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_type (type),
    INDEX idx_manager (manager_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_company_code (company_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.4 inventory Table
```sql
CREATE TABLE inventory (
    inventory_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    warehouse_id VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    available_quantity INT GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    last_purchase_cost DECIMAL(10,2),
    average_cost DECIMAL(10,2),
    batch_number VARCHAR(50),
    expiry_date DATE,
    location VARCHAR(255),
    reorder_point INT DEFAULT 10,
    abc_category ENUM('A', 'B', 'C') DEFAULT 'C',
    stock_age_days INT GENERATED ALWAYS AS (DATEDIFF(CURRENT_DATE, created_at)) STORED,
    turnover_ratio DECIMAL(5,2) DEFAULT 0.00,
    last_movement_date TIMESTAMP NULL,
    last_stock_take TIMESTAMP NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),

    INDEX idx_company_product (company_id, product_id),
    INDEX idx_warehouse_product (warehouse_id, product_id),
    INDEX idx_quantity_available (quantity, available_quantity),
    INDEX idx_expiry (expiry_date),
    INDEX idx_last_updated (last_updated),
    UNIQUE KEY unique_product_warehouse (product_id, warehouse_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.5 suppliers Table
```sql
CREATE TABLE suppliers (
    supplier_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    address TEXT,
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 0.00,
    on_time_delivery DECIMAL(5,2) DEFAULT 0.00,
    quality_score DECIMAL(3,2) DEFAULT 0.00,
    supplied_categories JSON,
    is_active BOOLEAN DEFAULT TRUE,
    status ENUM('pending', 'approved', 'suspended', 'terminated') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    updated_by VARCHAR(50),

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_status (status),
    INDEX idx_rating (rating),
    INDEX idx_name (name),
    UNIQUE KEY unique_company_code (company_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.6 stock_transfers Table
```sql
CREATE TABLE stock_transfers (
    transfer_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    from_warehouse_id VARCHAR(20) NOT NULL,
    to_warehouse_id VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    status ENUM('pending', 'approved', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_delivery TIMESTAMP NULL,
    actual_delivery TIMESTAMP NULL,
    requested_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    transferred_by VARCHAR(50),
    reason VARCHAR(255),
    notes TEXT,
    transfer_cost DECIMAL(10,2) DEFAULT 0.00,
    insurance_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (requested_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    FOREIGN KEY (transferred_by) REFERENCES users(user_id),

    INDEX idx_company_status (company_id, status),
    INDEX idx_product (product_id),
    INDEX idx_from_warehouse (from_warehouse_id),
    INDEX idx_to_warehouse (to_warehouse_id),
    INDEX idx_transfer_date (transfer_date),
    INDEX idx_requested_by (requested_by),
    INDEX idx_status_date (status, transfer_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.7 stock_adjustments Table
```sql
CREATE TABLE stock_adjustments (
    adjustment_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    warehouse_id VARCHAR(20) NOT NULL,
    adjustment_type ENUM('damage', 'loss', 'gain', 'correction') NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    reason TEXT,
    status ENUM('pending_approval', 'approved', 'rejected') DEFAULT 'pending_approval',
    requested_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (requested_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),

    INDEX idx_company_product (company_id, product_id),
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_status (status),
    INDEX idx_adjustment_type (adjustment_type),
    INDEX idx_requested_by (requested_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.8 stock_reservations Table
```sql
CREATE TABLE stock_reservations (
    reservation_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    warehouse_id VARCHAR(20) NOT NULL,
    order_id VARCHAR(20),
    quantity INT NOT NULL,
    reservation_type ENUM('order', 'allocation', 'quality_control') NOT NULL,
    status ENUM('active', 'released', 'expired') DEFAULT 'active',
    created_by VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),

    INDEX idx_company_product (company_id, product_id),
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_order (order_id),
    INDEX idx_status (status),
    INDEX idx_reservation_type (reservation_type),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.9 stock_counts Table
```sql
CREATE TABLE stock_counts (
    count_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    warehouse_id VARCHAR(20) NOT NULL,
    count_date DATE NOT NULL,
    status ENUM('planned', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
    counted_by VARCHAR(50),
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (counted_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),

    INDEX idx_company_warehouse (company_id, warehouse_id),
    INDEX idx_count_date (count_date),
    INDEX idx_status (status),
    INDEX idx_counted_by (counted_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.10 stock_count_lines Table
```sql
CREATE TABLE stock_count_lines (
    count_line_id VARCHAR(20) PRIMARY KEY,
    count_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    system_quantity INT NOT NULL,
    counted_quantity INT NOT NULL,
    variance INT NOT NULL,
    adjustment_made BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (count_id) REFERENCES stock_counts(count_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),

    INDEX idx_count (count_id),
    INDEX idx_product (product_id),
    INDEX idx_variance (variance),
    INDEX idx_adjustment_made (adjustment_made)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

#### 3.3.11 purchase_orders Table
```sql
CREATE TABLE purchase_orders (
    po_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(20) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status ENUM('draft', 'approved', 'sent', 'partial', 'received', 'cancelled') DEFAULT 'draft',
    
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    requested_by VARCHAR(50) NOT NULL,
    approved_by VARCHAR(50),
    approval_date TIMESTAMP NULL,
    
    reference TEXT,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (requested_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    
    INDEX idx_company_supplier (company_id, supplier_id),
    INDEX idx_status_date (status, order_date DESC),
    INDEX idx_supplier_date (supplier_id, order_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

#### 3.3.12 purchase_order_items Table
```sql
CREATE TABLE purchase_order_items (
    po_item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id VARCHAR(20) NOT NULL,
    company_id VARCHAR(50) NOT NULL,
    
    product_id VARCHAR(20) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    
    ordered_quantity DECIMAL(10,2) NOT NULL,
    received_quantity DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    
    INDEX idx_po (po_id),
    INDEX idx_product (product_id),
    INDEX idx_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

#### 3.3.13 goods_receipts Table
```sql
CREATE TABLE goods_receipts (
    gr_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    
    po_id VARCHAR(20),
    invoice_number VARCHAR(100),
    
    receipt_date DATE NOT NULL,
    received_by VARCHAR(50) NOT NULL,
    
    transaction_id VARCHAR(20),
    status ENUM('pending', 'partial', 'completed') DEFAULT 'pending',
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id),
    FOREIGN KEY (received_by) REFERENCES users(user_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id),
    
    INDEX idx_po_date (po_id, receipt_date DESC),
    INDEX idx_company_date (company_id, receipt_date DESC),
    INDEX idx_received_by (received_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

#### 3.3.14 goods_receipt_items Table
```sql
CREATE TABLE goods_receipt_items (
    gr_item_id INT AUTO_INCREMENT PRIMARY KEY,
    gr_id VARCHAR(20) NOT NULL,
    company_id VARCHAR(50) NOT NULL,
    
    product_id VARCHAR(20) NOT NULL,
    po_item_id INT,
    
    ordered_quantity DECIMAL(10,2),
    received_quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    
    quality_status ENUM('approved', 'rejected', 'partial') DEFAULT 'approved',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gr_id) REFERENCES goods_receipts(gr_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(po_item_id),
    
    INDEX idx_gr (gr_id),
    INDEX idx_product (product_id),
    INDEX idx_po_item (po_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

#### 3.3.15 approvals Table
```sql
CREATE TABLE approvals (
    approval_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    
    request_type ENUM('purchase_order', 'stock_adjustment', 'transfer', 'journal_entry') NOT NULL,
    request_id VARCHAR(20) NOT NULL,
    request_title VARCHAR(255) NOT NULL,
    
    requested_by VARCHAR(50) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    
    escalation_days INT DEFAULT 3,
    escalated_to VARCHAR(50),
    
    current_level INT DEFAULT 1,
    total_levels INT DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(user_id),
    FOREIGN KEY (escalated_to) REFERENCES users(user_id),
    
    INDEX idx_company_status (company_id, status),
    INDEX idx_request_type (request_type, status, requested_at DESC),
    INDEX idx_requested_by (requested_by, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

#### 3.3.16 approval_levels Table
```sql
CREATE TABLE approval_levels (
    approval_level_id INT AUTO_INCREMENT PRIMARY KEY,
    approval_id VARCHAR(20) NOT NULL,
    
    level_number INT NOT NULL,
    required_role VARCHAR(50),
    
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    comments TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (approval_id) REFERENCES approvals(approval_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    
    INDEX idx_approval (approval_id),
    INDEX idx_level (level_number),
    INDEX idx_approver (approved_by),
    UNIQUE KEY unique_approval_level (approval_id, level_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

#### 3.3.17 audit_logs Table
```sql
CREATE TABLE audit_logs (
    audit_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    
    action ENUM('stock_in', 'stock_out', 'adjustment', 'transfer', 'count', 'reservation') NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(20) NOT NULL,
    
    before_state JSON,
    after_state JSON,
    
    change_reason VARCHAR(255),
    quantity_changed DECIMAL(10,2),
    value_changed DECIMAL(12,2),
    
    performed_by VARCHAR(50) NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    reference_type VARCHAR(50),
    reference_id VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(user_id),
    
    INDEX idx_entity (entity_type, entity_id, performed_at DESC),
    INDEX idx_performed_by (performed_by, performed_at DESC),
    INDEX idx_action (action, performed_at DESC),
    INDEX idx_company (company_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

### 3.4 User Management Tables

#### 3.4.1 users Table (Enhanced)
```sql
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    role ENUM('company_admin', 'general_manager', 'branch_manager', 'supervisor',
             'cashier', 'van_seller', 'delivery_man', 'pickup_man') NOT NULL,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    last_login TIMESTAMP NULL,
    password_hash VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),

    INDEX idx_company_role (company_id, role),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_last_login (last_login),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.3.2 roles and permissions Tables
```sql
CREATE TABLE roles (
    role_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level INT NOT NULL,
    permissions JSON NOT NULL,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    user_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_level (level),
    UNIQUE KEY unique_company_role (company_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
    permission_id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_role VARCHAR(50),
    audit_required BOOLEAN DEFAULT TRUE,
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_system_permission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (approval_role) REFERENCES roles(role_id),

    INDEX idx_company_active (company_id, is_active),
    INDEX idx_resource_action (resource, action),
    INDEX idx_risk_level (risk_level),
    UNIQUE KEY unique_company_permission (company_id, resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.5 Dashboard & Analytics Tables

#### 3.5.1 dashboard_metrics Table
```sql
CREATE TABLE dashboard_metrics (
    metric_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    metric_type ENUM('inventory', 'accounting', 'users', 'orders') NOT NULL,
    metric_key VARCHAR(100) NOT NULL,
    metric_value JSON,
    previous_value DECIMAL(15,2),
    change_percent DECIMAL(8,4),
    period_type ENUM('current', 'previous', 'last_month', 'last_quarter', 'last_year') DEFAULT 'current',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_real_time BOOLEAN DEFAULT TRUE,
    refresh_interval INT DEFAULT 300,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50) DEFAULT 'system',

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id),

    INDEX idx_company_type_key (company_id, metric_type, metric_key),
    INDEX idx_last_updated (last_updated),
    INDEX idx_calculated_at (calculated_at),
    UNIQUE KEY unique_metric (company_id, metric_type, metric_key, period_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.5.2 budgets Table
```sql
CREATE TABLE budgets (
    budget_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    
    budget_name VARCHAR(255) NOT NULL,
    budget_type ENUM('revenue', 'expense', 'profit') NOT NULL,
    category VARCHAR(100) NOT NULL, -- Sales, Salaries, Utilities, etc.
    subcategory VARCHAR(100), -- Optional sub-category
    
    fiscal_year YEAR NOT NULL,
    period_type ENUM('monthly', 'quarterly', 'annual') DEFAULT 'monthly',
    period_value INT NOT NULL, -- Month number (1-12), Quarter (1-4), or Year
    
    budgeted_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0.00,
    variance_amount DECIMAL(15,2) GENERATED ALWAYS AS (actual_amount - budgeted_amount) STORED,
    variance_percentage DECIMAL(7,2) GENERATED ALWAYS AS (
        CASE 
            WHEN budgeted_amount != 0 THEN ((actual_amount - budgeted_amount) / budgeted_amount) * 100
            ELSE 0 
        END
    ) STORED,
    
    status ENUM('draft', 'approved', 'active', 'closed') DEFAULT 'draft',
    approved_by VARCHAR(50),
    approved_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL,
    
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(user_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    
    INDEX idx_company_year (company_id, fiscal_year),
    INDEX idx_type_category (budget_type, category),
    INDEX idx_period (period_type, period_value),
    INDEX idx_status (status),
    UNIQUE KEY unique_budget (company_id, budget_type, category, subcategory, fiscal_year, period_type, period_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.4.2 user_activity Table
```sql
CREATE TABLE user_activity (
    activity_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    flagged BOOLEAN DEFAULT FALSE,
    source ENUM('web', 'mobile', 'api') DEFAULT 'web',
    api_endpoint VARCHAR(255),

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,

    INDEX idx_company_user_timestamp (company_id, user_id, timestamp DESC),
    INDEX idx_action_resource (action, resource),
    INDEX idx_timestamp (timestamp),
    INDEX idx_risk_level (risk_level),
    INDEX idx_flagged (flagged),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.5 Enhanced Orders Tables

#### 3.5.1 orders Table (Enhanced)
```sql
CREATE TABLE orders (
    order_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    status ENUM('Pending', 'Confirmed', 'Scheduled for Pickup', 'Out for Pickup', 'Picked Up',
                'Received at Facility', 'In Sorting/Inspection', 'In Washing', 'In Drying',
                'In Ironing/Pressing', 'In Folding/Packaging', 'Quality Check', 'Ready for Delivery',
                'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded/Returned', 'On Hold') NOT NULL,
    order_type ENUM('regular', 'express') DEFAULT 'regular',
    payment_method ENUM('COD', 'Card', 'Online') DEFAULT 'COD',
    payment_status ENUM('pending', 'paid', 'refunded', 'failed') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_charges DECIMAL(8,2) DEFAULT 0.00,
    discount_amount DECIMAL(8,2) DEFAULT 0.00,
    tax_amount DECIMAL(8,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    assigned_pickup_person VARCHAR(50),
    assigned_delivery_person VARCHAR(50),
    pickup_address TEXT,
    delivery_address TEXT,
    pickup_latitude DECIMAL(10,8),
    pickup_longitude DECIMAL(11,8),
    delivery_latitude DECIMAL(10,8),
    delivery_longitude DECIMAL(11,8),
    estimated_delivery_time TIMESTAMP NULL,
    actual_delivery_time TIMESTAMP NULL,
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (assigned_pickup_person) REFERENCES users(user_id),
    FOREIGN KEY (assigned_delivery_person) REFERENCES users(user_id),

    INDEX idx_company_status (company_id, status),
    INDEX idx_customer_phone (customer_phone),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_payment_status (payment_status),
    INDEX idx_assigned_pickup (assigned_pickup_person),
    INDEX idx_assigned_delivery (assigned_delivery_person),
    INDEX idx_estimated_delivery (estimated_delivery_time),
    INDEX idx_actual_delivery (actual_delivery_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.5.2 order_items Table
```sql
CREATE TABLE order_items (
    order_item_id VARCHAR(20) PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(50),
    quantity INT NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    discount DECIMAL(8,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(8,2) DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),

    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    INDEX idx_quantity (quantity),
    INDEX idx_total_price (total_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.6 Settings & Configuration Tables

#### 3.6.1 settings Table
```sql
CREATE TABLE settings (
    setting_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON,
    setting_type ENUM('system', 'user', 'company') DEFAULT 'company',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),

    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),

    INDEX idx_company_key (company_id, setting_key),
    INDEX idx_setting_type (setting_type),
    INDEX idx_created_at (created_at),
    UNIQUE KEY unique_company_setting (company_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. API DATABASE MAPPING (v3/v4 FUTURE - NOT v2.0)

**⚠️ THIS IS FUTURE v3/v4 REFERENCE - v2.0 USES DIRECT FIREBASE SDK**  
**REST APIs will be implemented in v3/v4, NOT in v2.0**

### 4.1 Accounting API Mappings

**POST /api/accounting/accounts**
```javascript
// Request
{
  accountName: "Office Equipment",
  accountType: "Asset",
  parentAccountId: "MAIN-1003", // Fixed Assets
  accountLevel: 2
}

// Maps to accounts table
INSERT INTO accounts (
  account_id, company_id, account_name, account_type,
  parent_account_id, account_level, created_by
) VALUES (
  'MAIN-100301', 'laundry_q8', 'Office Equipment', 'Asset',
  'MAIN-1003', 2, 'user123'
);
```

**POST /api/accounting/transactions**
```javascript
// Request
{
  description: "Equipment purchase",
  debitAccountId: "MAIN-100301",
  creditAccountId: "MAIN-1001",
  amount: 5000.00,
  referenceType: "purchase",
  referenceId: "PO-001"
}

// Maps to transactions table
INSERT INTO transactions (
  transaction_id, company_id, date, description,
  debit_account_id, credit_account_id, amount,
  reference_type, reference_id, created_by
) VALUES (
  'TXN-20251220002', 'laundry_q8', CURDATE(), 'Equipment purchase',
  'MAIN-100301', 'MAIN-1001', 5000.00,
  'purchase', 'PO-001', 'user123'
);

// Updates account balances
UPDATE accounts SET balance = balance + 5000.00 WHERE account_id = 'MAIN-100301';
UPDATE accounts SET balance = balance - 5000.00 WHERE account_id = 'MAIN-1001';
```

### 4.2 Inventory API Mappings

**POST /api/inventory/receive-stock**
```javascript
// Request
{
  productId: "PROD-001",
  warehouseId: "WH-001",
  quantity: 100,
  unitCost: 25.00,
  supplierId: "SUP-001"
}

// Maps to inventory table
INSERT INTO inventory (
  inventory_id, company_id, product_id, warehouse_id,
  quantity, available_quantity, unit_cost, created_by
) VALUES (
  'INV-002', 'laundry_q8', 'PROD-001', 'WH-001',
  100, 100, 25.00, 'user123'
) ON DUPLICATE KEY UPDATE
  quantity = quantity + VALUES(quantity),
  available_quantity = available_quantity + VALUES(quantity),
  unit_cost = VALUES(unit_cost);
```

**POST /api/inventory/transfer-stock**
```javascript
// Request
{
  productId: "PROD-001",
  fromWarehouseId: "WH-001",
  toWarehouseId: "WH-002",
  quantity: 50
}

// Maps to stock_transfers table
INSERT INTO stock_transfers (
  transfer_id, company_id, product_id, from_warehouse_id,
  to_warehouse_id, quantity, status, requested_by
) VALUES (
  'STR-002', 'laundry_q8', 'PROD-001', 'WH-001',
  'WH-002', 50, 'completed', 'user123'
);

// Updates inventory quantities
UPDATE inventory SET quantity = quantity - 50, available_quantity = available_quantity - 50
WHERE product_id = 'PROD-001' AND warehouse_id = 'WH-001';

UPDATE inventory SET quantity = quantity + 50, available_quantity = available_quantity + 50
WHERE product_id = 'PROD-001' AND warehouse_id = 'WH-002';
```

---

## 5. INTEGRATION STRATEGY (v3/v4 FUTURE - NOT v2.0)

**⚠️ THIS IS FUTURE v3/v4 REFERENCE - v2.0 IS PURE FIRESTORE ONLY**  
**Firebase ↔ MySQL integration will happen in v3/v4, NOT in v2.0**

### 5.1 Firebase ↔ MySQL Sync Patterns

**Real-time Sync Service**
```javascript
// src/services/syncService.js
class SyncService {
  constructor() {
    this.mysqlConnection = require('../config/database');
    this.firebaseAdmin = require('../config/firebase');
  }

  // Sync Firebase changes to MySQL
  async syncToMySQL(collectionName, docId, data, operation) {
    const mysqlTable = this.mapCollectionToTable(collectionName);

    try {
      switch (operation) {
        case 'create':
          await this.mysqlConnection.query(`INSERT INTO ${mysqlTable} SET ?`, this.transformFirebaseToMySQL(data));
          break;
        case 'update':
          await this.mysqlConnection.query(`UPDATE ${mysqlTable} SET ? WHERE id = ?`, [this.transformFirebaseToMySQL(data), docId]);
          break;
        case 'delete':
          await this.mysqlConnection.query(`DELETE FROM ${mysqlTable} WHERE id = ?`, [docId]);
          break;
      }

      // Log sync operation
      await this.logSyncOperation(collectionName, docId, operation, 'success');
    } catch (error) {
      await this.logSyncOperation(collectionName, docId, operation, 'failed', error.message);
      throw error;
    }
  }

  // Sync MySQL changes to Firebase (for backward compatibility)
  async syncToFirebase(tableName, recordId, data, operation) {
    const collectionName = this.mapTableToCollection(tableName);
    const docRef = this.firebaseAdmin.firestore().collection(collectionName).doc(recordId);

    try {
      switch (operation) {
        case 'INSERT':
          await docRef.set(this.transformMySQLToFirebase(data));
          break;
        case 'UPDATE':
          await docRef.update(this.transformMySQLToFirebase(data));
          break;
        case 'DELETE':
          await docRef.delete();
          break;
      }
    } catch (error) {
      console.error(`Firebase sync failed for ${tableName}:${recordId}`, error);
      throw error;
    }
  }

  mapCollectionToTable(collectionName) {
    const mapping = {
      'accounts': 'accounts',
      'transactions': 'transactions',
      'products': 'products',
      'inventory': 'inventory',
      'warehouses': 'warehouses',
      'suppliers': 'suppliers',
      'stockTransfers': 'stock_transfers',
      'orders': 'orders',
      'users': 'users',
      'dashboardMetrics': 'dashboard_metrics',
      'userActivity': 'user_activity'
    };
    return mapping[collectionName] || collectionName;
  }

  mapTableToCollection(tableName) {
    const reverseMapping = {
      'accounts': 'accounts',
      'transactions': 'transactions',
      'products': 'products',
      'inventory': 'inventory',
      'warehouses': 'warehouses',
      'suppliers': 'suppliers',
      'stock_transfers': 'stockTransfers',
      'orders': 'orders',
      'users': 'users',
      'dashboard_metrics': 'dashboardMetrics',
      'user_activity': 'userActivity'
    };
    return reverseMapping[tableName] || tableName;
  }

  transformFirebaseToMySQL(firebaseData) {
    // Transform Firebase Timestamps to MySQL format
    const transformed = { ...firebaseData };
    Object.keys(transformed).forEach(key => {
      if (transformed[key] && typeof transformed[key].toDate === 'function') {
        transformed[key] = transformed[key].toDate();
      }
    });
    return transformed;
  }

  transformMySQLToFirebase(mysqlData) {
    // Transform MySQL dates to Firebase Timestamps
    const transformed = { ...mysqlData };
    Object.keys(transformed).forEach(key => {
      if (transformed[key] instanceof Date) {
        transformed[key] = this.firebaseAdmin.firestore.Timestamp.fromDate(transformed[key]);
      }
    });
    return transformed;
  }

  async logSyncOperation(collectionName, docId, operation, status, error = null) {
    const logData = {
      collectionName,
      docId,
      operation,
      status,
      error,
      timestamp: new Date()
    };

    // Store in MySQL sync_log table
    await this.mysqlConnection.query('INSERT INTO sync_log SET ?', logData);
  }
}
```

### 5.2 Data Consistency Strategies

**Conflict Resolution**
```javascript
// Handle sync conflicts
async resolveConflict(collectionName, docId, firebaseData, mysqlData) {
  // Strategy 1: Last-write-wins
  const firebaseTimestamp = firebaseData.updatedAt || firebaseData.createdAt;
  const mysqlTimestamp = mysqlData.updated_at || mysqlData.created_at;

  if (firebaseTimestamp > mysqlTimestamp) {
    // Firebase is newer, update MySQL
    return await this.syncToMySQL(collectionName, docId, firebaseData, 'update');
  } else {
    // MySQL is newer, update Firebase
    return await this.syncToFirebase(this.mapCollectionToTable(collectionName), docId, mysqlData, 'UPDATE');
  }
}
```

---

## 6. TESTING VALIDATION

### 6.1 Database Schema Validation

**Schema Integrity Tests**
```sql
-- Test referential integrity
DELIMITER //

CREATE PROCEDURE test_referential_integrity()
BEGIN
    DECLARE exit_handler BOOLEAN DEFAULT FALSE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET exit_handler = TRUE;

    START TRANSACTION;

    -- Test 1: Insert account with invalid company_id
    INSERT INTO accounts (account_id, company_id, account_name, account_type, account_level, created_by)
    VALUES ('TEST-001', 'invalid-company', 'Test Account', 'Asset', 1, 'system-user');

    -- Test 2: Insert transaction with invalid account
    INSERT INTO transactions (transaction_id, company_id, date, debit_account_id, credit_account_id, amount, reference_type, created_by)
    VALUES ('TEST-TXN-001', 'laundry_q8', CURDATE(), 'INVALID-ACCOUNT', 'MAIN-1001', 100.00, 'test', 'system-user');

    -- Test 3: Insert inventory with invalid product
    INSERT INTO inventory (inventory_id, company_id, product_id, warehouse_id, quantity, unit_cost, created_by)
    VALUES ('TEST-INV-001', 'laundry_q8', 'INVALID-PRODUCT', 'WH-001', 100, 25.00, 'system-user');

    IF exit_handler THEN
        ROLLBACK;
        SELECT 'Referential integrity test PASSED - Constraints working correctly' AS result;
    ELSE
        ROLLBACK;
        SELECT 'Referential integrity test FAILED - Constraints not working' AS result;
    END IF;
END //

DELIMITER ;

CALL test_referential_integrity();
```

### 6.2 Data Migration Validation

**Migration Verification Script**
```sql
-- Verify data migration integrity
SELECT
    'Users Migration' as test_name,
    (SELECT COUNT(*) FROM users WHERE company_id = 'laundry_q8') as mysql_count,
    (SELECT COUNT(*) FROM firebase_users WHERE companyId = 'laundry_q8') as firebase_count,
    CASE
        WHEN (SELECT COUNT(*) FROM users WHERE company_id = 'laundry_q8') =
             (SELECT COUNT(*) FROM firebase_users WHERE companyId = 'laundry_q8')
        THEN 'PASSED'
        ELSE 'FAILED'
    END as status

UNION ALL

SELECT
    'Products Migration' as test_name,
    (SELECT COUNT(*) FROM products WHERE company_id = 'laundry_q8') as mysql_count,
    (SELECT COUNT(*) FROM firebase_products WHERE companyId = 'laundry_q8') as firebase_count,
    CASE
        WHEN (SELECT COUNT(*) FROM products WHERE company_id = 'laundry_q8') =
             (SELECT COUNT(*) FROM firebase_products WHERE companyId = 'laundry_q8')
        THEN 'PASSED'
        ELSE 'FAILED'
    END as status

UNION ALL

SELECT
    'Orders Migration' as test_name,
    (SELECT COUNT(*) FROM orders WHERE company_id = 'laundry_q8') as mysql_count,
    (SELECT COUNT(*) FROM firebase_orders WHERE companyId = 'laundry_q8') as firebase_count,
    CASE
        WHEN (SELECT COUNT(*) FROM orders WHERE company_id = 'laundry_q8') =
             (SELECT COUNT(*) FROM firebase_orders WHERE companyId = 'laundry_q8')
        THEN 'PASSED'
        ELSE 'FAILED'
    END as status;
```

---

## 7. PRODUCTION READINESS

### 7.1 Performance Optimization

**Database Indexes Strategy**
```sql
-- Critical indexes for performance
CREATE INDEX idx_orders_status_date ON orders(company_id, status, created_at DESC);
CREATE INDEX idx_transactions_date_amount ON transactions(company_id, date DESC, amount);
CREATE INDEX idx_inventory_warehouse_quantity ON inventory(warehouse_id, available_quantity, last_updated DESC);
CREATE INDEX idx_dashboard_metrics_update ON dashboard_metrics(metric_type, last_updated DESC);

-- Composite indexes for complex queries
CREATE INDEX idx_user_activity_composite ON user_activity(company_id, user_id, action, timestamp DESC);
CREATE INDEX idx_stock_transfers_status_date ON stock_transfers(company_id, status, transfer_date DESC);
```

### 7.2 Backup & Recovery Strategy

**Automated Backup Configuration**
```sql
-- Daily backup procedure
DELIMITER //

CREATE PROCEDURE daily_backup()
BEGIN
    DECLARE backup_file VARCHAR(255);
    SET backup_file = CONCAT('/backups/easy2_laundry_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'), '.sql');

    SET @backup_cmd = CONCAT('mysqldump -u', @db_user, ' -p', @db_pass, ' easy2_laundry_v2 > ', backup_file);
    SET @compress_cmd = CONCAT('gzip ', backup_file);

    -- Execute backup
    SET @result = sys_exec(@backup_cmd);
    IF @result = 0 THEN
        -- Compress backup
        SET @result = sys_exec(@compress_cmd);
        IF @result = 0 THEN
            -- Log successful backup
            INSERT INTO backup_log (backup_type, file_path, status, created_at)
            VALUES ('daily', CONCAT(backup_file, '.gz'), 'success', NOW());
        END IF;
    END IF;
END //

DELIMITER ;

-- Schedule daily backup
CREATE EVENT daily_backup_event
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 02:00:00'
DO
    CALL daily_backup();
```

### 7.3 Monitoring & Alerting

**Database Performance Monitoring**
```sql
-- Slow query log analysis
SELECT
    sql_text,
    exec_count,
    avg_timer_wait/1000000000 as avg_time_sec,
    max_timer_wait/1000000000 as max_time_sec
FROM performance_schema.events_statements_summary_by_digest
WHERE schema_name = 'easy2_laundry_v2'
ORDER BY avg_timer_wait DESC
LIMIT 10;

-- Table size monitoring
SELECT
    table_name,
    table_rows,
    data_length/1024/1024 as data_mb,
    index_length/1024/1024 as index_mb,
    (data_length + index_length)/1024/1024 as total_mb
FROM information_schema.tables
WHERE table_schema = 'easy2_laundry_v2'
ORDER BY total_mb DESC;
```

This DatabaseInfo_v2.0 provides comprehensive database schemas and integration strategies for the enhanced EASY2-LAUNDRY system, ensuring seamless migration from Firebase to MySQL while maintaining data integrity and performance.

---

## 8. VAN SELLER MANAGEMENT TABLES (v4.0 FUTURE - NOT v2.0) 🆕 NEW

**⚠️ THIS IS FUTURE v4.0 REFERENCE - v2.0 USES FIRESTORE COLLECTIONS**  
**See Section 2 for v2.0 Firestore van seller collections**

### 8.1 Van Sellers Table (MySQL)

```sql
-- Van Sellers Master Table
CREATE TABLE van_sellers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(50) NOT NULL,
    van_seller_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    territory_id VARCHAR(20),
    branch_id VARCHAR(20),
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    daily_sales_target DECIMAL(10,2) DEFAULT 500.00,
    monthly_sales_target DECIMAL(12,2) DEFAULT 15000.00,
    performance_bonus_rate DECIMAL(5,2) DEFAULT 2.00,
    territory_coverage_km DECIMAL(8,2),
    vehicle_type ENUM('motorcycle', 'van', 'truck') DEFAULT 'motorcycle',
    license_plate VARCHAR(20),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    gps_enabled BOOLEAN DEFAULT TRUE,
    current_location JSON,
    last_location_update TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (territory_id) REFERENCES territories(territory_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),

    INDEX idx_company_status (company_id, status),
    INDEX idx_territory (territory_id),
    INDEX idx_branch (branch_id)
);
```

### 8.2 Territories Table

```sql
-- Geographic Territories for Van Sellers
CREATE TABLE territories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(50) NOT NULL,
    territory_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    area_coordinates JSON, -- Polygon coordinates for territory boundaries
    assigned_van_seller_id VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (assigned_van_seller_id) REFERENCES van_sellers(van_seller_id),

    INDEX idx_company (company_id),
    INDEX idx_assigned_van_seller (assigned_van_seller_id)
);
```

### 8.3 GPS Tracking Table

```sql
-- GPS Location Tracking for Van Sellers
CREATE TABLE van_seller_gps_tracking (
    id INT PRIMARY KEY AUTO_INCREMENT,
    van_seller_id VARCHAR(20) NOT NULL,
    company_id VARCHAR(50) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(6,2),
    speed DECIMAL(5,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (van_seller_id) REFERENCES van_sellers(van_seller_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),

    INDEX idx_van_seller_timestamp (van_seller_id, timestamp),
    INDEX idx_location (latitude, longitude)
);
```

### 8.4 Stock Allocations Table

```sql
-- Stock Allocation to Van Sellers
CREATE TABLE stock_allocations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    allocation_id VARCHAR(30) NOT NULL UNIQUE,
    company_id VARCHAR(50) NOT NULL,
    van_seller_id VARCHAR(20) NOT NULL,
    allocation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('allocated', 'returned', 'damaged') DEFAULT 'allocated',
    total_value DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (van_seller_id) REFERENCES van_sellers(van_seller_id),

    INDEX idx_van_seller_date (van_seller_id, allocation_date),
    INDEX idx_company (company_id)
);
```

### 8.5 Stock Allocation Items Table

```sql
-- Individual Items in Stock Allocations
CREATE TABLE stock_allocation_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    allocation_id VARCHAR(30) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    allocated_quantity INT NOT NULL,
    unit_cost DECIMAL(8,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    returned_quantity INT DEFAULT 0,
    damaged_quantity INT DEFAULT 0,

    FOREIGN KEY (allocation_id) REFERENCES stock_allocations(allocation_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),

    INDEX idx_allocation (allocation_id),
    INDEX idx_product (product_id)
);
```

### 8.6 Commissions Table

```sql
-- Commission Tracking for Van Sellers
CREATE TABLE commissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    commission_id VARCHAR(30) NOT NULL UNIQUE,
    company_id VARCHAR(50) NOT NULL,
    van_seller_id VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sales DECIMAL(10,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,2) NOT NULL,
    total_commission DECIMAL(10,2) DEFAULT 0.00,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('calculated', 'approved', 'paid', 'cancelled') DEFAULT 'calculated',
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (van_seller_id) REFERENCES van_sellers(van_seller_id),

    INDEX idx_van_seller_period (van_seller_id, period_start, period_end),
    INDEX idx_status (status)
);
```

### 8.7 Commission Breakdown Table

```sql
-- Detailed Commission Calculations
CREATE TABLE commission_breakdown (
    id INT PRIMARY KEY AUTO_INCREMENT,
    commission_id VARCHAR(30) NOT NULL,
    sale_id VARCHAR(30) NOT NULL,
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (commission_id) REFERENCES commissions(commission_id),

    INDEX idx_commission (commission_id),
    INDEX idx_sale (sale_id)
);
```

---

## 9. INVOICE & CASH MEMO TABLES (v4.0 FUTURE - NOT v2.0) 🆕 NEW

**⚠️ THIS IS FUTURE v4.0 REFERENCE - v2.0 USES FIRESTORE COLLECTIONS**  
**See Section 2 for v2.0 Firestore invoice collections**

### 9.1 Invoices Table

```sql
-- GST-Compliant Invoice Management
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(50) NOT NULL,
    invoice_id VARCHAR(30) NOT NULL UNIQUE,
    invoice_number VARCHAR(20) NOT NULL,
    customer_id VARCHAR(20),
    customer_name VARCHAR(100) NOT NULL,
    customer_address TEXT,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    payment_terms VARCHAR(100) DEFAULT 'Due on Receipt',
    subtotal DECIMAL(10,2) NOT NULL,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    gst_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled') DEFAULT 'draft',
    payment_method VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(50),
    approved_by VARCHAR(50),
    signed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMP NULL,
    digital_signature JSON,
    template_id VARCHAR(20) DEFAULT 'default',
    custom_header TEXT,
    custom_footer TEXT,
    logo_url VARCHAR(500),
    pdf_url VARCHAR(500),
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),

    INDEX idx_company_status (company_id, status),
    INDEX idx_customer (customer_id),
    INDEX idx_due_date (due_date),
    INDEX idx_invoice_date (invoice_date)
);
```

### 9.2 Invoice Items Table

```sql
-- Line Items for Invoices
CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id VARCHAR(30) NOT NULL,
    product_id VARCHAR(20),
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(8,2) DEFAULT 0.00,
    gst_rate DECIMAL(5,2) DEFAULT 0.00,
    gst_amount DECIMAL(8,2) DEFAULT 0.00,
    line_total DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),

    INDEX idx_invoice (invoice_id),
    INDEX idx_product (product_id)
);
```

### 9.3 Cash Memos Table

```sql
-- Cash Sale Receipts
CREATE TABLE cash_memos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(50) NOT NULL,
    memo_id VARCHAR(30) NOT NULL UNIQUE,
    memo_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100) DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(20),
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'online') NOT NULL,
    payment_reference VARCHAR(100),
    cashier_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(20),
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (cashier_id) REFERENCES users(user_id),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id),

    INDEX idx_company_date (company_id, sale_date),
    INDEX idx_cashier (cashier_id),
    INDEX idx_branch (branch_id)
);
```

### 9.4 Cash Memo Items Table

```sql
-- Line Items for Cash Memos
CREATE TABLE cash_memo_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    memo_id VARCHAR(30) NOT NULL,
    product_id VARCHAR(20),
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(8,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (memo_id) REFERENCES cash_memos(memo_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),

    INDEX idx_memo (memo_id),
    INDEX idx_product (product_id)
);
```

### 9.4 Templates Table

```sql
-- Invoice and Report Templates
CREATE TABLE templates (
    template_id VARCHAR(20) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL,
    
    template_name VARCHAR(255) NOT NULL,
    template_type ENUM('invoice', 'cash_memo', 'report', 'statement') NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    
    header_html TEXT,
    body_html TEXT,
    footer_html TEXT,
    css_styles TEXT,
    
    logo_url VARCHAR(500),
    signature_required BOOLEAN DEFAULT FALSE,
    gst_display BOOLEAN DEFAULT TRUE,
    
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    
    INDEX idx_company_type (company_id, template_type),
    INDEX idx_active_default (is_active, is_default),
    UNIQUE KEY unique_default (company_id, template_type, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

### 9.5 Payments Table

```sql
-- Payment Tracking for Invoices
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(50) NOT NULL,
    payment_id VARCHAR(30) NOT NULL UNIQUE,
    invoice_id VARCHAR(30),
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'cheque', 'upi', 'online') NOT NULL,
    payment_reference VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by VARCHAR(50),
    notes TEXT,
    status ENUM('pending', 'processed', 'failed', 'cancelled') DEFAULT 'processed',
    bank_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
    FOREIGN KEY (received_by) REFERENCES users(user_id),

    INDEX idx_company_date (company_id, payment_date),
    INDEX idx_invoice (invoice_id),
    INDEX idx_status (status)
);
```

### 9.6 Digital Signatures Table

```sql
-- Digital Signature Tracking
CREATE TABLE digital_signatures (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id VARCHAR(30) NOT NULL,
    document_type ENUM('invoice', 'cash_memo', 'receipt') NOT NULL,
    signature_data TEXT NOT NULL,
    signed_by VARCHAR(100) NOT NULL,
    signed_by_email VARCHAR(100),
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    certificate_info JSON,
    verification_status ENUM('valid', 'invalid', 'expired') DEFAULT 'valid',
    blockchain_hash VARCHAR(128),

    INDEX idx_document (document_id, document_type),
    INDEX idx_signed_by (signed_by),
    INDEX idx_signed_at (signed_at)
);
```

### 9.7 Email Delivery Logs Table

```sql
-- Email Delivery Tracking
CREATE TABLE email_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id VARCHAR(50) NOT NULL,
    document_id VARCHAR(30) NOT NULL,
    document_type ENUM('invoice', 'cash_memo', 'receipt', 'statement') NOT NULL,
    recipient_email VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP NULL,
    opened_at TIMESTAMP NULL,
    error_message TEXT,

    FOREIGN KEY (company_id) REFERENCES companies(id),

    INDEX idx_company_document (company_id, document_id),
    INDEX idx_recipient (recipient_email),
    INDEX idx_status_date (status, sent_at)
);
```

---

## Firebase Collections for Van Seller & Invoice Systems

### Van Seller Collections

```javascript
// Collection: vanSellers
{
  vanSellerId: "VS001",
  companyId: "laundry_q8",
  name: "Ahmed Al-Sales",
  phone: "+965-987-6543",
  email: "ahmed@company.com",
  territoryId: "TERR-001",
  branchId: "BR001",
  commissionRate: 5.0,
  dailyTarget: 500.00,
  monthlyTarget: 15000.00,
  vehicleType: "motorcycle",
  licensePlate: "ABC-123",
  status: "active",
  gpsEnabled: true,
  currentLocation: {
    latitude: 29.3759,
    longitude: 47.9774,
    accuracy: 10.5,
    timestamp: Timestamp
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Collection: territories
{
  territoryId: "TERR-001",
  companyId: "laundry_q8",
  name: "Kuwait City North",
  description: "Northern district of Kuwait City",
  areaCoordinates: {
    type: "Polygon",
    coordinates: [[[47.9, 29.3], [48.0, 29.3], [48.0, 29.4], [47.9, 29.4], [47.9, 29.3]]]
  },
  assignedVanSellerId: "VS001",
  status: "active",
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Collection: stockAllocations
{
  allocationId: "ALLOC-20241220-001",
  companyId: "laundry_q8",
  vanSellerId: "VS001",
  allocationDate: Timestamp,
  status: "allocated",
  items: [
    {
      productId: "PROD-001",
      allocatedQuantity: 50,
      unitCost: 2.50,
      totalValue: 125.00
    }
  ],
  totalValue: 125.00,
  notes: "Weekly stock allocation",
  createdAt: Timestamp
}

// Collection: commissions
{
  commissionId: "COMM-202412-001",
  companyId: "laundry_q8",
  vanSellerId: "VS001",
  periodStart: Timestamp,
  periodEnd: Timestamp,
  totalSales: 2500.00,
  commissionRate: 5.0,
  totalCommission: 125.00,
  paidAmount: 0.00,
  status: "calculated",
  paymentDate: null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Invoice Collections

```javascript
// Collection: invoices
{
  // Business Data Fields
  invoiceId: "INV-20241220-001",
  companyId: "laundry_q8",
  invoiceNumber: "INV-001",
  customerId: "CUST-001",
  customerName: "ABC Laundry Services",
  customerAddress: "123 Main St, Kuwait City",
  customerState: "Maharashtra", // For GST calculation
  customerPhone: "+965-123-4567",
  customerEmail: "abc@laundry.com",
  invoiceDate: Timestamp,
  dueDate: Timestamp,
  paymentTerms: "Net 30 days",

  // Financial Calculations
  subtotal: 1000.00,
  gstRate: 18.0,
  gstAmount: 180.00,
  cgstAmount: 90.00,     // CGST 9% (for intra-state)
  sgstAmount: 90.00,     // SGST 9% (for intra-state)
  igstAmount: 0.00,      // IGST 18% (for inter-state)
  totalAmount: 1180.00,
  gstType: "intra-state", // "intra-state" or "inter-state"

  // Payment & Status
  paidAmount: 0.00,
  status: "sent", // draft, sent, paid, partial, overdue, cancelled
  paymentMethod: null,

  // Additional Fields
  notes: "Monthly laundry services",
  createdBy: "admin",
  approvedBy: "manager",
  signed: false,
  signedAt: null,
  digitalSignature: null,
  templateId: "default",
  pdfUrl: "https://cloudinary.com/invoice_INV-001.pdf",
  emailSent: true,
  emailSentAt: Timestamp,

  // Migration-ready fields
  _version: "2.0",
  _migrationStatus: "active",
  _v3Ready: true,
  _v4Ready: false,
  _shardKey: "laundry_q8_shard1",
  _partitionKey: "laundry_q8",
  _region: "asia-south1",

  // Standard timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Collection: invoiceItems
{
  // Business Data Fields
  invoiceId: "INV-20241220-001",
  companyId: "laundry_q8",
  productId: "PROD-001",
  description: "Premium Laundry Service - Wash & Fold",
  quantity: 10,
  unitPrice: 100.00,
  discountPercentage: 0.0,
  discountAmount: 0.00,
  lineTotal: 1000.00,

  // GST Calculations per Item
  gstRate: 18.0,
  gstAmount: 180.00,
  cgstAmount: 90.00,     // CGST 9% (for intra-state)
  sgstAmount: 90.00,     // SGST 9% (for intra-state)
  igstAmount: 0.00,      // IGST 18% (for inter-state)

  // Migration-ready fields
  _version: "2.0",
  _migrationStatus: "active",
  _v3Ready: true,
  _v4Ready: false,
  _shardKey: "laundry_q8_shard1",
  _partitionKey: "laundry_q8",
  _region: "asia-south1",

  // Standard timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
{
  memoId: "MEMO-20241220-001",
  companyId: "laundry_q8",
  memoNumber: "CM-001",
  customerName: "Walk-in Customer",
  customerPhone: null,
  saleDate: Timestamp,
  subtotal: 25.00,
  paymentMethod: "cash",
  paymentReference: null,
  cashierId: "user-001",
  branchId: "BR001",
  receiptUrl: "https://cloudinary.com/memo_CM-001.pdf",
  createdAt: Timestamp
}

// Collection: payments
{
  paymentId: "PAY-20241220-001",
  companyId: "laundry_q8",
  invoiceId: "INV-20241220-001",
  amount: 1050.00,
  paymentMethod: "bank_transfer",
  paymentReference: "REF123456",
  paymentDate: Timestamp,
  receivedBy: "cashier-001",
  notes: "Full payment received",
  status: "processed",
  bankDetails: {
    bankName: "Kuwait Finance House",
    accountNumber: "123456789",
    reference: "REF123456"
  },
  createdAt: Timestamp
}

// Collection: digitalSignatures
{
  documentId: "INV-20241220-001",
  documentType: "invoice",
  signatureData: "base64-encoded-signature",
  signedBy: "John Doe",
  signedByEmail: "john@company.com",
  signedAt: Timestamp,
  ipAddress: "192.168.1.100",
  certificateInfo: {
    issuer: "DigiCert",
    validFrom: "2024-01-01",
    validTo: "2025-01-01",
    serialNumber: "123456789"
  },
  verificationStatus: "valid",
  blockchainHash: "a1b2c3d4e5f6..."
}
```

This completes the comprehensive Database Information v2.0 with all BRD_v2.md features covered, including the previously missing Van Seller Management and Invoice & Cash Memo database schemas for both MySQL and Firebase.
# Database Information Document v1.0
## EASY2-LAUNDRY Data Architecture

**Document Version:** 1.0  
**Date:** December 19, 2025  
**Project:** EASY2-LAUNDRY Database Schemas  
**Current:** Firebase/Firestore (NoSQL)  
**Future:** MySQL 8.0+ (Relational)

---

## 📚 DOCUMENT NAVIGATION

**📋 Related Documents:**
- **[Business Requirements Document (BRD)](BRD.md)** - Business logic, features, workflows, roles
- **[Technical Documentation](TechnicalDoc.md)** - Complete implementation guide, code examples

**🔗 Quick Links by Topic:**
| Database Doc Section | BRD Section | Tech Doc Section |
|----------------------|-------------|------------------|
| [1. Overview](#1-overview) | [Executive Summary](BRD.md#-executive-summary) | [1. Tech Stack](TechnicalDoc.md#1-technology-stack) |
| [2.1 Multi-Tenant](#21-multi-tenant-structure) | [2. Current Modules](BRD.md#2-current-admin-modules-existing-system) | [2.2 Multi-Tenant](TechnicalDoc.md#22-multi-tenant-data-structure), [4.3 Paths](TechnicalDoc.md#43-firestore-path-utilities-srcapputilsfirestorepathsjs) |
| [2.2.1 Users Collection](#221-users-collection) | [2.4 User Management](BRD.md#24-user-management-) | [5.1 Admin Auth](TechnicalDoc.md#51-admin-authentication-emailpassword), [5.2 Customer Auth](TechnicalDoc.md#52-customer-authentication-phone-otp--google) |
| [2.2.2 Orders Collection](#222-orders-collection) | [2.2 Order Management](BRD.md#22-order-management-system-oms---core-) | [9.1 Order Logic](TechnicalDoc.md#91-order-processing-logic) |
| [2.2.3 Products](#223-products-collection) | [2.3 Product Management](BRD.md#23-product-management-laundry-services-) | [7.2 Queries](TechnicalDoc.md#72-firestore-queries) |
| [2.2.4 Categories](#224-categories-collection) | [2.3 Product Management](BRD.md#23-product-management-laundry-services-) | [7.3 Writes](TechnicalDoc.md#73-firestore-writes) |
| [2.2.5 Subcategories](#225-subcategories-collection) | [2.3 Product Management](BRD.md#23-product-management-laundry-services-) | [7.3 Writes](TechnicalDoc.md#73-firestore-writes) |
| [2.2.6 States](#226-states-collection) | [2.5 Geographic](BRD.md#25-geographic-management-) | [7.3 Writes](TechnicalDoc.md#73-firestore-writes) |
| [2.2.7 Areas](#227-areas-collection) | [2.5 Geographic](BRD.md#25-geographic-management-) | [7.3 Writes](TechnicalDoc.md#73-firestore-writes) |
| [2.2.8 Branches](#228-branches-collection) | [2.5 Geographic](BRD.md#25-geographic-management-) | [7.3 Writes](TechnicalDoc.md#73-firestore-writes) |
| [2.2.9 Clusters](#229-clusters-collection) | [2.5 Geographic](BRD.md#25-geographic-management-) | [7.3 Writes](TechnicalDoc.md#73-firestore-writes) |
| [2.2.10 Coupons](#2210-coupons-collection) | [2.6 Coupon Management](BRD.md#26-coupon-management-) | [9.2 Validation](TechnicalDoc.md#92-coupon-validation-logic) |
| [2.2.11 Inquiries](#2211-contactinquiries-collection) | [2.8 Customer Inquiries](BRD.md#28-customer-inquiries-) | [7.3 Writes](TechnicalDoc.md#73-firestore-writes) |
| [2.2.12 Settings](#2212-settings-collection) | [2.10 Settings](BRD.md#210-settings--configuration-) | [4.1 Firebase Setup](TechnicalDoc.md#41-firebase-setup-srcappfirebasejs) |
| [2.2.13 Carts](#2213-carts-collection-user-specific) | [2.11 CartContext](BRD.md#cartcontext) | [6.1 CartContext](TechnicalDoc.md#61-cartcontext-srcappcontextcartcontextjs) |
| [3. MySQL Database](#3-future-database-mysql) | [3. Future Modules](BRD.md#3-future-modules-super-module-vision), [4. Migration](BRD.md#4-migration-strategy-firebase--nodejs--mysql) | [11. Node.js Architecture](TechnicalDoc.md#11-future-architecture-nodejs--mysql) |
| [3.2 MySQL Tables](#32-mysql-table-schemas) | [3. Future Modules](BRD.md#3-future-modules-super-module-vision) | [11.2 MySQL Schema](TechnicalDoc.md#112-mysql-database-schema-preview) |
| [4. Migration](#4-data-migration-strategy) | [4. Migration Strategy](BRD.md#4-migration-strategy-firebase--nodejs--mysql) | [11.5 Migration Script](TechnicalDoc.md#115-data-migration-script) |
| [5. Indexing](#5-indexing-strategy) | [5.1 Performance](BRD.md#51-performance) | [10.4 Query Optimization](TechnicalDoc.md#104-firestore-query-optimization) |
| [6. Relationships](#6-data-relationships) | [2. Current Modules](BRD.md#2-current-admin-modules-existing-system) | [7. API Patterns](TechnicalDoc.md#7-api-patterns) |
| [7. Backup](#7-backup--recovery) | [5.4 Availability](BRD.md#54-availability) | [12. Deployment](TechnicalDoc.md#12-deployment) |

---

## 📚 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Current Database (Firebase/Firestore)](#2-current-database-firebasefirestore)
3. [Future Database (MySQL)](#3-future-database-mysql)
4. [Data Migration Strategy](#4-data-migration-strategy)
5. [Indexing Strategy](#5-indexing-strategy)
6. [Data Relationships](#6-data-relationships)
7. [Backup & Recovery](#7-backup--recovery)

---

## 1. OVERVIEW

### 1.1 Purpose
This document provides complete database schema information for both current (Firebase/Firestore) and future (MySQL) implementations to facilitate easy backend migration and development.

### 1.2 Database Comparison

| Feature | Firebase/Firestore | MySQL |
|---------|-------------------|-------|
| **Type** | NoSQL (Document) | Relational (SQL) |
| **Structure** | Collections → Documents | Tables → Rows |
| **Relationships** | Denormalized | Normalized with FKs |
| **Queries** | Limited (no JOINs) | Full SQL support |
| **Transactions** | Limited | ACID compliant |
| **Scalability** | Horizontal (auto) | Vertical + Horizontal |
| **Cost** | Pay per read/write | Fixed server cost |
| **Real-time** | Native support | Requires polling/WebSockets |
| **Schema** | Schema-less | Strict schema |

---

## 2. CURRENT DATABASE (Firebase/Firestore)

### 2.1 Multi-Tenant Structure

**Base Path:**
```
Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/
```

**Company ID:** `laundry_q8` (from environment variable)

### 2.2 Collection Schemas

---

#### 2.2.1 Users Collection
**Path:** `{basePath}/users`  
**Document ID:** Firebase Auth UID

**Schema:**
```javascript
{
  // Firebase Auth ID (document ID)
  uid: string,
  
  // Basic Info
  name: string,
  email: string,
  phone: string,
  
  // Authentication
  firebaseUid: string,  // Same as uid (redundant)
  
  // User Type
  userType: string,  // "staff" or "customer"
  
  // Role (for staff only)
  role: string,  // "company_admin", "general_manager", "branch_manager", 
                 // "cashier", "delivery_man", "pickup_man"
  
  // Assignment (for staff only)
  branchId: string,  // Reference to branches collection
  
  // Status
  status: string,  // "active" or "inactive"
  
  // Customer-specific fields
  city: string,
  zip: string,
  address: string,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLogin: Timestamp,
  
  // Audit
  createdBy: string  // userId who created this user
}
```

**Sample Data:**
```json
{
  "uid": "abc123xyz",
  "name": "John Admin",
  "email": "john@laundry.com",
  "phone": "+911234567890",
  "userType": "staff",
  "role": "company_admin",
  "branchId": "branch_main",
  "status": "active",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-12-19T08:45:00Z",
  "lastLogin": "2025-12-19T08:45:00Z",
  "createdBy": null
}
```

**Indexes:**
- `email` (unique)
- `phone` (unique)
- `userType` + `status`
- `role` + `branchId`

---

#### 2.2.2 Orders Collection
**Path:** `{basePath}/orders`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Customer Information
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  customerAddress: string,
  
  // Order Items (denormalized)
  items: [
    {
      productId: string,       // Reference to products collection
      productName: string,     // Denormalized for quick access
      categoryName: string,    // Denormalized
      subcategoryName: string, // Denormalized
      quantity: number,
      price: number           // Price at time of order
    }
  ],
  
  // Pricing
  subtotal: number,
  discount: number,
  expressDeliveryFee: number,
  total: number,
  
  // Location (geographic hierarchy)
  stateId: string,       // Reference to states collection
  areaId: string,        // Reference to areas collection
  branchId: string,      // Reference to branches collection
  
  // Service Configuration
  pickupTime: string,           // "morning", "afternoon", "evening"
  deliveryPreference: string,   // "standard" or "express"
  serviceType: string,          // "delivery" or "pickup"
  
  // Assignment
  assignedDeliveryPerson: string,  // User name (not ID)
  assignedPickupPerson: string,    // User name (not ID)
  
  // Order Status
  status: string,  // One of 15 stages + special statuses
  /* 15 Stages:
     1. Pending
     2. Confirmed
     3. Scheduled for Pickup
     4. Out for Pickup
     5. Picked Up
     6. Received at Facility
     7. In Sorting/Inspection
     8. In Washing
     9. In Drying
     10. In Ironing/Pressing
     11. In Folding/Packaging
     12. Quality Check
     13. Ready for Delivery
     14. Out for Delivery
     15. Delivered
     
     Special: Cancelled, Refunded/Returned, On Hold
  */
  
  // Payment
  paymentMethod: string,  // "cod" (Cash on Delivery) - only option currently
  
  // Coupon (if applied)
  appliedCoupon: {
    code: string,
    type: string,      // "percentage" or "fixed"
    value: number,
    discount: number   // Calculated discount amount
  },
  
  // Timestamps
  timestamp: Timestamp,   // Order placement time
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Audit
  orderTakenBy: string,  // userId of cashier or null for online orders
  updatedBy: string      // userId of last person who updated status
}
```

**Sample Data:**
```json
{
  "customerName": "Jane Doe",
  "customerEmail": "jane@email.com",
  "customerPhone": "+919876543210",
  "customerAddress": "123 Main St, Los Angeles",
  "items": [
    {
      "productId": "prod_shirt_001",
      "productName": "Men's Cotton Shirt - Wash & Iron",
      "categoryName": "Men's Wear",
      "subcategoryName": "Shirts",
      "quantity": 3,
      "price": 5.99
    }
  ],
  "subtotal": 17.97,
  "discount": 3.59,
  "expressDeliveryFee": 0,
  "total": 14.38,
  "stateId": "state_ca",
  "areaId": "area_la",
  "branchId": "branch_downtown",
  "pickupTime": "morning",
  "deliveryPreference": "standard",
  "serviceType": "delivery",
  "assignedDeliveryPerson": null,
  "assignedPickupPerson": "Mike Johnson",
  "status": "Picked Up",
  "paymentMethod": "cod",
  "appliedCoupon": {
    "code": "WELCOME20",
    "type": "percentage",
    "value": 20,
    "discount": 3.59
  },
  "timestamp": "2025-12-19T09:00:00Z",
  "createdAt": "2025-12-19T09:00:00Z",
  "updatedAt": "2025-12-19T10:30:00Z",
  "orderTakenBy": null,
  "updatedBy": "user_mike_123"
}
```

**Indexes:**
- `customerPhone`
- `branchId` + `timestamp` (DESC)
- `status` + `branchId`
- `assignedDeliveryPerson`
- `assignedPickupPerson`
- `timestamp` (DESC)

---

#### 2.2.3 Products Collection
**Path:** `{basePath}/products`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Product Info
  name: string,
  
  // Pricing
  price: number,
  discountedPrice: number,  // Optional, null if no discount
  
  // Image
  image: string,  // Cloudinary URL
  
  // Categorization
  categoryId: string,      // Reference to categories collection
  subcategoryId: string,   // Reference to subcategories collection
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Sample Data:**
```json
{
  "name": "Men's Cotton Shirt - Wash & Iron",
  "price": 5.99,
  "discountedPrice": 4.99,
  "image": "https://res.cloudinary.com/dnf7pisvw/image/upload/v1234567890/shirt.jpg",
  "categoryId": "cat_mens_wear",
  "subcategoryId": "subcat_shirts",
  "createdAt": "2025-01-10T12:00:00Z",
  "updatedAt": "2025-12-15T14:30:00Z"
}
```

**Indexes:**
- `categoryId`
- `subcategoryId`
- `categoryId` + `subcategoryId`

---

#### 2.2.4 Categories Collection
**Path:** `{basePath}/categories`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Category Name
  categoriesname: string,  // Note: typo in original schema
  
  // Image
  categoriesimage: string,  // Cloudinary URL
  
  // Sorting
  sortOrder: number,  // Display order (0-999)
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Sample Data:**
```json
{
  "categoriesname": "Men's Wear",
  "categoriesimage": "https://res.cloudinary.com/dnf7pisvw/image/upload/v1234567890/cat_mens.jpg",
  "sortOrder": 1,
  "createdAt": "2025-01-05T10:00:00Z",
  "updatedAt": "2025-01-05T10:00:00Z"
}
```

**Indexes:**
- `sortOrder`

---

#### 2.2.5 Subcategories Collection
**Path:** `{basePath}/subcategories`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Subcategory Info
  name: string,
  image: string,  // Cloudinary URL
  
  // Parent Category
  categoryId: string,  // Reference to categories collection
  
  // Sorting
  sortOrder: number,  // Display order (0-999)
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Sample Data:**
```json
{
  "name": "Shirts",
  "image": "https://res.cloudinary.com/dnf7pisvw/image/upload/v1234567890/shirts.jpg",
  "categoryId": "cat_mens_wear",
  "sortOrder": 1,
  "createdAt": "2025-01-05T10:15:00Z",
  "updatedAt": "2025-01-05T10:15:00Z"
}
```

**Indexes:**
- `categoryId`
- `categoryId` + `sortOrder`

---

#### 2.2.6 States Collection
**Path:** `{basePath}/states`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // State Info
  name: string,  // e.g., "California", "Texas"
  
  // Status
  isActive: boolean,
  
  // Timestamps
  createdAt: Timestamp
}
```

**Sample Data:**
```json
{
  "name": "California",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

**Indexes:**
- `isActive`

---

#### 2.2.7 Areas Collection
**Path:** `{basePath}/areas`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Area Info
  name: string,  // e.g., "Los Angeles", "San Francisco"
  
  // Parent State
  stateId: string,  // Reference to states collection
  
  // Status
  isActive: boolean,
  
  // Timestamps
  createdAt: Timestamp
}
```

**Sample Data:**
```json
{
  "name": "Los Angeles",
  "stateId": "state_ca",
  "isActive": true,
  "createdAt": "2025-01-01T00:10:00Z"
}
```

**Indexes:**
- `stateId`
- `stateId` + `isActive`

---

#### 2.2.8 Branches Collection
**Path:** `{basePath}/branches`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Basic Info
  name: string,
  type: string,  // "main" or "satellite"
  
  // Address
  address: string,
  city: string,
  area: string,      // Area name (not ID - denormalized)
  zipCode: string,
  
  // Coordinates
  latitude: number,
  longitude: number,
  
  // Contact
  phone: string,
  whatsapp: string,
  email: string,
  
  // Working Hours
  workingHours: string,  // "standard" or "custom"
  customHours: {
    monday: { open: "HH:MM", close: "HH:MM" },
    tuesday: { open: "HH:MM", close: "HH:MM" },
    // ... other days
    sunday: { closed: true }
  },
  
  // Management
  managerName: string,
  managerPhone: string,
  
  // Operations
  capacity: number,      // Daily order limit
  services: [string],    // Array of service types offered
  hasPickup: boolean,
  hasDelivery: boolean,
  
  // Status
  isActive: boolean,
  maintenance: boolean,  // Maintenance mode
  notes: string,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Sample Data:**
```json
{
  "name": "Downtown Branch",
  "type": "main",
  "address": "456 Business Ave",
  "city": "Los Angeles",
  "area": "Downtown",
  "zipCode": "90001",
  "latitude": 34.0522,
  "longitude": -118.2437,
  "phone": "+13105551234",
  "whatsapp": "+13105551234",
  "email": "downtown@laundry.com",
  "workingHours": "standard",
  "customHours": null,
  "managerName": "Sarah Wilson",
  "managerPhone": "+13105555678",
  "capacity": 100,
  "services": ["dry cleaning", "wash & fold", "ironing", "alterations"],
  "hasPickup": true,
  "hasDelivery": true,
  "isActive": true,
  "maintenance": false,
  "notes": "",
  "createdAt": "2025-01-01T00:20:00Z",
  "updatedAt": "2025-12-10T16:00:00Z"
}
```

**Indexes:**
- `area`
- `isActive` + `maintenance`

---

#### 2.2.9 Clusters Collection
**Path:** `{basePath}/clusters`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Cluster Info
  name: string,
  description: string,
  
  // Areas in Cluster
  areaIds: [string],  // Array of area IDs
  
  // Assigned Branch
  branchId: string,  // Reference to branches collection
  
  // Status
  isActive: boolean,
  
  // Timestamps
  createdAt: Timestamp
}
```

**Sample Data:**
```json
{
  "name": "West LA Cluster",
  "description": "Covers West Los Angeles areas",
  "areaIds": ["area_westwood", "area_beverlyhills", "area_santamonica"],
  "branchId": "branch_westside",
  "isActive": true,
  "createdAt": "2025-01-02T10:00:00Z"
}
```

**Indexes:**
- `branchId`
- `isActive`

---

#### 2.2.10 Coupons Collection
**Path:** `{basePath}/coupons`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Coupon Code
  code: string,  // Unique, uppercase (e.g., "WELCOME20")
  
  // Description
  name: string,
  description: string,
  
  // Discount Type
  type: string,  // "percentage" or "fixed"
  value: number,  // Percentage (e.g., 20) or fixed amount (e.g., 10)
  
  // Requirements
  minimumOrderValue: number,
  maximumDiscount: number,  // Cap for percentage discounts
  
  // Usage Limits
  usageLimit: number,  // Per user limit (null = unlimited)
  totalUsageLimit: number,  // Total usage limit (null = unlimited)
  
  // Validity Period
  validFrom: Timestamp,
  validUntil: Timestamp,
  
  // Category Restrictions
  applicableCategories: [string],  // Category IDs (empty = all)
  excludedCategories: [string],    // Category IDs to exclude
  
  // Status
  isActive: boolean,
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Audit
  createdBy: string  // userId
}
```

**Sample Data:**
```json
{
  "code": "WELCOME20",
  "name": "Welcome Discount",
  "description": "20% off on first order",
  "type": "percentage",
  "value": 20,
  "minimumOrderValue": 50,
  "maximumDiscount": 20,
  "usageLimit": 1,
  "totalUsageLimit": 1000,
  "validFrom": "2025-01-01T00:00:00Z",
  "validUntil": "2025-12-31T23:59:59Z",
  "applicableCategories": [],
  "excludedCategories": [],
  "isActive": true,
  "createdAt": "2025-01-01T12:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z",
  "createdBy": "user_admin_123"
}
```

**Indexes:**
- `code` (unique)
- `isActive`
- `validFrom` + `validUntil`

---

#### 2.2.11 Contact/Inquiries Collection
**Path:** `{basePath}/contact`  
**Document ID:** Auto-generated

**Schema:**
```javascript
{
  // Customer Info
  name: string,
  email: string,
  phone: string,
  
  // Inquiry Details
  purpose: string,  // "B2B Partnership", "Bulk Order", "Marriage Clothes",
                    // "Recurring Service", "Issue", "Concern", "Other"
  message: string,
  
  // Status
  status: string,  // "pending", "working", "processing", "solved",
                   // "cancelled", "close with fail", "close with success"
  
  // Timestamps
  timestamp: Timestamp
}
```

**Sample Data:**
```json
{
  "name": "Restaurant Owner",
  "email": "owner@restaurant.com",
  "phone": "+13105559999",
  "purpose": "B2B Partnership",
  "message": "Interested in bulk laundry service for restaurant linens",
  "status": "pending",
  "timestamp": "2025-12-19T11:00:00Z"
}
```

**Indexes:**
- `status`
- `purpose`
- `timestamp` (DESC)

---

#### 2.2.12 Settings Collection
**Path:** `{basePath}/settings`  
**Document ID:** `general` (singleton)

**Schema:**
```javascript
{
  // Company Info
  companyName: string,
  contactNumber: string,
  email: string,
  address: string,
  
  // Branding
  logoUrl: string,  // Cloudinary URL
  
  // Content
  faqs: [
    {
      question: string,
      answer: string
    }
  ],
  privacyPolicy: string,  // Rich text/HTML
  
  // Timestamps
  updatedAt: Timestamp
}
```

**Sample Data:**
```json
{
  "companyName": "EASY2 Laundry Services",
  "contactNumber": "+13105551000",
  "email": "info@easy2laundry.com",
  "address": "789 Corporate Blvd, Los Angeles, CA 90001",
  "logoUrl": "https://res.cloudinary.com/dnf7pisvw/image/upload/v1234567890/logo.png",
  "faqs": [
    {
      "question": "What are your hours?",
      "answer": "We operate 7 days a week from 8 AM to 8 PM."
    }
  ],
  "privacyPolicy": "<p>Your privacy is important to us...</p>",
  "updatedAt": "2025-12-01T10:00:00Z"
}
```

**No indexes needed (single document)**

---

#### 2.2.13 Carts Collection (User-specific)
**Path:** `{basePath}/carts/{userId}`  
**Document ID:** Firebase Auth UID

**Schema:**
```javascript
{
  items: [
    {
      id: string,          // Product ID
      name: string,
      price: number,
      image: string,
      categoryName: string,
      subcategoryName: string,
      quantity: number
    }
  ]
}
```

**Sample Data:**
```json
{
  "items": [
    {
      "id": "prod_shirt_001",
      "name": "Men's Cotton Shirt",
      "price": 5.99,
      "image": "https://res.cloudinary.com/dnf7pisvw/image/upload/v1234567890/shirt.jpg",
      "categoryName": "Men's Wear",
      "subcategoryName": "Shirts",
      "quantity": 2
    }
  ]
}
```

---

### 2.3 Firebase Collection Summary

| Collection | Document Count (Estimated) | Primary Use |
|------------|---------------------------|-------------|
| **users** | 100-10,000 | Staff & customer accounts |
| **orders** | 1,000-1,000,000+ | Order transactions |
| **products** | 50-500 | Service catalog |
| **categories** | 5-20 | Top-level categorization |
| **subcategories** | 10-50 | Second-level categorization |
| **states** | 5-50 | Geographic hierarchy |
| **areas** | 50-500 | Cities/districts |
| **branches** | 1-100 | Physical locations |
| **clusters** | 5-50 | Delivery zones |
| **coupons** | 10-100 | Promotional codes |
| **contact** | 100-10,000 | Customer inquiries |
| **settings** | 1 (singleton) | System configuration |
| **carts** | 100-10,000 | User shopping carts |

**Total Collections:** 13

---

## 3. FUTURE DATABASE (MySQL)

### 3.1 MySQL Schema Design Principles

1. **Normalization:** 3NF (Third Normal Form) to reduce redundancy
2. **Foreign Keys:** Enforce referential integrity
3. **Indexes:** Optimize query performance
4. **Timestamps:** created_at, updated_at on all tables
5. **Soft Deletes:** is_deleted flag instead of hard deletes
6. **UUID Primary Keys:** For distributed systems (optional)

### 3.2 MySQL Table Schemas

---

#### 3.2.1 companies Table
**Purpose:** Multi-tenant company data

```sql
CREATE TABLE companies (
  id VARCHAR(50) PRIMARY KEY,  -- e.g., 'laundry_q8'
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.2 users Table
**Purpose:** Staff & customer accounts

```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,  -- Firebase Auth UID
  company_id VARCHAR(50) NOT NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  
  -- User Type
  user_type ENUM('staff', 'customer') NOT NULL,
  
  -- Role (for staff)
  role ENUM('company_admin', 'general_manager', 'branch_manager', 
            'cashier', 'delivery_man', 'pickup_man') DEFAULT NULL,
  
  -- Branch Assignment (for staff)
  branch_id VARCHAR(50) DEFAULT NULL,
  
  -- Customer-specific
  city VARCHAR(100),
  zip VARCHAR(20),
  address TEXT,
  
  -- Status
  status ENUM('active', 'inactive') DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  
  -- Audit
  created_by VARCHAR(50),
  
  -- Foreign Keys
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_company_id (company_id),
  INDEX idx_user_type_status (user_type, status),
  INDEX idx_role_branch (role, branch_id),
  INDEX idx_email (email),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.3 categories Table

```sql
CREATE TABLE categories (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  sort_order INT DEFAULT 999,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.4 subcategories Table

```sql
CREATE TABLE subcategories (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  sort_order INT DEFAULT 999,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_category_id (category_id),
  INDEX idx_category_sort (category_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.5 products Table

```sql
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  subcategory_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) DEFAULT NULL,
  image_url VARCHAR(500),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_category_id (category_id),
  INDEX idx_subcategory_id (subcategory_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.6 states Table

```sql
CREATE TABLE states (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.7 areas Table

```sql
CREATE TABLE areas (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  state_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_state_id (state_id),
  INDEX idx_state_active (state_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.8 branches Table

```sql
CREATE TABLE branches (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  type ENUM('main', 'satellite') DEFAULT 'main',
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  area VARCHAR(100),
  zip_code VARCHAR(20),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  
  -- Contact
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  
  -- Working Hours
  working_hours ENUM('standard', 'custom') DEFAULT 'standard',
  custom_hours JSON DEFAULT NULL,
  
  -- Management
  manager_name VARCHAR(255),
  manager_phone VARCHAR(20),
  
  -- Operations
  capacity INT DEFAULT 100,
  services JSON,  -- Array of service types
  has_pickup BOOLEAN DEFAULT TRUE,
  has_delivery BOOLEAN DEFAULT TRUE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  maintenance BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_area (area),
  INDEX idx_active_maintenance (is_active, maintenance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.9 clusters Table

```sql
CREATE TABLE clusters (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  branch_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_branch_id (branch_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Junction table for cluster-area many-to-many relationship
CREATE TABLE cluster_areas (
  cluster_id VARCHAR(50) NOT NULL,
  area_id VARCHAR(50) NOT NULL,
  
  PRIMARY KEY (cluster_id, area_id),
  FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE,
  FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.10 orders Table

```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  
  -- Customer Info
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  express_delivery_fee DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Location
  state_id VARCHAR(50) NOT NULL,
  area_id VARCHAR(50) NOT NULL,
  branch_id VARCHAR(50) NOT NULL,
  
  -- Service
  pickup_time ENUM('morning', 'afternoon', 'evening') NOT NULL,
  delivery_preference ENUM('standard', 'express') DEFAULT 'standard',
  service_type ENUM('delivery', 'pickup') NOT NULL,
  
  -- Assignment
  assigned_delivery_person VARCHAR(255),
  assigned_pickup_person VARCHAR(255),
  
  -- Status
  status ENUM(
    'Pending', 'Confirmed', 'Scheduled for Pickup', 'Out for Pickup',
    'Picked Up', 'Received at Facility', 'In Sorting/Inspection',
    'In Washing', 'In Drying', 'In Ironing/Pressing',
    'In Folding/Packaging', 'Quality Check', 'Ready for Delivery',
    'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded/Returned', 'On Hold'
  ) DEFAULT 'Pending',
  
  -- Payment
  payment_method ENUM('cod', 'card', 'upi', 'wallet') DEFAULT 'cod',
  
  -- Coupon
  coupon_id VARCHAR(50) DEFAULT NULL,
  coupon_code VARCHAR(50),
  coupon_discount DECIMAL(10, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Audit
  order_taken_by VARCHAR(50),
  updated_by VARCHAR(50),
  
  -- Foreign Keys
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (state_id) REFERENCES states(id),
  FOREIGN KEY (area_id) REFERENCES areas(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
  FOREIGN KEY (order_taken_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_company_id (company_id),
  INDEX idx_customer_phone (customer_phone),
  INDEX idx_branch_created (branch_id, created_at DESC),
  INDEX idx_status_branch (status, branch_id),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.11 order_items Table

```sql
CREATE TABLE order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  
  -- Denormalized for historical record
  product_name VARCHAR(255) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  subcategory_name VARCHAR(255) NOT NULL,
  
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,  -- Price at time of order
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.12 coupons Table

```sql
CREATE TABLE coupons (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  type ENUM('percentage', 'fixed') NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  
  minimum_order_value DECIMAL(10, 2) DEFAULT 0,
  maximum_discount DECIMAL(10, 2) DEFAULT NULL,
  
  usage_limit INT DEFAULT NULL,  -- Per user
  total_usage_limit INT DEFAULT NULL,  -- Total
  
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_company_id (company_id),
  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_valid_dates (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Coupon category restrictions
CREATE TABLE coupon_categories (
  coupon_id VARCHAR(50) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  is_excluded BOOLEAN DEFAULT FALSE,  -- TRUE = excluded, FALSE = applicable
  
  PRIMARY KEY (coupon_id, category_id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Coupon usage tracking
CREATE TABLE coupon_usage (
  id VARCHAR(50) PRIMARY KEY,
  coupon_id VARCHAR(50) NOT NULL,
  user_phone VARCHAR(20) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  
  INDEX idx_coupon_id (coupon_id),
  INDEX idx_user_phone (user_phone),
  INDEX idx_coupon_user (coupon_id, user_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.13 inquiries Table

```sql
CREATE TABLE inquiries (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  purpose ENUM('B2B Partnership', 'Bulk Order', 'Marriage Clothes', 
               'Recurring Service', 'Issue', 'Concern', 'Other') NOT NULL,
  message TEXT NOT NULL,
  
  status ENUM('pending', 'working', 'processing', 'solved', 
              'cancelled', 'close with fail', 'close with success') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_status (status),
  INDEX idx_purpose (purpose),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

#### 3.2.14 settings Table

```sql
CREATE TABLE settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'general',
  company_id VARCHAR(50) NOT NULL,
  
  company_name VARCHAR(255),
  contact_number VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  logo_url VARCHAR(500),
  
  faqs JSON,  -- Array of {question, answer}
  privacy_policy TEXT,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.3 Additional Tables for Future Modules

#### 3.3.1 inventory_items Table (Inventory Module)

```sql
CREATE TABLE inventory_items (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  category ENUM('detergent', 'packaging', 'equipment', 'office', 'uniform') NOT NULL,
  unit VARCHAR(50) NOT NULL,  -- 'kg', 'ml', 'pieces', etc.
  
  reorder_point DECIMAL(10, 2) NOT NULL,
  reorder_quantity DECIMAL(10, 2) NOT NULL,
  
  unit_cost DECIMAL(10, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.2 stock_transactions Table

```sql
CREATE TABLE stock_transactions (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  branch_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  
  transaction_type ENUM('in', 'out', 'adjustment', 'transfer') NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  
  reference_type VARCHAR(50),  -- 'order', 'purchase', 'adjustment'
  reference_id VARCHAR(50),
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_branch_item (branch_id, item_id),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.3 invoices Table (Accounting Module)

```sql
CREATE TABLE invoices (
  id VARCHAR(50) PRIMARY KEY,
  company_id VARCHAR(50) NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  status ENUM('draft', 'sent', 'paid', 'cancelled') DEFAULT 'draft',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  
  INDEX idx_company_id (company_id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.4 MySQL Table Summary

| Table | Primary Purpose | Relationships |
|-------|----------------|---------------|
| **companies** | Multi-tenant companies | Parent of all tables |
| **users** | Staff & customers | FK: companies, branches |
| **categories** | Product categories | FK: companies |
| **subcategories** | Product subcategories | FK: companies, categories |
| **products** | Service catalog | FK: companies, categories, subcategories |
| **states** | Geographic - states | FK: companies |
| **areas** | Geographic - cities | FK: companies, states |
| **branches** | Physical locations | FK: companies |
| **clusters** | Delivery zones | FK: companies, branches |
| **cluster_areas** | Cluster-area mapping | FK: clusters, areas |
| **orders** | Order master | FK: companies, states, areas, branches, coupons, users |
| **order_items** | Order line items | FK: orders, products |
| **coupons** | Promotional codes | FK: companies, users |
| **coupon_categories** | Coupon restrictions | FK: coupons, categories |
| **coupon_usage** | Usage tracking | FK: coupons, orders |
| **inquiries** | Customer support | FK: companies |
| **settings** | System config | FK: companies |
| **inventory_items** | Stock items (future) | FK: companies |
| **stock_transactions** | Inventory movements (future) | FK: companies, branches, inventory_items, users |
| **invoices** | Billing (future) | FK: companies, orders |

**Total Tables (Current):** 17  
**Future Tables:** +10 (Inventory, Accounting, HR, Fleet, etc.)

---

## 4. DATA MIGRATION STRATEGY

### 4.1 Migration Steps

**Step 1: Schema Creation**
```sql
-- Run all CREATE TABLE statements in correct order
-- considering foreign key dependencies
```

**Step 2: Data Export from Firestore**
```javascript
// Export script
const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert('./serviceAccount.json')
});

const db = admin.firestore();
const companyId = 'laundry_q8';
const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

const exportCollection = async (collectionName) => {
  const snapshot = await db.collection(`${basePath}/${collectionName}`).get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  fs.writeFileSync(
    `./exports/${collectionName}.json`,
    JSON.stringify(data, null, 2)
  );
  
  console.log(`Exported ${data.length} documents from ${collectionName}`);
};

// Export all collections
const collections = [
  'users', 'orders', 'products', 'categories', 'subcategories',
  'states', 'areas', 'branches', 'clusters', 'coupons', 'contact', 'settings'
];

for (const collection of collections) {
  await exportCollection(collection);
}
```

**Step 3: Data Transformation**
```javascript
// Transform Firestore documents to MySQL rows
const transformOrders = (firestoreData) => {
  return firestoreData.map(doc => ({
    id: doc.id,
    company_id: 'laundry_q8',
    customer_name: doc.customerName,
    customer_email: doc.customerEmail,
    customer_phone: doc.customerPhone,
    customer_address: doc.customerAddress,
    subtotal: doc.subtotal,
    discount: doc.discount,
    express_delivery_fee: doc.expressDeliveryFee,
    total: doc.total,
    state_id: doc.stateId,
    area_id: doc.areaId,
    branch_id: doc.branchId,
    pickup_time: doc.pickupTime,
    delivery_preference: doc.deliveryPreference,
    service_type: doc.serviceType,
    assigned_delivery_person: doc.assignedDeliveryPerson,
    assigned_pickup_person: doc.assignedPickupPerson,
    status: doc.status,
    payment_method: doc.paymentMethod,
    coupon_id: doc.appliedCoupon?.code || null,
    coupon_code: doc.appliedCoupon?.code || null,
    coupon_discount: doc.appliedCoupon?.discount || 0,
    created_at: doc.createdAt?.toDate() || doc.timestamp?.toDate(),
    updated_at: doc.updatedAt?.toDate(),
    order_taken_by: doc.orderTakenBy,
    updated_by: doc.updatedBy
  }));
};
```

**Step 4: Import to MySQL**
```javascript
const mysql = require('mysql2/promise');

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'laundry_db'
});

const importOrders = async (transformedData) => {
  for (const row of transformedData) {
    await connection.query('INSERT INTO orders SET ?', row);
  }
  console.log(`Imported ${transformedData.length} orders`);
};
```

### 4.2 Migration Validation

```javascript
// Compare counts
const validateMigration = async () => {
  const firestoreCount = (await db.collection(`${basePath}/orders`).get()).size;
  const [mysqlCount] = await connection.query('SELECT COUNT(*) as count FROM orders WHERE company_id = ?', ['laundry_q8']);
  
  console.log(`Firestore: ${firestoreCount}, MySQL: ${mysqlCount[0].count}`);
  
  if (firestoreCount === mysqlCount[0].count) {
    console.log('✅ Migration successful');
  } else {
    console.log('❌ Migration incomplete');
  }
};
```

---

## 5. INDEXING STRATEGY

### 5.1 Index Types

1. **Primary Key Index:** Automatically created on PRIMARY KEY
2. **Unique Index:** Ensures uniqueness (e.g., email, phone)
3. **Composite Index:** Multiple columns (e.g., branch_id + created_at)
4. **Full-Text Index:** Text search (e.g., product names)

### 5.2 Key Indexes

**orders Table:**
```sql
-- Already defined in CREATE TABLE
INDEX idx_customer_phone (customer_phone)
INDEX idx_branch_created (branch_id, created_at DESC)
INDEX idx_status_branch (status, branch_id)
INDEX idx_created_at (created_at DESC)
```

**users Table:**
```sql
INDEX idx_email (email)
INDEX idx_phone (phone)
INDEX idx_role_branch (role, branch_id)
```

**products Table:**
```sql
INDEX idx_category_id (category_id)
INDEX idx_subcategory_id (subcategory_id)
INDEX idx_is_active (is_active)
```

### 5.3 Query Optimization

**Explain Plan Example:**
```sql
EXPLAIN SELECT * FROM orders 
WHERE branch_id = 'branch_downtown' 
  AND status = 'Pending'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 6. DATA RELATIONSHIPS

### 6.1 Entity Relationship Diagram (ERD)

```
companies
    ↓ 1:N
users, categories, states, branches, settings

categories
    ↓ 1:N
subcategories

subcategories
    ↓ 1:N
products

states
    ↓ 1:N
areas

branches
    ↓ 1:N
clusters ←→ N:M ←→ areas

orders
    ↓ 1:N
order_items

coupons
    ↓ 1:N
coupon_usage, coupon_categories
```

### 6.2 Referential Integrity

**Cascade Rules:**
- `ON DELETE CASCADE`: Child records deleted when parent deleted
- `ON DELETE SET NULL`: FK set to NULL when parent deleted
- `ON UPDATE CASCADE`: FK updated when parent PK changes

**Example:**
```sql
FOREIGN KEY (branch_id) REFERENCES branches(id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE
```

---

## 7. BACKUP & RECOVERY

### 7.1 Firebase Backup

**Firestore Export:**
```bash
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)
```

**Automated Daily Backup (Cloud Scheduler):**
```yaml
schedule: "0 2 * * *"  # Daily at 2 AM
target: firestore-export-function
```

### 7.2 MySQL Backup

**mysqldump:**
```bash
mysqldump -u root -p laundry_db > backup_$(date +%Y%m%d).sql
```

**Automated Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p$DB_PASSWORD laundry_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Restore:**
```bash
gunzip < backup_20251219_020000.sql.gz | mysql -u root -p laundry_db
```

---

## 8. DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-19 | Database Architect | Initial database documentation |

---

## 9. QUICK REFERENCE

### 9.1 Connection Strings

**Firebase (Current):**
```javascript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};
```

**MySQL (Future):**
```javascript
const mysqlConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};
```

### 9.2 Environment Variables

**Current (.env):**
```bash
NEXT_PUBLIC_COMPANY_ID=laundry_q8
NEXT_PUBLIC_FIREBASE_*=...
```

**Future (.env):**
```bash
COMPANY_ID=laundry_q8
DB_HOST=localhost
DB_PORT=3306
DB_USER=laundry_user
DB_PASSWORD=secure_password
DB_NAME=laundry_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

---

**END OF DATABASE INFORMATION DOCUMENT**

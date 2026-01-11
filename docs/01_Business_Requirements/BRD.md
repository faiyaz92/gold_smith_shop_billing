# Business Requirements Document (BRD) v1.0
## EASY2-LAUNDRY Admin Super Module

**Document Version:** 1.0  
**Date:** December 19, 2025  
**Project:** EASY2-LAUNDRY Admin Management System  
**Industry:** Laundry & Dry Cleaning Services  
**Status:** Current (Firebase) → Future (Node.js + MySQL + REST API)

---

## � DOCUMENT NAVIGATION

**📘 Related Documents:**
- **[Technical Documentation](TechnicalDoc.md)** - Complete implementation guide, code examples, architecture
- **[Database Information](DatabaseInfo.md)** - Schema reference, migration scripts, data structures

**🔗 Quick Links by Topic:**
| BRD Section | Technical Doc Section | Database Doc Section |
|-------------|----------------------|----------------------|
| [2.1 Dashboard](#21-dashboard--analytics-) | [7.1 Firestore Listeners](TechnicalDoc.md#71-firestore-real-time-listeners) | [2.2.1 Users](DatabaseInfo.md#221-users-collection), [2.2.2 Orders](DatabaseInfo.md#222-orders-collection) |
| [2.2 Order Management](#22-order-management-system-oms---core-) | [9.1 Order Logic](TechnicalDoc.md#91-order-processing-logic) | [2.2.2 Orders Collection](DatabaseInfo.md#222-orders-collection), [3.2.10 orders Table](DatabaseInfo.md#3210-orders-table) |
| [2.3 Product Management](#23-product-management-laundry-services-) | [7.2 Firestore Queries](TechnicalDoc.md#72-firestore-queries) | [2.2.3 Products](DatabaseInfo.md#223-products-collection), [2.2.4 Categories](DatabaseInfo.md#224-categories-collection) |
| [2.4 User Management](#24-user-management-) | [5.1 Admin Auth](TechnicalDoc.md#51-admin-authentication-emailpassword), [5.3 Role Redirect](TechnicalDoc.md#53-role-based-redirect-srcappadmincomponentsrolebasedredirectjs) | [2.2.1 Users Collection](DatabaseInfo.md#221-users-collection), [3.2.2 users Table](DatabaseInfo.md#322-users-table) |
| [2.5 Geographic Management](#25-geographic-management-) | [7.3 Firestore Writes](TechnicalDoc.md#73-firestore-writes) | [2.2.6 States](DatabaseInfo.md#226-states-collection), [2.2.7 Areas](DatabaseInfo.md#227-areas-collection), [2.2.8 Branches](DatabaseInfo.md#228-branches-collection) |
| [2.6 Coupon Management](#26-coupon-management-) | [9.2 Coupon Validation](TechnicalDoc.md#92-coupon-validation-logic) | [2.2.10 Coupons Collection](DatabaseInfo.md#2210-coupons-collection), [3.2.12 coupons Table](DatabaseInfo.md#3212-coupons-table) |
| [2.7 Billing/POS](#27-billing-system-pos-) | [9.3 PDF Generation](TechnicalDoc.md#93-pdf-receipt-generation) | [2.2.2 Orders Collection](DatabaseInfo.md#222-orders-collection) |
| [2.8 Customer Inquiries](#28-customer-inquiries-) | [7.3 Firestore Writes](TechnicalDoc.md#73-firestore-writes) | [2.2.11 Contact Collection](DatabaseInfo.md#2211-contactinquiries-collection) |
| [2.9 Advanced Analytics](#29-advanced-analytics-) | [10.4 Query Optimization](TechnicalDoc.md#104-firestore-query-optimization) | All Collections |
| [2.10 Settings](#210-settings--configuration-) | [4.1 Firebase Setup](TechnicalDoc.md#41-firebase-setup-srcappfirebasejs) | [2.2.12 Settings Collection](DatabaseInfo.md#2212-settings-collection) |
| [2.11 Contexts & Utilities](#211-global-contexts--utilities-system-foundation) | [6.1 CartContext](TechnicalDoc.md#61-cartcontext-srcappcontextcartcontextjs), [6.2 LanguageContext](TechnicalDoc.md#62-languagecontext-srcappcontextlanguagecontextjs) | [2.2.13 Carts Collection](DatabaseInfo.md#2213-carts-collection-user-specific) |
| [3. Future Modules](#3-future-modules-super-module-vision) | [11. Future Architecture](TechnicalDoc.md#11-future-architecture-nodejs--mysql) | [3. MySQL Database](DatabaseInfo.md#3-future-database-mysql) |
| [4. Migration Strategy](#4-migration-strategy-firebase--nodejs--mysql) | [11.5 Migration Script](TechnicalDoc.md#115-data-migration-script) | [4. Data Migration](DatabaseInfo.md#4-data-migration-strategy) |

---

## �📋 EXECUTIVE SUMMARY

### Purpose
This BRD outlines requirements for the EASY2-LAUNDRY Admin Super Module, evolving from the current Firebase-based system to a comprehensive enterprise solution with **POS, Inventory Management, Accounting, HR, Fleet Management, CRM, and Franchise Management**.

### Current State
- **Stack:** Next.js 14 + Firebase/Firestore + Cloudinary
- **Architecture:** Multi-tenant SaaS (`Easy2Solutions/companyDirectory/tenantCompanies/{companyId}`)
- **Limitations:** Firebase pricing at scale, limited complex queries, no relational integrity

### Future Vision (Super Module)
- **Separate Admin App:** Standalone Node.js backend with REST APIs
- **Database:** MySQL for relational data + Redis for caching
- **Modules:** POS, Inventory, Accounting, HR, Fleet, CRM, Franchise Management
- **Scalability:** Multi-branch, multi-franchise, enterprise-grade

---

## 1. BUSINESS CONTEXT

### 1.1 Industry: Laundry & Dry Cleaning Services
**NOT a perfume e-commerce site** - This is a complete laundry management system.

**Services:**
- Wash & Fold
- Dry Cleaning
- Ironing & Pressing
- Alterations & Repairs
- Curtain & Carpet Cleaning
- Wedding/Formal Wear Care

**Business Model:**
- **B2C:** Residential pickup & delivery
- **B2B:** Hotels, restaurants, salons, hospitals
- **Revenue:** Per-item pricing, subscription packages, express fees

### 1.2 Business Objectives
1. Centralized management for multi-location operations
2. Real-time order tracking (15-stage laundry lifecycle)
3. Role-based access (6+ roles with granular permissions)
4. Complete financial management (P&L, AR/AP, payroll)
5. Inventory optimization (chemicals, packaging, equipment)
6. Data-driven decisions via advanced analytics

### 1.3 Success Metrics
- Order processing: < 2 minutes placement to confirmation
- System uptime: 99.9%
- Staff adoption: 95% within 1 month
- Inventory accuracy: 99.5%
- Customer satisfaction: 4.5+ stars
- Order tracking accuracy: 100%

---

## 2. CURRENT ADMIN MODULES (Existing System)

> **Cross-Reference Navigation:**
> - 📘 **Technical Implementation:** See [TechnicalDoc.md](TechnicalDoc.md)
> - 🗄️ **Database Schemas:** See [DatabaseInfo.md](DatabaseInfo.md)

---

### 2.1 Dashboard & Analytics ✅
**Purpose:** Real-time business intelligence command center  
**File Location:** `/src/app/admin/dashboard/page.js`

**Core Functions & Hooks:**
- `fetchData()` - Fetches aggregated stats from Firestore
- `onSnapshot()` - Real-time listeners for users, products, orders, inquiries collections
- **State Management:** `useState` for counts, charts, filters
- **Date Filtering:** `DatePicker` component with startDate/endDate states

**Key Functions:**
```javascript
// src/app/admin/dashboard/page.js (Lines 79-140)
- onSnapshot(collection(db, usersPath)) → setUserCount()
- onSnapshot(collection(db, productsPath)) → setProductCount()
- onSnapshot(ordersQuery with role-based filtering) → setOrders()
- calculateSalesAnalytics() → processes orders for charts
- calculateTopSellingItems() → aggregates item quantities
```

**Features:**
- **Live Stats:** Users, products, orders, revenue (Firestore `onSnapshot` listeners)
- **Sales Chart:** Recharts `LineChart` with date range (default 30 days, configurable)
- **Top Sellers:** Top 5 items by quantity aggregation
- **Order Distribution:** `BarChart` showing count per status (15 statuses)
- **Role-Based Filtering:** 
  - `company_admin/general_manager`: All orders
  - `branch_manager`: Single branch filter (`where('branchId', '==', branchId)`)
  - `cashier`: Orders taken by user (`where('orderTakenBy', '==', userId)`)

**Business Logic:**
- Date range filtering applied to orders array
- Item quantity aggregation across all orders
- Status-based order count grouping

**UI Components:**
- Framer Motion animations for stat cards
- Recharts: LineChart, BarChart with responsive containers
- DatePicker for custom date range selection

**Users:** company_admin, general_manager, branch_manager, cashier (limited view)

**📘 Technical Reference:** TechnicalDoc.md → Section 7.1 (Dashboard Implementation)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.3 (Orders Collection), Section 2.2 (Users)

---

---

### 2.2 Order Management System (OMS) - CORE ✅
**Purpose:** 15-stage order lifecycle management  
**File Location:** `/src/app/admin/orders/page.js` (1371 lines)

**Core Functions & Hooks:**
```javascript
// Key Functions (Lines 150-300)
- fetchOrders() → onSnapshot() with role-based query
- handleStatusUpdate() → updateDoc(ordersPath, { status, updatedBy, updatedAt })
- handleAssignPerson() → Updates assignedDeliveryPerson or assignedPickupPerson
- generatePDF() → jsPDF + autoTable for receipt generation
- exportToExcel() → XLSX.utils for bulk export
- handleSearch() → Filters by customerPhone, customerName, orderId
```

**15 Stages (Status Progression):**
```
1. Pending → 2. Confirmed → 3. Scheduled for Pickup → 4. Out for Pickup →
5. Picked Up → 6. Received at Facility → 7. In Sorting/Inspection →
8. In Washing → 9. In Drying → 10. In Ironing/Pressing →
11. In Folding/Packaging → 12. Quality Check → 13. Ready for Delivery →
14. Out for Delivery → 15. Delivered

Special: Cancelled, Refunded/Returned, On Hold
```

**Status Colors Mapping:**
```javascript
// statusColors object (Lines 17-35)
const statusColors = {
  Pending: 'bg-orange-100 text-orange-800',
  Confirmed: 'bg-yellow-100 text-yellow-800',
  'Scheduled for Pickup': 'bg-blue-100 text-blue-800',
  // ... 15 total status colors
};
```

**Features:**
- **Order CRUD:** Role-based access with permission checks
- **Real-Time Updates:** `onSnapshot()` listeners for live order tracking
- **Person Assignment:** 
  - Delivery persons: Ramesh, Suresh, Priya (hardcoded, future: from users collection)
  - Pickup persons: Amit, Sunita, Vijay
- **PDF Receipt Generation:** jsPDF library with itemized breakdown
- **Advanced Filtering:** 
  - Status filter (18 options)
  - Date range filter (today, last 7/30/90 days, custom)
  - Branch filter (fetched from branches collection)
  - Order taken by filter (fetched from users collection)
  - Customer phone search
- **Bulk Operations:** 
  - Status updates for multiple orders
  - Excel export (XLSX library)
  - PDF receipt batch generation
- **Expandable Order Details:** Accordion UI showing full order info

**Order Data Structure:**
```javascript
{
  // Customer Information
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  customerAddress: string,
  
  // Items Array
  items: [
    { 
      productId: string, 
      productName: string, 
      categoryName: string, 
      subcategoryName: string, 
      quantity: number, 
      price: number 
    }
  ],
  
  // Pricing & Discounts
  subtotal: number,
  discount: number,
  expressDeliveryFee: number,
  total: number,
  appliedCoupon: { code, type, value },
  
  // Geographic Location
  stateId: string,
  areaId: string,
  branchId: string,
  
  // Service Configuration
  pickupTime: 'morning' | 'afternoon' | 'evening',
  deliveryPreference: 'standard' | 'express',
  serviceType: 'delivery' | 'pickup',
  
  // Staff Assignment
  assignedDeliveryPerson: string,
  assignedPickupPerson: string,
  orderTakenBy: string (userId),
  
  // Tracking & Audit
  status: string (1 of 18 statuses),
  timestamp: Timestamp (order creation),
  updatedAt: Timestamp,
  updatedBy: string (userId),
  
  // Payment
  paymentMethod: 'COD' (only option currently),
}
```

**Business Rules:**
1. **Unidirectional Status Progression:** Cannot move backward (except to Cancel/Hold)
2. **Assignment Validation:** Delivery/pickup person required before "Out for Pickup/Delivery"
3. **PDF Receipt Triggers:** 
   - Confirmed status
   - Ready for Delivery status
   - Delivered status
4. **Express Delivery:** +KWD 5 fee, next-day guarantee
5. **Standard Delivery:** 3-5 business days
6. **Order Modification:** Only company_admin can edit confirmed orders

**Role-Based Query Logic:**
```javascript
// Lines 134-148
if (userRole === 'company_admin' || userRole === 'general_manager') {
  ordersQuery = query(collection(db, ordersPath), orderBy('timestamp', 'desc'));
} else if (userRole === 'branch_manager') {
  ordersQuery = query(
    collection(db, ordersPath),
    where('branchId', '==', branchId),
    orderBy('timestamp', 'desc')
  );
} else if (userRole === 'cashier') {
  ordersQuery = query(
    collection(db, ordersPath),
    where('orderTakenBy', '==', userId),
    orderBy('timestamp', 'desc')
  );
}
```

**Role Access Matrix:**
| Role | View All | View Branch | Edit Status | Assign Person | Delete Order | PDF Receipt |
|------|----------|-------------|-------------|---------------|--------------|-------------|
| company_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| general_manager | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| branch_manager | ❌ | ✅ (own) | ✅ | ✅ | ❌ | ✅ |
| cashier | ❌ | ❌ | ⚠️ (limited) | ❌ | ❌ | ✅ |
| delivery_man | ❌ | ❌ | ⚠️ (assigned) | ❌ | ❌ | ❌ |
| pickup_man | ❌ | ❌ | ⚠️ (assigned) | ❌ | ❌ | ❌ |

**UI Components:**
- Framer Motion expandable order cards
- Lucide React icons for visual status indicators
- Custom dropdown for status updates
- Modal dialogs for person assignment
- Toast notifications for success/error feedback

**Users:** All roles (with granular permissions)

**📘 Technical Reference:** TechnicalDoc.md → Section 7.2 (Order Management), Section 8.2 (PDF Generation)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.3 (Orders Collection - Complete Schema)

---

---

### 2.3 Product Management (Laundry Services) ✅
**Purpose:** Service catalog with hierarchical categorization  
**File Locations:** 
- Main: `/src/app/admin/products/page.js`
- Categories: `/src/app/admin/products/categories/page.js`
- Subcategories: `/src/app/admin/products/subcategories/page.js`
- Products: `/src/app/admin/products/product/page.js`

**Core Functions & Hooks:**
```javascript
// Categories Management
- fetchCategories() → onSnapshot(collection(db, categoriesPath))
- handleCreateCategory() → addDoc() with Cloudinary image upload
- handleUpdateCategory() → updateDoc() with optional image replacement
- handleDeleteCategory() → deleteDoc() + deleteFromCloudinary()

// Subcategories Management
- fetchSubcategories() → onSnapshot() with category lookup
- handleCreateSubcategory() → Validates categoryId exists
- getCategoryName(categoryId) → Resolves category reference

// Products Management
- fetchProducts() → onSnapshot() with category + subcategory joins
- handleCreateProduct() → Validates pricing logic (discounted < regular)
- calculateDiscountPercentage() → UI helper function
- handleToggleActive() → Soft delete flag (isActive)
```

**Hierarchy Structure:**
```
Categories (e.g., Men's Wear, Women's Wear, Home Textiles)
    ↓
Subcategories (e.g., Shirts, Pants, Bed Sheets, Curtains)
    ↓
Products (e.g., Cotton Shirt - Wash & Iron, Silk Blouse - Delicate Care)
```

**Navigation Card UI:**
```javascript
// /src/app/admin/products/page.js (Lines 12-36)
productCards = [
  { id: 'categories', title: 'Categories', icon: <ListTree /> },
  { id: 'subcategories', title: 'Subcategories', icon: <Boxes /> },
  { id: 'product', title: 'Product', icon: <Package /> }
]
```

**Features:**
- **Categories CRUD:** 
  - Name, image (Cloudinary), sortOrder
  - Active/inactive status
  - Category count display
- **Subcategories CRUD:**
  - Name, image, categoryId (FK), sortOrder
  - Cascading category selector
  - Product count per subcategory
- **Products CRUD:**
  - Name, price, discountedPrice, image
  - categoryId + subcategoryId (double FK)
  - Active/inactive toggle
  - Discount percentage calculation
- **Cloudinary Integration:**
  - Upload preset: "Laundry"
  - Cloud name: "dnf7pisvw"
  - Automatic image optimization
  - Delete old images on update/delete
- **Search & Filter:**
  - Search by name across all three levels
  - Category filter (subcategories & products)
  - Status filter (active/inactive)
- **Sort Management:**
  - Custom sortOrder field for display ordering
  - Drag-and-drop UI (future enhancement)

**Data Schemas:**

**Category Schema:**
```javascript
{
  categoriesname: string,
  categoriesimage: string (Cloudinary URL),
  sortOrder: number,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Subcategory Schema:**
```javascript
{
  name: string,
  image: string (Cloudinary URL),
  categoryId: string (FK → categories),
  sortOrder: number,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Product Schema:**
```javascript
{
  name: string,
  price: number,
  discountedPrice: number (optional),
  image: string (Cloudinary URL),
  categoryId: string (FK → categories),
  subcategoryId: string (FK → subcategories),
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Business Rules:**
1. **Hierarchy Validation:** Product must belong to both category + subcategory
2. **Pricing Logic:** 
   - `price > 0` (required)
   - `discountedPrice < price` (if provided)
   - Display discount percentage: `((price - discountedPrice) / price) * 100`
3. **Image Management:**
   - Required for all three levels
   - Automatic deletion from Cloudinary on record delete
   - Replace old image on update
4. **Soft Delete:** `isActive` flag instead of hard delete (preserves order history)
5. **Cascade Logic:** 
   - Cannot delete category if subcategories exist
   - Cannot delete subcategory if products exist
   - Warning dialogs with dependency counts
6. **Sort Order:** Lower number = higher priority in display

**Cloudinary Upload Function:**
```javascript
// /src/app/cloudinary.js
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Laundry');
  
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dnf7pisvw/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  return data.secure_url;
}
```

**UI Components:**
- Framer Motion cards with hover effects
- Modal dialogs for Create/Edit forms
- Image preview with upload progress
- Confirmation dialogs for delete operations
- Table view with pagination (future)

**Users:** company_admin, general_manager, branch_manager

**📘 Technical Reference:** TechnicalDoc.md → Section 7.3 (Product Management), Section 9 (Cloudinary Integration)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.4, 2.5, 2.6 (Categories, Subcategories, Products Collections)

---

---

### 2.4 User Management ✅
**Purpose:** Staff & customer account management  
**File Location:** `/src/app/admin/users/page.js` (939 lines)

**Core Functions & Hooks:**
```javascript
// User Management Functions (Lines 120-250)
- fetchUsers() → onSnapshot(collection(db, usersPath))
- fetchBranches() → For branch assignment dropdown
- handleCreateUser() → createUserWithEmailAndPassword() + Firestore doc
- handleUpdateUser() → updateDoc() with permission checks
- handleDeleteUser() → deleteDoc() (company_admin only)
- handleStatusToggle() → Updates status field (active/inactive/suspended)
- filterUsersByRole() → Client-side filtering by userRole
- filterUsersByBranch() → Client-side filtering by branchId
```

**6 User Roles with Icons:**
```javascript
// USER_ROLES constant (Lines 38-45)
const USER_ROLES = [
  { value: 'company_admin', label: 'Company Admin', icon: <Crown />, color: 'bg-purple-100' },
  { value: 'general_manager', label: 'General Manager', icon: <Shield />, color: 'bg-blue-100' },
  { value: 'branch_manager', label: 'Branch Manager', icon: <Building />, color: 'bg-green-100' },
  { value: 'cashier', label: 'Cashier', icon: <CreditCard />, color: 'bg-yellow-100' },
  { value: 'delivery_man', label: 'Delivery Man', icon: <Truck />, color: 'bg-orange-100' },
  { value: 'pickup_man', label: 'Pickup Man', icon: <Package />, color: 'bg-teal-100' },
];
```

**Role Access Matrix:**
| Role | Default Route | Full Access | Branch Scope | Order Scope | User Management |
|------|---------------|-------------|--------------|-------------|-----------------|
| company_admin | /admin/dashboard | ✅ All Modules | All Branches | All Orders | ✅ CRUD All |
| general_manager | /admin/dashboard | 👁️ View Settings | All Branches | All Orders | 👁️ View Only |
| branch_manager | /admin/dashboard | ✅ Branch Modules | Single Branch | Branch Orders | 👁️ View Branch |
| cashier | /admin/billing | ❌ Billing Only | Single Branch | Own Orders | ❌ No Access |
| delivery_man | /admin/orders | ❌ Orders Only | N/A | Assigned Delivery | ❌ No Access |
| pickup_man | /admin/orders | ❌ Orders Only | N/A | Assigned Pickup | ❌ No Access |

**Role-Based Redirect Logic:**
```javascript
// /src/app/admin/components/RoleBasedRedirect.js
const roleDefaults = {
  company_admin: '/admin/dashboard',
  general_manager: '/admin/dashboard', 
  branch_manager: '/admin/dashboard',
  cashier: '/admin/billing',
  delivery_man: '/admin/orders',
  pickup_man: '/admin/orders',
};
```

**User Types:**
```javascript
// USER_TYPES constant (Lines 53-56)
const USER_TYPES = [
  { value: 'customer', label: 'Customer' },     // Customer-facing app users
  { value: 'staff', label: 'Staff/Employee' },   // Admin panel users
];
```

**Status Options:**
```javascript
// STATUS_OPTIONS constant (Lines 48-52)
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100' },
  { value: 'inactive', label: 'Inactive', color: 'bg-red-100' },
  { value: 'suspended', label: 'Suspended', color: 'bg-gray-100' },
];
```

**Features:**
- **User Creation (Staff):**
  - Firebase Authentication: `createUserWithEmailAndPassword(auth, email, password)`
  - Firestore Profile: Auto-created in `users` collection
  - Required fields: name, email, password, role, branchId (for branch staff)
  - Immediate sign-out after creation to avoid session conflict
- **User Creation (Customer):**
  - Created via customer app (phone OTP or Google Sign-in)
  - Auto-profile creation in Firestore
  - userType: 'customer', role: null
- **Role Assignment:**
  - Dropdown selector with 6 roles
  - Branch assignment required for: branch_manager, cashier, delivery_man, pickup_man
  - Role change requires company_admin permission
- **Status Management:**
  - Toggle between active/inactive/suspended
  - Suspended users cannot log in
  - Status changes logged with timestamp
- **Branch Assignment:**
  - Fetches branches from `branches` collection
  - Dropdown filtered to active branches only
  - Branch filter in user list for branch_manager view
- **Profile Editing:**
  - company_admin: Edit any user
  - Other roles: Edit own profile only
  - Cannot change own role
- **User Deletion:**
  - company_admin only
  - Soft delete option (status: 'inactive')
  - Hard delete removes from Firestore (Firebase Auth must be deleted separately)
  - Confirmation dialog with user details
- **Search & Filter:**
  - Search by name, email, phone
  - Filter by userType (customer/staff)
  - Filter by role (6 options)
  - Filter by branchId (branch_manager sees own branch only)
- **Last Login Tracking:**
  - Updated on each login (Auth state change)
  - Displayed in user list
  - Helper function: `formatLastLogin(timestamp)`

**User Data Structure:**
```javascript
{
  // Basic Info
  name: string,
  email: string,
  phone: string,
  
  // Authentication (Firebase Auth)
  uid: string (Firebase Auth UID),
  
  // Role & Permissions
  userType: 'customer' | 'staff',
  role: 'company_admin' | 'general_manager' | 'branch_manager' | 'cashier' | 'delivery_man' | 'pickup_man',
  
  // Branch Assignment
  branchId: string (FK → branches, required for branch staff),
  
  // Status
  status: 'active' | 'inactive' | 'suspended',
  
  // Audit Trail
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLogin: Timestamp,
  
  // Optional
  notes: string
}
```

**Firebase Auth Integration:**
```javascript
// User Creation Flow (Lines 200-240)
1. createUserWithEmailAndPassword(auth, email, password)
2. const userId = user.uid
3. await setDoc(doc(db, usersPath, userId), { name, email, role, ... })
4. await signOut(auth) // Prevent auto-login
5. setShowCreateModal(false)
```

**Permission Checks:**
```javascript
// Permission Logic
const canCreate = currentUser.role === 'company_admin';
const canEdit = currentUser.role === 'company_admin' || user.id === currentUser.id;
const canDelete = currentUser.role === 'company_admin';
const canViewAllUsers = ['company_admin', 'general_manager'].includes(currentUser.role);
```

**Customer Auth (Customer App):**
**File Location:** `/src/app/auth/page.js` (customer-facing)
- **Phone OTP:** Firebase `signInWithPhoneNumber()` + RecaptchaVerifier
- **Google Sign-in:** Firebase `signInWithPopup(auth, googleProvider)`
- **Guest Checkout:** localStorage cart without authentication
- **Auto Profile Creation:** First login creates Firestore user doc with userType: 'customer'

**UI Components:**
- Lucide React icons for role badges
- Modal forms for Create/Edit
- Confirmation dialogs for Delete
- Table with search and filters
- Status badges with color coding
- Password visibility toggle (Eye/EyeOff icons)

**Users:** 
- **Full Access:** company_admin (CRUD all users)
- **View Only:** general_manager, branch_manager (filtered by branch)
- **Self-Edit:** All roles (can edit own profile)

**📘 Technical Reference:** TechnicalDoc.md → Section 6 (Authentication System), Section 7.4 (User Management)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.2 (Users Collection - Complete Schema)

---

---

### 2.5 Geographic Management ✅
**Purpose:** Service area & delivery zone configuration  
**File Locations:**
- Areas/States/Clusters: `/src/app/admin/areas/page.js` (1050 lines)
- Branches: `/src/app/admin/branches/page.js` (731 lines)

**Core Functions & Hooks:**
```javascript
// Areas Page - Multi-tab Management
- fetchStates() → onSnapshot(collection(db, statesPath))
- fetchAreas() → onSnapshot(collection(db, areasPath))
- fetchClusters() → onSnapshot(collection(db, clustersPath))
- fetchBranches() → For cluster assignment dropdown

// States Management
- handleCreateState() → addDoc(statesPath, { name, isActive })
- handleUpdateState() → updateDoc()
- handleDeleteState() → Validation: Check if areas exist

// Areas Management
- handleCreateArea() → Validates stateId exists
- handleUpdateArea() → Can change parent state
- handleDeleteArea() → Validation: Check if clusters reference this area
- getStateName(stateId) → Resolves state reference for display

// Clusters Management (Delivery Zones)
- handleCreateCluster() → Multi-select areaIds + branchId assignment
- handleUpdateCluster() → Update delivery zone configuration
- handleDeleteCluster() → No dependencies check
- getAreasForState(stateId) → Filters areas by selected state

// Branches Page - Branch Management
- fetchBranches() → onSnapshot(collection(db, branchesPath))
- handleCreateBranch() → Complete branch setup
- handleUpdateBranch() → Partial updates allowed
- handleToggleStatus() → active/inactive/maintenance
- handleDeleteBranch() → Validation: Check if orders exist
```

**Hierarchy Structure:**
```
States (e.g., Kuwait, Al-Asimah Governorate)
    ↓
Areas/Cities (e.g., Salmiya, Hawally, Fintas)
    ↓
Branches (Physical locations with coordinates)
    ↓
Clusters (Delivery zones grouping multiple areas per branch)
```

**Tab Navigation (Areas Page):**
```javascript
// activeTab state: 'states' | 'areas' | 'clusters'
- States Tab: Manage states/governorates
- Areas Tab: Manage cities/districts
- Clusters Tab: Manage delivery zones
```

**Features:**

**States Management:**
- Name, isActive status
- Create, update, delete operations
- Validation: Cannot delete if areas exist
- Sort by creation date

**Areas Management:**
- Name, stateId (FK → states), isActive
- State selection dropdown
- Validation: Cannot delete if clusters reference
- Filter areas by state in UI

**Clusters Management (Delivery Zones):**
- Name, description
- Multi-select areaIds (FK → areas array)
- branchId (FK → branches) - assigns cluster to specific branch
- isActive status
- Helper: State selector to filter areas before multi-select
- Optimization: Groups areas for efficient route planning

**Branches Configuration:**

**Branch Types:**
```javascript
// BRANCH_TYPES constant
const BRANCH_TYPES = [
  { value: 'main', label: 'Main Branch' },
  { value: 'pickup', label: 'Pickup Center' },
  { value: 'processing', label: 'Processing Center' },
  { value: 'delivery', label: 'Delivery Hub' },
];
```

**Working Hours Options:**
```javascript
// WORKING_HOURS constant
const WORKING_HOURS = [
  { value: '24/7', label: '24/7' },
  { value: '6am-10pm', label: '6:00 AM - 10:00 PM' },
  { value: '8am-8pm', label: '8:00 AM - 8:00 PM' },
  { value: 'custom', label: 'Custom Hours' },
];
```

**Branch Data Structure:**
```javascript
{
  // Basic Information
  name: string,
  type: 'main' | 'pickup' | 'processing' | 'delivery',
  isActive: boolean,
  
  // Address Details
  address: string,
  city: string,
  area: string,
  zipCode: string,
  latitude: number,   // For distance calculations
  longitude: number,  // For map display
  
  // Contact Information
  phone: string,
  whatsapp: string,
  email: string,
  
  // Operating Hours
  workingHours: string,
  customHours: string (JSON or text),
  
  // Management
  managerName: string,
  managerPhone: string,
  
  // Operations
  capacity: number,          // Max orders per day
  services: string[],        // ['wash', 'iron', 'dryclean', 'alterations']
  hasPickup: boolean,
  hasDelivery: boolean,
  
  // Status
  status: 'active' | 'inactive' | 'maintenance',
  notes: string,
  
  // Audit
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Geographic Data Structures:**

**State Schema:**
```javascript
{
  name: string,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Area Schema:**
```javascript
{
  name: string,
  stateId: string (FK → states),
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Cluster Schema:**
```javascript
{
  name: string,
  description: string,
  areaIds: string[] (FK → areas, multiple),
  branchId: string (FK → branches),
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Business Rules:**
1. **Hierarchical Dependencies:**
   - Cannot delete state if areas exist
   - Cannot delete area if clusters reference it
   - Can delete cluster without dependencies
   - Cannot delete branch if orders exist (validation in orders module)

2. **Branch Assignment:**
   - Clusters assigned to single branch (1:N relationship)
   - One branch can have multiple clusters
   - Area can belong to multiple clusters (N:M relationship)

3. **Delivery Zone Optimization:**
   - Clusters group areas for route planning
   - Each cluster has dedicated branch for fulfillment
   - Driver assignment based on cluster

4. **Capacity Management:**
   - Branch capacity limits daily orders
   - Order placement checks branch capacity
   - Dashboard shows capacity utilization

5. **Coordinates Usage:**
   - Latitude/longitude for distance calculations
   - Map display in customer app
   - Delivery time estimation
   - Branch locator feature

6. **Working Hours Validation:**
   - Custom hours stored as JSON: `{ "mon": "8-8", "tue": "8-8", ... }`
   - Standard presets for common schedules
   - Holiday/special hours override

7. **Service Configuration:**
   - services[] array: wash, iron, dryclean, alterations, repairs
   - Order placement validates branch capabilities
   - Filter branches by service type in customer app

**UI Components:**
- Tab navigation (States/Areas/Clusters)
- Modal forms for CRUD operations
- Multi-select dropdowns (cluster areas)
- Confirmation dialogs with dependency warnings
- Status badges with color coding
- Map integration (future: Google Maps for coordinates)

**Users:** company_admin, general_manager

**📘 Technical Reference:** TechnicalDoc.md → Section 7.5 (Geographic Management)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.7, 2.8, 2.9, 2.10 (States, Areas, Branches, Clusters Collections)

---

---

### 2.6 Coupon Management ✅
**Purpose:** Promotional discount engine  
**File Location:** `/src/app/admin/coupons/page.js` (605 lines)

**Core Functions & Hooks:**
```javascript
// Coupon Management Functions (Lines 70-150)
- fetchCoupons() → onSnapshot(query(collection(db, couponsPath), orderBy('createdAt', 'desc')))
- determineCouponStatus() → Checks isActive + validUntil vs. current date
- handleCreateCoupon() → addDoc() with validation
- handleUpdateCoupon() → updateDoc() with partial updates
- handleDeleteCoupon() → deleteDoc() (company_admin only)
- handleToggleActive() → Quick activate/deactivate
- handleDuplicateCoupon() → Creates copy with new code
- validateCouponCode() → Checks uniqueness (case-insensitive)

// Validation Functions (Customer App)
- applyCoupon() → Multi-step validation before checkout
- calculateDiscount() → Applies type-specific discount logic
- trackCouponUsage() → Updates usage counters on order completion
```

**Coupon Types:**
```javascript
// COUPON_TYPES constant (Lines 22-27)
const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage Off' },      // e.g., 20% off
  { value: 'fixed', label: 'Fixed Amount Off' },         // e.g., KWD 10 off
  { value: 'free_delivery', label: 'Free Delivery' },    // Waives delivery fee
  { value: 'bogo', label: 'Buy One Get One' },           // Future enhancement
];
```

**Usage Limit Options:**
```javascript
// USAGE_LIMITS constant (Lines 29-33)
const USAGE_LIMITS = [
  { value: 'unlimited', label: 'Unlimited' },
  { value: 'once_per_user', label: 'Once Per User' },
  { value: 'limited_total', label: 'Limited Total Uses' },
];
```

**Status Determination:**
```javascript
// Auto-calculated status (Lines 88-95)
const now = new Date();
const validUntil = data.validUntil?.toDate();

let status = 'active';
if (!data.isActive) {
  status = 'inactive';
} else if (validUntil && validUntil < now) {
  status = 'expired';
}
```

**Features:**
- **CRUD Operations:**
  - Create: Form with all fields + validation
  - Read: Table view with search + filters
  - Update: Edit modal with current values
  - Delete: Confirmation dialog (company_admin only)
- **Coupon Code Generation:**
  - Manual entry or auto-generate
  - Uppercase conversion
  - Uniqueness validation (case-insensitive)
  - Format: ALPHANUMERIC (e.g., SUMMER2024, SAVE20)
- **Validity Period:**
  - validFrom: Timestamp
  - validUntil: Timestamp
  - Auto-expire based on date
  - Calendar picker for date selection
- **Usage Tracking:**
  - Per-user limit: usageLimit field
  - Total uses limit: totalUsageLimit field
  - Current usage count: currentUsage (updated on order)
  - Usage history: Array of { userId, orderId, timestamp }
- **Discount Configuration:**
  - Percentage: value = percentage (e.g., 20 = 20%)
  - Fixed: value = amount (e.g., 10 = KWD 10)
  - minimumOrderValue: Minimum cart total required
  - maximumDiscount: Cap on percentage discounts
- **Category Restrictions:**
  - applicableCategories: string[] (whitelist - empty = all)
  - excludedCategories: string[] (blacklist)
  - Logic: Include applicable, exclude excluded
- **Active/Inactive Toggle:**
  - Quick enable/disable without editing
  - Doesn't affect expiry logic
  - Admin can temporarily pause promotions
- **Search & Filter:**
  - Search by code or name
  - Filter by status (active/inactive/expired)
  - Filter by type
- **Duplicate Feature:**
  - Copy existing coupon configuration
  - Generates new code (appends _COPY)
  - Resets usage counters
  - Useful for recurring promotions

**Coupon Data Structure:**
```javascript
{
  // Basic Info
  code: string (UPPERCASE, unique),
  name: string (internal reference),
  description: string (customer-facing),
  
  // Discount Configuration
  type: 'percentage' | 'fixed' | 'free_delivery' | 'bogo',
  value: number (percentage or amount),
  
  // Order Requirements
  minimumOrderValue: number,
  maximumDiscount: number (for percentage type),
  
  // Usage Limits
  usageLimit: 'unlimited' | 'once_per_user' | 'limited_total',
  totalUsageLimit: number (if limited_total),
  currentUsage: number (counter),
  usageHistory: [
    { userId, orderId, timestamp, discountApplied }
  ],
  
  // Validity Period
  validFrom: Timestamp,
  validUntil: Timestamp,
  
  // Category Restrictions
  applicableCategories: string[] (FK → categories, empty = all),
  excludedCategories: string[] (FK → categories),
  
  // Status
  isActive: boolean,
  
  // Audit Trail
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string (userId)
}
```

**Validation Logic (Customer App Checkout):**
```javascript
// Multi-step validation before applying coupon
async function applyCoupon(code, cart, userId) {
  // 1. Fetch coupon by code (case-insensitive)
  const couponQuery = query(
    collection(db, couponsPath),
    where('code', '==', code.toUpperCase())
  );
  const snapshot = await getDocs(couponQuery);
  
  if (snapshot.empty) {
    return { valid: false, message: 'Coupon not found' };
  }
  
  const coupon = snapshot.docs[0].data();
  
  // 2. Check isActive
  if (!coupon.isActive) {
    return { valid: false, message: 'Coupon is inactive' };
  }
  
  // 3. Check date range
  const now = new Date();
  if (coupon.validFrom && coupon.validFrom.toDate() > now) {
    return { valid: false, message: 'Coupon not yet valid' };
  }
  if (coupon.validUntil && coupon.validUntil.toDate() < now) {
    return { valid: false, message: 'Coupon expired' };
  }
  
  // 4. Validate minimum order value
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (cartTotal < coupon.minimumOrderValue) {
    return { 
      valid: false, 
      message: `Minimum order value: KWD ${coupon.minimumOrderValue}` 
    };
  }
  
  // 5. Check user-specific usage
  if (coupon.usageLimit === 'once_per_user') {
    const userUsage = coupon.usageHistory?.filter(u => u.userId === userId).length || 0;
    if (userUsage >= 1) {
      return { valid: false, message: 'Coupon already used' };
    }
  }
  
  // 6. Check total usage limit
  if (coupon.usageLimit === 'limited_total' && 
      coupon.currentUsage >= coupon.totalUsageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  // 7. Validate category restrictions
  const cartCategories = [...new Set(cart.map(item => item.categoryId))];
  
  // Whitelist check
  if (coupon.applicableCategories?.length > 0) {
    const hasApplicable = cartCategories.some(cat => 
      coupon.applicableCategories.includes(cat)
    );
    if (!hasApplicable) {
      return { valid: false, message: 'Coupon not applicable to cart items' };
    }
  }
  
  // Blacklist check
  if (coupon.excludedCategories?.length > 0) {
    const hasExcluded = cartCategories.some(cat => 
      coupon.excludedCategories.includes(cat)
    );
    if (hasExcluded) {
      return { valid: false, message: 'Coupon not valid for some items' };
    }
  }
  
  // 8. Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (cartTotal * coupon.value) / 100;
    if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount;
    }
  } else if (coupon.type === 'fixed') {
    discount = Math.min(coupon.value, cartTotal); // Don't exceed cart total
  }
  
  return { 
    valid: true, 
    discount, 
    coupon: { id: snapshot.docs[0].id, ...coupon } 
  };
}
```

**Business Rules:**
1. **Code Uniqueness:** Case-insensitive, enforced at creation
2. **One Coupon Per Order:** Cannot stack multiple coupons
3. **Expiry Auto-Detection:** Status calculated on-the-fly
4. **Usage Tracking:** Updated on order confirmation (not placement)
5. **Category Logic:**
   - Empty applicableCategories = applicable to all
   - Excluded takes precedence over applicable
   - Validation at item level, not order level
6. **Discount Caps:**
   - Percentage: maximumDiscount field
   - Fixed: Cannot exceed cart total
   - Free delivery: Waives expressDeliveryFee
7. **Permission Rules:**
   - Create/Edit: company_admin, general_manager
   - Delete: company_admin only
   - View: All admin roles
8. **Audit Trail:**
   - Track who created coupon (createdBy field)
   - Log all usage in usageHistory array
   - Update currentUsage counter on each use

**UI Components:**
- Table view with status badges
- Modal forms for Create/Edit
- Date range pickers (validFrom/validUntil)
- Multi-select for category restrictions
- Confirmation dialogs for Delete
- Copy-to-clipboard for coupon codes
- Usage progress bars (current/total)

**Users:** 
- **Full Access:** company_admin (CRUD all coupons)
- **Create/Edit:** general_manager
- **View Only:** branch_manager, cashier

**📘 Technical Reference:** TechnicalDoc.md → Section 7.6 (Coupon Management), Section 8.3 (Coupon Validation)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.11 (Coupons Collection - Complete Schema)

---

---

### 2.7 Billing System (POS) ✅
**Purpose:** Cashier interface for order processing and payment  
**File Location:** `/src/app/admin/billing/page.js` (1448 lines)

**Core Functions & Hooks:**
```javascript
// POS Functions (Lines 100-400)
- searchCustomerByPhone() → query(ordersPath, where('customerPhone', '==', phone))
- fetchPendingOrders(userId) → Filters orders by status='Pending'
- handleConfirmOrder(orderId) → Updates status to 'Confirmed', logs cashier
- generatePDFReceipt(order) → jsPDF with itemized breakdown
- addItemToCart() → Cart management for in-person orders
- applyDiscount() → Manual discount application
- calculateTotal() → Sum with discounts and fees
- processPayment() → Creates order document (COD only currently)
- handleCouponApply() → Validates and applies coupon code
```

**Payment Methods (Current & Future):**
```javascript
// Current: COD only
const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery' }
];

// Future Enhancement:
// { value: 'cash', label: 'Cash' },
// { value: 'card', label: 'Card Payment' },
// { value: 'knet', label: 'K-Net' },
// { value: 'upi', label: 'UPI' },
// { value: 'wallet', label: 'Digital Wallet' }
```

**Features:**

**1. Customer Lookup:**
- Search by phone number
- Display customer order history
- View pending orders only or all orders
- Quick access to recent customers

**2. Cart Management (In-Person Orders):**
- Add items from product catalog
- Quantity adjustment (+/-)
- Remove items
- Real-time price calculation
- Discount application
- Coupon code entry

**3. Order Confirmation:**
- Pending orders displayed in table
- One-click confirmation
- Status change: Pending → Confirmed
- Auto-generate PDF receipt
- Print receipt (browser print dialog)
- Email receipt (future enhancement)

**4. PDF Receipt Generation:**
```javascript
// jsPDF Implementation (Lines 500-650)
function generatePDFReceipt(order) {
  const doc = new jsPDF();
  
  // Header: Company Logo
  if (settings.logoUrl) {
    doc.addImage(settings.logoUrl, 'PNG', 15, 10, 40, 20);
  }
  
  // Company Details
  doc.setFontSize(16);
  doc.text(settings.companyName, 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(settings.address, 105, 28, { align: 'center' });
  doc.text(`Phone: ${settings.phone}`, 105, 34, { align: 'center' });
  
  // Receipt Title
  doc.setFontSize(14);
  doc.text('ORDER RECEIPT', 105, 45, { align: 'center' });
  
  // Order Details
  doc.setFontSize(10);
  doc.text(`Order ID: ${order.id}`, 15, 55);
  doc.text(`Date: ${order.timestamp.toDate().toLocaleDateString()}`, 15, 62);
  doc.text(`Status: ${order.status}`, 15, 69);
  
  // Customer Details
  doc.text(`Customer: ${order.customerName}`, 15, 80);
  doc.text(`Phone: ${order.customerPhone}`, 15, 87);
  doc.text(`Address: ${order.customerAddress}`, 15, 94);
  
  // Items Table
  doc.autoTable({
    startY: 105,
    head: [['Item', 'Category', 'Qty', 'Price', 'Total']],
    body: order.items.map(item => [
      item.productName,
      item.categoryName,
      item.quantity,
      `KWD ${item.price.toFixed(2)}`,
      `KWD ${(item.price * item.quantity).toFixed(2)}`
    ]),
  });
  
  // Pricing Summary
  let finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Subtotal: KWD ${order.subtotal.toFixed(2)}`, 140, finalY);
  if (order.discount > 0) {
    doc.text(`Discount: -KWD ${order.discount.toFixed(2)}`, 140, finalY + 7);
  }
  if (order.expressDeliveryFee > 0) {
    doc.text(`Express Fee: KWD ${order.expressDeliveryFee.toFixed(2)}`, 140, finalY + 14);
  }
  doc.setFontSize(12);
  doc.text(`Total: KWD ${order.total.toFixed(2)}`, 140, finalY + 21);
  
  // Payment Method
  doc.setFontSize(10);
  doc.text(`Payment: ${order.paymentMethod}`, 15, finalY + 21);
  
  // Applied Coupon
  if (order.appliedCoupon) {
    doc.text(`Coupon Applied: ${order.appliedCoupon.code}`, 15, finalY + 28);
  }
  
  // Footer
  doc.text('Thank you for your business!', 105, finalY + 40, { align: 'center' });
  doc.text(settings.termsAndConditions, 105, finalY + 47, { align: 'center' });
  
  // Save PDF
  doc.save(`receipt_${order.id}.pdf`);
}
```

**5. Manual Discount Entry:**
- Percentage or fixed amount
- Reason/notes field required
- Manager approval (future enhancement)
- Audit log of all discounts

**6. Coupon Application:**
- Enter coupon code
- Validate in real-time
- Display discount amount
- One coupon per order
- Auto-apply best discount

**Cashier Workflow:**
```
1. Customer arrives at counter
   ↓
2. Cashier searches by phone or creates new order
   ↓
3. If existing order: Display pending orders
   If new order: Build cart from catalog
   ↓
4. Review order details:
   - Items, quantities, pricing
   - Apply coupon if provided
   - Add manual discount if needed
   ↓
5. Confirm order (Pending → Confirmed)
   ↓
6. Generate PDF receipt automatically
   ↓
7. Print receipt (browser print)
   ↓
8. Collect payment (COD)
   ↓
9. Hand receipt + items to customer
   ↓
10. Order moves to processing (other staff updates status)
```

**POS Interface Components:**
- **Search Bar:** Customer phone lookup
- **Product Catalog:** Grid view with images
- **Cart Panel:** Right sidebar with line items
- **Calculator Panel:** Subtotal, discount, tax, total
- **Action Buttons:** Confirm Order, Print Receipt, Clear Cart
- **Recent Orders:** Quick access to last 10 orders
- **Shortcut Keys:** Future enhancement (F1-F12 functions)

**Receipt Contents:**
```
┌─────────────────────────────────────────┐
│          [COMPANY LOGO]                 │
│       EASY2 LAUNDRY SERVICES            │
│     123 Main St, Salmiya, Kuwait        │
│         Phone: +965 1234 5678           │
├─────────────────────────────────────────┤
│            ORDER RECEIPT                │
├─────────────────────────────────────────┤
│ Order ID: ORD-20241219-001              │
│ Date: 19/12/2024 10:30 AM               │
│ Status: Confirmed                       │
│ Cashier: Ahmed Ali (ID: USR123)         │
├─────────────────────────────────────────┤
│ Customer: John Doe                      │
│ Phone: +965 9876 5432                   │
│ Address: Block 5, Street 10, Salmiya    │
├─────────────────────────────────────────┤
│ ITEMS                                   │
│ ─────────────────────────────────────── │
│ Cotton Shirt - Wash & Iron              │
│   Category: Men's Wear     Qty: 2       │
│   Price: KWD 3.50   Total: KWD 7.00     │
│                                          │
│ Formal Pants - Dry Clean                │
│   Category: Men's Wear     Qty: 1       │
│   Price: KWD 5.00   Total: KWD 5.00     │
├─────────────────────────────────────────┤
│ Subtotal:              KWD 12.00        │
│ Discount (SAVE20):     -KWD 2.40        │
│ Express Fee:           KWD 5.00         │
│ ─────────────────────────────────────── │
│ TOTAL:                 KWD 14.60        │
├─────────────────────────────────────────┤
│ Payment Method: Cash on Delivery        │
│ Coupon Applied: SAVE20 (20% off)        │
├─────────────────────────────────────────┤
│    Thank you for your business!         │
│  For inquiries: info@easy2laundry.com   │
│   Terms: No refund after processing     │
└─────────────────────────────────────────┘
```

**Business Rules:**
1. **Role-Based Access:**
   - Cashier: Auto-redirect to /admin/billing on login
   - Can only confirm orders (status limited to Pending → Confirmed)
   - Cannot modify prices (requires manager approval)
2. **Order Status Limits:**
   - Cashier can update: Pending, Confirmed, Received at Facility
   - Cannot update: Delivery statuses (delivery_man only)
3. **Receipt Generation Triggers:**
   - Auto-generate on confirmation
   - Manual trigger button available
   - Store PDF URL in order document (future)
4. **Audit Logging:**
   - orderTakenBy: userId of cashier
   - updatedBy: userId on status change
   - timestamp: All actions logged
5. **Payment Validation:**
   - COD: No validation required
   - Future card payments: Require terminal integration
6. **Discount Approval:**
   - < 10%: Cashier can apply
   - 10-20%: Branch manager approval
   - > 20%: Company admin only
7. **Coupon Priority:**
   - If both manual discount + coupon: Use better discount
   - Cannot stack discounts
8. **Shift Management (Future):**
   - Opening balance entry
   - Closing balance reconciliation
   - Cash drawer tracking
   - Shift reports

**UI Components:**
- Responsive grid layout (customer panel + cart panel)
- Real-time search with debounce
- Product cards with images
- Cart summary with live totals
- Modal dialogs for confirmation
- Print preview for receipts
- Toast notifications for success/errors

**Users:** 
- **Primary:** cashier (default redirect, limited permissions)
- **Secondary:** branch_manager, general_manager, company_admin (full access)

**📘 Technical Reference:** TechnicalDoc.md → Section 7.7 (Billing/POS System), Section 8.2 (PDF Receipt Generation)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.3 (Orders Collection)

---

---

### 2.8 Customer Inquiries ✅
**Purpose:** Support ticket system for customer service  
**File Location:** `/src/app/admin/inquiries/page.js` (101 lines)

**Core Functions & Hooks:**
```javascript
// Inquiry Management Functions (Lines 20-50)
- fetchInquiries() → getDocs(collection(db, contactPath))
- handleStatusChange(id, status) → updateDoc(doc(db, contactPath, id), { status })
- filterInquiriesByStatus() → Client-side filtering
- sortInquiriesByDate() → timestamp descending
```

**Purpose Categories:**
```javascript
// Inquiry purpose types (customer app submission)
const INQUIRY_PURPOSES = [
  'B2B Partnership',        // Corporate laundry contracts
  'Bulk Order',            // Large order inquiries (50+ items)
  'Marriage/Event',        // Wedding dress, event garments
  'Recurring Service',     // Weekly/monthly subscriptions
  'Issue/Complaint',       // Service quality issues
  'General Concern',       // Questions, feedback
  'Other'                  // Miscellaneous
];
```

**Status Options:**
```javascript
// STATUS_OPTIONS constant (Lines 8-16)
const STATUS_OPTIONS = [
  'pending',               // New inquiry, not yet assigned
  'working',               // Staff assigned, investigating
  'processing',            // Active resolution in progress
  'solved',                // Issue resolved successfully
  'cancelled',             // Customer cancelled or invalid
  'close with fail',       // Could not resolve
  'close with success',    // Resolved and confirmed by customer
];
```

**Features:**
- **Inquiry Submission (Customer App):**
  - Contact form on customer-facing website
  - Fields: name, email, phone, purpose, message
  - Auto-timestamp on submission
  - Confirmation email (future enhancement)
- **Admin Dashboard:**
  - Table view of all inquiries
  - Status dropdown for quick updates
  - Filter by status (all, pending, working, solved)
  - Search by customer name or phone
  - Sort by timestamp (newest first)
- **Status Management:**
  - Dropdown in each row for status update
  - Updates reflected immediately (optimistic UI)
  - Timestamp of status change logged
  - Status change history (future enhancement)
- **Responsive Table:**
  - Mobile: Shows name, email, status only
  - Tablet: + purpose column
  - Desktop: All columns including message and timestamp

**Inquiry Data Structure:**
```javascript
{
  // Customer Information
  name: string,
  email: string,
  phone: string,
  
  // Inquiry Details
  purpose: string (one of INQUIRY_PURPOSES),
  message: string (long text),
  
  // Status & Tracking
  status: string (one of STATUS_OPTIONS),
  
  // Audit Trail
  timestamp: Timestamp (submission time),
  updatedAt: Timestamp (last status change),
  assignedTo: string (userId - future),
  resolvedBy: string (userId - future),
  resolutionNotes: string (internal notes - future)
}
```

**Inquiry Workflow:**
```
Customer Submits Inquiry (Contact Form)
           ↓
      Status: pending
           ↓
Admin Assigns to Staff → Status: working
           ↓
Staff Investigates/Responds → Status: processing
           ↓
   ┌──────┴──────┐
   ↓             ↓
Resolved      Cannot Resolve
   ↓             ↓
Status: solved   Status: close with fail
   ↓             ↓
Customer Confirms Resolution
   ↓
Status: close with success
```

**Business Rules:**
1. **Submission:**
   - All inquiries logged with timestamp
   - Email and phone stored for follow-up
   - Auto-response email sent (future)
2. **Status Transitions:**
   - pending → working (when assigned)
   - working → processing (investigation started)
   - processing → solved/cancelled/close with fail
   - solved → close with success (after customer confirmation)
3. **Assignment (Future):**
   - Auto-assign based on purpose
   - B2B → Sales team
   - Issue/Complaint → Customer service
   - Bulk Order → Operations manager
4. **Response SLA:**
   - Pending: Response within 24 hours
   - Working: Resolution within 48 hours
   - Processing: Updates every 24 hours
5. **Escalation (Future):**
   - > 48 hours in pending: Escalate to manager
   - > 7 days in processing: Escalate to senior manager
6. **Notification (Future):**
   - Email on status change
   - SMS for urgent issues
   - In-app notifications for customer
7. **Analytics:**
   - Track resolution time
   - Purpose distribution
   - Staff performance
   - Customer satisfaction score

**Customer Submission Form (Customer App):**
```javascript
// /src/app/contact/page.js
async function handleSubmitInquiry(formData) {
  const inquiry = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    purpose: formData.purpose,
    message: formData.message,
    status: 'pending',
    timestamp: serverTimestamp()
  };
  
  await addDoc(collection(db, contactPath), inquiry);
  
  // Future: Send confirmation email
  // await sendEmail(formData.email, 'inquiry-confirmation', inquiry);
}
```

**UI Components:**
- Responsive table with conditional column display
- Status dropdown with color-coded options
- Search input with real-time filtering
- Loading spinner during fetch
- Empty state message ("No inquiries found")
- Mobile-optimized table (horizontal scroll)

**Future Enhancements:**
1. **Assignment System:**
   - Assign inquiries to specific staff
   - Workload balancing
   - Team-based assignment
2. **Response Management:**
   - Reply directly from admin panel
   - Email/SMS integration
   - Canned responses library
3. **Resolution Tracking:**
   - Time-to-resolution metrics
   - Resolution notes field
   - Customer satisfaction rating
4. **Escalation System:**
   - Auto-escalate overdue inquiries
   - Priority levels (low, medium, high, urgent)
   - SLA violation alerts
5. **Knowledge Base Integration:**
   - Link common issues to FAQs
   - Auto-suggest solutions
   - Self-service portal
6. **Reporting:**
   - Daily/weekly inquiry summary
   - Purpose distribution chart
   - Resolution time analytics
   - Staff performance dashboard

**Users:** 
- **View & Update:** company_admin, general_manager, branch_manager
- **View Only:** cashier (future: customer service role)

**📘 Technical Reference:** TechnicalDoc.md → Section 7.8 (Inquiries Management)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.12 (Contact/Inquiries Collection)

---

---

### 2.9 Advanced Analytics ✅
**Purpose:** Business intelligence & comprehensive reporting  
**File Location:** `/src/app/admin/analytics/page.js` (1616 lines)

**Core Functions & Hooks:**
```javascript
// Data Fetching Functions (Lines 90-200)
- fetchAllData() → Parallel fetches: orders, users, branches, products
- fetchOrders() → query(collection(db, ordersPath), where('timestamp', '>=', startDate))
- fetchUsers() → For customer analytics
- fetchBranches() → For branch performance comparison
- fetchProducts() → For product analytics

// Analytics Calculation Functions (Lines 200-600)
- calculateSalesAnalytics() → Revenue trends, growth rate, avg order value
- calculateBranchAnalytics() → Per-branch revenue, order count, staff performance
- calculateCustomerAnalytics() → New vs returning, lifetime value, churn rate
- calculateOrderAnalytics() → Status distribution, fulfillment time, cancellation rate
- calculateLossAnalytics() → Cancelled orders, refunds, discounts, damages
- calculateDailyMetrics() → Day-over-day comparison
- calculateStaffPerformance() → Orders processed, avg processing time, ratings

// Export Functions (Lines 800-900)
- exportToPDF() → jsPDF with charts embedded as images
- exportToExcel() → XLSX library with multiple sheets
- generateReport() → Formatted report with insights
```

**Analytics Tabs:**
```javascript
// tabs array (Lines 68-74)
const tabs = [
  { id: 'sales', name: 'Sales Analytics', icon: <BarChart3 /> },
  { id: 'orders', name: 'Order Analysis', icon: <Package /> },
  { id: 'branches', name: 'Branch Performance', icon: <Building2 /> },
  { id: 'customers', name: 'Customer Insights', icon: <Users /> },
  { id: 'losses', name: 'Loss Analysis', icon: <TrendingDown /> },
];
```

**Features:**

**1. Sales Analytics Tab:**
- **Revenue Trends:**
  - LineChart with daily/weekly/monthly aggregation
  - Year-over-year comparison
  - Moving averages (7-day, 30-day)
- **Key Metrics:**
  - Total revenue (current period)
  - Revenue growth % vs previous period
  - Average order value (AOV)
  - Revenue per customer
  - Gross margin (future)
- **Charts:**
  - Revenue over time (LineChart)
  - Revenue by category (PieChart)
  - Revenue by branch (BarChart)
  - Payment method distribution (PieChart)
- **Filters:**
  - Date range selector (today, 7d, 30d, 90d, 1y, custom)
  - Branch filter (company_admin only)
  - Category filter
  - Payment method filter

**2. Order Analysis Tab:**
- **Order Metrics:**
  - Total orders
  - Orders by status (15 statuses)
  - Average fulfillment time
  - On-time delivery rate
  - Cancellation rate
- **Charts:**
  - Orders over time (AreaChart)
  - Status distribution (BarChart)
  - Fulfillment time histogram
  - Delivery preference distribution
- **Drill-Down Analysis:**
  - Click bar/pie slice to filter detailed table
  - Export filtered data
  - View individual order details
- **Service Type Analysis:**
  - Delivery vs Pickup orders
  - Express vs Standard delivery
  - Average delivery time per preference

**3. Branch Performance Tab:**
- **Branch Comparison:**
  - Revenue by branch (BarChart)
  - Order count by branch
  - Average order value by branch
  - Staff count and utilization
- **Branch-Specific Insights:**
  - Branch selector dropdown
  - Daily metrics for selected branch
  - Staff performance within branch
  - Capacity utilization %
- **Staff Performance:**
  - Orders processed per staff member
  - Average processing time
  - Customer ratings (future)
  - Attendance and punctuality (future)
- **Branch Metrics:**
  - Opening hours utilization
  - Peak hours analysis
  - Service type distribution
  - Customer feedback score

**4. Customer Insights Tab:**
- **Customer Segmentation:**
  - New customers (first order in period)
  - Returning customers (2+ orders)
  - Lapsed customers (no order in 90+ days)
  - VIP customers (top 10% by revenue)
- **Customer Metrics:**
  - Total active customers
  - New customer acquisition rate
  - Customer retention rate
  - Churn rate
  - Customer lifetime value (CLV)
- **Charts:**
  - Customer acquisition over time (LineChart)
  - Customer segments (PieChart)
  - Repeat purchase rate (BarChart)
  - Average orders per customer
- **RFM Analysis (Future):**
  - Recency: Days since last order
  - Frequency: Number of orders
  - Monetary: Total spend
  - RFM score calculation
  - Customer segmentation based on RFM

**5. Loss Analysis Tab:**
- **Loss Categories:**
  - Cancelled orders
  - Refunded orders
  - Damaged items
  - Discounts & coupons
  - Delivery issues
- **Loss Metrics:**
  - Total loss value
  - Loss as % of revenue
  - Loss by category
  - Loss by reason
  - Preventable vs non-preventable losses
- **Charts:**
  - Loss trends over time (LineChart)
  - Loss by category (PieChart)
  - Cancellation reasons (BarChart)
  - Refund reasons distribution
- **Actionable Insights:**
  - Top cancellation reasons
  - High-risk orders (predictive - future)
  - Staff with high cancellation rates
  - Branches with high loss rates

**Analytics Data Structures:**

**Sales Analytics Object:**
```javascript
{
  totalRevenue: number,
  revenueGrowth: number (percentage),
  avgOrderValue: number,
  revenuePerCustomer: number,
  dailyRevenueData: [
    { date: string, revenue: number, orders: number }
  ],
  categoryRevenue: [
    { name: string, value: number, percentage: number }
  ],
  branchRevenue: [
    { branchName: string, revenue: number, orders: number }
  ]
}
```

**Order Analytics Object:**
```javascript
{
  totalOrders: number,
  statusDistribution: {
    Pending: number,
    Confirmed: number,
    // ... 15 statuses
  },
  avgFulfillmentTime: number (hours),
  onTimeDeliveryRate: number (percentage),
  cancellationRate: number (percentage),
  deliveryVsPickup: { delivery: number, pickup: number },
  expressVsStandard: { express: number, standard: number }
}
```

**Branch Analytics Object:**
```javascript
{
  branches: [
    {
      branchId: string,
      branchName: string,
      revenue: number,
      orderCount: number,
      avgOrderValue: number,
      staffCount: number,
      capacityUtilization: number (percentage),
      topStaff: [
        { name: string, ordersProcessed: number, avgTime: number }
      ]
    }
  ]
}
```

**Customer Analytics Object:**
```javascript
{
  totalCustomers: number,
  newCustomers: number,
  returningCustomers: number,
  lapsedCustomers: number,
  vipCustomers: number,
  acquisitionRate: number,
  retentionRate: number,
  churnRate: number,
  avgCustomerLifetimeValue: number,
  avgOrdersPerCustomer: number,
  customerSegments: [
    { segment: string, count: number, revenue: number }
  ]
}
```

**Loss Analytics Object:**
```javascript
{
  totalLoss: number,
  lossAsPercentageOfRevenue: number,
  cancelledOrdersLoss: number,
  refundsLoss: number,
  damagesLoss: number,
  discountsLoss: number,
  lossReasons: [
    { reason: string, count: number, value: number }
  ]
}
```

**Business Rules:**
1. **Data Access:**
   - company_admin: All data
   - general_manager: All data
   - branch_manager: Own branch only (auto-filtered)
   - Others: No access to analytics
2. **Date Range Limits:**
   - Maximum: 2 years
   - Default: Last 30 days
   - Custom range picker available
3. **Export Limits:**
   - PDF: Max 1000 rows per report
   - Excel: Max 10,000 rows per sheet
   - Large datasets: Pagination or filtered export
4. **Real-Time Updates:**
   - Dashboard refreshes every 5 minutes (auto)
   - Manual refresh button available
   - Last updated timestamp displayed
5. **Performance Optimization:**
   - Aggregated data cached for 5 minutes
   - Firestore query limits (max 500 docs per query)
   - Client-side aggregation for small datasets
   - Server-side aggregation for large datasets (future: Cloud Functions)
6. **Chart Rendering:**
   - Responsive containers (auto-resize)
   - Recharts library for all visualizations
   - Export charts as images (PNG)
   - Print-friendly layouts

**Export Formats:**

**PDF Report Structure:**
```
┌────────────────────────────────────────┐
│        EASY2 LAUNDRY ANALYTICS         │
│      Period: 01/01/2024 - 31/01/2024  │
├────────────────────────────────────────┤
│ EXECUTIVE SUMMARY                      │
│ - Total Revenue: KWD 50,000            │
│ - Total Orders: 1,250                  │
│ - Avg Order Value: KWD 40              │
│ - Revenue Growth: +15%                 │
├────────────────────────────────────────┤
│ SALES ANALYTICS                        │
│ [Revenue Trend Chart - Image]          │
│                                         │
│ [Revenue by Category - Pie Chart]      │
├────────────────────────────────────────┤
│ BRANCH PERFORMANCE                     │
│ Branch A: KWD 20,000 (800 orders)      │
│ Branch B: KWD 18,000 (650 orders)      │
│ Branch C: KWD 12,000 (400 orders)      │
├────────────────────────────────────────┤
│ TOP INSIGHTS                           │
│ 1. Best selling category: Men's Wear   │
│ 2. Peak day: Saturday                  │
│ 3. Avg fulfillment: 2.5 days           │
└────────────────────────────────────────┘
```

**Excel Export Structure:**
```
Sheet 1: Executive Summary
Sheet 2: Daily Revenue Data
Sheet 3: Order Details
Sheet 4: Branch Performance
Sheet 5: Customer Data
Sheet 6: Loss Analysis
```

**UI Components:**
- Tab navigation (5 tabs)
- Date range picker (react-datepicker)
- Recharts: LineChart, AreaChart, BarChart, PieChart
- Framer Motion animations for tab transitions
- Export buttons (PDF, Excel)
- Filter dropdowns (branch, category, status)
- Loading spinners
- Empty states ("No data for selected period")
- Responsive grid layouts

**Users:** 
- **Full Access:** company_admin, general_manager (all branches)
- **Branch-Scoped:** branch_manager (own branch data only)
- **No Access:** cashier, delivery_man, pickup_man

**📘 Technical Reference:** TechnicalDoc.md → Section 7.9 (Analytics Module), Section 10 (Chart Libraries)  
**🗄️ Database Reference:** DatabaseInfo.md → All Collections (Analytics aggregates from all data)

---

---

### 2.10 Settings & Configuration ✅
**Purpose:** System-wide configuration and company profile management  
**File Location:** `/src/app/admin/settings/page.js` (348 lines)

**Core Functions & Hooks:**
```javascript
// Settings Management Functions (Lines 30-150)
- fetchSettings() → getDoc(doc(db, settingsDocRef))
- handleSaveInfo() → setDoc() for text fields (company info, FAQs, privacy)
- handleSaveLogo() → uploadToCloudinary() + setDoc() for logoUrl
- handleLogoChange() → File validation + preview generation
- handleRemoveLogo() → deleteFromCloudinary() + clear logoUrl
- parseJSON() → Validates FAQ JSON format
```

**Settings Document Path:**
```javascript
// Firestore path (Lines 11-14)
const settingsDocRef = doc(
  db,
  'Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/settings/general'
);
// Singleton document: Only one settings doc per company
```

**Features:**

**1. Company Profile Management:**
- **Company Information:**
  - Company name
  - Contact number
  - Email address
  - Physical address
- **Logo Management:**
  - Upload logo image (Cloudinary)
  - Preview before upload
  - Delete existing logo
  - Recommended size: 500x200 px
  - Supported formats: PNG, JPG, SVG
- **Save Actions:**
  - Separate "Save Info" button (text fields only)
  - Separate "Upload Logo" button (logo only)
  - Prevents accidental overwrites

**2. FAQ Management:**
- **FAQ Editor:**
  - JSON format input
  - Array of { question, answer } objects
  - Real-time preview (future)
  - Validation on save
- **FAQ Structure:**
```json
[
  {
    "question": "What are your operating hours?",
    "answer": "We operate 24/7 for pickup and delivery. Processing centers: 8 AM - 8 PM."
  },
  {
    "question": "Do you offer express service?",
    "answer": "Yes, express delivery available for +KWD 5. Next-day delivery guaranteed."
  }
]
```
- **Display:**
  - Customer-facing FAQ page renders from this data
  - Accordion UI component
  - Search functionality

**3. Privacy Policy Editor:**
- **Policy Editor:**
  - Large textarea for privacy policy text
  - Markdown support (future)
  - Character count display
  - Auto-save draft (future)
- **Version Control (Future):**
  - Track policy changes
  - Effective date
  - User acceptance tracking
- **Display:**
  - Dedicated privacy policy page
  - Required for GDPR compliance
  - Linked in footer and checkout

**4. Terms & Conditions (Future):**
- Similar to privacy policy editor
- Legal terms for service usage
- User acceptance required on signup

**Settings Data Structure:**
```javascript
{
  // Company Profile
  companyName: string,
  contactNumber: string,
  email: string,
  address: string,
  logoUrl: string (Cloudinary URL),
  
  // Customer-Facing Content
  faqs: string (JSON array of Q&A objects),
  privacyPolicy: string (long text),
  termsAndConditions: string (long text - future),
  
  // Operational Settings (Future)
  defaultWorkingHours: string,
  defaultDeliveryFee: number,
  expressDeliveryFee: number,
  taxRate: number,
  currency: 'KWD',
  
  // Notification Settings (Future)
  emailNotificationsEnabled: boolean,
  smsNotificationsEnabled: boolean,
  
  // Feature Flags (Future)
  enableGuestCheckout: boolean,
  enableCoupons: boolean,
  enableReviews: boolean,
  
  // Audit Trail
  createdAt: Timestamp,
  updatedAt: Timestamp,
  updatedBy: string (userId)
}
```

**Logo Upload Workflow:**
```
1. User clicks "Choose File" button
   ↓
2. File input triggered (ref: fileInputRef)
   ↓
3. handleLogoChange() validates file
   - Check file type (image/*)
   - Check file size (< 5MB)
   - Create preview URL: URL.createObjectURL(file)
   ↓
4. Preview displayed in UI
   ↓
5. User clicks "Upload Logo" button
   ↓
6. handleSaveLogo() executes:
   a. uploadToCloudinary(logoFile)
   b. Get secure_url from response
   c. Delete old logo (if exists)
   d. setDoc(settingsDocRef, { logoUrl: newUrl })
   ↓
7. Success toast notification
   ↓
8. Logo displayed across application:
   - Admin header
   - PDF receipts
   - Customer website header
   - Email templates
```

**Cloudinary Integration:**
```javascript
// /src/app/cloudinary.js
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Laundry');
  formData.append('folder', 'settings/logos'); // Organized folder
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dnf7pisvw/image/upload`,
    { method: 'POST', body: formData }
  );
  
  const data = await response.json();
  return data.secure_url;
}

export async function deleteFromCloudinary(publicId) {
  // Server-side only (requires API secret)
  // Future: Cloud Function to delete old logo
}
```

**Business Rules:**
1. **Access Control:**
   - Only company_admin can access /admin/settings
   - Other roles: Redirect to dashboard or 403 error
   - No delegation of settings permissions
2. **Singleton Pattern:**
   - Only one settings document per company
   - Document ID: 'general'
   - First time: Create document
   - Subsequent: Update existing document
3. **Logo Requirements:**
   - Accepted formats: PNG, JPG, JPEG, SVG, WebP
   - Max file size: 5 MB
   - Recommended dimensions: 500x200 px (2.5:1 ratio)
   - Transparent background recommended (PNG)
4. **FAQ Validation:**
   - Must be valid JSON
   - Array of objects with 'question' and 'answer' keys
   - Max 50 FAQs
   - Each answer max 500 characters
5. **Privacy Policy:**
   - Minimum 500 characters required
   - Last updated date auto-tracked
   - Version control (future)
6. **Audit Logging:**
   - updatedAt: Auto-set on every save
   - updatedBy: UserId of admin making changes
   - Change history (future: Firestore subcollection)
7. **Validation:**
   - Email: Must be valid format
   - Phone: International format validation
   - Address: Minimum 10 characters
   - All fields optional except companyName

**Form Validation:**
```javascript
// Validation logic (Lines 80-110)
const validateForm = () => {
  const errors = {};
  
  if (!form.companyName || form.companyName.trim().length < 3) {
    errors.companyName = 'Company name required (min 3 characters)';
  }
  
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (form.faqs) {
    try {
      const faqs = JSON.parse(form.faqs);
      if (!Array.isArray(faqs)) {
        errors.faqs = 'FAQs must be a JSON array';
      } else if (faqs.length > 50) {
        errors.faqs = 'Maximum 50 FAQs allowed';
      } else {
        faqs.forEach((faq, index) => {
          if (!faq.question || !faq.answer) {
            errors.faqs = `FAQ ${index + 1}: Missing question or answer`;
          }
        });
      }
    } catch (e) {
      errors.faqs = 'Invalid JSON format';
    }
  }
  
  return errors;
};
```

**UI Components:**
- Two-column layout (desktop), stacked (mobile)
- Left column: Company profile + logo
- Right column: FAQs + privacy policy
- Image upload with preview
- Large textareas for long content
- Save buttons with loading states
- Success/error toast notifications
- Lucide React icons (Upload, Trash2, Save)

**Settings Usage Across Application:**
```javascript
// Fetching settings in other components
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';

const settingsRef = doc(db, 'Easy2Solutions/.../settings/general');
const settingsSnap = await getDoc(settingsRef);
const settings = settingsSnap.data();

// Usage examples:
// 1. Admin Header: Display logo
<Image src={settings.logoUrl} alt={settings.companyName} />

// 2. PDF Receipt: Company info
doc.text(settings.companyName, 105, 20);
doc.text(settings.address, 105, 28);

// 3. Customer FAQ Page: Render FAQs
const faqs = JSON.parse(settings.faqs);
faqs.map(faq => <AccordionItem question={faq.question} answer={faq.answer} />)

// 4. Footer: Contact info
<p>Contact: {settings.contactNumber}</p>
<p>Email: {settings.email}</p>
```

**Future Enhancements:**
1. **Operational Settings:**
   - Default delivery fees
   - Tax rates configuration
   - Currency settings
   - Working hours presets
2. **Notification Templates:**
   - Email templates editor
   - SMS templates
   - WhatsApp message templates
3. **Feature Flags:**
   - Enable/disable modules
   - Guest checkout toggle
   - Review system toggle
4. **Theme Customization:**
   - Primary/secondary colors
   - Font selection
   - Layout preferences
5. **Integration Settings:**
   - Payment gateway credentials
   - SMS provider API keys
   - Email service configuration
6. **Backup & Export:**
   - Export all settings as JSON
   - Import settings from file
   - Restore previous versions

**Users:** company_admin only (exclusive access)

**📘 Technical Reference:** TechnicalDoc.md → Section 7.10 (Settings Management), Section 9 (Cloudinary Integration)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.13 (Settings Collection)

---

## 2.11 GLOBAL CONTEXTS & UTILITIES (System Foundation)

These are the core building blocks that power all admin and customer-facing features. Every module depends on these foundational components.

### Context Providers (State Management)

#### CartContext
**File Location:** `/src/app/context/CartContext.js` (174 lines)  
**Purpose:** Global shopping cart state with Firebase sync

**Core Functions:**
```javascript
// Cart Management (Lines 30-170)
- fetchCart(userId) → Fetches cart from Firestore or localStorage
- addToCart(item) → Adds/increments item quantity
- removeFromCart(itemId) → Removes item from cart
- updateQuantity(itemId, quantity) → Updates specific quantity
- clearCart() → Empties cart completely
- syncCartToFirestore() → Authenticated user cart sync
- syncCartFromLocalStorage() → Guest cart management
```

**Key Features:**
- **Dual Storage Strategy:**
  - Authenticated users: Firestore (`carts/{userId}`)
  - Guest users: localStorage (`cart` key)
- **Auto-Sync:** On auth state change, migrates localStorage → Firestore
- **Real-Time Updates:** `onSnapshot` for authenticated users
- **Cart Structure:**
```javascript
{
  items: [
    { id, name, price, quantity, image, categoryId, subcategoryId }
  ]
}
```

**Usage Example:**
```javascript
import { useCart } from '@/app/context/CartContext';

function ProductCard() {
  const { addToCart, cartCount } = useCart();
  
  return (
    <button onClick={() => addToCart(product)}>
      Add to Cart ({cartCount})
    </button>
  );
}
```

**📘 Technical Reference:** TechnicalDoc.md → Section 5.1 (CartContext Implementation)  
**🗄️ Database Reference:** DatabaseInfo.md → Section 2.14 (Carts Collection)

---

#### LanguageContext (Customer App)
**File Location:** `/src/app/context/LanguageContext.js` (33 lines)  
**Purpose:** Multi-language support for customer-facing pages

**Core Functions:**
```javascript
- changeLanguage(lang) → Switches language ('en' | 'ar')
- language → Current language state
```

**Key Features:**
- Languages: English (en), Arabic (ar)
- Persistence: localStorage (`language` key)
- RTL Support: Auto-sets `document.documentElement.dir`
- Translation files: `/locales/en.json`, `/locales/ar.json`

**Usage Example:**
```javascript
import { useLanguage } from '@/app/context/LanguageContext';

function LanguageToggle() {
  const { language, changeLanguage } = useLanguage();
  
  return (
    <button onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}>
      {language === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
```

---

#### AdminLanguageContext
**File Location:** `/src/app/context/AdminLanguageContext.js` (38 lines)  
**Purpose:** Multi-language support for admin panel (separate from customer)

**Core Functions:**
```javascript
- changeLanguage(lang) → Switches admin language
- language → Current admin language state
```

**Key Features:**
- Independent from customer language preference
- Persistence: localStorage (`adminLang` key)
- RTL Support: Auto-sets `dir` and `lang` attributes
- Same translation files as customer app

**Usage Example:**
```javascript
import { useAdminLanguage } from '@/app/context/AdminLanguageContext';

function AdminHeader() {
  const { language, changeLanguage } = useAdminLanguage();
  
  return (
    <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  );
}
```

---

### Custom Hooks (Utilities)

#### useTranslation (Customer App)
**File Location:** `/src/app/utils/useTranslation.js` (23 lines)  
**Purpose:** Translation helper for customer pages

**Core Function:**
```javascript
const { t } = useTranslation();

// Usage: t('key.nested.path')
// Example: t('home.welcome') → "Welcome to EASY2 Laundry"
```

**Translation File Structure:**
```json
// /locales/en.json
{
  "home": {
    "welcome": "Welcome to EASY2 Laundry",
    "tagline": "Professional Laundry Services"
  },
  "cart": {
    "addToCart": "Add to Cart",
    "checkout": "Proceed to Checkout"
  }
}
```

**Key Features:**
- Nested key support: `t('home.welcome')`
- Fallback: Returns key if translation missing
- Type-safe with JSON schema
- Supports 2 languages: EN, AR

---

#### useAdminTranslation
**File Location:** `/src/app/utils/useAdminTranslation.js` (10 lines)  
**Purpose:** Translation helper for admin pages

**Core Function:**
```javascript
const { t, language } = useAdminTranslation();

// Returns both translation function and current language
```

**Usage Example:**
```javascript
import { useAdminTranslation } from '@/app/utils/useAdminTranslation';

function Dashboard() {
  const { t } = useAdminTranslation();
  
  return (
    <h1>{t('dashboard.title')}</h1>
    <p>{t('dashboard.orders')}: {orderCount}</p>
  );
}
```

---

#### useFirestorePaths
**File Location:** `/src/app/utils/firestorePaths.js` (100 lines)  
**Purpose:** Centralized Firestore path management for multi-tenant architecture

**Core Functions:**
```javascript
// Path Generators (Lines 10-98)
- getProductPath() → Returns products collection path
- getCategoryPath() → Returns categories path
- getOrdersPath() → Returns orders path
- getUserCartPath(userId) → Returns user-specific cart path
- getTenantUsersPath() → Returns users path for current company
- getSettingsPath() → Returns settings document path
// ... 25+ path helpers total
```

**Multi-Tenant Path Structure:**
```javascript
// Base path
Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/

// Collection paths
- users
- products
- categories
- subcategories
- orders
- carts
- branches
- states
- areas
- clusters
- coupons
- contactUs
- settings/general
```

**Usage Example:**
```javascript
import { useFirestorePaths } from '@/app/utils/firestorePaths';

function OrdersList() {
  const { getOrdersPath, getSingleOrderPath } = useFirestorePaths();
  
  // Fetch all orders
  const ordersRef = collection(db, getOrdersPath());
  
  // Fetch single order
  const orderRef = doc(db, getSingleOrderPath(orderId));
}
```

**Key Features:**
- Company ID from environment variable: `NEXT_PUBLIC_COMPANY_ID`
- Memoized paths (performance optimization)
- Type-safe path generation
- Supports nested paths (e.g., user addresses, cart items)
- Future-proof: Easy to add new collections

**📘 Technical Reference:** TechnicalDoc.md → Section 4.3 (Firestore Paths Pattern)

---

### Utility Functions

#### utils.js
**File Location:** `/src/app/utils/utils.js`  
**Purpose:** General-purpose helper functions (future)

**Planned Functions:**
```javascript
- formatCurrency(amount) → Formats KWD currency
- formatDate(timestamp) → Formats Firestore timestamps
- calculateDistance(lat1, lon1, lat2, lon2) → Haversine distance
- generateOrderId() → Creates unique order IDs
- validatePhone(phone) → Kuwait phone validation
- validateEmail(email) → Email format validation
```

---

### Global Layout Wrappers

#### RootLayout
**File Location:** `/src/app/layout.js` (45 lines)  
**Purpose:** Root layout wrapper with all context providers

**Provider Hierarchy:**
```javascript
<html>
  <body>
    <LanguageProvider>           // Customer language
      <CartProvider>             // Shopping cart
        <AdminLanguageProvider>  // Admin language
          {children}
        </AdminLanguageProvider>
      </CartProvider>
    </LanguageProvider>
  </body>
</html>
```

**Key Features:**
- Geist font family (variable fonts)
- Global CSS imports
- Metadata configuration
- Provider nesting order matters

---

#### AdminLayout
**File Location:** `/src/app/admin/AdminLayout.js`  
**Purpose:** Admin panel layout wrapper

**Components:**
- AdminHeader (top navigation)
- AdminSidebar (left navigation)
- Main content area
- Role-based menu items
- Logout functionality

**Usage:**
```javascript
import AdminLayout from '../AdminLayout';

export default function AdminPage() {
  return (
    <AdminLayout>
      <h1>Page Content</h1>
    </AdminLayout>
  );
}
```

---

#### RoleBasedRedirect
**File Location:** `/src/app/admin/components/RoleBasedRedirect.js` (28 lines)  
**Purpose:** Auto-redirect users based on role

**Role Default Routes:**
```javascript
const roleDefaults = {
  company_admin: '/admin/dashboard',
  general_manager: '/admin/dashboard', 
  branch_manager: '/admin/dashboard',
  cashier: '/admin/billing',
  delivery_man: '/admin/orders',
  pickup_man: '/admin/orders',
};
```

**Usage:**
```javascript
// /src/app/admin/page.js
import RoleBasedRedirect from './components/RoleBasedRedirect';

export default function AdminIndex() {
  return <RoleBasedRedirect />;
}
```

**📘 Technical Reference:** TechnicalDoc.md → Section 6.3 (Role-Based Redirect Logic)

---

### Firebase Configuration

#### firebase.js
**File Location:** `/src/app/firebase.js`  
**Purpose:** Firebase initialization and exports

**Exports:**
```javascript
export { db };              // Firestore database instance
export { auth };            // Firebase Auth instance
export { storage };         // Firebase Storage instance
export { analytics };       // Firebase Analytics instance
export { performance };     // Firebase Performance monitoring
```

**Configuration:**
```javascript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: `${projectId}.firebaseapp.com`,
  // ... other config
};
```

**📘 Technical Reference:** TechnicalDoc.md → Section 3 (Firebase Configuration)

---

#### cloudinary.js
**File Location:** `/src/app/cloudinary.js`  
**Purpose:** Cloudinary upload/delete helpers

**Functions:**
```javascript
export async function uploadToCloudinary(file);
export async function deleteFromCloudinary(publicId);
```

**Configuration:**
- Cloud name: `dnf7pisvw`
- Upload preset: `Laundry`

**📘 Technical Reference:** TechnicalDoc.md → Section 9 (Cloudinary Integration)

---

### Translation Files

#### English Translations
**File Location:** `/locales/en.json`  
**Structure:** Nested JSON with dot-notation keys

#### Arabic Translations
**File Location:** `/locales/ar.json`  
**Structure:** Same keys as English with Arabic values

**Coverage:**
- Customer pages: Home, products, cart, checkout, contact
- Admin pages: Dashboard, orders, users, settings
- Common: Buttons, labels, errors, success messages

---

## 3. FUTURE MODULES (Super Module Vision)

### 3.1 Advanced POS System 🆕
**Enhancements:**
- Multi-payment: Cash, Card, UPI, Wallet
- Split payments
- Receipt printer integration (thermal)
- Barcode scanning for items
- Customer display (dual-screen)
- Cash drawer integration
- Shift management: opening/closing balance reconciliation
- Discount authorization workflow
- Loyalty points redemption at POS
- Returns & refunds processing
- GST/VAT compliant invoicing
- Payment gateway: card terminal, QR codes

---

### 3.2 Inventory Management System 🆕
**Purpose:** Track chemicals, packaging, equipment

**Item Categories:**
- Detergents & chemicals (powder, bleach, softener, starch)
- Packaging (hangers, bags, covers, tags)
- Equipment spare parts (belts, filters, elements)
- Office supplies (receipt paper, pens)
- Staff uniforms

**Features:**
- Real-time stock levels per branch
- Supplier management: vendors, POs, delivery tracking
- Stock adjustments: damage, loss, theft, usage
- Reorder point alerts: auto-generate POs
- Batch tracking: expiry dates, batch numbers
- Stock transfer: inter-branch with approval
- Physical count: variance reconciliation (expected vs. actual)
- Usage reports: consumption per order (e.g., 50ml detergent per kg)

**Transactions:**
- Stock In: purchases, returns, transfers
- Stock Out: usage, damage, theft, transfers
- Adjustments: physical count, write-offs

**Business Rules:**
- No negative stock (validation)
- FIFO for consumables
- Transfers require dual approval
- Variance > 5% triggers audit
- Auto usage calculation per order

---

### 3.3 Accounting & Financial Management 🆕
**Purpose:** Complete financial control

**Features:**
- **General Ledger:** Chart of accounts
- **AR:** Customer credit, aging reports
- **AP:** Supplier payments, aging
- **Bank Reconciliation:** Multi-bank support
- **Expense Management:** Staff expenses, reimbursements
- **Payroll Integration:** Salary processing
- **Tax Management:** GST/VAT compliance
- **Financial Reports:** P&L, Balance Sheet, Cash Flow, Trial Balance
- **Multi-currency:** FX handling
- **Petty Cash:** Branch-wise tracking

**Reports:**
- Profit & Loss
- Balance Sheet
- Cash Flow Statement
- Aging Reports (AR/AP)
- Expense Analysis
- Revenue by Branch/Service
- Tax Reports (GST returns)

**Business Rules:**
- Double-entry bookkeeping
- Period close prevents backdating
- Monthly bank reconciliation mandatory
- Expense approval workflow
- Auto tax calculation
- Multi-level approval for large expenses

---

### 3.4 HR Management System 🆕
**Purpose:** Complete employee lifecycle

**Features:**
- **Employee Database:** Personal & professional details
- **Attendance:** Biometric integration, leave tracking
- **Shift Scheduling:** Branch-wise rosters
- **Performance Management:** KPIs, reviews, appraisals
- **Training:** Onboarding, skill development
- **Document Management:** Contracts, certificates, IDs
- **Payroll:** Salary calculation, deductions, bonuses
- **Recruitment:** Job postings, applicant tracking

**Business Rules:**
- Attendance: mobile app or biometric
- Leave approval: manager → HR
- Overtime per labor laws
- Performance review quarterly
- Payroll monthly (configurable)
- Document expiry alerts

---

### 3.5 Fleet & Logistics Management 🆕
**Purpose:** Delivery optimization

**Features:**
- **Vehicle Management:** Fleet DB, maintenance schedules
- **Route Optimization:** AI-powered routing
- **Driver Management:** Assignment, performance
- **Fuel Management:** Consumption tracking
- **GPS Tracking:** Real-time location
- **Delivery Scheduling:** Time slots
- **Proof of Delivery:** Photos, signatures, timestamps
- **Maintenance:** Service schedules, repair logs

**Business Rules:**
- Capacity validation before assignment
- Driver hours compliance (max 8hrs/day)
- GPS tracking every 5 minutes
- Fuel variance alerts (> 10%)
- Maintenance alerts 7 days advance
- Time slot adherence (± 30 min)

---

### 3.6 CRM (Customer Relationship Management) 🆕
**Purpose:** Customer engagement & loyalty

**Features:**
- **Customer Database:** Complete profiles
- **Interaction History:** All touchpoints logged
- **Loyalty Programs:** Points, tiers, rewards
- **Marketing Campaigns:** SMS, Email, WhatsApp broadcasts
- **Segmentation:** RFM analysis (Recency, Frequency, Monetary)
- **Feedback Management:** Ratings, reviews, surveys
- **Complaint Management:** Issue tracking, resolution
- **Automated Promotions:** Birthday/anniversary offers

**Business Rules:**
- Customer consent for marketing (GDPR)
- Points earned per order value
- Point redemption limits
- Customer tiers: Bronze, Silver, Gold, Platinum
- Inactive customer re-engagement
- Complaint resolution SLA: 24-48 hours

---

### 3.7 Franchise Management Module 🆕
**Purpose:** Multi-franchise oversight

**Features:**
- **Franchise Master:** DB & agreements
- **Royalty Management:** Fee calculation, collection
- **Performance Monitoring:** Franchise-wise metrics
- **Brand Compliance:** Quality audits
- **Training Portal:** Resources for franchisees
- **Inventory Distribution:** Central to franchises
- **Settlement Management:** Commission calculations
- **Communication Portal:** HQ ↔ Franchise

---

## 4. MIGRATION STRATEGY: Firebase → Node.js + MySQL

### Phase 1: Preparation (Month 1-2)
**Tasks:**
- Document all Firestore collections (see Database Document)
- Design MySQL schemas with relationships
- Build Node.js REST API architecture
- Implement JWT authentication
- Create data migration scripts

### Phase 2: Parallel Running (Month 3-4)
**Tasks:**
- Run both systems simultaneously
- Dual writes to Firebase + MySQL
- Compare data consistency
- Monitor performance
- User acceptance testing

### Phase 3: Gradual Migration (Month 5-6)
**Tasks:**
- Migrate read operations to REST APIs
- Validate data integrity
- Monitor error rates
- Performance optimization
- Staff training

### Phase 4: Complete Switch (Month 7)
**Tasks:**
- Switch all operations to new system
- Retire Firebase connections
- Optimize MySQL queries
- Final performance tuning
- Production monitoring

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### 5.1 Performance
- Page load: < 2 seconds
- API response: < 500ms
- DB query: < 100ms
- Image load: < 1 second
- Concurrent users: 1000+

### 5.2 Security
- HTTPS/SSL encryption
- JWT token-based auth
- Role-based access control (RBAC)
- Data encryption at rest
- Regular security audits
- GDPR compliance
- PCI DSS (for payments)

### 5.3 Scalability
- Horizontal scaling
- Load balancing
- DB replication
- CDN for static assets
- Microservices (future)

### 5.4 Availability
- 99.9% uptime SLA
- Daily automated backups
- Disaster recovery plan
- Failover mechanisms
- 24/7 monitoring

### 5.5 Usability
- Intuitive UI/UX
- Mobile responsive
- Multi-language: EN, AR (future: FR, ES, HI)
- WCAG 2.1 accessibility
- Keyboard navigation

---

## 6. INTEGRATION REQUIREMENTS

### 6.1 Current Integrations
- Firebase Auth (Phone OTP, Google)
- Firestore (real-time DB)
- Cloudinary (image storage)
- Framer Motion (animations)
- Recharts (charts)

### 6.2 Future Integrations
- **Payment:** Stripe, Razorpay, PayPal
- **SMS:** Twilio, MSG91, AWS SNS
- **Email:** SendGrid, AWS SES
- **WhatsApp Business API**
- **Accounting:** QuickBooks, Xero
- **Biometric:** Attendance systems
- **GPS:** Vehicle tracking
- **ERP:** SAP, Oracle (enterprise)

---

## 7. COMPLIANCE & REGULATORY

### 7.1 Data Protection
- GDPR (Europe)
- CCPA (California)
- Data retention policies
- Right to erasure

### 7.2 Financial Compliance
- Tax regulations (GST, VAT)
- AML checks
- Financial reporting standards
- Audit trail

### 7.3 Industry Standards
- ISO 27001 (Information Security)
- ISO 9001 (Quality Management)
- PCI DSS (Payment Card Industry)

---

## 8. RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data migration failure | High | Medium | Extensive testing, rollback plan |
| API performance issues | High | Medium | Load testing, caching |
| Integration failures | Medium | High | Fallback mechanisms |
| Security breaches | High | Low | Penetration testing |
| User resistance | Medium | High | Training, phased rollout |
| Budget overruns | High | Medium | Agile, MVP approach |

---

## 9. TIMELINE & MILESTONES

### Current System (✅ Completed)
- Customer-facing website
- Basic admin panel
- Order management
- User management
- Product management
- Geographic setup

### Phase 1: Foundation (3 months)
- Month 1: DB design + API architecture
- Month 2: Core APIs (Auth, Orders, Products)
- Month 3: Admin UI migration to APIs

### Phase 2: Enhanced Modules (4 months)
- Month 4: Inventory management
- Month 5: Accounting basics
- Month 6: Advanced POS
- Month 7: CRM module

### Phase 3: Advanced Features (5 months)
- Month 8-9: HR management
- Month 10-11: Fleet & logistics
- Month 12: Franchise management

### Phase 4: Enterprise (Ongoing)
- Advanced analytics & BI
- AI/ML features (forecasting, optimization)
- Mobile apps (iOS + Android)
- IoT integrations (smart lockers)

---

## 10. BUDGET ESTIMATION (Future System)

### Development Costs
- Backend (Node.js): 4 devs × 6 months
- Frontend (Admin): 2 devs × 4 months
- DB design/migration: 1 specialist × 2 months
- QA: 2 testers × 6 months
- DevOps: 1 engineer × ongoing

### Infrastructure (Monthly)
- Cloud hosting (AWS/Azure): $500-2000
- MySQL managed: $200-500
- CDN & storage: $100-300
- Monitoring: $50-150
- Backup & DR: $100-200

### Third-party (Monthly)
- Payment gateway: 2-3% of transactions
- SMS: $0.02-0.05 per SMS
- Email: $50-200
- WhatsApp API: $100-500
- GPS tracking: $5-10 per vehicle

---

## 11. GLOSSARY

- **COD:** Cash on Delivery
- **OMS:** Order Management System
- **POS:** Point of Sale
- **CRM:** Customer Relationship Management
- **ERP:** Enterprise Resource Planning
- **RFM:** Recency, Frequency, Monetary (segmentation)
- **FIFO:** First In First Out (inventory)
- **SLA:** Service Level Agreement
- **JWT:** JSON Web Token
- **RBAC:** Role-Based Access Control
- **AR:** Accounts Receivable
- **AP:** Accounts Payable
- **P&L:** Profit & Loss
- **KPI:** Key Performance Indicator

---

## 12. REFERENCES

- Firebase Documentation
- Node.js Best Practices
- MySQL Performance Tuning
- REST API Design Guidelines
- GDPR Compliance
- PCI DSS Standards

---

## 13. DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-19 | System Architect | Initial BRD for laundry admin super module |

---

**Document Owner:** Product Management  
**Approval Required:** CTO, CEO, CFO  
**Next Review:** 2026-03-19

---

**END OF BUSINESS REQUIREMENTS DOCUMENT**

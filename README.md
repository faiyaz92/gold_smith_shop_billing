# EASY2-LAUNDRY Project Documentation

## Project Overview
This is a Next.js-based laundry service e-commerce web application with separate admin and user interfaces. The app supports multi-language (English/Arabic), real-time order tracking, and comprehensive laundry management features.

**Technology Stack:**
- **Frontend:** Next.js 15.4.5, React 19.1.0, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **PDF Generation:** jsPDF
- **Image Hosting:** Cloudinary
- **Internationalization:** next-intl
- **Icons:** Lucide React, React Icons

## Complete Firestore Database Architecture

### Root Structure
```
Easy2Solutions/
└── companyDirectory/
    └── tenantCompanies/
        └── {companyId}/
            ├── users/
            ├── products/
            ├── categories/
            ├── subcategories/
            ├── orders/
            ├── branches/
            ├── areas/
            ├── states/
            ├── clusters/
            ├── coupons/
            ├── contactUs/
            ├── carts/
            └── billing/
```

### Detailed Collection Schemas

#### 1. Users Collection (`users/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/users/{firebaseUid}`

**Data Model:**
```javascript
{
  // Core Fields
  firebaseUid: "string", // Firebase Auth UID (document ID)
  name: "string",
  email: "string",
  phone: "string",
  userType: "customer" | "staff",

  // Staff-specific fields (only if userType === "staff")
  role: "company_admin" | "general_manager" | "branch_manager" | "cashier" | "delivery_man" | "pickup_man",
  branchId: "string", // Reference to branches collection
  status: "active" | "inactive" | "suspended",

  // Optional fields
  notes: "string",

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLogin: Timestamp,
  createdBy: "string" // UID of creator
}
```

**CRUD Logic:**
- **Create:** Only `company_admin` can create users. Creates Firebase Auth account first, then Firestore document.
- **Read:** Role-based filtering (company_admin sees all, others see limited data).
- **Update:** company_admin can update all fields, others can only update their own profile.
- **Delete:** Only company_admin can delete users (cannot delete themselves or other company_admins).

#### 2. Products Collection (`products/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/products/{productId}`

**Data Model:**
```javascript
{
  // Core Fields
  name: "string",
  price: number,
  discountedPrice: number, // Optional
  image: "string", // Cloudinary URL
  categoryId: "string", // Reference to categories collection
  subcategoryId: "string", // Optional reference to subcategories

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "string", // UID of creator
  isActive: boolean // Default: true
}
```

**CRUD Logic:**
- **Create:** Upload image to Cloudinary, store URL in Firestore.
- **Read:** Filter by category/subcategory, join with category names.
- **Update:** Handle image replacement (delete old from Cloudinary, upload new).
- **Delete:** Remove image from Cloudinary, delete Firestore document.

#### 3. Categories Collection (`categories/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/categories/{categoryId}`

**Data Model:**
```javascript
{
  categoriesname: "string", // Note: inconsistent naming
  categoriesimage: "string", // Cloudinary URL
  sortOrder: number, // For display ordering
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Logic:** Hierarchical parent for subcategories and products.

#### 4. Subcategories Collection (`subcategories/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/subcategories/{subcategoryId}`

**Data Model:**
```javascript
{
  name: "string",
  image: "string", // Cloudinary URL
  categoryId: "string", // Reference to parent category
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Logic:** Child of categories, parent of products in hierarchy.

#### 5. Orders Collection (`orders/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/orders/{orderId}`

**Data Model:**
```javascript
{
  // Customer Info
  customerName: "string",
  customerEmail: "string",
  customerPhone: "string",
  customerAddress: "string",

  // Order Details
  items: [
    {
      id: "string",
      name: "string",
      price: number,
      quantity: number,
      categoryName: "string",
      subcategoryName: "string"
    }
  ],
  total: number,
  subtotal: number,
  discount: number, // From coupons
  expressDeliveryFee: number, // 5 KWD if express

  // Status & Workflow (15 stages)
  status: "Pending" | "Confirmed" | "Scheduled for Pickup" | "Out for Pickup" |
          "Picked Up" | "Received at Facility" | "In Sorting/Inspection" |
          "In Washing" | "In Drying" | "In Ironing/Pressing" |
          "In Folding/Packaging" | "Quality Check" | "Ready for Delivery" |
          "Out for Delivery" | "Delivered",

  // Scheduling
  pickupTime: "morning" | "afternoon" | "evening",
  deliveryPreference: "standard" | "express",
  serviceType: "delivery" | "pickup",

  // Assignments
  orderTakenBy: "string", // UID of cashier/staff
  assignedDeliveryPerson: "string", // Name of delivery person
  assignedPickupPerson: "string", // Name of pickup person
  branchId: "string", // Assigned branch

  // Location (from checkout)
  stateId: "string",
  areaId: "string",
  clusterId: "string",

  // Coupons
  appliedCoupon: {
    code: "string",
    type: "percentage" | "fixed",
    value: number,
    discount: number
  },

  // Timestamps
  timestamp: Timestamp, // Order creation time
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Metadata
  paymentMethod: "cod", // Currently only COD supported
  notes: "string",
  orderNumber: "string" // Auto-generated
}
```

**Business Logic:**
- **Status Progression:** 15-stage laundry workflow with role-based status updates.
- **Role-based Filtering:** Different roles see different order subsets.
- **Real-time Updates:** Firestore listeners for live status changes.
- **PDF Generation:** Receipts with order details and items.

#### 6. Branches Collection (`branches/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/branches/{branchId}`

**Data Model:**
```javascript
{
  // Basic Info
  name: "string",
  type: "main" | "pickup" | "processing" | "delivery",
  address: "string",
  city: "string",
  area: "string",
  zipCode: "string",

  // Contact
  phone: "string",
  whatsapp: "string",
  email: "string",

  // Operations
  workingHours: "string",
  customHours: "string", // If workingHours === "custom"
  managerName: "string",
  managerPhone: "string",
  capacity: "string", // Processing capacity

  // Services
  services: ["string"], // Array of services offered
  hasPickup: boolean,
  hasDelivery: boolean,

  // Location
  latitude: number,
  longitude: number,

  // Status
  isActive: boolean,
  maintenance: boolean,

  // Metadata
  notes: "string",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 7. Geographic Hierarchy Collections

**States Collection (`states/`):**
```javascript
{
  name: "string",
  isActive: boolean,
  createdAt: Timestamp
}
```

**Areas Collection (`areas/`):**
```javascript
{
  name: "string",
  stateId: "string", // Reference to states
  isActive: boolean,
  createdAt: Timestamp
}
```

**Clusters Collection (`clusters/`):**
```javascript
{
  name: "string",
  description: "string",
  areaIds: ["string"], // Array of area IDs
  branchId: "string", // Assigned branch
  isActive: boolean,
  createdAt: Timestamp
}
```

#### 8. Coupons Collection (`coupons/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/coupons/{couponId}`

**Data Model:**
```javascript
{
  // Basic Info
  code: "string", // Unique coupon code
  name: "string",
  description: "string",

  // Discount Rules
  type: "percentage" | "fixed" | "free_delivery" | "bogo",
  value: number, // Percentage or fixed amount
  minimumOrderValue: number,
  maximumDiscount: number, // For percentage coupons

  // Usage Limits
  usageLimit: "unlimited" | "once_per_user" | "limited_total",
  totalUsageLimit: number, // If usageLimit === "limited_total"

  // Validity Period
  validFrom: Timestamp,
  validUntil: Timestamp,

  // Status
  isActive: boolean,

  // Category Restrictions
  applicableCategories: ["string"], // Category IDs
  excludedCategories: ["string"], // Category IDs

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "string"
}
```

**Logic:** Complex discount calculations with category restrictions and usage tracking.

#### 9. Contact/Inquiries Collection (`contactUs/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/contactUs/{inquiryId}`

**Data Model:**
```javascript
{
  name: "string",
  email: "string",
  phone: "string", // Optional
  purpose: "string",
  message: "string",
  status: "pending" | "working" | "processing" | "solved" | "cancelled" | "close with fail" | "close with success",
  timestamp: Timestamp
}
```

#### 10. Carts Collection (`carts/`)
**Path:** `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}/carts/{userId}`

**Data Model:**
```javascript
{
  items: [
    {
      id: "string",
      name: "string",
      price: number,
      quantity: number,
      categoryName: "string",
      subcategoryName: "string",
      image: "string"
    }
  ]
}
```

**Logic:** Separate collection for authenticated users, localStorage for guests.

## Authentication & Authorization Logic

### Firebase Auth Integration
- **Phone OTP:** For customers using Firebase RecaptchaVerifier
- **Google Sign-in:** Alternative authentication method
- **Email/Password:** For admin/staff accounts

### Role-Based Access Control (RBAC)
```javascript
const ROLE_PERMISSIONS = {
  company_admin: {
    canCreateUsers: true,
    canDeleteUsers: true,
    canManageAllBranches: true,
    canViewAllOrders: true,
    canManageCoupons: true,
    canManageProducts: true,
    canViewAnalytics: true
  },
  general_manager: {
    canManageAssignedBranch: true,
    canViewBranchOrders: true,
    canManageBranchStaff: true
  },
  branch_manager: {
    canManageBranchOperations: true,
    canAssignOrders: true,
    canViewBranchAnalytics: true
  },
  cashier: {
    canTakeOrders: true,
    canProcessPayments: true,
    redirectTo: "/admin/billing"
  },
  delivery_man: {
    canUpdateDeliveryStatus: true,
    canViewAssignedOrders: true,
    redirectTo: "/admin/orders"
  },
  pickup_man: {
    canUpdatePickupStatus: true,
    canViewAssignedOrders: true,
    redirectTo: "/admin/orders"
  }
};
```

### Authentication Flow
1. **Login Attempt:** Validate credentials against Firestore user records
2. **Role Verification:** Check user role and status
3. **Permission Check:** Redirect based on role permissions
4. **Session Management:** Store user data in localStorage
5. **Auto-logout:** Clear session on logout or invalid auth

## Business Logic Workflows

### 1. Order Creation & Processing
```
Customer Checkout → Order Created (Pending)
    ↓
Cashier/Staff Confirms → Confirmed
    ↓
Scheduled for Pickup → Out for Pickup → Picked Up
    ↓
Received at Facility → Sorting/Inspection
    ↓
Washing → Drying → Ironing/Pressing → Folding/Packaging
    ↓
Quality Check → Ready for Delivery → Out for Delivery → Delivered
```

### 2. Cart Management
- **Guest Users:** localStorage persistence
- **Authenticated Users:** Firestore `carts/{userId}` collection
- **Sync Logic:** Merge guest cart with user cart on login
- **Real-time Updates:** Cart count updates across components

### 3. Location-Based Services
```
State Selection → Area Filtering → Branch Assignment → Cluster Mapping
```
- **Hierarchical Selection:** State → Area → Branch
- **Service Availability:** Check branch capabilities (pickup/delivery)
- **Geographic Coverage:** Clusters group areas under branches

### 4. Coupon System
- **Validation:** Check expiry, usage limits, minimum order value
- **Calculation:** Percentage vs fixed amount discounts
- **Restrictions:** Category-based inclusion/exclusion
- **Tracking:** Usage count per user and total

### 5. Analytics & Reporting
- **Real-time Metrics:** Live data from Firestore listeners
- **Date Range Filtering:** Customizable time periods
- **Role-based Data:** Branch managers see only their branch data
- **Export Capabilities:** PDF reports and Excel downloads

## Component Architecture

### Context Providers
```javascript
// App-level providers (layout.js)
<LanguageProvider>
  <CartProvider>
    <AdminLanguageProvider>
      <App />
    </AdminLanguageProvider>
  </CartProvider>
</LanguageProvider>
```

### Component Hierarchy
```
App (layout.js)
├── User Interface (page.js)
│   ├── Navbar
│   ├── Categories (horizontal + sidebar)
│   ├── Products (with filtering)
│   ├── Cart (mobile + desktop)
│   ├── Footer
│   └── Modals (About, Contact)
│
└── Admin Interface (AdminLayout)
    ├── AdminHeader (with sidebar toggle)
    ├── AdminSidebar (navigation menu)
    └── Admin Pages (dashboard, orders, etc.)
```

### State Management Flow
- **Local State:** useState for component-specific state
- **Context State:** CartContext, LanguageContext for global state
- **Persistent State:** localStorage for user preferences
- **Server State:** Firestore for data persistence

## Utility Functions & Helpers

### Translation System (`useTranslation.js`)
```javascript
const useTranslation = () => {
  const { language } = useLanguage();
  const messages = language === 'ar' ? ar : en;
  return { t: (key) => messages[key] || key, language };
};
```

### Firebase Operations
- **Real-time Listeners:** onSnapshot for live data updates
- **Batch Operations:** writeBatch for atomic updates
- **Error Handling:** Try-catch blocks with user feedback
- **Data Transformation:** Converting Firestore Timestamps to Dates

### Image Management (`cloudinary.js`)
- **Upload:** File validation, Cloudinary API integration
- **Delete:** Public ID extraction and deletion
- **Optimization:** Automatic image optimization

### Date & Time Utilities
- **Formatting:** Localized date/time display
- **Calculations:** Date range filtering, relative time
- **Validation:** Date picker constraints

## API Integration Patterns

### Firestore Query Patterns
```javascript
// Real-time listeners
const unsubscribe = onSnapshot(query(collection(db, path), orderBy('createdAt')), callback);

// Filtered queries
const q = query(collection(db, ordersPath), where('branchId', '==', branchId));

// Complex queries with multiple conditions
const complexQuery = query(
  collection(db, ordersPath),
  where('status', '==', 'Pending'),
  where('branchId', '==', branchId),
  orderBy('timestamp', 'desc')
);
```

### CRUD Operations
```javascript
// Create
const docRef = await addDoc(collection(db, path), data);

// Read
const docSnap = await getDoc(doc(db, path, id));

// Update
await updateDoc(doc(db, path, id), updates);

// Delete
await deleteDoc(doc(db, path, id));
```

## Error Handling & Validation

### Client-side Validation
- **Form Validation:** Required fields, data types, format checking
- **Business Rules:** Role permissions, status transitions
- **User Feedback:** Toast notifications, error messages

### Server-side Validation (Firestore Rules)
- **Security Rules:** User authentication, data access control
- **Data Integrity:** Required fields, data type validation
- **Business Logic:** Status transition validation

### Error Recovery
- **Network Errors:** Retry mechanisms, offline handling
- **Auth Errors:** Token refresh, re-authentication
- **Data Errors:** Fallback values, error boundaries

## Performance Optimizations

### Data Fetching
- **Real-time Updates:** Firestore listeners for live data
- **Pagination:** Limit query results for large datasets
- **Caching:** localStorage for frequently accessed data

### Rendering
- **Code Splitting:** Dynamic imports for admin pages
- **Image Optimization:** Next.js Image component with Cloudinary
- **Lazy Loading:** Components loaded on demand

### Bundle Optimization
- **Tree Shaking:** Unused code elimination
- **Compression:** Gzip compression for assets
- **Caching:** Browser caching strategies

## Deployment & Environment

### Environment Variables
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
NEXT_PUBLIC_CLOUDINARY_API_KEY=...
NEXT_PUBLIC_CLOUDINARY_API_SECRET=...

# App Config
NEXT_PUBLIC_COMPANY_ID=...
```

### Build Process
- **Development:** Turbopack for fast development
- **Production:** Next.js optimized build
- **Deployment:** Vercel platform with automatic deployments

This comprehensive documentation provides everything needed to understand, maintain, and extend the EASY2-LAUNDRY application. The modular architecture and detailed Firestore schemas make it easy for developers to quickly grasp the system and implement new features.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

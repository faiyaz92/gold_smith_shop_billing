# Technical Documentation for Perfume Seller Website

## 1. Overview
This document provides technical specifications for the perfume seller e-commerce website. It covers the technology stack, data architecture, business logic, and implementation details.

## 2. Technology Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **State Management**: React Context (CartContext)
- **Styling**: Tailwind CSS with custom components
- **Deployment**: Vercel
- **Image Storage**: Cloudinary
- **Payment**: Cash on Delivery (COD) with online payment integration ready

## 3. Firebase Collections Structure

### 3.1 Core Collections (Base Path: `Easy2Solutions/companyDirectory/tenantCompanies/{companyId}`)
All collections are under this multi-tenant structure for scalability.

#### 3.1.1 Products Collection (`products`)
```javascript
{
  id: string, // Firestore document ID
  name: string, // Product name (e.g., "Chanel No. 5")
  price: number, // Original price in KWD
  discountedPrice: number, // Optional discounted price
  image: string, // Cloudinary URL
  categoryId: string, // Reference to categories collection
  subcategoryId: string, // Optional reference to subcategories
  description: string, // Product description
  brand: string, // Perfume brand
  size: string, // Bottle size (e.g., "100ml")
  gender: string, // "Men", "Women", "Unisex"
  isActive: boolean // Availability status
}
```

#### 3.1.2 Categories Collection (`categories`)
```javascript
{
  id: string,
  categoriesname: string, // Category name (e.g., "Men's Perfumes")
  isActive: boolean,
  image: string, // Category banner image
  description: string
}
```

#### 3.1.3 Subcategories Collection (`subcategories`)
```javascript
{
  id: string,
  name: string, // Subcategory name (e.g., "Floral")
  categoryId: string, // Parent category reference
  isActive: boolean
}
```

#### 3.1.4 Users Collection (`users`)
```javascript
{
  id: string,
  name: string,
  email: string,
  phone: string,
  role: string, // "customer", "company_admin", etc.
  addresses: subcollection // User addresses
}
```

#### 3.1.5 Orders Collection (`orders`)
```javascript
{
  id: string,
  customerId: string, // User ID if logged in
  name: string,
  email: string,
  phone: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  items: array, // [{id, name, price, quantity, categoryName}]
  subtotal: number,
  expressDeliveryFee: number,
  discountAmount: number,
  finalTotal: number,
  appliedCoupon: object, // Coupon details
  status: string, // Order status
  branchId: string, // Assigned branch
  timestamp: timestamp,
  pickupTime: string,
  deliveryPref: string,
  serviceType: string
}
```

#### 3.1.6 Carts Collection (`carts`)
```javascript
{
  id: string, // User ID as document ID
  items: array // [{id, name, price, discountedPrice, image, quantity}]
}
```

#### 3.1.7 Branches Collection (`branches`)
```javascript
{
  id: string,
  name: string,
  address: string,
  city: string,
  isActive: boolean
}
```

#### 3.1.8 Coupons Collection (`coupons`)
```javascript
{
  id: string,
  code: string,
  type: string, // "percentage", "fixed", "free_delivery", "bogo"
  value: number,
  maximumDiscount: number,
  isActive: boolean
}
```

#### 3.1.9 Other Collections
- `areas`, `states`, `clusters`: Location hierarchy
- `settings`: General app settings
- `contactUs`: Customer inquiries

## 4. Business Logic and Process Flows

### 4.1 Authentication Flow
- Firebase Auth integration
- Support for email/password and Google sign-in
- Role-based access (admin vs customer)
- Persistent sessions with localStorage

### 4.2 Product Browsing Flow
1. Fetch categories and subcategories
2. Display products with filtering/sorting
3. Product detail view with variants
4. Add to cart functionality

### 4.3 Cart Management Flow
- Persistent cart using CartContext
- Sync with Firestore for logged-in users
- localStorage fallback for guests
- Real-time quantity updates

### 4.4 Checkout Process Flow
1. **Location Selection**: State → Area → Auto-assign Branch
2. **Customer Details**: Name, email, phone, address
3. **Service Options**: Delivery/Pickup, Time slots, Express delivery
4. **Coupon Application**: Validate and apply discounts
5. **Order Summary**: Calculate totals and confirm
6. **Order Creation**: Save to orders collection

### 4.5 Order Processing Flow
1. Order placed with "Pending" status
2. Admin updates status through dashboard
3. Customer can track order status
4. Delivery/Pickup assignment

## 5. Component Architecture

### 5.1 Page Structure
- `/` - Homepage with hero, categories, featured products
- `/products` - Product catalog with filters
- `/product/[id]` - Product detail page
- `/cart` - Shopping cart
- `/checkout` - Multi-step checkout
- `/account` - User profile and orders
- `/auth` - Login/Register

### 5.2 Shared Components
- `Navbar`: Navigation with search and cart icon
- `Footer`: Links and contact info
- `ProductCard`: Reusable product display
- `CartDrawer`: Slide-out cart on mobile
- `CategoryFilter`: Sidebar category navigation

### 5.3 Context Providers
- `CartContext`: Manages cart state and persistence
- `AuthContext`: Handles user authentication
- `LanguageContext`: Multi-language support

## 6. API Integration
- Firebase Firestore for data operations
- Cloudinary for image uploads/management
- Email service for order confirmations
- Payment gateway integration (future)

## 7. Performance Considerations
- Image optimization with Next.js Image component
- Lazy loading for product lists
- Real-time listeners with proper cleanup
- Caching strategies for static data

## 8. Security Measures
- Firebase security rules
- Input validation and sanitization
- Secure payment processing
- Admin role verification

## 9. Testing Strategy
- Unit tests for components
- Integration tests for checkout flow
- E2E tests for critical user journeys

## 10. Deployment and Maintenance
- Vercel for hosting
- Environment variables for configuration
- Monitoring with Firebase Analytics
- Regular security updates

## References
- [Business Requirements Document](./BRD.md) - Business objectives and features (Section 4-5)
- Existing admin panel for product management workflow
- Firebase documentation for data modeling
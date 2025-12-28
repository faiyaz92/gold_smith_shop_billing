# Technical Documentation v1.0
## EASY2-LAUNDRY Admin System

**Document Version:** 1.0  
**Date:** December 19, 2025  
**Project:** EASY2-LAUNDRY Technical Architecture  
**Tech Stack:** Next.js 14, Firebase, Cloudinary  
**Future:** Node.js + MySQL + REST API

---

## 📚 DOCUMENT NAVIGATION

**📋 Related Documents:**
- **[Business Requirements Document (BRD)](BRD.md)** - Business logic, features, workflows, roles
- **[Database Information](DatabaseInfo.md)** - Schema reference, migration scripts, data structures

**🔗 Quick Links by Topic:**
| Tech Doc Section | BRD Section | Database Doc Section |
|------------------|-------------|----------------------|
| [1. Technology Stack](#1-technology-stack) | [Executive Summary](BRD.md#-executive-summary) | [1. Overview](DatabaseInfo.md#1-overview) |
| [2. Architecture](#2-architecture-overview) | [5. Non-Functional Reqs](BRD.md#5-non-functional-requirements) | [2.1 Multi-Tenant](DatabaseInfo.md#21-multi-tenant-structure) |
| [3. Frontend](#3-frontend-implementation) | [2.11 Contexts & Utilities](BRD.md#211-global-contexts--utilities-system-foundation) | N/A |
| [4. Firebase Config](#4-firebase-configuration) | [10. Settings](BRD.md#210-settings--configuration-) | [2.2.12 Settings](DatabaseInfo.md#2212-settings-collection) |
| [5. Authentication](#5-authentication-system) | [2.4 User Management](BRD.md#24-user-management-) | [2.2.1 Users](DatabaseInfo.md#221-users-collection) |
| [6. State Management](#6-state-management) | [2.11 Contexts](BRD.md#211-global-contexts--utilities-system-foundation) | [2.2.13 Carts](DatabaseInfo.md#2213-carts-collection-user-specific) |
| [7. API Patterns](#7-api-patterns) | [2.1-2.10 All Modules](BRD.md#2-current-admin-modules-existing-system) | [2.2 All Collections](DatabaseInfo.md#22-collection-schemas) |
| [8. Components](#8-component-architecture) | [2.11 Global Contexts](BRD.md#211-global-contexts--utilities-system-foundation) | N/A |
| [9. Business Logic](#9-business-logic) | [2.2 Orders](BRD.md#22-order-management-system-oms---core-), [2.6 Coupons](BRD.md#26-coupon-management-) | [2.2.2 Orders](DatabaseInfo.md#222-orders-collection), [2.2.10 Coupons](DatabaseInfo.md#2210-coupons-collection) |
| [10. Performance](#10-performance-optimization) | [5. Non-Functional](BRD.md#5-non-functional-requirements) | [5. Indexing](DatabaseInfo.md#5-indexing-strategy) |
| [11. Future (Node.js)](#11-future-architecture-nodejs--mysql) | [3. Future Modules](BRD.md#3-future-modules-super-module-vision), [4. Migration](BRD.md#4-migration-strategy-firebase--nodejs--mysql) | [3. MySQL](DatabaseInfo.md#3-future-database-mysql), [4. Migration](DatabaseInfo.md#4-data-migration-strategy) |
| [12. Deployment](#12-deployment) | [9. Timeline](BRD.md#9-timeline--milestones) | [7. Backup](DatabaseInfo.md#7-backup--recovery) |
| [13. Testing](#13-testing-strategy) | [8. Risks](BRD.md#8-risks--mitigation) | N/A |
| [14. Monitoring](#14-monitoring--logging) | [5.4 Availability](BRD.md#54-availability) | N/A |

---

## 📚 TABLE OF CONTENTS

1. [Technology Stack](#1-technology-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Frontend Implementation](#3-frontend-implementation)
4. [Firebase Configuration](#4-firebase-configuration)
5. [Authentication System](#5-authentication-system)
6. [State Management](#6-state-management)
7. [API Patterns](#7-api-patterns)
8. [Component Architecture](#8-component-architecture)
9. [Business Logic](#9-business-logic)
10. [Performance Optimization](#10-performance-optimization)
11. [Future Architecture (Node.js + MySQL)](#11-future-architecture-nodejs--mysql)

---

## 1. TECHNOLOGY STACK

### 1.1 Current Stack (Firebase-based)

**Frontend:**
- Next.js 14.2.32 (App Router)
- React 19.0.0
- Tailwind CSS 4.0.0 (with PostCSS)
- Framer Motion 11.19.5 (animations)
- Lucide React 0.468.0 (icons)

**Backend & Services:**
- Firebase 11.1.0
  - Firestore (NoSQL database)
  - Firebase Auth (authentication)
  - Firebase Storage (file storage)
  - Firebase Performance (monitoring)
  - Firebase Analytics
- Cloudinary (image CDN)

**Data Visualization:**
- Recharts 2.15.0 (charts: LineChart, BarChart)

**PDF Generation:**
- jsPDF 2.5.2 + jsPDF-AutoTable 3.8.4

**Utilities:**
- Axios 1.11.0 (HTTP client)
- XLSX 0.18.5 (Excel export)
- date-fns 4.1.0 (date manipulation)

**Development:**
- ESLint (linting)
- PostCSS (CSS processing)

### 1.2 Future Stack (MySQL-based)

**Backend:**
- Node.js 20+ LTS
- Express.js 4.x (REST API framework)
- MySQL 8.0+ (relational database)
- Redis 7+ (caching layer)
- JWT (JSON Web Tokens for auth)

**ORM & Query Builder:**
- Sequelize or TypeORM (MySQL ORM)
- Knex.js (query builder, migrations)

**API Documentation:**
- Swagger/OpenAPI 3.0
- Postman collections

**Testing:**
- Jest (unit tests)
- Supertest (API testing)
- Cypress (E2E tests)

**DevOps:**
- Docker (containerization)
- PM2 (Node.js process manager)
- Nginx (reverse proxy)
- AWS/Azure/GCP (cloud hosting)

---

## 2. ARCHITECTURE OVERVIEW

### 2.1 Current Architecture (Firebase)

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Next.js 14 (App Router) + React 19 + Tailwind CSS        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Customer    │  │    Admin     │  │   Mobile     │    │
│  │   Website    │  │    Panel     │  │   Views      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONTEXT LAYER                             │
│  React Context API (State Management)                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  CartContext │  │  Language    │  │  Admin       │    │
│  │              │  │  Context     │  │  Language    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  FIREBASE LAYER                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Firestore   │  │  Auth        │  │  Storage     │    │
│  │  (Database)  │  │  (Phone+     │  │  (Images)    │    │
│  │              │  │   Google)    │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 CLOUDINARY (Images)                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Tenant Data Structure

**Base Path:**
```
Easy2Solutions/
  └── companyDirectory/
      └── tenantCompanies/
          └── {companyId}/  (e.g., laundry_q8)
              ├── users/
              ├── orders/
              ├── products/
              ├── categories/
              ├── subcategories/
              ├── states/
              ├── areas/
              ├── branches/
              ├── clusters/
              ├── coupons/
              ├── contact/
              └── settings/
```

**Environment Variable:**
```javascript
NEXT_PUBLIC_COMPANY_ID=laundry_q8
```

### 2.3 Directory Structure

```
perfume/  (project root)
├── src/
│   ├── app/
│   │   ├── globals.css              # Global styles
│   │   ├── layout.js                # Root layout
│   │   ├── page.js                  # Customer homepage
│   │   ├── firebase.js              # Firebase config
│   │   ├── cloudinary.js            # Cloudinary utils
│   │   │
│   │   ├── admin/                   # ADMIN PANEL
│   │   │   ├── AdminLayout.js       # Admin layout wrapper
│   │   │   ├── login/page.js        # Admin login
│   │   │   ├── dashboard/page.js    # Analytics dashboard
│   │   │   ├── orders/page.js       # Order management
│   │   │   ├── products/            # Product management
│   │   │   │   ├── page.js          # Product list
│   │   │   │   ├── categories/page.js
│   │   │   │   ├── subcategories/page.js
│   │   │   │   └── product/page.js
│   │   │   ├── users/page.js        # User management
│   │   │   ├── billing/page.js      # POS/Cashier
│   │   │   ├── areas/page.js        # Geographic setup
│   │   │   ├── branches/page.js     # Branch management
│   │   │   ├── coupons/page.js      # Coupon management
│   │   │   ├── inquiries/page.js    # Customer inquiries
│   │   │   ├── analytics/page.js    # Advanced analytics
│   │   │   ├── settings/page.js     # System settings
│   │   │   ├── Componenets/         # Admin components
│   │   │   │   ├── AdminHeader.js
│   │   │   │   └── AdminSidebar/
│   │   │   └── components/
│   │   │       └── RoleBasedRedirect.js
│   │   │
│   │   ├── User/                    # CUSTOMER AREA
│   │   │   ├── Auth/page.js         # Phone OTP + Google
│   │   │   ├── Account/page.js      # Customer profile
│   │   │   └── CheckoutPage/
│   │   │       └── CheckoutPageInner.js
│   │   │
│   │   ├── cart/page.js             # Shopping cart
│   │   ├── products/page.js         # Product catalog
│   │   ├── product/[id]/page.js     # Product details
│   │   ├── contact/page.js          # Contact page
│   │   ├── about/page.js            # About page
│   │   │
│   │   ├── context/                 # REACT CONTEXT
│   │   │   ├── CartContext.js       # Cart state
│   │   │   ├── LanguageContext.js   # User language
│   │   │   └── AdminLanguageContext.js
│   │   │
│   │   ├── utils/                   # UTILITIES
│   │   │   ├── firestorePaths.js    # Path helpers
│   │   │   ├── useTranslation.js    # i18n hook
│   │   │   ├── useAdminTranslation.js
│   │   │   └── utils.js             # Helper functions
│   │   │
│   │   └── Componenets/             # SHARED COMPONENTS
│   │       ├── Footer.js
│   │       └── (other components)
│   │
├── public/                          # Static assets
│   ├── favicon.ico
│   └── *.svg
│
├── locales/                         # i18n TRANSLATIONS
│   ├── en.json                      # English (267 keys)
│   └── ar.json                      # Arabic (265 keys)
│
├── docs/                            # DOCUMENTATION
│   ├── BRD.md                       # Business requirements
│   ├── TechnicalDoc.md              # This document
│   └── DatabaseInfo.md              # Database schemas
│
├── next.config.mjs                  # Next.js config
├── next-intl.config.js              # i18n config
├── tailwind.config.js               # Tailwind config
├── postcss.config.mjs               # PostCSS config
├── eslint.config.mjs                # ESLint config
├── jsconfig.json                    # JS compiler options
├── package.json                     # Dependencies
├── vercel.json                      # Vercel deployment
├── .env                             # Environment variables
└── README.md                        # Project README
```

---

## 3. FRONTEND IMPLEMENTATION

### 3.1 Next.js App Router Structure

**App Router (Next.js 14):**
- File-based routing
- Server components by default
- Client components with `"use client"` directive
- Layouts and nested layouts
- Route groups

**Example Route:**
```
src/app/admin/orders/page.js
→ URL: /admin/orders
```

### 3.2 Client vs. Server Components

**Client Components (requires "use client"):**
- Interactive components (buttons, forms)
- Uses hooks (useState, useEffect, useContext)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)

**Server Components (default):**
- Static rendering
- Data fetching on server
- No JavaScript sent to client
- Better performance

**Example:**
```javascript
// Client Component
"use client";
import { useState } from 'react';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  // ... Firebase queries with onSnapshot
}
```

### 3.3 Tailwind CSS Implementation

**Configuration:**
```javascript
// tailwind.config.js
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
      },
    },
  },
  plugins: [],
};
```

**Usage:**
```jsx
<div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md p-4">
  <h1 className="text-2xl font-bold text-white">Dashboard</h1>
</div>
```

### 3.4 Framer Motion Animations

**Usage:**
```javascript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

---

## 4. FIREBASE CONFIGURATION

### 4.1 Firebase Setup (src/app/firebase.js)

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getPerformance } from 'firebase/performance';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const performance = getPerformance(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();
```

### 4.2 Environment Variables (.env)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAY3TseN8w0IvVJIxpaYvLKnP3H1DmtFYg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=requiementgathering.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=requiementgathering
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=requiementgathering.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=297040139948
NEXT_PUBLIC_FIREBASE_APP_ID=1:297040139948:web:4a339a1d3150e95a3c3109
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TB2KW7KLLB

NEXT_PUBLIC_COMPANY_ID=laundry_q8

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dnf7pisvw
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=Laundry
NEXT_PUBLIC_CLOUDINARY_API_KEY=223735388477295
NEXT_PUBLIC_CLOUDINARY_API_SECRET=xKgEESiy9OLuANQIj4T7p9oRlBs
```

### 4.3 Firestore Path Utilities (src/app/utils/firestorePaths.js)

```javascript
const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;
const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

export const useFirestorePaths = () => {
  return {
    getTenantUsersPath: () => `${basePath}/users`,
    getOrdersPath: () => `${basePath}/orders`,
    getProductPath: () => `${basePath}/products`,
    getCategoriesPath: () => `${basePath}/categories`,
    getSubcategoryPath: () => `${basePath}/subcategories`,
    getStatesPath: () => `${basePath}/states`,
    getAreasPath: () => `${basePath}/areas`,
    getBranchesPath: () => `${basePath}/branches`,
    getClustersPath: () => `${basePath}/clusters`,
    getCouponsPath: () => `${basePath}/coupons`,
    getContactPath: () => `${basePath}/contact`,
    getSettingsPath: () => `${basePath}/settings`,
    getUserCartPath: (userId) => `${basePath}/carts/${userId}`,
  };
};
```

**Usage:**
```javascript
import { useFirestorePaths } from '@/app/utils/firestorePaths';

const paths = useFirestorePaths();
const ordersPath = paths.getOrdersPath();
// Result: Easy2Solutions/companyDirectory/tenantCompanies/laundry_q8/orders
```

---

## 5. AUTHENTICATION SYSTEM

### 5.1 Admin Authentication (Email/Password)

**Login Flow (src/app/admin/login/page.js):**
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';

const handleLogin = async (email, password) => {
  // 1. Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Fetch user document from Firestore
  const userDocRef = doc(db, `${usersPath}/${user.uid}`);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();

    // 3. Store in localStorage
    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem('userId', user.uid);
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userStatus', userData.status);
    localStorage.setItem('userPhone', userData.phone);
    localStorage.setItem('userBranchId', userData.branchId);

    // 4. Update last login
    await updateDoc(userDocRef, {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 5. Role-based redirect
    const roleDefaults = {
      company_admin: '/admin/dashboard',
      general_manager: '/admin/dashboard',
      branch_manager: '/admin/dashboard',
      cashier: '/admin/billing',
      delivery_man: '/admin/orders',
      pickup_man: '/admin/orders'
    };
    router.replace(roleDefaults[userData.role] || '/admin/dashboard');
  }
};
```

### 5.2 Customer Authentication (Phone OTP + Google)

**Phone OTP Flow (src/app/User/Auth/page.js):**
```javascript
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/app/firebase';

// 1. Setup reCAPTCHA
const setupCaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      'recaptcha-container',
      { size: 'invisible' },
      auth
    );
  }
};

// 2. Send OTP
const handleSendOTP = async (phoneNumber) => {
  setupCaptcha();
  const confirmationResult = await signInWithPhoneNumber(
    auth,
    `+91${phoneNumber}`,
    window.recaptchaVerifier
  );
  setConfirmResult(confirmationResult);
  setStep(2); // Move to OTP input
};

// 3. Verify OTP
const handleVerifyOTP = async (otp) => {
  const result = await confirmResult.confirm(otp);
  const user = result.user;

  // 4. Create user document in Firestore
  const userDocRef = doc(db, `${usersPath}/${user.uid}`);
  await setDoc(userDocRef, {
    uid: user.uid,
    phone: user.phoneNumber,
    userType: 'customer',
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp()
  });

  router.push('/');
};
```

**Google Sign-in Flow:**
```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Create/update user document
  const userDocRef = doc(db, `${usersPath}/${user.uid}`);
  await setDoc(userDocRef, {
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    userType: 'customer',
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp()
  }, { merge: true });

  router.push('/');
};
```

### 5.3 Role-Based Redirect (src/app/admin/components/RoleBasedRedirect.js)

```javascript
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoleBasedRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');

    const roleDefaults = {
      company_admin: '/admin/dashboard',
      general_manager: '/admin/dashboard',
      branch_manager: '/admin/dashboard',
      cashier: '/admin/billing',
      delivery_man: '/admin/orders',
      pickup_man: '/admin/orders'
    };

    const defaultPage = roleDefaults[userRole] || '/admin/dashboard';
    router.replace(defaultPage);
  }, []);

  return <div>Redirecting...</div>;
}
```

---

## 6. STATE MANAGEMENT

### 6.1 CartContext (src/app/context/CartContext.js)

**Purpose:** Unified cart management for authenticated and guest users

```javascript
"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/app/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load cart from Firestore for authenticated users
        const cartRef = doc(db, `${basePath}/carts/${firebaseUser.uid}`);
        const unsubCart = onSnapshot(cartRef, (doc) => {
          if (doc.exists()) {
            setCart(doc.data().items || []);
          } else {
            // Migrate guest cart to user cart
            const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (guestCart.length > 0) {
              setDoc(cartRef, { items: guestCart });
              setCart(guestCart);
              localStorage.removeItem('cart');
            }
          }
        });
        return () => unsubCart();
      } else {
        // Load cart from localStorage for guests
        const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCart(guestCart);
      }
    });
    return () => unsubscribe();
  }, []);

  // Add to cart
  const addToCart = async (item) => {
    const newCart = [...cart];
    const existingIndex = newCart.findIndex((i) => i.id === item.id);

    if (existingIndex > -1) {
      newCart[existingIndex].quantity += 1;
    } else {
      newCart.push({ ...item, quantity: 1 });
    }

    setCart(newCart);

    if (user) {
      // Update Firestore
      const cartRef = doc(db, `${basePath}/carts/${user.uid}`);
      await updateDoc(cartRef, { items: newCart });
    } else {
      // Update localStorage
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  // Remove from cart
  const removeFromCart = async (itemId) => {
    const newCart = cart.filter((item) => item.id !== itemId);
    setCart(newCart);

    if (user) {
      const cartRef = doc(db, `${basePath}/carts/${user.uid}`);
      await updateDoc(cartRef, { items: newCart });
    } else {
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  // Update quantity
  const updateQuantity = async (itemId, quantity) => {
    const newCart = cart.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setCart(newCart);

    if (user) {
      const cartRef = doc(db, `${basePath}/carts/${user.uid}`);
      await updateDoc(cartRef, { items: newCart });
    } else {
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  };

  // Clear cart
  const clearCart = async () => {
    setCart([]);
    if (user) {
      const cartRef = doc(db, `${basePath}/carts/${user.uid}`);
      await updateDoc(cartRef, { items: [] });
    } else {
      localStorage.removeItem('cart');
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
```

### 6.2 LanguageContext (src/app/context/LanguageContext.js)

**Purpose:** User interface internationalization with RTL support

```javascript
"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Load language from localStorage
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
    
    // Set document direction for RTL languages
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;
  }, []);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
```

### 6.3 Translation Hook (src/app/utils/useTranslation.js)

```javascript
"use client";
import { useLanguage } from '@/app/context/LanguageContext';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

export const useTranslation = () => {
  const { language } = useLanguage();

  const translations = {
    en: enTranslations,
    ar: arTranslations
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return { t, language };
};
```

---

## 7. API PATTERNS

### 7.1 Firestore Real-time Listeners

**Pattern: onSnapshot**
```javascript
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

useEffect(() => {
  const ordersQuery = query(
    collection(db, ordersPath),
    where('branchId', '==', userBranchId),
    orderBy('timestamp', 'desc')
  );

  const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
    setOrders(orders);
    setLoading(false);
  }, (error) => {
    console.error('Error fetching orders:', error);
    setError(error.message);
  });

  // Cleanup on unmount
  return () => unsubscribe();
}, [userBranchId]);
```

### 7.2 Firestore Queries

**Query Operators:**
- `where()` - Filtering
- `orderBy()` - Sorting
- `limit()` - Pagination
- `startAfter()` - Cursor-based pagination
- `endBefore()` - Reverse pagination

**Example: Complex Query**
```javascript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const getTopSellingProducts = async (startDate, endDate) => {
  const ordersQuery = query(
    collection(db, ordersPath),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    where('status', '==', 'Delivered'),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(ordersQuery);
  
  // Aggregate product quantities
  const productMap = {};
  snapshot.docs.forEach(doc => {
    const order = doc.data();
    order.items.forEach(item => {
      if (productMap[item.productId]) {
        productMap[item.productId].quantity += item.quantity;
      } else {
        productMap[item.productId] = {
          ...item,
          quantity: item.quantity
        };
      }
    });
  });

  return Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
};
```

### 7.3 Firestore Writes

**Create Document:**
```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const createOrder = async (orderData) => {
  const orderRef = await addDoc(collection(db, ordersPath), {
    ...orderData,
    status: 'Pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return orderRef.id;
};
```

**Update Document:**
```javascript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const updateOrderStatus = async (orderId, newStatus) => {
  const orderRef = doc(db, ordersPath, orderId);
  await updateDoc(orderRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.userId
  });
};
```

**Delete Document:**
```javascript
import { doc, deleteDoc } from 'firebase/firestore';

const deleteProduct = async (productId) => {
  await deleteDoc(doc(db, productsPath, productId));
};
```

---

## 8. COMPONENT ARCHITECTURE

### 8.1 Layout Components

**Root Layout (src/app/layout.js):**
```javascript
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
```

**Admin Layout (src/app/admin/AdminLayout.js):**
```javascript
import { AdminLanguageProvider } from '../context/AdminLanguageContext';
import AdminHeader from './Componenets/AdminHeader';
import AdminSidebar from './Componenets/AdminSidebar/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <AdminLanguageProvider>
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminLanguageProvider>
  );
}
```

### 8.2 Admin Components

**AdminHeader (src/app/admin/Componenets/AdminHeader.js):**
- Desktop navigation links
- Mobile sidebar toggle
- Language switcher
- User profile dropdown
- Logout button

**AdminSidebar (src/app/admin/Componenets/AdminSidebar/AdminSidebar.js):**
- Role-based menu filtering
- Active route highlighting
- User info display
- Collapsible on mobile

**RoleBasedRedirect:**
- Automatic redirect based on user role
- Used on admin index page

---

## 9. BUSINESS LOGIC

### 9.1 Order Processing Logic

**Order Creation (Checkout):**
```javascript
const createOrder = async (orderData) => {
  // 1. Validate cart
  if (cart.length === 0) throw new Error('Cart is empty');

  // 2. Validate location selection
  if (!selectedState || !selectedArea || !selectedBranchId) {
    throw new Error('Please select delivery location');
  }

  // 3. Apply coupon (if any)
  let discount = 0;
  if (appliedCoupon) {
    discount = calculateDiscount(appliedCoupon, subtotal);
  }

  // 4. Calculate totals
  const expressFee = schedule.deliveryPref === 'express' ? subtotal * 0.2 : 0;
  const total = subtotal - discount + expressFee;

  // 5. Create order document
  const order = {
    customerName: form.name,
    customerEmail: form.email,
    customerPhone: form.phone,
    customerAddress: form.address,
    items: cart,
    subtotal,
    discount,
    expressDeliveryFee: expressFee,
    total,
    stateId: selectedState,
    areaId: selectedArea,
    branchId: selectedBranchId,
    pickupTime: schedule.pickupTime,
    deliveryPreference: schedule.deliveryPref,
    serviceType: schedule.serviceType,
    appliedCoupon: appliedCoupon ? {
      code: appliedCoupon.code,
      type: appliedCoupon.type,
      value: appliedCoupon.value,
      discount: discount
    } : null,
    status: 'Pending',
    paymentMethod: 'cod',
    orderTakenBy: currentUser?.uid || null,
    timestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // 6. Save to Firestore
  const orderRef = await addDoc(collection(db, ordersPath), order);

  // 7. Update coupon usage
  if (appliedCoupon) {
    await updateCouponUsage(appliedCoupon.id, form.phone);
  }

  // 8. Clear cart
  await clearCart();

  return orderRef.id;
};
```

### 9.2 Coupon Validation Logic

```javascript
const validateCoupon = async (couponCode, orderAmount, orderItems, userPhone) => {
  // 1. Fetch coupon
  const couponsQuery = query(
    collection(db, couponsPath),
    where('code', '==', couponCode.toUpperCase()),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(couponsQuery);

  if (snapshot.empty) {
    throw new Error('Invalid coupon code');
  }

  const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

  // 2. Check date validity
  const now = new Date();
  const validFrom = coupon.validFrom.toDate();
  const validUntil = coupon.validUntil.toDate();

  if (now < validFrom || now > validUntil) {
    throw new Error('Coupon has expired');
  }

  // 3. Check minimum order value
  if (orderAmount < coupon.minimumOrderValue) {
    throw new Error(`Minimum order value is ${coupon.minimumOrderValue}`);
  }

  // 4. Check user usage limit
  if (coupon.usageLimit) {
    const userUsage = await getUserCouponUsage(coupon.id, userPhone);
    if (userUsage >= coupon.usageLimit) {
      throw new Error('Coupon usage limit reached for this user');
    }
  }

  // 5. Check total usage limit
  if (coupon.totalUsageLimit) {
    const totalUsage = await getTotalCouponUsage(coupon.id);
    if (totalUsage >= coupon.totalUsageLimit) {
      throw new Error('Coupon usage limit reached');
    }
  }

  // 6. Check category restrictions
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const hasApplicableItem = orderItems.some(item =>
      coupon.applicableCategories.includes(item.categoryId)
    );
    if (!hasApplicableItem) {
      throw new Error('Coupon not applicable to items in cart');
    }
  }

  if (coupon.excludedCategories && coupon.excludedCategories.length > 0) {
    const hasExcludedItem = orderItems.some(item =>
      coupon.excludedCategories.includes(item.categoryId)
    );
    if (hasExcludedItem) {
      throw new Error('Coupon cannot be applied to some items in cart');
    }
  }

  return coupon;
};

const calculateDiscount = (coupon, orderAmount) => {
  if (coupon.type === 'percentage') {
    const discount = (orderAmount * coupon.value) / 100;
    return coupon.maximumDiscount
      ? Math.min(discount, coupon.maximumDiscount)
      : discount;
  } else if (coupon.type === 'fixed') {
    return Math.min(coupon.value, orderAmount);
  }
  return 0;
};
```

### 9.3 PDF Receipt Generation

```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const generateReceipt = (order, companyInfo) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text(companyInfo.name, 20, 20);
  doc.setFontSize(10);
  doc.text(companyInfo.address, 20, 28);
  doc.text(`Phone: ${companyInfo.phone}`, 20, 34);

  // Order Info
  doc.setFontSize(16);
  doc.text('Order Receipt', 20, 50);
  doc.setFontSize(10);
  doc.text(`Order ID: ${order.id}`, 20, 60);
  doc.text(`Date: ${order.timestamp.toLocaleDateString()}`, 20, 66);
  doc.text(`Customer: ${order.customerName}`, 20, 72);
  doc.text(`Phone: ${order.customerPhone}`, 20, 78);

  // Items Table
  const tableData = order.items.map(item => [
    item.productName,
    item.quantity,
    `$${item.price.toFixed(2)}`,
    `$${(item.quantity * item.price).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 90,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped'
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Subtotal: $${order.subtotal.toFixed(2)}`, 20, finalY);
  doc.text(`Discount: -$${order.discount.toFixed(2)}`, 20, finalY + 6);
  doc.text(`Express Fee: $${order.expressDeliveryFee.toFixed(2)}`, 20, finalY + 12);
  doc.setFontSize(12);
  doc.text(`Total: $${order.total.toFixed(2)}`, 20, finalY + 20);

  // Footer
  doc.setFontSize(8);
  doc.text('Thank you for your business!', 20, 280);

  // Save
  doc.save(`receipt-${order.id}.pdf`);
};
```

---

## 10. PERFORMANCE OPTIMIZATION

### 10.1 Code Splitting & Lazy Loading

```javascript
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/app/admin/dashboard/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false // Client-side only
});
```

### 10.2 Memoization

```javascript
import { useMemo, useCallback } from 'react';

const OrdersList = ({ orders }) => {
  // Memoize expensive calculations
  const filteredOrders = useMemo(() => {
    return orders.filter(order => order.status === 'Pending');
  }, [orders]);

  // Memoize event handlers
  const handleStatusChange = useCallback((orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  }, []);

  return (
    <div>
      {filteredOrders.map(order => (
        <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
      ))}
    </div>
  );
};
```

### 10.3 Image Optimization

**Cloudinary Configuration:**
```javascript
// src/app/cloudinary.js
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  return data.secure_url;
};

export const deleteFromCloudinary = async (imageUrl) => {
  const publicId = extractPublicId(imageUrl);
  // ... Cloudinary delete API call
};

// Generate optimized image URLs
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  const { width = 400, height = 400, quality = 'auto', format = 'auto' } = options;
  return imageUrl.replace('/upload/', `/upload/w_${width},h_${height},q_${quality},f_${format}/`);
};
```

**Usage:**
```jsx
<img
  src={getOptimizedImageUrl(product.image, { width: 300, height: 300 })}
  alt={product.name}
/>
```

### 10.4 Firestore Query Optimization

**Use Indexes:**
```javascript
// Firebase Console: Create composite index for
// orders collection: branchId ASC, timestamp DESC
```

**Limit Results:**
```javascript
import { query, collection, where, orderBy, limit } from 'firebase/firestore';

const recentOrders = query(
  collection(db, ordersPath),
  where('branchId', '==', userBranchId),
  orderBy('timestamp', 'desc'),
  limit(50) // Only fetch 50 most recent
);
```

**Pagination:**
```javascript
import { query, collection, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';

const [lastDoc, setLastDoc] = useState(null);

const loadMore = async () => {
  const ordersQuery = query(
    collection(db, ordersPath),
    orderBy('timestamp', 'desc'),
    startAfter(lastDoc),
    limit(20)
  );

  const snapshot = await getDocs(ordersQuery);
  setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
  
  const newOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setOrders(prev => [...prev, ...newOrders]);
};
```

---

## 11. FUTURE ARCHITECTURE (Node.js + MySQL)

### 11.1 Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Next.js Admin Panel + Customer Website + Mobile Apps      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                             │
│  Nginx (Reverse Proxy) + Rate Limiting + SSL               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     NODE.JS REST API                        │
│  Express.js + JWT Auth + Validation + Error Handling       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth       │  │   Orders     │  │  Products    │    │
│  │   Service    │  │   Service    │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Inventory   │  │  Accounting  │  │     HR       │    │
│  │   Service    │  │   Service    │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     CACHE LAYER                             │
│  Redis (Session Storage + Query Caching)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                          │
│  MySQL 8.0 (Master-Slave Replication)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│  Cloudinary + SMS + Email + Payment Gateways + GPS         │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 MySQL Database Schema (Preview)

**See DatabaseInfo.md for complete schema documentation.**

**Key Tables:**
- `companies` - Multi-tenant company data
- `users` - Staff & customer accounts
- `orders` - Order master records
- `order_items` - Order line items
- `products` - Service catalog
- `categories`, `subcategories` - Product hierarchy
- `inventory_items` - Stock management
- `stock_transactions` - Inventory movements
- `branches`, `states`, `areas`, `clusters` - Geographic
- `coupons`, `coupon_usage` - Promotions
- `invoices`, `payments` - Accounting
- `vehicles`, `deliveries` - Fleet management

### 11.3 REST API Design

**Authentication:**
```
POST   /api/auth/login              # Email/password login
POST   /api/auth/phone-otp          # Send OTP
POST   /api/auth/verify-otp         # Verify OTP
POST   /api/auth/google             # Google OAuth
POST   /api/auth/refresh            # Refresh JWT token
POST   /api/auth/logout             # Invalidate token
```

**Orders:**
```
GET    /api/orders                  # List orders (with filters)
GET    /api/orders/:id              # Get order details
POST   /api/orders                  # Create order
PATCH  /api/orders/:id              # Update order
DELETE /api/orders/:id              # Delete order
PATCH  /api/orders/:id/status       # Update status
POST   /api/orders/:id/assign       # Assign delivery/pickup
GET    /api/orders/:id/receipt      # Generate PDF receipt
```

**Products:**
```
GET    /api/products                # List products
GET    /api/products/:id            # Get product details
POST   /api/products                # Create product
PATCH  /api/products/:id            # Update product
DELETE /api/products/:id            # Delete product
POST   /api/products/upload-image   # Upload image to Cloudinary
```

**Inventory (New Module):**
```
GET    /api/inventory               # List inventory items
GET    /api/inventory/:id           # Get item details
POST   /api/inventory               # Create item
PATCH  /api/inventory/:id           # Update item
GET    /api/inventory/stock-levels  # Current stock levels
POST   /api/inventory/adjustments   # Stock adjustment
POST   /api/inventory/transfers     # Inter-branch transfer
```

### 11.4 JWT Authentication

**Token Structure:**
```javascript
{
  "userId": "user123",
  "email": "admin@laundry.com",
  "role": "company_admin",
  "branchId": "branch456",
  "companyId": "laundry_q8",
  "iat": 1702998400,
  "exp": 1703084800
}
```

**Middleware:**
```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// Usage
app.get('/api/users', authMiddleware, roleMiddleware(['company_admin']), getUsersHandler);
```

### 11.5 Data Migration Script

```javascript
// migrate-firebase-to-mysql.js
const admin = require('firebase-admin');
const mysql = require('mysql2/promise');

const migrateCollection = async (collectionName, transformer) => {
  const snapshot = await db.collection(collectionName).get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const transformedData = transformer(doc.id, data);
    
    // Insert into MySQL
    await mysqlConnection.query(
      `INSERT INTO ${collectionName} SET ?`,
      transformedData
    );
  }
};

// Example transformer
const orderTransformer = (docId, data) => {
  return {
    id: docId,
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone,
    total: data.total,
    status: data.status,
    created_at: data.timestamp.toDate(),
    updated_at: data.updatedAt.toDate()
  };
};

// Run migration
await migrateCollection('orders', orderTransformer);
```

---

## 12. DEPLOYMENT

### 12.1 Current Deployment (Vercel)

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

**Build Command:**
```bash
npm run build
```

**Environment Variables (Vercel Dashboard):**
- All `NEXT_PUBLIC_*` variables from .env

### 12.2 Future Deployment (Node.js)

**Docker Containerization:**
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://user:pass@mysql:3306/laundry_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: laundry_db
    volumes:
      - mysql-data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  mysql-data:
  redis-data:
```

---

## 13. TESTING STRATEGY

### 13.1 Unit Tests (Jest)

```javascript
// __tests__/utils/calculateDiscount.test.js
import { calculateDiscount } from '@/app/utils/coupon';

describe('calculateDiscount', () => {
  test('percentage discount', () => {
    const coupon = { type: 'percentage', value: 20, maximumDiscount: 50 };
    expect(calculateDiscount(coupon, 100)).toBe(20);
    expect(calculateDiscount(coupon, 500)).toBe(50); // Capped at max
  });

  test('fixed discount', () => {
    const coupon = { type: 'fixed', value: 10 };
    expect(calculateDiscount(coupon, 100)).toBe(10);
  });
});
```

### 13.2 API Tests (Supertest)

```javascript
// __tests__/api/orders.test.js
import request from 'supertest';
import app from '../../src/app';

describe('Orders API', () => {
  let authToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });
    authToken = res.body.token;
  });

  test('GET /api/orders - should return orders list', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/orders - should create order', async () => {
    const orderData = {
      customerName: 'John Doe',
      customerPhone: '+911234567890',
      items: [{ productId: 'prod123', quantity: 2 }]
    };

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(orderData);
    
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
  });
});
```

---

## 14. MONITORING & LOGGING

### 14.1 Error Tracking (Sentry)

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Catch errors
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

### 14.2 Analytics (Firebase Analytics)

```javascript
import { analytics } from '@/app/firebase';
import { logEvent } from 'firebase/analytics';

// Track custom events
logEvent(analytics, 'order_placed', {
  order_id: orderId,
  value: orderTotal,
  currency: 'USD'
});
```

---

## 15. DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-19 | Tech Lead | Initial technical documentation |

---

**END OF TECHNICAL DOCUMENTATION**

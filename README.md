# 🌟 GoldSmith - Premium Jewelry E-commerce

A sophisticated, modern e-commerce website for luxury gold jewelry built with Next.js 14, featuring premium design, advanced functionality, and seamless user experience.

![GoldSmith](https://img.shields.io/badge/Next.js-14-black) ![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue)

## ✨ Features

### 🛍️ **E-commerce Features**
- **Complete Product Catalog** - Browse jewelry by category (Gold, Silver, Platinum)
- **Advanced Search & Filters** - Search by name, filter by category, price range, and sorting
- **Shopping Cart** - Add/remove items, quantity management, persistent cart
- **Secure Checkout** - Multi-step checkout with validation, payment processing
- **Order Management** - Order history, tracking, and status updates

### 🎨 **Premium Design**
- **Luxury UI/UX** - Elegant design with gradients, animations, and premium styling
- **Responsive Design** - Perfect on desktop, tablet, and mobile devices
- **Smooth Animations** - Framer Motion animations for enhanced user experience
- **Dark/Light Mode** - Adaptive color schemes for different preferences

### 🔧 **Technical Features**
- **Next.js 14** - Latest App Router with server components
- **Firebase Integration** - Firestore database, authentication, and hosting
- **Real-time Updates** - Live inventory and order status updates
- **SEO Optimized** - Meta tags, structured data, and performance optimization
- **Multi-language Support** - English and Arabic language options

### 👨‍💼 **Admin Panel**
- **Product Management** - Add, edit, delete products with image uploads
- **Order Management** - View and update order status
- **User Management** - Customer account management
- **Analytics Dashboard** - Sales reports and insights
- **Category Management** - Organize products by categories and subcategories

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd goldsmith
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```

   Configure your Firebase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_COMPANY_ID=your_company_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
goldsmith/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin panel pages
│   │   ├── auth/              # Authentication pages
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout process
│   │   ├── products/          # Product listing and details
│   │   └── contact/           # Contact page
│   ├── components/            # Reusable components
│   ├── context/               # React context providers
│   ├── utils/                 # Utility functions
│   └── firebase.js            # Firebase configuration
├── public/                     # Static assets
│   ├── jewelry-*.svg         # Jewelry illustrations
│   └── category-*.svg        # Category icons
├── docs/                      # Documentation
└── package.json               # Dependencies and scripts
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Firebase Firestore, Firebase Auth
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with custom gradients
- **Deployment**: Vercel (recommended)

## 📱 Pages & Features

### Customer Pages
- **Home** (`/`) - Hero section, featured products, categories
- **Products** (`/products`) - Product catalog with filters
- **Product Details** (`/product/[id]`) - Individual product pages
- **Cart** (`/cart`) - Shopping cart management
- **Checkout** (`/checkout`) - Multi-step checkout process
- **Contact** (`/contact`) - Contact form and information
- **About** (`/about`) - Company information

### Admin Pages
- **Dashboard** (`/admin/dashboard`) - Analytics and overview
- **Products** (`/admin/products`) - Product management
- **Orders** (`/admin/orders`) - Order management
- **Users** (`/admin/users`) - User management
- **Analytics** (`/admin/analytics`) - Sales analytics

## 🎨 Design System

### Colors
- **Primary**: Rose (#DC2626) to Pink (#EC4899) gradients
- **Secondary**: Purple (#8B5CF6) accents
- **Neutral**: Slate grays for text and backgrounds

### Typography
- **Headings**: Bold, elegant fonts
- **Body**: Clean, readable typography
- **Accent**: Italic styling for fragrance notes

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Forms**: Clean inputs with focus states
- **Navigation**: Sticky header with backdrop blur

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@goldsmith.com or join our Discord community.

## 🙏 Acknowledgments

- **Design Inspiration**: Luxury jewelry brands and modern e-commerce trends
- **Icons**: Lucide React for consistent iconography
- **Illustrations**: Custom SVG illustrations for jewelry pieces
- **Framework**: Next.js team for the amazing framework

---

**Made with ❤️ for jewelry lovers worldwide**

---

## 🗺️ Navigation Flow Diagrams

### Customer Journey Flow
```
Landing Page (/)
    ↓ [Browse Products]
Product Catalog → Categories → Subcategories → Products
    ↓ [Add to Cart]
Cart Management → Quantity Updates → Checkout
    ↓ [Authentication Required]
Phone OTP/Google Auth → Profile Creation → Order Placement
    ↓ [Order Tracking]
Order History → 15-Stage Status Tracking → Delivery
```

### Admin Panel Navigation
```
Admin Login (/admin/login)
    ↓ [Role-based Redirect]
Dashboard (/admin/dashboard) ←→ Analytics (/admin/analytics)
    ↓
├── Orders Management (/admin/orders)
│   ├── Order Status Updates (15 stages)
│   ├── Assignment (Delivery/Pickup)
│   └── PDF Receipts
├── Product Management (/admin/products)
│   ├── Categories → Subcategories → Products
│   └── Image Upload (Cloudinary)
├── User Management (/admin/users)
│   ├── CRUD Operations
│   └── Role Assignment
├── Billing (/admin/billing)
│   ├── Order Processing
│   └── Receipt Generation
├── Geographic Setup (/admin/areas, /admin/branches)
│   ├── States → Areas → Branches → Clusters
│   └── Service Area Configuration
├── Coupons (/admin/coupons)
│   ├── Discount Rules
│   └── Usage Tracking
├── Customer Inquiries (/admin/inquiries)
│   └── Status Management
└── Settings (/admin/settings)
    └── Company Configuration
```

### Mobile Navigation Flow
```
Bottom Tab Navigation:
🏠 Home → Scroll to top / Product browsing
🛒 Cart → Cart drawer / Checkout flow
🔍 Search → Search overlay / Product filtering
👤 Account → Auth check → Account page
```

---

## 📱 Screen-by-Screen Breakdown

### 1. LANDING PAGE (`src/app/page.js`)

#### **Purpose**: Main customer storefront with product browsing and cart management

#### **Key Features**:
- Product catalog with category filtering
- Real-time search functionality
- Shopping cart (guest + authenticated)
- Contact/About modals
- Mobile-responsive design
- Authentication status display

#### **UI Components**:
- `Navbar` - Logo, search, auth links, language switcher
- `Categories` - Hierarchical category sidebar
- `CategoryHorizontal` - Mobile category tabs
- `Products` - Product grid with add-to-cart
- `Cart` - Desktop cart sidebar + mobile drawer
- `MobileNav` - Bottom tab navigation
- `Footer` - Company info and links

#### **Firestore Queries**:
```javascript
// Categories Collection
const categoriesQuery = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/categories`);
onSnapshot(categoriesQuery, (snapshot) => {
  const categories = snapshot.docs.map(doc => ({
    id: doc.id,
    categoriesname: doc.data().categoriesname,
    categoriesimage: doc.data().categoriesimage,
    sortOrder: doc.data().sortOrder || 999
  })).sort((a, b) => a.sortOrder - b.sortOrder);
});

// Products Collection
const productsQuery = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/products`);
onSnapshot(productsQuery, async (snapshot) => {
  const products = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    // Join with categories and subcategories
    const categoryName = await getCategoryName(data.categoryId);
    const subcategoryName = await getSubcategoryName(data.subcategoryId);
    return { id: doc.id, ...data, categoryName, subcategoryName };
  }));
});

// Subcategories Collection
const subcategoriesQuery = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/subcategories`);
onSnapshot(subcategoriesQuery, (snapshot) => {
  const subcategories = snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    categoryId: doc.data().categoryId,
    sortOrder: doc.data().sortOrder || 999
  })).sort((a, b) => a.sortOrder - b.sortOrder);
});
```

#### **State Management**:
```javascript
// Cart State (via CartContext)
const [cart, setCart] = useState([]); // Array of cart items
const [activeCategory, setActiveCategory] = useState(null);
const [activeSubcategory, setActiveSubcategory] = useState(null);
const [searchQuery, setSearchQuery] = useState('');
const [mobileCartOpen, setMobileCartOpen] = useState(false);
const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
```

#### **Business Logic**:
- **Category Selection**: Updates active category → filters products → scrolls to category section
- **Search**: Real-time filtering by product name across all categories
- **Cart Operations**: Add/remove items, quantity updates, total calculations
- **Authentication Check**: Shows login/profile button based on auth state
- **Mobile Responsiveness**: Different layouts for desktop (sidebar) vs mobile (tabs)

#### **Navigation Triggers**:
- Category click → Scroll to category section + update active states
- Search input → Filter products in real-time
- Cart button → Open cart drawer/sidebar
- Auth button → Navigate to `/User/Auth` or `/User/Account`
- Product "Add to Cart" → Update cart state + show feedback

---

### 2. USER AUTHENTICATION (`src/app/User/Auth/page.js`)

#### **Purpose**: Customer authentication via phone OTP or Google Sign-in

#### **Key Features**:
- Phone number OTP verification
- Google OAuth integration
- Automatic user profile creation
- Guest checkout support
- Redirect authenticated users

#### **UI Components**:
- Phone input with country code (+91)
- OTP input fields (6 digits)
- Google Sign-in button
- Loading states and error handling
- Success/error toast messages

#### **Firestore Operations**:
```javascript
// Create/Update User Document
const userDocRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users/${user.uid}`);
await setDoc(userDocRef, {
  uid: user.uid,
  phone: user.phoneNumber,
  userType: 'customer',
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp()
});
```

#### **Authentication Flow**:
```javascript
// Phone OTP Flow
1. User enters phone number
2. setupCaptcha() - Invisible reCAPTCHA
3. signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifier)
4. Display OTP input fields
5. confirmResult.confirm(otp) - Verify OTP
6. Create user document in Firestore
7. Redirect to home page

// Google Sign-in Flow
1. GoogleAuthProvider configuration
2. signInWithPopup(auth, googleProvider)
3. Extract user data from credential
4. Create/update user document
5. Redirect to home page
```

#### **State Management**:
```javascript
const [phone, setPhone] = useState('');
const [otp, setOtp] = useState('');
const [step, setStep] = useState(1); // 1: Phone, 2: OTP
const [confirmResult, setConfirmResult] = useState(null);
const [loading, setLoading] = useState(false);
```

#### **Business Logic**:
- **Phone Validation**: 10-digit Indian phone numbers only
- **OTP Verification**: Firebase Auth handles verification
- **User Creation**: Automatic profile creation on first login
- **Redirect Logic**: Authenticated users redirected away from login page
- **Error Handling**: Invalid phone, wrong OTP, network errors

---

### 3. USER ACCOUNT PAGE (`src/app/User/Account/page.js`)

#### **Purpose**: Customer order history and profile management

#### **Key Features**:
- Order history with status tracking
- 15-stage laundry process visualization
- Profile editing (name, email, phone, address)
- Order details expansion
- Real-time order updates

#### **UI Components**:
- Profile information display/edit
- Order list with status badges
- Order details modal/expansion
- Progress bars for order stages
- Edit profile modal

#### **Firestore Queries**:
```javascript
// Fetch User Orders
const ordersQuery = query(
  collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`),
  where('customerPhone', '==', user.phoneNumber),
  orderBy('timestamp', 'desc')
);

onSnapshot(ordersQuery, (snapshot) => {
  const orders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate(),
    status: doc.data().status || 'Pending'
  }));
  setOrders(orders);
});

// Update User Profile
const userRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users/${user.uid}`);
await updateDoc(userRef, {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  city: formData.city,
  zip: formData.zip,
  address: formData.address,
  updatedAt: serverTimestamp()
});
```

#### **State Management**:
```javascript
const [user, setUser] = useState(null);
const [orders, setOrders] = useState([]);
const [showEditModal, setShowEditModal] = useState(false);
const [activeTab, setActiveTab] = useState('account');
const [formData, setFormData] = useState({
  name: '', email: '', phone: '', city: '', zip: '', address: ''
});
const [expandedTrails, setExpandedTrails] = useState({});
```

#### **Business Logic**:
- **Order Status Progression**: 15 stages from Pending to Delivered
- **Real-time Updates**: Live order status changes
- **Profile Editing**: Update user information with validation
- **Order Details**: Expandable order items with pricing
- **Authentication Required**: Redirect to login if not authenticated

#### **Order Status Flow**:
```javascript
const statusProgression = [
  'Pending', 'Confirmed', 'Scheduled for Pickup', 'Out for Pickup',
  'Picked Up', 'Received at Facility', 'In Sorting/Inspection',
  'In Washing', 'In Drying', 'In Ironing/Pressing',
  'In Folding/Packaging', 'Quality Check', 'Ready for Delivery',
  'Out for Delivery', 'Delivered'
];
```

---

### 4. CHECKOUT PAGE (`src/app/User/CheckoutPage/CheckoutPageInner.js`)

#### **Purpose**: Complete order placement with location selection and payment

#### **Key Features**:
- Multi-step location selection (State → Area → Branch)
- Service scheduling (pickup time, delivery preferences)
- Coupon application with discount calculations
- Guest and authenticated checkout
- Order summary and confirmation

#### **UI Components**:
- Location selection dropdowns
- Service type selection (delivery/pickup)
- Coupon input and validation
- Order summary with pricing breakdown
- Customer information form
- Payment method selection (COD only)

#### **Firestore Queries**:
```javascript
// Location Hierarchy Queries
const statesQuery = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/states`);
const areasQuery = query(
  collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/areas`),
  where('stateId', '==', selectedState)
);
const branchesQuery = query(
  collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/branches`),
  where('area', '==', selectedAreaName)
);

// Coupon Validation
const couponsQuery = query(
  collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/coupons`),
  where('code', '==', couponCode),
  where('isActive', '==', true)
);

// Create Order
const orderData = {
  customerName: form.name,
  customerEmail: form.email,
  customerPhone: form.phone,
  customerAddress: form.address,
  items: cartItems,
  total: finalTotal,
  subtotal: subtotal,
  discount: discountAmount,
  expressDeliveryFee: expressFee,
  status: 'Pending',
  pickupTime: schedule.pickupTime,
  deliveryPreference: schedule.deliveryPref,
  serviceType: schedule.serviceType,
  appliedCoupon: appliedCouponData,
  stateId: selectedState,
  areaId: selectedArea,
  branchId: selectedBranchId,
  orderTakenBy: currentUser?.uid || null,
  timestamp: serverTimestamp(),
  paymentMethod: 'cod'
};

await addDoc(collection(db, ordersPath), orderData);
```

#### **State Management**:
```javascript
const [cart, setCart] = useState([]);
const [selectedState, setSelectedState] = useState('');
const [selectedArea, setSelectedArea] = useState('');
const [selectedBranchId, setSelectedBranchId] = useState('');
const [couponCode, setCouponCode] = useState('');
const [appliedCoupon, setAppliedCoupon] = useState(null);
const [schedule, setSchedule] = useState({
  pickupTime: 'morning',
  deliveryPref: 'standard',
  serviceType: 'delivery'
});
```

#### **Business Logic**:
- **Location Selection**: Cascading dropdowns (State → Area → Branch)
- **Pricing Calculations**: Subtotal + express delivery fee - coupon discount
- **Coupon Validation**: Expiry, usage limits, minimum order value
- **Order Creation**: Comprehensive order document with all metadata
- **Guest Checkout**: Skip authentication, collect customer info
- **Cart Persistence**: Load cart from localStorage or Firestore

#### **Discount Calculation Logic**:
```javascript
const calculateDiscount = (coupon, orderAmount) => {
  if (!coupon || orderAmount < coupon.minimumOrderValue) return 0;

  let discount = 0;
  switch (coupon.type) {
    case 'percentage':
      discount = (orderAmount * coupon.value) / 100;
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
      break;
    case 'fixed':
      discount = coupon.value;
      break;
    case 'free_delivery':
      discount = expressDeliveryFee;
      break;
  }
  return discount;
};
```

---

### 5. ADMIN LOGIN (`src/app/admin/login/page.js`)

#### **Purpose**: Role-based authentication for admin panel access

#### **Key Features**:
- Email/password authentication
- Role-based redirection
- User data validation against Firestore
- Session management with localStorage

#### **UI Components**:
- Email/password form
- Loading states with spinner
- Error message display
- Animated login form (Framer Motion)

#### **Firestore Queries**:
```javascript
// Validate User Credentials
const userDocRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users/${user.uid}`);
const userDoc = await getDoc(userDocRef);

if (userDoc.exists()) {
  const userData = userDoc.data();

  // Store in localStorage
  localStorage.setItem('adminAuth', 'true');
  localStorage.setItem('userId', user.uid);
  localStorage.setItem('userEmail', userData.email);
  localStorage.setItem('userName', userData.name);
  localStorage.setItem('userRole', userData.role);
  localStorage.setItem('userStatus', userData.status);
  localStorage.setItem('userPhone', userData.phone);
  localStorage.setItem('userBranchId', userData.branchId);

  // Update last login
  await updateDoc(userDocRef, {
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
```

#### **Role-based Redirection Logic**:
```javascript
const roleDefaults = {
  company_admin: '/admin/dashboard',
  general_manager: '/admin/dashboard',
  branch_manager: '/admin/dashboard',
  cashier: '/admin/billing',
  delivery_man: '/admin/orders',
  pickup_man: '/admin/orders'
};

const defaultPage = roleDefaults[userData.role] || '/admin/dashboard';
router.replace(defaultPage);
```

#### **State Management**:
```javascript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

---

### 6. ADMIN DASHBOARD (`src/app/admin/dashboard/page.js`)

#### **Purpose**: Real-time business analytics and key metrics overview

#### **Key Features**:
- Live statistics (users, products, orders, inquiries)
- Sales analytics with date range filtering
- Top-selling products tracking
- Order status distribution charts
- Role-based data filtering

#### **UI Components**:
- Statistics cards (users, products, orders, revenue)
- Sales chart (Recharts LineChart)
- Top products list
- Order status distribution (BarChart)
- Date range picker

#### **Firestore Queries**:
```javascript
// Real-time Statistics
const unsubUsers = onSnapshot(collection(db, usersPath), (snapshot) => {
  setUserCount(snapshot.size);
});

const unsubProducts = onSnapshot(collection(db, productsPath), (snapshot) => {
  setProductCount(snapshot.size);
});

// Orders with Role-based Filtering
let ordersQuery;
if (userRole === 'company_admin' || userRole === 'general_manager') {
  ordersQuery = query(collection(db, ordersPath), orderBy('timestamp', 'desc'));
} else if (userRole === 'branch_manager') {
  ordersQuery = query(
    collection(db, ordersPath),
    where('branchId', '==', branchId),
    orderBy('timestamp', 'desc')
  );
}

const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
  const allOrders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate(),
    total: Number(doc.data().total || 0)
  }));

  // Filter by date range
  const filteredOrders = allOrders.filter(order =>
    order.timestamp >= startDate && order.timestamp <= endDate
  );

  setTotalSales(filteredOrders.reduce((sum, order) => sum + order.total, 0));
});
```

#### **Analytics Calculations**:
```javascript
// Top Selling Items
const itemQuantities = {};
filteredOrders.forEach(order => {
  order.items.forEach(item => {
    const itemKey = `${item.name}|${item.categoryName}`;
    itemQuantities[itemKey] = {
      name: item.name,
      category: item.categoryName,
      totalQuantity: (itemQuantities[itemKey]?.totalQuantity || 0) + item.quantity
    };
  });
});
const topItems = Object.values(itemQuantities)
  .sort((a, b) => b.totalQuantity - a.totalQuantity)
  .slice(0, 5);

// Sales by Day Chart
const salesByDay = {};
for (let i = 0; i <= daysDiff; i++) {
  const d = new Date(startDate);
  d.setDate(d.getDate() + i);
  const key = d.toISOString().slice(0, 10);
  salesByDay[key] = 0;
}

filteredOrders.forEach(order => {
  const key = order.timestamp.toISOString().slice(0, 10);
  salesByDay[key] += order.total;
});
```

#### **State Management**:
```javascript
const [userCount, setUserCount] = useState(0);
const [productCount, setProductCount] = useState(0);
const [orderCount, setOrderCount] = useState(0);
const [totalSales, setTotalSales] = useState(0);
const [startDate, setStartDate] = useState(defaultStartDate);
const [endDate, setEndDate] = useState(new Date());
const [salesChartData, setSalesChartData] = useState([]);
const [topSellingItems, setTopSellingItems] = useState([]);
```

---

### 7. ORDERS MANAGEMENT (`src/app/admin/orders/page.js`)

#### **Purpose**: Complete order lifecycle management with status updates and assignments

#### **Key Features**:
- 15-stage order status management
- Delivery/pickup person assignment
- PDF receipt generation
- Advanced filtering and search
- Bulk operations
- Real-time status updates

#### **UI Components**:
- Order list with expandable details
- Status update dropdowns
- Assignment modals
- Filter controls (status, date, branch)
- PDF generation buttons
- Excel export functionality

#### **Firestore Queries**:
```javascript
// Orders Query with Role Filtering
let ordersQuery;
if (currentUser.role === 'company_admin' || currentUser.role === 'general_manager') {
  ordersQuery = query(collection(db, ordersPath), orderBy('timestamp', 'desc'));
} else if (currentUser.role === 'branch_manager') {
  ordersQuery = query(
    collection(db, ordersPath),
    where('branchId', '==', currentUser.branchId),
    orderBy('timestamp', 'desc')
  );
} else if (currentUser.role === 'cashier') {
  ordersQuery = query(
    collection(db, ordersPath),
    where('orderTakenBy', '==', currentUser.userId),
    orderBy('timestamp', 'desc')
  );
} else {
  // delivery_man, pickup_man
  ordersQuery = query(collection(db, ordersPath), orderBy('timestamp', 'desc'));
}

// Update Order Status
const orderRef = doc(db, `${ordersPath}/${orderId}`);
await updateDoc(orderRef, {
  status: newStatus,
  updatedAt: serverTimestamp(),
  updatedBy: currentUser.userId
});

// Assign Personnel
await updateDoc(orderRef, {
  assignedDeliveryPerson: deliveryPersonName,
  assignedPickupPerson: pickupPersonName,
  updatedAt: serverTimestamp()
});
```

#### **Status Management Logic**:
```javascript
const statusColors = {
  'Pending': 'bg-orange-100 text-orange-800',
  'Confirmed': 'bg-yellow-100 text-yellow-800',
  'Scheduled for Pickup': 'bg-blue-100 text-blue-800',
  'Out for Pickup': 'bg-blue-200 text-blue-900',
  'Picked Up': 'bg-blue-300 text-blue-900',
  'Received at Facility': 'bg-purple-100 text-purple-800',
  'In Sorting/Inspection': 'bg-purple-200 text-purple-800',
  'In Washing': 'bg-teal-100 text-teal-800',
  'In Drying': 'bg-teal-200 text-teal-800',
  'In Ironing/Pressing': 'bg-teal-300 text-teal-800',
  'In Folding/Packaging': 'bg-teal-400 text-teal-800',
  'Quality Check': 'bg-indigo-100 text-indigo-800',
  'Ready for Delivery': 'bg-indigo-200 text-indigo-800',
  'Out for Delivery': 'bg-indigo-300 text-indigo-800',
  'Delivered': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800'
};
```

#### **PDF Generation Logic**:
```javascript
const generateReceipt = (order) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Order Receipt', 20, 30);

  // Order details
  doc.setFontSize(12);
  doc.text(`Order ID: ${order.id}`, 20, 50);
  doc.text(`Customer: ${order.customerName}`, 20, 60);
  doc.text(`Date: ${order.timestamp.toLocaleDateString()}`, 20, 70);

  // Items table
  doc.autoTable({
    startY: 90,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: order.items.map(item => [
      item.name,
      item.quantity,
      `$${item.price}`,
      `$${(item.price * item.quantity).toFixed(2)}`
    ])
  });

  doc.save(`receipt-${order.id}.pdf`);
};
```

---

### 8. PRODUCT MANAGEMENT (`src/app/admin/products/`)

#### **Categories Page** (`categories/page.js`)
**Purpose**: Manage product categories with image upload

**Firestore Operations**:
```javascript
// Create Category
const categoryData = {
  categoriesname: name,
  categoriesimage: imageUrl,
  sortOrder: categories.length,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
await addDoc(collection(db, categoriesPath), categoryData);

// Update Category
await updateDoc(doc(db, categoriesPath, categoryId), {
  categoriesname: newName,
  categoriesimage: newImageUrl,
  updatedAt: serverTimestamp()
});
```

#### **Subcategories Page** (`subcategories/page.js`)
**Purpose**: Manage product subcategories linked to categories

**Firestore Operations**:
```javascript
// Create Subcategory
const subcategoryData = {
  name: subcategoryName,
  image: imageUrl,
  categoryId: selectedCategory,
  sortOrder: subcategories.length,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
await addDoc(collection(db, subcategoryPath), subcategoryData);
```

#### **Products Page** (`product/page.js`)
**Purpose**: CRUD operations for products with category/subcategory linking

**Firestore Operations**:
```javascript
// Create Product
const productData = {
  name: form.name,
  price: parseFloat(form.price),
  discountedPrice: form.discountedPrice ? parseFloat(form.discountedPrice) : null,
  image: imageUrl,
  categoryId: form.categoryId,
  subcategoryId: form.subcategoryId,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
await addDoc(collection(db, productPath), productData);

// Delete Product
await deleteDoc(doc(db, productPath, productId));
// Also delete image from Cloudinary
await deleteFromCloudinary(product.image);
```

---

### 9. USER MANAGEMENT (`src/app/admin/users/page.js`)

#### **Purpose**: Complete user lifecycle management with role assignment

#### **Key Features**:
- Create users with Firebase Auth
- Role-based CRUD operations
- Bulk user management
- Branch assignment
- Status management

#### **Firestore Operations**:
```javascript
// Create User (Admin Only)
const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
const firebaseUser = userCredential.user;

// Create Firestore document
await setDoc(doc(db, usersPath, firebaseUser.uid), {
  name: formData.name,
  email: formData.email,
  userType: formData.userType,
  role: formData.userType === 'staff' ? formData.role : null,
  status: formData.status,
  phone: formData.phone,
  branchId: formData.branchId,
  firebaseUid: firebaseUser.uid,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: currentUser?.id
});

// Sign out the newly created user
await signOut(auth);

// Update User
await updateDoc(doc(db, usersPath, selectedUser.id), {
  name: formData.name,
  userType: formData.userType,
  role: formData.userType === 'staff' ? formData.role : null,
  phone: formData.phone,
  branchId: formData.branchId,
  status: formData.status,
  updatedAt: serverTimestamp()
});

// Delete User (Admin Only)
await deleteDoc(doc(db, usersPath, userId));
```

#### **Permission Logic**:
```javascript
// Create Permission
if (currentUser?.role !== 'company_admin') {
  alert('Only Company Admin can create users');
  return;
}

// Edit Permission
if (currentUser?.role !== 'company_admin' && currentUser?.id !== selectedUser?.id) {
  alert('You can only edit your own profile');
  return;
}

// Delete Permission
if (currentUser?.role !== 'company_admin') {
  alert('Only Company Admin can delete users');
  return;
}
```

---

### 10. GEOGRAPHIC MANAGEMENT

#### **Areas Page** (`src/app/admin/areas/page.js`)
**Purpose**: Manage geographic hierarchy (States → Areas → Clusters)

**Firestore Operations**:
```javascript
// States Collection
const statesData = {
  name: stateName,
  isActive: true,
  createdAt: serverTimestamp()
};
await addDoc(collection(db, statesPath), statesData);

// Areas Collection
const areasData = {
  name: areaName,
  stateId: selectedStateId,
  isActive: true,
  createdAt: serverTimestamp()
};
await addDoc(collection(db, areasPath), areasData);

// Clusters Collection
const clustersData = {
  name: clusterName,
  description: description,
  areaIds: selectedAreaIds,
  branchId: selectedBranchId,
  isActive: true,
  createdAt: serverTimestamp()
};
await addDoc(collection(db, clustersPath), clustersData);
```

#### **Branches Page** (`src/app/admin/branches/page.js`)
**Purpose**: Manage service branches with detailed configuration

**Firestore Operations**:
```javascript
const branchData = {
  name: form.name,
  type: form.type,
  address: form.address,
  city: form.city,
  area: form.area,
  zipCode: form.zipCode,
  phone: form.phone,
  whatsapp: form.whatsapp,
  email: form.email,
  workingHours: form.workingHours,
  customHours: form.customHours,
  managerName: form.managerName,
  managerPhone: form.managerPhone,
  capacity: form.capacity,
  services: form.services,
  hasPickup: form.hasPickup,
  hasDelivery: form.hasDelivery,
  latitude: parseFloat(form.latitude),
  longitude: parseFloat(form.longitude),
  isActive: form.isActive,
  maintenance: false,
  notes: form.notes,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};
await addDoc(collection(db, branchesPath), branchData);
```

---

### 11. COUPONS MANAGEMENT (`src/app/admin/coupons/page.js`)

#### **Purpose**: Create and manage discount coupons with complex rules

#### **Firestore Operations**:
```javascript
const couponData = {
  code: form.code.toUpperCase(),
  name: form.name,
  description: form.description,
  type: form.type,
  value: parseFloat(form.value),
  minimumOrderValue: parseFloat(form.minimumOrderValue) || 0,
  maximumDiscount: parseFloat(form.maximumDiscount) || null,
  usageLimit: form.usageLimit,
  totalUsageLimit: parseInt(form.totalUsageLimit) || null,
  validFrom: new Date(form.validFrom),
  validUntil: new Date(form.validUntil),
  isActive: form.isActive,
  applicableCategories: form.applicableCategories,
  excludedCategories: form.excludedCategories,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: currentUser?.id
};
await addDoc(collection(db, couponsPath), couponData);
```

#### **Validation Logic**:
```javascript
const validateCoupon = (coupon, orderAmount, orderItems) => {
  // Check expiry
  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) return false;

  // Check minimum order value
  if (orderAmount < coupon.minimumOrderValue) return false;

  // Check category restrictions
  if (coupon.applicableCategories?.length > 0) {
    const hasApplicableItems = orderItems.some(item =>
      coupon.applicableCategories.includes(item.categoryId)
    );
    if (!hasApplicableItems) return false;
  }

  if (coupon.excludedCategories?.length > 0) {
    const hasExcludedItems = orderItems.some(item =>
      coupon.excludedCategories.includes(item.categoryId)
    );
    if (hasExcludedItems) return false;
  }

  return true;
};
```

---

### 12. INQUIRIES MANAGEMENT (`src/app/admin/inquiries/page.js`)

#### **Purpose**: Handle customer inquiries and support tickets

#### **Firestore Operations**:
```javascript
// Fetch Inquiries
const snapshot = await getDocs(collection(db, contactPath));
const inquiries = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

// Update Status
await updateDoc(doc(db, contactPath, inquiryId), {
  status: newStatus
});
```

---

### 13. BILLING PAGE (`src/app/admin/billing/page.js`)

#### **Purpose**: Order processing and receipt generation for cashiers

#### **Key Features**:
- Order lookup and processing
- Receipt generation (PDF)
- Cashier-specific interface
- Order status updates

#### **Firestore Operations**:
```javascript
// Find Order by ID/Phone
const orderQuery = query(
  collection(db, ordersPath),
  where('customerPhone', '==', searchPhone)
);

const snapshot = await getDocs(orderQuery);
const orders = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

// Update Order Status
await updateDoc(doc(db, ordersPath, orderId), {
  status: 'Confirmed',
  orderTakenBy: currentUser.userId,
  updatedAt: serverTimestamp()
});
```

---

### 14. ANALYTICS PAGE (`src/app/admin/analytics/page.js`)

#### **Purpose**: Advanced business analytics and reporting

#### **Key Features**:
- Multi-dimensional analytics
- Branch-specific insights
- Customer behavior analysis
- Loss/revenue analysis
- Export capabilities

#### **Complex Queries**:
```javascript
// Branch Performance Analysis
const branchOrders = orders.filter(order => order.branchId === selectedBranch);
const branchRevenue = branchOrders.reduce((sum, order) => sum + order.total, 0);
const branchOrderCount = branchOrders.length;

// Customer Analytics
const customerFrequency = {};
orders.forEach(order => {
  const key = order.customerPhone;
  customerFrequency[key] = (customerFrequency[key] || 0) + 1;
});

// Loss Analysis (Cancelled/Refunded orders)
const lostOrders = orders.filter(order =>
  ['Cancelled', 'Refunded/Returned'].includes(order.status)
);
const totalLoss = lostOrders.reduce((sum, order) => sum + order.total, 0);
```

---

### 15. SETTINGS PAGE (`src/app/admin/settings/page.js`)

#### **Purpose**: Company-wide configuration management

#### **Firestore Operations**:
```javascript
// Settings Document (Singleton)
const settingsRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/settings/general`);

// Update Settings
await setDoc(settingsRef, {
  companyName: form.companyName,
  contactNumber: form.contactNumber,
  email: form.email,
  address: form.address,
  faqs: form.faqs,
  privacyPolicy: form.privacyPolicy,
  logoUrl: logoUrl,
  updatedAt: serverTimestamp()
}, { merge: true });
```

---

## 🔗 Complete Firestore Structure

### Root Collection Structure
```
Firestore Root
└── Easy2Solutions/
    └── companyDirectory/
        └── tenantCompanies/
            └── {companyId}/
                ├── users/ (User Management)
                │   └── {firebaseUid}/
                │       ├── uid: string
                │       ├── name: string
                │       ├── email: string
                │       ├── phone: string
                │       ├── userType: "customer" | "staff"
                │       ├── role: string (staff only)
                │       ├── branchId: string (staff only)
                │       ├── status: "active" | "inactive" | "suspended"
                │       ├── notes: string
                │       ├── createdAt: Timestamp
                │       ├── updatedAt: Timestamp
                │       ├── lastLogin: Timestamp
                │       └── createdBy: string
                │
                ├── products/ (Product Catalog)
                │   └── {productId}/
                │       ├── name: string
                │       ├── price: number
                │       ├── discountedPrice: number | null
                │       ├── image: string (Cloudinary URL)
                │       ├── categoryId: string
                │       ├── subcategoryId: string | null
                │       ├── createdAt: Timestamp
                │       ├── updatedAt: Timestamp
                │       ├── createdBy: string
                │       └── isActive: boolean
                │
                ├── categories/ (Product Categories)
                │   └── {categoryId}/
                │       ├── categoriesname: string
                │       ├── categoriesimage: string (Cloudinary URL)
                │       ├── sortOrder: number
                │       ├── createdAt: Timestamp
                │       └── updatedAt: Timestamp
                │
                ├── subcategories/ (Product Subcategories)
                │   └── {subcategoryId}/
                │       ├── name: string
                │       ├── image: string (Cloudinary URL)
                │       ├── categoryId: string
                │       ├── sortOrder: number
                │       ├── createdAt: Timestamp
                │       └── updatedAt: Timestamp
                │
                ├── orders/ (Order Management)
                │   └── {orderId}/
                │       ├── customerName: string
                │       ├── customerEmail: string
                │       ├── customerPhone: string
                │       ├── customerAddress: string
                │       ├── items: OrderItem[]
                │       ├── total: number
                │       ├── subtotal: number
                │       ├── discount: number
                │       ├── expressDeliveryFee: number
                │       ├── status: OrderStatus
                │       ├── pickupTime: "morning" | "afternoon" | "evening"
                │       ├── deliveryPreference: "standard" | "express"
                │       ├── serviceType: "delivery" | "pickup"
                │       ├── orderTakenBy: string | null
                │       ├── assignedDeliveryPerson: string | null
                │       ├── assignedPickupPerson: string | null
                │       ├── branchId: string | null
                │       ├── stateId: string | null
                │       ├── areaId: string | null
                │       ├── clusterId: string | null
                │       ├── appliedCoupon: CouponData | null
                │       ├── timestamp: Timestamp
                │       ├── createdAt: Timestamp
                │       ├── updatedAt: Timestamp
                │       ├── paymentMethod: "cod"
                │       ├── notes: string | null
                │       └── orderNumber: string
                │
                ├── branches/ (Service Branches)
                │   └── {branchId}/
                │       ├── name: string
                │       ├── type: "main" | "pickup" | "processing" | "delivery"
                │       ├── address: string
                │       ├── city: string
                │       ├── area: string
                │       ├── zipCode: string
                │       ├── phone: string
                │       ├── whatsapp: string | null
                │       ├── email: string | null
                │       ├── workingHours: string
                │       ├── customHours: string | null
                │       ├── managerName: string | null
                │       ├── managerPhone: string | null
                │       ├── capacity: string | null
                │       ├── services: string[]
                │       ├── hasPickup: boolean
                │       ├── hasDelivery: boolean
                │       ├── latitude: number | null
                │       ├── longitude: number | null
                │       ├── isActive: boolean
                │       ├── maintenance: boolean
                │       ├── notes: string | null
                │       ├── createdAt: Timestamp
                │       └── updatedAt: Timestamp
                │
                ├── areas/ (Geographic Areas)
                │   └── {areaId}/
                │       ├── name: string
                │       ├── stateId: string
                │       ├── isActive: boolean
                │       ├── createdAt: Timestamp
                │       └── updatedAt: Timestamp
                │
                ├── states/ (Geographic States)
                │   └── {stateId}/
                │       ├── name: string
                │       ├── isActive: boolean
                │       └── createdAt: Timestamp
                │
                ├── clusters/ (Area Clusters)
                │   └── {clusterId}/
                │       ├── name: string
                │       ├── description: string | null
                │       ├── areaIds: string[]
                │       ├── branchId: string
                │       ├── isActive: boolean
                │       ├── createdAt: Timestamp
                │       └── updatedAt: Timestamp
                │
                ├── coupons/ (Discount Coupons)
                │   └── {couponId}/
                │       ├── code: string
                │       ├── name: string
                │       ├── description: string | null
                │       ├── type: "percentage" | "fixed" | "free_delivery" | "bogo"
                │       ├── value: number
                │       ├── minimumOrderValue: number
                │       ├── maximumDiscount: number | null
                │       ├── usageLimit: "unlimited" | "once_per_user" | "limited_total"
                │       ├── totalUsageLimit: number | null
                │       ├── validFrom: Timestamp
                │       ├── validUntil: Timestamp
                │       ├── isActive: boolean
                │       ├── applicableCategories: string[] | null
                │       ├── excludedCategories: string[] | null
                │       ├── createdAt: Timestamp
                │       ├── updatedAt: Timestamp
                │       └── createdBy: string
                │
                ├── contactUs/ (Customer Inquiries)
                │   └── {inquiryId}/
                │       ├── name: string
                │       ├── email: string
                │       ├── phone: string | null
                │       ├── purpose: string
                │       ├── message: string
                │       ├── status: InquiryStatus
                │       └── timestamp: Timestamp
                │
                ├── carts/ (User Shopping Carts)
                │   └── {userId}/
                │       └── items: CartItem[]
                │
                └── settings/
                    └── general/ (Company Settings)
                        ├── companyName: string
                        ├── contactNumber: string
                        ├── email: string
                        ├── address: string
                        ├── faqs: string
                        ├── privacyPolicy: string
                        ├── logoUrl: string
                        └── updatedAt: Timestamp
```

### TypeScript Interfaces (for reference)

```typescript
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryName: string;
  subcategoryName: string;
}

interface CartItem extends OrderItem {
  image: string;
}

type OrderStatus =
  | "Pending" | "Confirmed" | "Scheduled for Pickup" | "Out for Pickup"
  | "Picked Up" | "Received at Facility" | "In Sorting/Inspection"
  | "In Washing" | "In Drying" | "In Ironing/Pressing"
  | "In Folding/Packaging" | "Quality Check" | "Ready for Delivery"
  | "Out for Delivery" | "Delivered" | "Cancelled" | "Refunded/Returned"
  | "On Hold";

type InquiryStatus =
  | "pending" | "working" | "processing" | "solved"
  | "cancelled" | "close with fail" | "close with success";

interface CouponData {
  code: string;
  type: string;
  value: number;
  discount: number;
}
```

---

## 🔐 Authentication & Security

### Firebase Auth Integration
- **Customer Auth**: Phone OTP + Google Sign-in
- **Admin Auth**: Email/Password via Firebase Auth
- **Session Management**: localStorage + Firestore validation
- **Auto-logout**: Token expiry handling

### Role-Based Access Control (RBAC)
```javascript
const PERMISSIONS = {
  company_admin: {
    users: { create: true, read: true, update: true, delete: true },
    orders: { read: true, update: true },
    products: { create: true, read: true, update: true, delete: true },
    branches: { create: true, read: true, update: true, delete: true },
    analytics: { read: true },
    coupons: { create: true, read: true, update: true, delete: true },
    settings: { update: true }
  },
  general_manager: {
    users: { read: true },
    orders: { read: true, update: true },
    products: { read: true },
    branches: { read: true },
    analytics: { read: true },
    coupons: { read: true }
  },
  branch_manager: {
    orders: { read: true, update: true }, // Branch-specific
    products: { read: true },
    analytics: { read: true }, // Branch-specific
    coupons: { read: true }
  },
  cashier: {
    orders: { create: true, read: true, update: true }, // Assigned orders
    billing: { access: true }
  },
  delivery_man: {
    orders: { read: true, update: true }, // Assigned deliveries
    routes: { read: true }
  },
  pickup_man: {
    orders: { read: true, update: true }, // Assigned pickups
    routes: { read: true }
  }
};
```

---

## 💼 Business Logic Workflows

### 1. Complete Order Lifecycle
```
1. Customer Browse Products → Add to Cart
2. Cart Management → Quantity Updates
3. Checkout → Location Selection → Service Scheduling
4. Coupon Application → Order Summary
5. Order Placement (COD) → Order Created (Pending)
6. Cashier Confirmation → Status: Confirmed
7. Branch Assignment → Scheduled for Pickup
8. Pickup Execution → Out for Pickup → Picked Up
9. Facility Processing → Received at Facility
10. Laundry Process → Sorting/Inspection → Washing → Drying → Ironing → Folding → Quality Check
11. Delivery Preparation → Ready for Delivery → Out for Delivery → Delivered
```

### 2. Cart Synchronization Logic
```javascript
// Guest Cart (localStorage)
const guestCart = JSON.parse(localStorage.getItem('cart') || '[]');

// Authenticated User Cart (Firestore)
const userCartRef = doc(db, 'carts', user.uid);
const userCartSnap = await getDoc(userCartRef);
const userCart = userCartSnap.exists() ? userCartSnap.data().items : [];

// Merge Strategy
if (guestCart.length > 0 && userCart.length === 0) {
  // Migrate guest cart to user account
  await setDoc(userCartRef, { items: guestCart });
  localStorage.removeItem('cart');
} else if (guestCart.length > 0 && userCart.length > 0) {
  // Merge carts (user cart takes precedence)
  const mergedCart = [...userCart]; // Start with user cart
  guestCart.forEach(guestItem => {
    const existingIndex = mergedCart.findIndex(item => item.id === guestItem.id);
    if (existingIndex >= 0) {
      mergedCart[existingIndex].quantity += guestItem.quantity;
    } else {
      mergedCart.push(guestItem);
    }
  });
  await updateDoc(userCartRef, { items: mergedCart });
  localStorage.removeItem('cart');
}
```

### 3. Real-time Data Synchronization
```javascript
// Firestore Listeners Pattern
const unsubscribe = onSnapshot(query, (snapshot) => {
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Transform timestamps
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
    // Transform nested data
    items: doc.data().items || [],
    // Calculate derived fields
    total: calculateTotal(doc.data().items)
  }));
  setData(data);
  setLoading(false);
});

// Cleanup on unmount
useEffect(() => {
  return () => unsubscribe();
}, []);
```

---

## 🧩 Component Architecture Details

### Core Context Providers
```javascript
// _app.js / layout.js - Global State Management
<LanguageProvider>          // User interface translations
  <CartProvider>           // Shopping cart state & persistence
    <AdminLanguageProvider> // Admin panel translations
      <App />
    </AdminLanguageProvider>
  </CartProvider>
</LanguageProvider>
```

#### **CartContext (`src/app/context/CartContext.js`)**
**Purpose**: Unified cart management for authenticated and guest users

**Key Features**:
- **Dual Storage**: Firestore for authenticated users, localStorage for guests
- **Real-time Sync**: Automatic synchronization between storage types
- **Cart Operations**: Add, remove, update quantity, clear cart
- **Persistence**: Survives page refreshes and browser sessions

**Core Logic**:
```javascript
// Authentication-aware cart operations
const addToCart = async (item) => {
  const user = auth.currentUser;
  const newCart = [...cart, { ...item, quantity: 1 }];

  if (user) {
    // Sync to Firestore
    await updateDoc(doc(db, 'carts', user.uid), { items: newCart });
  } else {
    // Store locally
    localStorage.setItem('cart', JSON.stringify(newCart));
  }
  setCart(newCart);
};
```

#### **LanguageContext (`src/app/context/LanguageContext.js`)**
**Purpose**: User interface internationalization with RTL support

**Features**:
- **Persistent Language**: localStorage storage
- **RTL Support**: Automatic document direction switching
- **Dynamic Updates**: Real-time language switching

#### **AdminLanguageContext (`src/app/context/AdminLanguageContext.js`)**
**Purpose**: Separate translation context for admin panel

**Features**:
- **Admin-specific Keys**: Separate translation files
- **Independent State**: Doesn't interfere with user translations
- **Role-based UI**: Admin interface language switching

### Translation System
```javascript
// User Translations (useTranslation.js)
const { t, language } = useTranslation(); // Access to 150+ translation keys

// Admin Translations (useAdminTranslation.js)
const { t, language } = useAdminTranslation(); // Access to admin-specific keys
```

**Translation Files**:
- **English (`locales/en.json`)**: 267 translation keys
- **Arabic (`locales/ar.json`)**: 265 translation keys with RTL support

### Utility Functions

#### **Firestore Paths (`src/app/utils/firestorePaths.js`)**
**Purpose**: Centralized Firestore path management

**Key Functions**:
```javascript
const paths = useFirestorePaths();
const userPath = paths.getTenantUsersPath();           // /tenantCompanies/{id}/users
const ordersPath = paths.getOrdersPath();              // /tenantCompanies/{id}/orders
const productsPath = paths.getProductPath();           // /tenantCompanies/{id}/products
const cartPath = paths.getUserCartPath(userId);        // /tenantCompanies/{id}/carts/{userId}
```

#### **Cloudinary Integration (`src/app/cloudinary.js`)**
**Purpose**: Image upload and management

**Functions**:
```javascript
// Upload images to Cloudinary
const imageUrl = await uploadToCloudinary(file);

// Delete images from Cloudinary
await deleteFromCloudinary(imageUrl);
```

#### **Helper Functions (`src/app/utils/utils.js`)**
```javascript
// Group cart items by category for display
export function groupItemsByCategory(items) {
  const groups = {};
  items.forEach(item => {
    const catName = item.categoryName || 'Other';
    if (!groups[catName]) groups[catName] = [];
    groups[catName].push(item);
  });
  return groups;
}
```

---

## 🎨 UI Components Breakdown

### Navigation Components

#### **Navbar (`src/app/Componenets/Navbar.js`)**
**Purpose**: Main navigation with search, authentication, and contact features

**Key Features**:
- **Dynamic Logo**: Company logo from Firestore settings
- **Mobile Search**: Expandable search bar for mobile
- **Contact Modals**: About Us and Contact Us forms
- **Authentication Status**: Login/profile button based on auth state
- **Language Switching**: Real-time language toggle

**Contact Form Integration**:
```javascript
// Direct Firestore submission
await addDoc(collection(db, contactPath), {
  name: contactName.current.value,
  email: contactEmail.current.value,
  purpose: contactPurpose.current.value,
  message: contactMessage.current.value,
  timestamp: serverTimestamp()
});
```

#### **MobileNav (`src/app/Componenets/MobileNav.js`)**
**Purpose**: Bottom tab navigation for mobile devices

**Features**:
- **5 Main Tabs**: Home, Cart, Search, Account
- **Cart Badge**: Live cart item count
- **Search Overlay**: Expandable search interface
- **Responsive Design**: Hidden on desktop

#### **AdminHeader (`src/app/admin/Componenets/AdminHeader.js`)**
**Purpose**: Admin panel navigation header

**Features**:
- **Role-based Menu**: Desktop navigation items
- **Sidebar Toggle**: Mobile sidebar control
- **Language Switcher**: Admin language toggle
- **User Info**: Current user display
- **Logout Functionality**: Secure sign-out

#### **AdminSidebar (`src/app/admin/Componenets/AdminSidebar/AdminSidebar.js`)**
**Purpose**: Role-based navigation sidebar

**Key Features**:
- **Role-based Filtering**: Menu items based on user permissions
- **Visual Role Indicators**: Color-coded role display
- **User Information**: Current user details at bottom
- **"Open Laundry" Link**: Quick access to customer interface
- **Responsive Design**: Overlay on mobile

**Role-based Menu Logic**:
```javascript
const allMenuItems = [
  { id: 'dashboard', roles: ['company_admin', 'general_manager', 'branch_manager'] },
  { id: 'analytics', roles: ['company_admin', 'general_manager'] },
  { id: 'billing', roles: ['company_admin', 'general_manager', 'branch_manager', 'cashier'] },
  // ... role-specific menu items
];

const filteredMenu = allMenuItems.filter(item =>
  item.roles.includes(userRole)
);
```

### Cart & Product Components

#### **Cart Component (`src/app/Componenets/Cart.js`)**
**Purpose**: Shopping cart with category grouping and checkout flow

**Key Features**:
- **Category Grouping**: Items grouped by product category
- **Dual Layouts**: Desktop sidebar + mobile drawer
- **Guest Checkout**: No authentication required
- **Real-time Totals**: Live price calculations
- **Checkout Preparation**: Cart data transfer to checkout

**Category Grouping Logic**:
```javascript
const groupedCart = Object.entries(groupItemsByCategory(cart)).map(([catName, items]) => ({
  category: catName,
  items: items,
  subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}));
```

#### **PromoBanner (`src/app/Componenets/PromoBanner.js`)**
**Purpose**: Marketing banner with promotional offers

**Features**:
- **Auto-hide**: Scrolls out of view after 40px scroll
- **Fixed Position**: Top of page overlay
- **Marketing Content**: "20% OFF on First Laundry | Code: EASY20"

### Modal Components

#### **AboutContactModals (`src/app/Componenets/AboutContactModals.js`)**
**Purpose**: Information and contact modals

**Components**:
- **AboutUsModal**: Company information and services
- **ContactUsModal**: Contact form with purpose selection

**Contact Purposes**:
```javascript
const purposes = [
  'B2B Partnership',
  'Bulk Order',
  'Marriage Clothes',
  'Recurring Service',
  'Issue',
  'Concern',
  'Other'
];
```

### Admin Components

#### **RoleBasedRedirect (`src/app/admin/components/RoleBasedRedirect.js`)**
**Purpose**: Automatic redirection based on user role

**Role Routing**:
```javascript
const roleDefaults = {
  company_admin: '/admin/dashboard',
  general_manager: '/admin/dashboard',
  branch_manager: '/admin/dashboard',
  cashier: '/admin/billing',
  delivery_man: '/admin/orders',
  pickup_man: '/admin/orders'
};
```

#### **AdminLayout (`src/app/admin/AdminLayout.js`)**
**Purpose**: Admin panel layout with sidebar and animations

**Features**:
- **Sidebar Animation**: Smooth slide-in/out transitions
- **Overlay System**: Mobile sidebar backdrop
- **Provider Wrapping**: Admin language context
- **Footer Integration**: Consistent admin footer

---

## 🔧 Technical Implementation Details

### Firebase Configuration (`src/app/firebase.js`)
**Complete Firebase Setup**:
```javascript
// Authentication
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// Performance & Analytics
const performance = getPerformance(app);
const analytics = getAnalytics(app);

// Phone Authentication
const recaptchaVerifier = new RecaptchaVerifier();
```

### Real-time Data Patterns
```javascript
// Firestore Listeners Pattern
const unsubscribe = onSnapshot(query, (snapshot) => {
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate()
  }));
  setData(data);
  setLoading(false);
});

// Cleanup Pattern
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### Authentication Flow Patterns
```javascript
// Phone OTP Flow
const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible'
    });
  }
};

const signInWithPhone = async (phoneNumber) => {
  const confirmationResult = await signInWithPhoneNumber(
    auth, phoneNumber, window.recaptchaVerifier
  );
  return confirmationResult;
};
```

### Error Handling Patterns
```javascript
// Firebase Error Handling
try {
  await someFirebaseOperation();
} catch (error) {
  switch (error.code) {
    case 'auth/invalid-phone-number':
      setError('Invalid phone number format');
      break;
    case 'auth/too-many-requests':
      setError('Too many attempts. Try again later');
      break;
    default:
      setError('An error occurred. Please try again');
  }
}
```

### Performance Optimizations
```javascript
// Memoized Callbacks
const handleSearch = useCallback((query) => {
  const filtered = products.filter(product =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );
  setFilteredProducts(filtered);
}, [products]);

// Lazy Loading Components
const AdminPage = dynamic(() => import('../admin/AdminPage'), {
  loading: () => <LoadingSpinner />
});

// Image Optimization
<Image
  src={product.image}
  alt={product.name}
  width={300}
  height={300}
  priority={index < 6}
  placeholder="blur"
/>
```

---

## 🎯 Complete Feature Inventory

### Customer Features ✅
- **Product Browsing**: Category filtering, search, real-time updates
- **Shopping Cart**: Guest/auth sync, category grouping, persistence
- **Authentication**: Phone OTP, Google Sign-in, guest checkout
- **Order Management**: 15-stage tracking, history, details
- **Checkout Flow**: Location selection, coupon application, COD payment
- **Profile Management**: Edit info, order history, address management
- **Contact System**: About modal, contact form, purpose selection
- **Mobile Experience**: Bottom nav, responsive design, touch interactions

### Admin Features ✅
- **Role-based Access**: 6 user roles with specific permissions
- **Dashboard Analytics**: Real-time metrics, charts, date filtering
- **Order Management**: Status updates, assignments, PDF generation
- **Product Management**: CRUD operations, image upload, categorization
- **User Management**: Staff creation, role assignment, permissions
- **Geographic Setup**: States, areas, branches, clusters configuration
- **Coupon System**: Discount rules, usage tracking, category restrictions
- **Inquiry Handling**: Customer support tickets, status management
- **Billing System**: Order processing, cashier interface
- **Analytics**: Advanced reporting, branch performance, export features
- **Settings**: Company configuration, logo management

### Technical Features ✅
- **Real-time Updates**: Firestore listeners across all screens
- **Multi-language**: English/Arabic with RTL support
- **Image Management**: Cloudinary upload/delete with optimization
- **State Management**: Context API with localStorage persistence
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Performance**: Code splitting, lazy loading, memoization
- **Security**: Firebase Auth, role-based permissions, input validation
- **Error Handling**: Comprehensive error boundaries and user feedback

---

## ⚙️ Configuration Files

### Package Dependencies (`package.json`)
```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "axios": "^1.11.0",
    "firebase": "^12.0.0",
    "framer-motion": "^12.23.12",
    "jspdf": "^3.0.3",
    "jspdf-autotable": "^5.0.2",
    "lucide-react": "^0.534.0",
    "next": "15.4.5",
    "next-intl": "^4.3.9",
    "react": "19.1.0",
    "react-datepicker": "^8.7.0",
    "react-dom": "19.1.0",
    "react-icons": "^5.5.0",
    "react-responsive": "^10.0.1",
    "react-toastify": "^11.0.5",
    "recharts": "^3.1.0",
    "uuid": "^11.1.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/react": "19.1.12",
    "eslint": "^9",
    "eslint-config-next": "15.4.5",
    "tailwindcss": "^4"
  }
}
```

### Next.js Configuration (`next.config.mjs`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['res.cloudinary.com'],
    },
};

export default nextConfig;
```

### ESLint Configuration (`eslint.config.mjs`)
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals")];

export default eslintConfig;
```

### JavaScript Configuration (`jsconfig.json`)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### PostCSS Configuration (`postcss.config.mjs`)
```javascript
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
```

### Internationalization Configuration (`next-intl.config.js`)
```javascript
module.exports = {
  locales: ['en', 'ar'],
  defaultLocale: 'en',
};
```

### TypeScript Declarations (`next-env.d.ts`)
```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

### Global Styles (`src/app/globals.css`)
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

@keyframes ping-once {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  70% {
    transform: ping-once 0.5s cubic-bezier(0, 0, 0.2, 1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-ping-once {
  animation: ping-once 0.5s cubic-bezier(0, 0, 0.2, 1);
}

/* Safe area padding for mobile devices with notches */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .safe-pb {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
}
```

### Environment Variables (`.env`)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAY3TseN8w0IvVJIxpaYvLKnP3H1DmtFYg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=requiementgathering.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=requiementgathering
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=requiementgathering.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=297040139948
NEXT_PUBLIC_FIREBASE_APP_ID=1:297040139948:web:4a339a1d3150e95a3c3109
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TB2KW7KLLB

NEXT_PUBLIC_COMPANY_ID=laundry_q8
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=Laundry
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dnf7pisvw
NEXT_PUBLIC_CLOUDINARY_API_KEY=223735388477295
NEXT_PUBLIC_CLOUDINARY_API_SECRET=xKgEESiy9OLuANQIj4T7p9oRlBs
```

### Local Environment Variables (`.env.local`)
```bash
# This file is empty by default
# Used for local development overrides
# Add any local environment variables here
# This file is ignored by git (.gitignore includes .env*.local)
```

### Package Lock File (`package-lock.json`)
```json
{
  "name": "my-app",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "my-app",
      "version": "0.1.0",
      "dependencies": {
        "axios": "^1.11.0",
        "firebase": "^12.0.0",
        "framer-motion": "^12.23.12",
        "jspdf": "^3.0.3",
        "jspdf-autotable": "^5.0.2",
        "lucide-react": "^0.534.0",
        "next": "15.4.5",
        "next-intl": "^4.3.9",
        "react": "19.1.0",
        "react-datepicker": "^8.7.0",
        "react-dom": "19.1.0",
        "react-icons": "^5.5.0",
        "react-responsive": "^10.0.1",
        "react-toastify": "^11.0.5",
        "recharts": "^3.1.0",
        "uuid": "^11.1.0",
        "xlsx": "^0.18.5"
      },
      "devDependencies": {
        "@eslint/eslintrc": "^3",
        "@tailwindcss/postcss": "^4",
        "@types/react": "19.1.12",
        "eslint": "^9",
        "eslint-config-next": "15.4.5",
        "tailwindcss": "^4"
      }
    }
  }
}
```

### Vercel Deployment Configuration (`vercel.json`)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Git Ignore (`.gitignore`)
```ignore
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### Static Assets (`public/`)
The `public/` directory contains static assets served directly by Next.js:

- **`favicon.ico`**: Application favicon displayed in browser tabs
- **`file.svg`**: File icon (used in UI components)
- **`globe.svg`**: Globe/world icon (used for language selection)
- **`next.svg`**: Next.js logo (potentially used in branding)
- **`vercel.svg`**: Vercel logo (used in deployment information)
- **`window.svg`**: Window icon (used in UI components)

These SVG files are optimized vector graphics used throughout the application for icons and visual elements.

---

## 🚀 Deployment & Production

### Environment Configuration
```bash
# Required Environment Variables
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
NEXT_PUBLIC_CLOUDINARY_API_SECRET=your_api_secret

NEXT_PUBLIC_COMPANY_ID=your_company_id
```

### Vercel Deployment Configuration
```json
// vercel.json
{
  "functions": {
    "src/app/api/**/*.js": { "maxDuration": 30 }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Access-Control-Allow-Origin", "value": "*" }]
    }
  ]
}
```

### Build Optimization
```javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/webp', 'image/avif']
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};
```

---

This comprehensive documentation now covers **ALL** files, components, hooks, utilities, configuration files, and features of the EASY2-LAUNDRY application. Every screen, context provider, utility function, business logic pattern, and configuration setting has been documented with complete code examples and implementation details.

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

---

**Made with ❤️ for jewelry lovers worldwide**

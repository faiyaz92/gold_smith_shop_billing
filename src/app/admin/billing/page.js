'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '../AdminLayout';
import { db } from '@/app/firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  setDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Trash2,
  Receipt,
  CreditCard,
  Banknote,
  UserPlus,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';

const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'laundry_q8';

// Define Firestore paths
const basePath = 'Easy2Solutions/companyDirectory';
const tenantCompaniesPath = `${basePath}/tenantCompanies`;

// Helper function to safely convert to number and format price
const formatPrice = (price) => {
  const numPrice = parseFloat(price) || 0;
  return numPrice.toFixed(2);
};

// Helper function to get the actual price from your product structure
const getProductPrice = (product) => {
  // Use discountedPrice if available, otherwise use regular price
  const price = product.discountedPrice || product.price || 0;
  return parseFloat(price) || 0;
};

// UI Components (matching your original design)
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="p-6 border-b border-gray-200">
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h2 className={`text-xl font-semibold text-gray-900 ${className}`}>
    {children}
  </h2>
);

const CardDescription = ({ children }) => (
  <p className="text-gray-600 text-sm mt-1">{children}</p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, disabled, variant = 'default', size = 'default', className = '' }) => {
  const baseClasses = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    professional: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ placeholder, value, onChange, className = '' }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
  />
);

const Select = ({ value, onChange, children, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
  >
    {children}
  </select>
);

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children}
  </label>
);

const Separator = () => (
  <hr className="border-gray-200" />
);

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto relative">
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const DialogHeader = ({ children }) => (
  <div className="p-6 border-b border-gray-200">
    {children}
  </div>
);

const DialogTitle = ({ children }) => (
  <h3 className="text-lg font-medium text-gray-900">{children}</h3>
);

const DialogContent = ({ children }) => (
  <div className="p-6">
    {children}
  </div>
);

const LoadingDialog = ({ isOpen, title, description }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Toast hook (simplified)
const useToast = () => ({
  toast: ({ title, description, variant }) => {
    console.log(`Toast: ${title} - ${description} (${variant})`);
  }
});

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BillingPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingPage />
    </Suspense>
  );
}

function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { toast } = useToast();

  // Define Firestore paths
  const usersPath = `${tenantCompaniesPath}/${companyId}/users`;
  const ordersPath = `${tenantCompaniesPath}/${companyId}/orders`;
  const branchesPath = `${tenantCompaniesPath}/${companyId}/branches`;
  const productsPath = `${tenantCompaniesPath}/${companyId}/products`;
  const categoriesPath = `${tenantCompaniesPath}/${companyId}/categories`;
  const subcategoriesPath = `${tenantCompaniesPath}/${companyId}/subcategories`;

  // State variables
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [customers, setCustomers] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [existingBillNumber, setExistingBillNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newOrderId, setNewOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [customerTab, setCustomerTab] = useState('new'); // Add this line
  const [walkInMobile, setWalkInMobile] = useState('');
  const [newCustomerMobile, setNewCustomerMobile] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // POS user info and branch handling
  const [posUser, setPosUser] = useState({
    userId: '',
    userName: '',
    userRole: '',
    branchId: '',
    branchName: ''
  });
  const [canEditBranch, setCanEditBranch] = useState(false);

  // Schedule preferences
  const [schedule, setSchedule] = useState({
    pickupTime: 'morning',
    deliveryPref: 'standard',
  });

  const debouncedCustomerSearch = useDebounce(customerSearch, 500);

  // Get POS user info from localStorage and determine branch permissions
  useEffect(() => {
    const userId = localStorage.getItem('userId') || '';
    const userName = localStorage.getItem('userName') || '';
    const userRole = localStorage.getItem('userRole') || '';
    const branchId = localStorage.getItem('userBranchId') || '';

    setPosUser({ userId, userName, userRole, branchId, branchName: '' });

    // Determine if user can edit branch selection
    const canEdit = userRole === 'company_admin' || userRole === 'general_manager' || userRole === 'branch_manager';
    setCanEditBranch(canEdit);

    if (!canEdit) {
      setSelectedBranch(branchId);
    }
  }, []);

  // Fetch branches and get branch name
  useEffect(() => {
    const fetchBranches = () => {
      const branchesCollection = collection(db, branchesPath);
      const unsubscribe = onSnapshot(branchesCollection, (snapshot) => {
        const branchesData = snapshot.docs.map((doc) => ({
          storeId: doc.id,
          name: doc.data().name,
          ...doc.data(),
        }));
        setBranches(branchesData.filter(b => b.isActive));

        // Set branch name for current user
        const currentBranch = branchesData.find(b => b.storeId === posUser.branchId);
        if (currentBranch) {
          setPosUser(prev => ({ ...prev, branchName: currentBranch.name }));
        }

        // Set default selected branch if user can edit
        if (canEditBranch && !selectedBranch && branchesData.length > 0) {
          setSelectedBranch(branchesData[0].storeId);
        }
      });
      return unsubscribe;
    };

    return fetchBranches();
  }, [posUser.branchId, canEditBranch, selectedBranch]);

  // Fetch products (using same structure as your Products.js component)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);

        const unsubProducts = onSnapshot(
          collection(db, productsPath),
          async (productsSnapshot) => {
            try {
              const productsData = await Promise.all(
                productsSnapshot.docs.map(async (docSnap) => {
                  const data = docSnap.data();
                  let categoryName = 'Uncategorized';
                  let subcategoryName = 'None';

                  // Fetch category name if categoryId exists
                  if (data.categoryId) {
                    const categoryDoc = await getDoc(doc(db, categoriesPath, data.categoryId));
                    if (categoryDoc.exists()) {
                      categoryName = categoryDoc.data().categoriesname || 'Uncategorized';
                    }
                  }

                  // Fetch subcategory name if subcategoryId exists
                  if (data.subcategoryId) {
                    const subcategoryDoc = await getDoc(doc(db, subcategoriesPath, data.subcategoryId));
                    if (subcategoryDoc.exists()) {
                      subcategoryName = subcategoryDoc.data().name || 'None';
                    }
                  }

                  return {
                    id: docSnap.id, // Using 'id' as in your Products.js
                    name: data.name || '',
                    price: parseFloat(data.price) || 0,
                    discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : null,
                    image: data.image || '/placeholder.png',
                    categoryId: data.categoryId || '',
                    subcategoryId: data.subcategoryId || '',
                    categoryName,
                    subcategoryName,
                    sortOrder: data.sortOrder ?? 999,
                    createdAt: data.createdAt || new Date().toISOString(),
                  };
                })
              );

              // Sort products by sortOrder as in your Products.js
              const sortedProductsData = productsData.sort((a, b) =>
                (a.sortOrder ?? a.createdAt) < (b.sortOrder ?? b.createdAt) ? -1 : 1
              );

              setProducts(sortedProductsData);
              setIsLoading(false);
            } catch (err) {
              setError('Failed to load products: ' + err.message);
              setIsLoading(false);
            }
          },
          (err) => {
            setError('Error fetching products: ' + err.message);
            setIsLoading(false);
          }
        );

        return unsubProducts;
      } catch (err) {
        console.error('Error setting up products listener:', err);
        setError('Failed to fetch products');
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const usersRef = collection(db, usersPath);
        const querySnapshot = await getDocs(usersRef);
        const customersList = querySnapshot.docs.map((doc) => ({
          userId: doc.id,
          name: doc.data().name || '',
          userName: doc.data().userName || '',
          phone: doc.data().phone || '',
          email: doc.data().email || '',
          address: doc.data().address || '',
          city: doc.data().city || '',
          zip: doc.data().zip || ''
        }));
        setCustomers(customersList);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch categories and subcategories
  useEffect(() => {
    const fetchCategories = async () => {
      const catRef = collection(db, categoriesPath);
      const catSnap = await getDocs(catRef);
      setCategories(catSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().categoriesname || doc.data().name || 'Unnamed'
      })));
    };
    const fetchSubcategories = async () => {
      const subcatRef = collection(db, subcategoriesPath);
      const subcatSnap = await getDocs(subcatRef);
      setSubcategories(subcatSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed'
      })));
    };
    fetchCategories();
    fetchSubcategories();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(
    product =>
      (selectedCategory ? product.categoryId === selectedCategory : true) &&
      (selectedSubcategory ? product.subcategoryId === selectedSubcategory : true) &&
      (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.subcategoryName && product.subcategoryName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
  );

  const filteredCustomers = customers.filter(
    customer =>
    (customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.userName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const addToCart = (product) => {
    if (existingBillNumber) {
      toast({
        title: "Cannot Add",
        description: "Cannot add new items to an existing bill.",
        variant: "destructive",
      });
      return;
    }

    const productPrice = getProductPrice(product);
    const existingItem = cart.find(item => item.id === product.id); // Using 'id' as in your structure

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem = {
        id: product.id, // Using 'id' as in your structure
        productId: product.id, // Also keep productId for compatibility
        name: product.name, // Using 'name' as in your structure
        productName: product.name, // Also keep productName for compatibility
        price: productPrice,
        originalPrice: parseFloat(product.price) || 0,
        discountedPrice: product.discountedPrice ? parseFloat(product.discountedPrice) : null,
        categoryName: product.categoryName,
        subcategoryName: product.subcategoryName,
        quantity: 1,
        tax: 0, // No tax for laundry services
        taxAmount: 0,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (existingBillNumber && newQuantity > cart.find(item => item.id === productId).quantity) {
      toast({
        title: "Cannot Increase",
        description: "Cannot increase quantity for an existing bill.",
        variant: "destructive",
      });
      return;
    }

    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      return;
    }

    setCart(
      cart.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            quantity: newQuantity,
            taxAmount: (item.price * newQuantity * item.tax) / 100,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const addNewCustomer = async () => {
    if (!newCustomerName) {
      toast({
        title: "Error",
        description: "Customer name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newCustomer = {
        userId: `CUST-${Date.now()}`,
        name: newCustomerName,
        userName: newCustomerName,
        userType: 'Customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const userRef = doc(db, usersPath, newCustomer.userId);
      await setDoc(userRef, newCustomer);

      setCustomers([...customers, newCustomer]);
      setCustomer(newCustomer);
      setNewCustomerName('');
      setCustomerSearch('');
      setIsCustomerDialogOpen(false);
      toast({
        title: "Success",
        description: "Customer added successfully.",
      });
    } catch (e) {
      console.error('Add customer error:', e);
      toast({
        title: "Error",
        description: `Failed to add customer: ${e.message || e}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get branch name
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.storeId === branchId);
    return branch ? branch.name : 'Unknown Branch';
  };

  const generateBill = async () => {
    if (cart.length === 0 && !existingBillNumber) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before generating bill.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBranch && !posUser.branchId) {
      toast({
        title: "Select Branch",
        description: "Please select a branch before generating bill.",
        variant: "destructive",
      });
      return;
    }

    if (!customer) {
      toast({
        title: "Select Customer",
        description: "Please select a customer before generating bill.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity) + item.taxAmount, 0);
      const finalBillNumber = existingBillNumber || `BILL-${Date.now()}`;
      const finalBranchId = selectedBranch || posUser.branchId;

      // Save customer info first
      const customerId = customer.userId || customer.phone || `CUST-${Date.now()}`;
      const userRef = doc(db, usersPath, customerId);

      await setDoc(userRef, {
        name: customer.name || customer.userName,
        userName: customer.userName || customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        zip: customer.zip || '',
        userType: 'Customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Create order data
      const orderData = {
        userId: customerId,
        name: customer.name || customer.userName,
        userName: customer.userName || customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        zip: customer.zip || '',
        items: cart,
        total: totalAmount,
        billNumber: finalBillNumber,
        paymentStatus: paymentMethod === 'Cash' ? 'paid' : 'unpaid',
        paymentMethod: paymentMethod,
        status: orderStatus,
        pickupTime: schedule.pickupTime,
        deliveryPref: schedule.deliveryPref,
        timestamp: serverTimestamp(),
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        orderTakenBy: posUser.userId,
        orderTakenByName: posUser.userName,
        orderTakenByRole: posUser.userRole,
        branchId: finalBranchId,
        orderSource: 'POS',
        laundryStatus: {
          pickupManVerified: false,
          customerPickupVerified: false,
          receivedAtFacility: false,
          sortingDone: false,
          washingDone: false,
          dryingDone: false,
          ironingDone: false,
          foldingDone: false,
          qualityCheckDone: false,
          deliveryManDone: false,
          customerDeliveryConfirmed: false,
        }
      };

      let finalOrderId = orderId;

      if (orderId) {
        // Update existing order
        const orderRef = doc(db, ordersPath, orderId);
        await updateDoc(orderRef, orderData);
        console.log('Order updated:', orderId);
      } else {
        // Create new order
        const orderRef = await addDoc(collection(db, ordersPath), orderData);
        finalOrderId = orderRef.id;
        setNewOrderId(finalOrderId);
        console.log('Order created:', finalOrderId);
      }

      setBillNumber(finalBillNumber);
      setShowSuccessDialog(true);

      toast({
        title: "Success",
        description: `Bill generated successfully. ${paymentMethod === "Cash" ? "Payment recorded." : "Credit sale recorded."}`,
      });
    } catch (e) {
      console.error('Generate bill error:', e);
      toast({
        title: "Error",
        description: `Failed to generate bill: ${e.message || e}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate PDF using jsPDF
  const generatePDF = () => {
    const customerData = customer || {};
    const date = new Date().toLocaleDateString();
    const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const finalBillNumber = billNumber || 'BILL-' + Date.now();
    const currentBranchName = getBranchName(selectedBranch || posUser.branchId);

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('EASY2 Solutions Laundry', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.text('INVOICE', 105, 35, { align: 'center' });

    // Bill info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Bill Number: ${finalBillNumber}`, 20, 50);
    doc.text(`Date: ${date}`, 20, 60);
    doc.text(`Estimated Delivery: ${deliveryDate}`, 20, 70);
    doc.text(`Processed by: ${posUser.userName} (${posUser.userRole})`, 20, 80);
    doc.text(`Branch: ${currentBranchName}`, 20, 90);

    // Customer Details
    doc.setFont(undefined, 'bold');
    doc.text('Customer Details:', 20, 110);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${customerData.name || customerData.userName || 'N/A'}`, 20, 120);
    doc.text(`Phone: ${customerData.phone || 'N/A'}`, 20, 130);

    // Items Table
    doc.setFont(undefined, 'bold');
    doc.text('Services:', 20, 150);

    let yPosition = 160;
    doc.setFont(undefined, 'normal');

    cart.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(`${item.name} x ${item.quantity}`, 25, yPosition);
      doc.text(`KWD ${formatPrice(item.price * item.quantity)}`, 140, yPosition);
      yPosition += 8;
    });

    // Total
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: KWD ${formatPrice(total)}`, 140, yPosition + 10);

    return doc;
  };

  const handleDownloadPDF = () => {
    const pdf = generatePDF();
    const finalBillNumber = billNumber || 'BILL-' + Date.now();
    pdf.save(`laundry_invoice_${finalBillNumber}.pdf`);

    setCart([]);
    setCustomer(null);
    setShowSuccessDialog(false);

    if (newOrderId) {
      router.push(`/admin/orders?orderId=${newOrderId}`);
    } else {
      router.push('/admin/orders');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = cart.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = subtotal + taxAmount;

  return (
    <AdminLayout>
      <div className="space-y-2 p-1">
        <LoadingDialog
          isOpen={isLoading}
          title="Processing Bill..."
          description="Generating invoice and updating records."
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Receipt className="w-8 h-8 text-blue-600" />
              Billing System
            </h1>
            <p className="text-gray-600 mt-2">Generate bills and manage customer transactions</p>
            {posUser.userName && (
              <div className="text-sm text-gray-600 mt-1">
                Operator: <span className="font-medium">{posUser.userName}</span> ({posUser.userRole})
                | Branch: <span className="font-medium">{getBranchName(selectedBranch || posUser.branchId)}</span>
              </div>
            )}
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm border border-red-200">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Product Search & Selection */}
          <div className="lg:col-span-2 space-y-4 pr-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Service Selection
                </CardTitle>
                <CardDescription>Search and add laundry services to cart</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    placeholder="Search by service name, category..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    className="md:w-48 w-full"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Select>
                  <Select
                    value={selectedSubcategory}
                    onChange={setSelectedSubcategory}
                    className="md:w-48 w-full"
                  >
                    <option value="">All Subcategories</option>
                    {subcategories
                      .filter(sub => !selectedCategory || products.some(p => p.categoryId === selectedCategory && p.subcategoryId === sub.id))
                      .map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                  </Select>
                  {canEditBranch && (
                    <Select value={selectedBranch} onChange={setSelectedBranch} className="md:w-48 w-full">
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.storeId} value={branch.storeId}>
                          {branch.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      {searchTerm ? 'No services found matching your search.' : 'No services available.'}
                    </div>
                  ) : (
                    filteredProducts.map(product => {
                      const inCart = cart.some(item => item.id === product.id);
                      return (
                        <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full">
                          <CardContent className="flex flex-col justify-between flex-1">
                            <div>
                              <div className="flex justify-between items-start">
                                <div className="min-h-[2.5rem]">
                                  <h4 className="font-medium text-sm break-words">{product.name}</h4>
                                  <p className="text-xs text-gray-500">{product.categoryName}</p>
                                  {product.subcategoryName && product.subcategoryName !== 'None' && (
                                    <p className="text-xs text-gray-500">{product.subcategoryName}</p>
                                  )}
                                </div>
                                <Badge variant="default">
                                  Available
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div>
                                {product.discountedPrice ? (
                                  <div>
                                    <span className="font-bold text-green-600">KWD {formatPrice(product.discountedPrice)}</span>
                                    <div className="text-xs text-gray-400 line-through">
                                      KWD {formatPrice(product.price)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-bold">KWD {formatPrice(product.price)}</span>
                                )}
                              </div>
                              <div>
                                {inCart ? (
                                  <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-700 p-2">
                                    <Check className="w-5 h-5" />
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addToCart(product)}
                                    className="flex items-center justify-center"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart & Billing */}
          <div className="space-y-4 pl-2">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="customer-name">Customer</Label>
                  <Button
                    variant="outline"
                    className="w-full flex justify-between"
                    onClick={() => setIsCustomerDialogOpen(true)}
                  >
                    {customer ? customer.name || customer.userName : "Select Customer"}
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cart */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={`cart-${item.id}`} className="p-2 border rounded space-y-2">
                        {/* First Row: Product name and price per unit */}
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.categoryName || '—'} / {item.subcategoryName || '—'}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">KWD {formatPrice(item.price)} each</span>
                        </div>

                        {/* Second Row: Quantity controls and total price */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-700 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="text-sm font-bold">KWD {formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {cart.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>KWD {formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>KWD {formatPrice(taxAmount)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>KWD {formatPrice(total)}</span>
                      </div>
                    </div>
                  </>
                )}
                {/* Move payment and order status here */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onChange={setPaymentMethod}>
                      <option value="Cash">💵 Cash</option>
                      <option value="Credit">💳 Credit</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Order Status</Label>
                    <Select value={orderStatus} onChange={setOrderStatus}>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={generateBill}
                  variant="professional"
                  className="w-full flex items-center justify-center gap-2 py-3 text-base"
                  size="lg"
                  disabled={isLoading}
                >
                  <Receipt className="w-5 h-5 inline-flex align-middle" />
                  {existingBillNumber ? "Update Bill" : "Generate Bill"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Customer Selection Dialog */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogHeader>
            <DialogTitle>Select or Add Customer</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex border-b mb-4">
                <button
                  className={`flex-1 py-2 text-center ${customerTab === 'new' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
                  onClick={() => setCustomerTab('new')}
                >
                  New Customer
                </button>
                <button
                  className={`flex-1 py-2 text-center ${customerTab === 'walkin' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
                  onClick={() => setCustomerTab('walkin')}
                >
                  Walk In
                </button>
                <button
                  className={`flex-1 py-2 text-center ${customerTab === 'list' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
                  onClick={() => setCustomerTab('list')}
                >
                  Customers
                </button>
              </div>
              {/* Tab Content */}
              {customerTab === 'walkin' && (
                <div className="space-y-3">
                  <Label>Mobile Number <span className="text-red-500">*</span></Label>
                  <Input
                    value={walkInMobile}
                    onChange={e => setWalkInMobile(e.target.value)}
                    placeholder="Enter mobile number"
                  />
                  <Button
                    onClick={async () => {
                      if (!walkInMobile) {
                        toast({ title: "Mobile required", description: "Please enter mobile number.", variant: "destructive" });
                        return;
                      }
                      setIsLoading(true);
                      const walkInCustomer = {
                        userId: `WALKIN-${walkInMobile}`,
                        name: 'Walk In',
                        userName: 'Walk In',
                        phone: walkInMobile,
                        userType: 'walkin',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                      };
                      const userRef = doc(db, usersPath, walkInCustomer.userId);
                      await setDoc(userRef, walkInCustomer, { merge: true });
                      setCustomers([...customers, walkInCustomer]);
                      setCustomer(walkInCustomer);
                      setIsCustomerDialogOpen(false);
                      setWalkInMobile('');
                      setIsLoading(false);
                      toast({ title: "Walk In Added", description: "Walk in customer added.", variant: "default" });
                    }}
                    disabled={isLoading}
                  >
                    Add Walk In
                  </Button>
                </div>
              )}
              {customerTab === 'new' && (
                <div className="space-y-3">
                  <Label>Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                  <Label>Mobile Number <span className="text-red-500">*</span></Label>
                  <Input
                    value={newCustomerMobile}
                    onChange={e => setNewCustomerMobile(e.target.value)}
                    placeholder="Enter mobile number"
                  />
                  <Label>Email</Label>
                  <Input
                    value={customer?.email || ''}
                    onChange={e => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="Optional"
                  />
                  <Label>Address</Label>
                  <Input
                    value={customer?.address || ''}
                    onChange={e => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Optional"
                  />
                  <Button
                    onClick={async () => {
                      if (!newCustomerName || !newCustomerMobile) {
                        toast({ title: "Required", description: "Name and mobile are required.", variant: "destructive" });
                        return;
                      }
                      setIsLoading(true);
                      const newCustomer = {
                        userId: `CUST-${newCustomerMobile}`,
                        name: newCustomerName,
                        userName: newCustomerName,
                        phone: newCustomerMobile,
                        email: customer?.email || '',
                        address: customer?.address || '',
                        userType: 'Customer',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                      };
                      const userRef = doc(db, usersPath, newCustomer.userId);
                      await setDoc(userRef, newCustomer, { merge: true });
                      setCustomers([...customers, newCustomer]);
                      setCustomer(newCustomer);
                      setIsCustomerDialogOpen(false);
                      setNewCustomerName('');
                      setNewCustomerMobile('');
                      setIsLoading(false);
                      toast({ title: "Customer Added", description: "Customer added successfully.", variant: "default" });
                    }}
                    disabled={isLoading}
                  >
                    Add Customer
                  </Button>
                </div>
              )}
              {customerTab === 'list' && (
                <div>
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                  />
                  <div className="max-h-64 overflow-y-auto mt-2">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-center text-gray-500">No customers available</p>
                    ) : (
                      filteredCustomers.map(c => (
                        <div
                          key={`customer-${c.userId}`}
                          className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                          onClick={() => {
                            setCustomer(c);
                            setIsCustomerDialogOpen(false);
                          }}
                        >
                          <p className="font-medium">{c.name || c.userName}</p>
                          <p className="text-xs text-gray-500">ID: {c.userId}</p>
                          {c.phone && <p className="text-xs text-gray-500">Phone: {c.phone}</p>}
                        </div>
                      ))
                    )
                  }
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        {showSuccessDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {orderId ? 'Order Updated Successfully!' : 'Order Placed Successfully!'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Order ID: {newOrderId || orderId}
                </p>
                <p className="text-sm text-gray-700 mb-6">
                  Would you like to download the invoice?
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleDownloadPDF} className="flex-1">
                    Download PDF
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSuccessDialog(false);
                      setCart([]);
                      setCustomer(null);
                      router.push('/admin/orders');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
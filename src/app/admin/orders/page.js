// Gold Smith Wholesaler Order Management System
'use client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  ChevronDown,
  ChevronUp,
  Package,
  ShoppingBag,
  Users,
  Home,
  Tag,
  Truck,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Phone,
  Printer,
  Save,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminHeader from '../Componenets/AdminHeader';
import {
  onSnapshot,
  query,
  collection,
  orderBy,
  doc,
  updateDoc,
  where,
  serverTimestamp,
  addDoc,
  getDocs,
  getDoc,
  limit
} from 'firebase/firestore';
import { AccountingEngine } from '@/utils/accountingEngine';
import { AutomatedTransactionEngine } from '@/app/utils/automatedTransactionEngine';
import { InventoryService } from '@/utils/inventoryService';
import orderReceiptGenerator from '@/utils/orderReceiptGenerator';
import challanGenerator from '@/utils/challanGenerator';
import invoiceGenerator from '@/utils/invoiceGenerator';
import paymentReceiptGenerator from '@/utils/paymentReceiptGenerator';
import { db } from '../../firebase';

// Gold Smith Order Status Colors (matching BRD)
const statusColors = {
  'New': 'bg-gray-100 text-gray-800',
  'Confirmed': 'bg-blue-100 text-blue-800',
  'In Production': 'bg-yellow-100 text-yellow-800',
  'Ready for Pickup': 'bg-orange-100 text-orange-800',
  'Picked Up': 'bg-purple-100 text-purple-800',
  'Delivered': 'bg-green-100 text-green-800',
  'Completed': 'bg-emerald-100 text-emerald-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

// Gold Smith Order Statuses (from BRD)
// ✅ TASK 6.4: Order Status Workflow Configuration
const ORDER_STATUS_FLOW = {
  'New': {
    label: 'New Order',
    color: 'bg-gray-100 text-gray-800',
    nextStatuses: ['Confirmed', 'Cancelled'],
    allowedActions: [],
    description: 'Order created, pending confirmation',
    accountingImpact: 'None - order entry only'
  },
  'Confirmed': {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800',
    nextStatuses: ['In Production', 'Cancelled'],
    allowedActions: ['issueChallan'],
    description: 'Order confirmed, ready to issue challan',
    accountingImpact: 'Gold withdrawal challan triggers: Debit 1102 (Gold in Transit), Credit 1101 (Gold Inventory)'
  },
  'In Production': {
    label: 'In Production',
    color: 'bg-yellow-100 text-yellow-800',
    nextStatuses: ['Ready for Pickup', 'Cancelled'],
    allowedActions: [],
    description: 'Manufacturer working on the order',
    accountingImpact: 'None - work in progress'
  },
  'Ready for Pickup': {
    label: 'Ready for Pickup',
    color: 'bg-purple-100 text-purple-800',
    nextStatuses: ['Picked Up', 'Delivered', 'Cancelled'],
    allowedActions: ['generateInvoice'],
    description: 'Product received, ready to bill customer',
    accountingImpact: 'Invoice triggers: Debit 1301-CUST-XXX, Credit 4101 (Revenue)'
  },
  'Picked Up': {
    label: 'Picked Up',
    color: 'bg-indigo-100 text-indigo-800',
    nextStatuses: ['Completed'],
    allowedActions: ['recordPayment'],
    description: 'Customer picked up the product',
    accountingImpact: 'None - delivery confirmation'
  },
  'Delivered': {
    label: 'Delivered',
    color: 'bg-teal-100 text-teal-800',
    nextStatuses: ['Completed'],
    allowedActions: ['recordPayment'],
    description: 'Product delivered to customer',
    accountingImpact: 'None - delivery confirmation'
  },
  'Completed': {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    nextStatuses: [],
    allowedActions: [],
    description: 'Order fully completed and paid',
    accountingImpact: 'Payment triggers: Debit 1101/1201, Credit 1301-CUST-XXX'
  },
  'Cancelled': {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    nextStatuses: [],
    allowedActions: [],
    description: 'Order cancelled',
    accountingImpact: 'Reverse all previous entries if applicable'
  }
};

const ORDER_STATUSES = Object.keys(ORDER_STATUS_FLOW);

// Payment Statuses for Gold Smith
const PAYMENT_STATUSES = [
  'Not Billed',
  'Billed',
  'Partially Paid',
  'Paid'
];

export default function GoldSmithOrders() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState('');
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [showChallanDialog, setShowChallanDialog] = useState(false);
  const [challanOrderData, setChallanOrderData] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceOrderData, setInvoiceOrderData] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentInvoiceData, setPaymentInvoiceData] = useState(null);
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  const [paymentHistoryData, setPaymentHistoryData] = useState(null);
  // ✅ TASK 6.4: Status Change Dialog State
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState(null);
  const [statusChangeNotes, setStatusChangeNotes] = useState('');
  // ✅ TASK 7.2 & 7.3: Additional Challan & Return Dialog State
  const [showAdditionalChallanDialog, setShowAdditionalChallanDialog] = useState(false);
  const [additionalChallanData, setAdditionalChallanData] = useState({
    order: null,
    challanType: 'additional_gold', // 'additional_gold' or 'gold_return'
    goldAmount: '',
    reason: '',
    notes: ''
  });
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'pure_gold', // 'pure_gold', 'usd_cash', 'mixed'
    goldPaid: '',
    usdPaid: '',
    useMarketPrice: true,
    adjustedPrice: '',
    adjustmentReason: '',
    notes: ''
  });
  const [customers, setCustomers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Purchase Entry State
  const [showPurchaseEntryDialog, setShowPurchaseEntryDialog] = useState(false);
  const [purchaseEntryOrder, setPurchaseEntryOrder] = useState(null);
  const [purchaseEntryData, setPurchaseEntryData] = useState({
    weightReceived: '',
    manufacturingCost: '',
    gstAmount: '',
    paymentType: 'cash', // 'cash' or 'credit'
    creditDays: 0,
    notes: ''
  });

  // Delivery & Billing State
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryOrder, setDeliveryOrder] = useState(null);
  const [deliveryData, setDeliveryData] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash', // 'cash' or 'credit'
    paidAmount: 0,
    notes: ''
  });

  // New Order Form State (BRD v2 - Pure Gold Based)
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    customerPhone: '',
    customerName: '',
    serialNumber: '',
    productName: '',
    metal: 'gold', // Fixed - no dropdown
    karat: '24k',
    totalWeight: '',
    makingChargeRateUSD: '',
    goldPricePerOunce: '',
    goldPricePerGram: '',
    manufacturerId: '',
    expectedDeliveryDate: '',
    notes: ''
  });

  // Product name cache for auto-suggestion (BRD v2 Section 3.5)
  const [productNameCache, setProductNameCache] = useState([]);
  const [productNameSuggestions, setProductNameSuggestions] = useState([]);
  
  // Gold price state (fetched from goldPriceHistory)
  const [currentGoldPrice, setCurrentGoldPrice] = useState(null);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;
  const ordersPath = `${basePath}/orders`;
  const customersPath = `${basePath}/customers`;
  const manufacturersPath = `${basePath}/manufacturers`;
  const categoriesPath = `${basePath}/categories`;
  const goldPriceHistoryPath = 'goldPriceHistory'; // Root level collection

  useEffect(() => {
    setIsClient(true);
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // Fetch orders
      const ordersQuery = query(collection(db, ordersPath), orderBy('createdAt', 'desc'));
      const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersData);
        
        // Build product name cache from orders (BRD v2 Section 3.5)
        const uniqueNames = [...new Set(
          ordersData
            .map(order => order.productName)
            .filter(name => name && name.trim() !== '')
        )].sort();
        setProductNameCache(uniqueNames);
      });

      // Fetch customers
      const customersQuery = query(collection(db, customersPath), orderBy('createdAt', 'desc'));
      const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersData);
      });

      // Fetch manufacturers
      const manufacturersQuery = query(collection(db, manufacturersPath), orderBy('createdAt', 'desc'));
      const manufacturersUnsubscribe = onSnapshot(manufacturersQuery, (snapshot) => {
        const manufacturersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setManufacturers(manufacturersData);
      });

      // Fetch categories for display helpers
      const categoriesRef = collection(db, categoriesPath);
      const categoriesUnsubscribe = onSnapshot(categoriesRef, (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      });
      
      // Fetch current gold price (BRD v2 - Gold Price from goldPriceHistory)
      const goldPriceQuery = query(
        collection(db, goldPriceHistoryPath),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const goldPriceSnapshot = await getDocs(goldPriceQuery);
      if (!goldPriceSnapshot.empty) {
        const latestPrice = goldPriceSnapshot.docs[0].data();
        setCurrentGoldPrice({
          pricePerOunce: latestPrice.pricePerOunce,
          pricePerGram: latestPrice.pricePerGram,
          timestamp: latestPrice.timestamp
        });
      }

      return () => {
        ordersUnsubscribe();
        customersUnsubscribe();
        manufacturersUnsubscribe();
        categoriesUnsubscribe();
      };

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ TASK 9.2: Check and mark overdue invoices
  const checkOverdueInvoices = async () => {
    try {
      const invoicesPath = `${basePath}/invoices`;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      // Query for active invoices that are unpaid or partially paid
      const overdueQuery = query(
        collection(db, invoicesPath),
        where('status', '==', 'active'),
        where('paymentStatus', 'in', ['not_paid', 'partially_paid'])
      );

      const overdueSnapshot = await getDocs(overdueQuery);
      
      let overdueCount = 0;
      const updates = [];

      overdueSnapshot.forEach((doc) => {
        const invoice = doc.data();
        const dueDate = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : new Date(invoice.dueDate);
        
        // Check if due date has passed
        if (dueDate < today) {
          updates.push(
            updateDoc(doc.ref, {
              status: 'overdue',
              updatedAt: serverTimestamp()
            })
          );
          overdueCount++;
        }
      });

      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`Marked ${overdueCount} invoices as overdue`);
      }
    } catch (error) {
      console.error('Error checking overdue invoices:', error);
    }
  };

  // Check overdue invoices on component mount and every hour
  useEffect(() => {
    if (isClient) {
      checkOverdueInvoices();
      
      // Check every hour
      const interval = setInterval(checkOverdueInvoices, 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isClient]);

  // Filter and sort orders based on search and filters
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = !searchQuery ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone?.includes(searchQuery) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || order.status === statusFilter;
      const matchesPaymentStatus = !paymentStatusFilter || order.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'createdAt':
          aValue = a.createdAt?.toDate?.() || new Date(a.createdAt);
          bValue = b.createdAt?.toDate?.() || new Date(b.createdAt);
          break;
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'customerName':
          aValue = a.customerName || '';
          bValue = b.customerName || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a.createdAt?.toDate?.() || new Date(a.createdAt);
          bValue = b.createdAt?.toDate?.() || new Date(b.createdAt);
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, searchQuery, statusFilter, paymentStatusFilter, sortBy, sortOrder]);

  // Calculate totals
  const orderStats = useMemo(() => {
    const total = orders.length;
    const byStatus = ORDER_STATUSES.reduce((acc, status) => {
      acc[status] = orders.filter(order => order.status === status).length;
      return acc;
    }, {});

    const byPaymentStatus = PAYMENT_STATUSES.reduce((acc, status) => {
      acc[status] = orders.filter(order => order.paymentStatus === status).length;
      return acc;
    }, {});

    return { total, byStatus, byPaymentStatus };
  }, [orders]);

  // Calculate and record commission for completed order
  const calculateAndRecordCommission = async (orderId) => {
    try {
      // Get order details
      const orderDoc = await getDoc(doc(db, ordersPath, orderId));
      if (!orderDoc.exists()) return;

      const order = orderDoc.data();

      // Calculate commission: Customer Price - Manufacturing Cost
      const customerPrice = order.total || 0;
      const manufacturingCost = order.metalCost + (order.makingChargeTotal || 0);
      const commissionAmount = customerPrice - manufacturingCost;

      if (commissionAmount <= 0) {
        console.log('No commission to record for order:', orderId);
        return;
      }

      // Initialize accounting engines
      const accountingEngine = new AccountingEngine(companyId);
      const transactionEngine = new AutomatedTransactionEngine(companyId);

      // Record commission recognition (income)
      const commissionEntry = transactionEngine.createCommissionRecognitionEntry({
        orderId,
        commissionAmount,
        date: new Date()
      });

      // Record the transaction
      await accountingEngine.recordTransaction({
        description: commissionEntry.description,
        debitAccountId: commissionEntry.lines[0].accountId, // Commission Income
        creditAccountId: commissionEntry.lines[1].accountId, // Current Year Profit/Loss
        amount: commissionAmount,
        referenceType: 'commission_recognition',
        referenceId: orderId
      });

      // Update order with commission details
      await updateDoc(doc(db, ordersPath, orderId), {
        commissionAmount,
        commissionRecorded: true,
        commissionRecordedAt: serverTimestamp()
      });

      console.log(`Commission recorded: ₹${commissionAmount} for order ${orderId}`);

    } catch (error) {
      console.error('Error calculating commission:', error);
    }
  };

  // Update order status with history tracking
  // ✅ TASK 6.4: Order Status Workflow Handler
  const handleStatusChange = (order, newStatus) => {
    // Validate status transition
    const currentStatus = order.status;
    const currentStatusConfig = ORDER_STATUS_FLOW[currentStatus];
    
    if (!currentStatusConfig.nextStatuses.includes(newStatus)) {
      alert(`Invalid status transition: Cannot change from "${currentStatus}" to "${newStatus}". Valid next statuses are: ${currentStatusConfig.nextStatuses.join(', ')}`);
      return;
    }

    // Open confirmation dialog
    setStatusChangeData({
      order,
      currentStatus,
      newStatus,
      statusConfig: ORDER_STATUS_FLOW[newStatus]
    });
    setStatusChangeNotes('');
    setShowStatusChangeDialog(true);
  };

  // ✅ TASK 6.4: Confirm Status Change
  const confirmStatusChange = async () => {
    if (!statusChangeData) return;

    try {
      const { order, newStatus } = statusChangeData;
      const orderRef = doc(db, ordersPath, order.id);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        alert('Order not found');
        return;
      }

      const orderData = orderSnap.data();
      const oldStatus = orderData.status;

      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        lastStatusUpdate: serverTimestamp()
      };

      // Add status history entry
      const statusHistory = orderData.statusHistory || [];
      statusHistory.push({
        from: oldStatus,
        to: newStatus,
        changedAt: new Date(),
        changedBy: 'Admin', // TODO: Get current user info
        notes: statusChangeNotes || ''
      });
      updateData.statusHistory = statusHistory;

      // Special handling for status changes
      if (newStatus === 'Picked Up') {
        // When picked up, show purchase entry dialog
        // Don't automatically process - wait for user to enter purchase details
        const orderDoc = await getDoc(orderRef);
        const orderData = { id: order.id, ...orderDoc.data() };
        
        // Show purchase entry dialog
        setPurchaseEntryOrder(orderData);
        setPurchaseEntryData({
          weightReceived: orderData.weight || '',
          manufacturingCost: '',
          gstAmount: '',
          paymentType: 'cash',
          creditDays: 0,
          notes: ''
        });
        setShowPurchaseEntryDialog(true);
        
        updateData.purchaseEntryRequired = true;
        updateData.purchaseEntryCompleted = false;
      } else if (newStatus === 'Delivered') {
        // When delivered, show delivery & billing dialog
        const orderDoc = await getDoc(orderRef);
        const orderData = { id: order.id, ...orderDoc.data() };
        
        setDeliveryOrder(orderData);
        setDeliveryData({
          deliveryDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
          paidAmount: orderData.total || 0,
          notes: ''
        });
        setShowDeliveryDialog(true);
        
        updateData.deliveryRequired = true;
        updateData.deliveryCompleted = false;
      }

      await updateDoc(orderRef, updateData);

      console.log(`Order ${order.id} status updated from ${oldStatus} to ${newStatus}`);
      
      // Close dialog and show success message
      setShowStatusChangeDialog(false);
      setStatusChangeData(null);
      setStatusChangeNotes('');
      
      alert(`Status successfully changed to "${newStatus}"`);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, ordersPath, orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        alert('Order not found');
        return;
      }

      const orderData = orderSnap.data();
      const oldStatus = orderData.status;

      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        lastStatusUpdate: serverTimestamp()
      };

      // Add status history entry
      const statusHistory = orderData.statusHistory || [];
      statusHistory.push({
        from: oldStatus,
        to: newStatus,
        changedAt: new Date(),
        changedBy: 'Admin' // TODO: Get current user info
      });
      updateData.statusHistory = statusHistory;

      // Special handling for status changes
      if (newStatus === 'Picked Up') {
        // When picked up, show purchase entry dialog
        // Don't automatically process - wait for user to enter purchase details
        const orderDoc = await getDoc(orderRef);
        const orderData = { id: orderId, ...orderDoc.data() };
        
        // Show purchase entry dialog
        setPurchaseEntryOrder(orderData);
        setPurchaseEntryData({
          weightReceived: orderData.weight || '',
          manufacturingCost: '',
          gstAmount: '',
          paymentType: 'cash',
          creditDays: 0,
          notes: ''
        });
        setShowPurchaseEntryDialog(true);
        
        updateData.purchaseEntryRequired = true;
        updateData.purchaseEntryCompleted = false;
      } else if (newStatus === 'Delivered') {
        // When delivered, show delivery & billing dialog
        const orderDoc = await getDoc(orderRef);
        const orderData = { id: orderId, ...orderDoc.data() };
        
        setDeliveryOrder(orderData);
        setDeliveryData({
          deliveryDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
          paidAmount: orderData.total || 0,
          notes: ''
        });
        setShowDeliveryDialog(true);
        
        updateData.deliveryRequired = true;
        updateData.deliveryCompleted = false;
      }

      await updateDoc(orderRef, updateData);

      console.log(`Order ${orderId} status updated from ${oldStatus} to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  // ✅ TASK 7.1: Gold Withdrawal Challan Generation
  const handleIssueChallan = async (order) => {
    try {
      if (!order.manufacturerId) {
        alert('Cannot issue challan: No manufacturer assigned to this order');
        return;
      }

      // Generate challan number
      const challansPath = `${basePath}/challans`;
      const challansSnapshot = await getDocs(
        query(collection(db, challansPath), orderBy('createdAt', 'desc'), limit(1))
      );
      
      let challanNumber = 'CH-001-' + new Date().getFullYear();
      if (!challansSnapshot.empty) {
        const lastChallan = challansSnapshot.docs[0].data();
        const lastNumber = parseInt(lastChallan.challanNumber.split('-')[1]) || 0;
        challanNumber = `CH-${String(lastNumber + 1).padStart(3, '0')}-${new Date().getFullYear()}`;
      }

      // Fetch manufacturer data
      const manufacturerRef = doc(db, `${basePath}/manufacturers`, order.manufacturerId);
      const manufacturerSnap = await getDoc(manufacturerRef);
      if (!manufacturerSnap.exists()) {
        alert('Manufacturer not found');
        return;
      }
      const manufacturerData = { id: manufacturerSnap.id, ...manufacturerSnap.data() };

      // Fetch customer data
      const customerRef = doc(db, `${basePath}/customers`, order.customerId);
      const customerSnap = await getDoc(customerRef);
      const customerData = customerSnap.exists() ? { id: customerSnap.id, ...customerSnap.data() } : null;

      // Calculate pure gold (24k equivalent) from order
      const purityCoefficient = {
        '24k': 1.0,
        '22k': 0.9166,
        '21k': 0.875,
        '18k': 0.75,
        '14k': 0.5833
      };
      const pureGoldAmount = order.totalWeight * (purityCoefficient[order.karat] || 0.75);

      // Create challan document
      const challanData = {
        challanNumber,
        challanType: 'gold_withdrawal',
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName || 'Unknown',
        manufacturerId: order.manufacturerId,
        manufacturerName: manufacturerData.manufacturerName || manufacturerData.name || 'Unknown',
        pureGoldAmount,
        purpose: `Production of ${order.weight}g ${order.karat} ${order.productName} for Order ${order.id.slice(-8)}`,
        status: 'issued',
        issuedDate: serverTimestamp(),
        accountingRecorded: false,
        sharafReleaseConfirmation: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId || 'default-company'
      };

      // Save challan to Firestore
      const challanRef = await addDoc(collection(db, challansPath), challanData);
      console.log('Challan created:', challanRef.id);

      // Update order with challan number and status
      const orderRef = doc(db, ordersPath, order.id);
      await updateDoc(orderRef, {
        challanNumber,
        challanId: challanRef.id,
        status: 'Challan Issued',
        challanIssuedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create accounting entry: Debit Gold in Transit (1102), Credit Gold Bank Sharaf (1101)
      try {
        const accountingEngine = new AccountingEngine(companyId || 'default-company');
        await accountingEngine.createEntry({
          date: new Date(),
          description: `Gold withdrawal challan ${challanNumber} issued for Order ${order.id.slice(-8)}`,
          transactionType: 'gold_challan_issued',
          referenceId: challanRef.id,
          referenceType: 'challan',
          entries: [
            {
              accountCode: '1102',
              accountName: 'Gold in Transit',
              debit: pureGoldAmount,
              credit: 0,
              balanceType: 'gold'
            },
            {
              accountCode: '1101',
              accountName: 'Gold Bank (Sharaf)',
              debit: 0,
              credit: pureGoldAmount,
              balanceType: 'gold'
            }
          ]
        });

        // Update challan accounting status
        await updateDoc(doc(db, challansPath, challanRef.id), {
          accountingRecorded: true,
          updatedAt: serverTimestamp()
        });

        console.log('Accounting entry created for challan');
      } catch (accountingError) {
        console.error('Error creating accounting entry:', accountingError);
        // Continue - challan is still created
      }

      // Update manufacturer's goldInTransit
      try {
        const currentGoldInTransit = manufacturerData.goldInTransit || 0;
        await updateDoc(manufacturerRef, {
          goldInTransit: currentGoldInTransit + pureGoldAmount,
          updatedAt: serverTimestamp()
        });
        console.log('Manufacturer goldInTransit updated');
      } catch (mfgError) {
        console.error('Error updating manufacturer goldInTransit:', mfgError);
      }

      // Show success dialog with challan data
      setChallanOrderData({
        ...order,
        challanNumber,
        challanId: challanRef.id,
        pureGoldAmount,
        manufacturerData,
        customerData
      });
      setShowChallanDialog(true);

      alert(`Challan ${challanNumber} issued successfully!`);
    } catch (error) {
      console.error('Error issuing challan:', error);
      alert('Error issuing challan: ' + error.message);
    }
  };

  // ✅ TASK 7.2: Issue Additional Gold Challan
  const handleIssueAdditionalChallan = (order) => {
    setAdditionalChallanData({
      order,
      challanType: 'additional_gold',
      goldAmount: '',
      reason: 'Additional gold needed for production',
      notes: ''
    });
    setShowAdditionalChallanDialog(true);
  };

  // ✅ TASK 7.3: Record Gold Return
  const handleRecordGoldReturn = (order) => {
    setAdditionalChallanData({
      order,
      challanType: 'gold_return',
      goldAmount: '',
      reason: 'Excess gold returned by manufacturer',
      notes: ''
    });
    setShowAdditionalChallanDialog(true);
  };

  // ✅ TASK 7.2 & 7.3: Process Additional Challan or Gold Return
  const processAdditionalChallan = async () => {
    try {
      const { order, challanType, goldAmount, reason, notes } = additionalChallanData;

      if (!goldAmount || parseFloat(goldAmount) <= 0) {
        alert('Please enter a valid gold amount');
        return;
      }

      const pureGoldAmount = parseFloat(goldAmount);

      // Generate challan number
      const challansPath = `${basePath}/challans`;
      const challansSnapshot = await getDocs(
        query(collection(db, challansPath), orderBy('createdAt', 'desc'), limit(1))
      );
      
      let challanNumber = 'CH-001-' + new Date().getFullYear();
      if (!challansSnapshot.empty) {
        const lastChallan = challansSnapshot.docs[0].data();
        const lastNumber = parseInt(lastChallan.challanNumber.split('-')[1]) || 0;
        challanNumber = `CH-${String(lastNumber + 1).padStart(3, '0')}-${new Date().getFullYear()}`;
      }

      // Fetch manufacturer data
      const manufacturerRef = doc(db, `${basePath}/manufacturers`, order.manufacturerId);
      const manufacturerSnap = await getDoc(manufacturerRef);
      if (!manufacturerSnap.exists()) {
        alert('Manufacturer not found');
        return;
      }
      const manufacturerData = { id: manufacturerSnap.id, ...manufacturerSnap.data() };

      // Create challan document
      const challanData = {
        challanNumber,
        challanType,
        orderId: order.id,
        customerId: order.customerId,
        manufacturerId: order.manufacturerId,
        manufacturerName: manufacturerData.name || 'Unknown',
        pureGoldAmount,
        purpose: reason,
        notes: notes || '',
        status: 'issued',
        issuedDate: serverTimestamp(),
        accountingRecorded: false,
        sharafReleaseConfirmation: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId || 'default-company'
      };

      // Save challan to Firestore
      const challanRef = await addDoc(collection(db, challansPath), challanData);
      console.log('Challan created:', challanRef.id);

      // Create accounting entry based on challan type
      try {
        const accountingEngine = new AccountingEngine(companyId || 'default-company');
        
        if (challanType === 'additional_gold') {
          // Additional Gold: Debit 1102 (Gold in Transit), Credit 1101 (Gold Bank Sharaf)
          await accountingEngine.createEntry({
            date: new Date(),
            description: `Additional gold challan ${challanNumber} for Order ${order.id.slice(-8)} - ${order.manufacturerName}`,
            transactionType: 'additional_gold_challan',
            referenceId: challanRef.id,
            referenceType: 'challan',
            entries: [
              {
                accountCode: '1102',
                accountName: 'Gold in Transit',
                debit: pureGoldAmount,
                credit: 0,
                balanceType: 'gold'
              },
              {
                accountCode: '1101',
                accountName: 'Gold Bank - Sharaf',
                debit: 0,
                credit: pureGoldAmount,
                balanceType: 'gold'
              }
            ]
          });

          // Update manufacturer's goldInTransit (increase)
          const currentGoldInTransit = manufacturerData.goldInTransit || 0;
          await updateDoc(manufacturerRef, {
            goldInTransit: currentGoldInTransit + pureGoldAmount,
            updatedAt: serverTimestamp()
          });

        } else if (challanType === 'gold_return') {
          // Gold Return: Debit 1101 (Gold Bank Sharaf), Credit 1102 (Gold in Transit)
          await accountingEngine.createEntry({
            date: new Date(),
            description: `Gold return receipt ${challanNumber} for Order ${order.id.slice(-8)} - ${order.manufacturerName}`,
            transactionType: 'gold_return_receipt',
            referenceId: challanRef.id,
            referenceType: 'challan',
            entries: [
              {
                accountCode: '1101',
                accountName: 'Gold Bank - Sharaf',
                debit: pureGoldAmount,
                credit: 0,
                balanceType: 'gold'
              },
              {
                accountCode: '1102',
                accountName: 'Gold in Transit',
                debit: 0,
                credit: pureGoldAmount,
                balanceType: 'gold'
              }
            ]
          });

          // Update manufacturer's goldInTransit (decrease)
          const currentGoldInTransit = manufacturerData.goldInTransit || 0;
          await updateDoc(manufacturerRef, {
            goldInTransit: Math.max(0, currentGoldInTransit - pureGoldAmount),
            updatedAt: serverTimestamp()
          });
        }

        // Mark accounting as recorded
        await updateDoc(doc(db, challansPath, challanRef.id), {
          accountingRecorded: true,
          accountingEntryId: challanRef.id
        });

        console.log('Accounting entry created for challan');
      } catch (accountingError) {
        console.error('Error creating accounting entry:', accountingError);
        // Continue - challan is still created
      }

      // Download PDF
      const challanPdfData = {
        challanNumber,
        challanType,
        issuedDate: new Date(),
        orderId: order.id,
        manufacturerName: manufacturerData.name || 'Unknown',
        manufacturerCode: manufacturerData.manufacturerCode || '',
        manufacturerPhone: manufacturerData.phone || '',
        pureGoldAmount,
        purpose: reason,
        notes: notes || ''
      };
      
      await challanGenerator.downloadChallan(challanPdfData);

      // Close dialog
      setShowAdditionalChallanDialog(false);
      setAdditionalChallanData({
        order: null,
        challanType: 'additional_gold',
        goldAmount: '',
        reason: '',
        notes: ''
      });

      const actionText = challanType === 'additional_gold' ? 'Additional gold challan' : 'Gold return receipt';
      alert(`${actionText} ${challanNumber} created successfully!`);
    } catch (error) {
      console.error('Error processing challan:', error);
      alert('Error processing challan: ' + error.message);
    }
  };

  // ✅ TASK 9.1: Generate Invoice/Bill (Pure Gold)
  const handleGenerateInvoice = async (order) => {
    try {
      if (!order.customerId) {
        alert('Cannot generate invoice: No customer assigned to this order');
        return;
      }

      // Fetch customer data
      const customerRef = doc(db, `${basePath}/customers`, order.customerId);
      const customerSnap = await getDoc(customerRef);
      if (!customerSnap.exists()) {
        alert('Customer not found');
        return;
      }
      const customerData = { id: customerSnap.id, ...customerSnap.data() };

      // Get current gold price (TODO: fetch from goldPriceHistory)
      const goldPrice = 145.43; // Hardcoded for now

      // Calculate pure gold (24k equivalent) from order
      const purityCoefficient = {
        '24k': 1.0,
        '22k': 0.9166,
        '21k': 0.875,
        '18k': 0.75
      };
      const productPureGold = order.weight * (purityCoefficient[order.karat] || 0.75);

      // Calculate commission in gold (manufacturing cost ÷ gold price)
      const manufacturingCostUSD = order.manufacturingCost || 0;
      const commissionGold = manufacturingCostUSD / goldPrice;

      // Get prior balance from customer
      const priorBalance = customerData.currentPureGoldBalance || 0;

      // Calculate total pure gold owed
      const totalPureGold = productPureGold + commissionGold + priorBalance;

      // Generate invoice number
      const invoicesPath = `${basePath}/invoices`;
      const invoicesSnapshot = await getDocs(
        query(collection(db, invoicesPath), orderBy('createdAt', 'desc'), limit(1))
      );
      
      let invoiceNumber = 'INV-001-' + new Date().getFullYear();
      if (!invoicesSnapshot.empty) {
        const lastInvoice = invoicesSnapshot.docs[0].data();
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1]) || 0;
        invoiceNumber = `INV-${String(lastNumber + 1).padStart(3, '0')}-${new Date().getFullYear()}`;
      }

      // ✅ TASK 9.2: Calculate due date with credit days (default 15, or use customer's credit days)
      const creditDays = customerData.creditDays || 15; // Default 15 days, can be customized per customer
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + creditDays);

      // Create invoice document
      const invoiceData = {
        invoiceNumber,
        invoiceType: 'customer_bill',
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName || 'Unknown',
        productPureGold,
        commissionGold,
        priorBalance,
        totalPureGold,
        goldPriceAtInvoice: goldPrice,
        displayAmountUSD: totalPureGold * goldPrice,
        paidPureGold: 0,
        remainingPureGold: totalPureGold,
        paymentStatus: 'not_paid',
        invoiceDate: serverTimestamp(),
        dueDate,
        creditDays,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId || 'default-company'
      };

      // Save invoice to Firestore
      const invoiceRef = await addDoc(collection(db, invoicesPath), invoiceData);
      console.log('Invoice created:', invoiceRef.id);

      // Update order with invoice number and status
      const orderRef = doc(db, ordersPath, order.id);
      await updateDoc(orderRef, {
        invoiceNumber,
        invoiceId: invoiceRef.id,
        status: 'Customer Billed',
        paymentStatus: 'Billed',
        customerBilledDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create accounting entry: 
      // Debit: Customer Receivable (1301-CUST-XXX)
      // Credit: Finished Goods Inventory (1103) - for product
      // Credit: Commission Income (4101) - for commission
      try {
        const accountingEngine = new AccountingEngine(companyId || 'default-company');
        await accountingEngine.createEntry({
          date: new Date(),
          description: `Invoice ${invoiceNumber} generated for Order ${order.id.slice(-8)} - ${order.customerName}`,
          transactionType: 'customer_invoice',
          referenceId: invoiceRef.id,
          referenceType: 'invoice',
          entries: [
            {
              accountCode: customerData.accountCode || `1301-CUST-${customerData.id.slice(-3)}`,
              accountName: `Customer Receivable - ${customerData.customerName || customerData.name}`,
              debit: totalPureGold,
              credit: 0,
              balanceType: 'gold'
            },
            {
              accountCode: '1103',
              accountName: 'Finished Goods Inventory',
              debit: 0,
              credit: productPureGold,
              balanceType: 'gold'
            },
            {
              accountCode: '4101',
              accountName: 'Commission Income',
              debit: 0,
              credit: commissionGold,
              balanceType: 'gold'
            }
          ]
        });

        console.log('Accounting entry created for invoice');
      } catch (accountingError) {
        console.error('Error creating accounting entry:', accountingError);
        // Continue - invoice is still created
      }

      // Update customer's balance
      try {
        const newCustomerBalance = (customerData.currentPureGoldBalance || 0) + totalPureGold;
        const newTotalOrdered = (customerData.totalPureGoldOrdered || 0) + productPureGold;
        
        await updateDoc(customerRef, {
          currentPureGoldBalance: newCustomerBalance,
          totalPureGoldOrdered: newTotalOrdered,
          updatedAt: serverTimestamp()
        });
        console.log('Customer balance updated');
      } catch (customerError) {
        console.error('Error updating customer balance:', customerError);
      }

      // Show success dialog with invoice data
      setInvoiceOrderData({
        ...order,
        invoiceNumber,
        invoiceId: invoiceRef.id,
        productPureGold,
        commissionGold,
        priorBalance,
        totalPureGold,
        goldPrice,
        customerData
      });
      setShowInvoiceDialog(true);

      alert(`Invoice ${invoiceNumber} generated successfully!`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice: ' + error.message);
    }
  };

  // ✅ TASK 10.1: Record Customer Payment (Pure Gold or USD)
  const handleRecordPayment = async () => {
    try {
      if (!paymentInvoiceData) {
        alert('No invoice selected for payment');
        return;
      }

      // Get current gold price
      const goldPrice = paymentData.useMarketPrice ? 
        145.43 : // TODO: fetch from goldPriceHistory
        parseFloat(paymentData.adjustedPrice) || 145.43;

      // Calculate payment in pure gold
      let totalGoldPaid = 0;
      let goldPortion = 0;
      let usdPortion = 0;
      let usdEquivalentGold = 0;

      if (paymentData.paymentMethod === 'pure_gold') {
        goldPortion = parseFloat(paymentData.goldPaid) || 0;
        totalGoldPaid = goldPortion;
      } else if (paymentData.paymentMethod === 'usd_cash') {
        usdPortion = parseFloat(paymentData.usdPaid) || 0;
        usdEquivalentGold = usdPortion / goldPrice;
        totalGoldPaid = usdEquivalentGold;
      } else if (paymentData.paymentMethod === 'mixed') {
        goldPortion = parseFloat(paymentData.goldPaid) || 0;
        usdPortion = parseFloat(paymentData.usdPaid) || 0;
        usdEquivalentGold = usdPortion / goldPrice;
        totalGoldPaid = goldPortion + usdEquivalentGold;
      }

      if (totalGoldPaid <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }

      // Fetch invoice
      const invoicesPath = `${basePath}/invoices`;
      const invoiceRef = doc(db, invoicesPath, paymentInvoiceData.invoiceId);
      const invoiceSnap = await getDoc(invoiceRef);
      
      if (!invoiceSnap.exists()) {
        alert('Invoice not found');
        return;
      }
      
      const invoiceData = invoiceSnap.data();
      const remainingBalance = invoiceData.remainingPureGold || 0;

      if (totalGoldPaid > remainingBalance) {
        const confirm = window.confirm(
          `Payment (${totalGoldPaid.toFixed(3)}g) exceeds remaining balance (${remainingBalance.toFixed(3)}g). This will create a credit for the customer. Continue?`
        );
        if (!confirm) return;
      }

      // Generate payment number
      const paymentsPath = `${basePath}/payments`;
      const paymentsSnapshot = await getDocs(
        query(collection(db, paymentsPath), orderBy('createdAt', 'desc'), limit(1))
      );
      
      let paymentNumber = 'PAY-001-' + new Date().getFullYear();
      if (!paymentsSnapshot.empty) {
        const lastPayment = paymentsSnapshot.docs[0].data();
        const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[1]) || 0;
        paymentNumber = `PAY-${String(lastNumber + 1).padStart(3, '0')}-${new Date().getFullYear()}`;
      }

      // Create payment document
      const paymentDoc = {
        paymentNumber,
        paymentType: 'customer_payment',
        invoiceId: paymentInvoiceData.invoiceId,
        customerId: paymentInvoiceData.customerId,
        customerName: paymentInvoiceData.customerName,
        pureGoldPaid: totalGoldPaid,
        goldPriceAtPayment: goldPrice,
        displayAmountUSD: totalGoldPaid * goldPrice,
        paymentMethod: 'gold',
        paymentMode: paymentData.paymentMethod, // pure_gold, usd_cash, mixed
        goldPortion: goldPortion,
        usdPortion: usdPortion,
        usdEquivalentGold: usdEquivalentGold,
        priceAdjusted: !paymentData.useMarketPrice,
        adjustedPrice: paymentData.useMarketPrice ? null : goldPrice,
        adjustmentReason: paymentData.adjustmentReason || null,
        previousBalance: remainingBalance,
        amountPaid: totalGoldPaid,
        newBalance: remainingBalance - totalGoldPaid,
        depositedToSharaf: false,
        accountingRecorded: false,
        status: 'completed',
        paymentDate: serverTimestamp(),
        notes: paymentData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId || 'default-company'
      };

      // Save payment to Firestore
      const paymentRef = await addDoc(collection(db, paymentsPath), paymentDoc);
      console.log('Payment created:', paymentRef.id);

      // Update invoice
      const newPaidAmount = (invoiceData.paidPureGold || 0) + totalGoldPaid;
      const newRemainingAmount = invoiceData.totalPureGold - newPaidAmount;
      const newPaymentStatus = newRemainingAmount <= 0 ? 'paid' : 
        newPaidAmount > 0 ? 'partially_paid' : 'not_paid';

      await updateDoc(invoiceRef, {
        paidPureGold: newPaidAmount,
        remainingPureGold: newRemainingAmount,
        paymentStatus: newPaymentStatus,
        status: newPaymentStatus === 'paid' ? 'paid' : 'active',
        lastPaymentDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create accounting entries
      try {
        const accountingEngine = new AccountingEngine(companyId || 'default-company');
        const entries = [];

        // Gold portion: Debit Gold Bank (1101), Credit Customer Receivable (1301)
        if (goldPortion > 0) {
          entries.push({
            accountCode: '1101',
            accountName: 'Gold Bank (Sharaf)',
            debit: goldPortion,
            credit: 0,
            balanceType: 'gold'
          });
          entries.push({
            accountCode: paymentInvoiceData.customerData?.accountCode || `1301-CUST-${paymentInvoiceData.customerId.slice(-3)}`,
            accountName: `Customer Receivable - ${paymentInvoiceData.customerName}`,
            debit: 0,
            credit: goldPortion,
            balanceType: 'gold'
          });
        }

        // USD portion: Debit Cash (1201), Credit Customer Receivable (1301 equivalent)
        if (usdPortion > 0) {
          entries.push({
            accountCode: '1201',
            accountName: 'Cash in Hand',
            debit: usdPortion,
            credit: 0,
            balanceType: 'usd'
          });
          entries.push({
            accountCode: paymentInvoiceData.customerData?.accountCode || `1301-CUST-${paymentInvoiceData.customerId.slice(-3)}`,
            accountName: `Customer Receivable - ${paymentInvoiceData.customerName}`,
            debit: 0,
            credit: usdEquivalentGold,
            balanceType: 'gold'
          });
        }

        await accountingEngine.createEntry({
          date: new Date(),
          description: `Payment ${paymentNumber} received from ${paymentInvoiceData.customerName} for Invoice ${paymentInvoiceData.invoiceNumber}`,
          transactionType: 'customer_payment',
          referenceId: paymentRef.id,
          referenceType: 'payment',
          entries
        });

        // Update payment accounting status
        await updateDoc(doc(db, paymentsPath, paymentRef.id), {
          accountingRecorded: true,
          updatedAt: serverTimestamp()
        });

        console.log('Accounting entry created for payment');
      } catch (accountingError) {
        console.error('Error creating accounting entry:', accountingError);
        // Continue - payment is still recorded
      }

      // Update customer balance
      try {
        const customerRef = doc(db, `${basePath}/customers`, paymentInvoiceData.customerId);
        const customerSnap = await getDoc(customerRef);
        
        if (customerSnap.exists()) {
          const customerData = customerSnap.data();
          const newCustomerBalance = (customerData.currentPureGoldBalance || 0) - totalGoldPaid;
          const newTotalPaid = (customerData.totalPureGoldPaid || 0) + totalGoldPaid;
          
          await updateDoc(customerRef, {
            currentPureGoldBalance: newCustomerBalance,
            totalPureGoldPaid: newTotalPaid,
            lastPaymentDate: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log('Customer balance updated');
        }
      } catch (customerError) {
        console.error('Error updating customer balance:', customerError);
      }

      // Update order status if invoice fully paid
      if (newPaymentStatus === 'paid') {
        try {
          const orderRef = doc(db, ordersPath, paymentInvoiceData.orderId);
          await updateDoc(orderRef, {
            status: 'Payment Received',
            paymentStatus: 'Paid',
            paymentReceivedDate: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (orderError) {
          console.error('Error updating order:', orderError);
        }
      }

      // Close dialog and show success
      setShowPaymentDialog(false);
      
      // Show payment success dialog with receipt download option
      setPaymentSuccessData({
        paymentNumber,
        paymentData: {
          ...paymentDoc,
          paymentNumber,
          pureGoldPaid: totalGoldPaid,
          goldPriceAtPayment: goldPrice,
          displayAmountUSD: totalGoldPaid * goldPrice,
          paymentMode: paymentData.paymentMethod,
          goldPortion,
          usdPortion,
          usdEquivalentGold,
          priceAdjusted: !paymentData.useMarketPrice,
          adjustedPrice: !paymentData.useMarketPrice ? parseFloat(paymentData.adjustedPrice) : null,
          adjustmentReason: paymentData.adjustmentReason,
          previousBalance: remainingBalance,
          amountPaid: totalGoldPaid,
          newBalance: remainingBalance - totalGoldPaid,
          notes: paymentData.notes
        },
        invoiceData: {
          ...invoiceSnap.data(),
          invoiceNumber: paymentInvoiceData.invoiceNumber,
          totalPureGold: invoiceSnap.data().totalPureGold,
          paidPureGold: newPaidAmount,
          remainingPureGold: newRemainingAmount,
          paymentStatus: newPaymentStatus
        },
        customerData: paymentInvoiceData.customerData,
        isFullPayment: newPaymentStatus === 'paid',
        amountPaid: totalGoldPaid,
        newBalance: remainingBalance - totalGoldPaid
      });
      setShowPaymentSuccessDialog(true);
      
      // Reset payment form
      setPaymentInvoiceData(null);
      setPaymentData({
        paymentMethod: 'pure_gold',
        goldPaid: '',
        usdPaid: '',
        useMarketPrice: true,
        adjustedPrice: '',
        adjustmentReason: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment: ' + error.message);
    }
  };

  // Bulk update order status
  const handleBulkUpdateStatus = async () => {
    if (!bulkUpdateStatus || selectedOrders.length === 0) {
      alert('Please select orders and a status to update');
      return;
    }

    try {
      const updatePromises = selectedOrders.map(orderId =>
        updateOrderStatus(orderId, bulkUpdateStatus)
      );

      await Promise.all(updatePromises);

      setSelectedOrders([]);
      setBulkUpdateStatus('');
      setShowBulkUpdateDialog(false);

      alert(`Successfully updated ${selectedOrders.length} orders`);
    } catch (error) {
      console.error('Error bulk updating orders:', error);
      alert('Error updating orders. Please try again.');
    }
  };

  // Handle order selection for bulk operations
  const handleOrderSelect = (orderId, checked) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  // Handle select all orders
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };
  
  // Product name auto-suggestion handler (BRD v2 Section 3.5 - Local Cache Only)
  const handleProductNameInput = (input) => {
    setNewOrder({...newOrder, productName: input});
    if (input && input.trim()) {
      // Filter from local cache only - NO Firestore queries!
      const suggestions = productNameCache.filter(name =>
        name.toLowerCase().includes(input.toLowerCase())
      ).slice(0, 5); // Show top 5 matches
      setProductNameSuggestions(suggestions);
    } else {
      setProductNameSuggestions([]);
    }
  };
  
  // Customer selection handler
  const handleCustomerSelect = (customer) => {
    setNewOrder({
      ...newOrder,
      customerId: customer.id,
      customerName: customer.customerName,
      customerPhone: customer.phone || customer.customerPhone
    });
  };
  
  // Get manufacturer name by ID
  const getManufacturerName = (id) => {
    const manufacturer = manufacturers.find(m => m.id === id);
    return manufacturer ? manufacturer.manufacturerName || manufacturer.name : 'Unknown';
  };

  // Get category name by ID (fallback to stored label if available)
  const getCategoryName = (id) => {
    if (!id) return 'Uncategorized';
    const category = categories.find(cat => cat.id === id || cat.categoryId === id);
    return category?.categoryName || category?.categoriesname || 'Uncategorized';
  };

  // Create new order (phone-based entry)
  // ✅ TASK 6.1: Order Entry Form (Pure Gold Based - BRD v2)
  // Reference: BRD_GoldSmith_v2.md Section 4.2, DatabaseInfo_GoldSmith_v2.md Section 3
  const createNewOrder = async () => {
    try {
      // Validation
      if (!newOrder.customerId) {
        alert('Please select a customer');
        return;
      }
      if (!newOrder.productName) {
        alert('Please enter product name');
        return;
      }
      if (!newOrder.totalWeight || !newOrder.makingChargeRateUSD) {
        alert('Please enter weight and making charge rate');
        return;
      }
      if (!newOrder.serialNumber) {
        alert('Please enter serial number');
        return;
      }
      if (!newOrder.goldPricePerGram && !currentGoldPrice) {
        alert('Please enter gold price or wait for it to load automatically.');
        return;
      }

      // Karat purity coefficients (BRD v2 Section 10.2)
      const purityMap = {
        '24k': 1.0,
        '22k': 0.9167,
        '18k': 0.75,
        '14k': 0.5833
      };

      const totalWeight = parseFloat(newOrder.totalWeight);
      const makingChargeRate = parseFloat(newOrder.makingChargeRateUSD);
      const purityCoefficient = purityMap[newOrder.karat];
      const goldPricePerGram = parseFloat(newOrder.goldPricePerGram) || currentGoldPrice?.pricePerGram || 0;
      const goldPricePerOunce = parseFloat(newOrder.goldPricePerOunce) || currentGoldPrice?.pricePerOunce || 0;

      // Calculate pure gold (BRD v2 Section 3.1)
      const productPureGold = totalWeight * purityCoefficient;
      
      // Calculate commission in gold (BRD v2 Section 4.2)
      const makingChargeTotalUSD = totalWeight * makingChargeRate;
      const commissionGold = makingChargeTotalUSD / goldPricePerGram;
      
      // Get customer prior balance
      const customer = customers.find(c => c.id === newOrder.customerId);
      const priorGoldBalance = customer?.currentPureGoldBalance || 0;
      
      // Calculate total pure gold owed (BRD v2 Section 4.2)
      const totalPureGoldOwed = productPureGold + commissionGold + priorGoldBalance;
      
      // Display amount in USD (for reference only - not stored)
      const displayAmountUSD = totalPureGoldOwed * goldPricePerGram;

      // Generate order number
      const orderNumber = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Date.now().toString().slice(-3)}`;

      const orderData = {
        // Primary Keys
        orderNumber,
        
        // Customer Information (denormalized)
        customerId: newOrder.customerId,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        
        // Product Details
        serialNumber: newOrder.serialNumber,
        metal: 'gold', // Fixed per BRD v2
        productName: newOrder.productName,
        productType: newOrder.productName, // Same as productName for now
        totalWeight: totalWeight,
        karat: newOrder.karat,
        purityCoefficient: purityCoefficient,
        
        // Pure Gold Calculations (BRD v2 Section 3.1)
        productPureGold: parseFloat(productPureGold.toFixed(3)),
        makingChargeRateUSD: makingChargeRate,
        makingChargeTotalUSD: parseFloat(makingChargeTotalUSD.toFixed(2)),
        goldPriceAtOrder: parseFloat(goldPricePerGram.toFixed(2)),
        goldPricePerOunceAtOrder: parseFloat(goldPricePerOunce.toFixed(2)),
        commissionGold: parseFloat(commissionGold.toFixed(3)),
        priorGoldBalance: parseFloat(priorGoldBalance.toFixed(3)),
        totalPureGoldOwed: parseFloat(totalPureGoldOwed.toFixed(3)),
        displayAmountUSD: parseFloat(displayAmountUSD.toFixed(2)),
        
        // Manufacturer Details (optional)
        manufacturerId: newOrder.manufacturerId || '',
        manufacturerName: newOrder.manufacturerId ? getManufacturerName(newOrder.manufacturerId) : '',
        
        // Gold Movement Tracking
        challanIssued: false,
        challanNumber: '',
        goldIssuedToManufacturer: 0,
        additionalGoldIssued: 0,
        goldReturnedByManufacturer: 0,
        
        // Status Tracking (BRD v2 Section 4.1)
        status: 'New Order',
        paymentStatus: 'Not Billed',
        
        // Accounting Flags
        challanAccountingRecorded: false,
        inventoryAccountingRecorded: false,
        billingAccountingRecorded: false,
        paymentAccountingRecorded: false,
        
        // Timestamps
        orderDate: serverTimestamp(),
        expectedDeliveryDate: newOrder.expectedDeliveryDate ? new Date(newOrder.expectedDeliveryDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId,
        
        // Notes
        notes: newOrder.notes || ''
      };

      // Create the order document
      const orderRef = await addDoc(collection(db, ordersPath), orderData);
      const orderId = orderRef.id;

      // Update product name cache if new product
      if (newOrder.productName && !productNameCache.includes(newOrder.productName)) {
        setProductNameCache([...productNameCache, newOrder.productName].sort());
      }

      // Prepare receipt data
      const receiptData = {
        ...orderData,
        id: orderId
      };

      // Show receipt dialog
      setCreatedOrderData(receiptData);
      setShowReceiptDialog(true);
      setShowNewOrderDialog(false);

      // Reset form
      setNewOrder({
        customerId: '',
        customerPhone: '',
        customerName: '',
        serialNumber: '',
        productName: '',
        metal: 'gold',
        karat: '24k',
        totalWeight: '',
        makingChargeRateUSD: '',
        goldPricePerOunce: '',
        goldPricePerGram: '',
        manufacturerId: '',
        expectedDeliveryDate: '',
        notes: ''
      });
      setProductNameSuggestions([]);

      alert(`Order created successfully!\nOrder Number: ${orderNumber}\nTotal Pure Gold Owed: ${totalPureGoldOwed.toFixed(3)}g`);

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  };

  // Handle Purchase Entry Submission
  const handlePurchaseEntrySubmit = async () => {
    try {
      if (!purchaseEntryOrder) {
        alert('No order selected for purchase entry');
        return;
      }

      // Validation
      if (!purchaseEntryData.weightReceived || parseFloat(purchaseEntryData.weightReceived) <= 0) {
        alert('Please enter the weight received');
        return;
      }
      if (!purchaseEntryData.manufacturingCost || parseFloat(purchaseEntryData.manufacturingCost) <= 0) {
        alert('Please enter the manufacturing cost');
        return;
      }

      const weightReceived = parseFloat(purchaseEntryData.weightReceived);
      const manufacturingCost = parseFloat(purchaseEntryData.manufacturingCost);
      const gstAmount = parseFloat(purchaseEntryData.gstAmount) || 0;
      const totalPurchaseCost = manufacturingCost + gstAmount;

      // Calculate commission (Profit = Customer Price - Manufacturing Cost)
      const commissionAmount = purchaseEntryOrder.total - totalPurchaseCost;

      // Create purchase entry document
      const purchaseEntry = {
        orderId: purchaseEntryOrder.id,
        orderNumber: purchaseEntryOrder.orderNumber || purchaseEntryOrder.id,
        customerId: purchaseEntryOrder.customerId,
        customerName: purchaseEntryOrder.customerName,
        manufacturerId: purchaseEntryOrder.manufacturerId,
        manufacturerName: getManufacturerName(purchaseEntryOrder.manufacturerId),
        categoryId: purchaseEntryOrder.categoryId,
        productName: purchaseEntryOrder.productName,
        karat: purchaseEntryOrder.karat,
        weightOrdered: purchaseEntryOrder.weight,
        weightReceived,
        customerPrice: purchaseEntryOrder.total,
        manufacturingCost,
        gstAmount,
        totalPurchaseCost,
        commissionAmount,
        paymentType: purchaseEntryData.paymentType,
        creditDays: purchaseEntryData.paymentType === 'credit' ? parseInt(purchaseEntryData.creditDays) || 0 : 0,
        dueDate: purchaseEntryData.paymentType === 'credit' 
          ? new Date(Date.now() + (parseInt(purchaseEntryData.creditDays) || 0) * 24 * 60 * 60 * 1000)
          : null,
        notes: purchaseEntryData.notes,
        createdAt: serverTimestamp(),
        createdBy: 'admin', // Replace with actual user
        type: 'order_pickup'
      };

      // Save purchase entry
      await addDoc(collection(db, `companies/${companyId}/purchaseEntries`), purchaseEntry);

      // Update order document
      const orderRef = doc(db, ordersPath, purchaseEntryOrder.id);
      await updateDoc(orderRef, {
        purchaseEntryCompleted: true,
        purchaseEntryDate: serverTimestamp(),
        weightReceived,
        manufacturingCost,
        commissionAmount,
        paymentTypeToManufacturer: purchaseEntryData.paymentType,
        inventoryUpdated: true,
        commissionCalculated: true
      });

      // Add inventory for the purchased metal
      const inventoryService = new InventoryService(companyId);
      await inventoryService.addInventoryFromOrderPickup(
        purchaseEntryOrder.id,
        {
          ...purchaseEntryOrder,
          weightReceived,
          manufacturingCost
        }
      );

      // Create accounting entries
      const accountingEngine = new AccountingEngine(companyId);
      
      // Debit: Purchases Account (Asset)
      // Credit: Cash/Manufacturer (if credit, creates payable)
      await accountingEngine.recordPurchaseEntry({
        orderId: purchaseEntryOrder.id,
        manufacturerId: purchaseEntryOrder.manufacturerId,
        amount: totalPurchaseCost,
        paymentType: purchaseEntryData.paymentType,
        description: `Purchase entry for order ${purchaseEntryOrder.id} - ${purchaseEntryOrder.productName}`,
        date: new Date()
      });

      // Record commission income
      // Debit: Purchases/Cost of Goods Account
      // Credit: Commission Income
      await accountingEngine.recordCommissionIncome({
        orderId: purchaseEntryOrder.id,
        amount: commissionAmount,
        description: `Commission on order ${purchaseEntryOrder.id}`,
        date: new Date()
      });

      // Close dialog and reset
      setShowPurchaseEntryDialog(false);
      setPurchaseEntryOrder(null);
      setPurchaseEntryData({
        weightReceived: '',
        manufacturingCost: '',
        gstAmount: '',
        paymentType: 'cash',
        creditDays: 0,
        notes: ''
      });

      alert(`Purchase entry completed successfully!\nCommission Earned: ₹${commissionAmount.toFixed(2)}`);
    } catch (error) {
      console.error('Error submitting purchase entry:', error);
      alert('Error submitting purchase entry. Please try again.');
    }
  };

  // Handle Delivery & Billing Submission
  const handleDeliverySubmit = async () => {
    try {
      if (!deliveryOrder) {
        alert('No order selected for delivery');
        return;
      }

      // Validation
      if (!deliveryData.deliveryDate) {
        alert('Please select a delivery date');
        return;
      }

      const paidAmount = parseFloat(deliveryData.paidAmount) || 0;

      // Determine payment status based on payment method and amount
      let paymentStatus = 'Not Billed';
      if (deliveryData.paymentMethod === 'cash') {
        if (paidAmount >= deliveryOrder.total) {
          paymentStatus = 'Paid';
        } else if (paidAmount > 0) {
          paymentStatus = 'Partially Paid';
        } else {
          paymentStatus = 'Billed';
        }
      } else {
        // Credit sale
        paymentStatus = 'Billed';
      }

      // Update order document
      const orderRef = doc(db, ordersPath, deliveryOrder.id);
      await updateDoc(orderRef, {
        deliveryCompleted: true,
        deliveryDate: new Date(deliveryData.deliveryDate),
        paymentMethod: deliveryData.paymentMethod,
        paymentStatus,
        paidAmount,
        balanceDue: deliveryOrder.total - paidAmount,
        billingDate: serverTimestamp(),
        notes: deliveryData.notes,
        updatedAt: serverTimestamp()
      });

      // Generate bill/invoice based on payment method
      const orderReceiptEngine = new OrderReceiptEngine(companyId);
      
      if (deliveryData.paymentMethod === 'cash') {
        // Generate cash bill (receipt)
        await orderReceiptEngine.generateBill({
          orderId: deliveryOrder.id,
          orderData: deliveryOrder,
          paymentType: 'cash',
          paidAmount,
          deliveryDate: new Date(deliveryData.deliveryDate)
        });
      } else {
        // Generate credit invoice
        await orderReceiptEngine.generateInvoice({
          orderId: deliveryOrder.id,
          orderData: deliveryOrder,
          deliveryDate: new Date(deliveryData.deliveryDate),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days credit
        });
      }

      // Create accounting entries
      const accountingEngine = new AccountingEngine(companyId);
      
      if (deliveryData.paymentMethod === 'cash' && paidAmount > 0) {
        // Record cash sale
        await accountingEngine.recordCashSale({
          orderId: deliveryOrder.id,
          customerId: deliveryOrder.customerId,
          amount: paidAmount,
          description: `Cash sale for order ${deliveryOrder.id}`,
          date: new Date(deliveryData.deliveryDate)
        });
      } else if (deliveryData.paymentMethod === 'credit') {
        // Record credit sale (creates receivable)
        await accountingEngine.recordCreditSale({
          orderId: deliveryOrder.id,
          customerId: deliveryOrder.customerId,
          amount: deliveryOrder.total,
          description: `Credit sale for order ${deliveryOrder.id}`,
          date: new Date(deliveryData.deliveryDate)
        });
      }

      // Close dialog and reset
      setShowDeliveryDialog(false);
      setDeliveryOrder(null);
      setDeliveryData({
        deliveryDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        paidAmount: 0,
        notes: ''
      });

      alert(`Delivery completed successfully!\nPayment Status: ${paymentStatus}`);
    } catch (error) {
      console.error('Error submitting delivery:', error);
      alert('Error submitting delivery. Please try again.');
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gold Smith Orders</h1>
            <p className="text-gray-600">Manage customer orders and manufacturer coordination</p>
          </div>
          <button
            onClick={() => setShowNewOrderDialog(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            New Phone Order
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-800">{orderStats.total}</div>
            <div className="text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{orderStats.byStatus['New'] || 0}</div>
            <div className="text-gray-600">New Orders</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{orderStats.byStatus['In Production'] || 0}</div>
            <div className="text-gray-600">In Production</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{orderStats.byStatus['Completed'] || 0}</div>
            <div className="text-gray-600">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search by order ID, customer, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Payment Statuses</option>
                {PAYMENT_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="total">Sort by Amount</option>
                <option value="customerName">Sort by Customer</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {selectedOrders.length > 0 && (
                <button
                  onClick={() => setShowBulkUpdateDialog(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Bulk Update ({selectedOrders.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => handleOrderSelect(order.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id.slice(-8)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-gray-500">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{order.weight}g {order.karat} {getCategoryName(order.categoryId)}</div>
                        <div className="text-gray-500">{order.productName}</div>
                      </div>
                    </td>
                    {/* ✅ TASK 6.4: Status Workflow Column */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        {/* Current Status Badge */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full text-center ${ORDER_STATUS_FLOW[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                          {ORDER_STATUS_FLOW[order.status]?.label || order.status}
                        </span>
                        
                        {/* Next Status Actions */}
                        {ORDER_STATUS_FLOW[order.status]?.nextStatuses.length > 0 && (
                          <div className="flex flex-col gap-1">
                            {ORDER_STATUS_FLOW[order.status].nextStatuses.map(nextStatus => (
                              <button
                                key={nextStatus}
                                onClick={() => handleStatusChange(order, nextStatus)}
                                className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded border border-blue-300 transition-colors"
                                title={`Change to ${ORDER_STATUS_FLOW[nextStatus]?.label}`}
                              >
                                → {ORDER_STATUS_FLOW[nextStatus]?.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                        order.paymentStatus === 'Billed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{order.total?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {/* ✅ TASK 7.1: Issue Challan Button */}
                        {order.status === 'Confirmed' && order.manufacturerId && !order.challanNumber && (
                          <button
                            onClick={() => handleIssueChallan(order)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Issue Gold Withdrawal Challan"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {order.challanNumber && (
                          <span className="text-xs text-yellow-700 font-semibold" title={`Challan: ${order.challanNumber}`}>
                            📄 {order.challanNumber}
                          </span>
                        )}
                        {/* ✅ TASK 7.2: Issue Additional Gold Challan Button */}
                        {order.challanNumber && order.status === 'In Production' && (
                          <button
                            onClick={() => handleIssueAdditionalChallan(order)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Issue Additional Gold Challan"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        {/* ✅ TASK 7.3: Record Gold Return Button */}
                        {order.challanNumber && order.status === 'In Production' && (
                          <button
                            onClick={() => handleRecordGoldReturn(order)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Record Gold Return from Manufacturer"
                          >
                            <TrendingUp className="w-4 h-4 transform rotate-180" />
                          </button>
                        )}
                        {/* ✅ TASK 9.1: Generate Invoice Button */}
                        {order.status === 'Ready for Pickup' && !order.invoiceNumber && (
                          <button
                            onClick={() => handleGenerateInvoice(order)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Generate Customer Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {order.invoiceNumber && (
                          <span className="text-xs text-blue-700 font-semibold" title={`Invoice: ${order.invoiceNumber}`}>
                            📋 {order.invoiceNumber}
                          </span>
                        )}
                        {/* ✅ TASK 10.1: Record Payment Button */}
                        {order.invoiceNumber && order.paymentStatus !== 'Paid' && (
                          <button
                            onClick={async () => {
                              // Fetch invoice data
                              const invoicesPath = `${basePath}/invoices`;
                              const invoiceQuery = query(
                                collection(db, invoicesPath),
                                where('orderId', '==', order.id),
                                limit(1)
                              );
                              const invoiceSnap = await getDocs(invoiceQuery);
                              
                              if (!invoiceSnap.empty) {
                                const invoiceDoc = invoiceSnap.docs[0];
                                const invoiceData = invoiceDoc.data();
                                
                                // Fetch customer data
                                const customerRef = doc(db, `${basePath}/customers`, order.customerId);
                                const customerSnap = await getDoc(customerRef);
                                const customerData = customerSnap.exists() ? customerSnap.data() : null;
                                
                                setPaymentInvoiceData({
                                  ...order,
                                  invoiceId: invoiceDoc.id,
                                  invoiceNumber: invoiceData.invoiceNumber,
                                  totalPureGold: invoiceData.totalPureGold,
                                  paidPureGold: invoiceData.paidPureGold || 0,
                                  remainingPureGold: invoiceData.remainingPureGold,
                                  customerData
                                });
                                setShowPaymentDialog(true);
                              } else {
                                alert('Invoice not found');
                              }
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Record Customer Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        {/* ✅ TASK 10.3: View Payment History Button */}
                        {order.invoiceNumber && (
                          <button
                            onClick={async () => {
                              // Fetch invoice data
                              const invoicesPath = `${basePath}/invoices`;
                              const invoiceQuery = query(
                                collection(db, invoicesPath),
                                where('orderId', '==', order.id),
                                limit(1)
                              );
                              const invoiceSnap = await getDocs(invoiceQuery);
                              
                              if (!invoiceSnap.empty) {
                                const invoiceDoc = invoiceSnap.docs[0];
                                const invoiceData = invoiceDoc.data();
                                
                                // Fetch all payments for this invoice
                                const paymentsPath = `${basePath}/payments`;
                                const paymentsQuery = query(
                                  collection(db, paymentsPath),
                                  where('invoiceId', '==', invoiceDoc.id),
                                  orderBy('paymentDate', 'desc')
                                );
                                const paymentsSnap = await getDocs(paymentsQuery);
                                const payments = paymentsSnap.docs.map(doc => ({
                                  id: doc.id,
                                  ...doc.data()
                                }));
                                
                                // Fetch customer data
                                const customerRef = doc(db, `${basePath}/customers`, order.customerId);
                                const customerSnap = await getDoc(customerRef);
                                const customerData = customerSnap.exists() ? customerSnap.data() : null;
                                
                                setPaymentHistoryData({
                                  order,
                                  invoice: {
                                    id: invoiceDoc.id,
                                    ...invoiceData
                                  },
                                  payments,
                                  customer: customerData
                                });
                                setShowPaymentHistoryDialog(true);
                              }
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Payment History"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Order Dialog */}
        {/* ✅ TASK 6.1: Order Entry Form (Pure Gold Based - BRD v2) */}
        {showNewOrderDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                <h2 className="text-2xl font-bold text-gray-800">New Order - Pure Gold Accounting</h2>
                <p className="text-sm text-gray-500 mt-1">All calculations in pure gold grams (تیزابی)</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Selection */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer *</label>
                  <select
                    value={newOrder.customerId}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value);
                      handleCustomerSelect(customer);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {customers
                      .filter(c => c.isActive !== false)
                      .map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.customerName} - {customer.phone || customer.customerPhone} 
                          {customer.currentPureGoldBalance ? ` (Balance: ${customer.currentPureGoldBalance.toFixed(3)}g)` : ''}
                        </option>
                      ))}
                  </select>
                  {newOrder.customerId && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Address:</strong> {customers.find(c => c.id === newOrder.customerId)?.address || 'N/A'}
                    </div>
                  )}
                </div>

                {/* Serial Number & Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial No. *</label>
                    <input
                      type="text"
                      value={newOrder.serialNumber}
                      onChange={(e) => setNewOrder({...newOrder, serialNumber: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      placeholder="e.g., 12, 345, A123"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name * (طلاچه)</label>
                    <input
                      type="text"
                      value={newOrder.productName}
                      onChange={(e) => handleProductNameInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      placeholder="e.g., Bracelet, Ring, Necklace"
                    />
                    {productNameSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {productNameSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setNewOrder({...newOrder, productName: suggestion});
                              setProductNameSuggestions([]);
                            }}
                            className="px-4 py-2 hover:bg-yellow-50 cursor-pointer text-sm"
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Auto-suggestions from previous orders</p>
                  </div>
                </div>

                {/* Gold Karat & Weight */}
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Gold Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Metal</label>
                      <input
                        type="text"
                        value="Gold"
                        disabled
                        className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Fixed - Gold only</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gold Karat *</label>
                      <select
                        value={newOrder.karat}
                        onChange={(e) => setNewOrder({...newOrder, karat: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="24k">24k (100% pure)</option>
                        <option value="22k">22k (91.67% pure)</option>
                        <option value="18k">18k (75% pure)</option>
                        <option value="14k">14k (58.33% pure)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (گرام) *</label>
                      <input
                        type="number"
                        step="0.001"
                        value={newOrder.totalWeight}
                        onChange={(e) => setNewOrder({...newOrder, totalWeight: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                        placeholder="200.000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Finished product weight in grams</p>
                    </div>
                  </div>
                </div>

                {/* Gold Price Input */}
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Current Gold Price</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gold Price per Ounce (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newOrder.goldPricePerOunce || currentGoldPrice?.pricePerOunce || ''}
                        onChange={(e) => {
                          const ouncePrice = parseFloat(e.target.value) || 0;
                          const gramPrice = ouncePrice / 31.15;
                          setNewOrder({
                            ...newOrder, 
                            goldPricePerOunce: e.target.value,
                            goldPricePerGram: gramPrice.toFixed(2)
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Enter gold price per ounce"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gold Price per Gram (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newOrder.goldPricePerGram || currentGoldPrice?.pricePerGram || ''}
                        onChange={(e) => {
                          const gramPrice = parseFloat(e.target.value) || 0;
                          const ouncePrice = gramPrice * 31.15;
                          setNewOrder({
                            ...newOrder, 
                            goldPricePerGram: e.target.value,
                            goldPricePerOunce: ouncePrice.toFixed(2)
                          });
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Enter gold price per gram"
                      />
                      <p className="text-xs text-gray-500 mt-1">Auto-calculated from ounce price</p>
                    </div>
                  </div>
                </div>

                {/* Making Charge Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Making Charge Rate (USD per gram) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOrder.makingChargeRateUSD}
                    onChange={(e) => setNewOrder({...newOrder, makingChargeRateUSD: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="1.20"
                  />
                  <p className="text-xs text-gray-500 mt-1">Commission per gram of finished product</p>
                </div>

                {/* Pure Gold Calculation Display */}
                {newOrder.totalWeight && newOrder.makingChargeRateUSD && (newOrder.goldPricePerGram || currentGoldPrice?.pricePerGram) && (
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg p-5">
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">Pure Gold Calculation (تیزابی)</h3>
                    {(() => {
                      const purityMap = { '24k': 1.0, '22k': 0.9167, '18k': 0.75, '14k': 0.5833 };
                      const weight = parseFloat(newOrder.totalWeight) || 0;
                      const purity = purityMap[newOrder.karat];
                      const makingRate = parseFloat(newOrder.makingChargeRateUSD) || 0;
                      const goldPricePerGram = parseFloat(newOrder.goldPricePerGram) || currentGoldPrice?.pricePerGram || 0;
                      
                      const productPureGold = weight * purity;
                      const makingChargeTotalUSD = weight * makingRate;
                      const makingChargeGold = makingChargeTotalUSD / goldPricePerGram;
                      const priorBalance = customers.find(c => c.id === newOrder.customerId)?.currentPureGoldBalance || 0;
                      const totalPureGold = productPureGold + makingChargeGold + priorBalance;
                      const displayUSD = totalPureGold * goldPricePerGram;
                      
                      return (
                        <div className="space-y-3 text-sm">
                          {/* Product Gold Section */}
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-2">💍 Product Pure Gold (تیزابی محصول)</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Finished Product Weight:</span>
                                <span className="font-semibold">{weight.toFixed(3)} g ({newOrder.karat})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Pure Gold Required:</span>
                                <span className="font-bold text-blue-600 text-lg">{productPureGold.toFixed(3)} g</span>
                              </div>
                            </div>
                          </div>

                          {/* Commission Gold Section */}
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <h4 className="font-semibold text-green-800 mb-2">⚒️ Commission Pure Gold (تیزابی اجرت)</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Making Charge Rate:</span>
                                <span className="font-semibold">${makingRate.toFixed(2)}/g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Making Charge Total (USD):</span>
                                <span className="font-semibold">${makingChargeTotalUSD.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Pure Gold for Commission:</span>
                                <span className="font-bold text-green-600 text-lg">{makingChargeGold.toFixed(3)} g</span>
                              </div>
                            </div>
                          </div>

                          {/* Customer Payment Summary */}
                          <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-300">
                            <h4 className="font-semibold text-yellow-800 mb-2">💰 Customer Payment Required (پرداخت مشتری)</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Pure Gold for Product:</span>
                                <span className="font-semibold text-blue-600">{productPureGold.toFixed(3)} g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Pure Gold for Commission:</span>
                                <span className="font-semibold text-green-600">{makingChargeGold.toFixed(3)} g</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Prior Balance:</span>
                                <span className={`font-semibold ${priorBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {priorBalance.toFixed(3)} g
                                </span>
                              </div>
                              <div className="border-t-2 border-yellow-600 pt-2 mt-2">
                                <div className="flex justify-between text-lg">
                                  <span className="font-bold text-gray-900">Total Pure Gold Customer Pays:</span>
                                  <span className="font-bold text-yellow-800 text-xl">{totalPureGold.toFixed(3)} g</span>
                                </div>
                                <p className="text-xs text-yellow-700 mt-1 font-medium">
                                  Customer must pay this amount in pure gold (تیزابی)
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-yellow-400">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Gold Price Used:</span>
                              <span>${goldPricePerGram.toFixed(2)}/gram</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Equivalent USD Value:</span>
                              <span className="font-semibold">${displayUSD.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-gray-500 italic mt-1">
                              (USD display only - All accounting in pure gold grams)
                            </p>
                          </div>
                          
                          {/* Challan Preview */}
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">📋 Gold Withdrawal Challan Preview</h4>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Pure Gold to Issue:</span>
                                <span className="font-semibold text-blue-600">{productPureGold.toFixed(3)} g</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Manufacturer:</span>
                                <span className="font-semibold">{newOrder.manufacturerId ? getManufacturerName(newOrder.manufacturerId) : 'Not Selected'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Product:</span>
                                <span className="font-semibold">{newOrder.productName} ({newOrder.serialNumber})</span>
                              </div>
                            </div>
                            <p className="text-xs text-blue-600 mt-2 italic">
                              Challan will be issued automatically when order status changes to "Challan Issued"
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Manufacturer & Delivery Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <select
                      value={newOrder.manufacturerId}
                      onChange={(e) => setNewOrder({...newOrder, manufacturerId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Manufacturer (Optional)</option>
                      {manufacturers
                        .filter(m => m.isActive !== false)
                        .map(manufacturer => (
                          <option key={manufacturer.id} value={manufacturer.id}>
                            {manufacturer.manufacturerName || manufacturer.name}
                            {manufacturer.goldInTransit > 0 ? ` (Gold In Transit: ${manufacturer.goldInTransit.toFixed(3)}g)` : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={newOrder.expectedDeliveryDate}
                      onChange={(e) => setNewOrder({...newOrder, expectedDeliveryDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Special instructions, design details..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowNewOrderDialog(false);
                      setNewOrder({
                        customerId: '',
                        customerPhone: '',
                        customerName: '',
                        serialNumber: '',
                        productName: '',
                        metal: 'gold',
                        karat: '24k',
                        totalWeight: '',
                        makingChargeRateUSD: '',
                        goldPricePerOunce: '',
                        goldPricePerGram: '',
                        manufacturerId: '',
                        expectedDeliveryDate: '',
                        notes: ''
                      });
                      setProductNameSuggestions([]);
                    }}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewOrder}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ TASK 6.3: Order Receipt Dialog (BRD v2) */}
        {showReceiptDialog && createdOrderData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Order Created Successfully!</h3>
                      <p className="text-green-100 text-sm">Order receipt is ready</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowReceiptDialog(false);
                      setCreatedOrderData(null);
                    }}
                    className="text-white hover:text-green-100 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Order Summary */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Order Number:</span>
                      <p className="font-semibold">{createdOrderData.orderNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Serial No:</span>
                      <p className="font-semibold">{createdOrderData.serialNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer:</span>
                      <p className="font-semibold">{createdOrderData.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Product:</span>
                      <p className="font-semibold">{createdOrderData.productName}</p>
                    </div>
                  </div>
                </div>

                {/* Pure Gold Summary */}
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-3">Pure Gold Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Product Pure Gold:</span>
                      <span className="font-semibold">{createdOrderData.productPureGold?.toFixed(3)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Commission Gold:</span>
                      <span className="font-semibold">{createdOrderData.commissionGold?.toFixed(3)}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Prior Balance:</span>
                      <span className={`font-semibold ${createdOrderData.priorGoldBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {createdOrderData.priorGoldBalance?.toFixed(3)}g
                      </span>
                    </div>
                    <div className="border-t-2 border-yellow-600 pt-2 mt-2">
                      <div className="flex justify-between text-base">
                        <span className="font-bold text-gray-900">Total Pure Gold:</span>
                        <span className="font-bold text-yellow-800">{createdOrderData.totalPureGoldOwed?.toFixed(3)}g</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Reference: ${createdOrderData.displayAmountUSD?.toFixed(2)} (@ ${createdOrderData.goldPriceAtOrder?.toFixed(2)}/g)
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await orderReceiptGenerator.generateReceipt(createdOrderData);
                        alert('Receipt downloaded successfully!');
                      } catch (error) {
                        console.error('Error generating receipt:', error);
                        alert('Error generating receipt. Please try again.');
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Download Receipt
                  </button>
                  <button
                    onClick={() => {
                      setShowReceiptDialog(false);
                      setCreatedOrderData(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Update Dialog */}
        {showBulkUpdateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-orange-600">Bulk Status Update</h3>
                <button
                  onClick={() => setShowBulkUpdateDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Update {selectedOrders.length} selected order{selectedOrders.length !== 1 ? 's' : ''} to:
                  </p>
                  <select
                    value={bulkUpdateStatus}
                    onChange={(e) => setBulkUpdateStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    {ORDER_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Warning:</strong> This action will update all selected orders to the chosen status.
                    Some status changes may trigger additional actions like commission calculations or inventory updates.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkUpdateDialog(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpdateStatus}
                  disabled={!bulkUpdateStatus}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Update Orders
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Entry Dialog */}
        {showPurchaseEntryDialog && purchaseEntryOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-purple-800">Purchase Entry - Order Pickup</h2>
              
              {/* Order Summary */}
              <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3">Order Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Order ID:</span>
                    <span className="ml-2 font-semibold">{purchaseEntryOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <span className="ml-2 font-semibold">{purchaseEntryOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <span className="ml-2 font-semibold">{purchaseEntryOrder.productName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Karat:</span>
                    <span className="ml-2 font-semibold">{purchaseEntryOrder.karat}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ordered Weight:</span>
                    <span className="ml-2 font-semibold">{purchaseEntryOrder.weight}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer Price:</span>
                    <span className="ml-2 font-semibold text-green-600">₹{purchaseEntryOrder.total?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Manufacturer:</span>
                    <span className="ml-2 font-semibold">{getManufacturerName(purchaseEntryOrder.manufacturerId)}</span>
                  </div>
                </div>
              </div>

              {/* Purchase Entry Form */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weight Received */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight Received (grams) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={purchaseEntryData.weightReceived}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, weightReceived: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter weight received"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Actual weight received (may differ slightly due to wastage)
                    </p>
                  </div>

                  {/* Manufacturing Cost */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturing Cost (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseEntryData.manufacturingCost}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, manufacturingCost: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter manufacturing cost"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Amount charged by manufacturer (excluding GST)
                    </p>
                  </div>

                  {/* GST Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseEntryData.gstAmount}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, gstAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter GST amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      GST charged by manufacturer (optional)
                    </p>
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Type *
                    </label>
                    <select
                      value={purchaseEntryData.paymentType}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, paymentType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="cash">Cash Payment</option>
                      <option value="credit">Credit (Pay Later)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      How did you pay the manufacturer?
                    </p>
                  </div>
                </div>

                {/* Credit Days (shown only if payment type is credit) */}
                {purchaseEntryData.paymentType === 'credit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Days
                    </label>
                    <input
                      type="number"
                      value={purchaseEntryData.creditDays}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, creditDays: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Number of days to pay"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Payment due in how many days?
                    </p>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={purchaseEntryData.notes}
                    onChange={(e) => setPurchaseEntryData({...purchaseEntryData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any additional notes about the purchase..."
                  />
                </div>
              </div>

              {/* Commission Calculation Preview */}
              {purchaseEntryData.manufacturingCost && (
                <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3">Commission Calculation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Customer Price:</span>
                      <span className="font-semibold">₹{purchaseEntryOrder.total?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Manufacturing Cost:</span>
                      <span className="font-semibold">₹{parseFloat(purchaseEntryData.manufacturingCost).toFixed(2)}</span>
                    </div>
                    {purchaseEntryData.gstAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">GST Amount:</span>
                        <span className="font-semibold">₹{parseFloat(purchaseEntryData.gstAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-green-300">
                      <span className="text-gray-700 font-semibold">Total Purchase Cost:</span>
                      <span className="font-semibold">
                        ₹{(parseFloat(purchaseEntryData.manufacturingCost) + (parseFloat(purchaseEntryData.gstAmount) || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-green-500">
                      <span className="text-green-900 font-bold text-lg">Commission Earned:</span>
                      <span className="text-green-600 font-bold text-lg">
                        ₹{(purchaseEntryOrder.total - (parseFloat(purchaseEntryData.manufacturingCost) + (parseFloat(purchaseEntryData.gstAmount) || 0))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPurchaseEntryDialog(false);
                    setPurchaseEntryOrder(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchaseEntrySubmit}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  Complete Purchase Entry
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                This will record the purchase, calculate commission, update inventory, and create accounting entries.
              </p>
            </div>
          </div>
        )}

        {/* Delivery & Billing Dialog */}
        {showDeliveryDialog && deliveryOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-blue-800">Delivery & Billing</h2>
              
              {/* Order Summary */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Order Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Order ID:</span>
                    <span className="ml-2 font-semibold">{deliveryOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <span className="ml-2 font-semibold">{deliveryOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <span className="ml-2 font-semibold">{deliveryOrder.productName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Weight:</span>
                    <span className="ml-2 font-semibold">{deliveryOrder.weight}g</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="ml-2 font-bold text-green-600 text-lg">₹{deliveryOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Form */}
              <div className="space-y-4 mb-6">
                {/* Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={deliveryData.deliveryDate}
                    onChange={(e) => setDeliveryData({...deliveryData, deliveryDate: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Date when the product was delivered to customer
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDeliveryData({
                        ...deliveryData, 
                        paymentMethod: 'cash',
                        paidAmount: deliveryOrder.total
                      })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        deliveryData.paymentMethod === 'cash'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <div className="text-center">
                        <DollarSign className={`w-8 h-8 mx-auto mb-2 ${
                          deliveryData.paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <div className="font-semibold">Cash Payment</div>
                        <div className="text-xs text-gray-600 mt-1">Generate Bill</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setDeliveryData({
                        ...deliveryData, 
                        paymentMethod: 'credit',
                        paidAmount: 0
                      })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        deliveryData.paymentMethod === 'credit'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-300 hover:border-orange-300'
                      }`}
                    >
                      <div className="text-center">
                        <Calendar className={`w-8 h-8 mx-auto mb-2 ${
                          deliveryData.paymentMethod === 'credit' ? 'text-orange-600' : 'text-gray-400'
                        }`} />
                        <div className="font-semibold">Credit Sale</div>
                        <div className="text-xs text-gray-600 mt-1">Generate Invoice</div>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Cash: Payment received immediately, bill generated<br />
                    Credit: Payment to be collected later, invoice generated
                  </p>
                </div>

                {/* Amount Paid (for cash) */}
                {deliveryData.paymentMethod === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Paid (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryData.paidAmount}
                      onChange={(e) => setDeliveryData({...deliveryData, paidAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter amount received"
                    />
                    {deliveryData.paidAmount && parseFloat(deliveryData.paidAmount) < deliveryOrder.total && (
                      <p className="text-xs text-orange-600 mt-1">
                        Partial payment: ₹{(deliveryOrder.total - parseFloat(deliveryData.paidAmount)).toFixed(2)} remaining
                      </p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    value={deliveryData.notes}
                    onChange={(e) => setDeliveryData({...deliveryData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any notes about the delivery..."
                  />
                </div>
              </div>

              {/* Summary */}
              <div className={`p-4 rounded-lg mb-6 border ${
                deliveryData.paymentMethod === 'cash' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <h3 className={`font-semibold mb-3 ${
                  deliveryData.paymentMethod === 'cash' ? 'text-green-900' : 'text-orange-900'
                }`}>
                  {deliveryData.paymentMethod === 'cash' ? 'Cash Bill Summary' : 'Credit Invoice Summary'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold">₹{deliveryOrder.total?.toFixed(2)}</span>
                  </div>
                  {deliveryData.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between">
                        <span>Amount Paid:</span>
                        <span className="font-semibold">₹{(parseFloat(deliveryData.paidAmount) || 0).toFixed(2)}</span>
                      </div>
                      {parseFloat(deliveryData.paidAmount) < deliveryOrder.total && (
                        <div className="flex justify-between text-orange-600">
                          <span className="font-semibold">Balance Due:</span>
                          <span className="font-semibold">
                            ₹{(deliveryOrder.total - (parseFloat(deliveryData.paidAmount) || 0)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {deliveryData.paymentMethod === 'credit' && (
                    <div className="flex justify-between text-orange-600">
                      <span className="font-semibold">Amount Due:</span>
                      <span className="font-semibold">₹{deliveryOrder.total?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <span className="text-xs">
                      {deliveryData.paymentMethod === 'cash' 
                        ? '✓ Cash bill will be generated and accounting entries created' 
                        : '✓ Credit invoice will be generated with 30 days payment term'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeliveryDialog(false);
                    setDeliveryOrder(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeliverySubmit}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold ${
                    deliveryData.paymentMethod === 'cash'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {deliveryData.paymentMethod === 'cash' ? 'Complete & Generate Bill' : 'Complete & Generate Invoice'}
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                This will update order status, generate {deliveryData.paymentMethod === 'cash' ? 'bill' : 'invoice'}, and create accounting entries.
              </p>
            </div>
          </div>
        )}

        {/* ✅ TASK 7.1: Challan Success Dialog */}
        {showChallanDialog && challanOrderData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-4 text-yellow-800">
                ✓ Gold Withdrawal Challan Issued
              </h2>

              {/* Challan Details */}
              <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-3">Challan Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Challan Number:</span>
                    <span className="font-bold text-yellow-800">{challanOrderData.challanNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Order ID:</span>
                    <span className="font-semibold">{challanOrderData.id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Manufacturer:</span>
                    <span className="font-semibold">
                      {challanOrderData.manufacturerData?.manufacturerName || challanOrderData.manufacturerData?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Customer:</span>
                    <span className="font-semibold">{challanOrderData.customerName}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-yellow-300">
                    <span className="text-gray-700 font-semibold">Pure Gold (24k):</span>
                    <span className="font-bold text-yellow-800 text-lg">
                      {challanOrderData.pureGoldAmount?.toFixed(3)}g
                    </span>
                  </div>
                  <div className="pt-2 border-t border-yellow-200">
                    <span className="text-xs text-gray-600">
                      Product: {challanOrderData.weight}g {challanOrderData.karat} {challanOrderData.productName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accounting Entry Summary */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Accounting Entry Created</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">✓ Debit: Gold in Transit (1102)</span>
                    <span className="font-semibold">{challanOrderData.pureGoldAmount?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">✓ Credit: Gold Bank Sharaf (1101)</span>
                    <span className="font-semibold">{challanOrderData.pureGoldAmount?.toFixed(3)}g</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-xs text-gray-600">
                      ℹ️ Gold has been transferred from Sharaf bank to manufacturer's custody
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Next Steps:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Manufacturer will present challan to Gold Bank (Sharaf)</li>
                  <li>• Sharaf will verify and release {challanOrderData.pureGoldAmount?.toFixed(3)}g pure gold</li>
                  <li>• Manufacturer will produce the ordered jewelry</li>
                  <li>• Order status updated to "Challan Issued"</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChallanDialog(false);
                    setChallanOrderData(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    challanGenerator.downloadChallan(
                      {
                        challanNumber: challanOrderData.challanNumber,
                        challanId: challanOrderData.challanId,
                        date: new Date(),
                        orderId: challanOrderData.id,
                        pureGoldAmount: challanOrderData.pureGoldAmount,
                        purpose: `Production of ${challanOrderData.weight}g ${challanOrderData.karat} ${challanOrderData.productName} for Order ${challanOrderData.id?.slice(-8)}`
                      },
                      challanOrderData,
                      challanOrderData.manufacturerData,
                      challanOrderData.customerData
                    );
                  }}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Download Challan PDF
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Challan document contains authorization for gold withdrawal from Sharaf
              </p>
            </div>
          </div>
        )}

        {/* ✅ TASK 9.1: Invoice Success Dialog */}
        {showInvoiceDialog && invoiceOrderData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-4 text-blue-800">
                ✓ Customer Invoice Generated
              </h2>

              {/* Invoice Details */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Invoice Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Invoice Number:</span>
                    <span className="font-bold text-blue-800">{invoiceOrderData.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Order ID:</span>
                    <span className="font-semibold">{invoiceOrderData.id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Customer:</span>
                    <span className="font-semibold">{invoiceOrderData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Product:</span>
                    <span className="font-semibold">
                      {invoiceOrderData.weight}g {invoiceOrderData.karat} {invoiceOrderData.productName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pure Gold Breakdown */}
              <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-3">Pure Gold Calculation (تیزابی)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Product Pure Gold:</span>
                    <span className="font-semibold">{invoiceOrderData.productPureGold?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Commission:</span>
                    <span className="font-semibold">{invoiceOrderData.commissionGold?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Prior Balance:</span>
                    <span className={`font-semibold ${
                      invoiceOrderData.priorBalance >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {invoiceOrderData.priorBalance >= 0 ? '+' : ''}{invoiceOrderData.priorBalance?.toFixed(3)}g
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-yellow-300">
                    <span className="text-gray-900 font-bold text-base">Total Pure Gold Owed:</span>
                    <span className="font-bold text-yellow-800 text-lg">
                      {invoiceOrderData.totalPureGold?.toFixed(3)}g
                    </span>
                  </div>
                  <div className="pt-2 border-t border-yellow-200">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Reference (@ ${invoiceOrderData.goldPrice}/g):</span>
                      <span>${(invoiceOrderData.totalPureGold * invoiceOrderData.goldPrice).toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accounting Entry Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Accounting Entry Created</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">✓ Debit: Customer Receivable (1301)</span>
                    <span className="font-semibold">{invoiceOrderData.totalPureGold?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">✓ Credit: Finished Goods Inventory (1103)</span>
                    <span className="font-semibold">{invoiceOrderData.productPureGold?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">✓ Credit: Commission Income (4101)</span>
                    <span className="font-semibold">{invoiceOrderData.commissionGold?.toFixed(3)}g</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-600">
                      ℹ️ Invoice recorded, customer balance updated
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Customer owes {invoiceOrderData.totalPureGold?.toFixed(3)}g pure gold</li>
                  <li>• Payment can be made in physical gold or cash (converted at current price)</li>
                  <li>• Due in 15 days from invoice date</li>
                  <li>• Order status updated to "Customer Billed"</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowInvoiceDialog(false);
                    setInvoiceOrderData(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    invoiceGenerator.downloadInvoice(
                      {
                        invoiceNumber: invoiceOrderData.invoiceNumber,
                        invoiceId: invoiceOrderData.invoiceId,
                        invoiceType: 'customer_bill',
                        invoiceDate: new Date(),
                        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                        creditDays: 15,
                        productPureGold: invoiceOrderData.productPureGold,
                        commissionGold: invoiceOrderData.commissionGold,
                        priorBalance: invoiceOrderData.priorBalance,
                        totalPureGold: invoiceOrderData.totalPureGold,
                        paidPureGold: 0,
                        remainingPureGold: invoiceOrderData.totalPureGold,
                        paymentStatus: 'not_paid'
                      },
                      invoiceOrderData,
                      invoiceOrderData.customerData,
                      invoiceOrderData.goldPrice
                    );
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Download Invoice PDF
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Invoice document shows pure gold calculation with USD reference
              </p>
            </div>
          </div>
        )}

        {/* ✅ TASK 10.1: Payment Recording Dialog */}
        {showPaymentDialog && paymentInvoiceData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-green-800">
                Record Customer Payment
              </h2>

              {/* Invoice Summary */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Invoice Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Invoice Number:</span>
                    <span className="font-bold">{paymentInvoiceData.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Customer:</span>
                    <span className="font-semibold">{paymentInvoiceData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total Gold Owed:</span>
                    <span className="font-semibold">{paymentInvoiceData.totalPureGold?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Already Paid:</span>
                    <span className="font-semibold text-green-600">{paymentInvoiceData.paidPureGold?.toFixed(3)}g</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="text-gray-900 font-bold">Remaining Balance:</span>
                    <span className="font-bold text-red-600 text-lg">
                      {paymentInvoiceData.remainingPureGold?.toFixed(3)}g
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 pt-2">
                    Reference: ${(paymentInvoiceData.remainingPureGold * 145.43).toFixed(2)} USD @ $145.43/g
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentData.paymentMethod === 'pure_gold'}
                      onChange={() => setPaymentData({...paymentData, paymentMethod: 'pure_gold'})}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium">Pure Gold Only (Physical Gold)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentData.paymentMethod === 'usd_cash'}
                      onChange={() => setPaymentData({...paymentData, paymentMethod: 'usd_cash'})}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium">USD Cash Only (Auto-converted)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentData.paymentMethod === 'mixed'}
                      onChange={() => setPaymentData({...paymentData, paymentMethod: 'mixed'})}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium">Mixed (Gold + USD)</span>
                  </label>
                </div>
              </div>

              {/* Payment Amount Entry */}
              <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                <h3 className="font-semibold text-yellow-900 mb-3">Payment Amount</h3>
                <div className="space-y-4">
                  {/* Pure Gold Input */}
                  {(paymentData.paymentMethod === 'pure_gold' || paymentData.paymentMethod === 'mixed') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gold Received (grams) *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={paymentData.goldPaid}
                        onChange={(e) => setPaymentData({...paymentData, goldPaid: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., 328.438"
                      />
                    </div>
                  )}

                  {/* USD Input */}
                  {(paymentData.paymentMethod === 'usd_cash' || paymentData.paymentMethod === 'mixed') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        USD Cash Received *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentData.usdPaid}
                        onChange={(e) => setPaymentData({...paymentData, usdPaid: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., 1000.00"
                      />
                      
                      {/* Conversion Preview */}
                      {paymentData.usdPaid && (
                        <div className="mt-2 p-3 bg-white rounded border border-yellow-300">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">USD to Gold Conversion:</span>
                            <span className="font-semibold text-yellow-800">
                              {(parseFloat(paymentData.usdPaid) / (paymentData.useMarketPrice ? 145.43 : parseFloat(paymentData.adjustedPrice) || 145.43)).toFixed(3)}g
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                            <span>@ ${paymentData.useMarketPrice ? '145.43' : paymentData.adjustedPrice || '145.43'}/g</span>
                            <label className="flex items-center space-x-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!paymentData.useMarketPrice}
                                onChange={(e) => setPaymentData({...paymentData, useMarketPrice: !e.target.checked})}
                                className="w-3 h-3"
                              />
                              <span>Adjust Price</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Price Adjustment */}
                      {!paymentData.useMarketPrice && (
                        <div className="mt-3 space-y-2">
                          <input
                            type="number"
                            step="0.01"
                            value={paymentData.adjustedPrice}
                            onChange={(e) => setPaymentData({...paymentData, adjustedPrice: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Adjusted price (USD/gram)"
                          />
                          <input
                            type="text"
                            value={paymentData.adjustmentReason}
                            onChange={(e) => setPaymentData({...paymentData, adjustmentReason: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Reason for adjustment"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total Payment Preview */}
                  {(() => {
                    const goldPrice = paymentData.useMarketPrice ? 145.43 : parseFloat(paymentData.adjustedPrice) || 145.43;
                    const goldPortion = parseFloat(paymentData.goldPaid) || 0;
                    const usdPortion = parseFloat(paymentData.usdPaid) || 0;
                    const usdEquivalent = usdPortion / goldPrice;
                    const totalGold = goldPortion + usdEquivalent;
                    
                    if (totalGold > 0) {
                      return (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-300">
                          <h4 className="font-semibold text-green-900 mb-2">Payment Summary</h4>
                          {goldPortion > 0 && (
                            <div className="text-sm mb-1">
                              <span className="text-gray-700">Gold: </span>
                              <span className="font-semibold">{goldPortion.toFixed(3)}g</span>
                            </div>
                          )}
                          {usdPortion > 0 && (
                            <div className="text-sm mb-1">
                              <span className="text-gray-700">USD: </span>
                              <span className="font-semibold">${usdPortion.toFixed(2)} ({usdEquivalent.toFixed(3)}g)</span>
                            </div>
                          )}
                          <div className="pt-2 mt-2 border-t border-green-300">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-green-900">Total Payment:</span>
                              <span className="font-bold text-green-800 text-lg">{totalGold.toFixed(3)}g</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                              <span className="text-gray-700">New Balance:</span>
                              <span className={`font-semibold ${(paymentInvoiceData.remainingPureGold - totalGold) <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                {(paymentInvoiceData.remainingPureGold - totalGold).toFixed(3)}g
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setPaymentInvoiceData(null);
                    setPaymentData({
                      paymentMethod: 'pure_gold',
                      goldPaid: '',
                      usdPaid: '',
                      useMarketPrice: true,
                      adjustedPrice: '',
                      adjustmentReason: '',
                      notes: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                USD payments are auto-converted to pure gold equivalent. All balances tracked in gold grams.
              </p>
            </div>
          </div>
        )}

        {/* Payment Success Dialog - TASK 10.2 */}
        {showPaymentSuccessDialog && paymentSuccessData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-green-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Payment Recorded Successfully</h3>
                    <p className="text-green-100 text-sm">Receipt #{paymentSuccessData.paymentNumber}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Payment Summary */}
                <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-3">Payment Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Customer</p>
                      <p className="font-semibold">{paymentSuccessData.customerData?.customerName || paymentSuccessData.customerData?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Invoice Reference</p>
                      <p className="font-semibold">{paymentSuccessData.invoiceData.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Amount Paid</p>
                      <p className="font-bold text-green-700">{paymentSuccessData.amountPaid.toFixed(3)}g pure gold</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Method</p>
                      <p className="font-semibold">
                        {paymentSuccessData.paymentData.paymentMode === 'pure_gold' && 'Pure Gold'}
                        {paymentSuccessData.paymentData.paymentMode === 'usd_cash' && 'USD Cash'}
                        {paymentSuccessData.paymentData.paymentMode === 'mixed' && 'Mixed (Gold + USD)'}
                      </p>
                    </div>
                    
                    {/* Show payment breakdown for USD/mixed */}
                    {(paymentSuccessData.paymentData.paymentMode === 'usd_cash' || paymentSuccessData.paymentData.paymentMode === 'mixed') && (
                      <>
                        {paymentSuccessData.paymentData.goldPortion > 0 && (
                          <div>
                            <p className="text-gray-600">Gold Portion</p>
                            <p className="font-semibold">{paymentSuccessData.paymentData.goldPortion.toFixed(3)}g</p>
                          </div>
                        )}
                        {paymentSuccessData.paymentData.usdPortion > 0 && (
                          <div>
                            <p className="text-gray-600">USD Portion</p>
                            <p className="font-semibold">
                              ${paymentSuccessData.paymentData.usdPortion.toFixed(2)} = {paymentSuccessData.paymentData.usdEquivalentGold.toFixed(3)}g
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* New Balance */}
                  <div className="mt-4 pt-4 border-t border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">New Balance:</span>
                      <span className={`font-bold text-lg ${paymentSuccessData.newBalance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {paymentSuccessData.newBalance.toFixed(3)}g
                      </span>
                    </div>
                    {paymentSuccessData.isFullPayment && (
                      <div className="mt-2 text-center">
                        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ✅ Invoice Fully Paid
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accounting Summary */}
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Accounting Summary (Auto-Recorded)</h4>
                  <div className="text-sm space-y-2">
                    {paymentSuccessData.paymentData.goldPortion > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Gold Bank (Sharaf) - Debit</span>
                        <span className="font-semibold">{paymentSuccessData.paymentData.goldPortion.toFixed(3)}g</span>
                      </div>
                    )}
                    {paymentSuccessData.paymentData.usdPortion > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Cash in Hand - Debit</span>
                        <span className="font-semibold">${paymentSuccessData.paymentData.usdPortion.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="text-gray-700">Customer Receivable - Credit</span>
                      <span className="font-semibold">{paymentSuccessData.amountPaid.toFixed(3)}g</span>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-2">Next Steps</h4>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Download payment receipt for customer records</li>
                    {!paymentSuccessData.isFullPayment && (
                      <li>Customer still owes {paymentSuccessData.newBalance.toFixed(3)}g pure gold</li>
                    )}
                    <li>Physical gold deposited to Sharaf Gold Bank</li>
                    {paymentSuccessData.isFullPayment && (
                      <li>Order status updated to "Payment Received"</li>
                    )}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPaymentSuccessDialog(false);
                      setPaymentSuccessData(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const receiptGenerator = new paymentReceiptGenerator();
                      receiptGenerator.downloadReceipt(
                        paymentSuccessData.paymentData,
                        paymentSuccessData.invoiceData,
                        paymentSuccessData.customerData,
                        paymentSuccessData.isFullPayment
                      );
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download Receipt
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Payment receipt shows bilingual details (English/Dari) with pure gold breakdown
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ TASK 7.2 & 7.3: Additional Challan / Gold Return Dialog */}
        {showAdditionalChallanDialog && additionalChallanData.order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
              {/* Header */}
              <div className={`${additionalChallanData.challanType === 'additional_gold' ? 'bg-orange-600' : 'bg-purple-600'} text-white p-6 rounded-t-lg`}>
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    {additionalChallanData.challanType === 'additional_gold' ? (
                      <Plus className="w-8 h-8" />
                    ) : (
                      <TrendingUp className="w-8 h-8 transform rotate-180" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {additionalChallanData.challanType === 'additional_gold' 
                        ? 'Issue Additional Gold Challan'
                        : 'Record Gold Return Receipt'}
                    </h3>
                    <p className={`${additionalChallanData.challanType === 'additional_gold' ? 'text-orange-100' : 'text-purple-100'} text-sm`}>
                      Order #{additionalChallanData.order.id.slice(-8)} - {additionalChallanData.order.manufacturerName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Info Card */}
                <div className={`mb-6 ${additionalChallanData.challanType === 'additional_gold' ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'} p-4 rounded-lg border`}>
                  <h4 className={`font-semibold ${additionalChallanData.challanType === 'additional_gold' ? 'text-orange-900' : 'text-purple-900'} mb-2`}>
                    {additionalChallanData.challanType === 'additional_gold' 
                      ? 'Additional Gold Required'
                      : 'Excess Gold Being Returned'}
                  </h4>
                  <p className={`text-sm ${additionalChallanData.challanType === 'additional_gold' ? 'text-orange-800' : 'text-purple-800'}`}>
                    {additionalChallanData.challanType === 'additional_gold'
                      ? 'Issue a new challan when manufacturer needs additional gold for production. This will debit Gold in Transit (1102) and credit Gold Bank Sharaf (1101).'
                      : 'Record when manufacturer returns excess gold. This will debit Gold Bank Sharaf (1101) and credit Gold in Transit (1102).'}
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Gold Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pure Gold Amount (24k grams) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={additionalChallanData.goldAmount}
                      onChange={(e) => setAdditionalChallanData({ 
                        ...additionalChallanData, 
                        goldAmount: e.target.value 
                      })}
                      placeholder="Enter gold amount in grams"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>
                    <input
                      type="text"
                      value={additionalChallanData.reason}
                      onChange={(e) => setAdditionalChallanData({ 
                        ...additionalChallanData, 
                        reason: e.target.value 
                      })}
                      placeholder="Enter reason"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={additionalChallanData.notes}
                      onChange={(e) => setAdditionalChallanData({ 
                        ...additionalChallanData, 
                        notes: e.target.value 
                      })}
                      placeholder="Add any additional notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Accounting Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h5 className="font-semibold text-gray-900 mb-2">Accounting Impact</h5>
                    {additionalChallanData.challanType === 'additional_gold' ? (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-red-600">Debit: Gold in Transit (1102)</span>
                          <span className="font-medium">{additionalChallanData.goldAmount || '0.000'}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Credit: Gold Bank Sharaf (1101)</span>
                          <span className="font-medium">{additionalChallanData.goldAmount || '0.000'}g</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-red-600">Debit: Gold Bank Sharaf (1101)</span>
                          <span className="font-medium">{additionalChallanData.goldAmount || '0.000'}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Credit: Gold in Transit (1102)</span>
                          <span className="font-medium">{additionalChallanData.goldAmount || '0.000'}g</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowAdditionalChallanDialog(false);
                      setAdditionalChallanData({
                        order: null,
                        challanType: 'additional_gold',
                        goldAmount: '',
                        reason: '',
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processAdditionalChallan}
                    className={`px-4 py-2 text-white rounded-lg ${
                      additionalChallanData.challanType === 'additional_gold'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-purple-600 hover:bg-purple-700'
                    } flex items-center gap-2`}
                  >
                    {additionalChallanData.challanType === 'additional_gold' ? (
                      <>
                        <Plus className="w-4 h-4" />
                        Issue Additional Challan
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 transform rotate-180" />
                        Record Gold Return
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ TASK 6.4: Status Change Confirmation Dialog */}
        {showStatusChangeDialog && statusChangeData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              {/* Header */}
              <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Confirm Status Change</h3>
                    <p className="text-blue-100 text-sm">
                      Order #{statusChangeData.order.id.slice(-8)} - {statusChangeData.order.customerName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Status Transition */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Status Transition</h4>
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <span className={`inline-block px-3 py-2 text-sm font-medium rounded-lg ${ORDER_STATUS_FLOW[statusChangeData.currentStatus]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {ORDER_STATUS_FLOW[statusChangeData.currentStatus]?.label}
                      </span>
                      <p className="text-xs text-gray-600 mt-2">Current Status</p>
                    </div>
                    
                    <div className="text-3xl text-blue-600">→</div>
                    
                    <div className="text-center">
                      <span className={`inline-block px-3 py-2 text-sm font-medium rounded-lg ${statusChangeData.statusConfig?.color || 'bg-gray-100 text-gray-800'}`}>
                        {statusChangeData.statusConfig?.label}
                      </span>
                      <p className="text-xs text-gray-600 mt-2">New Status</p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="mb-6 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-2">Description</h5>
                    <p className="text-sm text-blue-800">
                      {statusChangeData.statusConfig?.description}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h5 className="font-semibold text-yellow-900 mb-2">Accounting Impact</h5>
                    <p className="text-sm text-yellow-800">
                      {statusChangeData.statusConfig?.accountingImpact}
                    </p>
                  </div>

                  {statusChangeData.statusConfig?.allowedActions?.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h5 className="font-semibold text-green-900 mb-2">Available Actions After Status Change</h5>
                      <ul className="text-sm text-green-800 list-disc list-inside">
                        {statusChangeData.statusConfig.allowedActions.map(action => (
                          <li key={action}>
                            {action === 'issueChallan' && 'Issue Gold Withdrawal Challan'}
                            {action === 'generateInvoice' && 'Generate Customer Invoice'}
                            {action === 'recordPayment' && 'Record Customer Payment'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Notes Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={statusChangeNotes}
                    onChange={(e) => setStatusChangeNotes(e.target.value)}
                    placeholder="Add any notes about this status change..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowStatusChangeDialog(false);
                      setStatusChangeData(null);
                      setStatusChangeNotes('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStatusChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Confirm Status Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment History Dialog - TASK 10.3 */}
        {showPaymentHistoryDialog && paymentHistoryData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-purple-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Payment History</h3>
                      <p className="text-purple-100 text-sm">
                        Invoice #{paymentHistoryData.invoice.invoiceNumber} - {paymentHistoryData.customer?.customerName || paymentHistoryData.customer?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentHistoryDialog(false);
                      setPaymentHistoryData(null);
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Invoice Summary */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Invoice Summary</h4>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-bold text-lg text-gray-900">
                        {paymentHistoryData.invoice.totalPureGold?.toFixed(3) || '0.000'}g
                      </p>
                      <p className="text-xs text-gray-500">
                        ${((paymentHistoryData.invoice.totalPureGold || 0) * 145.43).toFixed(2)} USD ref
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Paid</p>
                      <p className="font-bold text-lg text-green-600">
                        {paymentHistoryData.invoice.paidPureGold?.toFixed(3) || '0.000'}g
                      </p>
                      <p className="text-xs text-gray-500">
                        ${((paymentHistoryData.invoice.paidPureGold || 0) * 145.43).toFixed(2)} USD ref
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Remaining</p>
                      <p className={`font-bold text-lg ${(paymentHistoryData.invoice.remainingPureGold || 0) <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {paymentHistoryData.invoice.remainingPureGold?.toFixed(3) || '0.000'}g
                      </p>
                      <p className="text-xs text-gray-500">
                        ${((paymentHistoryData.invoice.remainingPureGold || 0) * 145.43).toFixed(2)} USD ref
                      </p>
                    </div>
                  </div>

                  {/* Payment Status Badge */}
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        paymentHistoryData.invoice.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        paymentHistoryData.invoice.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {paymentHistoryData.invoice.paymentStatus === 'paid' ? '✅ Fully Paid' :
                         paymentHistoryData.invoice.paymentStatus === 'partially_paid' ? '⚠️ Partially Paid' :
                         '❌ Not Paid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Timeline */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>Payment Timeline</span>
                    <span className="text-sm font-normal text-gray-500">
                      ({paymentHistoryData.payments.length} payment{paymentHistoryData.payments.length !== 1 ? 's' : ''})
                    </span>
                  </h4>

                  {paymentHistoryData.payments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No payments recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentHistoryData.payments.map((payment, index) => {
                        const paymentDate = payment.paymentDate?.toDate ? 
                          payment.paymentDate.toDate() : 
                          new Date();
                        
                        return (
                          <div key={payment.id} className="relative">
                            {/* Timeline connector */}
                            {index < paymentHistoryData.payments.length - 1 && (
                              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-300"></div>
                            )}
                            
                            <div className="flex gap-4">
                              {/* Timeline dot */}
                              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                                payment.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                <DollarSign className={`w-6 h-6 ${
                                  payment.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                                }`} />
                              </div>

                              {/* Payment card */}
                              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-semibold text-gray-900">{payment.paymentNumber}</p>
                                    <p className="text-xs text-gray-500">
                                      {paymentDate.toLocaleDateString()} at {paymentDate.toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {payment.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-600">Amount Paid</p>
                                    <p className="font-bold text-green-700">
                                      {payment.pureGoldPaid?.toFixed(3) || '0.000'}g
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      ${((payment.pureGoldPaid || 0) * (payment.goldPriceAtPayment || 145.43)).toFixed(2)} @ ${(payment.goldPriceAtPayment || 145.43).toFixed(2)}/g
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-gray-600">Payment Method</p>
                                    <p className="font-semibold text-gray-900">
                                      {payment.paymentMode === 'pure_gold' && '💰 Pure Gold'}
                                      {payment.paymentMode === 'usd_cash' && '💵 USD Cash'}
                                      {payment.paymentMode === 'mixed' && '🔀 Mixed Payment'}
                                      {!payment.paymentMode && '💰 Gold'}
                                    </p>
                                    {payment.paymentMode === 'usd_cash' && (
                                      <p className="text-xs text-gray-500">
                                        ${payment.usdPortion?.toFixed(2) || '0.00'} converted
                                      </p>
                                    )}
                                    {payment.paymentMode === 'mixed' && (
                                      <p className="text-xs text-gray-500">
                                        {payment.goldPortion?.toFixed(3)}g + ${payment.usdPortion?.toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Balance after payment */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Balance After Payment:</span>
                                    <span className={`font-semibold ${payment.newBalance <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                      {payment.newBalance?.toFixed(3) || '0.000'}g
                                    </span>
                                  </div>
                                </div>

                                {/* Notes */}
                                {payment.notes && payment.notes.trim() && (
                                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    <span className="font-semibold">Notes:</span> {payment.notes}
                                  </div>
                                )}

                                {/* Sharaf deposit info */}
                                {payment.depositedToSharaf && (
                                  <div className="mt-2 text-xs bg-blue-50 text-blue-800 p-2 rounded flex items-center gap-1">
                                    <span>🏦</span>
                                    <span>Deposited to Sharaf Gold Bank</span>
                                    {payment.sharafReceiptNumber && (
                                      <span className="font-semibold ml-1">- Receipt #{payment.sharafReceiptNumber}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPaymentHistoryDialog(false);
                      setPaymentHistoryData(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {paymentHistoryData.invoice.remainingPureGold > 0 && (
                    <button
                      onClick={async () => {
                        // Close history dialog and open payment dialog
                        setShowPaymentHistoryDialog(false);
                        
                        // Prepare payment invoice data
                        setPaymentInvoiceData({
                          ...paymentHistoryData.order,
                          invoiceId: paymentHistoryData.invoice.id,
                          invoiceNumber: paymentHistoryData.invoice.invoiceNumber,
                          totalPureGold: paymentHistoryData.invoice.totalPureGold,
                          paidPureGold: paymentHistoryData.invoice.paidPureGold || 0,
                          remainingPureGold: paymentHistoryData.invoice.remainingPureGold,
                          customerData: paymentHistoryData.customer
                        });
                        setShowPaymentDialog(true);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Record New Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


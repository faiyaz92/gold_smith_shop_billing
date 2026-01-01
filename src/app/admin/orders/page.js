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
import { createJournalEntry, getAccountsOnce, deleteJournalEntriesByReference, isParentAccount } from '@/utils/accountingEngineUtils';
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
// NOTE: Simple status list - no restrictions, user can change to any status
const ORDER_STATUS_FLOW = {
  'New': {
    label: 'New',
    color: 'bg-gray-100 text-gray-800',
    description: 'Order created'
  },
  'Confirmed': {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800',
    description: 'Order confirmed'
  },
  'Challan Issued': {
    label: 'Challan Issued',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Gold challan issued to manufacturer'
  },
  'In Production': {
    label: 'In Production',
    color: 'bg-orange-100 text-orange-800',
    description: 'Manufacturer working on the order'
  },
  'Ready for Pickup': {
    label: 'Ready for Pickup',
    color: 'bg-purple-100 text-purple-800',
    description: 'Product ready for customer pickup'
  },
  'Picked Up': {
    label: 'Picked Up',
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Customer picked up the product'
  },
  'Delivered': {
    label: 'Delivered',
    color: 'bg-teal-100 text-teal-800',
    description: 'Product delivered to customer'
  },
  'Completed': {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    description: 'Order fully completed'
  },
  'Cancelled': {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    description: 'Order cancelled'
  },
  'Returned': {
    label: 'Returned',
    color: 'bg-pink-100 text-pink-800',
    description: 'Product returned'
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
  // ✅ NEW: Challan Issue Popup State (for Challan Issued status)
  const [showChallanIssuePopup, setShowChallanIssuePopup] = useState(false);
  const [challanIssueData, setChallanIssueData] = useState({
    order: null,
    manufacturerId: '',
    goldBankId: '',
    targetStatus: ''
  });
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
  const [goldBanks, setGoldBanks] = useState([]); // \u2705 NEW: Gold bank (sharaf) accounts
  
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
    goldBankId: '', // \u2705 NEW: Gold bank (sharaf) sub-account selection
    generateChallan: false, // \u2705 NEW: Generate challan checkbox
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
      
      // \u2705 Fetch gold bank accounts (sub-accounts of 1101)
      const accountsPath = `${basePath}/accounts`;
      const goldBanksQuery = query(
        collection(db, accountsPath),
        where('parentAccount', '==', '1101')
      );
      const goldBanksUnsubscribe = onSnapshot(goldBanksQuery, (snapshot) => {
        const goldBanksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(account => account.parentAccount !== null); // Filter out parent accounts (only include child accounts)
        setGoldBanks(goldBanksData);
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
        goldBanksUnsubscribe();
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

  // ✅ NEW: Handle status change from dropdown
  // ✅ Status change with validation and challan handling
  const handleStatusChangeFromDropdown = async (order, newStatus) => {
    if (newStatus === order.status) return;

    // 🚫 BLOCK: Cannot go back from Challan Issued to New or Confirmed
    if (order.status === 'Challan Issued' && (newStatus === 'New' || newStatus === 'Confirmed')) {
      alert(`❌ Cannot change status back from "Challan Issued" to "${newStatus}".\n\nThis would require reversing accounting entries:\n• Gold in Transit account would be credited\n• Gold Bank account would be debited\n\nPlease contact administrator for manual reversal.`);
      return;
    }

    // 🚫 BLOCK: From New or Confirmed, cannot jump to statuses after Challan Issued
    // Users must go through Challan Issued process first
    const statusesAfterChallan = ['In Production', 'Ready for Pickup', 'Picked Up', 'Delivered', 'Completed'];
    if ((order.status === 'New' || order.status === 'Confirmed') && statusesAfterChallan.includes(newStatus)) {
      alert(`❌ Cannot change status from "${order.status}" to "${newStatus}".\n\nYou must first issue a challan by changing to "Challan Issued" status.\n\nThis ensures proper gold movement tracking and accounting.`);
      return;
    }

    // ✅ SPECIAL: Changing to Challan Issued requires challan creation
    if (newStatus === 'Challan Issued') {
      setChallanIssueData({
        order: order,
        manufacturerId: order.manufacturerId || '',
        goldBankId: order.goldBankId || '',
        targetStatus: 'Challan Issued'
      });
      setShowChallanIssuePopup(true);
      return;
    }

    // ✅ NORMAL: Direct status change for other statuses
    try {
      const orderRef = doc(db, ordersPath, order.id);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      console.log(`Order ${order.id} status changed from ${order.status} to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please try again.');
    }
  };

  // ✅ Handle challan issue for Challan Issued status
  const handleConfirmChallanIssue = async () => {
    try {
      const { order, manufacturerId, goldBankId, targetStatus } = challanIssueData;

      if (!order) {
        alert('Order data is missing. Please try again.');
        return;
      }

      if (!manufacturerId) {
        alert('Please select a manufacturer');
        return;
      }
      if (!goldBankId) {
        alert('Please select a gold bank (Sharaf)');
        return;
      }

      // Generate challan number
      const challanNumber = `CH-${Date.now().toString().slice(-6)}`;

      // ✅ Get accounts for proper journal entry creation
      const allAccounts = await getAccountsOnce(companyId);
      
      // ✅ Find or create manufacturer sub-account under Gold in Transit (1102)
      let manufacturerSubAccount = allAccounts.find(acc => 
        acc.parentAccount === '1102' && acc.manufacturerId === manufacturerId
      );
      
      if (!manufacturerSubAccount) {
        // Create sub-account for this manufacturer under 1102
        const manufacturerData = manufacturers.find(m => m.id === manufacturerId);
        const subAccountCode = `1102-MFG-${manufacturerId}`;
        const subAccountName = `Gold Custody for ${manufacturerData?.manufacturerName || manufacturerData?.name}`;
        
        const newAccount = {
          accountCode: subAccountCode,
          name: subAccountName,
          type: 'asset',
          parentAccount: '1102',  // Parent: Gold in Transit
          manufacturerId: manufacturerId,
          balanceGold: 0,
          balanceUSD: 0,
          isActive: true,
          createdAt: serverTimestamp()
        };
        
        const accountRef = await addDoc(collection(db, `${basePath}/accounts`), newAccount);
        manufacturerSubAccount = { id: accountRef.id, ...newAccount };
        console.log('Created manufacturer sub-account for challan:', subAccountCode);
      }
      
      // ✅ Find the account for the selected gold bank
      const goldBankAccount = allAccounts.find(acc => acc.id === goldBankId);
      
      if (!goldBankAccount) {
        throw new Error('Selected gold bank account not found. Please ensure the gold bank is properly configured.');
      }

      // Create challan document
      const challanData = {
        challanNumber,
        orderId: order.id,
        manufacturerId,
        goldBankId,
        manufacturerAccountId: manufacturerSubAccount.id,
        manufacturerAccountCode: manufacturerSubAccount.accountCode || manufacturerSubAccount.code,
        goldBankAccountId: goldBankAccount.id,
        goldBankAccountCode: goldBankAccount.accountCode || goldBankAccount.code,
        pureGoldAmount: order.productPureGold,
        status: 'issued',
        issuedAt: serverTimestamp(),
        accountingRecorded: true,
        companyId: companyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const challanRef = await addDoc(collection(db, `${basePath}/challans`), challanData);

      // Create accounting entries as per BRD
      // Debit: Manufacturer Sub-Account (1102-MFG-XXX), Credit: Gold Bank Sub-Account (1101-BANK-XXX)
      const journalEntryData = {
        date: new Date().toISOString().split('T')[0],
        description: `Gold Challan ${challanNumber} issued to ${manufacturers.find(m => m.id === manufacturerId)?.manufacturerName || 'Manufacturer'}`,
        referenceType: 'challan',
        referenceId: challanRef.id,
        entries: [
          {
            accountId: manufacturerSubAccount.id,
            accountCode: manufacturerSubAccount.accountCode || manufacturerSubAccount.code,
            accountName: manufacturerSubAccount.name,
            debit: order.productPureGold,
            credit: 0
          },
          {
            accountId: goldBankAccount.id,
            accountCode: goldBankAccount.accountCode || goldBankAccount.code,
            accountName: goldBankAccount.name,
            debit: 0,
            credit: order.productPureGold
          }
        ],
        totalDebit: order.productPureGold,
        totalCredit: order.productPureGold,
        isBalanced: true
      };

      await createJournalEntry(companyId, journalEntryData);

      // Generate and download the challan PDF
      const manufacturerData = manufacturers.find(m => m.id === manufacturerId);
      const customerData = { customerName: order.customerName };

      const challanPdfData = {
        challanNumber,
        issuedDate: new Date(),
        orderId: order.id,
        orderNumber: order.orderNumber || order.serialNumber,
        manufacturerName: manufacturerData?.manufacturerName || manufacturerData?.name || 'Unknown',
        manufacturerCode: manufacturerData?.manufacturerCode || manufacturerId.slice(-4),
        manufacturerPhone: manufacturerData?.phone || '',
        customerName: order.customerName,
        productName: order.productName,
        weightGrams: order.weight,
        karat: order.karat,
        pureGoldAmount: order.productPureGold,
        purpose: `Production of ${order.weight}g ${order.karat} ${order.productName} for Order ${order.id.slice(-8)}`,
        notes: ''
      };

      await challanGenerator.downloadChallan(challanPdfData);

      // Update order with challan info and status
      const orderRef = doc(db, ordersPath, order.id);
      await updateDoc(orderRef, {
        challanNumber: challanNumber,
        challanId: challanRef.id,
        status: targetStatus,
        challanIssuedAt: serverTimestamp(),
        manufacturerId: manufacturerId,
        goldBankId: goldBankId,
        updatedAt: serverTimestamp()
      });

      alert(`✅ Challan ${challanNumber} issued successfully!\nOrder status changed to ${targetStatus}.\n\nAccounting entries created:\n• Debit: ${manufacturerSubAccount.name} (+${order.productPureGold.toFixed(3)}g)\n• Credit: ${goldBankAccount.name} (-${order.productPureGold.toFixed(3)}g)\n\nPDF challan downloaded for manufacturer.`);

      // Close popup
      setShowChallanIssuePopup(false);
      setChallanIssueData({
        order: null,
        manufacturerId: '',
        goldBankId: '',
        targetStatus: ''
      });

    } catch (error) {
      console.error('Error issuing challan:', error);
      alert('Error issuing challan: ' + error.message);
    }
  };

  // Old status change functions removed - now using simpler dropdown-based handleStatusChangeFromDropdown

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

  // ✅ NEW: Helper function to generate challan for order (used in auto-generation)
  const generateChallanForOrder = async (order) => {
    try {
      if (!order.manufacturerId) {
        throw new Error('Manufacturer is required for challan generation');
      }
      if (!order.goldBankId) {
        throw new Error('Gold bank is required for challan generation');
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
        throw new Error('Manufacturer not found');
      }
      const manufacturerData = { id: manufacturerSnap.id, ...manufacturerSnap.data() };

      const pureGoldAmount = order.productPureGold;

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
        purpose: `Production of ${order.totalWeight}g ${order.karat} ${order.productName} for Order ${order.id.slice(-8)}`,
        status: 'issued',
        issuedDate: serverTimestamp(),
        accountingRecorded: false,
        sharafReleaseConfirmation: false,
        goldBankId: order.goldBankId,
        goldBankAccountCode: order.goldBankAccountCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId || 'default-company'
      };

      // Save challan to Firestore
      const challanRef = await addDoc(collection(db, challansPath), challanData);
      console.log('✅ Challan created:', challanRef.id);

      // Update order with challan number and status
      const orderRef = doc(db, ordersPath, order.id);
      await updateDoc(orderRef, {
        challanNumber,
        challanId: challanRef.id,
        status: 'Confirmed',
        challanIssuedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // ✅ Create accounting entry using SDK with manufacturer-specific accounts
      try {
        const allAccounts = await getAccountsOnce(companyId || 'default-company');

        // ✅ Get or create manufacturer-specific gold account
        // Use existing Gold in Transit account (1102) - no need to create manufacturer-specific accounts
        const goldInTransitAccount = allAccounts.find(acc => acc.accountCode === '1102');
        
        if (!goldInTransitAccount) {
          throw new Error('Gold in Transit account (1102) not found. Please ensure accounts are properly initialized.');
        }
        
        const manufacturerGoldAccount = goldInTransitAccount;

        const goldBankSubAccount = allAccounts.find(acc => acc.id === order.goldBankId);

        if (!manufacturerGoldAccount) {
          throw new Error('Manufacturer gold account not found');
        }

        if (!goldBankSubAccount) {
          throw new Error('Selected gold bank account not found');
        }

        const journalEntryData = {
          date: new Date().toISOString().split('T')[0],
          description: `Gold withdrawal challan ${challanNumber} issued for Order ${order.id.slice(-8)}`,
          referenceType: 'challan',
          referenceId: challanRef.id,
          entries: [
            {
              accountId: manufacturerGoldAccount.id,
              accountCode: manufacturerGoldAccount.accountCode,
              accountName: manufacturerGoldAccount.accountName,
              debit: pureGoldAmount,
              credit: 0
            },
            {
              accountId: goldBankSubAccount.id,
              accountCode: goldBankSubAccount.accountCode,
              accountName: goldBankSubAccount.accountName,
              debit: 0,
              credit: pureGoldAmount
            }
          ],
          totalDebit: pureGoldAmount,
          totalCredit: pureGoldAmount,
          isBalanced: true
        };

        await createJournalEntry(companyId || 'default-company', journalEntryData);

        await updateDoc(doc(db, challansPath, challanRef.id), {
          accountingRecorded: true,
          updatedAt: serverTimestamp()
        });

        console.log('✅ Challan accounting entry created');
      } catch (accountingError) {
        console.error('❌ Error creating accounting entry:', accountingError);
        throw new Error(`Accounting entry failed: ${accountingError.message}`);
      }

      // Update manufacturer's goldInTransit
      try {
        const currentGoldInTransit = manufacturerData.goldInTransit || 0;
        await updateDoc(manufacturerRef, {
          goldInTransit: currentGoldInTransit + pureGoldAmount,
          updatedAt: serverTimestamp()
        });
        console.log('✅ Manufacturer goldInTransit updated');
      } catch (mfgError) {
        console.error('❌ Error updating manufacturer goldInTransit:', mfgError);
      }

      return { challanNumber, challanId: challanRef.id };
    } catch (error) {
      console.error('❌ Error generating challan:', error);
      throw error;
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

      // \u2705 Create accounting entry using SDK: Debit Gold in Transit Sub-Account (1102-XXX), Credit Gold Bank Sub-Account
      try {
        // Fetch all accounts to get gold bank sub-accounts and check/create manufacturer sub-account
        const allAccounts = await getAccountsOnce(companyId || 'default-company');
        
        // Find or create manufacturer's sub-account under Gold in Transit (1102)
        let manufacturerSubAccount = allAccounts.find(acc => 
          acc.parentAccount === '1102' && acc.manufacturerId === order.manufacturerId
        );
        
        if (!manufacturerSubAccount) {
          // Create sub-account for this manufacturer under 1102
          const subAccountCode = `1102-MFG-${order.manufacturerId}`;
          const subAccountName = `Gold Custody for ${manufacturerData.manufacturerName || manufacturerData.name}`;
          
          const newAccount = {
            accountCode: subAccountCode,
            name: subAccountName,
            type: 'asset',
            parentAccount: '1102',  // Parent: Gold in Transit
            manufacturerId: order.manufacturerId,
            balanceGold: 0,
            balanceUSD: 0,
            isActive: true,
            createdAt: serverTimestamp()
          };
          
          const accountRef = await addDoc(collection(db, `${basePath}/accounts`), newAccount);
          manufacturerSubAccount = { id: accountRef.id, ...newAccount };
          console.log('Created manufacturer sub-account:', subAccountCode);
        }
        
        // Find gold bank sub-account (should be stored in order or challan)
        // For now, use first gold bank sub-account under 1101
        const goldBankSubAccount = allAccounts.find(acc => 
          acc.parentAccount === '1101' && acc.accountCode.startsWith('1101-')
        );
        
        if (!goldBankSubAccount) {
          throw new Error('No gold bank sub-account found. Please create a gold bank first.');
        }
        
        // Create journal entry using SDK
        const journalEntryData = {
          date: new Date().toISOString().split('T')[0],
          description: `Gold withdrawal challan ${challanNumber} issued for Order ${order.id.slice(-8)}`,
          referenceType: 'challan',
          referenceId: challanRef.id,
          entries: [
            {
              accountId: manufacturerSubAccount.id,
              accountCode: manufacturerSubAccount.accountCode,
              accountName: manufacturerSubAccount.name,
              debit: pureGoldAmount,
              credit: 0
            },
            {
              accountId: goldBankSubAccount.id,
              accountCode: goldBankSubAccount.accountCode,
              accountName: goldBankSubAccount.accountName,
              debit: 0,
              credit: pureGoldAmount
            }
          ],
          totalDebit: pureGoldAmount,
          totalCredit: pureGoldAmount,
          isBalanced: true
        };
        
        await createJournalEntry(companyId || 'default-company', journalEntryData);

        // Update challan accounting status
        await updateDoc(doc(db, challansPath, challanRef.id), {
          accountingRecorded: true,
          goldBankAccountId: goldBankSubAccount.id,
          goldBankAccountCode: goldBankSubAccount.accountCode,
          manufacturerAccountId: manufacturerSubAccount.id,
          manufacturerAccountCode: manufacturerSubAccount.accountCode,
          updatedAt: serverTimestamp()
        });

        console.log('\u2705 Challan accounting entry created using SDK:', manufacturerSubAccount.accountCode, '->', goldBankSubAccount.accountCode);
      } catch (accountingError) {
        console.error('\u274c Error creating accounting entry:', accountingError);
        alert(`Warning: Challan created but accounting entry failed:\n${accountingError.message}`);
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
        const allAccounts = await getAccountsOnce(companyId || 'default-company');
        
        // Find or create manufacturer's sub-account under Gold in Transit (1102)
        let manufacturerSubAccount = allAccounts.find(acc => 
          acc.parentAccount === '1102' && acc.manufacturerId === order.manufacturerId
        );
        
        if (!manufacturerSubAccount) {
          // Create sub-account for this manufacturer under 1102
          const subAccountCode = `1102-MFG-${order.manufacturerId}`;
          const subAccountName = `Gold Custody for ${manufacturerData.name || manufacturerData.manufacturerName}`;
          
          const newAccount = {
            accountCode: subAccountCode,
            name: subAccountName,
            type: 'asset',
            parentAccount: '1102',  // Parent: Gold in Transit
            manufacturerId: order.manufacturerId,
            balanceGold: 0,
            balanceUSD: 0,
            isActive: true,
            createdAt: serverTimestamp()
          };
          
          const accountRef = await addDoc(collection(db, `${basePath}/accounts`), newAccount);
          manufacturerSubAccount = { id: accountRef.id, ...newAccount };
          console.log('Created manufacturer sub-account for additional challan:', subAccountCode);
        }
        
        // Find gold bank sub-account
        const goldBankSubAccount = allAccounts.find(acc => 
          acc.parentAccount === '1101' && acc.accountCode.startsWith('1101-')
        );
        
        if (!goldBankSubAccount) {
          throw new Error('No gold bank sub-account found. Please create a gold bank first.');
        }
        
        if (challanType === 'additional_gold') {
          // Additional Gold: Debit Manufacturer Sub-Account, Credit Gold Bank Sub-Account
          const journalEntryData = {
            date: new Date().toISOString().split('T')[0],
            description: `Additional gold challan ${challanNumber} for Order ${order.id.slice(-8)} - ${order.manufacturerName}`,
            referenceType: 'challan',
            referenceId: challanRef.id,
            entries: [
              {
                accountId: manufacturerSubAccount.id,
                accountCode: manufacturerSubAccount.accountCode,
                accountName: manufacturerSubAccount.name,
                debit: pureGoldAmount,
                credit: 0
              },
              {
                accountId: goldBankSubAccount.id,
                accountCode: goldBankSubAccount.accountCode,
                accountName: goldBankSubAccount.accountName,
                debit: 0,
                credit: pureGoldAmount
              }
            ],
            totalDebit: pureGoldAmount,
            totalCredit: pureGoldAmount,
            isBalanced: true
          };
          
          await createJournalEntry(companyId || 'default-company', journalEntryData);

          // Update manufacturer's goldInTransit (increase)
          const currentGoldInTransit = manufacturerData.goldInTransit || 0;
          await updateDoc(manufacturerRef, {
            goldInTransit: currentGoldInTransit + pureGoldAmount,
            updatedAt: serverTimestamp()
          });

        } else if (challanType === 'gold_return') {
          // Gold Return: Debit Gold Bank Sub-Account, Credit Manufacturer Sub-Account
          const journalEntryData = {
            date: new Date().toISOString().split('T')[0],
            description: `Gold return receipt ${challanNumber} for Order ${order.id.slice(-8)} - ${order.manufacturerName}`,
            referenceType: 'challan',
            referenceId: challanRef.id,
            entries: [
              {
                accountId: goldBankSubAccount.id,
                accountCode: goldBankSubAccount.accountCode,
                accountName: goldBankSubAccount.accountName,
                debit: pureGoldAmount,
                credit: 0
              },
              {
                accountId: manufacturerSubAccount.id,
                accountCode: manufacturerSubAccount.accountCode,
                accountName: manufacturerSubAccount.name,
                debit: 0,
                credit: pureGoldAmount
              }
            ],
            totalDebit: pureGoldAmount,
            totalCredit: pureGoldAmount,
            isBalanced: true
          };
          
          await createJournalEntry(companyId || 'default-company', journalEntryData);

          // Update manufacturer's goldInTransit (decrease)
          const currentGoldInTransit = manufacturerData.goldInTransit || 0;
          await updateDoc(manufacturerRef, {
            goldInTransit: Math.max(0, currentGoldInTransit - pureGoldAmount),
            updatedAt: serverTimestamp()
          });
        }

        // Update challan accounting status
        await updateDoc(doc(db, challansPath, challanRef.id), {
          accountingRecorded: true,
          goldBankAccountId: goldBankSubAccount.id,
          goldBankAccountCode: goldBankSubAccount.accountCode,
          manufacturerAccountId: manufacturerSubAccount.id,
          manufacturerAccountCode: manufacturerSubAccount.accountCode,
          updatedAt: serverTimestamp()
        });

        console.log('\u2705 Additional challan accounting entry created:', challanType, manufacturerSubAccount.accountCode);
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

  // Handle order selection for bulk operations - REMOVED
  // const handleOrderSelect = (orderId, checked) => {
  //   if (checked) {
  //     setSelectedOrders(prev => [...prev, orderId]);
  //   } else {
  //     setSelectedOrders(prev => prev.filter(id => id !== orderId));
  //   }
  // };

  // Handle select all orders - REMOVED
  // const handleSelectAll = (checked) => {
  //   if (checked) {
  //     setSelectedOrders(filteredOrders.map(order => order.id));
  //   } else {
  //     setSelectedOrders([]);
  //   }
  // };
  
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
      
      // ✅ NEW: Validate challan generation requirements
      if (newOrder.generateChallan) {
        if (!newOrder.manufacturerId) {
          alert('Please select a manufacturer to generate challan');
          return;
        }
        if (!newOrder.goldBankId) {
          alert('Please select a gold bank (Sharaf) to generate challan');
          return;
        }
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
        
        // ✅ Store gold bank selection for later challan generation
        goldBankId: newOrder.goldBankId || '',
        goldBankAccountCode: newOrder.goldBankId ? goldBanks.find(gb => gb.id === newOrder.goldBankId)?.accountCode : '',
        
        // Status Tracking (BRD v2 Section 4.1)
        // ✅ Set status based on generateChallan checkbox
        status: newOrder.generateChallan ? 'Confirmed' : 'New Order',
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

      // ✅ NEW: Auto-generate challan if checkbox was checked
      if (newOrder.generateChallan && newOrder.manufacturerId && newOrder.goldBankId) {
        try {
          await generateChallanForOrder({
            id: orderId,
            ...orderData,
            productPureGold, // Pass calculated pure gold amount
            manufacturerId: newOrder.manufacturerId,
            goldBankId: newOrder.goldBankId
          });
          
          console.log('✅ Challan auto-generated for order:', orderId);
        } catch (challanError) {
          console.error('❌ Error auto-generating challan:', challanError);
          alert(`Order created but challan generation failed:\n${challanError.message}\nYou can generate challan manually later.`);
        }
      }

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
        goldBankId: '',
        generateChallan: false,
        expectedDeliveryDate: '',
        notes: ''
      });
      setProductNameSuggestions([]);

      const successMessage = newOrder.generateChallan 
        ? `Order created and challan generated!\nOrder Number: ${orderNumber}\nStatus: Confirmed\nTotal Pure Gold Owed: ${totalPureGoldOwed.toFixed(3)}g`
        : `Order created successfully!\nOrder Number: ${orderNumber}\nStatus: New Order\nTotal Pure Gold Owed: ${totalPureGoldOwed.toFixed(3)}g`;
      
      alert(successMessage);

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  };

  // Handle Purchase Entry Submission
  const handlePurchaseEntrySubmit = async () => {
    try {
      if (!purchaseEntryOrder) {
        alert('No order selected for finished product receipt');
        return;
      }

      // Validation
      if (!purchaseEntryData.weightReceived || parseFloat(purchaseEntryData.weightReceived) <= 0) {
        alert('Please enter the finished product weight received');
        return;
      }
      if (!purchaseEntryData.karat) {
        alert('Please select the karat/purity of the finished product');
        return;
      }
      if (!purchaseEntryData.manufacturingCostPerGram || parseFloat(purchaseEntryData.manufacturingCostPerGram) <= 0) {
        alert('Please enter the making charges per gram');
        return;
      }

      const finishedWeight = parseFloat(purchaseEntryData.weightReceived);
      const karat = purchaseEntryData.karat;
      const makingChargesPerGram = parseFloat(purchaseEntryData.manufacturingCostPerGram);

      // Calculate pure gold factor
      const pureGoldFactor = karat === '24k' ? 1.0 :
                           karat === '22k' ? 0.9167 :
                           karat === '21k' ? 0.875 :
                           karat === '18k' ? 0.75 :
                           karat === '14k' ? 0.5833 : 1.0;

      // Calculate pure gold received
      const pureGoldReceived = finishedWeight * pureGoldFactor;

      // Calculate total making charges
      const totalMakingCharges = finishedWeight * makingChargesPerGram;

      // Calculate commission (customer price - making charges)
      const commissionAmount = (purchaseEntryOrder.total || 0) - totalMakingCharges;

      console.log('Finished Product Receipt Calculations:', {
        finishedWeight,
        karat,
        pureGoldFactor,
        pureGoldReceived,
        makingChargesPerGram,
        totalMakingCharges,
        commissionAmount
      });

      // Create finished product receipt document
      const finishedProductReceipt = {
        orderId: purchaseEntryOrder.id,
        orderNumber: purchaseEntryOrder.orderNumber || purchaseEntryOrder.id,
        customerId: purchaseEntryOrder.customerId,
        customerName: purchaseEntryOrder.customerName,
        manufacturerId: purchaseEntryOrder.manufacturerId,
        manufacturerName: getManufacturerName(purchaseEntryOrder.manufacturerId),
        categoryId: purchaseEntryOrder.categoryId,
        productName: purchaseEntryOrder.productName,
        karat: karat,
        finishedWeight: finishedWeight,
        pureGoldFactor: pureGoldFactor,
        pureGoldReceived: pureGoldReceived,
        makingChargesPerGram: makingChargesPerGram,
        totalMakingCharges: totalMakingCharges,
        commissionAmount: commissionAmount,
        paymentStatus: purchaseEntryData.paymentType,
        notes: purchaseEntryData.notes,
        createdAt: serverTimestamp(),
        createdBy: 'admin',
        type: 'finished_product_receipt'
      };

      // Save finished product receipt
      await addDoc(collection(db, `companies/${companyId}/finishedProductReceipts`), finishedProductReceipt);

      // Update order document
      const orderRef = doc(db, ordersPath, purchaseEntryOrder.id);
      await updateDoc(orderRef, {
        finishedProductReceived: true,
        finishedProductReceiptDate: serverTimestamp(),
        finishedWeight: finishedWeight,
        karatReceived: karat,
        pureGoldReceived: pureGoldReceived,
        totalMakingCharges: totalMakingCharges,
        commissionAmount: commissionAmount,
        paymentStatusToManufacturer: purchaseEntryData.paymentType,
        status: 'Picked Up',
        inventoryUpdated: true,
        commissionCalculated: true
      });

      // Update manufacturer gold in transit (reduce by pure gold received)
      if (purchaseEntryOrder.manufacturerId) {
        const manufacturerRef = doc(db, manufacturersPath, purchaseEntryOrder.manufacturerId);
        const manufacturerSnap = await getDoc(manufacturerRef);
        if (manufacturerSnap.exists()) {
          const currentGoldInTransit = manufacturerSnap.data().goldInTransit || 0;
          const newGoldInTransit = Math.max(0, currentGoldInTransit - pureGoldReceived);
          await updateDoc(manufacturerRef, {
            goldInTransit: newGoldInTransit,
            lastGoldReturn: serverTimestamp()
          });
        }
      }

      // Create accounting entries using the new pure gold system
      const accountingEngine = new AccountingEngine(companyId);

      // Journal Entry for finished product receipt (per BRD Section 3.3)
      // Debit: Gold in Transit (1102) - reduce by pure gold amount
      // Debit: Making Charges Expense (5101) - record manufacturing cost in USD
      // Credit: Finished Goods Inventory (1103) - increase by pure gold amount
      // Credit: Manufacturer Payables (2101) - record payable if not paid immediately

      const journalEntryData = {
        description: `Finished product receipt for order ${purchaseEntryOrder.id} - ${purchaseEntryOrder.productName}`,
        date: new Date(),
        referenceType: 'finished_product_receipt',
        referenceId: purchaseEntryOrder.id,
        entries: [
          // Debit: Reduce Gold in Transit
          {
            accountCode: 'MAIN-1102', // Gold in Transit to Manufacturers
            accountName: 'Gold in Transit to Manufacturers',
            debit: pureGoldReceived, // Pure gold amount
            credit: 0,
            description: `Reduce gold in transit by ${pureGoldReceived.toFixed(3)}g pure gold`
          },
          // Debit: Making Charges Expense
          {
            accountCode: 'MAIN-5101', // Making Charges Expense
            accountName: 'Making Charges Expense',
            debit: 0,
            credit: totalMakingCharges, // USD amount
            description: `Making charges expense: $${totalMakingCharges.toFixed(2)}`
          },
          // Credit: Finished Goods Inventory
          {
            accountCode: 'MAIN-1103', // Finished Goods Inventory
            accountName: 'Finished Goods Inventory',
            debit: 0,
            credit: pureGoldReceived, // Pure gold amount
            description: `Add finished goods inventory: ${pureGoldReceived.toFixed(3)}g pure gold`
          },
          // Credit: Manufacturer Payables (only if not paid immediately)
          ...(purchaseEntryData.paymentType === 'credit' ? [{
            accountCode: 'MAIN-2101', // Manufacturer Payables - Making Charges
            accountName: 'Manufacturer Payables - Making Charges',
            debit: totalMakingCharges, // USD amount
            credit: 0,
            description: `Manufacturer payable: $${totalMakingCharges.toFixed(2)}`
          }] : [])
        ]
      };

      // Create the journal entry
      await createJournalEntry(companyId, journalEntryData);

      // If paid immediately, also record the cash payment
      if (purchaseEntryData.paymentType === 'paid') {
        const paymentEntryData = {
          description: `Payment to manufacturer for order ${purchaseEntryOrder.id}`,
          date: new Date(),
          referenceType: 'manufacturer_payment',
          referenceId: purchaseEntryOrder.id,
          entries: [
            // Debit: Manufacturer Payables
            {
              accountCode: 'MAIN-2101',
              accountName: 'Manufacturer Payables - Making Charges',
              debit: totalMakingCharges,
              credit: 0,
              description: `Pay manufacturer: $${totalMakingCharges.toFixed(2)}`
            },
            // Credit: Cash/Bank
            {
              accountCode: 'MAIN-1201', // Cash/Bank
              accountName: 'Cash/Bank',
              debit: 0,
              credit: totalMakingCharges,
              description: `Cash payment: $${totalMakingCharges.toFixed(2)}`
            }
          ]
        };
        await createJournalEntry(companyId, paymentEntryData);
      }

      // Record commission income
      if (commissionAmount > 0) {
        const commissionEntryData = {
          description: `Commission income from order ${purchaseEntryOrder.id}`,
          date: new Date(),
          referenceType: 'commission_income',
          referenceId: purchaseEntryOrder.id,
          entries: [
            // Debit: Commission Receivable (or Cash if received)
            {
              accountCode: 'MAIN-1301', // Customer Receivables (since commission is part of customer payment)
              accountName: 'Customer Receivables',
              debit: commissionAmount,
              credit: 0,
              description: `Commission receivable: $${commissionAmount.toFixed(2)}`
            },
            // Credit: Commission Income
            {
              accountCode: 'MAIN-4101', // Commission Income
              accountName: 'Commission Income',
              debit: 0,
              credit: commissionAmount,
              description: `Commission income: $${commissionAmount.toFixed(2)}`
            }
          ]
        };
        await createJournalEntry(companyId, commissionEntryData);
      }

      // Close dialog and reset
      setShowPurchaseEntryDialog(false);
      setPurchaseEntryOrder(null);
      setPurchaseEntryData({
        weightReceived: '',
        karat: '24k',
        manufacturingCostPerGram: '',
        paymentType: 'paid',
        notes: ''
      });

      // Refresh orders list
      fetchOrders();

      alert('Finished product received successfully! Accounting entries created.');

    } catch (error) {
      console.error('Finished product receipt error:', error);
      alert('Error processing finished product receipt: ' + error.message);
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
                  <option key={status} value={status}>
                    {status}
                  </option>
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
                    {/* ✅ Status Dropdown Column - Simple, unrestricted */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChangeFromDropdown(order, e.target.value)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg border-2 focus:ring-2 focus:ring-blue-500 ${ORDER_STATUS_FLOW[order.status]?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
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
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Order"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div></div>
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
                              Challan will be issued automatically when order status changes to &quot;Challan Issued&quot;
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
                      Gold Bank (Sharaf) <span className="text-gray-500 text-xs">(For Challan)</span>
                    </label>
                    <select
                      value={newOrder.goldBankId}
                      onChange={(e) => setNewOrder({...newOrder, goldBankId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gold Bank (Optional)</option>
                      {goldBanks.map(goldBank => (
                        <option key={goldBank.id} value={goldBank.id}>
                          {goldBank.accountName} ({goldBank.accountCode})
                          {goldBank.currentBalanceGold > 0 ? ` - ${goldBank.currentBalanceGold.toFixed(3)}g` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select gold bank for challan generation</p>
                  </div>
                </div>

                {/* Generate Challan Checkbox */}
                {newOrder.manufacturerId && newOrder.goldBankId && (
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newOrder.generateChallan}
                        onChange={(e) => setNewOrder({...newOrder, generateChallan: e.target.checked})}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-semibold text-gray-800">Generate Challan & Confirm Order</span>
                        <p className="text-xs text-gray-600 mt-1">
                          ✅ Checked: Order will be <strong>Confirmed</strong> immediately and challan will be generated with accounting entries
                        </p>
                        <p className="text-xs text-gray-600">
                          ❌ Unchecked: Order will be saved as <strong>New Order</strong> (no challan, no accounting)
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Expected Delivery Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div></div>
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
                        goldBankId: '',
                        generateChallan: false,
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

        {/* Purchase Entry Dialog */}
        {showPurchaseEntryDialog && purchaseEntryOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-purple-800">Receive Finished Product from Manufacturer</h2>
              
              {/* Order Summary */}
              <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3">Order Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Order ID:</span>
                    <span className="ml-2 font-semibold">{purchaseEntryOrder.id.slice(-8)}</span>
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
                    <span className="text-gray-600">Pure Gold Ordered:</span>
                    <span className="ml-2 font-semibold text-yellow-600">{formatGold(purchaseEntryOrder.pureGoldRequired)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Manufacturer:</span>
                    <span className="ml-2 font-semibold">{getManufacturerName(purchaseEntryOrder.manufacturerId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gold in Transit:</span>
                    <span className="ml-2 font-semibold text-orange-600">{formatGold(purchaseEntryOrder.goldInTransit || purchaseEntryOrder.pureGoldRequired)}</span>
                  </div>
                </div>
              </div>

              {/* Finished Product Entry Form */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weight Received */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Finished Product Weight (grams) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={purchaseEntryData.weightReceived}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, weightReceived: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter finished product weight"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Weight of finished jewelry received from manufacturer
                    </p>
                  </div>

                  {/* Karat/Purity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Karat/Purity *
                    </label>
                    <select
                      value={purchaseEntryData.karat || purchaseEntryOrder.karat}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, karat: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="24k">24K (100% Pure Gold)</option>
                      <option value="22k">22K (91.67% Pure Gold)</option>
                      <option value="21k">21K (87.5% Pure Gold)</option>
                      <option value="18k">18K (75% Pure Gold)</option>
                      <option value="14k">14K (58.33% Pure Gold)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Purity of the finished jewelry
                    </p>
                  </div>

                  {/* Manufacturing Cost per Gram */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Making Charges per Gram (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseEntryData.manufacturingCostPerGram}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, manufacturingCostPerGram: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter making charges per gram"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cost charged by manufacturer per gram of finished jewelry
                    </p>
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status *
                    </label>
                    <select
                      value={purchaseEntryData.paymentType}
                      onChange={(e) => setPurchaseEntryData({...purchaseEntryData, paymentType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="paid">Paid to Manufacturer</option>
                      <option value="credit">Pay Later (Create Payable)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Have you paid the manufacturer yet?
                    </p>
                  </div>
                </div>

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
                    placeholder="Any notes about the finished product..."
                  />
                </div>
              </div>

              {/* Pure Gold & Cost Calculation Preview */}
              {purchaseEntryData.weightReceived && purchaseEntryData.karat && purchaseEntryData.manufacturingCostPerGram && (
                <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3">Pure Gold & Cost Calculation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pure Gold Calculations */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-800">Pure Gold Calculations</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Finished Product Weight:</span>
                          <span className="font-semibold">{parseFloat(purchaseEntryData.weightReceived).toFixed(3)}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Karat/Purity:</span>
                          <span className="font-semibold">{purchaseEntryData.karat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Pure Gold Factor:</span>
                          <span className="font-semibold">
                            {(() => {
                              const karat = purchaseEntryData.karat;
                              const factor = karat === '24k' ? 1.0 :
                                           karat === '22k' ? 0.9167 :
                                           karat === '21k' ? 0.875 :
                                           karat === '18k' ? 0.75 :
                                           karat === '14k' ? 0.5833 : 1.0;
                              return factor.toFixed(4);
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-green-300">
                          <span className="text-gray-700 font-semibold">Pure Gold Received:</span>
                          <span className="font-bold text-yellow-600">
                            {(() => {
                              const weight = parseFloat(purchaseEntryData.weightReceived);
                              const karat = purchaseEntryData.karat;
                              const factor = karat === '24k' ? 1.0 :
                                           karat === '22k' ? 0.9167 :
                                           karat === '21k' ? 0.875 :
                                           karat === '18k' ? 0.75 :
                                           karat === '14k' ? 0.5833 : 1.0;
                              return formatGold(weight * factor);
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Calculations */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-800">Manufacturing Cost</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Making Charges per Gram:</span>
                          <span className="font-semibold">${parseFloat(purchaseEntryData.manufacturingCostPerGram).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Finished Product Weight:</span>
                          <span className="font-semibold">{parseFloat(purchaseEntryData.weightReceived).toFixed(3)}g</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-green-300">
                          <span className="text-gray-700 font-semibold">Total Making Charges:</span>
                          <span className="font-bold text-blue-600">
                            ${(parseFloat(purchaseEntryData.weightReceived) * parseFloat(purchaseEntryData.manufacturingCostPerGram)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-green-500">
                          <span className="text-green-900 font-bold">Commission Earned:</span>
                          <span className="text-green-600 font-bold">
                            ${(() => {
                              const customerPrice = purchaseEntryOrder.total || 0;
                              const makingCharges = parseFloat(purchaseEntryData.weightReceived) * parseFloat(purchaseEntryData.manufacturingCostPerGram);
                              return (customerPrice - makingCharges).toFixed(2);
                            })()}
                          </span>
                        </div>
                      </div>
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
                  Receive Finished Product
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                This will update inventory, record making charges, create manufacturer payable, and update accounting entries.
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
              <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-t-lg z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      ✓ Gold Withdrawal Challan Issued
                    </h2>
                    <p className="text-yellow-100 text-sm mt-1">Challan generated successfully</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowChallanDialog(false);
                      setChallanOrderData(null);
                    }}
                    className="text-white hover:text-yellow-100 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">{/* Challan Details */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
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
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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
                      ℹ️ Gold has been transferred from Sharaf bank to manufacturer&apos;s custody
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Next Steps:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Manufacturer will present challan to Gold Bank (Sharaf)</li>
                  <li>• Sharaf will verify and release {challanOrderData.pureGoldAmount?.toFixed(3)}g pure gold</li>
                  <li>• Manufacturer will produce the ordered jewelry</li>
                  <li>• Order status updated to &quot;Confirmed&quot;</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowChallanDialog(false);
                    setChallanOrderData(null);
                  }}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
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
                  className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Download Challan PDF
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Challan document contains authorization for gold withdrawal from Sharaf
              </p>
              </div>
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
                  <li>• Order status updated to &quot;Customer Billed&quot;</li>
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
                      <li>Order status updated to &quot;Payment Received&quot;</li>
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

        {/* ✅ Challan Issue Popup for Challan Issued Status */}
        {showChallanIssuePopup && challanIssueData.order && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-t-lg z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Issue Gold Withdrawal Challan</h2>
                    <p className="text-yellow-100 text-sm mt-1">Required for Challan Issued status</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowChallanIssuePopup(false);
                      setChallanIssueData({
                        order: null,
                        manufacturerId: '',
                        goldBankId: '',
                        targetStatus: ''
                      });
                    }}
                    className="text-white hover:text-yellow-100 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Order Details</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Order ID:</span>
                      <span className="font-semibold">{challanIssueData.order.id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Customer:</span>
                      <span className="font-semibold">{challanIssueData.order.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Product:</span>
                      <span className="font-semibold">{challanIssueData.order.productName}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="text-gray-700 font-semibold">Pure Gold to Issue:</span>
                      <span className="font-bold text-blue-600 text-lg">
                        {challanIssueData.order.productPureGold?.toFixed(3)}g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manufacturer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={challanIssueData.manufacturerId}
                    onChange={(e) => setChallanIssueData({...challanIssueData, manufacturerId: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Manufacturer</option>
                    {manufacturers
                      .filter(m => m.isActive !== false)
                      .map(manufacturer => (
                        <option key={manufacturer.id} value={manufacturer.id}>
                          {manufacturer.manufacturerName || manufacturer.name}
                          {manufacturer.goldInTransit > 0 ? ` (Gold In Transit: ${manufacturer.goldInTransit.toFixed(3)}g)` : ''}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Who will receive the gold for production?</p>
                </div>

                {/* Gold Bank Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gold Bank (Sharaf) <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={challanIssueData.goldBankId}
                    onChange={(e) => setChallanIssueData({...challanIssueData, goldBankId: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Gold Bank</option>
                    {goldBanks.map(goldBank => (
                      <option key={goldBank.id} value={goldBank.id}>
                        {goldBank.accountName} ({goldBank.accountCode})
                        {goldBank.currentBalanceGold > 0 ? ` - ${goldBank.currentBalanceGold.toFixed(3)}g` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Which Sharaf location will release the gold?</p>
                </div>

                {/* Accounting Preview */}
                {challanIssueData.manufacturerId && challanIssueData.goldBankId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Accounting Entry Preview</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">✓ Debit: Gold in Transit - {manufacturers.find(m => m.id === challanIssueData.manufacturerId)?.manufacturerName || 'Manufacturer'}</span>
                        <span className="font-semibold">+{challanIssueData.order.productPureGold?.toFixed(3)}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">✓ Credit: {goldBanks.find(gb => gb.id === challanIssueData.goldBankId)?.accountName || 'Gold Bank'}</span>
                        <span className="font-semibold">-{challanIssueData.order.productPureGold?.toFixed(3)}g</span>
                      </div>
                      <p className="text-xs text-gray-600 pt-2 border-t border-green-200">
                        Status will change to: <strong className="text-green-700">Challan Issued</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowChallanIssuePopup(false);
                      setChallanIssueData({
                        order: null,
                        manufacturerId: '',
                        goldBankId: '',
                        targetStatus: ''
                      });
                    }}
                    className="flex-1 px-4 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel (Status Won&apos;t Change)
                  </button>
                  <button
                    onClick={handleConfirmChallanIssue}
                    disabled={!challanIssueData.order || !challanIssueData.manufacturerId || !challanIssueData.goldBankId}
                    className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Issue Challan & Change Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}



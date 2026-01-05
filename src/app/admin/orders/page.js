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
import { SectionBadge, useDevMode } from '@/components/SectionBadge.js';
import { useAccounting } from '@/app/context/AccountingContext';

// Gold Smith Order Status Colors (matching BRD)
const statusColors = {
  'New Order': 'bg-gray-100 text-gray-800',
  'Confirmed': 'bg-blue-100 text-blue-800',
  'Challan Issued': 'bg-cyan-100 text-cyan-800',
  'In Production': 'bg-yellow-100 text-yellow-800',
  'Ready for Pickup': 'bg-purple-100 text-purple-800',
  'Picked Up': 'bg-indigo-100 text-indigo-800',
  'Ready for Delivery': 'bg-orange-100 text-orange-800',
  'Delivered': 'bg-teal-100 text-teal-800',
  'Completed': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800',
  'Returned': 'bg-pink-100 text-pink-800',
};

// Gold Smith Order Statuses (from BRD)
// ✅ TASK 6.4: Order Status Workflow Configuration
const ORDER_STATUS_FLOW = {
  'New Order': {
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
    nextStatuses: ['Challan Issued', 'Cancelled'],
    allowedActions: [],
    description: 'Order confirmed, ready to issue challan',
    accountingImpact: 'None - confirmation only'
  },
  'Challan Issued': {
    label: 'Challan Issued',
    color: 'bg-cyan-100 text-cyan-800',
    nextStatuses: ['In Production', 'Ready for Pickup', 'Picked Up', 'Cancelled'],
    allowedActions: ['issueChallan'],
    description: 'Gold withdrawal challan issued to manufacturer',
    accountingImpact: 'Gold withdrawal challan triggers: Debit 1102 (Gold in Transit), Credit 1101 (Gold Inventory)'
  },
  'In Production': {
    label: 'In Production',
    color: 'bg-yellow-100 text-yellow-800',
    nextStatuses: ['Ready for Pickup', 'Picked Up', 'Cancelled'],
    allowedActions: [],
    description: 'Manufacturer working on the order',
    accountingImpact: 'None - work in progress'
  },
  'Ready for Pickup': {
    label: 'Ready for Pickup',
    color: 'bg-purple-100 text-purple-800',
    nextStatuses: ['Picked Up', 'Cancelled'],
    allowedActions: ['generateInvoice'],
    description: 'Product received from manufacturer, ready for customer pickup or delivery',
    accountingImpact: 'None - product ready'
  },
  'Picked Up': {
    label: 'Picked Up',
    color: 'bg-indigo-100 text-indigo-800',
    nextStatuses: ['Ready for Delivery', 'Delivered', 'Completed', 'Cancelled'],
    allowedActions: ['recordPayment'],
    description: 'Customer picked up the product',
    accountingImpact: 'None - delivery confirmation'
  },
  'Ready for Delivery': {
    label: 'Ready for Delivery',
    color: 'bg-orange-100 text-orange-800',
    nextStatuses: ['Delivered', 'Cancelled'],
    allowedActions: [],
    description: 'Product ready for delivery to customer',
    accountingImpact: 'None - delivery preparation'
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
  },
  'Returned': {
    label: 'Returned',
    color: 'bg-pink-100 text-pink-800',
    nextStatuses: [],
    allowedActions: [],
    description: 'Order returned by customer',
    accountingImpact: 'Reverse delivery and payment entries if applicable'
  }
};

const ORDER_STATUSES = Object.keys(ORDER_STATUS_FLOW);

// ✅ ACCOUNTING MILESTONES: Statuses that create accounting entries and cannot be bypassed
const ACCOUNTING_MILESTONES = ['Challan Issued', 'Picked Up', 'Delivered', 'Completed'];

// ✅ Function to validate status transitions based on accounting milestones
const validateStatusTransition = (currentStatus, newStatus) => {
  // Always allow cancellation from any status
  if (newStatus === 'Cancelled') return true;

  // Get current status index in milestones
  const currentMilestoneIndex = ACCOUNTING_MILESTONES.indexOf(currentStatus);
  const newMilestoneIndex = ACCOUNTING_MILESTONES.indexOf(newStatus);

  // If current status is not a milestone, check if trying to bypass milestones
  if (currentMilestoneIndex === -1) {
    // From New Order, can only go to Confirmed or Cancelled
    if (currentStatus === 'New Order' && newStatus !== 'Confirmed' && newStatus !== 'Cancelled') {
      return { valid: false, message: 'From New Order status, you can only change to Confirmed or Cancelled.' };
    }
    // From Confirmed, can only go to Challan Issued or Cancelled
    if (currentStatus === 'Confirmed' && newStatus !== 'Challan Issued' && newStatus !== 'Cancelled') {
      return { valid: false, message: 'From Confirmed status, you can only change to Challan Issued or Cancelled. Please issue a challan first.' };
    }
    // From Challan Issued, can go to In Production, Ready for Pickup, Picked Up, or Cancelled (can bypass)
    if (currentStatus === 'Challan Issued' && newStatus !== 'In Production' && newStatus !== 'Ready for Pickup' && newStatus !== 'Picked Up' && newStatus !== 'Cancelled') {
      return { valid: false, message: 'From Challan Issued status, you can only change to In Production, Ready for Pickup, Picked Up, or Cancelled.' };
    }
    // From In Production, can go to Ready for Pickup, Picked Up, or Cancelled (can bypass to Picked Up)
    if (currentStatus === 'In Production' && newStatus !== 'Ready for Pickup' && newStatus !== 'Picked Up' && newStatus !== 'Cancelled') {
      return { valid: false, message: 'From In Production status, you can only change to Ready for Pickup, Picked Up, or Cancelled.' };
    }
    // From Ready for Pickup, can only go to Picked Up or Cancelled (cannot bypass the Picked Up milestone)
    if (currentStatus === 'Ready for Pickup' && newStatus !== 'Picked Up' && newStatus !== 'Cancelled') {
      return { valid: false, message: 'From Ready for Pickup status, you must first change to Picked Up before proceeding to other statuses.' };
    }
    // From Ready for Delivery, can only go to Delivered or Cancelled
    if (currentStatus === 'Ready for Delivery' && newStatus !== 'Delivered' && newStatus !== 'Cancelled') {
      return { valid: false, message: 'From Ready for Delivery status, you can only change to Delivered or Cancelled.' };
    }
  }

  // If current status IS a milestone, cannot go backwards
  if (currentMilestoneIndex !== -1 && newMilestoneIndex !== -1 && newMilestoneIndex <= currentMilestoneIndex) {
    return { valid: false, message: `Cannot go backwards from ${currentStatus} to ${newStatus}. Accounting entries have been created.` };
  }

  // If trying to jump over milestones
  if (currentMilestoneIndex !== -1 && newMilestoneIndex !== -1 && newMilestoneIndex > currentMilestoneIndex + 1) {
    return { valid: false, message: `Cannot bypass accounting milestones. Must go through ${ACCOUNTING_MILESTONES[currentMilestoneIndex + 1]} first.` };
  }

  // Allow forward progression through defined next statuses
  return { valid: true };
};

// ✅ Function to get valid next statuses for dropdown filtering
const getValidNextStatuses = (currentStatus) => {
  // If current status is not in ORDER_STATUS_FLOW, assume it's 'New Order'
  const normalizedStatus = ORDER_STATUS_FLOW[currentStatus] ? currentStatus : 'New Order';
  const nextStatuses = ORDER_STATUS_FLOW[normalizedStatus]?.nextStatuses || [];

  // Always include current status first, then Cancelled, then other next statuses
  const validStatuses = [normalizedStatus, 'Cancelled'];

  // Add next statuses that pass validation (excluding Cancelled which is already included)
  nextStatuses.forEach(status => {
    if (status !== 'Cancelled' && !validStatuses.includes(status)) {
      validStatuses.push(status);
    }
  });

  return validStatuses;
};

// Payment Statuses for Gold Smith
const PAYMENT_STATUSES = [
  'Not Billed',
  'Billed',
  'Partially Paid',
  'Paid'
];

export default function GoldSmithOrders() {
  const router = useRouter();

  // ✅ TASK 7.1: Dev Mode Section Badges
  const { devMode, toggleDevMode } = useDevMode();
  const { companyId } = useAccounting();

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
  const [showChallanConfirmationDialog, setShowChallanConfirmationDialog] = useState(false);
  const [challanConfirmationData, setChallanConfirmationData] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceOrderData, setInvoiceOrderData] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentInvoiceData, setPaymentInvoiceData] = useState(null);
  const [showPaymentSuccessDialog, setShowPaymentSuccessDialog] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  const [paymentHistoryData, setPaymentHistoryData] = useState(null);
  // ✅ TASK 7.2 & 7.3: Additional Challan & Return Dialog State
  const [showAdditionalChallanDialog, setShowAdditionalChallanDialog] = useState(false);
  const [additionalChallanData, setAdditionalChallanData] = useState({
    order: null,
    challanType: 'additional_gold', // 'additional_gold' or 'gold_return'
    goldAmount: '',
    selectedGoldBankId: '', // New field for gold bank selection
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
  const [goldBanks, setGoldBanks] = useState([]);
  
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
    finalWeight: '', // Pre-filled from order
    commissionRate: '', // Editable commission rate
    goldPrice: '', // User input for gold price
    paymentMethod: 'cash', // 'cash' or 'credit'
    goldBankId: '', // Selected gold bank for customer gold deposit
    notes: ''
  });

  // Pickup Dialog State
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [pickupOrder, setPickupOrder] = useState(null);
  const [pickupData, setPickupData] = useState({
    manufacturerId: '',
    finalWeight: '',
    commissionRate: '',
    manufacturerBillNumber: '',
    paymentMethod: 'cash', // 'cash' or 'credit'
    createAdditionalChallan: false,
    processGoldReturn: false,
    generateRemainingGoldPayment: false, // New field for remaining gold payment challan
    remainingGoldPaymentBankId: '', // Gold bank for remaining payment
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
    goldBankId: '',
    expectedDeliveryDate: '',
    notes: ''
  });

  // Product name cache for auto-suggestion (BRD v2 Section 3.5)
  const [productNameCache, setProductNameCache] = useState([]);
  const [productNameSuggestions, setProductNameSuggestions] = useState([]);
  
  // Gold price state (fetched from goldPriceHistory)
  const [currentGoldPrice, setCurrentGoldPrice] = useState(null);

  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;
  const ordersPath = `${basePath}/orders`;
  const customersPath = `${basePath}/customers`;
  const manufacturersPath = `${basePath}/manufacturers`;
  const categoriesPath = `${basePath}/categories`;
  const goldPriceHistoryPath = 'goldPriceHistory'; // Root level collection

  // Utility Functions
  const calculatePureGold = (weight, karat) => {
    const purityCoefficient = {
      '24k': 1.0,
      '22k': 0.9166,
      '21k': 0.875,
      '18k': 0.75,
      '14k': 0.5833
    };
    return weight * (purityCoefficient[karat] || 0.75);
  };

  // ✅ UTILITY: Check if default accounts are initialized (comprehensive check)
  const checkAccountsInitialized = async () => {
    try {
      const accountsPath = `${basePath}/accounts`;
      const accountsQuery = query(collection(db, accountsPath));
      const snapshot = await getDocs(accountsQuery);
      
      // Check for ALL essential accounts needed for complete Gold Smith operations
      const requiredAccounts = [
        '1101', // Gold Bank (Sharaf)
        '1102', // Gold in Transit
        '1103', // Finished Goods Inventory
        '1201', // Cash
        '1202', // Bank Account
        '1301', // Customer Receivables
        '2101', // Manufacturer Payables
        '3101', // Owner's Capital
        '3201', // Retained Earnings
        '4101', // Commission Income
        '5101', // Making Charges
        '5201', // Salaries
        '5202', // Rent
        '5203'  // Utilities
      ];
      
      const existingCodes = snapshot.docs.map(doc => doc.data().accountCode).filter(code => code);
      
      const allAccountsExist = requiredAccounts.every(code => existingCodes.includes(code));
      
      if (!allAccountsExist) {
        const missingAccounts = requiredAccounts.filter(code => !existingCodes.includes(code));
        console.log('❌ Missing accounts. Required:', requiredAccounts.length, 'Missing:', missingAccounts, 'Existing:', existingCodes.length);
        
        // ✅ AUTO-INITIALIZE: If accounts don't exist, initialize them automatically
        console.log('🔄 Auto-initializing missing accounts...');
        try {
          const { initializeDefaultAccounts } = await import('@/utils/initializeCoreAccounts');
          const result = await initializeDefaultAccounts(companyId);
          
          if (result.success) {
            console.log('✅ Accounts auto-initialized successfully');
            alert('✅ Gold Smith accounts were missing and have been auto-initialized!\n15 default accounts created. You can now proceed with pickup.');
            return true; // Accounts now exist
          } else {
            console.error('❌ Auto-initialization failed:', result.message);
            alert('❌ Accounts are missing and auto-initialization failed. Please go to Accounting page to initialize accounts manually.');
            return false;
          }
        } catch (initError) {
          console.error('❌ Auto-initialization error:', initError);
          alert('❌ Accounts are missing and auto-initialization failed. Please go to Accounting page to initialize accounts manually.');
          return false;
        }
      }
      
      return allAccountsExist;
    } catch (error) {
      console.error('Error checking account initialization:', error);
      return false;
    }
  };

  // ✅ UTILITY: Check if specific account exists
  const checkAccountExists = async (accountCode) => {
    try {
      const accountsPath = `${basePath}/accounts`;
      const accountsQuery = query(collection(db, accountsPath));
      const snapshot = await getDocs(accountsQuery);
      
      const accountExists = snapshot.docs.some(doc => doc.data().accountCode === accountCode);
      console.log(`🔍 Account ${accountCode} exists:`, accountExists);
      
      return accountExists;
    } catch (error) {
      console.error('Error checking account existence:', error);
      return false;
    }
  };

  const processManufacturerPayment = async (order, manufacturerData, commissionAmount, paymentMethod, manufacturerBillNumber, notes) => {
    try {
      // Create payment record
      const paymentData = {
        type: 'manufacturer_commission',
        orderId: order.id,
        manufacturerId: manufacturerData.id,
        manufacturerName: manufacturerData.manufacturerName || manufacturerData.name,
        amount: commissionAmount,
        paymentMethod,
        manufacturerBillNumber,
        notes,
        paymentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        companyId
      };

      const paymentRef = await addDoc(collection(db, `${basePath}/payments`), paymentData);

      // Create accounting entries
      const accountingEngine = new AccountingEngine(companyId);
      
      if (paymentMethod === 'credit') {
        // For credit payments: Debit Making Charges (5101), Credit Manufacturer-Specific Payable Account
        
        await accountingEngine.createEntry({
          date: new Date(),
          description: `Manufacturer making charges credit for Order ${order.id} - ${manufacturerData.manufacturerName || manufacturerData.name}`,
          transactionType: 'manufacturer_payment',
          referenceId: paymentRef.id,
          referenceType: 'payment',
          entries: [
            {
              accountCode: '5101', // Making Charges Expense
              accountName: 'Making Charges',
              debit: commissionAmount,
              credit: 0
            },
            {
              accountCode: manufacturerData.accountCode || '2101', // Manufacturer-Specific Payables Account
              accountName: `${manufacturerData.manufacturerName || manufacturerData.name} - Payables`,
              debit: 0,
              credit: commissionAmount
            }
          ]
        });
      } else {
        // For cash/bank payments: Debit Making Charges (5101), Credit Cash/Bank (1201/1202)
        const accountType = paymentMethod === 'cash' ? 'cash' : 'bank';
        const creditAccountCode = paymentMethod === 'cash' ? '1201' : '1202'; // Cash (1201) or Bank (1202) account
        const creditAccountName = paymentMethod === 'cash' ? 'Cash' : 'Bank Account';
        
        await accountingEngine.createEntry({
          date: new Date(),
          description: `Manufacturer making charges payment for Order ${order.id} - ${manufacturerData.manufacturerName || manufacturerData.name}`,
          transactionType: 'manufacturer_payment',
          referenceId: paymentRef.id,
          referenceType: 'payment',
          entries: [
            {
              accountCode: '5101', // Making Charges Expense
              accountName: 'Making Charges',
              debit: commissionAmount,
              credit: 0
            },
            {
              accountCode: creditAccountCode, // Cash or Bank
              accountName: creditAccountName,
              debit: 0,
              credit: commissionAmount
            }
          ]
        });
      }

      // Create receipt record
      const receiptData = {
        receiptNumber: `RCP-${Date.now()}`,
        type: 'manufacturer_payment',
        orderId: order.id,
        manufacturerId: manufacturerData.id,
        amount: commissionAmount,
        paymentMethod,
        manufacturerBillNumber,
        notes,
        receiptDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        companyId
      };

      await addDoc(collection(db, `${basePath}/receipts`), receiptData);

      return {
        paymentId: paymentRef.id,
        receiptNumber: receiptData.receiptNumber
      };

    } catch (error) {
      console.error('Error processing manufacturer payment:', error);
      throw error;
    }
  };

  const createAdditionalGoldChallan = async (order, manufacturerData, additionalGoldAmount) => {
    try {
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

      // Create additional challan document
      const challanData = {
        challanNumber,
        challanType: 'additional_gold',
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName || 'Unknown',
        manufacturerId: manufacturerData.id,
        manufacturerName: manufacturerData.manufacturerName || manufacturerData.name || 'Unknown',
        pureGoldAmount: additionalGoldAmount,
        purpose: `Additional gold payment for Order ${order.id.slice(-8)} - Final weight adjustments`,
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

      // Update order to track additional challan
      const orderRef = doc(db, ordersPath, order.id);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const currentAdditionalChallans = orderData.additionalChallans || [];
        await updateDoc(orderRef, {
          additionalChallans: [...currentAdditionalChallans, challanRef.id],
          additionalGoldIssued: (orderData.additionalGoldIssued || 0) + additionalGoldAmount,
          updatedAt: serverTimestamp()
        });
      }

      // Update manufacturer's goldInTransit (increase for additional gold)
      const currentGoldInTransit = manufacturerData.goldInTransit || 0;
      await updateDoc(doc(db, `${basePath}/manufacturers`, manufacturerData.id), {
        goldInTransit: currentGoldInTransit + additionalGoldAmount,
        updatedAt: serverTimestamp()
      });

      // Create accounting entry: Debit Gold in Transit, Credit Gold Bank
      const accountingEngine = new AccountingEngine(companyId);
      
      // Fetch gold bank data dynamically based on order.goldBankId
      let goldBankData = null;
      let goldBankAccountCode = '1101'; // Default fallback
      if (order.goldBankId) {
        const goldBankRef = doc(db, `${basePath}/goldbanks`, order.goldBankId);
        const goldBankSnap = await getDoc(goldBankRef);
        if (goldBankSnap.exists()) {
          goldBankData = { id: goldBankSnap.id, ...goldBankSnap.data() };
          goldBankAccountCode = goldBankData.accountCode || '1101';
        }
      }
      
      // Use manufacturer-specific gold transit account or fallback to global
      const goldTransitAccountCode = manufacturerData.goldTransitAccountCode || '1102';
      const goldTransitAccountName = manufacturerData.goldTransitAccountCode 
        ? `${manufacturerData.manufacturerName || manufacturerData.name} - Gold in Transit`
        : 'Gold in Transit';
      
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Additional gold challan ${challanNumber} for Order ${order.id.slice(-8)} - ${order.manufacturerName} - ${additionalGoldAmount.toFixed(3)}g pure gold`,
        transactionType: 'additional_challan',
        referenceId: challanRef.id,
        referenceType: 'challan',
        entries: [
          {
            accountCode: goldTransitAccountCode,
            accountName: goldTransitAccountName,
            debit: additionalGoldAmount,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: goldBankAccountCode, // Selected Gold Bank (dynamic)
            accountName: goldBankData ? `${goldBankData.bankName} - Gold Custody` : 'Gold Bank (Sharaf)',
            debit: 0,
            credit: additionalGoldAmount,
            balanceType: 'gold'
          }
        ]
      });

      console.log(`Additional challan ${challanNumber} created for ${additionalGoldAmount.toFixed(3)}g gold`);
      return challanRef.id;

    } catch (error) {
      console.error('Error creating additional challan:', error);
      throw error;
    }
  };

  const createRemainingGoldPaymentChallan = async (order, manufacturerData, paymentGoldAmount, selectedGoldBankId) => {
    try {
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

      // Create remaining payment challan document
      const challanData = {
        challanNumber,
        challanType: 'remaining_gold_payment',
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName || 'Unknown',
        manufacturerId: manufacturerData.id,
        manufacturerName: manufacturerData.manufacturerName || manufacturerData.name || 'Unknown',
        pureGoldAmount: paymentGoldAmount,
        purpose: `Remaining gold payment for Order ${order.id.slice(-8)} - Manufacturer used ${paymentGoldAmount.toFixed(3)}g extra gold from their stock`,
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

      // Update order to track remaining payment challan
      const orderRef = doc(db, ordersPath, order.id);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const orderData = orderSnap.data();
        const currentRemainingPayments = orderData.remainingGoldPayments || [];
        await updateDoc(orderRef, {
          remainingGoldPayments: [...currentRemainingPayments, challanRef.id],
          remainingGoldPaid: (orderData.remainingGoldPaid || 0) + paymentGoldAmount,
          updatedAt: serverTimestamp()
        });
      }

      // Update manufacturer's goldInTransit (increase for remaining payment - manufacturer owes us more)
      const currentGoldInTransit = manufacturerData.goldInTransit || 0;
      await updateDoc(doc(db, `${basePath}/manufacturers`, manufacturerData.id), {
        goldInTransit: currentGoldInTransit + paymentGoldAmount,
        updatedAt: serverTimestamp()
      });

      // Create accounting entry: Debit Gold in Transit, Credit Selected Gold Bank
      const accountingEngine = new AccountingEngine(companyId);
      
      // Fetch gold bank data dynamically based on selectedGoldBankId
      let goldBankData = null;
      let goldBankAccountCode = '1101'; // Default fallback
      if (selectedGoldBankId) {
        const goldBankRef = doc(db, `${basePath}/goldbanks`, selectedGoldBankId);
        const goldBankSnap = await getDoc(goldBankRef);
        if (goldBankSnap.exists()) {
          goldBankData = { id: goldBankSnap.id, ...goldBankSnap.data() };
          goldBankAccountCode = goldBankData.accountCode || '1101';
        }
      }
      
      // Use manufacturer-specific gold transit account or fallback to global
      const goldTransitAccountCode = manufacturerData.goldTransitAccountCode || '1102';
      const goldTransitAccountName = manufacturerData.goldTransitAccountCode 
        ? `${manufacturerData.manufacturerName || manufacturerData.name} - Gold in Transit`
        : 'Gold in Transit';
      
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Remaining gold payment challan ${challanNumber} for Order ${order.id.slice(-8)} - ${manufacturerData.manufacturerName} - ${paymentGoldAmount.toFixed(3)}g pure gold payment for extra gold used`,
        transactionType: 'remaining_gold_payment',
        referenceId: challanRef.id,
        referenceType: 'challan',
        entries: [
          {
            accountCode: goldTransitAccountCode, // Manufacturer's Gold in Transit
            accountName: goldTransitAccountName,
            debit: paymentGoldAmount,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: goldBankAccountCode, // Selected Gold Bank (dynamic)
            accountName: goldBankData ? `${goldBankData.bankName} - Gold Custody` : 'Gold Bank (Sharaf)',
            debit: 0,
            credit: paymentGoldAmount,
            balanceType: 'gold'
          }
        ]
      });

      console.log(`Remaining gold payment challan ${challanNumber} created for ${paymentGoldAmount.toFixed(3)}g gold payment`);
      return challanRef.id;

    } catch (error) {
      console.error('Error creating remaining gold payment challan:', error);
      throw error;
    }
  };

  const processGoldReturnFromManufacturer = async (order, manufacturerData, returnGoldAmount) => {
    try {
      // Create gold return record
      const returnData = {
        type: 'gold_return',
        orderId: order.id,
        manufacturerId: manufacturerData.id,
        manufacturerName: manufacturerData.manufacturerName || manufacturerData.name,
        goldAmount: returnGoldAmount,
        returnDate: serverTimestamp(),
        status: 'returned',
        notes: `Gold return from manufacturer for Order ${order.id.slice(-8)}`,
        createdAt: serverTimestamp(),
        companyId
      };

      const returnRef = await addDoc(collection(db, `${basePath}/goldReturns`), returnData);

      // Update manufacturer's goldInTransit (decrease for returned gold)
      const currentGoldInTransit = manufacturerData.goldInTransit || 0;
      await updateDoc(doc(db, `${basePath}/manufacturers`, manufacturerData.id), {
        goldInTransit: Math.max(0, currentGoldInTransit - returnGoldAmount),
        updatedAt: serverTimestamp()
      });

      // Create accounting entry: Debit Gold in Hand, Credit Gold in Transit
      const accountingEngine = new AccountingEngine(companyId);
      
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Gold return from manufacturer for Order ${order.id.slice(-8)} - ${order.manufacturerName} - ${returnGoldAmount.toFixed(3)}g pure gold`,
        transactionType: 'gold_return',
        referenceId: returnRef.id,
        referenceType: 'challan',
        entries: [
          {
            accountCode: '1104', // Gold in Hand (for customer gold deposits)
            accountName: 'Gold in Hand',
            debit: returnGoldAmount,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: manufacturerData.goldTransitAccountCode || '1102', // Manufacturer's Gold in Transit
            accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
            debit: 0,
            credit: returnGoldAmount,
            balanceType: 'gold'
          }
        ]
      });

      console.log(`Gold return processed: ${returnGoldAmount.toFixed(3)}g from manufacturer`);
      return returnRef.id;

    } catch (error) {
      console.error('Error processing gold return:', error);
      throw error;
    }
  };

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

      // Fetch gold banks
      const goldBanksQuery = query(collection(db, 'goldBanks'));
      const goldBanksUnsubscribe = onSnapshot(goldBanksQuery, (snapshot) => {
        const goldBanksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGoldBanks(goldBanksData);
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
        goldBanksUnsubscribe();
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
  // Simple status update function
  const updateOrderStatusSimple = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, ordersPath, orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (!orderSnap.exists()) {
        alert('Order not found');
        return;
      }

      const orderData = orderSnap.data();
      const oldStatus = orderData.status;

      // ✅ COMPREHENSIVE STATUS VALIDATION (Backend safety check)
      const normalizedOldStatus = ORDER_STATUS_FLOW[oldStatus] ? oldStatus : 'New Order';
      const validation = validateStatusTransition(normalizedOldStatus, newStatus);
      if (!validation.valid) {
        alert(validation.message);
        return;
      }

      // Special handling for status changes that require dialogs
      if (newStatus === 'Picked Up') {
        handleShowPickupDialog(orderData);
        return;
      }
      if (newStatus === 'Delivered') {
        handleShowDeliveryDialog(orderData);
        return;
      }
      if (newStatus === 'Challan Issued') {
        handleShowChallanConfirmation(orderData);
        return;
      }

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
        changedBy: 'Admin'
      });
      updateData.statusHistory = statusHistory;

      await updateDoc(orderRef, updateData);

      console.log(`Order ${orderId} status updated from ${oldStatus} to ${newStatus}`);
      
      // Refresh orders list
      fetchInitialData();
      
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

      // Fetch gold bank data
      let goldBankData = null;
      let goldBankAccountCode = '1101'; // Default fallback
      if (order.goldBankId) {
        const goldBankRef = doc(db, `${basePath}/goldbanks`, order.goldBankId);
        const goldBankSnap = await getDoc(goldBankRef);
        if (goldBankSnap.exists()) {
          goldBankData = { id: goldBankSnap.id, ...goldBankSnap.data() };
          goldBankAccountCode = goldBankData.accountCode || '1101';
        }
      }

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

      // Create accounting entry: Debit Gold in Transit, Credit Gold Bank
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
              accountCode: manufacturerData.goldTransitAccountCode || '1102', // Manufacturer's Gold in Transit
              accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
              debit: pureGoldAmount,
              credit: 0,
              balanceType: 'gold'
            },
            {
              accountCode: goldBankAccountCode, // Selected Gold Bank
              accountName: goldBankData ? `${goldBankData.bankName} - Gold Custody` : 'Gold Bank (Sharaf)',
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

  // ✅ Show Challan Confirmation Dialog
  const handleShowChallanConfirmation = (order) => {
    setChallanConfirmationData({
      order,
      selectedManufacturerId: order.manufacturerId || '',
      selectedGoldBankId: order.goldBankId || ''
    });
    setShowChallanConfirmationDialog(true);
  };

  // ✅ Show Pickup Dialog
  const handleShowPickupDialog = async (order) => {
    try {
      // Fetch all challans for this order to calculate gold history
      const challansPath = `${basePath}/challans`;
      const challansQuery = query(
        collection(db, challansPath),
        where('orderId', '==', order.id)
      );
      const challansSnapshot = await getDocs(challansQuery);
      
      let initialGoldProvided = 0;
      let additionalGoldProvided = 0;
      let totalGoldProvided = 0;
      const additionalChallans = [];
      
      challansSnapshot.forEach((doc) => {
        const challan = doc.data();
        if (challan.challanType === 'gold_withdrawal') {
          initialGoldProvided = challan.pureGoldAmount || 0;
        } else if (challan.challanType === 'additional_gold') {
          additionalGoldProvided += challan.pureGoldAmount || 0;
          additionalChallans.push({
            challanNumber: challan.challanNumber,
            amount: challan.pureGoldAmount || 0,
            issuedDate: challan.issuedDate?.toDate?.() || new Date(challan.issuedDate)
          });
        }
      });
      
      totalGoldProvided = initialGoldProvided + additionalGoldProvided;
      
      // Calculate final pure gold used (if finished weight exists)
      let finalPureGoldUsed = 0;
      let goldDifference = 0;
      if (order.finishedWeight) {
        finalPureGoldUsed = calculatePureGold(parseFloat(order.finishedWeight), order.karat || '18k');
        goldDifference = totalGoldProvided - finalPureGoldUsed;
      }
      
      setPickupOrder({
        ...order,
        goldHistory: {
          initialGoldProvided,
          additionalGoldProvided,
          totalGoldProvided,
          additionalChallans,
          finalPureGoldUsed,
          goldDifference
        }
      });
      
      setPickupData({
        manufacturerId: order.manufacturerId || '',
        finalWeight: order.finishedWeight || order.weight || '',
        commissionRate: '',
        manufacturerBillNumber: '',
        paymentMethod: 'cash',
        createAdditionalChallan: false,
        processGoldReturn: false,
        generateRemainingGoldPayment: false, // Reset new field
        remainingGoldPaymentBankId: '', // Reset new field
        notes: ''
      });
      setShowPickupDialog(true);
    } catch (error) {
      console.error('Error fetching challan data for pickup:', error);
      // Fallback to original behavior
      setPickupOrder(order);
      setPickupData({
        manufacturerId: order.manufacturerId || '',
        finalWeight: order.finishedWeight || order.weight || '',
        commissionRate: '',
        manufacturerBillNumber: '',
        paymentMethod: 'cash',
        createAdditionalChallan: false,
        processGoldReturn: false,
        generateRemainingGoldPayment: false, // Reset new field
        remainingGoldPaymentBankId: '', // Reset new field
        notes: ''
      });
      setShowPickupDialog(true);
    }
  };

  // ✅ Handle Show Delivery Dialog
  const handleShowDeliveryDialog = async (order) => {
    try {
      setDeliveryOrder(order);
      setDeliveryData({
        deliveryDate: new Date().toISOString().split('T')[0],
        finalWeight: order.finishedWeight || order.weight || '',
        commissionRate: '',
        goldPrice: '',
        paymentMethod: 'cash',
        goldBankId: '',
        notes: ''
      });
      setShowDeliveryDialog(true);
    } catch (error) {
      console.error('Error preparing delivery dialog:', error);
      alert('Error preparing delivery dialog');
    }
  };

  // ✅ Download Existing Challan
  const handleDownloadChallan = async (order) => {
    try {
      if (!order.challanId) {
        alert('Challan ID not found');
        return;
      }

      // Get challan data
      const challanRef = doc(db, `${basePath}/challans`, order.challanId);
      const challanSnap = await getDoc(challanRef);
      
      if (!challanSnap.exists()) {
        alert('Challan not found');
        return;
      }

      const challanData = challanSnap.data();
      
      // Get manufacturer data
      const manufacturerRef = doc(db, `${basePath}/manufacturers`, order.manufacturerId);
      const manufacturerSnap = await getDoc(manufacturerRef);
      const manufacturerData = manufacturerSnap.exists() ? manufacturerSnap.data() : null;

      // Get customer data
      const customerRef = doc(db, `${basePath}/customers`, order.customerId);
      const customerSnap = await getDoc(customerRef);
      const customerData = customerSnap.exists() ? customerSnap.data() : null;

      // Generate and download PDF
      await challanGenerator.downloadChallan(challanData, order, manufacturerData, customerData);

    } catch (error) {
      console.error('Error downloading challan:', error);
      alert('Error downloading challan: ' + error.message);
    }
  };

  // ✅ Confirm and Issue Challan from Dialog
  const handleConfirmIssueChallan = async () => {
    const { order, selectedManufacturerId, selectedGoldBankId } = challanConfirmationData;
    
    try {
      // Update order with selected manufacturer and gold bank if changed
      if (selectedManufacturerId !== order.manufacturerId || selectedGoldBankId !== order.goldBankId) {
        const orderRef = doc(db, ordersPath, order.id);
        await updateDoc(orderRef, {
          manufacturerId: selectedManufacturerId,
          goldBankId: selectedGoldBankId,
          manufacturerName: selectedManufacturerId ? getManufacturerName(selectedManufacturerId) : '',
          goldBankName: selectedGoldBankId ? getGoldBankName(selectedGoldBankId) : '',
          updatedAt: serverTimestamp()
        });
        
        // Update the order object for challan generation
        order.manufacturerId = selectedManufacturerId;
        order.goldBankId = selectedGoldBankId;
      }

      // Close confirmation dialog
      setShowChallanConfirmationDialog(false);
      setChallanConfirmationData(null);

      // Issue the challan
      await handleIssueChallan(order);

    } catch (error) {
      console.error('Error confirming challan:', error);
      alert('Error issuing challan: ' + error.message);
    }
  };

  // ✅ Confirm Pickup and Process Payment
  const handleConfirmPickup = async () => {
    try {
      const { manufacturerId, finalWeight, commissionRate, manufacturerBillNumber, paymentMethod, createAdditionalChallan, processGoldReturn, generateRemainingGoldPayment, remainingGoldPaymentBankId, notes } = pickupData;
      const order = pickupOrder;

      if (!manufacturerId) {
        alert('Please select a manufacturer');
        return;
      }

      if (!finalWeight || parseFloat(finalWeight) <= 0) {
        alert('Please enter a valid final weight');
        return;
      }

      if (!commissionRate || parseFloat(commissionRate) <= 0) {
        alert('Please enter a valid commission rate');
        return;
      }

      if (!manufacturerBillNumber.trim()) {
        alert('Please enter manufacturer bill number');
        return;
      }

      if (generateRemainingGoldPayment && !remainingGoldPaymentBankId) {
        alert('Please select a gold bank for the remaining gold payment');
        return;
      }

      // ✅ CHECK: Ensure default accounts are initialized before recording transactions
      const accountsInitialized = await checkAccountsInitialized();
      if (!accountsInitialized) {
        alert('❌ Default accounts not initialized. Please initialize accounts from the Accounting page first.');
        return;
      }

      const finalWeightValue = parseFloat(finalWeight) || 0;
      const commissionRateValue = parseFloat(commissionRate) || 0;

      // Calculate pure gold for final product
      const finalPureGold = calculatePureGold(finalWeightValue, order.karat || '18k');

      // Get total gold provided to manufacturer (initial + additional challans)
      const totalGoldProvided = order.goldHistory?.totalGoldProvided || calculatePureGold(parseFloat(order.totalWeight) || 0, order.karat || '18k');

      // Calculate difference (total provided - final used)
      const goldDifference = totalGoldProvided - finalPureGold;

      // Calculate commission amount (based on final weight)
      const commissionAmount = finalWeightValue * commissionRateValue;

      // Get manufacturer data
      const manufacturerRef = doc(db, `${basePath}/manufacturers`, manufacturerId);
      const manufacturerSnap = await getDoc(manufacturerRef);
      if (!manufacturerSnap.exists()) {
        alert('Manufacturer not found');
        return;
      }
      const manufacturerData = { id: manufacturerSnap.id, ...manufacturerSnap.data() };

      // Process commission payment
      const paymentReceipt = await processManufacturerPayment(
        order,
        manufacturerData,
        commissionAmount,
        paymentMethod,
        manufacturerBillNumber,
        notes
      );

      // Handle remaining gold payment challan if manufacturer used extra gold and checkbox checked
      if (goldDifference < 0 && generateRemainingGoldPayment) {
        if (!remainingGoldPaymentBankId) {
          alert('Please select a gold bank for the remaining gold payment');
          return;
        }
        await createRemainingGoldPaymentChallan(order, manufacturerData, goldDifference, remainingGoldPaymentBankId);
      }

      // Handle gold return if manufacturer used less gold than provided
      if (goldDifference > 0 && processGoldReturn) {
        await processGoldReturnFromManufacturer(order, manufacturerData, goldDifference);
      }

      // Update gold transit (reduce by final pure gold used)
      const currentGoldInTransit = manufacturerData.goldInTransit || 0;
      await updateDoc(manufacturerRef, {
        goldInTransit: Math.max(0, currentGoldInTransit - finalPureGold),
        updatedAt: serverTimestamp()
      });

      // ✅ ACCOUNTING: Record finished goods receipt from manufacturer
      // Debit: Finished Goods Inventory (1103), Credit: Gold in Transit (1102)
      const accountingEngine = new AccountingEngine(companyId);
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Finished goods receipt from manufacturer for Order ${order.id} - ${finalPureGold.toFixed(3)}g pure gold`,
        transactionType: 'finished_goods_receipt',
        referenceId: order.id,
        referenceType: 'order',
        entries: [
          {
            accountCode: '1103', // Finished Goods Inventory
            accountName: 'Finished Goods Inventory',
            debit: finalPureGold,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: manufacturerData.goldTransitAccountCode || '1102', // Manufacturer's Gold in Transit
            accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
            debit: 0,
            credit: finalPureGold,
            balanceType: 'gold'
          }
        ]
      });

      // Update order status to "Picked Up"
      const orderRef = doc(db, ordersPath, order.id);
      await updateDoc(orderRef, {
        status: 'Picked Up',
        pickupDate: serverTimestamp(),
        finishedWeight: finalWeightValue,
        finalPureGold,
        manufacturerCommission: commissionAmount,
        manufacturerBillNumber,
        paymentMethod,
        goldDifference,
        additionalChallanCreated: false,
        remainingGoldPaymentCreated: goldDifference < 0 && generateRemainingGoldPayment,
        goldReturnProcessed: goldDifference > 0 && processGoldReturn,
        pickupNotes: notes,
        updatedAt: serverTimestamp(),
        lastStatusUpdate: serverTimestamp(),
        statusHistory: [
          ...(order.statusHistory || []),
          {
            from: order.status,
            to: 'Picked Up',
            changedAt: new Date(),
            finalWeight: finalWeightValue,
            finalPureGold,
            commissionAmount,
            goldDifference,
            manufacturerBillNumber,
            paymentMethod
          }
        ]
      });

      // Close dialog and refresh
      setShowPickupDialog(false);
      setPickupOrder(null);
      setPickupData({
        manufacturerId: '',
        finalWeight: '',
        commissionRate: '',
        manufacturerBillNumber: '',
        paymentMethod: 'cash',
        createAdditionalChallan: false,
        processGoldReturn: false,
        notes: ''
      });

      alert(`Order picked up successfully!\nCommission: $${commissionAmount.toFixed(2)}\nFinal Weight: ${finalWeightValue}g\nPure Gold Used: ${finalPureGold.toFixed(3)}g`);
      fetchInitialData();

    } catch (error) {
      console.error('Error processing pickup:', error);
      alert('Error processing pickup: ' + error.message);
    }
  };

  // ✅ Handle Confirm Delivery
  const handleConfirmDelivery = async () => {
    try {
      const { deliveryDate, finalWeight, commissionRate, goldPrice, paymentMethod, goldBankId, notes } = deliveryData;
      const order = deliveryOrder;

      if (!finalWeight || parseFloat(finalWeight) <= 0) {
        alert('Please enter a valid final weight');
        return;
      }

      if (!commissionRate || parseFloat(commissionRate) <= 0) {
        alert('Please enter a valid commission rate');
        return;
      }

      if (!goldPrice || parseFloat(goldPrice) <= 0) {
        alert('Please enter a valid gold price');
        return;
      }

      if (!goldBankId) {
        alert('Please select a gold bank for customer gold deposit');
        return;
      }

      // ✅ CHECK: Ensure default accounts are initialized before recording transactions
      const accountsInitialized = await checkAccountsInitialized();
      if (!accountsInitialized) {
        alert('❌ Default accounts not initialized. Please initialize accounts from the Accounting page first.');
        return;
      }

      const finalWeightValue = parseFloat(finalWeight) || 0;
      const commissionRateValue = parseFloat(commissionRate) || 0;
      const goldPriceValue = parseFloat(goldPrice) || 0;

      // Calculate pure gold for final product
      const finalPureGold = calculatePureGold(finalWeightValue, order.karat || '18k');

      // Calculate commission amount in currency (for display)
      const commissionAmount = finalWeightValue * commissionRateValue;

      // Convert commission to pure gold equivalent
      const commissionGold = commissionAmount / goldPriceValue;

      // Calculate total pure gold owed (commission gold + product gold)
      const totalPureGoldOwed = commissionGold + finalPureGold;

      // Get customer data
      const customerRef = doc(db, `${basePath}/customers`, order.customerId);
      const customerSnap = await getDoc(customerRef);
      if (!customerSnap.exists()) {
        alert('Customer not found');
        return;
      }
      const customerData = { id: customerSnap.id, ...customerSnap.data() };

      // Calculate customer's prior balance (what they owed before this transaction)
      const priorBalance = customerData.currentPureGoldBalance || 0;

      // Get gold bank data
      const goldBankRef = doc(db, `${basePath}/goldbanks`, goldBankId);
      const goldBankSnap = await getDoc(goldBankRef);
      if (!goldBankSnap.exists()) {
        alert('Gold bank not found');
        return;
      }
      const goldBankData = { id: goldBankSnap.id, ...goldBankSnap.data() };

      // ✅ INVOICE GENERATION: Create invoice document and PDF
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

      // Create invoice document
      const invoiceData = {
        invoiceNumber,
        orderId: order.id,
        customerId: order.customerId,
        customerName: customerData.customerName || customerData.name,
        customerCode: customerData.accountCode,
        customerPhone: customerData.phone || customerData.customerPhone,
        customerAddress: customerData.address,
        productName: order.productName,
        productWeight: finalWeightValue,
        karat: order.karat || '18k',
        commissionRate: commissionRateValue,
        goldPrice: goldPriceValue,
        productPureGold: finalPureGold,
        commissionGold: commissionGold,
        priorBalance: priorBalance, // What customer owed before this transaction
        currentTransaction: totalPureGoldOwed, // This invoice amount
        totalPureGold: totalPureGoldOwed + priorBalance, // Total amount customer owes now
        paymentReceived: totalPureGoldOwed, // What was paid for this delivery
        balanceDue: priorBalance, // What remains due from prior balance
        paymentMethod,
        goldBankId,
        goldBankName: goldBankData.name,
        status: 'issued',
        issuedDate: serverTimestamp(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId
      };

      // Save invoice to Firestore
      const invoiceRef = await addDoc(collection(db, invoicesPath), invoiceData);

      // Generate and download invoice PDF
      try {
        await invoiceGenerator.downloadInvoice(invoiceData, order, customerData, goldPriceValue);
        console.log('Invoice PDF downloaded successfully');
      } catch (pdfError) {
        console.error('Error generating invoice PDF:', pdfError);
        // Continue with delivery process even if PDF fails
      }

      // Process customer payment (in gold terms)
      const paymentReceipt = await processCustomerPayment(
        order,
        customerData,
        totalPureGoldOwed, // Total pure gold owed
        paymentMethod,
        notes,
        goldPriceValue // Pass gold price for conversion
      );

      // ✅ ACCOUNTING: Record delivery transaction
      // Debit: Customer Receivables, Credit: Sales Revenue, Credit: Finished Goods Inventory, Debit: Gold in Hand
      // All in pure gold terms
      const accountingEngine = new AccountingEngine(companyId);
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Invoice ${invoiceNumber} for Order ${order.id} - ${totalPureGoldOwed.toFixed(3)}g pure gold total owed`,
        transactionType: 'customer_invoice',
        referenceId: invoiceRef.id, // Reference the invoice document
        referenceType: 'invoice',
        entries: [
          {
            accountCode: customerData.accountCode || `CUST-${customerData.id.slice(-4).padStart(4, '0')}`,
            accountName: `${customerData.customerName} - Receivables`,
            debit: totalPureGoldOwed,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: '4101', // Sales Revenue
            accountName: 'Sales Revenue',
            debit: 0,
            credit: totalPureGoldOwed,
            balanceType: 'gold'
          },
          {
            accountCode: '1103', // Finished Goods Inventory
            accountName: 'Finished Goods Inventory',
            debit: 0,
            credit: finalPureGold,
            balanceType: 'gold'
          },
          {
            accountCode: '1104', // Gold in Hand
            accountName: 'Gold in Hand',
            debit: finalPureGold,
            credit: 0,
            balanceType: 'gold'
          }
        ]
      });

      // Update order status to "Delivered"
      const orderRef = doc(db, ordersPath, order.id);
      await updateDoc(orderRef, {
        status: 'Delivered',
        deliveryDate: serverTimestamp(),
        finalDeliveryWeight: finalWeightValue,
        finalDeliveryPureGold: finalPureGold,
        deliveryCommissionGold: commissionGold, // Store commission in gold
        totalPureGoldOwed, // Store total gold owed
        goldPrice: goldPriceValue,
        paymentMethod,
        goldBankId,
        deliveryNotes: notes,
        invoiceId: invoiceRef.id, // Reference to invoice document
        invoiceNumber: invoiceNumber, // Invoice number for display
        updatedAt: serverTimestamp(),
        lastStatusUpdate: serverTimestamp(),
        statusHistory: [
          ...(order.statusHistory || []),
          {
            from: order.status,
            to: 'Delivered',
            changedAt: new Date(),
            finalWeight: finalWeightValue,
            finalPureGold,
            commissionGold, // Store commission in gold
            totalPureGoldOwed, // Store total gold owed
            goldPrice: goldPriceValue,
            goldBankId,
            paymentMethod,
            invoiceId: invoiceRef.id,
            invoiceNumber: invoiceNumber
          }
        ]
      });

      // Close dialog and refresh
      setShowDeliveryDialog(false);
      setDeliveryOrder(null);
      setDeliveryData({
        deliveryDate: new Date().toISOString().split('T')[0],
        finalWeight: '',
        commissionRate: '',
        goldPrice: '',
        paymentMethod: 'cash',
        goldBankId: '',
        notes: ''
      });

      alert(`Order delivered successfully!\nInvoice: ${invoiceNumber}\nCommission Gold: ${commissionGold.toFixed(3)}g pure\nProduct Gold: ${finalPureGold.toFixed(3)}g pure\nTotal Gold Owed: ${totalPureGoldOwed.toFixed(3)}g pure\nFinal Weight: ${finalWeightValue}g\n\nInvoice PDF has been downloaded.`);
      fetchInitialData();

    } catch (error) {
      console.error('Error processing delivery:', error);
      alert('Error processing delivery: ' + error.message);
    }
  };

  // ✅ Process Customer Payment (Gold-based)
  const processCustomerPayment = async (order, customerData, totalPureGoldOwed, paymentMethod, notes, goldPrice) => {
    try {
      // Create payment record (in gold terms)
      const paymentData = {
        type: 'customer_payment',
        orderId: order.id,
        customerId: customerData.id,
        customerName: customerData.customerName || customerData.name,
        amount: totalPureGoldOwed, // Pure gold amount
        amountType: 'gold', // Specify this is gold
        paymentMethod,
        goldPrice, // Store gold price for reference
        notes,
        paymentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        companyId
      };

      const paymentRef = await addDoc(collection(db, `${basePath}/payments`), paymentData);

      // Create accounting entries (all in gold terms)
      const accountingEngine = new AccountingEngine(companyId);

      if (paymentMethod === 'credit') {
        // For credit: Revenue already recognized at delivery, receivable already created
        // No additional accounting entry needed for credit payment
        await accountingEngine.createEntry({
          date: new Date(),
          description: `Customer credit established for Order ${order.id} - ${totalPureGoldOwed.toFixed(3)}g pure gold receivable`,
          transactionType: 'customer_credit',
          referenceId: paymentRef.id,
          referenceType: 'payment',
          entries: [
            // No entries - revenue and receivable already recorded at delivery
          ]
        });
      } else {
        // For cash payment: Customer deposits additional gold to settle receivable
        // Debit Gold in Hand (gold), Credit Customer Receivables (gold)
        await accountingEngine.createEntry({
          date: new Date(),
          description: `Customer cash payment for Order ${order.id} - ${totalPureGoldOwed.toFixed(3)}g pure gold equivalent`,
          transactionType: 'customer_payment',
          referenceId: paymentRef.id,
          referenceType: 'payment',
          entries: [
            {
              accountCode: '1104', // Gold in Hand (customer gold deposit)
              accountName: 'Gold in Hand',
              debit: totalPureGoldOwed,
              credit: 0,
              balanceType: 'gold'
            },
            {
              accountCode: customerData.accountCode || `CUST-${customerData.id.slice(-4).padStart(4, '0')}`,
              accountName: `${customerData.customerName || customerData.name} - Receivables`,
              debit: 0,
              credit: totalPureGoldOwed,
              balanceType: 'gold'
            }
          ]
        });
      }

      // Create receipt record
      const receiptData = {
        receiptNumber: `RCP-${Date.now()}`,
        type: 'customer_payment',
        orderId: order.id,
        customerId: customerData.id,
        amount: totalPureGoldOwed,
        amountType: 'gold',
        paymentMethod,
        goldPrice,
        notes,
        receiptDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        companyId
      };

      await addDoc(collection(db, `${basePath}/receipts`), receiptData);

      return {
        paymentId: paymentRef.id,
        receiptNumber: receiptData.receiptNumber
      };

    } catch (error) {
      console.error('Error processing customer payment:', error);
      throw error;
    }
  };

  // ✅ TASK 7.2: Issue Additional Gold Challan
  const handleIssueAdditionalChallan = async (order) => {
    try {
      // Fetch challan statistics for this order
      const challansPath = `${basePath}/challans`;
      const challansQuery = query(
        collection(db, challansPath),
        where('orderId', '==', order.id)
      );
      const challansSnapshot = await getDocs(challansQuery);
      
      let additionalChallansCount = 0;
      let totalAdditionalGold = 0;
      
      challansSnapshot.forEach((doc) => {
        const challan = doc.data();
        if (challan.challanType === 'additional_gold') {
          additionalChallansCount++;
          totalAdditionalGold += challan.pureGoldAmount || 0;
        }
      });

      // Update order with challan statistics
      const orderWithStats = {
        ...order,
        additionalChallansCount,
        totalAdditionalGold
      };

      setAdditionalChallanData({
        order: orderWithStats,
        challanType: 'additional_gold',
        goldAmount: '',
        selectedGoldBankId: order.goldBankId || '', // Default to order's gold bank
        reason: 'Additional gold needed for production',
        notes: ''
      });
      setShowAdditionalChallanDialog(true);
    } catch (error) {
      console.error('Error fetching challan statistics:', error);
      // Fallback to original order if stats fetch fails
      setAdditionalChallanData({
        order,
        challanType: 'additional_gold',
        goldAmount: '',
        selectedGoldBankId: order.goldBankId || '', // Default to order's gold bank
        reason: 'Additional gold needed for production',
        notes: ''
      });
      setShowAdditionalChallanDialog(true);
    }
  };

  // ✅ TASK 7.3: Record Gold Return
  const handleRecordGoldReturn = async (order) => {
    try {
      // Fetch challan statistics for this order
      const challansPath = `${basePath}/challans`;
      const challansQuery = query(
        collection(db, challansPath),
        where('orderId', '==', order.id)
      );
      const challansSnapshot = await getDocs(challansQuery);
      
      let additionalChallansCount = 0;
      let totalAdditionalGold = 0;
      
      challansSnapshot.forEach((doc) => {
        const challan = doc.data();
        if (challan.challanType === 'additional_gold') {
          additionalChallansCount++;
          totalAdditionalGold += challan.pureGoldAmount || 0;
        }
      });

      // Update order with challan statistics
      const orderWithStats = {
        ...order,
        additionalChallansCount,
        totalAdditionalGold
      };

      setAdditionalChallanData({
        order: orderWithStats,
        challanType: 'gold_return',
        goldAmount: '',
        selectedGoldBankId: order.goldBankId || '', // Default to order's gold bank
        reason: 'Excess gold returned by manufacturer',
        notes: ''
      });
      setShowAdditionalChallanDialog(true);
    } catch (error) {
      console.error('Error fetching challan statistics:', error);
      // Fallback to original order if stats fetch fails
      setAdditionalChallanData({
        order,
        challanType: 'gold_return',
        goldAmount: '',
        selectedGoldBankId: order.goldBankId || '', // Default to order's gold bank
        reason: 'Excess gold returned by manufacturer',
        notes: ''
      });
      setShowAdditionalChallanDialog(true);
    }
  };

  // ✅ TASK 7.2 & 7.3: Process Additional Challan or Gold Return
  const processAdditionalChallan = async () => {
    try {
      const { order, challanType, goldAmount, selectedGoldBankId, reason, notes } = additionalChallanData;

      if (!goldAmount || parseFloat(goldAmount) <= 0) {
        alert('Please enter a valid gold amount');
        return;
      }

      if (!selectedGoldBankId) {
        alert('Please select a gold bank');
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

      // Fetch customer data
      const customerRef = doc(db, `${basePath}/customers`, order.customerId);
      const customerSnap = await getDoc(customerRef);
      const customerData = customerSnap.exists() ? { id: customerSnap.id, ...customerSnap.data() } : null;

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
          // Additional Gold: Debit Gold in Transit, Credit Gold Bank
          
          await accountingEngine.createEntry({
            date: new Date(),
            description: `Additional gold challan ${challanNumber} for Order ${order.id.slice(-8)} - ${order.manufacturerName}`,
            transactionType: 'additional_gold_challan',
            referenceId: challanRef.id,
            referenceType: 'challan',
            entries: [
              {
                accountCode: manufacturerData.goldTransitAccountCode || '1102', // Manufacturer's Gold in Transit
                accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
                debit: pureGoldAmount,
                credit: 0,
                balanceType: 'gold'
              },
              {
                accountCode: '1101', // Gold Bank (Sharaf)
                accountName: 'Gold Bank (Sharaf)',
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
          // Gold Return: Debit Selected Gold Bank, Credit 1102 (Gold in Transit) - same logic as main challan
          // Get the selected gold bank data to determine the account code (same logic as main challan)
          let goldBankAccountCode = '1101'; // Default fallback
          let goldBankAccountName = 'Gold Bank (Sharaf)'; // Default fallback

          if (selectedGoldBankId) {
            const goldBankRef = doc(db, 'goldBanks', selectedGoldBankId);
            const goldBankSnap = await getDoc(goldBankRef);
            if (goldBankSnap.exists()) {
              const goldBankData = goldBankSnap.data();
              goldBankAccountCode = goldBankData.accountCode || `1101-BANK-${selectedGoldBankId.slice(-3).toUpperCase()}`;
              goldBankAccountName = `${goldBankData.bankName} (${goldBankData.location || 'N/A'})`;
            }
          }

          await accountingEngine.createEntry({
            date: new Date(),
            description: `Gold return receipt ${challanNumber} for Order ${order.id.slice(-8)} - ${order.manufacturerName}`,
            transactionType: 'gold_return_receipt',
            referenceId: challanRef.id,
            referenceType: 'challan',
            entries: [
              {
                accountCode: '1101', // Gold Bank (Sharaf)
                accountName: 'Gold Bank (Sharaf)',
                debit: pureGoldAmount,
                credit: 0,
                balanceType: 'gold'
              },
              {
                accountCode: manufacturerData.goldTransitAccountCode || '1102', // Manufacturer's Gold in Transit
                accountName: `${manufacturerData.manufacturerName} - Gold in Transit`,
                debit: 0,
                credit: pureGoldAmount,
                balanceType: 'gold'
              }
            ]
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
      
      await challanGenerator.downloadChallan(challanPdfData, order, manufacturerData, customerData);

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
              accountCode: '1301', // Use parent Customer Receivables account
              accountName: 'Customer Receivables',
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
            accountCode: '1301', // Use parent Customer Receivables account
            accountName: 'Customer Receivables',
            debit: 0,
            credit: goldPortion,
            balanceType: 'gold'
          });
        }

        // USD portion: Debit Cash (1201), Credit Customer Receivable (1301)
        if (usdPortion > 0) {
          entries.push({
            accountCode: '1201',
            accountName: 'Cash in Hand',
            debit: usdPortion,
            credit: 0,
            balanceType: 'usd'
          });
          entries.push({
            accountCode: '1301', // Use parent Customer Receivables account
            accountName: 'Customer Receivables',
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

  // Get gold bank name by ID
  const getGoldBankName = (id) => {
    const goldBank = goldBanks.find(bank => bank.id === id);
    return goldBank ? `${goldBank.bankName} (${goldBank.location || 'N/A'})` : 'Unknown';
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
      if (!newOrder.goldBankId) {
        alert('Please select a gold bank');
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
        
        // Gold Bank Details (required for challan)
        goldBankId: newOrder.goldBankId || '',
        goldBankName: newOrder.goldBankId ? getGoldBankName(newOrder.goldBankId) : '',
        
        // Gold Movement Tracking
        challanIssued: false,
        challanNumber: '',
        goldIssuedToManufacturer: 0,
        additionalGoldIssued: 0,
        goldReturnedByManufacturer: 0,
        additionalChallans: [], // Array to track additional challan IDs
        
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
            <div className="text-2xl font-bold text-blue-600">{orderStats.byStatus['New Order'] || 0}</div>
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
                {sortOrder === 'asc' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
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
                    {/* ✅ TASK 6.4: Status Column */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={ORDER_STATUS_FLOW[order.status] ? order.status : 'New Order'}
                        onChange={(e) => {
                          const newStatus = e.target.value;

                          // Don't update if selecting the same status
                          if (newStatus === order.status) return;

                          // ✅ COMPREHENSIVE STATUS VALIDATION
                          const normalizedCurrentStatus = ORDER_STATUS_FLOW[order.status] ? order.status : 'New Order';
                          const validation = validateStatusTransition(normalizedCurrentStatus, newStatus);
                          if (!validation.valid) {
                            alert(validation.message);
                            e.target.value = ORDER_STATUS_FLOW[order.status] ? order.status : 'New Order'; // Reset dropdown
                            return;
                          }

                          // Special handling for Challan Issued -> show challan confirmation dialog
                          if (newStatus === 'Challan Issued') {
                            handleShowChallanConfirmation(order);
                          }
                          // Special handling for Picked Up -> show pickup dialog
                          else if (newStatus === 'Picked Up') {
                            handleShowPickupDialog(order);
                          }
                          // Special handling for Delivered -> show delivery dialog
                          else if (newStatus === 'Delivered') {
                            handleShowDeliveryDialog(order);
                          }
                          else {
                            updateOrderStatusSimple(order.id, newStatus);
                          }
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded border ${ORDER_STATUS_FLOW[order.status]?.color || ORDER_STATUS_FLOW['New Order']?.color || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                      >
                        {getValidNextStatuses(order.status).map(status => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_FLOW[status]?.label || status}
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
                        {/* ✅ TASK 7.1: Issue/Download Challan Button */}
                        <button
                          onClick={() => order.challanNumber ? handleDownloadChallan(order) : handleShowChallanConfirmation(order)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title={order.challanNumber ? `Download Challan ${order.challanNumber}` : "Issue Gold Withdrawal Challan"}
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                        {order.challanNumber && (
                          <span className="text-xs text-yellow-700 font-semibold ml-1" title={`Challan: ${order.challanNumber}`}>
                            📄 {order.challanNumber}
                          </span>
                        )}
                        {/* ✅ TASK 7.2: Issue Additional Gold Challan Button */}
                        {order.challanNumber && (
                          <button
                            onClick={() => handleIssueAdditionalChallan(order)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Issue Additional Gold Challan"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        {/* ✅ TASK 7.3: Record Gold Return Button */}
                        {order.challanNumber && (
                          <button
                            onClick={() => handleRecordGoldReturn(order)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Record Gold Return from Manufacturer"
                          >
                            <TrendingUp className="w-4 h-4 transform rotate-180" />
                          </button>
                        )}
                        {/* ✅ TASK 9.1: Generate Invoice Button */}
                        {!order.invoiceNumber && (
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
                                <span>Gold Bank:</span>
                                <span className="font-semibold">{newOrder.goldBankId ? getGoldBankName(newOrder.goldBankId) : 'Not Selected'}</span>
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

                {/* Manufacturer, Gold Bank & Delivery Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      Gold Bank <span className="text-red-500 text-xs">*</span>
                    </label>
                    <select
                      value={newOrder.goldBankId}
                      onChange={(e) => setNewOrder({...newOrder, goldBankId: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Select Gold Bank</option>
                      {goldBanks
                        .filter(bank => bank.isActive !== false)
                        .map(goldBank => (
                          <option key={goldBank.id} value={goldBank.id}>
                            {goldBank.bankName} ({goldBank.location || 'N/A'})
                          </option>
                        ))}
                      {goldBanks.length === 0 && (
                        <option disabled>No gold banks available</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Bank from which gold will be issued</p>
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
                        goldBankId: '',
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
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-green-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <Truck className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Product Delivery & Gold Deposit</h3>
                      <p className="text-green-100 text-sm">Order #{deliveryOrder.id?.slice(-8)}</p>
                    </div>
                  </div>
                  {/* Dev Mode Toggle */}
                  <button
                    onClick={toggleDevMode}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      devMode
                        ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400'
                        : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                    }`}
                    title={devMode ? 'Disable Dev Mode (Hide Section Badges)' : 'Enable Dev Mode (Show Section Badges)'}
                  >
                    {devMode ? 'DEV' : 'PROD'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Section 1: Order Details */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                  <SectionBadge id={1} label="Order Details" devMode={devMode} color="gray" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Customer</p>
                      <p className="font-semibold">{deliveryOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Product</p>
                      <p className="font-semibold">{deliveryOrder.weight}g {deliveryOrder.karat} {deliveryOrder.productName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Finished Weight</p>
                      <p className="font-semibold">{deliveryOrder.finishedWeight || deliveryOrder.weight}g</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Status</p>
                      <p className="font-semibold">{deliveryOrder.status}</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Delivery Information */}
                <div className="space-y-4 mb-6">
                  <SectionBadge id={2} label="Delivery Information" devMode={devMode} color="green" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Final Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Jewelry Weight (g) *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={deliveryData.finalWeight}
                        onChange={(e) => setDeliveryData({...deliveryData, finalWeight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., 750.000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Actual weight of jewelry delivered to customer
                      </p>
                    </div>

                    {/* Commission Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commission Rate ($/gram) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={deliveryData.commissionRate}
                        onChange={(e) => setDeliveryData({...deliveryData, commissionRate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., 1.50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Making charges per gram of finished product
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gold Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gold Price ($/gram pure gold) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={deliveryData.goldPrice}
                        onChange={(e) => setDeliveryData({...deliveryData, goldPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., 65.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current market price of pure gold per gram
                      </p>
                    </div>

                    {/* Gold Bank Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gold Bank for Customer Deposit *
                      </label>
                      <select
                        value={deliveryData.goldBankId}
                        onChange={(e) => setDeliveryData({...deliveryData, goldBankId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select Gold Bank</option>
                        {goldBanks.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.bankName} ({bank.location || 'N/A'})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Bank where customer gold will be deposited
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={deliveryData.paymentMethod}
                        onChange={(e) => setDeliveryData({...deliveryData, paymentMethod: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="cash">Cash Payment</option>
                        <option value="credit">Credit (Pay Later)</option>
                      </select>
                    </div>

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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Notes (Optional)
                    </label>
                    <textarea
                      value={deliveryData.notes}
                      onChange={(e) => setDeliveryData({...deliveryData, notes: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Any notes about the delivery..."
                    />
                  </div>
                </div>

                {/* Section 3: Delivery Calculations */}
                {deliveryData.finalWeight && deliveryData.commissionRate && deliveryData.goldPrice && (
                  <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
                    <SectionBadge id={3} label="Delivery Calculations" devMode={devMode} color="green" />
                    <div className="space-y-3 text-sm">
                      {(() => {
                        const finalWeight = parseFloat(deliveryData.finalWeight) || 0;
                        const karat = deliveryOrder?.karat || '18k';
                        const finalPureGold = calculatePureGold(finalWeight, karat);
                        const commissionRate = parseFloat(deliveryData.commissionRate) || 0;
                        const goldPrice = parseFloat(deliveryData.goldPrice) || 0;
                        const commissionAmount = finalWeight * commissionRate;
                        const goldValue = finalPureGold * goldPrice;
                        const totalAmount = commissionAmount + goldValue;

                        return (
                          <>
                            {/* Gold and Commission Breakdown */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-3 rounded border">
                                <h5 className="font-medium text-gray-900 mb-2">Commission Charges</h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Weight × Rate:</span>
                                    <span className="font-semibold">{finalWeight}g × ${commissionRate}/g</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Commission ($):</span>
                                    <span className="font-semibold text-blue-600">${commissionAmount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-lg">
                                    <span className="font-bold">Commission Gold:</span>
                                    <span className="font-bold text-yellow-600">{commissionGold.toFixed(3)}g pure</span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <h5 className="font-medium text-gray-900 mb-2">Product Gold</h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Final Weight:</span>
                                    <span className="font-semibold">{finalWeight}g {karat}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Pure Gold:</span>
                                    <span className="font-semibold text-yellow-600">{finalPureGold.toFixed(3)}g</span>
                                  </div>
                                  <div className="flex justify-between text-lg">
                                    <span className="font-bold">Product Gold:</span>
                                    <span className="font-bold text-yellow-600">{finalPureGold.toFixed(3)}g pure</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Total Pure Gold Owed */}
                            <div className="bg-green-100 p-3 rounded border border-green-300">
                              <div className="flex justify-between items-center text-lg">
                                <span className="font-bold text-gray-900">Total Pure Gold Owed:</span>
                                <span className="font-bold text-green-600">{totalPureGoldOwed.toFixed(3)}g</span>
                              </div>
                              <p className="text-xs text-green-700 mt-1">
                                Commission Gold: {commissionGold.toFixed(3)}g + Product Gold: {finalPureGold.toFixed(3)}g
                              </p>
                            </div>

                            {/* Accounting Impact */}
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                              <h5 className="font-medium text-blue-900 mb-2">Accounting Entries (All in Gold)</h5>
                              <div className="text-xs space-y-1">
                                <div className="font-semibold text-green-700">📦 Delivery Transaction (Always):</div>
                                <div>📊 Debit: Customer Receivables (+{totalPureGoldOwed.toFixed(3)}g gold)</div>
                                <div>💰 Credit: Sales Revenue (+{totalPureGoldOwed.toFixed(3)}g gold)</div>
                                <div>📦 Credit: Finished Goods Inventory (-{finalPureGold.toFixed(3)}g gold)</div>
                                <div>🏦 Debit: Gold in Hand (+{finalPureGold.toFixed(3)}g gold)</div>
                                {deliveryData.paymentMethod === 'cash' && (
                                  <>
                                    <div className="font-semibold text-blue-700 mt-2">💰 Cash Payment Transaction:</div>
                                    <div>🏦 Debit: Gold in Hand (+{totalPureGoldOwed.toFixed(3)}g), Credit: Customer Receivables (-{totalPureGoldOwed.toFixed(3)}g)</div>
                                  </>
                                )}
                                {deliveryData.paymentMethod === 'credit' && (
                                  <>
                                    <div className="font-semibold text-orange-700 mt-2">📅 Credit Payment:</div>
                                    <div>📊 Customer Receivables remains (+{totalPureGoldOwed.toFixed(3)}g) - payment expected later</div>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Section 4: Action Buttons */}
                <div className="flex gap-3">
                  <SectionBadge id={4} label="Actions" devMode={devMode} color="green" />
                  <button
                    onClick={() => {
                      setShowDeliveryDialog(false);
                      setDeliveryOrder(null);
                      setDeliveryData({
                        deliveryDate: new Date().toISOString().split('T')[0],
                        finalWeight: '',
                        commissionRate: '',
                        goldPrice: '',
                        paymentMethod: 'cash',
                        goldBankId: '',
                        notes: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={!deliveryData.finalWeight || !deliveryData.commissionRate || !deliveryData.goldPrice || !deliveryData.goldBankId}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Complete Delivery
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  This will update order status to &quot;Delivered&quot;, process customer payment, create accounting entries, and record gold deposit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Challan Confirmation Dialog */}
        {showChallanConfirmationDialog && challanConfirmationData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
                <h2 className="text-2xl font-bold text-gray-800">Confirm Gold Withdrawal Challan</h2>
                <p className="text-sm text-gray-500 mt-1">Review order details and confirm challan issuance</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Order Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-700">Order ID:</span>
                      <span className="font-semibold ml-2">{challanConfirmationData.order.id?.slice(-8)}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Serial No:</span>
                      <span className="font-semibold ml-2">{challanConfirmationData.order.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Product:</span>
                      <span className="font-semibold ml-2">{challanConfirmationData.order.productName}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Weight:</span>
                      <span className="font-semibold ml-2">{challanConfirmationData.order.totalWeight}g ({challanConfirmationData.order.karat})</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Customer:</span>
                      <span className="font-semibold ml-2">{challanConfirmationData.order.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-700">Pure Gold:</span>
                      <span className="font-semibold ml-2 text-blue-600">
                        {(() => {
                          const purityMap = { '24k': 1.0, '22k': 0.9167, '18k': 0.75, '14k': 0.5833 };
                          const pureGold = challanConfirmationData.order.totalWeight * (purityMap[challanConfirmationData.order.karat] || 0.75);
                          return `${pureGold.toFixed(3)}g`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manufacturer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={challanConfirmationData.selectedManufacturerId}
                    onChange={(e) => setChallanConfirmationData({
                      ...challanConfirmationData,
                      selectedManufacturerId: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <p className="text-xs text-gray-500 mt-1">Manufacturer who will receive the gold</p>
                </div>

                {/* Gold Bank Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gold Bank <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={challanConfirmationData.selectedGoldBankId}
                    onChange={(e) => setChallanConfirmationData({
                      ...challanConfirmationData,
                      selectedGoldBankId: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select Gold Bank</option>
                    {goldBanks
                      .filter(bank => bank.isActive !== false)
                      .map(goldBank => (
                        <option key={goldBank.id} value={goldBank.id}>
                          {goldBank.bankName} ({goldBank.location || 'N/A'})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Bank from which gold will be issued</p>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• This will issue a gold withdrawal challan</li>
                    <li>• Gold will be debited from the selected bank account</li>
                    <li>• Manufacturer will receive the gold for production</li>
                    <li>• Order status will change to &quot;In Production&quot;</li>
                  </ul>
                </div>
              </div>

              {/* Dialog Actions */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowChallanConfirmationDialog(false);
                    setChallanConfirmationData(null);
                  }}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIssueChallan}
                  disabled={!challanConfirmationData.selectedManufacturerId || !challanConfirmationData.selectedGoldBankId}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  Issue Challan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ TASK 7.1: Challan Success Dialog */}
        {showChallanDialog && challanOrderData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      ℹ️ Gold has been transferred from Sharaf bank to manufacturer&apos;s custody
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
                  <li>• Order status updated to &quot;Challan Issued&quot;</li>
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
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              {/* Header - Fixed */}
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

              {/* Scrollable Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Order Details Section */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-gray-900 mb-2">Initial Order</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Product:</span>
                          <span className="font-semibold">{additionalChallanData.order?.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weight:</span>
                          <span className="font-semibold">{additionalChallanData.order?.totalWeight}g {additionalChallanData.order?.karat}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pure Gold:</span>
                          <span className="font-semibold text-yellow-600">{additionalChallanData.order?.productPureGold?.toFixed(3)}g</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-gray-900 mb-2">Additional Challans</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Times Issued:</span>
                          <span className="font-semibold text-blue-600">{additionalChallanData.order?.additionalChallansCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Additional:</span>
                          <span className="font-semibold text-green-600">{additionalChallanData.order?.totalAdditionalGold?.toFixed(3) || '0.000'}g</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-medium text-gray-900 mb-2">Total Issued</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Initial + Additional:</span>
                          <span className="font-semibold text-purple-600">
                            {((additionalChallanData.order?.productPureGold || 0) + (additionalChallanData.order?.totalAdditionalGold || 0)).toFixed(3)}g
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gold in Transit:</span>
                          <span className="font-semibold text-orange-600">{additionalChallanData.order?.goldInTransit?.toFixed(3) || '0.000'}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Card */}
                <div className={`mb-6 ${additionalChallanData.challanType === 'additional_gold' ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'} p-4 rounded-lg border`}>
                  <h4 className={`font-semibold ${additionalChallanData.challanType === 'additional_gold' ? 'text-orange-900' : 'text-purple-900'} mb-2`}>
                    {additionalChallanData.challanType === 'additional_gold' 
                      ? 'Additional Gold Required'
                      : 'Excess Gold Being Returned'}
                  </h4>
                  <p className={`text-sm ${additionalChallanData.challanType === 'additional_gold' ? 'text-orange-800' : 'text-purple-800'}`}>
                    {additionalChallanData.challanType === 'additional_gold'
                      ? 'Issue a new challan when manufacturer needs additional gold for production. This will debit Gold in Transit (1102) and credit the selected gold bank account.'
                      : 'Record when manufacturer returns excess gold. This will debit the selected gold bank account and credit Gold in Transit (1102).'}
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

                  {/* Gold Bank Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gold Bank *
                    </label>
                    <select
                      value={additionalChallanData.selectedGoldBankId}
                      onChange={(e) => setAdditionalChallanData({ 
                        ...additionalChallanData, 
                        selectedGoldBankId: e.target.value 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Gold Bank</option>
                      {goldBanks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bankName} ({bank.location || 'N/A'}) - {bank.accountCode || `1101-BANK-${bank.id.slice(-3).toUpperCase()}`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the gold bank from which the gold will be issued or to which it will be returned
                    </p>
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
                    {(() => {
                      // Get gold bank info based on selected gold bank
                      let goldBankAccountCode = '1101';
                      let goldBankAccountName = 'Please select a gold bank';
                      
                      if (additionalChallanData.selectedGoldBankId) {
                        const selectedBank = goldBanks.find(bank => bank.id === additionalChallanData.selectedGoldBankId);
                        if (selectedBank) {
                          goldBankAccountCode = selectedBank.accountCode || `1101-BANK-${selectedBank.id.slice(-3).toUpperCase()}`;
                          goldBankAccountName = `${selectedBank.bankName} (${selectedBank.location || 'N/A'})`;
                        }
                      }
                      
                      return additionalChallanData.challanType === 'additional_gold' ? (
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-red-600">Debit: Gold in Transit (1102)</span>
                            <span className="font-medium">{additionalChallanData.goldAmount || '0.000'}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Credit: {goldBankAccountName} ({goldBankAccountCode})</span>
                            <span className="font-medium">{additionalChallanData.goldAmount || '0.000'}g</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-red-600">Debit: {goldBankAccountName} ({goldBankAccountCode})</span>
                            <span className="font-medium">{additionalChallanData.goldAmount || '0.000'}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Credit: Gold in Transit (1102)</span>
                            <span className="font-medium">{additionalChallanData.goldAmount || '0.000'}g</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                </div>

              {/* Fixed Footer with Buttons */}
              <div className="flex gap-3 justify-end p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <button
                  onClick={() => {
                    setShowAdditionalChallanDialog(false);
                    setAdditionalChallanData({
                      order: null,
                      challanType: 'additional_gold',
                      goldAmount: '',
                      selectedGoldBankId: '',
                      reason: '',
                      notes: ''
                    });
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={processAdditionalChallan}
                  className={`px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2 ${
                    additionalChallanData.challanType === 'additional_gold'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {additionalChallanData.challanType === 'additional_gold' ? (
                    <>
                      <Plus className="w-5 h-5" />
                      Issue Additional Challan
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 transform rotate-180" />
                      Record Gold Return
                    </>
                  )}
                </button>
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

        {/* Pickup Dialog */}
        {showPickupDialog && pickupOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-purple-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Product Pickup & Commission</h3>
                      <p className="text-purple-100 text-sm">Order #{pickupOrder.id?.slice(-8)}</p>
                    </div>
                  </div>
                  {/* Dev Mode Toggle */}
                  <button
                    onClick={toggleDevMode}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      devMode
                        ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400'
                        : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                    }`}
                    title={devMode ? 'Disable Dev Mode (Hide Section Badges)' : 'Enable Dev Mode (Show Section Badges)'}
                  >
                    {devMode ? 'DEV' : 'PROD'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Section 1: Order Details */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                  <SectionBadge id={1} label="Order Details" devMode={devMode} color="gray" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Customer</p>
                      <p className="font-semibold">{pickupOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Initial Order</p>
                      <p className="font-semibold">
                        {pickupOrder.totalWeight}g {pickupOrder.karat} {pickupOrder.productName}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        <div>Product Pure Gold: {pickupOrder.productPureGold?.toFixed(3) || 'N/A'}g</div>
                        <div>Commission Gold: {pickupOrder.commissionGold?.toFixed(3) || 'N/A'}g</div>
                        <div>Prior Balance: {pickupOrder.priorGoldBalance?.toFixed(3) || 'N/A'}g</div>
                        <div className="font-semibold text-purple-600">
                          Total Required: {pickupOrder.totalPureGoldOwed?.toFixed(3) || 'N/A'}g pure gold
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">Manufacturer</p>
                      <p className="font-semibold">{manufacturers.find(m => m.id === pickupOrder.manufacturerId)?.manufacturerName || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Status</p>
                      <p className="font-semibold">{pickupOrder.status}</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Final Product Form */}
                <div className="space-y-4 mb-6">
                  <SectionBadge id={2} label="Final Product Information" devMode={devMode} color="purple" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Final Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final Jewelry Weight (g) *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={pickupData.finalWeight}
                        onChange={(e) => setPickupData({...pickupData, finalWeight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 750.000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Actual weight of finished jewelry from manufacturer
                      </p>
                    </div>

                    {/* Commission Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commission Rate ($/gram) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={pickupData.commissionRate}
                        onChange={(e) => setPickupData({...pickupData, commissionRate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., 1.50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Amount charged per gram of finished product
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Manufacturer Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manufacturer *
                      </label>
                      <select
                        value={pickupData.manufacturerId}
                        onChange={(e) => setPickupData({...pickupData, manufacturerId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select Manufacturer</option>
                        {manufacturers.map(manufacturer => (
                          <option key={manufacturer.id} value={manufacturer.id}>
                            {manufacturer.manufacturerName || manufacturer.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={pickupData.paymentMethod}
                        onChange={(e) => setPickupData({...pickupData, paymentMethod: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="cash">Cash Payment</option>
                        <option value="credit">Credit (Pay Later)</option>
                      </select>
                    </div>
                  </div>

                  {/* Manufacturer Bill Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer Bill Number *
                    </label>
                    <input
                      type="text"
                      value={pickupData.manufacturerBillNumber}
                      onChange={(e) => setPickupData({...pickupData, manufacturerBillNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter bill/invoice number from manufacturer"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={pickupData.notes}
                      onChange={(e) => setPickupData({...pickupData, notes: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Any notes about the pickup..."
                    />
                  </div>
                </div>

                {/* Section 2: Gold History */}
                {pickupOrder?.goldHistory && (
                  <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
                    <SectionBadge id={2} label="Gold Provided History" devMode={devMode} color="yellow" />
                    <div className="space-y-3 text-sm">
                      {/* Gold Summary */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">Initial Gold</h5>
                          <div className="text-lg font-bold text-yellow-600">
                            {pickupOrder.goldHistory.initialGoldProvided.toFixed(3)}g
                          </div>
                          <p className="text-xs text-gray-500">Main challan</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">Additional Gold</h5>
                          <div className="text-lg font-bold text-orange-600">
                            {pickupOrder.goldHistory.additionalGoldProvided.toFixed(3)}g
                          </div>
                          <p className="text-xs text-gray-500">{pickupOrder.goldHistory.additionalChallans.length} challan(s)</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-1">Total Provided</h5>
                          <div className="text-lg font-bold text-blue-600">
                            {pickupOrder.goldHistory.totalGoldProvided.toFixed(3)}g
                          </div>
                          <p className="text-xs text-gray-500">Pure gold given</p>
                        </div>
                      </div>

                      {/* Additional Challans List */}
                      {pickupOrder.goldHistory.additionalChallans.length > 0 && (
                        <div className="bg-white p-3 rounded border">
                          <h5 className="font-medium text-gray-900 mb-2">Additional Challans</h5>
                          <div className="space-y-2">
                            {pickupOrder.goldHistory.additionalChallans.map((challan, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <div>
                                  <span className="font-medium">{challan.challanNumber}</span>
                                  <span className="text-gray-500 ml-2">
                                    {challan.issuedDate.toLocaleDateString()}
                                  </span>
                                </div>
                                <span className="font-semibold text-orange-600">
                                  +{challan.amount.toFixed(3)}g
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Final Gold Used vs Provided */}
                      {pickupOrder.goldHistory.finalPureGoldUsed > 0 && (
                        <div className={`p-3 rounded border ${
                          pickupOrder.goldHistory.goldDifference > 0 
                            ? 'bg-red-50 border-red-200' 
                            : pickupOrder.goldHistory.goldDifference < 0 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Final Gold Used:</span>
                            <span className={`font-bold text-lg ${
                              pickupOrder.goldHistory.goldDifference > 0 
                                ? 'text-red-600' 
                                : pickupOrder.goldHistory.goldDifference < 0 
                                  ? 'text-green-600' 
                                  : 'text-gray-600'
                            }`}>
                              {pickupOrder.goldHistory.finalPureGoldUsed.toFixed(3)}g pure gold
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm">Difference:</span>
                            <span className={`font-semibold ${
                              pickupOrder.goldHistory.goldDifference > 0 
                                ? 'text-red-600' 
                                : pickupOrder.goldHistory.goldDifference < 0 
                                  ? 'text-green-600' 
                                  : 'text-gray-600'
                            }`}>
                              {pickupOrder.goldHistory.goldDifference > 0 ? '+' : ''}{pickupOrder.goldHistory.goldDifference.toFixed(3)}g
                            </span>
                          </div>
                          <p className="text-xs mt-1">
                            {pickupOrder.goldHistory.goldDifference > 0 
                              ? 'Manufacturer used extra gold from their stock' 
                              : pickupOrder.goldHistory.goldDifference < 0 
                                ? 'Manufacturer returned excess gold' 
                                : 'Exact gold amount used'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 3: Final Product Calculations */}
                {pickupData.finalWeight && pickupData.commissionRate && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                    <SectionBadge id={4} label="Final Product Calculations" devMode={devMode} color="blue" />
                    <div className="space-y-3 text-sm">
                      {(() => {
                        const finalWeight = parseFloat(pickupData.finalWeight) || 0;
                        const karat = pickupOrder?.karat || '18k';
                        const finalPureGold = calculatePureGold(finalWeight, karat);
                        const totalGoldProvided = pickupOrder?.goldHistory?.totalGoldProvided || 0;
                        const goldDifference = totalGoldProvided - finalPureGold;
                        const commissionRate = parseFloat(pickupData.commissionRate) || 0;
                        const commissionAmount = finalWeight * commissionRate;
                        
                        // Get initial order weight and pure gold
                        const initialWeight = pickupOrder?.weight || pickupOrder?.totalWeight || 0;
                        const initialPureGold = calculatePureGold(initialWeight, karat);

                        return (
                          <>
                            {/* Gold Provided vs Initial Order vs Final Product */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-white p-3 rounded border">
                                <h5 className="font-medium text-gray-900 mb-2">Gold Provided</h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Pure Gold:</span>
                                    <span className="font-semibold text-yellow-600">{totalGoldProvided.toFixed(3)}g</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Expected Weight:</span>
                                    <span className="font-semibold text-blue-600">
                                      {(() => {
                                        // Calculate expected weight: pure gold / purity ratio
                                        const purity = karat === '24k' ? 1 : karat === '22k' ? 22/24 : karat === '18k' ? 18/24 : 18/24;
                                        return (totalGoldProvided / purity).toFixed(3);
                                      })()}g
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <h5 className="font-medium text-gray-900 mb-2">Initial Order</h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Weight:</span>
                                    <span className="font-semibold">{initialWeight > 0 ? `${initialWeight}g` : 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Pure Gold:</span>
                                    <span className="font-semibold text-yellow-600">{initialPureGold > 0 ? `${initialPureGold.toFixed(3)}g` : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <h5 className="font-medium text-gray-900 mb-2">Final Product</h5>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Actual Weight:</span>
                                    <span className="font-semibold">{finalWeight > 0 ? `${finalWeight}g` : 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Pure Gold Used:</span>
                                    <span className="font-semibold text-yellow-600">{finalWeight > 0 ? `${finalPureGold.toFixed(3)}g` : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Gold Difference with Formula */}
                            <div className={`p-3 rounded border ${
                              goldDifference > 0 
                                ? 'bg-green-50 border-green-200' 
                                : goldDifference < 0 
                                  ? 'bg-red-50 border-red-200' 
                                  : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Gold Difference:</span>
                                <span className={`font-bold text-lg ${
                                  goldDifference > 0 
                                    ? 'text-green-600' 
                                    : goldDifference < 0 
                                      ? 'text-red-600' 
                                      : 'text-gray-600'
                                }`}>
                                  {goldDifference > 0 ? '+' : ''}{goldDifference.toFixed(3)}g pure gold
                                </span>
                              </div>
                              <div className="text-xs mt-1 space-y-1">
                                <div className="font-mono bg-white px-2 py-1 rounded text-center">
                                  {totalGoldProvided.toFixed(3)}g (provided) - {finalPureGold.toFixed(3)}g (used) = {goldDifference > 0 ? '+' : ''}{goldDifference.toFixed(3)}g
                                </div>
                                <p className="text-center">
                                  {goldDifference > 0 
                                    ? 'Manufacturer used less gold - excess will be returned' 
                                    : goldDifference < 0 
                                      ? 'Manufacturer used extra gold from their stock - will create payment challan' 
                                      : 'Exact gold amount used'}
                                </p>
                              </div>
                            </div>

                            {/* Commission Calculation */}
                            <div className="bg-green-50 p-3 rounded border border-green-200">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Commission Amount:</span>
                                <span className="font-bold text-green-600 text-lg">
                                  ${commissionAmount.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-xs text-green-700 mt-1">
                                {finalWeight}g × ${commissionRate}/g = ${commissionAmount.toFixed(2)}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Section 4: Additional Actions */}
                {pickupData.finalWeight && pickupOrder?.goldHistory && (() => {
                  const finalWeight = parseFloat(pickupData.finalWeight);
                  const finalPureGold = calculatePureGold(finalWeight, pickupOrder.karat);
                  const goldDifference = pickupOrder.goldHistory.totalGoldProvided - finalPureGold;

                  return goldDifference !== 0 ? (
                    <div className="bg-orange-50 p-4 rounded-lg mb-6 border border-orange-200">
                      <SectionBadge id={5} label="Additional Actions Required" devMode={devMode} color="orange" />
                      
                      {goldDifference < 0 && (
                        <>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="generateRemainingGoldPayment"
                              checked={pickupData.generateRemainingGoldPayment}
                              onChange={(e) => setPickupData({...pickupData, generateRemainingGoldPayment: e.target.checked})}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="generateRemainingGoldPayment" className="text-sm font-medium text-blue-900">
                              Generate payment challan for {Math.abs(goldDifference).toFixed(3)}g extra gold used from manufacturer&apos;s stock
                            </label>
                          </div>

                          {pickupData.generateRemainingGoldPayment && (
                            <div className="ml-7 mt-2">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Gold Bank for Payment *
                              </label>
                              <select
                                value={pickupData.remainingGoldPaymentBankId}
                                onChange={(e) => setPickupData({...pickupData, remainingGoldPaymentBankId: e.target.value})}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select Gold Bank</option>
                                {goldBanks.map((bank) => (
                                  <option key={bank.id} value={bank.id}>
                                    {bank.bankName} ({bank.location || 'N/A'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}

                      {goldDifference > 0 && (
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="processGoldReturn"
                            checked={pickupData.processGoldReturn}
                            onChange={(e) => setPickupData({...pickupData, processGoldReturn: e.target.checked})}
                            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <label htmlFor="processGoldReturn" className="text-sm font-medium text-orange-900">
                            Process return of {goldDifference.toFixed(3)}g excess gold from manufacturer
                          </label>
                        </div>
                      )}

                      <p className="text-xs text-orange-700 mt-2">
                        {goldDifference > 0 
                          ? 'Manufacturer used less gold than provided - check to process return of excess gold' 
                          : 'Manufacturer used extra gold from their stock - check to create payment challan'}
                      </p>
                    </div>
                  ) : null;
                })()}

                {/* Section 5: Action Buttons */}
                <div className="flex gap-3">
                  <SectionBadge id={6} label="Actions" devMode={devMode} color="green" />
                  <button
                    onClick={() => {
                      setShowPickupDialog(false);
                      setPickupOrder(null);
                      setPickupData({
                        manufacturerId: '',
                        finalWeight: '',
                        commissionRate: '',
                        manufacturerBillNumber: '',
                        paymentMethod: 'cash',
                        createAdditionalChallan: false,
                        processGoldReturn: false,
                        generateRemainingGoldPayment: false, // Reset new field
                        remainingGoldPaymentBankId: '', // Reset new field
                        notes: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPickup}
                    disabled={!pickupData.manufacturerId || !pickupData.commissionRate || !pickupData.manufacturerBillNumber}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Confirm Pickup & Pay Commission
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  This will update order status to &quot;Picked Up&quot;, process manufacturer payment, create accounting entries, and reduce gold transit.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
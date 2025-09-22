'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { LogOut, ChevronDown, ChevronUp, Package, ShoppingBag, Users, Home, Tag, Truck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminHeader from '../Componenets/AdminHeader';
import { onSnapshot, query, collection, orderBy, doc, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/firebase';
import AdminLayout from '../AdminLayout';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Status color mapping
const statusColors = {
  Pending: 'bg-orange-100 text-orange-800',
  Confirmed: 'bg-yellow-100 text-yellow-800',
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
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'Refunded/Returned': 'bg-red-200 text-red-800',
  'On Hold': 'bg-gray-100 text-gray-800',
};

const DELIVERY_PERSONS = ['Ramesh', 'Suresh', 'Priya'];
const PICKUP_PERSONS = ['Amit', 'Sunita', 'Vijay'];
const ESTIMATED_DATES = ['Today', 'Tomorrow', 'In 2 Days', 'In 3 Days'];
const PICKUP_TIMES = [
  { value: 'morning', label: 'Morning (9-12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12-5 PM)' },
  { value: 'evening', label: 'Evening (5-8 PM)' },
];
const DELIVERY_PREFS = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express (+KWD 5)' },
];
const SERVICE_TYPES = [
  { value: 'delivery', label: 'Delivery', icon: '🚚' },
  { value: 'pickup', label: 'Pickup', icon: '🏪' },
];

export default function AdminOrders() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('');
  const [orderTakenByFilter, setOrderTakenByFilter] = useState('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [assignedDeliveryPerson, setAssignedDeliveryPerson] = useState({});
  const [assignedPickupPerson, setAssignedPickupPerson] = useState({});
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState({});
  const [estimatedPickupDate, setEstimatedPickupDate] = useState({});
  const [laundryStatus, setLaundryStatus] = useState({});

  // Add current user state
  const [currentUser, setCurrentUser] = useState({
    userId: '',
    userName: '',
    userRole: '',
    branchId: ''
  });

  // Add branches state to store branch data
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const ordersPath = `${tenantCompaniesPath}/${companyId}/orders`;
  const branchesPath = `${tenantCompaniesPath}/${companyId}/branches`;
  const usersPath = `${tenantCompaniesPath}/${companyId}/users`;
  const getSingleOrderPath = (orderId) => `${tenantCompaniesPath}/${companyId}/orders/${orderId}`;

  // Helper function to get branch name by ID
  const getBranchName = (branchId) => {
    if (!branchId) return 'N/A';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : `Branch ID: ${branchId}`;
  };

  // Helper function to get pickup time label
  const getPickupTimeLabel = (value) => {
    const time = PICKUP_TIMES.find(t => t.value === value);
    return time ? time.label : value || 'N/A';
  };

  // Helper function to get delivery preference label
  const getDeliveryPrefLabel = (value) => {
    const pref = DELIVERY_PREFS.find(p => p.value === value);
    return pref ? pref.label : value || 'N/A';
  };

  // Helper function to get service type info
  const getServiceTypeInfo = (value) => {
    const service = SERVICE_TYPES.find(s => s.value === value);
    return service ? service : { label: value || 'N/A', icon: '❓' };
  };

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
    } else {
      // Get current user info
      const userId = localStorage.getItem('userId') || '';
      const userName = localStorage.getItem('userName') || '';
      const userRole = localStorage.getItem('userRole') || '';
      const branchId = localStorage.getItem('userBranchId') || '';
      
      setCurrentUser({ userId, userName, userRole, branchId });

      // Fetch branches
      const branchesQuery = query(collection(db, branchesPath));
      const unsubscribeBranches = onSnapshot(branchesQuery, (snapshot) => {
        const fetchedBranches = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setBranches(fetchedBranches);
      });

      // Fetch users for order taken by filter
      const usersQuery = query(collection(db, usersPath));
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const fetchedUsers = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setUsers(fetchedUsers);
      });

      // Build query based on user role
      let ordersQuery;
      
      if (userRole === 'company_admin' || userRole === 'general_manager') {
        ordersQuery = collection(db, ordersPath);
      } else if (userRole === 'branch_manager') {
        ordersQuery = query(
          collection(db, ordersPath), 
          where('branchId', '==', branchId)
        );
      } else if (userRole === 'cashier') {
        ordersQuery = query(
          collection(db, ordersPath), 
          where('orderTakenBy', '==', userId)
        );
      } else {
        ordersQuery = collection(db, ordersPath);
      }

      const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const orderDate = data.timestamp?.toDate();
          const items = data.items || [];

          const calculatedTotal = items.reduce((sum, item) =>
            sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

          const total = data.finalTotal || data.total || calculatedTotal;

          return {
            id: docSnap.id,
            customer: data.name || "No Name",
            email: data.email || "N/A",
            phone: data.phone || "N/A",
            address: `${data.address || ''}, ${data.city || ''}, ${data.state || ''} - ${data.zip || ''}`,
            items: items,
            amount: Number(total) || 0,
            
            // Pricing breakdown
            subtotal: data.subtotal || 0,
            expressDeliveryFee: data.expressDeliveryFee || 0,
            orderTotal: data.orderTotal || 0,
            discountAmount: data.discountAmount || 0,
            finalTotal: data.finalTotal || total,
            
            // Coupon information
            appliedCoupon: data.appliedCoupon || null,
            
            // Service preferences
            serviceType: data.serviceType || 'delivery',
            pickupTime: data.pickupTime || '',
            deliveryPref: data.deliveryPref || '',
            
            paymentMethod: data.paymentMethod || "N/A",
            paymentStatus: data.paymentStatus || "unpaid",
            billNumber: data.billNumber || '',
            status: data.status || "Pending",
            date: orderDate?.toLocaleDateString() || 'Invalid/Missing Date',
            rawTimestamp: data.timestamp,
            userId: data.userId || "N/A",
            
            // Order tracking fields
            orderTakenBy: data.orderTakenBy || '',
            orderTakenByName: data.orderTakenByName || '',
            orderTakenByRole: data.orderTakenByRole || '',
            orderTakenAt: data.orderTakenAt || null,
            
            // Pickup tracking
            pickedUpBy: data.pickedUpBy || '',
            pickedUpByName: data.pickedUpByName || '',
            pickedUpAt: data.pickedUpAt || null,
            
            // Delivery tracking
            deliveredBy: data.deliveredBy || '',
            deliveredByName: data.deliveredByName || '',
            deliveredAt: data.deliveredAt || null,
            
            // Last update tracking
            lastUpdatedBy: data.lastUpdatedBy || '',
            lastUpdatedByName: data.lastUpdatedByName || '',
            lastUpdatedAt: data.lastUpdatedAt || null,
            
            branchId: data.branchId || '',
            branchName: data.branchName || '',
            orderSource: data.orderSource || '',
            
            deliveryDetails: {
              name: data.name,
              phone: data.phone,
              address: data.address,
              city: data.city,
              state: data.state,
              pincode: data.zip,
              email: data.email
            },
            laundryStatus: data.laundryStatus || {
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
            },
          };
        });

        // Sort by timestamp after fetching
        const sortedOrders = fetchedOrders.sort((a, b) => {
          const aTime = a.rawTimestamp?.toDate() || new Date(0);
          const bTime = b.rawTimestamp?.toDate() || new Date(0);
          return bTime - aTime;
        });

        setOrders(sortedOrders);
        setLaundryStatus(
          sortedOrders.reduce((acc, order) => {
            acc[order.id] = order.laundryStatus || {};
            return acc;
          }, {})
        );
        setIsLoading(false);
      }, (err) => {
        console.error('Error fetching orders from Firestore:', err);
        setIsLoading(false);
      });

      return () => {
        unsubscribeBranches();
        unsubscribeUsers();
        unsubscribeOrders();
      };
    }
  }, [router]);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, getSingleOrderPath(orderId));
      const updateData = { 
        status: newStatus,
        lastUpdatedBy: currentUser.userId,
        lastUpdatedByName: currentUser.userName,
        lastUpdatedAt: serverTimestamp()
      };

      if (newStatus.includes('Pickup') || newStatus === 'Picked Up') {
        updateData.pickedUpBy = currentUser.userId;
        updateData.pickedUpByName = currentUser.userName;
        updateData.pickedUpAt = serverTimestamp();
      }

      if (newStatus.includes('Delivery') || newStatus === 'Delivered') {
        updateData.deliveredBy = currentUser.userId;
        updateData.deliveredByName = currentUser.userName;
        updateData.deliveredAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);
      
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { 
          ...o, 
          status: newStatus,
          lastUpdatedBy: currentUser.userId,
          lastUpdatedByName: currentUser.userName,
          ...(newStatus.includes('Pickup') && { 
            pickedUpBy: currentUser.userId, 
            pickedUpByName: currentUser.userName 
          }),
          ...(newStatus.includes('Delivery') && { 
            deliveredBy: currentUser.userId, 
            deliveredByName: currentUser.userName 
          })
        } : o
      ));

      console.log('Status updated successfully:', { orderId, newStatus, updatedBy: currentUser.userName });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleLaundryStatusChange = async (orderId, statusKey, value) => {
    setLaundryStatus(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], [statusKey]: value }
    }));

    try {
      const orderRef = doc(db, getSingleOrderPath(orderId));
      await updateDoc(orderRef, {
        [`laundryStatus.${statusKey}`]: value
      });
    } catch (err) {
      console.error('Failed to update laundry status:', err);
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Role-based filtering
    if (currentUser?.userRole === 'branch_manager') {
      filtered = filtered.filter(order => order.branchId === currentUser.branchId);
    } else if (currentUser?.userRole === 'cashier') {
      filtered = filtered.filter(order => order.orderTakenBy === currentUser.userId);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply branch filter (only for admin/GM)
    if (branchFilter && (currentUser?.userRole === 'company_admin' || currentUser?.userRole === 'general_manager')) {
      filtered = filtered.filter(order => order.branchId === branchFilter);
    }

    // Add the missing Order Taken By filter
    if (orderTakenByFilter) {
      filtered = filtered.filter(order => order.orderTakenBy === orderTakenByFilter);
    }

    // Apply date filter
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter(order => new Date(order.rawTimestamp?.seconds * 1000) >= sevenDaysAgo);
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(order => new Date(order.rawTimestamp?.seconds * 1000) >= thirtyDaysAgo);
    }

    return filtered;
  }, [orders, searchQuery, statusFilter, branchFilter, orderTakenByFilter, dateFilter, currentUser]);

  const handleConfirmBill = async () => {
    const order = showPreviewDialog;
    const newBillNumber = 'BILL-' + Date.now();
    try {
      const orderRef = doc(db, getSingleOrderPath(order.id));
      await updateDoc(orderRef, { billNumber: newBillNumber });
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, billNumber: newBillNumber } : o));
      setShowPreviewDialog(null);
      setSuccessOrder({ ...order, billNumber: newBillNumber });
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Error generating bill:', err);
    }
  };

  const generatePDF = (order) => {
    const customer = order.deliveryDetails || {};
    const total = order.amount.toFixed(2);
    const date = new Date().toLocaleDateString();
    const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const finalBillNumber = order.billNumber;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text('EASY2 Solutions', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.text('INVOICE', 105, 35, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Bill Number: ${finalBillNumber}`, 20, 50);
    doc.text(`Issued on: ${date}`, 20, 60);
    doc.text(`Estimated Delivery: ${deliveryDate}`, 20, 70);

    doc.setFont("helvetica", "bold");
    doc.text('Customer Details:', 20, 90);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${customer.name || 'N/A'}`, 20, 100);
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 20, 110);
    doc.text(`Email: ${customer.email || 'N/A'}`, 20, 120);
    doc.text(`Address: ${customer.address || 'N/A'}, ${customer.city || 'N/A'}, ${customer.pincode || 'N/A'}`, 20, 130);

    doc.setFont("helvetica", "bold");
    doc.text('Order Items:', 20, 150);

    let yPosition = 160;
    doc.setFont("helvetica", "normal");

    doc.setFillColor(230, 230, 230);
    doc.rect(20, yPosition, 170, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.text('Item', 25, yPosition + 5);
    doc.text('Qty', 100, yPosition + 5);
    doc.text('Price (KWD)', 140, yPosition + 5);
    yPosition += 10;

    doc.setFont("helvetica", "normal");
    order.items.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const itemText = item.name;
      const qtyText = item.quantity.toString();
      const priceText = `KWD ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`;

      const splitName = doc.splitTextToSize(itemText, 70);
      doc.text(splitName, 25, yPosition);
      doc.text(qtyText, 100, yPosition);
      doc.text(priceText, 140, yPosition);

      yPosition += 8;
    });

    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Total: KWD ${total}`, 140, yPosition);

    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Status: ${order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}`, 20, yPosition);

    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, 290, { align: 'center' });

    return doc;
  };

  const handleDownloadPDF = () => {
    const pdf = generatePDF(successOrder);
    pdf.save(`invoice_${successOrder.billNumber}.pdf`);
  };

  const handlePrintPDF = () => {
    const pdf = generatePDF(successOrder);
    pdf.autoPrint();
    window.open(pdf.output('bloburl'), '_blank');
  };

  const handleShareWhatsApp = () => {
    const order = successOrder;
    let phone = order.phone;
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    const date = new Date().toLocaleDateString();
    const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const billText = `
Invoice
Bill Number: ${order.billNumber}
Issued on: ${date}
Order ID: ${order.id}
Customer: ${order.customer}
Phone: ${order.phone}
Email: ${order.email}
Address: ${order.address}

Items:
${order.items.map(item => `${item.name} x ${item.quantity} - KWD ${(Number(item.price) * item.quantity).toFixed(2)}`).join('\n')}

Total: KWD ${order.amount.toFixed(2)}
Payment Status: ${order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
Estimated Delivery: ${deliveryDate}
Thank you for your business!
`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(billText)}`, '_blank');
  };

  function groupItemsByCategory(items) {
    const groups = {};
    items.forEach(item => {
      const catName = item.categoryName || 'Other';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    });
    return groups;
  }

  const exportOrdersToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Simple PDF export
      doc.setFontSize(20);
      doc.text('Orders Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);
      doc.text(`Total Orders: ${filteredOrders.length}`, 20, 50);

      // Table
      if (filteredOrders.length > 0) {
        const tableData = filteredOrders.slice(0, 50).map(order => [
          order.id?.slice(-8) || 'N/A',
          order.customer || 'N/A',
          order.phone || 'N/A',
          `KWD ${(order.amount || 0).toFixed(2)}`,
          order.status || 'N/A',
          order.date || 'N/A'
        ]);

        doc.autoTable({
          startY: 60,
          head: [['Order ID', 'Customer', 'Phone', 'Amount', 'Status', 'Date']],
          body: tableData,
        });
      }

      doc.save(`orders-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Error exporting PDF');
    }
  };

  const exportOrdersToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const data = [
        ['Order ID', 'Customer', 'Phone', 'Email', 'Amount', 'Status', 'Date'],
        ...filteredOrders.map(order => [
          order.id || 'N/A',
          order.customer || 'N/A',
          order.phone || 'N/A',
          order.email || 'N/A',
          (order.amount || 0).toFixed(2),
          order.status || 'N/A',
          order.date || 'N/A'
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      XLSX.writeFile(wb, `orders-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel Export Error:', error);
      alert('Error exporting Excel');
    }
  };

  if (!isClient) return null;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Updated Header with Export Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
              Orders Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track all customer orders
            </p>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportOrdersToPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              📄 Export PDF
            </button>
            <button
              onClick={exportOrdersToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              📊 Export Excel
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                <p className="text-xl font-bold text-blue-800">{filteredOrders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                <p className="text-xl font-bold text-green-800">
                  KWD {filteredOrders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)}
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Avg Order Value</p>
                <p className="text-xl font-bold text-purple-800">
                  KWD {filteredOrders.length > 0 ? (filteredOrders.reduce((sum, order) => sum + order.amount, 0) / filteredOrders.length).toFixed(2) : 0}
                </p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pending Orders</p>
                <p className="text-xl font-bold text-orange-800">
                  {filteredOrders.filter(order => order.status === 'Pending').length}
                </p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Order ID, Customer or Phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 rounded bg-gray-50 border border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 text-sm"
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">All Status</option>
              {Object.keys(statusColors).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            
            <select
              value={orderTakenByFilter}
              onChange={(e) => setOrderTakenByFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">All Order Takers</option>
              {users
                .filter(user => user.userType === 'staff') // Only show staff users
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role || 'No Role'})
                  </option>
                ))}
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
            
            <div className="text-sm text-gray-600 px-3 py-2 bg-blue-50 rounded border">
              Total: {filteredOrders.length} orders
            </div>

            {/* Clear Filters button moved to same row */}
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setBranchFilter('');
                setOrderTakenByFilter('');
                setDateFilter('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-blue-50 text-blue-800 text-xs sm:text-sm">
  <tr>
    <th className="px-2 py-2 text-left border-b border-gray-200 w-8">#</th>
    <th className="px-2 py-2 text-left border-b border-gray-200">Order ID</th>
    <th className="px-2 py-2 text-left border-b border-gray-200 hidden sm:table-cell">Customer</th>
    <th className="px-2 py-2 text-left border-b border-gray-200 hidden md:table-cell">Order Taken By</th>
    <th className="px-2 py-2 text-left border-b border-gray-200 hidden md:table-cell">Phone</th>
    <th className="px-2 py-2 text-left border-b border-gray-200 hidden lg:table-cell">Branch</th>
    <th className="px-2 py-2 text-left border-b border-gray-200 hidden lg:table-cell">Service</th>
    <th className="px-2 py-2 text-left border-b border-gray-200 hidden lg:table-cell">Discount</th>
    <th className="px-2 py-2 text-left border-b border-gray-200">Amount</th>
    <th className="px-2 py-2 text-left border-b border-gray-200">Status</th>
    <th className="px-2 py-2 text-left border-b border-gray-200 hidden md:table-cell">Order Date</th>
    <th className="px-2 py-2 text-left border-b border-gray-200">Expand</th>
  </tr>
</thead>
<tbody>
  {isLoading ? (
    <tr><td colSpan={12} className="text-center text-gray-500 p-6">Loading...</td></tr>
  ) : filteredOrders.length === 0 ? (
    <tr><td colSpan={12} className="text-center text-gray-500 p-6">No orders found</td></tr>
  ) : (
    filteredOrders.map((order, index) => (
      <>
        <tr key={order.id} className="border-b hover:bg-blue-50 text-xs sm:text-sm">
          <td className="px-2 py-2">{index + 1}</td>
          <td className="px-2 py-2 font-mono text-xs">{order.id.slice(-8)}</td>
          <td className="px-2 py-2 hidden sm:table-cell">{order.customer}</td>
          <td className="px-2 py-2 hidden md:table-cell">
            <span className="block truncate max-w-[90px]" title={order.orderTakenByName || 'N/A'}>
              {order.orderTakenByName || 'N/A'}
            </span>
            <span className="block text-gray-400 text-[10px]">{order.orderTakenByRole || ''}</span>
          </td>
          <td className="px-2 py-2 hidden md:table-cell">{order.phone}</td>
          <td className="px-2 py-2 hidden lg:table-cell">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {getBranchName(order.branchId)}
            </span>
          </td>
          <td className="px-2 py-2 hidden lg:table-cell">
            <div className="flex items-center gap-1">
              <span className="text-xs">{getServiceTypeInfo(order.serviceType).icon}</span>
              <span className="text-xs">{getServiceTypeInfo(order.serviceType).label}</span>
            </div>
          </td>
          <td className="px-2 py-2 hidden lg:table-cell">
            {order.appliedCoupon ? (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  KWD {order.discountAmount.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No discount</span>
            )}
          </td>
          <td className="px-2 py-2">
            <div className="text-sm font-medium">KWD {order.amount.toFixed(2)}</div>
            {order.discountAmount > 0 && (
              <div className="text-xs text-gray-500 line-through">
                KWD {(order.amount + order.discountAmount).toFixed(2)}
              </div>
            )}
          </td>
          <td className="px-2 py-2">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value)}
              className={`border-none text-xs sm:text-sm rounded px-2 py-1 focus:ring-1 focus:ring-blue-200 ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}
            >
              {Object.keys(statusColors).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </td>
          <td className="px-2 py-2 hidden md:table-cell">{order.date}</td>
          <td className="px-2 py-2">
            <button onClick={() => toggleOrderExpand(order.id)} className="text-blue-600 hover:text-blue-800">
              {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </td>
        </tr>
        {expandedOrder === order.id && (
          <tr>
            <td colSpan={12} className="p-0">
              <div className="bg-blue-50 p-4 w-full">
                <div className="flex flex-col gap-6">
                  {/* Order Information Section */}
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                    <h4 className="font-semibold mb-2 text-blue-700">Order Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="font-medium">Order ID:</span> {order.id}
                      </div>
                      <div>
                        <span className="font-medium">Bill Number:</span> {order.billNumber || 'Not Generated'}
                      </div>
                      <div>
                        <span className="font-medium">Order Taken By:</span> {order.orderTakenByName || 'N/A'} ({order.orderTakenByRole || 'N/A'})
                      </div>
                      <div>
                        <span className="font-medium">Order Source:</span> {order.orderSource || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Branch:</span> 
                        <span className="inline-block ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {getBranchName(order.branchId)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Payment Status:</span> {order.paymentStatus}
                      </div>
                      <div>
                        <span className="font-medium">Last Updated By:</span> {order.lastUpdatedByName || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Current Status:</span> 
                        <span className={`inline-block ml-2 px-2 py-1 text-xs rounded ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </div>
                      {order.pickedUpByName && (
                        <div>
                          <span className="font-medium">Picked Up By:</span> {order.pickedUpByName}
                        </div>
                      )}
                      {order.deliveredByName && (
                        <div>
                          <span className="font-medium">Delivered By:</span> {order.deliveredByName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service Details Section */}
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                    <h4 className="font-semibold mb-3 text-blue-700 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Service Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getServiceTypeInfo(order.serviceType).icon}</span>
                        <div>
                          <span className="font-medium text-gray-600">Service Type:</span>
                          <div className="text-blue-700 font-medium">{getServiceTypeInfo(order.serviceType).label}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <div>
                          <span className="font-medium text-gray-600">Pickup Time:</span>
                          <div className="text-blue-700">{getPickupTimeLabel(order.pickupTime)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-600" />
                        <div>
                          <span className="font-medium text-gray-600">Delivery Preference:</span>
                          <div className="text-blue-700">{getDeliveryPrefLabel(order.deliveryPref)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items section */}
                  <div className="w-full">
                    {Object.entries(groupItemsByCategory(order.items)).map(([catName, items]) => {
                      const catImage = items[0]?.categoriesimage || items[0]?.categoryImage || null;
                      return (
                        <div key={catName} className="mb-4 border rounded-lg border-blue-200 bg-blue-50 w-full">
                          <div className="flex items-center gap-3 px-4 py-2 border-b border-blue-200">
                            {catImage ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white border border-blue-200">
                                <img src={catImage} alt={catName} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200" />
                            )}
                            <span className="font-semibold text-blue-700">{catName}</span>
                          </div>
                          <div className="p-4 space-y-2">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-4 w-full">
                                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200" />
                                  )}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <h5 className="font-medium text-blue-600">{item.name}</h5>
                                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                  <p className="text-sm text-gray-600">
                                    Price: KWD {Number(item.price).toFixed(2)}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="font-medium text-blue-600">
                                    KWD {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pricing Breakdown Section */}
                  <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
                    <h4 className="font-semibold mb-3 text-blue-700">Pricing Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>KWD {(order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      {order.expressDeliveryFee > 0 && (
                        <div className="flex justify-between">
                          <span>Express Delivery Fee:</span>
                          <span>KWD {order.expressDeliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      {order.appliedCoupon && (
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-800">Applied Coupon:</span>
                            </div>
                            <span className="text-green-600 font-medium">{order.appliedCoupon.code}</span>
                          </div>
                          <div className="text-xs text-green-700 mb-1">
                            {order.appliedCoupon.name} ({order.appliedCoupon.type})
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700">Discount Amount:</span>
                            <span className="text-green-600 font-medium">-KWD {order.discountAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                        <span>Final Total:</span>
                        <span className="text-blue-700">KWD {order.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    ))
  )}
</tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

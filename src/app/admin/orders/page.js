'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, ChevronDown, ChevronUp, Package, ShoppingBag, Users, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminHeader from '../Componenets/AdminHeader';
import { onSnapshot, query, collection, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import AdminLayout from '../AdminLayout';
import jsPDF from 'jspdf';

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

export default function AdminOrders() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showPreviewDialog, setShowPreviewDialog] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [assignedDeliveryPerson, setAssignedDeliveryPerson] = useState({});
  const [assignedPickupPerson, setAssignedPickupPerson] = useState({});
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState({});
  const [estimatedPickupDate, setEstimatedPickupDate] = useState({});
  const [laundryStatus, setLaundryStatus] = useState({});

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const ordersPath = `${tenantCompaniesPath}/${companyId}/orders`;
  const getSingleOrderPath = (orderId) => `${tenantCompaniesPath}/${companyId}/orders/${orderId}`;

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
    } else {
      const q = query(collection(db, ordersPath), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const orderDate = data.timestamp?.toDate();
          const items = data.items || [];

          const calculatedTotal = items.reduce((sum, item) =>
            sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

          const total = data.total || calculatedTotal;

          return {
            id: docSnap.id,
            customer: data.name || "No Name",
            email: data.email || "N/A",
            phone: data.phone || "N/A",
            address: `${data.address || ''}, ${data.city || ''}, ${data.state || ''} - ${data.zip || ''}`,
            items: items,
            amount: Number(total) || 0,
            paymentMethod: data.paymentMethod || "N/A",
            paymentStatus: data.paymentStatus || "unpaid",
            billNumber: data.billNumber || '',
            status: data.status || "Pending",
            date: orderDate?.toLocaleDateString() || 'Invalid/Missing Date',
            rawTimestamp: data.timestamp,
            userId: data.userId || "N/A",
            pickupTime: data.pickupTime || '',
            deliveryPref: data.deliveryPref || '',
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
        setOrders(fetchedOrders);
        setLaundryStatus(
          fetchedOrders.reduce((acc, order) => {
            acc[order.id] = order.laundryStatus || {};
            return acc;
          }, {})
        );
        setIsLoading(false);
      }, (err) => {
        console.error('Error fetching orders from Firestore:', err);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/admin/login');
  };

  const handleNavigation = (path) => {
    router.push(`/admin/${path}`);
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, getSingleOrderPath(orderId));
      await updateDoc(orderRef, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone?.includes(searchQuery);

    const matchesStatus = statusFilter ? order.status === statusFilter : true;

    const now = new Date();
    const orderDate = order.rawTimestamp?.toDate() || new Date(0);
    let matchesDate = true;
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      matchesDate = orderDate >= sevenDaysAgo;
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      matchesDate = orderDate >= thirtyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

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

  if (!isClient) return null;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent mb-6">Orders Management</h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Order ID, Customer or Phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 rounded bg-gray-50 border border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 text-sm"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Scheduled for Pickup">Scheduled for Pickup</option>
              <option value="Out for Pickup">Out for Pickup</option>
              <option value="Picked Up">Picked Up</option>
              <option value="Received at Facility">Received at Facility</option>
              <option value="In Sorting/Inspection">In Sorting/Inspection</option>
              <option value="In Washing">In Washing</option>
              <option value="In Drying">In Drying</option>
              <option value="In Ironing/Pressing">In Ironing/Pressing</option>
              <option value="In Folding/Packaging">In Folding/Packaging</option>
              <option value="Quality Check">Quality Check</option>
              <option value="Ready for Delivery">Ready for Delivery</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded/Returned">Refunded/Returned</option>
              <option value="On Hold">On Hold</option>
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-blue-50 text-blue-800 text-xs sm:text-sm">
              <tr>
                <th className="p-3 text-left border-b border-gray-200">Sr No</th>
                <th className="p-3 text-left border-b border-gray-200">Order ID</th>
                <th className="p-3 text-left border-b border-gray-200 hidden sm:table-cell">Customer</th>
                <th className="p-3 text-left border-b border-gray-200 hidden md:table-cell">Phone</th>
                <th className="p-3 text-left border-b border-gray-200 hidden lg:table-cell">Address</th>
                <th className="p-3 text-left border-b border-gray-200 hidden lg:table-cell">Payment</th>
                <th className="p-3 text-left border-b border-gray-200">Amount</th>
                <th className="p-3 text-left border-b border-gray-200">Status</th>
                <th className="p-3 text-left border-b border-gray-200 hidden md:table-cell">Order Date</th>
                <th className="p-3 text-left border-b border-gray-200">Expand</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center text-gray-500 p-6">Loading...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-gray-500 p-6">No orders found</td></tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <>
                    <tr key={order.id} className="border-b hover:bg-blue-50 text-xs sm:text-sm">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{order.id}</td>
                      <td className="p-3 hidden sm:table-cell">{order.customer}</td>
                      <td className="p-3 hidden md:table-cell">{order.phone}</td>
                      <td className="p-3 hidden lg:table-cell">{order.address}</td>
                      <td className="p-3 hidden lg:table-cell">{order.paymentMethod}</td>
                      <td className="p-3">KWD {order.amount.toFixed(2)}</td>
                      <td className="p-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`border-none text-xs sm:text-sm rounded px-2 py-1 focus:ring-1 focus:ring-blue-200 ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          <option value="Pending" className="bg-orange-100 text-orange-800">Pending</option>
                          <option value="Confirmed" className="bg-yellow-100 text-yellow-800">Confirmed</option>
                          <option value="Scheduled for Pickup" className="bg-blue-100 text-blue-800">Scheduled for Pickup</option>
                          <option value="Out for Pickup" className="bg-blue-200 text-blue-900">Out for Pickup</option>
                          <option value="Picked Up" className="bg-blue-300 text-blue-900">Picked Up</option>
                          <option value="Received at Facility" className="bg-purple-100 text-purple-800">Received at Facility</option>
                          <option value="In Sorting/Inspection" className="bg-purple-200 text-purple-800">In Sorting/Inspection</option>
                          <option value="In Washing" className="bg-teal-100 text-teal-800">In Washing</option>
                          <option value="In Drying" className="bg-teal-200 text-teal-800">In Drying</option>
                          <option value="In Ironing/Pressing" className="bg-teal-300 text-teal-800">In Ironing/Pressing</option>
                          <option value="In Folding/Packaging" className="bg-teal-400 text-teal-800">In Folding/Packaging</option>
                          <option value="Quality Check" className="bg-indigo-100 text-indigo-800">Quality Check</option>
                          <option value="Ready for Delivery" className="bg-indigo-200 text-indigo-800">Ready for Delivery</option>
                          <option value="Out for Delivery" className="bg-indigo-300 text-indigo-800">Out for Delivery</option>
                          <option value="Delivered" className="bg-green-100 text-green-800">Delivered</option>
                          <option value="Cancelled" className="bg-red-100 text-red-800">Cancelled</option>
                          <option value="Refunded/Returned" className="bg-red-200 text-red-800">Refunded/Returned</option>
                          <option value="On Hold" className="bg-gray-100 text-gray-800">On Hold</option>
                        </select>
                      </td>
                      <td className="p-3 hidden md:table-cell">{order.date}</td>
                      <td className="p-3">
                        <button onClick={() => toggleOrderExpand(order.id)} className="text-blue-600 hover:text-blue-800">
                          {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan={10} className="bg-blue-50 p-4">
                          <div className="flex flex-col gap-6">
                            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                              <div className="bg-white rounded-lg shadow p-4 border border-gray-100 flex-1 min-w-0 w-full">
                                <h4 className="font-semibold mb-2 text-blue-700">Delivery Details</h4>
                                <div className="text-sm text-gray-700 mb-2">
                                  <div><span className="font-medium">Customer Name:</span> {order.customer}</div>
                                  <div><span className="font-medium">Phone:</span> {order.phone}</div>
                                  <div><span className="font-medium">Email:</span> {order.email}</div>
                                  <div><span className="font-medium">Address:</span> {order.address}</div>
                                  <div><span className="font-medium">City:</span> {order.city}</div>
                                  <div><span className="font-medium">Zip:</span> {order.zip}</div>
                                  <div><span className="font-medium">Pickup Time:</span>{" "}
                                    {PICKUP_TIMES.find(opt => opt.value === order.pickupTime)?.label || 'N/A'}</div>
                                  <div><span className="font-medium">Delivery Preference:</span>{" "}
                                    {DELIVERY_PREFS.find(opt => opt.value === order.deliveryPref)?.label || 'N/A'}</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-blue-700">Assign Delivery Person</label>
                                  <select
                                    className="border rounded px-2 py-1"
                                    value={assignedDeliveryPerson[order.id] || ''}
                                    onChange={e => setAssignedDeliveryPerson(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  >
                                    <option value="">Select</option>
                                    {DELIVERY_PERSONS.map(name => (
                                      <option key={name} value={name}>{name}</option>
                                    ))}
                                  </select>
                                  <label className="text-xs font-medium text-blue-700 mt-2">Estimated Delivery Date</label>
                                  <select
                                    className="border rounded px-2 py-1"
                                    value={estimatedDeliveryDate[order.id] || ''}
                                    onChange={e => setEstimatedDeliveryDate(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  >
                                    <option value="">Select</option>
                                    {ESTIMATED_DATES.map(date => (
                                      <option key={date} value={date}>{date}</option>
                                    ))}
                                  </select>
                                  <label className="text-xs font-medium text-blue-700 mt-2">Delivery Preference</label>
                                  <select
                                    className="border rounded px-2 py-1"
                                    value={order.deliveryPref || ''}
                                    onChange={async e => {
                                      const newPref = e.target.value;
                                      // Update only deliveryPref in Firestore
                                      try {
                                        const orderRef = doc(db, getSingleOrderPath(order.id));
                                        await updateDoc(orderRef, { deliveryPref: newPref });
                                        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, deliveryPref: newPref } : o));
                                      } catch (err) {
                                        console.error("Failed to update delivery preference", err);
                                      }
                                    }}
                                  >
                                    <option value="standard">Standard</option>
                                    <option value="express">Express (+KWD 5)</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-2 mt-4">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={laundryStatus[order.id]?.deliveryManDone || false}
                                      onChange={e =>
                                        handleLaundryStatusChange(order.id, 'deliveryManDone', e.target.checked)
                                      }
                                    />
                                    <span className="text-sm">Delivery Done by Delivery Man</span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={laundryStatus[order.id]?.customerDeliveryConfirmed || false}
                                      onChange={e =>
                                        handleLaundryStatusChange(order.id, 'customerDeliveryConfirmed', e.target.checked)
                                      }
                                    />
                                    <span className="text-sm">Delivery & Items Back Confirmed by Customer</span>
                                  </label>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg shadow p-4 border border-gray-100 flex-1 min-w-0 w-full">
                                <h4 className="font-semibold mb-2 text-blue-700">Pickup Details</h4>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-medium text-blue-700">Assign Pickup Person</label>
                                  <select
                                    className="border rounded px-2 py-1"
                                    value={assignedPickupPerson[order.id] || ''}
                                    onChange={e => setAssignedPickupPerson(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  >
                                    <option value="">Select</option>
                                    {PICKUP_PERSONS.map(name => (
                                      <option key={name} value={name}>{name}</option>
                                    ))}
                                  </select>
                                  <label className="text-xs font-medium text-blue-700 mt-2">Estimated Pickup Date</label>
                                  <select
                                    className="border rounded px-2 py-1"
                                    value={estimatedPickupDate[order.id] || ''}
                                    onChange={e => setEstimatedPickupDate(prev => ({ ...prev, [order.id]: e.target.value }))}
                                  >
                                    <option value="">Select</option>
                                    {ESTIMATED_DATES.map(date => (
                                      <option key={date} value={date}>{date}</option>
                                    ))}
                                  </select>
                                  <label className="text-xs font-medium text-blue-700 mt-2">Pickup Time</label>
                                  <div className="border rounded px-2 py-1 bg-gray-50 mb-2">
                                    {PICKUP_TIMES.find(opt => opt.value === order.pickupTime)?.label || 'N/A'}
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.pickupManVerified || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'pickupManVerified', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Items Verified by Pickup Man</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.customerPickupVerified || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'customerPickupVerified', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Pickup Verified by Customer</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.receivedAtFacility || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'receivedAtFacility', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Received at Facility</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.sortingDone || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'sortingDone', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Sorting/Inspection Done</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.washingDone || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'washingDone', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Washing Done</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.dryingDone || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'dryingDone', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Drying Done</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.ironingDone || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'ironingDone', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Ironing/Pressing Done</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.foldingDone || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'foldingDone', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Folding/Packaging Done</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={laundryStatus[order.id]?.qualityCheckDone || false}
                                        onChange={e =>
                                          handleLaundryStatusChange(order.id, 'qualityCheckDone', e.target.checked)
                                        }
                                      />
                                      <span className="text-sm">Quality Check Done</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              {Object.entries(groupItemsByCategory(order.items)).map(([catName, items]) => {
                                const catImage = items[0]?.categoriesimage || items[0]?.categoryImage || null;
                                return (
                                  <div key={catName} className="mb-4 border rounded-lg border-blue-200 bg-blue-50">
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
                                        <div key={idx} className="flex items-start gap-4">
                                          <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                            {item.image ? (
                                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-gray-200" />
                                            )}
                                          </div>
                                          <div className="flex-grow">
                                            <h5 className="font-medium text-blue-600">{item.name}</h5>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                            <p className="text-sm text-gray-600">
                                              Price: KWD {Number(item.price).toFixed(2)}
                                            </p>
                                          </div>
                                          <div className="text-right">
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
                            <div className="mt-4 flex justify-end">
                              <div className="text-xl font-bold text-blue-700">
                                Total: KWD {order.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="mt-4">
                              {!order.billNumber && (
                                <button 
                                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                                  onClick={() => setShowPreviewDialog(order)}
                                >
                                  Generate Bill
                                </button>
                              )}
                              {order.billNumber && (
                                <p className="text-sm text-gray-700">Bill Number: {order.billNumber}</p>
                              )}
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

      {showPreviewDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Confirm Bill Generation</h3>
            <p className="text-sm mb-2">Order ID: {showPreviewDialog.id}</p>
            <p className="text-sm mb-2">Customer: {showPreviewDialog.customer}</p>
            <p className="text-sm mb-2">Phone: {showPreviewDialog.phone}</p>
            <p className="text-sm mb-2">Total: KWD {showPreviewDialog.amount.toFixed(2)}</p>
            <p className="font-medium mt-4 mb-2 text-sm">Items:</p>
            {showPreviewDialog.items.map((item, idx) => (
              <div key={idx} className="text-sm mb-1 text-gray-700">
                {item.name} x {item.quantity} - KWD {(Number(item.price) * item.quantity).toFixed(2)}
              </div>
            ))}
            <div className="mt-6 flex justify-end gap-3">
              <button 
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                onClick={() => setShowPreviewDialog(null)}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                onClick={handleConfirmBill}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bill Generated Successfully</h3>
              <p className="text-sm text-gray-500 mb-4">Bill Number: {successOrder.billNumber}</p>
              <p className="text-sm text-gray-500 mb-6">Order ID: {successOrder.id}</p>
              <div className="flex flex-col gap-3">
                <button 
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium"
                  onClick={handleDownloadPDF}
                >
                  Download PDF
                </button>
                <button 
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium"
                  onClick={handlePrintPDF}
                >
                  Print PDF
                </button>
                {successOrder.phone && (
                  <button 
                    className="bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 text-sm font-medium"
                    onClick={handleShareWhatsApp}
                  >
                    Share on WhatsApp
                  </button>
                )}
                <button 
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-sm font-medium"
                  onClick={() => setShowSuccessDialog(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
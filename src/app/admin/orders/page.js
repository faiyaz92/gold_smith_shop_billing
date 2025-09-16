"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, ChevronDown, ChevronUp, Package, ShoppingBag, Users, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminHeader from '../Componenets/AdminHeader';
import { onSnapshot, query, collection, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';

// Status color mapping
const statusColors = {
  Pending: 'bg-orange-100 text-orange-800',
  Processing: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrders() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

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

          // Calculate total if not provided
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
            status: data.status || "Pending",
            date: orderDate?.toLocaleDateString() || 'Invalid/Missing Date',
            rawTimestamp: data.timestamp,
            userId: data.userId || "N/A",
            deliveryDetails: {
              name: data.name,
              phone: data.phone,
              address: data.address,
              city: data.city,
              state: data.state,
              pincode: data.zip,
              email: data.email
            }
          };
        });
        setOrders(fetchedOrders);
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

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Common Admin Header for navigation only */}
      <AdminHeader />

      {/* Orders Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent mb-6">Orders Management</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Order ID, Customer or Phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 rounded bg-gray-50 border border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
          />

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
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

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50 text-sm text-blue-800">
                <th className="p-3 border-b border-blue-100">Sr No</th>
                <th className="p-3 border-b border-blue-100">Order ID</th>
                <th className="p-3 border-b border-blue-100">Customer</th>
                <th className="p-3 border-b border-blue-100">Phone</th>
                <th className="p-3 border-b border-blue-100">Address</th>
                <th className="p-3 border-b border-blue-100">Payment</th>
                <th className="p-3 border-b border-blue-100">Amount</th>
                <th className="p-3 border-b border-blue-100">Status</th>
                <th className="p-3 border-b border-blue-100">Order Date</th>
                <th className="p-3 border-b border-blue-100">Expand</th>
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
                    <tr key={order.id} className="hover:bg-blue-50">
                      <td className="p-3 border-b border-blue-100">{index + 1}</td>
                      <td className="p-3 border-b border-blue-100">{order.id}</td>
                      <td className="p-3 border-b border-blue-100">{order.customer}</td>
                      <td className="p-3 border-b border-blue-100">{order.phone}</td>
                      <td className="p-3 border-b border-blue-100">{order.address}</td>
                      <td className="p-3 border-b border-blue-100">{order.paymentMethod}</td>
                      <td className="p-3 border-b border-blue-100">₹{order.amount.toFixed(2)}</td>
                      <td className="p-3 border-b border-blue-100">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`border-none text-sm rounded px-2 py-1 focus:ring-1 focus:ring-blue-200 ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          <option value="Pending" className="bg-orange-100 text-orange-800">Pending</option>
                          <option value="Processing" className="bg-blue-100 text-blue-800">Processing</option>
                          <option value="Shipped" className="bg-purple-100 text-purple-800">Shipped</option>
                          <option value="Completed" className="bg-green-100 text-green-800">Completed</option>
                          <option value="Cancelled" className="bg-red-100 text-red-800">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-3 border-b border-blue-100">{order.date}</td>
                      <td className="p-3 border-b border-blue-100">
                        <button onClick={() => toggleOrderExpand(order.id)} className="text-blue-600 hover:text-blue-800">
                          {expandedOrder === order.id ? <ChevronUp /> : <ChevronDown />}
                        </button>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan={10} className="bg-blue-50 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="font-semibold text-blue-600 mb-2">Order Items:</p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm text-gray-700 mb-1">
                                  <span>{item.name} x{item.quantity}</span>
                                  <span>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="mt-3 text-right text-blue-600 font-semibold">
                                Total: ₹{order.amount.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-blue-600 mb-2">Delivery Details:</p>
                              <div className="text-sm text-gray-700 space-y-1">
                                <p><span className="font-medium">Name:</span> {order.deliveryDetails.name || 'N/A'}</p>
                                <p><span className="font-medium">Phone:</span> {order.deliveryDetails.phone || 'N/A'}</p>
                                <p><span className="font-medium">Email:</span> {order.deliveryDetails.email || 'N/A'}</p>
                                <p><span className="font-medium">Address:</span> {order.deliveryDetails.address || 'N/A'}</p>
                                <p><span className="font-medium">City:</span> {order.deliveryDetails.city || 'N/A'}</p>
                                <p><span className="font-medium">State:</span> {order.deliveryDetails.state || 'N/A'}</p>
                                <p><span className="font-medium">Pincode:</span> {order.deliveryDetails.pincode || 'N/A'}</p>
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
    </div>
  );
}